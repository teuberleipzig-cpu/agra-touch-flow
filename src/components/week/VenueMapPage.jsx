import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Car, Bath, Landmark, UtensilsCrossed,
  MapPin, ZoomIn, ZoomOut, RotateCcw, Info, DoorOpen,
  HeartPulse, Navigation, Layers
} from 'lucide-react';
import { useKiosk } from '../kiosk/KioskContext';
import BeaconHeader from '../kiosk/BeaconHeader';
import QRHandoff from '../kiosk/QRHandoff';

// ─── Type meta ────────────────────────────────────────────────────────────────
const TYPE_META = {
  halls:      { icon: Building2,     color: '#2F6F5E', label: 'Hallen'      },
  parking:    { icon: Car,           color: '#60A5FA', label: 'Parkplatz'   },
  sanitary:   { icon: Bath,          color: '#4ADE80', label: 'Toiletten'   },
  admin:      { icon: Landmark,      color: '#FBBF24', label: 'Verwaltung'  },
  gastronomy: { icon: UtensilsCrossed, color: '#FB923C', label: 'Gastronomie' },
  entrance:   { icon: DoorOpen,      color: '#A78BFA', label: 'Eingang'     },
  firstaid:   { icon: HeartPulse,    color: '#F87171', label: 'Erste Hilfe' },
  info:       { icon: Info,          color: '#38BDF8', label: 'Info'        },
  other:      { icon: MapPin,        color: '#94A3B8', label: 'Sonstiges'   },
};

// Kiosk-ID aus URL-Parameter lesen
function getKioskId() {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('kiosk');
}

// Smooth animation config
const SMOOTH = { type: 'spring', stiffness: 260, damping: 28 };
const ZOOM_LEVELS = { min: 0.8, max: 5 };

