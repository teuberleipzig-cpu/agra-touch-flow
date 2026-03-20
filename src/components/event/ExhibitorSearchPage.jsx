import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Building2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useKiosk } from '../kiosk/KioskContext';
import BeaconHeader from '../kiosk/BeaconHeader';

export default function ExhibitorSearchPage() {
  const { t, activeEvent } = useKiosk();
  const [exhibitors, setExhibitors] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const load = async () => {
      if (activeEvent?.id) {
        const data = await base44.entities.Exhibitor.filter({ event_id: activeEvent.id });
        setExhibitors(data);
      } else {
        const data = await base44.entities.Exhibitor.list('-created_date', 200);
        setExhibitors(data);
      }
    };
    load();
  }, [activeEvent?.id]);

  const categories = useMemo(() => {
    const cats = new Set(exhibitors.map(e => e.category).filter(Boolean));
    return ['all', ...Array.from(cats)];
  }, [exhibitors]);

  const filtered = useMemo(() => {
    return exhibitors.filter(ex => {
      const matchesQuery = !query || 
        ex.name?.toLowerCase().includes(query.toLowerCase()) ||
        ex.keywords?.some(k => k.toLowerCase().includes(query.toLowerCase())) ||
        ex.stand_number?.toLowerCase().includes(query.toLowerCase());
      const matchesCat = selectedCategory === 'all' || ex.category === selectedCategory;
      return matchesQuery && matchesCat;
    });
  }, [exhibitors, query, selectedCategory]);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <BeaconHeader subtitle={t('searchExhibitor')} />

      {/* Search input */}
      <div className="px-6 pb-4">
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-7 h-7 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('search')}
            className="w-full h-20 rounded-2xl kiosk-surface border border-white/[0.08] pl-16 pr-6 font-interface text-2xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/30 touch-manipulation bg-transparent"
          />
        </div>
      </div>

      {/* Category filter */}
      <div className="px-6 pb-4 flex gap-2 overflow-x-auto">
        {categories.map(cat => (
          <motion.button
            key={cat}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedCategory(cat)}
            className={`flex-shrink-0 px-5 py-3 rounded-xl font-interface text-base touch-manipulation transition-all
              ${selectedCategory === cat
                ? 'bg-primary/10 border-2 border-primary/30 text-primary'
                : 'kiosk-surface border border-white/[0.06] text-muted-foreground'
              }`}
          >
            {cat === 'all' ? 'Alle' : cat}
          </motion.button>
        ))}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-6 pb-28 space-y-3">
        <AnimatePresence>
          {filtered.map((ex, i) => (
            <motion.div
              key={ex.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
              className="kiosk-surface rounded-2xl p-6 border border-white/[0.06]"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-display font-bold text-xl text-foreground">{ex.name}</h3>
                  <div className="flex items-center gap-4 mt-2 text-base font-interface">
                    <span className="flex items-center gap-1 text-primary">
                      <Building2 className="w-4 h-4" /> {t('hall')} {ex.hall}
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="w-4 h-4" /> {t('stand')} {ex.stand_number}
                    </span>
                  </div>
                  {ex.category && (
                    <span className="inline-block mt-2 px-3 py-1 rounded-lg text-sm text-muted-foreground kiosk-surface border border-white/[0.06]">
                      {ex.category}
                    </span>
                  )}
                </div>
                <div className="flex-shrink-0 ml-4 w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <span className="font-display font-bold text-primary text-lg">{ex.stand_number}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filtered.length === 0 && query && (
          <div className="flex flex-col items-center justify-center py-20">
            <Search className="w-16 h-16 text-muted-foreground/20 mb-4" />
            <p className="font-interface text-xl text-muted-foreground">Keine Ergebnisse</p>
          </div>
        )}
      </div>
    </div>
  );
}