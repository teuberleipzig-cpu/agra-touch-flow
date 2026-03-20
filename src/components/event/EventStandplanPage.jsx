import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Car, Bath, UtensilsCrossed, MapPin, ZoomIn, ZoomOut, RotateCcw, Search, X, ArrowLeft, Globe } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useKiosk } from '../kiosk/KioskContext';
import BeaconHeader from '../kiosk/BeaconHeader';
import QRHandoff from '../kiosk/QRHandoff';

// ── MAP CONFIGS ──────────────────────────────────────────────────────────────
const VENUE_FILTERS = [
  { key: 'halls',       icon: Building2,       color: 'text-primary' },
  { key: 'parking',     icon: Car,             color: 'text-blue-400' },
  { key: 'sanitary',    icon: Bath,            color: 'text-green-400' },
  { key: 'gastronomy',  icon: UtensilsCrossed, color: 'text-orange-400' },
];

const VENUE_POINTS = [
  { id: 'h1', type: 'halls',      label: 'Halle 1', x: 20, y: 25 },
  { id: 'h2', type: 'halls',      label: 'Halle 2', x: 45, y: 25 },
  { id: 'h3', type: 'halls',      label: 'Halle 3', x: 70, y: 25 },
  { id: 'h4', type: 'halls',      label: 'Halle 4', x: 20, y: 55 },
  { id: 'h5', type: 'halls',      label: 'Halle 5', x: 45, y: 55 },
  { id: 'p1', type: 'parking',    label: 'P1',       x: 10, y: 80 },
  { id: 'p2', type: 'parking',    label: 'P2',       x: 85, y: 80 },
  { id: 's1', type: 'sanitary',   label: 'WC',       x: 33, y: 40 },
  { id: 's2', type: 'sanitary',   label: 'WC',       x: 60, y: 40 },
  { id: 'g1', type: 'gastronomy', label: 'Restaurant', x: 80, y: 45 },
  { id: 'g2', type: 'gastronomy', label: 'Café',     x: 35, y: 70 },
];

const TYPE_COLORS = {
  halls: '#2F6F5E', parking: '#60A5FA', sanitary: '#4ADE80', gastronomy: '#FB923C',
};

const YOU_ARE_HERE = { x: 50, y: 90 };

const HALL_MAPS = [
  { key: 'venue',  label: 'Geländeplan' },
  { key: 'h1',     label: 'Halle 1' },
  { key: 'h2',     label: 'Halle 2' },
  { key: 'h3',     label: 'Halle 3' },
];

