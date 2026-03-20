import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useKiosk } from '../kiosk/KioskContext';
import EventDetail from './EventDetail.jsx';
import moment from 'moment';
import 'moment/locale/de';

moment.locale('de');

export default function EventsPage() {
  const { language } = useKiosk();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    base44.functions.invoke('scrapeAgraEvents', {})
      .then(res => setEvents(res.data?.events || []))
      .catch(() => base44.entities.Event.list('start_date', 20).then(setEvents))
      .finally(() => setLoading(false));
  }, []);

  const getTitle = (e) => {
    if (!e) return '';
    if (language === 'en' && e.title_en) return e.title_en;
    if (language === 'ar' && e.title_ar) return e.title_ar;
    if (language === 'uk' && e.title_uk) return e.title_uk;
    return e.title;
  };

  const getDesc = (e) => {
    if (!e) return '';
    if (language === 'en' && e.description_en) return e.description_en;
    if (language === 'ar' && e.description_ar) return e.description_ar;
    if (language === 'uk' && e.description_uk) return e.description_uk;
    return e.description;
  };

  if (selectedEvent) {
    return (
      <EventDetail
        event={selectedEvent}
        getTitle={getTitle}
        getDesc={getDesc}
        onBack={() => setSelectedEvent(null)}
      />
    );
  }

  const active = events[activeIndex];

  return (
    <div className="h-screen flex flex-col bg-background" style={{ overflow: 'hidden', touchAction: 'pan-y' }}>

      {/* ── HEADER ── */}
      <div className="flex-none px-7 pt-7 pb-4">
        <h1 className="font-display font-extrabold text-white leading-none tracking-tight"
            style={{ fontSize: 'clamp(1.6rem, 5vw, 2.4rem)' }}>
          Nächste Veranstaltungen
        </h1>
        <p className="font-interface text-white/35 text-base mt-1">
          Alle kommenden Events im AGRA Messepark Leipzig
        </p>
      </div>

      {/* ── FEATURED FLYER (big area) ── */}
      <div className="flex-1 min-h-0 px-5 pb-3">
        {loading ? (
          <div className="w-full h-full rounded-2xl border border-white/[0.08] bg-white/[0.03] flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        ) : active ? (
          <motion.button
            key={activeIndex}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
            whileTap={{ scale: 0.985 }}
            onClick={() => setSelectedEvent(active)}
            className="w-full h-full rounded-2xl overflow-hidden border border-white/[0.08] relative touch-manipulation focus:outline-none block"
          >
            {active.image_url ? (
              <img
                src={active.image_url}
                alt={getTitle(active)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-white/[0.04] flex flex-col items-center justify-center gap-4">
                <CalendarDays className="w-16 h-16 text-white/15" />
                <p className="font-display font-bold text-white/20 text-2xl text-center px-8">{getTitle(active)}</p>
              </div>
            )}

            {/* Gradient overlay at bottom */}
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent" />

            {/* Event info overlay */}
            <div className="absolute inset-x-0 bottom-0 px-6 pb-6">
              <p className="font-interface text-primary font-semibold text-sm uppercase tracking-widest mb-1">
                {moment(active.start_date).format('D. MMMM YYYY')}
              </p>
              <h2 className="font-display font-extrabold text-white leading-tight"
                  style={{ fontSize: 'clamp(1.3rem, 4vw, 2rem)' }}>
                {getTitle(active)}
              </h2>
            </div>

            {/* Tap hint */}
            <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5">
              <span className="font-interface text-white/70 text-xs font-semibold">Mehr Infos</span>
              <ChevronRight className="w-3 h-3 text-white/50" />
            </div>
          </motion.button>
        ) : (
          <div className="w-full h-full rounded-2xl border border-white/[0.08] bg-white/[0.03] flex items-center justify-center">
            <p className="font-interface text-white/25 text-xl">Keine Veranstaltungen</p>
          </div>
        )}
      </div>

      {/* ── THUMBNAIL STRIP ── */}
      {events.length > 0 && (
        <div className="flex-none px-5 pb-28 relative z-50">
          <div className="flex gap-3 overflow-x-auto pb-3"
               style={{ WebkitOverflowScrolling: 'touch' }}>
            {events.map((event, i) => (
              <motion.button
                key={event.id}
                whileTap={{ scale: 0.92 }}
                onClick={() => setActiveIndex(i)}
                className="flex-shrink-0 flex flex-col items-center gap-1.5 focus:outline-none"
                style={{ width: '144px' }}
              >
                {/* Date label above tile */}
                <span className={`font-interface text-sm font-semibold leading-none text-center
                  ${i === activeIndex ? 'text-primary' : 'text-white/35'}`}>
                  {moment(event.start_date).format('D.M.')}
                </span>

                {/* Tile */}
                <div className={`w-full rounded-xl overflow-hidden border-2 transition-all
                  ${i === activeIndex
                    ? 'border-primary shadow-[0_0_12px_rgba(47,111,94,0.4)]'
                    : 'border-white/[0.08]'}`}
                  style={{ height: '144px' }}>
                  {event.image_url ? (
                    <img
                      src={event.image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center
                      ${i === activeIndex ? 'bg-primary/10' : 'bg-white/[0.04]'}`}>
                      <CalendarDays className={`w-5 h-5 ${i === activeIndex ? 'text-primary' : 'text-white/20'}`} />
                    </div>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}