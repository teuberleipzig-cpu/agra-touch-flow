import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import moment from 'moment';
import 'moment/locale/de';

moment.locale('de');

const FALLBACK_SLIDES = [
  {
    title: 'AGRA Messepark Leipzig',
    subtitle: 'Ihr Veranstaltungsgelände in Markkleeberg',
    date: null,
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80',
  },
];

export default function EventSlider({ events = [] }) {
  const [index, setIndex] = useState(0);

  const slides = events.length > 0
    ? events.map(e => ({
        title: e.title,
        subtitle: e.description ? e.description.slice(0, 120) + '…' : null,
        date: e.start_date,
        image: e.image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80',
        link: e.website_url,
      }))
    : FALLBACK_SLIDES;

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setIndex(i => (i + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [slides.length]);

  const current = slides[index];

  return (
    <div className="relative w-full h-full overflow-hidden rounded-none select-none">
      {/* Image layer */}
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        >
          <img
            src={current.image}
            alt={current.title}
            className="w-full h-full object-cover"
            onError={e => { e.target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80'; }}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/20" />
        </motion.div>
      </AnimatePresence>

      {/* Event info */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`info-${index}`}
          className="absolute bottom-0 left-0 right-0 px-8 pb-8 pt-16"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {current.date && (
            <div className="inline-flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="font-interface text-primary text-lg font-semibold tracking-wide uppercase">
                {moment(current.date).format('dddd, D. MMMM YYYY')}
              </span>
            </div>
          )}
          <h2 className="font-display font-extrabold text-white leading-tight"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
            {current.title}
          </h2>
        </motion.div>
      </AnimatePresence>

      {/* Dot indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 right-8 flex gap-2 items-center">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`rounded-full transition-all duration-300 touch-manipulation ${
                i === index
                  ? 'w-6 h-2 bg-primary'
                  : 'w-2 h-2 bg-white/30'
              }`}
            />
          ))}
        </div>
      )}

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/10">
        <motion.div
          key={index}
          className="h-full bg-primary/60"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 6, ease: 'linear' }}
        />
      </div>
    </div>
  );
}