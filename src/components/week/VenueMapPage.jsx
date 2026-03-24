import React, { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Car, Bath, Landmark, UtensilsCrossed,
  MapPin, ZoomIn, ZoomOut, RotateCcw, Info, DoorOpen,
  HeartPulse, Layers
} from 'lucide-react';
import { useKiosk } from '../kiosk/KioskContext';
import BeaconHeader from '../kiosk/BeaconHeader';
import QRHandoff from '../kiosk/QRHandoff';

// ─── Type meta ────────────────────────────────────────────────
const TYPE_META = {
  halls:      { icon: Building2,       color: '#2F6F5E', label: 'Hallen'      },
  parking:    { icon: Car,             color: '#60A5FA', label: 'Parkplatz'   },
  sanitary:   { icon: Bath,            color: '#4ADE80', label: 'Toiletten'   },
  admin:      { icon: Landmark,        color: '#FBBF24', label: 'Verwaltung'  },
  gastronomy: { icon: UtensilsCrossed, color: '#FB923C', label: 'Gastronomie' },
  entrance:   { icon: DoorOpen,        color: '#A78BFA', label: 'Eingang'     },
  firstaid:   { icon: HeartPulse,      color: '#F87171', label: 'Erste Hilfe' },
  info:       { icon: Info,            color: '#38BDF8', label: 'Info'        },
  other:      { icon: MapPin,          color: '#94A3B8', label: 'Sonstiges'   },
};

const ZOOM_MIN = 1;
const ZOOM_MAX = 5;
const SMOOTH   = { type: 'spring', stiffness: 280, damping: 30 };

function getKioskId() {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('kiosk');
}

// ─── object-contain Bildbereich berechnen ─────────────────────
// Gibt zurück wo das Bild im Container tatsächlich gerendert wird
// (wegen object-contain hat es ggf. Letterboxing)
function getImageRect(cW, cH, imgNatW, imgNatH) {
  if (!imgNatW || !imgNatH) return { left: 0, top: 0, width: cW, height: cH };
  const containerRatio = cW / cH;
  const imageRatio     = imgNatW / imgNatH;
  let imgW, imgH;
  if (imageRatio > containerRatio) {
    // Bild breiter → volle Breite, Letterboxing oben/unten
    imgW = cW;
    imgH = cW / imageRatio;
  } else {
    // Bild höher → volle Höhe, Letterboxing links/rechts
    imgH = cH;
    imgW = cH * imageRatio;
  }
  return {
    left:   (cW - imgW) / 2,
    top:    (cH - imgH) / 2,
    width:  imgW,
    height: imgH,
  };
}

// ─── Koordinaten-Umrechnung ───────────────────────────────────
// pctX/pctY = Position relativ zum Bild (0–100%)
// Gibt Pixel-Position im Container zurück (nach Transform)
function toScreenPos(pctX, pctY, cW, cH, scale, ox, oy, imgRect) {
  // Position im unscaled Bild, relativ zum Container
  const imgX = imgRect.left + (pctX / 100) * imgRect.width;
  const imgY = imgRect.top  + (pctY / 100) * imgRect.height;
  // Nach Transformation (origin = center des Containers)
  const screenX = cW / 2 + (imgX - cW / 2) * scale + ox;
  const screenY = cH / 2 + (imgY - cH / 2) * scale + oy;
  return { x: screenX, y: screenY };
}

