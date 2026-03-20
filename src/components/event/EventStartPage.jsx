import React from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, Search, CalendarDays, Info } from 'lucide-react';
import { useKiosk } from '../kiosk/KioskContext';
import BeaconHeader from '../kiosk/BeaconHeader';
import KioskButton from '../kiosk/KioskButton';
import LanguageSelector from '../kiosk/LanguageSelector';
import moment from 'moment';

export default function EventStartPage({ onNavigate }) {
  const { t, activeEvent, language } = useKiosk();
  
  const eventName = activeEvent
    ? (language === 'en' && activeEvent.title_en ? activeEvent.title_en : activeEvent.title)
    : 'Event';

  const eventDate = activeEvent
    ? moment(activeEvent.start_date).format('DD.MM.YYYY')
    : '';

  return (
    <div className="h-screen flex flex-col relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        {activeEvent?.image_url ? (
          <img src={activeEvent.image_url} alt="" className="w-full h-full object-cover opacity-15" />
        ) : (
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b172c2003bd9c2d72412a9/9d27f0253_generated_d1eb80dd.png" alt="" className="w-full h-full object-cover opacity-15" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <BeaconHeader subtitle={eventDate} />

        {/* Event branding */}
        <div className="px-8 pt-4 pb-8">
          {activeEvent?.logo_url && (
            <img src={activeEvent.logo_url} alt="" className="h-20 object-contain mb-6" />
          )}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display font-extrabold text-5xl text-foreground leading-tight"
          >
            {eventName}
          </motion.h1>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            className="w-24 h-1 bg-primary rounded-full mt-4 origin-left"
          />
        </div>

        {/* Navigation buttons */}
        <div className="flex-1 flex flex-col justify-center px-8 gap-4">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <KioskButton icon={LayoutGrid} label={t('standplan')} variant="primary" onClick={() => onNavigate('standplan')} className="w-full" />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <KioskButton icon={Search} label={t('searchExhibitor')} variant="glass" onClick={() => onNavigate('exhibitors')} className="w-full" />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
            <KioskButton icon={CalendarDays} label={t('program')} variant="glass" onClick={() => onNavigate('program')} className="w-full" />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
            <KioskButton icon={Info} label={t('service')} variant="glass" onClick={() => onNavigate('eventService')} className="w-full" />
          </motion.div>
        </div>

        <div className="pb-8 px-8 flex justify-center">
          <LanguageSelector />
        </div>
      </div>
    </div>
  );
}