// ── INTERACTIVE MAP COMPONENT ─────────────────────────────────────────────────
function InteractiveMap({ exhibitors, onSelectExhibitor }) {
  const { t } = useKiosk();
  const [activeMap, setActiveMap] = useState('venue');
  const [activeFilters, setActiveFilters] = useState(new Set(['halls', 'parking', 'sanitary', 'gastronomy']));
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const lastTouchRef = useRef(null);
  const lastPinchDistRef = useRef(null);
  const isDraggingRef = useRef(false);

  const toggleFilter = (key) => setActiveFilters(prev => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  const resetView = () => { setScale(1); setOffset({ x: 0, y: 0 }); };

  const clampOffset = useCallback((ox, oy, sc) => {
    const maxShift = (sc - 1) * 200;
    return { x: Math.max(-maxShift, Math.min(maxShift, ox)), y: Math.max(-maxShift, Math.min(maxShift, oy)) };
  }, []);

  const dist = (t1, t2) => Math.sqrt((t1.clientX - t2.clientX) ** 2 + (t1.clientY - t2.clientY) ** 2);

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) { lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; isDraggingRef.current = false; }
    else if (e.touches.length === 2) lastPinchDistRef.current = dist(e.touches[0], e.touches[1]);
  };

  const handleTouchMove = (e) => {
    e.stopPropagation();
    if (e.touches.length === 2 && lastPinchDistRef.current !== null) {
      const ratio = dist(e.touches[0], e.touches[1]) / lastPinchDistRef.current;
      setScale(prev => Math.max(0.8, Math.min(4, prev * ratio)));
      lastPinchDistRef.current = dist(e.touches[0], e.touches[1]);
    } else if (e.touches.length === 1 && lastTouchRef.current) {
      const dx = e.touches[0].clientX - lastTouchRef.current.x;
      const dy = e.touches[0].clientY - lastTouchRef.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) isDraggingRef.current = true;
      setOffset(prev => clampOffset(prev.x + dx, prev.y + dy, scale));
      lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchEnd = () => { lastTouchRef.current = null; lastPinchDistRef.current = null; };

  const filteredPoints = VENUE_POINTS.filter(p => activeFilters.has(p.type));

  // For hall maps: show exhibitors of that hall
  const hallExhibitors = activeMap !== 'venue'
    ? exhibitors.filter(e => e.hall?.toLowerCase().replace(' ', '') === activeMap)
    : [];

  return (
    <div className="flex flex-col h-full">
      {/* Map switcher */}
      <div className="flex-none px-6 pb-3 flex gap-2 overflow-x-auto">
        {HALL_MAPS.map(m => (
          <motion.button
            key={m.key}
            whileTap={{ scale: 0.92 }}
            onClick={() => { setActiveMap(m.key); resetView(); setSelectedPoint(null); }}
            className={`flex-shrink-0 px-4 py-2 rounded-xl font-interface text-sm font-medium touch-manipulation transition-all
              ${activeMap === m.key ? 'bg-primary text-white' : 'kiosk-surface border border-white/[0.08] text-white/50'}`}
          >
            {m.label}
          </motion.button>
        ))}
      </div>

      {/* Filter bar (only for venue plan) */}
      {activeMap === 'venue' && (
        <div className="flex-none px-6 pb-3 flex gap-2 flex-wrap">
          {VENUE_FILTERS.map(f => (
            <motion.button
              key={f.key}
              whileTap={{ scale: 0.92 }}
              onClick={() => toggleFilter(f.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-interface font-medium text-sm touch-manipulation transition-all
                ${activeFilters.has(f.key) ? 'kiosk-surface border border-white/[0.12] text-foreground' : 'text-muted-foreground/40'}`}
            >
              <f.icon className={`w-4 h-4 ${activeFilters.has(f.key) ? f.color : ''}`} />
              <span>{t(f.key)}</span>
            </motion.button>
          ))}
        </div>
      )}

      {/* Map canvas */}
      <div
        className="flex-1 mx-6 mb-3 relative rounded-3xl kiosk-surface border border-white/[0.06] overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'none' }}
      >
        <div
          className="absolute inset-0"
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transformOrigin: 'center center', transition: 'transform 0.05s linear', willChange: 'transform' }}
        >
          {/* Background map image */}
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b172c2003bd9c2d72412a9/a3b15f7e8_generated_4cc6a58b.png"
            alt="Map"
            className="absolute inset-0 w-full h-full object-cover opacity-30"
            draggable={false}
          />

          {/* Venue mode: standard filter points */}
          {activeMap === 'venue' && filteredPoints.map(point => (
            <motion.button
              key={point.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileTap={{ scale: 1.2 }}
              onClick={() => !isDraggingRef.current && setSelectedPoint(selectedPoint?.id === point.id ? null : point)}
              className="absolute flex flex-col items-center touch-manipulation"
              style={{ left: `${point.x}%`, top: `${point.y}%`, transform: 'translate(-50%, -50%)' }}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: TYPE_COLORS[point.type] + '33', border: `2px solid ${TYPE_COLORS[point.type]}` }}>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: TYPE_COLORS[point.type] }} />
              </div>
              <span className="mt-1 font-interface text-xs font-medium text-foreground bg-background/80 px-2 py-0.5 rounded whitespace-nowrap">{point.label}</span>
            </motion.button>
          ))}

          {/* Hall mode: exhibitor stand markers */}
          {activeMap !== 'venue' && hallExhibitors.map(ex => (
            ex.map_x != null && ex.map_y != null ? (
              <motion.button
                key={ex.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileTap={{ scale: 1.2 }}
                onClick={() => !isDraggingRef.current && onSelectExhibitor(ex)}
                className="absolute flex flex-col items-center touch-manipulation"
                style={{ left: `${ex.map_x}%`, top: `${ex.map_y}%`, transform: 'translate(-50%, -50%)' }}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/30 border-2 border-primary">
                  <span className="font-display font-bold text-white text-xs">{ex.stand_number}</span>
                </div>
                <span className="mt-1 font-interface text-xs font-medium text-foreground bg-background/80 px-2 py-0.5 rounded whitespace-nowrap max-w-[80px] truncate">{ex.name}</span>
              </motion.button>
            ) : null
          ))}

          {/* You are here */}
          <div className="absolute flex flex-col items-center" style={{ left: `${YOU_ARE_HERE.x}%`, top: `${YOU_ARE_HERE.y}%`, transform: 'translate(-50%, -50%)' }}>
            <div className="relative">
              <div className="w-6 h-6 rounded-full bg-primary animate-beacon-pulse absolute -inset-1" />
              <MapPin className="w-10 h-10 text-primary relative z-10" fill="currentColor" />
            </div>
            <span className="mt-2 font-interface text-sm font-bold text-primary bg-background/90 px-3 py-1 rounded-lg whitespace-nowrap">{t('youAreHere')}</span>
          </div>
        </div>

        {/* Zoom controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => { const n = Math.min(scale + 0.4, 4); setScale(n); setOffset(o => clampOffset(o.x, o.y, n)); }}
            className="w-12 h-12 rounded-xl kiosk-surface border border-white/[0.1] flex items-center justify-center text-foreground touch-manipulation backdrop-blur-xl">
            <ZoomIn className="w-5 h-5" />
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => { const n = Math.max(scale - 0.4, 0.8); setScale(n); setOffset(o => clampOffset(o.x, o.y, n)); }}
            className="w-12 h-12 rounded-xl kiosk-surface border border-white/[0.1] flex items-center justify-center text-foreground touch-manipulation backdrop-blur-xl">
            <ZoomOut className="w-5 h-5" />
          </motion.button>
          {(scale !== 1 || offset.x !== 0 || offset.y !== 0) && (
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} whileTap={{ scale: 0.9 }} onClick={resetView}
              className="w-12 h-12 rounded-xl kiosk-surface border border-primary/30 flex items-center justify-center text-primary touch-manipulation backdrop-blur-xl">
              <RotateCcw className="w-4 h-4" />
            </motion.button>
          )}
        </div>

        {scale !== 1 && (
          <div className="absolute top-4 left-4 z-20 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-1.5">
            <span className="font-interface text-sm font-medium text-foreground">{Math.round(scale * 100)}%</span>
          </div>
        )}

        {/* Selected venue point */}
        {selectedPoint && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-4 right-4 kiosk-surface backdrop-blur-xl rounded-2xl p-5 border border-white/[0.1] z-20">
            <h3 className="font-display font-bold text-xl text-foreground">{selectedPoint.label}</h3>
            <p className="text-muted-foreground font-interface capitalize">{t(selectedPoint.type)}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ── EXHIBITOR DETAIL ──────────────────────────────────────────────────────────
function ExhibitorDetail({ exhibitor, onBack }) {
  const { t } = useKiosk();
  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}
      className="h-full flex flex-col overflow-hidden px-6 pb-28">
      <motion.button whileTap={{ scale: 0.95 }} onClick={onBack}
        className="flex items-center gap-2 text-primary font-interface text-base touch-manipulation mb-6 mt-2">
        <ArrowLeft className="w-5 h-5" />
        {t('back')}
      </motion.button>

      {exhibitor.logo_url && (
        <img src={exhibitor.logo_url} alt="Logo" className="h-16 w-auto object-contain mb-4 self-start" />
      )}

      <h2 className="font-display font-extrabold text-white text-3xl leading-tight mb-2">{exhibitor.name}</h2>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="bg-primary/15 text-primary text-sm font-interface font-semibold px-3 py-1 rounded-lg">{t('stand')} {exhibitor.stand_number}</span>
        {exhibitor.hall && <span className="kiosk-surface border border-white/[0.08] text-white/60 text-sm font-interface px-3 py-1 rounded-lg">{t('hall')} {exhibitor.hall}</span>}
        {exhibitor.category && <span className="kiosk-surface border border-white/[0.08] text-white/60 text-sm font-interface px-3 py-1 rounded-lg">{exhibitor.category}</span>}
      </div>

      {exhibitor.description && (
        <p className="font-interface text-white/70 text-base leading-relaxed mb-5">{exhibitor.description}</p>
      )}

      {exhibitor.keywords?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {exhibitor.keywords.map((kw, i) => (
            <span key={i} className="bg-white/[0.05] text-white/50 text-xs font-interface px-3 py-1 rounded-lg">{kw}</span>
          ))}
        </div>
      )}

      {exhibitor.website_url && (
        <div className="flex items-center gap-2 text-white/50 font-interface text-sm">
          <Globe className="w-4 h-4" />
          <span>{exhibitor.website_url}</span>
        </div>
      )}
    </motion.div>
  );
}

// ── EXHIBITOR LIST ────────────────────────────────────────────────────────────
function ExhibitorSearch({ exhibitors, onSelect }) {
  const { t } = useKiosk();
  const [query, setQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');

  const categories = [...new Set(exhibitors.map(e => e.category).filter(Boolean))];

  const filtered = exhibitors.filter(e => {
    const q = query.toLowerCase();
    const matchQ = !q || e.name?.toLowerCase().includes(q) || e.stand_number?.toLowerCase().includes(q) || e.keywords?.some(k => k.toLowerCase().includes(q));
    const matchC = selectedCat === 'all' || e.category === selectedCat;
    return matchQ && matchC;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="flex-none px-6 pb-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('search')}
            className="w-full bg-white/[0.05] border border-white/[0.1] rounded-2xl pl-12 pr-10 py-4 font-interface text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 text-base"
          />
          {query && <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 touch-manipulation"><X className="w-5 h-5" /></button>}
        </div>
      </div>

      {/* Category filters */}
      {categories.length > 0 && (
        <div className="flex-none px-6 pb-3 flex gap-2 overflow-x-auto">
          {['all', ...categories].map(cat => (
            <motion.button key={cat} whileTap={{ scale: 0.92 }} onClick={() => setSelectedCat(cat)}
              className={`flex-shrink-0 px-3 py-2 rounded-xl font-interface text-sm font-medium touch-manipulation transition-all
                ${selectedCat === cat ? 'bg-primary text-white' : 'kiosk-surface border border-white/[0.08] text-white/50'}`}>
              {cat === 'all' ? 'Alle' : cat}
            </motion.button>
          ))}
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto px-6 pb-4" style={{ WebkitOverflowScrolling: 'touch' }}>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <Search className="w-8 h-8 text-white/15" />
            <p className="font-interface text-white/30 text-base">Kein Ergebnis</p>
          </div>
        ) : (
          filtered.map((ex, i) => (
            <motion.button key={ex.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
              whileTap={{ scale: 0.97 }} onClick={() => onSelect(ex)}
              className="w-full kiosk-surface rounded-2xl p-4 mb-2 border border-white/[0.06] flex items-center justify-between touch-manipulation">
              <div className="text-left">
                <p className="font-display font-bold text-white text-base">{ex.name}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="font-interface text-white/40 text-sm">{t('stand')} {ex.stand_number}</span>
                  {ex.hall && <span className="font-interface text-white/40 text-sm">· {t('hall')} {ex.hall}</span>}
                  {ex.category && <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-lg">{ex.category}</span>}
                </div>
              </div>
              <MapPin className="w-5 h-5 text-primary flex-shrink-0 ml-3" />
            </motion.button>
          ))
        )}
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'map',        label: 'Karte' },
  { key: 'exhibitors', label: 'Aussteller' },
];

export default function EventStandplanPage({ event }) {
  const { t } = useKiosk();
  const [tab, setTab] = useState('map');
  const [exhibitors, setExhibitors] = useState([]);
  const [selectedExhibitor, setSelectedExhibitor] = useState(null);

  useEffect(() => {
    if (!event?.id) return;
    base44.entities.Exhibitor.filter({ event_id: event.id }).then(setExhibitors);
  }, [event?.id]);

  const handleSelectExhibitor = (ex) => setSelectedExhibitor(ex);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <BeaconHeader subtitle={t('standplan')} />

      {/* Tab switcher */}
      <div className="flex-none px-6 pb-4 flex gap-2">
        {TABS.map(({ key, label }) => (
          <motion.button key={key} whileTap={{ scale: 0.92 }} onClick={() => { setTab(key); setSelectedExhibitor(null); }}
            className={`px-6 py-3 rounded-xl font-interface font-semibold text-base touch-manipulation transition-all
              ${tab === key ? 'bg-primary text-white' : 'kiosk-surface border border-white/[0.08] text-white/50'}`}>
            {label}
          </motion.button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {selectedExhibitor ? (
            <motion.div key="detail" className="h-full overflow-y-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ExhibitorDetail exhibitor={selectedExhibitor} onBack={() => setSelectedExhibitor(null)} />
            </motion.div>
          ) : tab === 'map' ? (
            <motion.div key="map" className="h-full flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <InteractiveMap exhibitors={exhibitors} onSelectExhibitor={handleSelectExhibitor} />
              <div className="flex-none px-6 pb-28 flex justify-center">
                <QRHandoff label={t('downloadMap')} url={event?.website_url || 'https://agra-leipzig.de'} />
              </div>
            </motion.div>
          ) : (
            <motion.div key="exhibitors" className="h-full flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ExhibitorSearch exhibitors={exhibitors} onSelect={handleSelectExhibitor} />
              <div className="flex-none px-6 pb-28 flex justify-center">
                <QRHandoff label={t('downloadMap')} url={event?.website_url || 'https://agra-leipzig.de'} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}