export default function VenueMapPage() {
  const { t, config } = useKiosk();

  const mapPoints  = config?.map_points || [];
  const mapZones   = config?.map_zones  || [];
  const stelen     = config?.stelen     || {};
  const kioskId    = getKioskId();
  const youAreHere = kioskId ? (stelen[kioskId]?.you_are_here ?? null) : null;

  // Transform state
  const [scale,  setScale]  = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [animating, setAnimating] = useState(false);

  // Container-Größe
  const containerRef = useRef(null);
  const [cSize, setCSize] = useState({ w: 0, h: 0 });

  // Natürliche Bildgröße (für object-contain Berechnung)
  const imgRef    = useRef(null);
  const [imgNat, setImgNat] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setCSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // UI state
  const [activeFilters, setActiveFilters] = useState(new Set(Object.keys(TYPE_META)));
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [activeZoneId,  setActiveZoneId]  = useState(null);

  // Touch refs
  const lastTouchRef     = useRef(null);
  const lastPinchDistRef = useRef(null);
  const isDraggingRef    = useRef(false);
  const doubleTapRef     = useRef({ lastTime: 0, lastX: 0, lastY: 0 });

  // ── Helpers ──────────────────────────────────────────────────
  const clampOffset = useCallback((ox, oy, sc) => {
    const max = Math.max(0, (sc - 1) * 350);
    return { x: Math.max(-max, Math.min(max, ox)), y: Math.max(-max, Math.min(max, oy)) };
  }, []);

  const animateTo = useCallback((newScale, ox, oy) => {
    setAnimating(true);
    const c = clampOffset(ox, oy, newScale);
    setScale(newScale);
    setOffset(c);
    setTimeout(() => setAnimating(false), 450);
  }, [clampOffset]);

  const resetView = useCallback(() => {
    setActiveZoneId(null);
    setSelectedPoint(null);
    animateTo(1, 0, 0);
  }, [animateTo]);

  // ── imgRect berechnen ─────────────────────────────────────────
  const imgRect = getImageRect(cSize.w, cSize.h, imgNat.w, imgNat.h);

  // ── Zoom to zone ─────────────────────────────────────────────
  const zoomToZone = useCallback((zone) => {
    if (activeZoneId === zone.id) { resetView(); return; }
    const { w, h } = cSize;
    if (!w || !h) return;
    setActiveZoneId(zone.id);
    setSelectedPoint(null);
    const rect = getImageRect(w, h, imgNat.w, imgNat.h);
    const ns  = zone.zoom;
    // Punkt auf dem Bild → Position im Container
    const imgX = rect.left + (zone.x / 100) * rect.width;
    const imgY = rect.top  + (zone.y / 100) * rect.height;
    const ox = (w / 2 - imgX) * (ns - 1);
    const oy = (h / 2 - imgY) * (ns - 1);
    animateTo(ns, ox, oy);
  }, [activeZoneId, cSize, imgNat, animateTo, resetView]);

  // ── Double-tap ────────────────────────────────────────────────
  const handleDoubleTap = useCallback((clientX, clientY) => {
    const el = containerRef.current;
    if (!el) return;
    const { left, top, width, height } = el.getBoundingClientRect();
    if (scale >= 2.5) { resetView(); return; }
    const ns = 2.5;
    const tapX = clientX - left;
    const tapY = clientY - top;
    const ox = (width  / 2 - tapX) * (ns - 1);
    const oy = (height / 2 - tapY) * (ns - 1);
    setActiveZoneId(null);
    animateTo(ns, ox, oy);
  }, [scale, resetView, animateTo]);

  // ── Touch handlers ───────────────────────────────────────────
  const pDist = (t1, t2) => Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 1) {
      const t0 = e.touches[0];
      lastTouchRef.current  = { x: t0.clientX, y: t0.clientY };
      isDraggingRef.current = false;
      // Double-tap detection
      const now = Date.now();
      const dt  = now - doubleTapRef.current.lastTime;
      const dx  = Math.abs(t0.clientX - doubleTapRef.current.lastX);
      const dy  = Math.abs(t0.clientY - doubleTapRef.current.lastY);
      if (dt < 300 && dx < 40 && dy < 40) {
        handleDoubleTap(t0.clientX, t0.clientY);
        doubleTapRef.current.lastTime = 0;
      } else {
        doubleTapRef.current = { lastTime: now, lastX: t0.clientX, lastY: t0.clientY };
      }
    } else if (e.touches.length === 2) {
      lastPinchDistRef.current = pDist(e.touches[0], e.touches[1]);
      setActiveZoneId(null);
    }
  }, [handleDoubleTap]);

  const handleTouchMove = useCallback((e) => {
    e.preventDefault(); // verhindert Seiten-Scroll während Karten-Drag
    e.stopPropagation();
    if (e.touches.length === 2 && lastPinchDistRef.current !== null) {
      const nd    = pDist(e.touches[0], e.touches[1]);
      const ratio = nd / lastPinchDistRef.current;
      setScale(prev => {
        const next = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, prev * ratio));
        setOffset(o => clampOffset(o.x, o.y, next));
        return next;
      });
      lastPinchDistRef.current = nd;
    } else if (e.touches.length === 1 && lastTouchRef.current) {
      const dx = e.touches[0].clientX - lastTouchRef.current.x;
      const dy = e.touches[0].clientY - lastTouchRef.current.y;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) isDraggingRef.current = true;
      setOffset(prev => clampOffset(prev.x + dx, prev.y + dy, scale));
      lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, [scale, clampOffset]);

  const handleTouchEnd = useCallback(() => {
    lastTouchRef.current     = null;
    lastPinchDistRef.current = null;
  }, []);

  // passive:false nötig damit preventDefault() in touchmove funktioniert
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => el.removeEventListener('touchmove', handleTouchMove);
  }, [handleTouchMove]);

  // ── Zoom buttons ─────────────────────────────────────────────
  const zoomIn  = () => animateTo(Math.min(scale + 0.5, ZOOM_MAX), offset.x, offset.y);
  const zoomOut = () => {
    const next = Math.max(scale - 0.5, ZOOM_MIN);
    if (next <= 1) { resetView(); return; }
    const c = clampOffset(offset.x, offset.y, next);
    animateTo(next, c.x, c.y);
  };

  const toggleFilter = (key) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const activeTypes    = [...new Set(mapPoints.map(p => p.type))].filter(k => TYPE_META[k]);
  const filteredPoints = mapPoints.filter(p => activeFilters.has(p.type));
  const isTransformed  = scale !== 1 || offset.x !== 0 || offset.y !== 0;
  const { w: cW, h: cH } = cSize;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <BeaconHeader subtitle={t('venueMap')} />

      {/* ── Filter bar ── */}
      {activeTypes.length > 0 && (
        <div className="px-6 pb-3 flex gap-2 flex-wrap">
          {activeTypes.map(key => {
            const meta = TYPE_META[key];
            const Icon = meta.icon;
            const on   = activeFilters.has(key);
            return (
              <motion.button key={key} whileTap={{ scale: 0.92 }} onClick={() => toggleFilter(key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-interface font-medium text-sm touch-manipulation transition-all
                  ${on ? 'kiosk-surface border border-white/[0.12] text-foreground' : 'text-muted-foreground/40'}`}>
                <Icon className="w-4 h-4" style={{ color: on ? meta.color : undefined }} />
                <span>{meta.label}</span>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* ── Map container ── */}
      <div
        ref={containerRef}
        className="flex-1 mx-6 mb-3 relative rounded-3xl kiosk-surface border border-white/[0.06] overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'none' }}
      >
        {/* Nur das Bild wird transformiert */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{ x: offset.x, y: offset.y, scale }}
          transition={animating ? SMOOTH : { duration: 0 }}
          style={{ transformOrigin: 'center center', willChange: 'transform' }}
        >
          <img
            ref={imgRef}
            src="/assets/venue-map.png"
            alt="Geländeplan AGRA Messepark"
            className="absolute inset-0 w-full h-full object-contain"
            draggable={false}
            onLoad={(e) => {
              setImgNat({ w: e.target.naturalWidth, h: e.target.naturalHeight });
            }}
          />
        </motion.div>

        {/* Marker-Ebene – außerhalb Transform, immer gleich groß */}
        {cW > 0 && cH > 0 && imgNat.w > 0 && (
          <div className="absolute inset-0 pointer-events-none">

            {/* Kartenpunkte */}
            {filteredPoints.map(point => {
              const meta       = TYPE_META[point.type] || TYPE_META.other;
              const Icon       = meta.icon;
              const pos        = toScreenPos(point.x, point.y, cW, cH, scale, offset.x, offset.y, imgRect);
              const isSelected = selectedPoint?.id === point.id;
              if (pos.x < -50 || pos.x > cW + 50 || pos.y < -50 || pos.y > cH + 50) return null;
              return (
                <motion.button
                  key={point.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute pointer-events-auto touch-manipulation flex flex-col items-center"
                  style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -100%)' }}
                  onClick={() => !isDraggingRef.current && setSelectedPoint(isSelected ? null : point)}
                >
                  <motion.div
                    animate={{ scale: isSelected ? 1.15 : 1 }}
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{
                      backgroundColor: meta.color + '33',
                      border:    `2px solid ${meta.color}`,
                      boxShadow: isSelected ? `0 0 0 3px ${meta.color}55` : '0 2px 8px rgba(0,0,0,0.5)',
                    }}
                  >
                    <Icon className="w-4 h-4" style={{ color: meta.color }} />
                  </motion.div>
                  <span
                    className="mt-1 font-interface text-[11px] font-semibold px-2 py-0.5 rounded-md whitespace-nowrap"
                    style={{ background: 'rgba(8,9,11,0.85)', color: meta.color }}
                  >
                    {point.label}
                  </span>
                </motion.button>
              );
            })}

            {/* Du bist hier – kein Zone-Marker auf der Karte */}
            {youAreHere && (() => {
              const pos = toScreenPos(youAreHere.x, youAreHere.y, cW, cH, scale, offset.x, offset.y, imgRect);
              return (
                <div className="absolute pointer-events-none flex flex-col items-center"
                  style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -50%)' }}>
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-primary/40 animate-beacon-pulse absolute -inset-1" />
                    <MapPin className="w-10 h-10 text-primary relative z-10 drop-shadow-lg" fill="currentColor" />
                  </div>
                  <span className="mt-1 font-interface text-xs font-bold text-primary bg-background/90 px-3 py-1 rounded-lg whitespace-nowrap shadow-lg">
                    {t('youAreHere')}
                  </span>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── Zoom-Zone Buttons unten – KEIN Marker auf Karte ── */}
        {mapZones.length > 0 && (
          <div className="absolute bottom-4 left-4 right-16 flex gap-2 flex-wrap z-20">
            <motion.button whileTap={{ scale: 0.94 }} onClick={resetView}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-interface text-sm font-semibold touch-manipulation backdrop-blur-xl transition-all
                ${!activeZoneId
                  ? 'bg-primary/20 border border-primary/50 text-primary'
                  : 'kiosk-surface border border-white/[0.1] text-muted-foreground'}`}>
              <Layers className="w-4 h-4" />
              {t('fullVenue') || 'Gesamtes Gelände'}
            </motion.button>
            {mapZones.map(zone => (
              <motion.button key={zone.id} whileTap={{ scale: 0.94 }} onClick={() => zoomToZone(zone)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-interface text-sm font-semibold touch-manipulation backdrop-blur-xl transition-all kiosk-surface border border-white/[0.1] text-muted-foreground"
                style={activeZoneId === zone.id ? {
                  background: 'rgba(250,204,21,0.15)', borderColor: 'rgba(250,204,21,0.5)', color: '#FDE047'
                } : {}}>
                <ZoomIn className="w-4 h-4" />
                {zone.label}
              </motion.button>
            ))}
          </div>
        )}

        {/* ── Zoom Controls ── */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
          <motion.button whileTap={{ scale: 0.9 }} onClick={zoomIn}
            className="w-12 h-12 rounded-xl kiosk-surface border border-white/[0.1] flex items-center justify-center text-foreground touch-manipulation backdrop-blur-xl">
            <ZoomIn className="w-5 h-5" />
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={zoomOut}
            className="w-12 h-12 rounded-xl kiosk-surface border border-white/[0.1] flex items-center justify-center text-foreground touch-manipulation backdrop-blur-xl">
            <ZoomOut className="w-5 h-5" />
          </motion.button>
          <AnimatePresence>
            {isTransformed && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                whileTap={{ scale: 0.9 }} onClick={resetView}
                className="w-12 h-12 rounded-xl kiosk-surface border border-primary/40 flex items-center justify-center text-primary touch-manipulation backdrop-blur-xl">
                <RotateCcw className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* ── Scale-Anzeige ── */}
        <AnimatePresence>
          {scale !== 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute top-4 left-4 z-20 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-1.5">
              <span className="font-interface text-sm font-medium">{Math.round(scale * 100)}%</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Hint ── */}
        <FadeHint />

        {/* ── Ausgewählter Punkt Detail ── */}
        <AnimatePresence>
          {selectedPoint && (() => {
            const meta = TYPE_META[selectedPoint.type] || TYPE_META.other;
            const Icon = meta.icon;
            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-20 left-4 right-4 kiosk-surface backdrop-blur-xl rounded-2xl p-5 border border-white/[0.1] z-20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: meta.color + '22', border: `1.5px solid ${meta.color}` }}>
                    <Icon className="w-5 h-5" style={{ color: meta.color }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display font-bold text-xl text-foreground leading-tight">{selectedPoint.label}</h3>
                    <p className="text-muted-foreground font-interface text-sm mt-0.5">{meta.label}</p>
                  </div>
                  <button onClick={() => setSelectedPoint(null)}
                    className="text-muted-foreground/50 hover:text-foreground transition-colors p-1 touch-manipulation text-lg">✕</button>
                </div>
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>

      {/* ── QR Handoff ── */}
      <div className="px-6 pb-28 flex justify-center">
        <QRHandoff label={t('downloadMap')} url="https://agra-leipzig.de/map" />
      </div>
    </div>
  );
}

function FadeHint() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setVisible(false), 3500);
    return () => clearTimeout(id);
  }, []);
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          transition={{ delay: 0.6 }}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
        >
          <div className="bg-background/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/[0.08]">
            <p className="font-interface text-xs text-muted-foreground whitespace-nowrap">
              Doppeltipp zum Reinzoomen · Ziehen zum Verschieben
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
