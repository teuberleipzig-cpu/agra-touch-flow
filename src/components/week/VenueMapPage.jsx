import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Building2, Car, Bath, Landmark, UtensilsCrossed, MapPin, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useKiosk } from '../kiosk/KioskContext';
import BeaconHeader from '../kiosk/BeaconHeader';
import QRHandoff from '../kiosk/QRHandoff';

const FILTERS = [
  { key: 'halls', icon: Building2, color: 'text-primary' },
  { key: 'parking', icon: Car, color: 'text-blue-400' },
  { key: 'sanitary', icon: Bath, color: 'text-green-400' },
  { key: 'admin', icon: Landmark, color: 'text-amber-400' },
  { key: 'gastronomy', icon: UtensilsCrossed, color: 'text-orange-400' },
];

const MAP_POINTS = [
  { id: 'h1', type: 'halls', label: 'Halle 1', x: 20, y: 25 },
  { id: 'h2', type: 'halls', label: 'Halle 2', x: 45, y: 25 },
  { id: 'h3', type: 'halls', label: 'Halle 3', x: 70, y: 25 },
  { id: 'h4', type: 'halls', label: 'Halle 4', x: 20, y: 55 },
  { id: 'h5', type: 'halls', label: 'Halle 5', x: 45, y: 55 },
  { id: 'p1', type: 'parking', label: 'P1', x: 10, y: 80 },
  { id: 'p2', type: 'parking', label: 'P2', x: 85, y: 80 },
  { id: 's1', type: 'sanitary', label: 'WC', x: 33, y: 40 },
  { id: 's2', type: 'sanitary', label: 'WC', x: 60, y: 40 },
  { id: 'a1', type: 'admin', label: 'Verwaltung', x: 50, y: 10 },
  { id: 'g1', type: 'gastronomy', label: 'Restaurant', x: 80, y: 45 },
  { id: 'g2', type: 'gastronomy', label: 'Café', x: 35, y: 70 },
];

const typeColors = {
  halls: '#2F6F5E',
  parking: '#60A5FA',
  sanitary: '#4ADE80',
  admin: '#FBBF24',
  gastronomy: '#FB923C',
};

const YOU_ARE_HERE = { x: 50, y: 90 };

