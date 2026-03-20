import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { KioskProvider, useKiosk } from '../components/kiosk/KioskContext';
import EmergencyOverlay from '../components/kiosk/EmergencyOverlay.jsx';
import IdleScreensaver from '../components/kiosk/IdleScreensaver';
import ControlHub from '../components/kiosk/ControlHub';

// Week mode pages
import WeekStartPage from '../components/week/WeekStartPage';
import VenueMapPage from '../components/week/VenueMapPage';
import EventsPage from '../components/week/EventsPage';
import ServicePage from '../components/week/ServicePage';

// Event mode pages
import EventStartPage from '../components/event/EventStartPage';
import StandplanPage from '../components/event/StandplanPage';
import ExhibitorSearchPage from '../components/event/ExhibitorSearchPage';
import ProgramPage from '../components/event/ProgramPage';
import EventServicePage from '../components/event/EventServicePage';

function KioskApp() {
  const { systemMode, isIdle, resetIdle } = useKiosk();
  const [currentPage, setCurrentPage] = useState('home');
  const [history, setHistory] = useState([]);

  // Reset to home on idle
  useEffect(() => {
    if (isIdle) {
      setCurrentPage('home');
      setHistory([]);
    }
  }, [isIdle]);

  const navigate = useCallback((page) => {
    resetIdle();
    setHistory(prev => [...prev, currentPage]);
    setCurrentPage(page);
  }, [currentPage, resetIdle]);

  const goBack = useCallback(() => {
    resetIdle();
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory(h => h.slice(0, -1));
      setCurrentPage(prev);
    }
  }, [history, resetIdle]);

  const goHome = useCallback(() => {
    resetIdle();
    setCurrentPage('home');
    setHistory([]);
  }, [resetIdle]);

  // Emergency mode overrides everything
  if (systemMode === 'emergency') {
    return <EmergencyOverlay />;
  }

  const isHomePage = currentPage === 'home';

  const renderPage = () => {
    if (systemMode === 'event') {
      switch (currentPage) {
        case 'home': return <EventStartPage onNavigate={navigate} />;
        case 'standplan': return <StandplanPage />;
        case 'exhibitors': return <ExhibitorSearchPage />;
        case 'program': return <ProgramPage />;
        case 'eventService': return <EventServicePage />;
        // Fall through to week mode pages for shared pages
        case 'venueMap': return <VenueMapPage />;
        case 'service': return <ServicePage />;
        default: return <EventStartPage onNavigate={navigate} />;
      }
    }

    // Week mode
    switch (currentPage) {
      case 'home': return <WeekStartPage onNavigate={navigate} />;
      case 'venueMap': return <VenueMapPage />;
      case 'events': return <EventsPage />;
      case 'service': return <ServicePage />;
      default: return <WeekStartPage onNavigate={navigate} />;
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-background relative">
      <AnimatePresence mode="wait">
        {isIdle && !isHomePage ? (
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

      {/* Idle screensaver on home */}
      <AnimatePresence>
        {isIdle && isHomePage && <IdleScreensaver key="home-screensaver" />}
      </AnimatePresence>

      {/* Control hub - shown on non-home pages */}
      {!isHomePage && !isIdle && (
        <ControlHub
          onBack={goBack}
          onHome={goHome}
          showBack={history.length > 0}
        />
      )}
    </div>
  );
}

export default function Home() {
  return (
    <KioskProvider>
      <KioskApp />
    </KioskProvider>
  );
}