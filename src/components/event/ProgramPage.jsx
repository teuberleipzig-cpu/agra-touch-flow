import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, Star, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useKiosk } from '../kiosk/KioskContext';
import BeaconHeader from '../kiosk/BeaconHeader';
import QRHandoff from '../kiosk/QRHandoff';
import moment from 'moment';

export default function ProgramPage() {
  const { t, activeEvent, language } = useKiosk();
  const [entries, setEntries] = useState([]);
  const [view, setView] = useState('today');

  useEffect(() => {
    const load = async () => {
      if (activeEvent?.id) {
        const data = await base44.entities.ProgramEntry.filter({ event_id: activeEvent.id }, 'start_time', 200);
        setEntries(data);
      } else {
        const data = await base44.entities.ProgramEntry.list('start_time', 200);
        setEntries(data);
      }
    };
    load();
  }, [activeEvent?.id]);

  const today = moment().startOf('day');
  const filtered = entries.filter(e => {
    if (view === 'today') return moment(e.start_time).isSame(today, 'day');
    if (view === 'highlights') return e.is_highlight;
    return true;
  });

  // Group by time
  const grouped = filtered.reduce((acc, entry) => {
    const hour = moment(entry.start_time).format('HH:mm');
    if (!acc[hour]) acc[hour] = [];
    acc[hour].push(entry);
    return acc;
  }, {});

  const views = [
    { key: 'today', label: t('today') },
    { key: 'timetable', label: t('timetable') },
    { key: 'highlights', label: t('highlights') },
  ];

  const getTitle = (entry) => {
    if (language === 'en' && entry.title_en) return entry.title_en;
    return entry.title;
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <BeaconHeader subtitle={t('program')} />

      {/* View tabs */}
      <div className="px-6 pb-4 flex gap-3">
        {views.map(v => (
          <motion.button
            key={v.key}
            whileTap={{ scale: 0.95 }}
            onClick={() => setView(v.key)}
            className={`px-6 py-4 rounded-xl font-interface font-semibold text-lg touch-manipulation transition-all
              ${view === v.key
                ? 'bg-primary/10 border-2 border-primary/30 text-primary'
                : 'kiosk-surface border border-white/[0.06] text-muted-foreground'
              }`}
          >
            {v.label}
          </motion.button>
        ))}
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto px-6 pb-28">
        {Object.entries(grouped).map(([time, items]) => (
          <div key={time} className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-16 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="font-interface font-bold text-primary text-base">{time}</span>
              </div>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="space-y-3 ml-4">
              {items.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="kiosk-surface rounded-2xl p-5 border border-white/[0.06]"
                >
                  <div className="flex items-start gap-3">
                    {entry.is_highlight && <Star className="w-5 h-5 text-amber-400 flex-shrink-0 mt-1" fill="currentColor" />}
                    <div className="flex-1">
                      <h3 className="font-display font-bold text-xl text-foreground">{getTitle(entry)}</h3>
                      <div className="flex items-center gap-4 mt-2 text-base font-interface text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {moment(entry.start_time).format('HH:mm')}
                          {entry.end_time && ` – ${moment(entry.end_time).format('HH:mm')}`}
                        </span>
                        {entry.stage && <span>📍 {entry.stage}</span>}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}

        {Object.keys(grouped).length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <CalendarDays className="w-16 h-16 text-muted-foreground/20 mb-4" />
            <p className="font-interface text-xl text-muted-foreground">{t('noEvents')}</p>
          </div>
        )}
      </div>

      {/* QR for full program */}
      <div className="px-6 pb-28 flex justify-center">
        <QRHandoff label={t('program')} url="https://agra-leipzig.de/program" />
      </div>
    </div>
  );
}