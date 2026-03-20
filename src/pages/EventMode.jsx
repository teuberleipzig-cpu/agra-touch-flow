import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { KioskProvider, useKiosk } from '../components/kiosk/KioskContext';
import LanguageSelector from '../components/kiosk/LanguageSelector';
import IdleScreensaver from '../components/kiosk/IdleScreensaver';

import EventModeStartPage from '../components/event/EventModeStartPage';
import EventStandplanPage from '../components/event/EventStandplanPage';
import EventProgramPage from '../components/event/EventProgramPage';
import EventServicePage from '../components/event/EventServicePage';
import EventsPage from '../components/week/EventsPage';

function EventApp() {
  const { isIdle, resetIdle } = useKiosk();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState('home');
  const [history, setHistory] = useState([]);
  const [activeEvent, setActiveEvent] = useState(null);

  useEffect(() => {
    base44.entities.Event.list('start_date', 50).then(events => {
      if (!events.length) return;

      const now = new Date();
      // Day of week: 0=Sun, 1=Mon, ..., 6=Sat
      const dow = now.getDay();

      // Find an event that is currently running OR whose weekend window covers today
      // (event on Fri → show Fri+Sat+Sun)
      const running = events.find(ev => {
        const start = new Date(ev.start_date);
        // Extend end: if no end_date, use end of the following Sunday after start
        let end = ev.end_date ? new Date(ev.end_date) : new Date(ev.start_date);
        end = new Date(end);
        end.setHours(23, 59, 59, 999);
        // Extend to next Sunday
        const daysUntilSun = (7 - end.getDay()) % 7;
        end.setDate(end.getDate() + daysUntilSun);
        return now >= start && now <= end;
      });

      if (running) {
        setActiveEvent(running);
        return;
      }

      // Otherwise pick next upcoming event
      const upcoming = events
        .filter(ev => new Date(ev.start_date) > now)
        .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

      if (upcoming.length > 0) setActiveEvent(upcoming[0]);
      else setActiveEvent(events[events.length - 1]); // fallback: most recent
    });
  }, []);

  useEffect(() => {
    if (isIdle) {
      setCurrentPage('home');
      setHistory([]);
    }
  }, [isIdle]);

  const nav = useCallback((page) => {
    resetIdle();
    setHistory(prev => [...prev, currentPage]);
    setCurrentPage(page);
  }, [currentPage, resetIdle]);

  const goBack = useCallback(() => {
    resetIdle();
    if (history.length > 0) {
      setCurrentPage(history[history.length - 1]);
      setHistory(h => h.slice(0, -1));
    }
  }, [history, resetIdle]);

  const isHome = currentPage === 'home';

  const renderPage = () => {
    switch (currentPage) {
      case 'home':       return <EventModeStartPage event={activeEvent} onNavigate={nav} />;
      case 'standplan':  return <EventStandplanPage event={activeEvent} />;
      case 'program':    return <EventProgramPage event={activeEvent} />;
      case 'events':     return <EventsPage />;
      case 'service':    return <EventServicePage />;
      default:           return <EventModeStartPage event={activeEvent} onNavigate={nav} />;
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-background relative">
      <AnimatePresence mode="wait">
        {isIdle ? (
          <IdleScreensaver key="screensaver" />
        ) : (
          <motion.div
            key={currentPage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {renderPage()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom bar on sub-pages */}
      {!isHome && !isIdle && (
        <div className="fixed bottom-0 left-0 right-0 z-[60] pb-6 px-6">
          <div className="max-w-2xl mx-auto">
            <div className="kiosk-surface rounded-3xl px-6 py-4 flex items-center justify-between backdrop-blur-xl border border-white/[0.08]">
              <div className="flex items-center gap-3">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={goBack}
                  className="w-14 h-14 rounded-xl kiosk-surface border border-white/[0.06] flex items-center justify-center text-muted-foreground touch-manipulation"
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => { resetIdle(); setCurrentPage('home'); setHistory([]); }}
                  className="w-14 h-14 rounded-xl kiosk-surface border border-white/[0.06] flex items-center justify-center text-primary touch-manipulation"
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => navigate('/Menu')}
                  className="flex items-center gap-2 px-4 py-2 h-14 rounded-xl kiosk-surface border border-white/[0.06] text-white/60 hover:text-white transition-colors touch-manipulation"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                  <span className="font-interface text-sm font-medium">Menü</span>
                </motion.button>
              </div>
              <LanguageSelector />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EventMode() {
  return (
    <KioskProvider>
      <EventApp />
    </KioskProvider>
  );
}