export default function VenueMapPage() {
  const { t, config } = useKiosk();

  // Map config from server config
  const mapPoints = config?.map_points || [];
  const mapZones  = config?.map_zones  || [];
  const stelen    = config?.stelen     || {};
  const kioskId   = getKioskId();
  const youAreHere = kioskId ? stelen[kioskId]?.you_are_here ?? null : null;

  // Transform state
  const [scale, setScale]   = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState(false);

  // UI state
  const [activeFilters, setActiveFilters] = useState(
    new Set(Object.keys(TYPE_META))
  );
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [activeZone, setActiveZone]       = useState(null); // currently zoomed zone label

  // Touch tracking
  const lastTouchRef      = useRef(null);
  const lastPinchDistRef  = useRef(null);
  const isDraggingRef     = useRef(false);
  const doubleTapRef      = useRef({ lastTime: 0, lastX: 0, lastY: 0 });
  const containerRef      = useRef(null);

  // ── Helpers ──────────────────────────────────────────────────
  const clampOffset = useCallback((ox, oy, sc) => {
    const maxShift = Math.max(0, (sc - 1) * 250);
    return {
      x: Math.max(-maxShift, Math.min(maxShift, ox)),
      y: Math.max(-maxShift, Math.min(maxShift, oy)),
    };
  }, []);

  const dist = (t1, t2) => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const animateTo = useCallback((newScale, newOffsetX, newOffsetY) => {
    setIsAnimating(true);
    const clamped = clampOffset(newOffsetX, newOffsetY, newScale);
    setScale(newScale);
    setOffset(clamped);
    setTimeout(() => setIsAnimating(false), 400);
  }, [clampOffset]);

  const resetView = useCallback(() => {
    setActiveZone(null);
    animateTo(1, 0, 0);
    setSelectedPoint(null);
  }, [animateTo]);

  // ── Zoom zone handler ────────────────────────────────────────
  const zoomToZone = useCallback((zone) => {
    if (activeZone === zone.id) {
      resetView();
      return;
    }
    setActiveZone(zone.id);
    // Convert % coords to pixel offset from center
    const container = containerRef.current;
    if (!container) return;
    const { width, height } = container.getBoundingClientRect();
    const targetX = (zone.x / 100) * width;
    const targetY = (zone.y / 100) * height;
    const centerX = width / 2;
    const centerY = height / 2;
    const newScale = zone.zoom;
    const ox = (centerX - targetX) * newScale;
    const oy = (centerY - targetY) * newScale;
    animateTo(newScale, ox, oy);
    setSelectedPoint(null);
  }, [activeZone, animateTo, resetView]);

  // ── Double-tap handler ───────────────────────────────────────
  const handleDoubleTap = useCallback((clientX, clientY) => {
    const container = containerRef.current;
    if (!container) return;
    const { left, top, width, height } = container.getBoundingClientRect();
    const tapX = clientX - left;
    const tapY = clientY - top;

    if (scale >= 2.5) {
      // Already zoomed → reset
      resetView();
    } else {
      // Zoom into tapped point × 2.5
      const newScale = 2.5;
      const ox = (width / 2 - tapX) * newScale;
      const oy = (height / 2 - tapY) * newScale;
      setActiveZone(null);
      animateTo(newScale, ox, oy);
    }
  }, [scale, resetView, animateTo]);

  // ── Touch handlers ───────────────────────────────────────────
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      const t0 = e.touches[0];
      lastTouchRef.current = { x: t0.clientX, y: t0.clientY };
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
      lastPinchDistRef.current = dist(e.touches[0], e.touches[1]);
      setActiveZone(null);
    }
  };

  const handleTouchMove = (e) => {
    e.stopPropagation();
    if (e.touches.length === 2 && lastPinchDistRef.current !== null) {
      const newDist = dist(e.touches[0], e.touches[1]);
      const ratio   = newDist / lastPinchDistRef.current;
      setScale(prev => {
        const next = Math.max(ZOOM_LEVELS.min, Math.min(ZOOM_LEVELS.max, prev * ratio));
        setOffset(o => clampOffset(o.x, o.y, next));
        return next;
      });
      lastPinchDistRef.current = newDist;
    } else if (e.touches.length === 1 && lastTouchRef.current) {
      const dx = e.touches[0].clientX - lastTouchRef.current.x;
      const dy = e.touches[0].clientY - lastTouchRef.current.y;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) isDraggingRef.current = true;
      setOffset(prev => clampOffset(prev.x + dx, prev.y + dy, scale));
      lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchEnd = () => {
    lastTouchRef.current     = null;
    lastPinchDistRef.current = null;
  };

  // ── Zoom buttons ─────────────────────────────────────────────
  const zoomIn = () => {
    const next = Math.min(scale + 0.5, ZOOM_LEVELS.max);
    animateTo(next, offset.x, offset.y);
  };
  const zoomOut = () => {
    const next = Math.max(scale - 0.5, ZOOM_LEVELS.min);
    if (next <= 1) { resetView(); return; }
    const clamped = clampOffset(offset.x, offset.y, next);
    animateTo(next, clamped.x, clamped.y);
  };

  // ── Filter toggle ────────────────────────────────────────────
  const toggleFilter = (key) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  // Active type keys from actual points
  const activeTypes = [...new Set(mapPoints.map(p => p.type))].filter(k => TYPE_META[k]);
  const filteredPoints = mapPoints.filter(p => activeFilters.has(p.type));
  const isTransformed  = scale !== 1 || offset.x !== 0 || offset.y !== 0;

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
              <motion.button
                key={key}
                whileTap={{ scale: 0.92 }}
                onClick={() => toggleFilter(key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-interface font-medium text-sm touch-manipulation transition-all
                  ${on ? 'kiosk-surface border border-white/[0.12] text-foreground' : 'text-muted-foreground/40'}`}
              >
                <Icon className="w-4 h-4" style={{ color: on ? meta.color : undefined }} />
                <span>{meta.label}</span>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* ── Map area ── */}
      <div
        ref={containerRef}
        className="flex-1 mx-6 mb-3 relative rounded-3xl kiosk-surface border border-white/[0.06] overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'none' }}
      >
        {/* Transformed layer */}
        <motion.div
          className="absolute inset-0"
          animate={{ x: offset.x, y: offset.y, scale }}
          transition={isAnimating ? SMOOTH : { duration: 0 }}
          style={{ transformOrigin: 'center center', willChange: 'transform' }}
        >
          <img
            src="/assets/venue-map.png"
            alt="Geländeplan AGRA Messepark"
            className="absolute inset-0 w-full h-full object-contain"
            draggable={false}
          />

          {/* Points */}
          {filteredPoints.map(point => {
            const meta = TYPE_META[point.type] || TYPE_META.other;
            const Icon = meta.icon;
            const isSelected = selectedPoint?.id === point.id;
            return (
              <motion.button
                key={point.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileTap={{ scale: 1.25 }}
                onClick={() => !isDraggingRef.current && setSelectedPoint(isSelected ? null : point)}
                className="absolute flex flex-col items-center touch-manipulation"
                style={{ left: `${point.x}%`, top: `${point.y}%`, transform: 'translate(-50%, -100%)' }}
              >
                <motion.div
                  animate={{ scale: isSelected ? 1.2 : 1 }}
                  className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
                  style={{
                    backgroundColor: meta.color + '33',
                    border: `2px solid ${meta.color}`,
                    boxShadow: isSelected ? `0 0 0 3px ${meta.color}55` : undefined,
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

          {/* Zone markers (subtle, on map) */}
          {mapZones.map(zone => (
            <button
              key={zone.id}
              onClick={(e) => { e.stopPropagation(); zoomToZone(zone); }}
              className="absolute touch-manipulation"
              style={{ left: `${zone.x}%`, top: `${zone.y}%`, transform: 'translate(-50%, -50%)' }}
            >
              <div
                className="px-2 py-1 rounded-lg text-[10px] font-bold border"
                style={{
                  background: activeZone === zone.id ? 'rgba(250,204,21,0.25)' : 'rgba(250,204,21,0.08)',
                  borderColor: 'rgba(250,204,21,0.5)',
                  color: '#FACC15',
                }}
              >
                🔍 {zone.label}
              </div>
            </button>
          ))}

          {/* You are here */}
          {youAreHere && (
            <div
              className="absolute flex flex-col items-center pointer-events-none"
              style={{ left: `${youAreHere.x}%`, top: `${youAreHere.y}%`, transform: 'translate(-50%, -50%)' }}
            >
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-primary/40 animate-beacon-pulse absolute -inset-1" />
                <MapPin className="w-10 h-10 text-primary relative z-10 drop-shadow-lg" fill="currentColor" />
              </div>
              <span className="mt-1 font-interface text-xs font-bold text-primary bg-background/90 px-3 py-1 rounded-lg whitespace-nowrap shadow-lg">
                {t('youAreHere')}
              </span>
            </div>
          )}
        </motion.div>

        {/* ── Zoom-Zone buttons (bottom, outside transform) ── */}
        {mapZones.length > 0 && (
          <div className="absolute bottom-4 left-4 right-16 flex gap-2 flex-wrap z-20">
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={resetView}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-interface text-sm font-semibold touch-manipulation backdrop-blur-xl transition-all
                ${!activeZone
                  ? 'bg-primary/20 border border-primary/50 text-primary'
                  : 'kiosk-surface border border-white/[0.1] text-muted-foreground'}`}
            >
              <Layers className="w-4 h-4" />
              {t('fullVenue') || 'Gesamtes Gelände'}
            </motion.button>
            {mapZones.map(zone => (
              <motion.button
                key={zone.id}
                whileTap={{ scale: 0.94 }}
                onClick={() => zoomToZone(zone)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-interface text-sm font-semibold touch-manipulation backdrop-blur-xl transition-all
                  ${activeZone === zone.id
                    ? 'border text-yellow-300'
                    : 'kiosk-surface border border-white/[0.1] text-muted-foreground'}`}
                style={activeZone === zone.id ? {
                  background: 'rgba(250,204,21,0.15)',
                  borderColor: 'rgba(250,204,21,0.5)',
                } : {}}
              >
                <ZoomIn className="w-4 h-4" />
                {zone.label}
              </motion.button>
            ))}
          </div>
        )}

        {/* ── Zoom controls (top right, outside transform) ── */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={zoomIn}
            className="w-12 h-12 rounded-xl kiosk-surface border border-white/[0.1] flex items-center justify-center text-foreground touch-manipulation backdrop-blur-xl"
          >
            <ZoomIn className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={zoomOut}
            className="w-12 h-12 rounded-xl kiosk-surface border border-white/[0.1] flex items-center justify-center text-foreground touch-manipulation backdrop-blur-xl"
          >
            <ZoomOut className="w-5 h-5" />
          </motion.button>
          <AnimatePresence>
            {isTransformed && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileTap={{ scale: 0.9 }}
                onClick={resetView}
                className="w-12 h-12 rounded-xl kiosk-surface border border-primary/40 flex items-center justify-center text-primary touch-manipulation backdrop-blur-xl"
              >
                <RotateCcw className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* ── Scale indicator ── */}
        <AnimatePresence>
          {scale !== 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-4 left-4 z-20 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-1.5"
            >
              <span className="font-interface text-sm font-medium text-foreground">
                {Math.round(scale * 100)}%
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Double-tap hint (fades out after 3s) ── */}
        <DoubleTapHint />

        {/* ── Selected point detail ── */}
        <AnimatePresence>
          {selectedPoint && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-20 left-4 right-4 kiosk-surface backdrop-blur-xl rounded-2xl p-5 border border-white/[0.1] z-20"
            >
              <div className="flex items-center gap-3">
                {(() => {
                  const meta = TYPE_META[selectedPoint.type] || TYPE_META.other;
                  const Icon = meta.icon;
                  return (
                    <>
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: meta.color + '22', border: `1.5px solid ${meta.color}` }}
                      >
                        <Icon className="w-5 h-5" style={{ color: meta.color }} />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-xl text-foreground leading-tight">
                          {selectedPoint.label}
                        </h3>
                        <p className="text-muted-foreground font-interface text-sm mt-0.5">{meta.label}</p>
                      </div>
                    </>
                  );
                })()}
                <button
                  onClick={() => setSelectedPoint(null)}
                  className="ml-auto text-muted-foreground/50 hover:text-foreground transition-colors p-1"
                >
                  ✕
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── QR Handoff ── */}
      <div className="px-6 pb-28 flex justify-center">
        <QRHandoff label={t('downloadMap')} url="https://agra-leipzig.de/map" />
      </div>
    </div>
  );
}

// ── Double-tap hint component ─────────────────────────────────
function DoubleTapHint() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 3500);
    return () => clearTimeout(t);
  }, []);
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ delay: 0.5 }}
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
