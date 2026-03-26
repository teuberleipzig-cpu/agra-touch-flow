import React, { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Car, Bath, Landmark, UtensilsCrossed,
  MapPin, ZoomIn, ZoomOut, RotateCcw, Layers,
  Info, DoorOpen, HeartPulse
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

export default function VenueMapPage() {
  const { t, config } = useKiosk();

  const mapPoints  = config?.map_points  || [];
  const mapZones   = config?.map_zones   || [];
  const stelen     = config?.stelen      || {};
  const mapImageUrl = config?.map_image_url || '/assets/venue-map.png';
  const kioskId    = getKioskId();
  const youAreHere = kioskId ? (stelen[kioskId]?.you_are_here ?? null) : null;

  // Transform state
  const [scale,    setScale]    = useState(1);
  const [offset,   setOffset]   = useState({ x: 0, y: 0 });
  const [animating, setAnimating] = useState(false);

  // Natürliche Bildgröße – für korrekten SVG viewBox
  const [imgNat, setImgNat] = useState({ w: 0, h: 0 });

  // UI state
  const [activeFilters,  setActiveFilters]  = useState(new Set(Object.keys(TYPE_META)));
  const [selectedPoint,  setSelectedPoint]  = useState(null);
  const [activeZoneId,   setActiveZoneId]   = useState(null);

  // Refs
  const containerRef     = useRef(null);
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

  // ── Zoom to zone ─────────────────────────────────────────────
  // SVG viewBox ist 0–100, also sind zone.x/y direkt % des Bildes.
  // Wir müssen die Container-Größe kennen um den Offset zu berechnen.
  const zoomToZone = useCallback((zone) => {
    if (activeZoneId === zone.id) { resetView(); return; }
    const el = containerRef.current;
    if (!el) return;
    const { width: cW, height: cH } = el.getBoundingClientRect();
    setActiveZoneId(zone.id);
    setSelectedPoint(null);
    const ns  = zone.zoom;
    // zone.x/y sind % des Bildes. Da SVG + Bild zusammen transformiert werden
    // und transformOrigin = center, rechnen wir relativ zur Container-Mitte.
    const ox = (cW / 2 - (zone.x / 100) * cW) * (ns - 1);
    const oy = (cH / 2 - (zone.y / 100) * cH) * (ns - 1);
    animateTo(ns, ox, oy);
  }, [activeZoneId, animateTo, resetView]);

  // ── Double-tap ────────────────────────────────────────────────
  const handleDoubleTap = useCallback((clientX, clientY) => {
    const el = containerRef.current;
    if (!el) return;
    const { left, top, width, height } = el.getBoundingClientRect();
    if (scale >= 2.5) { resetView(); return; }
    const ns = 2.5;
    const ox = (width  / 2 - (clientX - left))  * (ns - 1);
    const oy = (height / 2 - (clientY - top))   * (ns - 1);
    setActiveZoneId(null);
    animateTo(ns, ox, oy);
  }, [scale, resetView, animateTo]);

  // ── Touch ────────────────────────────────────────────────────
  const pDist = (t1, t2) => Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 1) {
      const t0 = e.touches[0];
      lastTouchRef.current  = { x: t0.clientX, y: t0.clientY };
      isDraggingRef.current = false;
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
    e.preventDefault();
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

  // passive:false damit preventDefault() in touchmove greift
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

  // Punkte mit Nummern – Nummer bleibt fix (Index+1), auch wenn gefiltert
  const activeTypes = [...new Set(mapPoints.map(p => p.type))].filter(k => TYPE_META[k]);
  const isTransformed = scale !== 1 || offset.x !== 0 || offset.y !== 0;

  const R      = 1.3;   // Kreis-Radius (viewBox-Einheiten)
  const R_SEL  = 1.9;   // Ausgewählt – deutlich größer

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
        {/* ── Bild + SVG zusammen transformiert ── */}
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: 'center center',
            transition: animating ? 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
            // willChange bewusst weggelassen → kein GPU-Layer → Bild bleibt scharf
          }}
        >
          <img
            src={mapImageUrl}
            alt="Geländeplan AGRA Messepark"
            className="absolute inset-0 w-full h-full object-contain"
            draggable={false}
            style={{ imageRendering: 'auto' }}  // Standard-Interpolation für Fotos
            onLoad={(e) => setImgNat({ w: e.target.naturalWidth, h: e.target.naturalHeight })}
          />

          {/* SVG-Overlay
              viewBox = echtes Bildseitenverhältnis (normiert auf 100 Höhe)
              → SVG und object-contain Bild liegen pixel-exakt übereinander
              Gegenskalierung (1/scale) hält Punkte immer gleich groß
          */}
          {imgNat.w > 0 && (() => {
            // viewBox auf natürliches Seitenverhältnis normieren
            const vbW = (imgNat.w / imgNat.h) * 100;
            const vbH = 100;
            const cs  = 1 / scale;
            return (
              <svg
                viewBox={`0 0 ${vbW} ${vbH}`}
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
                style={{ overflow: 'visible' }}
              >
                {mapPoints.map((point, idx) => {
                  const px    = (point.x / 100) * vbW;
                  const py    = (point.y / 100) * vbH;
                  const meta  = TYPE_META[point.type] || TYPE_META.other;
                  const vis   = activeFilters.has(point.type);
                  const isSel = selectedPoint?.id === point.id;
                  if (!vis) return null;
                  const r = isSel ? R_SEL * cs : R * cs;
                  return (
                    <g key={point.id} style={{ cursor: 'pointer' }}
                      onClick={(e) => { e.stopPropagation(); if (!isDraggingRef.current) setSelectedPoint(isSel ? null : point); }}>
                      {/* Glow-Ring wenn ausgewählt */}
                      {isSel && (
                        <circle cx={px} cy={py} r={(R_SEL + 1.2) * cs}
                          fill="none" stroke={meta.color} strokeWidth={0.5 * cs} opacity="0.5" />
                      )}
                      {/* Äußerer weißer Ring für Lesbarkeit auf der Karte */}
                      <circle cx={px} cy={py} r={r + 0.25 * cs}
                        fill="white" opacity="0.9" />
                      {/* Farbiger Hauptkreis */}
                      <circle cx={px} cy={py} r={r}
                        fill={meta.color} />
                    </g>
                  );
                })}

                {youAreHere && (() => {
                  const px = (youAreHere.x / 100) * vbW;
                  const py = (youAreHere.y / 100) * vbH;
                  return (
                    <g>
                      {/* Pulsierender äußerer Ring */}
                      <circle cx={px} cy={py} r={(R + 2) * cs}
                        fill="none" stroke="#2F6F5E" strokeWidth={0.4 * cs} opacity="0.5" />
                      <circle cx={px} cy={py} r={(R + 0.8) * cs}
                        fill="none" stroke="#2F6F5E" strokeWidth={0.5 * cs} opacity="0.8" />
                      {/* Weißer Ring */}
                      <circle cx={px} cy={py} r={(R + 0.3) * cs}
                        fill="white" />
                      {/* Grüner Kern */}
                      <circle cx={px} cy={py} r={R * cs}
                        fill="#2F6F5E" />
                    </g>
                  );
                })()}
              </svg>
            );
          })()}
        </div>

        {/* ── Zoom-Zone Buttons unten ── */}
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

        {/* ── Popup bei ausgewähltem Punkt ── */}
        <AnimatePresence>
          {selectedPoint && (() => {
            const idx  = mapPoints.findIndex(p => p.id === selectedPoint.id);
            const num  = idx + 1;
            const meta = TYPE_META[selectedPoint.type] || TYPE_META.other;
            const Icon = meta.icon;
            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-20 left-4 right-4 kiosk-surface backdrop-blur-xl rounded-2xl p-5 border border-white/[0.1] z-20"
              >
                <div className="flex items-center gap-4">
                  {/* Nummer-Badge */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-display font-black text-xl text-white"
                    style={{ background: meta.color }}
                  >
                    {num}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-xl text-foreground leading-tight truncate">
                      {selectedPoint.label}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Icon className="w-4 h-4 flex-shrink-0" style={{ color: meta.color }} />
                      <span className="text-muted-foreground font-interface text-sm">{meta.label}</span>
                    </div>
                  </div>
                  {/* Schließen */}
                  <button
                    onClick={() => setSelectedPoint(null)}
                    className="text-muted-foreground/50 hover:text-foreground transition-colors p-1 touch-manipulation text-xl flex-shrink-0"
                  >
                    ✕
                  </button>
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
