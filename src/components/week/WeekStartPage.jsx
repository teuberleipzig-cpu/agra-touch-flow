import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, CalendarDays, Info } from 'lucide-react';
import { getWeekEvents } from '@/services/events/getWeekEvents.js';
import { useKiosk } from '../kiosk/KioskContext';
import { useEventTranslation } from '@/hooks/useEventTranslation.js';
import LanguageSelector from '../kiosk/LanguageSelector';
import EventSlider from './EventSlider';

const NAV_BUTTONS = [
  { key: 'venueMap', icon: MapPin, labelKey: 'venueMap' },
  { key: 'events', icon: CalendarDays, labelKey: 'events', primary: true },
  { key: 'service', icon: Info, labelKey: 'service' },
];

export default function WeekStartPage({ onNavigate }) {
  const { t } = useKiosk();
  const [events, setEvents] = useState([]);
  const { translatedEvents } = useEventTranslation(events);

  useEffect(() => {
    getWeekEvents().then(setEvents);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-[#08090B] overflow-hidden">

      {/* ── TOP BAR ── */}
      <div className="flex-none flex items-center justify-between px-8 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <span className="font-display font-black text-white text-lg leading-none">A</span>
          </div>
          <div>
            <p className="font-display font-bold text-white text-xl leading-tight tracking-tight">AGRA</p>
            <p className="font-interface text-white/40 text-xs tracking-widest uppercase leading-none">Messepark Leipzig</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSelector />
        </div>
      </div>

      {/* ── MAIN SLIDER ── */}
      <div className="flex-1 min-h-0">
        <EventSlider events={translatedEvents} />
      </div>

      {/* ── BOTTOM NAVIGATION ── */}
      <div className="flex-none px-5 py-5 grid grid-cols-3 gap-3">
        {NAV_BUTTONS.map(({ key, icon: Icon, labelKey, primary }) => (
          <motion.button
            key={key}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate(key)}
            className={`
              relative flex flex-col items-center justify-center gap-3
              rounded-2xl border bg-gradient-to-b
              py-6 px-2 touch-manipulation transition-colors duration-200
              ${primary
                ? 'from-primary/20 to-primary/5 border-primary/30 hover:border-primary/60 ring-1 ring-primary/20'
                : 'from-white/10 to-white/5 border-white/10 hover:border-white/25'
              }
            `}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center
              ${primary ? 'bg-primary/15' : 'bg-white/[0.06]'}`}>
              <Icon className={`w-7 h-7 ${primary ? 'text-primary' : 'text-white/70'}`} strokeWidth={1.5} />
            </div>
            <span className={`font-interface font-semibold text-center leading-tight
              ${primary ? 'text-white' : 'text-white/70'}`}
              style={{ fontSize: 'clamp(0.7rem, 2vw, 0.85rem)' }}>
              {t(labelKey)}
            </span>
            {primary && (
              <div className="absolute inset-0 rounded-2xl ring-1 ring-primary/10 pointer-events-none" />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}