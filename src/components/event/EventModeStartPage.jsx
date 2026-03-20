import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Mic2, CalendarDays, Info, LayoutGrid } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useKiosk } from '../kiosk/KioskContext';
import LanguageSelector from '../kiosk/LanguageSelector';
import moment from 'moment';
import 'moment/locale/de';

moment.locale('de');

const NAV_BUTTONS = [
  { key: 'standplan',  icon: MapPin,        label: 'Standplan',               sub: 'wie Geländeplan\nnur mit Ständen' },
  { key: 'program',    icon: Mic2,           label: 'Programm',                sub: '' },
  { key: 'events',     icon: CalendarDays,   label: 'Kommende\nVeranstaltungen', sub: '' },
  { key: 'service',    icon: Info,           label: 'Service &\nInformation',   sub: '' },
];

// Preview cards for each section with stock images
const PREVIEW_CARDS = [
  {
    key: 'standplan',
    label: 'Standplan',
    icon: MapPin,
    image: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800&q=80',
  },
  {
    key: 'program',
    label: 'Programm',
    icon: Mic2,
    image: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&q=80',
  },
  {
    key: 'events',
    label: 'Kommende Veranstaltungen',
    icon: CalendarDays,
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80',
  },
  {
    key: 'service',
    label: 'Service & Information',
    icon: Info,
    image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&q=80',
  },
];

export default function EventModeStartPage({ event, onNavigate }) {
  const { language } = useKiosk();
  const navigate = useNavigate();
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  // Touch swipe logic
  const swipeStartX = useRef(null);
  const containerRef = useRef(null);

  const title = event
    ? (language === 'en' && event.title_en) || (language === 'ar' && event.title_ar) || (language === 'uk' && event.title_uk) || event.title
    : 'Kein aktives Event';

  const accentColor = event?.brand_color || '#2F6F5E';

  const handleTouchStart = (e) => {
    swipeStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (swipeStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - swipeStartX.current;
    if (Math.abs(dx) > 50) {
      if (dx < 0) setActiveCardIndex(i => Math.min(i + 1, PREVIEW_CARDS.length - 1));
      else setActiveCardIndex(i => Math.max(i - 1, 0));
    }
    swipeStartX.current = null;
  };

  const activeCard = PREVIEW_CARDS[activeCardIndex];

  return (
    <div className="h-screen flex flex-col bg-[#08090B] overflow-hidden">

      {/* Background image */}
      {event?.image_url && (
        <div className="absolute inset-0 z-0">
          <img src={event.image_url} alt="" className="w-full h-full object-cover opacity-8" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#08090B]/70 via-[#08090B]/85 to-[#08090B]" />
        </div>
      )}

      {/* TOP BAR */}
      <div className="relative z-10 flex-none flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          {event?.logo_url ? (
            <img src={event.logo_url} alt="Logo" className="h-9 w-auto object-contain" />
          ) : (
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: accentColor }}>
              <span className="font-display font-black text-white text-base">A</span>
            </div>
          )}
          <div>
            <p className="font-display font-bold text-white text-base leading-tight tracking-tight">AGRA</p>
            <p className="font-interface text-white/40 text-xs tracking-widest uppercase leading-none">Messepark Leipzig</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => navigate('/Menu')}
            className="flex items-center gap-2 px-3 py-2 rounded-xl kiosk-surface border border-white/[0.08] text-white/60 hover:text-white transition-colors touch-manipulation"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="font-interface text-sm font-medium">Menü</span>
          </motion.button>
          <LanguageSelector />
        </div>
      </div>

      {/* ACCENT BAR */}
      <div className="relative z-10 flex-none h-0.5" style={{ backgroundColor: accentColor, opacity: 0.7 }} />

      {/* EVENT TITLE */}
      <div className="relative z-10 flex-none px-6 pt-5 pb-3">
        <h1
          className="font-display font-extrabold text-white tracking-tight leading-none uppercase"
          style={{
            fontSize: 'clamp(1.8rem, 7vw, 3rem)',
            borderLeft: `5px solid ${accentColor}`,
            paddingLeft: '14px',
          }}
        >
          {title}
        </h1>
      </div>

      {/* SWIPE CARD AREA */}
      <div className="relative z-10 flex-1 min-h-0 px-6 pb-3">
        <div
          ref={containerRef}
          className="w-full h-full rounded-3xl overflow-hidden border border-white/[0.08] relative"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: 'pan-y' }}
        >
          <AnimatePresence mode="wait">
            <motion.button
              key={activeCard.key}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              onClick={() => onNavigate(activeCard.key)}
              className="absolute inset-0 touch-manipulation focus:outline-none"
            >
              {/* Stock image background */}
              <img src={activeCard.image} alt={activeCard.label} className="absolute inset-0 w-full h-full object-cover" />
              {/* Dark overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

              {/* Bottom label */}
              <div className="absolute inset-x-0 bottom-0 px-6 pb-8 z-10">
                <div className="flex items-center gap-3 mb-2">
                  <activeCard.icon className="w-6 h-6 text-white/80" strokeWidth={1.5} />
                  <p className="font-display font-extrabold text-white text-2xl">{activeCard.label}</p>
                </div>
                <p className="font-interface text-white/50 text-sm">Tippen zum Öffnen →</p>
              </div>
            </motion.button>
          </AnimatePresence>

          {/* Dot indicators */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
            {PREVIEW_CARDS.map((_, i) => (
              <motion.button
                key={i}
                onClick={() => setActiveCardIndex(i)}
                className={`rounded-full touch-manipulation transition-all ${i === activeCardIndex ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/30'}`}
              />
            ))}
          </div>

          {/* Left / Right swipe hint arrows */}
          {activeCardIndex > 0 && (
            <button
              onClick={() => setActiveCardIndex(i => i - 1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/60 touch-manipulation z-20"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
          )}
          {activeCardIndex < PREVIEW_CARDS.length - 1 && (
            <button
              onClick={() => setActiveCardIndex(i => i + 1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/60 touch-manipulation z-20"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          )}
        </div>
      </div>

      {/* BOTTOM 4 BUTTONS */}
      <div className="relative z-10 flex-none px-4 pb-5 grid grid-cols-4 gap-2">
        {NAV_BUTTONS.map(({ key, icon: Icon, label }) => (
          <motion.button
            key={key}
            whileTap={{ scale: 0.92 }}
            onClick={() => onNavigate(key)}
            className={`
              flex flex-col items-center justify-center gap-2 rounded-2xl border py-4 px-1 touch-manipulation transition-all
              ${activeCardIndex === PREVIEW_CARDS.findIndex(c => c.key === key)
                ? 'bg-white/[0.1] border-white/30'
                : 'kiosk-surface border-white/[0.08]'
              }
            `}
          >
            <Icon className="w-6 h-6 text-white/70" strokeWidth={1.5} />
            <span className="font-interface text-white/70 text-center leading-tight whitespace-pre-line"
              style={{ fontSize: 'clamp(0.55rem, 1.8vw, 0.72rem)' }}>
              {label}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}