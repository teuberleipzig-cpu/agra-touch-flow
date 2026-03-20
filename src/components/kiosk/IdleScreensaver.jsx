import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useKiosk } from './KioskContext';

// Lokale Fallback-Bilder – liegen in /public/assets/
// Ersetze diese Dateien durch echte AGRA-Fotos.
const FALLBACK_IMAGES = [
  '/assets/screensaver-1.jpg',
  '/assets/screensaver-2.jpg',
  '/assets/screensaver-3.jpg',
];

export default function IdleScreensaver() {
  const { config, resetIdle, setIsIdle } = useKiosk();
  const [currentIndex, setCurrentIndex] = useState(0);
  const images = config?.slideshow_images?.length > 0
    ? config.slideshow_images.map(i => i.url)
    : FALLBACK_IMAGES;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % images.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [images.length]);

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
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0"
        >
          <img
            src={images[currentIndex]}
            alt=""
            className="w-full h-full object-cover opacity-40"
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