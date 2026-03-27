/**
 * IdleScreensaver.jsx
 *
 * Zeigt eine Diashow wenn die Stele idle ist.
 *
 * Zeitplan-Logik:
 *   - Config kann ein "scheduled_override"-Array enthalten
 *   - Jeder Eintrag: { imageUrl, days: [0-6], timeFrom: "HH:MM", timeTo: "HH:MM", label }
 *     (days: 0=Sonntag, 1=Montag, ..., 6=Samstag)
 *   - Wenn gerade ein Override aktiv ist, ersetzt das Bild komplett die Diashow
 *   - Mehrere passende Overrides: der erste gewinnt
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useKiosk } from './KioskContext';

const FALLBACK_IMAGES = [
  '/assets/screensaver-1.jpg',
  '/assets/screensaver-2.jpg',
  '/assets/screensaver-3.jpg',
];

/**
 * Prüft ob ein scheduled_override-Eintrag jetzt aktiv ist.
 * @param {object} override - { days, timeFrom, timeTo }
 * @returns {boolean}
 */
function isOverrideActive(override) {
  if (!override?.days?.length || !override.timeFrom || !override.timeTo) return false;
  const now = new Date();
  const day = now.getDay(); // 0=So, 1=Mo, ...
  if (!override.days.includes(day)) return false;

  const [fH, fM] = override.timeFrom.split(':').map(Number);
  const [tH, tM] = override.timeTo.split(':').map(Number);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const fromMinutes = fH * 60 + fM;
  const toMinutes = tH * 60 + tM;

  // Mitternacht-Überlauf unterstützen (z.B. 22:00 – 02:00)
  if (fromMinutes <= toMinutes) {
    return nowMinutes >= fromMinutes && nowMinutes < toMinutes;
  } else {
    return nowMinutes >= fromMinutes || nowMinutes < toMinutes;
  }
}

export default function IdleScreensaver() {
  const { config, resetIdle, setIsIdle } = useKiosk();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeOverride, setActiveOverride] = useState(null);

  // Zeitplan jede Minute neu prüfen
  useEffect(() => {
    const check = () => {
      const overrides = config?.scheduled_overrides || [];
      const active = overrides.find(o => isOverrideActive(o)) || null;
      setActiveOverride(active);
    };
    check();
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, [config]);

  // Normale Diashow-Bilder
  const slideshowImages = config?.slideshow_images?.length > 0
    ? config.slideshow_images.map(i => i.url)
    : FALLBACK_IMAGES;

  // Wenn Override aktiv: nur dieses eine Bild zeigen
  const images = activeOverride ? [activeOverride.imageUrl] : slideshowImages;

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % images.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [images.length]);

  // Index zurücksetzen wenn sich Bilder ändern
  useEffect(() => {
    setCurrentIndex(0);
  }, [activeOverride]);

  const handleTouch = () => {
    setIsIdle(false);
    resetIdle();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      className="fixed inset-0 z-30 bg-background"
      onClick={handleTouch}
      onTouchStart={handleTouch}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex + '-' + (activeOverride?.imageUrl || 'default')}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0"
        >
          <img
            src={images[currentIndex]}
            alt=""
            className="w-full h-full object-cover opacity-100"
          />
        </motion.div>
      </AnimatePresence>

      {/* AGRA watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <h1 className="font-display font-extrabold text-[200px] text-white/[0.03] tracking-tighter select-none">
          AGRA
        </h1>
      </div>

      {/* Touch to interact */}
      <div className="absolute bottom-32 left-0 right-0 flex justify-center pointer-events-none">
        <motion.div
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="text-center"
        >
          <div className="w-16 h-16 rounded-full border-2 border-primary/30 mx-auto mb-4 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-primary animate-beacon-pulse" />
          </div>
          <p className="font-interface text-xl text-muted-foreground">Touch to start</p>
        </motion.div>
      </div>
    </motion.div>
  );
}
