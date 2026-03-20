import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic2, Star, Clock, CalendarDays } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useKiosk } from '../kiosk/KioskContext';
import BeaconHeader from '../kiosk/BeaconHeader';
import QRHandoff from '../kiosk/QRHandoff';
import moment from 'moment';
import 'moment/locale/de';

moment.locale('de');

const TABS = [
  { key: 'today',      icon: Clock,        label: 'Heute' },
  { key: 'timetable',  icon: CalendarDays, label: 'Zeitplan' },
  { key: 'highlights', icon: Star,         label: 'Highlights' },
];

export default function EventProgramPage({ event }) {
  const { language } = useKiosk();
  const [entries, setEntries] = useState([]);
  const [tab, setTab] = useState('today');

  useEffect(() => {
    if (!event?.id) return;
    base44.entities.ProgramEntry.filter({ event_id: event.id }).then(setEntries);
  }, [event?.id]);

  const getTitle = (e) => {
    if (language === 'en' && e.title_en) return e.title_en;
    return e.title;
  };

  const now = moment();
  const todayEntries = entries.filter(e => moment(e.start_time).isSame(now, 'day'));
  const highlights = entries.filter(e => e.is_highlight);

  const displayed = tab === 'today' ? todayEntries : tab === 'highlights' ? highlights : entries;

  const categoryColors = {
    vortrag: 'bg-blue-500/20 text-blue-300',
    workshop: 'bg-purple-500/20 text-purple-300',
    show: 'bg-pink-500/20 text-pink-300',
    panel: 'bg-amber-500/20 text-amber-300',
    sonstiges: 'bg-white/10 text-white/50',
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <BeaconHeader subtitle="Programm" />

      {/* Tabs */}
      <div className="flex-none px-6 pb-4 flex gap-2">
        {TABS.map(({ key, icon: Icon, label }) => (
          <motion.button
            key={key}
            whileTap={{ scale: 0.92 }}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-interface font-medium text-sm touch-manipulation transition-all
              ${tab === key ? 'bg-primary text-white' : 'kiosk-surface border border-white/[0.08] text-white/50'}`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </motion.button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-6 pb-4" style={{ WebkitOverflowScrolling: 'touch' }}>
        <AnimatePresence>
          {displayed.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-40 gap-3">
              <Mic2 className="w-10 h-10 text-white/15" />
              <p className="font-interface text-white/30 text-lg">Keine Einträge</p>
            </motion.div>
          ) : (
            displayed.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`kiosk-surface rounded-2xl p-5 mb-3 border flex gap-4
                  ${entry.is_highlight ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/[0.06]'}`}
              >
                {/* Time */}
                <div className="flex-shrink-0 w-16 text-right">
                  <p className="font-display font-bold text-primary text-lg leading-tight">
                    {moment(entry.start_time).format('HH:mm')}
                  </p>
                  {entry.end_time && (
                    <p className="font-interface text-white/30 text-xs">
                      {moment(entry.end_time).format('HH:mm')}
                    </p>
                  )}
                </div>
                {/* Divider */}
                <div className="w-px bg-white/[0.08] flex-shrink-0" />
                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start gap-2 flex-wrap">
                    <p className="font-display font-bold text-white text-base leading-tight flex-1">{getTitle(entry)}</p>
                    {entry.is_highlight && <Star className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" />}
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {entry.stage && (
                      <span className="font-interface text-white/40 text-xs">📍 {entry.stage}</span>
                    )}
                    {entry.category && (
                      <span className={`font-interface text-xs px-2 py-0.5 rounded-lg ${categoryColors[entry.category] || categoryColors.sonstiges}`}>
                        {entry.category}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* QR */}
      <div className="flex-none px-6 pb-28 flex justify-center">
        <QRHandoff label="Programm aufs Handy laden" url={event?.website_url || 'https://agra-leipzig.de'} />
      </div>
    </div>
  );
}