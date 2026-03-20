import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ScrollText, Phone, MapPinned, Train, ChevronRight, ArrowLeft } from 'lucide-react';
import { useKiosk } from '../kiosk/KioskContext';
import BeaconHeader from '../kiosk/BeaconHeader';

const SERVICE_SECTIONS = [
  { key: 'openingHours', icon: Clock },
  { key: 'venueRules', icon: ScrollText },
  { key: 'contact', icon: Phone },
  { key: 'directions', icon: MapPinned },
  { key: 'publicTransport', icon: Train },
];

const CONTENT = {
  openingHours: {
    de: [
      { label: 'Montag – Freitag', value: '08:00 – 20:00 Uhr' },
      { label: 'Samstag', value: '09:00 – 18:00 Uhr' },
      { label: 'Sonntag', value: '10:00 – 16:00 Uhr' },
      { label: 'Feiertage', value: 'Geschlossen' },
    ],
    en: [
      { label: 'Monday – Friday', value: '08:00 – 20:00' },
      { label: 'Saturday', value: '09:00 – 18:00' },
      { label: 'Sunday', value: '10:00 – 16:00' },
      { label: 'Public Holidays', value: 'Closed' },
    ],
  },
  contact: {
    de: [
      { label: 'Telefon', value: '+49 341 678 8000' },
      { label: 'E-Mail', value: 'info@agra-leipzig.de' },
      { label: 'Adresse', value: 'Bornaische Str. 210, 04279 Leipzig' },
    ],
    en: [
      { label: 'Phone', value: '+49 341 678 8000' },
      { label: 'Email', value: 'info@agra-leipzig.de' },
      { label: 'Address', value: 'Bornaische Str. 210, 04279 Leipzig' },
    ],
  },
  publicTransport: {
    de: [
      { label: 'Tram 11', value: 'Richtung Markkleeberg · Nächste: 5 min' },
      { label: 'Tram 11', value: 'Richtung Zentrum · Nächste: 8 min' },
      { label: 'Bus 70', value: 'Richtung Connewitz · Nächste: 12 min' },
    ],
    en: [
      { label: 'Tram 11', value: 'To Markkleeberg · Next: 5 min' },
      { label: 'Tram 11', value: 'To City Center · Next: 8 min' },
      { label: 'Bus 70', value: 'To Connewitz · Next: 12 min' },
    ],
  },
  venueRules: {
    de: [
      { label: '🚭', value: 'Rauchen nur in ausgewiesenen Bereichen' },
      { label: '🐕', value: 'Hunde nur an der Leine' },
      { label: '📸', value: 'Fotografieren für privaten Gebrauch erlaubt' },
      { label: '🍺', value: 'Keine eigenen alkoholischen Getränke' },
    ],
    en: [
      { label: '🚭', value: 'Smoking only in designated areas' },
      { label: '🐕', value: 'Dogs must be on a leash' },
      { label: '📸', value: 'Photography for private use permitted' },
      { label: '🍺', value: 'No outside alcoholic beverages' },
    ],
  },
  directions: {
    de: [
      { label: 'Auto', value: 'A38, Abfahrt Leipzig-Süd, B2 Richtung Markkleeberg' },
      { label: 'Bahn', value: 'Leipzig Hbf → Tram 11 bis Haltestelle AGRA' },
      { label: 'Parken', value: 'Kostenlose Parkplätze auf dem Gelände' },
    ],
    en: [
      { label: 'Car', value: 'A38, Exit Leipzig-Süd, B2 towards Markkleeberg' },
      { label: 'Train', value: 'Leipzig Hbf → Tram 11 to AGRA stop' },
      { label: 'Parking', value: 'Free parking on venue grounds' },
    ],
  },
};

export default function ServicePage() {
  const { t, language } = useKiosk();
  const [selectedSection, setSelectedSection] = useState(null);

  const getContent = (key) => {
    const content = CONTENT[key];
    if (!content) return [];
    return content[language] || content['en'] || content['de'] || [];
  };

  if (selectedSection) {
    const items = getContent(selectedSection);
    const sectionInfo = SERVICE_SECTIONS.find(s => s.key === selectedSection);

    return (
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        className="h-screen flex flex-col overflow-hidden"
      >
        <BeaconHeader subtitle={t('service')} />

        <div className="px-8 pb-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedSection(null)}
            className="flex items-center gap-3 text-primary font-interface text-lg touch-manipulation mb-6"
          >
            <ArrowLeft className="w-6 h-6" />
            {t('back')}
          </motion.button>

          <div className="flex items-center gap-4 mb-8">
            {sectionInfo && <sectionInfo.icon className="w-10 h-10 text-primary" />}
            <h2 className="font-display font-bold text-4xl text-foreground">{t(selectedSection)}</h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 pb-28 space-y-4">
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="kiosk-surface rounded-2xl p-6 border border-white/[0.06]"
            >
              <p className="font-interface text-base text-primary/60 mb-1">{item.label}</p>
              <p className="font-interface text-xl text-foreground font-medium">{item.value}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <BeaconHeader subtitle={t('service')} />

      <div className="flex-1 px-6 pb-28 space-y-4 overflow-y-auto">
        {SERVICE_SECTIONS.map((section, i) => (
          <motion.button
            key={section.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileTap={{ scale: 0.98, y: 2 }}
            onClick={() => setSelectedSection(section.key)}
            className="w-full kiosk-surface rounded-2xl px-8 py-7 border border-white/[0.06] flex items-center justify-between touch-manipulation"
          >
            <div className="flex items-center gap-5">
              <section.icon className="w-10 h-10 text-primary/80" />
              <span className="font-display font-bold text-2xl text-foreground">{t(section.key)}</span>
            </div>
            <ChevronRight className="w-8 h-8 text-muted-foreground" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}