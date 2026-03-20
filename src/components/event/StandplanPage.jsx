import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Coffee, Bath, Info, DoorOpen, QrCode } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useKiosk } from '../kiosk/KioskContext';
import BeaconHeader from '../kiosk/BeaconHeader';
import QRHandoff from '../kiosk/QRHandoff';

const QUICK_FILTERS = [
  { key: 'wc', icon: Bath, label: 'WC' },
  { key: 'coffee', icon: Coffee, label: 'Café' },
  { key: 'info', icon: Info, label: 'Info' },
  { key: 'exit', icon: DoorOpen, label: 'Exit' },
];

export default function StandplanPage() {
  const { t, activeEvent } = useKiosk();
  const [exhibitors, setExhibitors] = useState([]);
  const [selectedExhibitor, setSelectedExhibitor] = useState(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const load = async () => {
      if (activeEvent?.id) {
        const data = await base44.entities.Exhibitor.filter({ event_id: activeEvent.id });
        setExhibitors(data);
      } else {
        const data = await base44.entities.Exhibitor.list();
        setExhibitors(data);
      }
    };
    load();
  }, [activeEvent?.id]);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <BeaconHeader subtitle={t('standplan')} />

      {/* Quick filters sidebar */}
      <div className="absolute right-4 top-24 z-20 flex flex-col gap-2">
        {QUICK_FILTERS.map(f => (
          <motion.button
            key={f.key}
            whileTap={{ scale: 0.9 }}
            className="w-14 h-14 rounded-xl kiosk-surface border border-white/[0.08] flex items-center justify-center text-muted-foreground hover:text-primary touch-manipulation backdrop-blur-xl"
          >
            <f.icon className="w-6 h-6" />
          </motion.button>
        ))}
      </div>

      {/* Map area */}
      <div className="flex-1 mx-4 mb-4 relative rounded-3xl kiosk-surface border border-white/[0.06] overflow-hidden">
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b172c2003bd9c2d72412a9/9d27f0253_generated_d1eb80dd.png"
          alt="Hall plan"
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />

        <div
          className="absolute inset-0 p-8"
          style={{ transform: `scale(${scale})`, transformOrigin: 'center', transition: 'transform 0.3s ease' }}
        >
          {/* Hall grid overlay */}
          <div className="absolute inset-8 grid grid-cols-4 grid-rows-6 gap-2">
            {exhibitors.map(ex => (
              <motion.button
                key={ex.id}
                whileTap={{ scale: 1.1 }}
                onClick={() => setSelectedExhibitor(selectedExhibitor?.id === ex.id ? null : ex)}
                className={`rounded-lg border-2 flex items-center justify-center p-2 touch-manipulation transition-all
                  ${selectedExhibitor?.id === ex.id
                    ? 'border-primary bg-primary/20 cyan-glow'
                    : 'border-white/[0.1] kiosk-surface hover:border-primary/30'
                  }`}
                style={{
                  gridColumn: `span 1`,
                  gridRow: `span 1`,
                }}
              >
                <div className="text-center">
                  <p className="font-interface text-xs font-bold text-foreground truncate">{ex.name}</p>
                  <p className="font-interface text-[10px] text-primary/60">{ex.stand_number}</p>
                </div>
              </motion.button>
            ))}
          </div>

          {/* You are here */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <div className="relative">
              <div className="w-6 h-6 rounded-full bg-primary animate-beacon-pulse absolute -inset-1" />
              <MapPin className="w-10 h-10 text-primary relative z-10" fill="currentColor" />
            </div>
            <span className="mt-2 font-interface text-sm font-bold text-primary bg-background/90 px-3 py-1 rounded-lg">
              {t('youAreHere')}
            </span>
          </div>
        </div>

        {/* Zoom */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setScale(Math.min(scale + 0.3, 2))}
            className="w-14 h-14 rounded-xl kiosk-surface border border-white/[0.1] flex items-center justify-center text-2xl font-bold text-foreground touch-manipulation backdrop-blur-xl">+</motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setScale(Math.max(scale - 0.3, 0.7))}
            className="w-14 h-14 rounded-xl kiosk-surface border border-white/[0.1] flex items-center justify-center text-2xl font-bold text-foreground touch-manipulation backdrop-blur-xl">−</motion.button>
        </div>

        {/* Selected exhibitor detail */}
        <AnimatePresence>
          {selectedExhibitor && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="absolute bottom-4 left-4 right-4 kiosk-surface backdrop-blur-xl rounded-2xl p-6 border border-primary/20 z-10"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display font-bold text-2xl text-foreground">{selectedExhibitor.name}</h3>
                  <p className="text-primary font-interface mt-1">{t('stand')} {selectedExhibitor.stand_number} · {t('hall')} {selectedExhibitor.hall}</p>
                  {selectedExhibitor.description && (
                    <p className="text-muted-foreground font-interface mt-2 text-base">{selectedExhibitor.description}</p>
                  )}
                </div>
                {selectedExhibitor.website_url && (
                  <div className="flex-shrink-0 ml-4">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(selectedExhibitor.website_url)}&bgcolor=0A0A0C&color=00F3FF`}
                      alt="QR"
                      className="w-20 h-20 rounded-lg"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* QR */}
      <div className="px-6 pb-28 flex justify-center">
        <QRHandoff label={t('downloadMap')} url="https://agra-leipzig.de/standplan" />
      </div>
    </div>
  );
}