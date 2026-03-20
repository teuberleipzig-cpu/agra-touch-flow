import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useKiosk } from '../kiosk/KioskContext';
import BeaconHeader from '../kiosk/BeaconHeader';

export default function EventExhibitorPage({ event }) {
  const { t } = useKiosk();
  const [exhibitors, setExhibitors] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    if (!event?.id) return;
    base44.entities.Exhibitor.filter({ event_id: event.id }).then(setExhibitors);
  }, [event?.id]);

  const categories = useMemo(() => {
    const cats = [...new Set(exhibitors.map(e => e.category).filter(Boolean))];
    return cats;
  }, [exhibitors]);

  const filtered = useMemo(() => {
    return exhibitors.filter(e => {
      const q = query.toLowerCase();
      const matchesQuery = !q ||
        e.name?.toLowerCase().includes(q) ||
        e.stand_number?.toLowerCase().includes(q) ||
        e.keywords?.some(k => k.toLowerCase().includes(q));
      const matchesCat = selectedCategory === 'all' || e.category === selectedCategory;
      return matchesQuery && matchesCat;
    });
  }, [exhibitors, query, selectedCategory]);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <BeaconHeader subtitle={t('searchExhibitor')} />

      {/* Search bar */}
      <div className="flex-none px-6 pb-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('search')}
            className="w-full bg-white/[0.05] border border-white/[0.1] rounded-2xl pl-12 pr-12 py-4 font-interface text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 text-lg"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white touch-manipulation">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Category filters */}
      {categories.length > 0 && (
        <div className="flex-none px-6 pb-3 flex gap-2 overflow-x-auto">
          {['all', ...categories].map(cat => (
            <motion.button
              key={cat}
              whileTap={{ scale: 0.92 }}
              onClick={() => setSelectedCategory(cat)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl font-interface text-sm font-medium touch-manipulation transition-all
                ${selectedCategory === cat ? 'bg-primary text-white' : 'kiosk-surface border border-white/[0.08] text-white/60'}`}
            >
              {cat === 'all' ? 'Alle' : cat}
            </motion.button>
          ))}
        </div>
      )}

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-6 pb-28" style={{ WebkitOverflowScrolling: 'touch' }}>
        <AnimatePresence>
          {filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-40 gap-3">
              <Search className="w-10 h-10 text-white/15" />
              <p className="font-interface text-white/30 text-lg">Kein Ergebnis</p>
            </motion.div>
          ) : (
            filtered.map((ex, i) => (
              <motion.div
                key={ex.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="kiosk-surface rounded-2xl p-5 mb-3 border border-white/[0.06] flex items-center justify-between"
              >
                <div>
                  <p className="font-display font-bold text-white text-lg">{ex.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="font-interface text-white/40 text-sm">
                      {t('stand')} {ex.stand_number}
                    </span>
                    {ex.hall && (
                      <span className="font-interface text-white/40 text-sm">· {t('hall')} {ex.hall}</span>
                    )}
                    {ex.category && (
                      <span className="bg-primary/10 text-primary font-interface text-xs px-2 py-0.5 rounded-lg">{ex.category}</span>
                    )}
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}