export default function VenueMapPage() {
  const { t } = useKiosk();
  const [activeFilters, setActiveFilters] = useState(new Set(['halls', 'parking', 'sanitary', 'admin', 'gastronomy']));
  const [selectedPoint, setSelectedPoint] = useState(null);

  // Transform state
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // Touch tracking refs
  const lastTouchRef = useRef(null);
  const lastPinchDistRef = useRef(null);
  const isDraggingRef = useRef(false);

  const toggleFilter = (key) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const resetView = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const clampOffset = useCallback((ox, oy, sc) => {
    const maxShift = (sc - 1) * 200;
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

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      isDraggingRef.current = false;
    } else if (e.touches.length === 2) {
      lastPinchDistRef.current = dist(e.touches[0], e.touches[1]);
    }
  };

  const handleTouchMove = (e) => {
    e.stopPropagation();
    if (e.touches.length === 2 && lastPinchDistRef.current !== null) {
      const newDist = dist(e.touches[0], e.touches[1]);
      const ratio = newDist / lastPinchDistRef.current;
      setScale(prev => Math.max(0.8, Math.min(4, prev * ratio)));
      lastPinchDistRef.current = newDist;
    } else if (e.touches.length === 1 && lastTouchRef.current) {
      const dx = e.touches[0].clientX - lastTouchRef.current.x;
      const dy = e.touches[0].clientY - lastTouchRef.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) isDraggingRef.current = true;
      setOffset(prev => {
        const next = { x: prev.x + dx, y: prev.y + dy };
        return clampOffset(next.x, next.y, scale);
      });
      lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchEnd = () => {
    lastTouchRef.current = null;
    lastPinchDistRef.current = null;
  };

  const filteredPoints = MAP_POINTS.filter(p => activeFilters.has(p.type));

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <BeaconHeader subtitle={t('venueMap')} />

      {/* Filter bar */}
      <div className="px-6 pb-4 flex gap-3 flex-wrap">
        {FILTERS.map(f => (
          <motion.button
            key={f.key}
            whileTap={{ scale: 0.92 }}
            onClick={() => toggleFilter(f.key)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-interface font-medium text-base touch-manipulation transition-all
              ${activeFilters.has(f.key)
                ? 'kiosk-surface border border-white/[0.12] text-foreground'
                : 'text-muted-foreground/40'
              }`}
          >
            <f.icon className={`w-5 h-5 ${activeFilters.has(f.key) ? f.color : ''}`} />
            <span>{t(f.key)}</span>
          </motion.button>
        ))}
      </div>

      {/* Map area */}
      <div
        className="flex-1 mx-6 mb-4 relative rounded-3xl kiosk-surface border border-white/[0.06] overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'none' }}
      >
        {/* Transformed content */}
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: 'center center',
            transition: 'transform 0.05s linear',
            willChange: 'transform',
          }}
        >
          {/* Hintergrundkarte – liegt in /public/assets/venue-map.png
               Ersetze diese Datei durch den echten AGRA-Geländeplan. */}
          <img
            src="/assets/venue-map.png"
            alt="Venue Map"
            className="absolute inset-0 w-full h-full object-cover opacity-30"
            draggable={false}
          />

          {/* Map points */}
          {filteredPoints.map(point => (
            <motion.button
              key={point.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileTap={{ scale: 1.2 }}
              onClick={() => !isDraggingRef.current && setSelectedPoint(selectedPoint?.id === point.id ? null : point)}
              className="absolute flex flex-col items-center touch-manipulation"
              style={{ left: `${point.x}%`, top: `${point.y}%`, transform: 'translate(-50%, -50%)' }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: typeColors[point.type] + '33', border: `2px solid ${typeColors[point.type]}` }}
              >
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: typeColors[point.type] }} />
              </div>
              <span className="mt-1 font-interface text-xs font-medium text-foreground bg-background/80 px-2 py-0.5 rounded whitespace-nowrap">
                {point.label}
              </span>
            </motion.button>
          ))}

          {/* You are here */}
          <div
            className="absolute flex flex-col items-center"
            style={{ left: `${YOU_ARE_HERE.x}%`, top: `${YOU_ARE_HERE.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            <div className="relative">
              <div className="w-6 h-6 rounded-full bg-primary animate-beacon-pulse absolute -inset-1" />
              <MapPin className="w-10 h-10 text-primary relative z-10" fill="currentColor" />
            </div>
            <span className="mt-2 font-interface text-sm font-bold text-primary bg-background/90 px-3 py-1 rounded-lg whitespace-nowrap">
              {t('youAreHere')}
            </span>
          </div>
        </div>

        {/* Zoom controls - outside transform */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setScale(prev => {
              const next = Math.min(prev + 0.4, 4);
              setOffset(o => clampOffset(o.x, o.y, next));
              return next;
            })}
            className="w-14 h-14 rounded-xl kiosk-surface border border-white/[0.1] flex items-center justify-center text-foreground touch-manipulation backdrop-blur-xl"
          >
            <ZoomIn className="w-6 h-6" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setScale(prev => {
              const next = Math.max(prev - 0.4, 0.8);
              setOffset(o => clampOffset(o.x, o.y, next));
              return next;
            })}
            className="w-14 h-14 rounded-xl kiosk-surface border border-white/[0.1] flex items-center justify-center text-foreground touch-manipulation backdrop-blur-xl"
          >
            <ZoomOut className="w-6 h-6" />
          </motion.button>
          {(scale !== 1 || offset.x !== 0 || offset.y !== 0) && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileTap={{ scale: 0.9 }}
              onClick={resetView}
              className="w-14 h-14 rounded-xl kiosk-surface border border-primary/30 flex items-center justify-center text-primary touch-manipulation backdrop-blur-xl"
            >
              <RotateCcw className="w-5 h-5" />
            </motion.button>
          )}
        </div>

        {/* Scale indicator */}
        {scale !== 1 && (
          <div className="absolute top-4 left-4 z-20 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-1.5">
            <span className="font-interface text-sm font-medium text-foreground">{Math.round(scale * 100)}%</span>
          </div>
        )}

        {/* Selected point detail */}
        {selectedPoint && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-4 right-4 kiosk-surface backdrop-blur-xl rounded-2xl p-6 border border-white/[0.1] z-20"
          >
            <h3 className="font-display font-bold text-2xl text-foreground">{selectedPoint.label}</h3>
            <p className="text-muted-foreground font-interface mt-1 capitalize">{t(selectedPoint.type)}</p>
          </motion.div>
        )}
      </div>

      {/* QR Download */}
      <div className="px-6 pb-28 flex justify-center">
        <QRHandoff label={t('downloadMap')} url="https://agra-leipzig.de/map" />
      </div>
    </div>
  );
}