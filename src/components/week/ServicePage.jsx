import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ScrollText, Phone, MapPinned, Train, ChevronRight, ArrowLeft, Car, TramFront, Globe } from 'lucide-react';
import { useKiosk } from '../kiosk/KioskContext';
import BeaconHeader from '../kiosk/BeaconHeader';

// LVB Stationboard – Echtzeit-Abfahrtsmonitor Haltestelle Döhlitz Straßenbahnhof
const LVB_EMBED_URL =
  'https://stationboard.l.de/monitor/0011426' +
  '?bgh=08090B' +
  '&ch=2F6F5E' +
  '&headertext=D%C3%B6litz%2C%20Stra%C3%9Fenbahnhof' +
  '&showheader=1' +
  '&bgodd=0f1213' +
  '&codd=f0f4f2' +
  '&bgeven=161a1b' +
  '&ceven=f0f4f2' +
  '&bgsh=0f1213' +
  '&csh=2F6F5E' +
  '&numrows=8' +
  '&walktime=0' +
  '&showtrack=0' +
  '&showtransportType=1' +
  '&transporttypes=bahn_bus_sbahn_tram_rufbus';

const SERVICE_SECTIONS = [
  { key: 'openingHours',    icon: Clock },
  { key: 'venueRules',      icon: ScrollText },
  { key: 'contact',         icon: Phone },
  { key: 'directions',      icon: MapPinned },
  { key: 'publicTransport', icon: Train },
];

// Anfahrts-Unterpunkte
const DIRECTION_TYPES = [
  { key: 'car',   icon: Car,   label: 'Auto',        labelEn: 'Car' },
  { key: 'tram',  icon: TramFront, label: 'Straßenbahn', labelEn: 'Tram' },
  { key: 'train', icon: Globe, label: 'Fernverkehr', labelEn: 'Long Distance' },
];

const DIRECTION_CONTENT = {
  car: {
    de: {
      title: 'Anreise mit dem PKW',
      paragraphs: [
        'Für eine Anreise mit dem PKW empfehlen wir die Autobahn A9 Berlin-München oder die A14 Halle-Dresden.',
        'Ab dem Autobahndreieck Parthenau geht es dann weiter über die A38 bis zur Abfahrt Leipzig-Süd, von wo aus Sie über die B2 in Richtung Leipzig bis zum agra Messepark Leipzig fahren können.',
        'Die günstigste Zufahrt von der A9 ist das neue Autobahnkreuz Rippachtal. Von dort können Sie die A38 in Richtung Leipzig bis zur Abfahrt Leipzig-Süd nehmen. Auf der B2 geht es dann weiter in Richtung Leipzig bis zum Gelände der agra.',
        'Ein Verkehrsleitsystem der Stadt Leipzig bietet Ihnen als Orientierungshilfe die Ähre im Kreis mit dem Schriftzug „agra".',
      ],
    },
    en: {
      title: 'Arrival by Car',
      paragraphs: [
        'We recommend the A9 motorway (Berlin–Munich) or the A14 (Halle–Dresden).',
        'From the Parthenau interchange, continue on the A38 to the Leipzig-Süd exit, then take the B2 towards Leipzig to the agra Messepark.',
        'The most convenient approach from the A9 is via the Rippachtal interchange. Take the A38 towards Leipzig to the Leipzig-Süd exit, then continue on the B2 towards Leipzig.',
        'Leipzig\'s traffic guidance system uses the ear of wheat symbol with the "agra" label to help you navigate.',
      ],
    },
  },
  tram: {
    de: {
      title: 'Anreise mit der Straßenbahn',
      paragraphs: [
        'Die Straßenbahnlinie 11 führt direkt zum agra Messepark (Haltestelle: Dölitz, Straßenbahnhof).',
      ],
    },
    en: {
      title: 'Arrival by Tram',
      paragraphs: [
        'Tram line 11 runs directly to the agra Messepark (stop: Dölitz, Straßenbahnhof).',
      ],
    },
  },
  train: {
    de: {
      title: 'Anreise mit dem Fernverkehr',
      paragraphs: [
        'Für Gäste aus ganz Deutschland ist Leipzig bequem mit dem Zug erreichbar.',
        'Ebenfalls wird Leipzig von verschiedensten Fernbussen aus über 100 deutschen Städten angefahren.',
        'Aus weiterer Entfernung können Sie ebenfalls den internationalen Flughafen Leipzig-Halle im Nordwesten der Stadt nutzen, welcher von über 29 Fluggesellschaften angeflogen wird.',
        'Innerhalb von 20 Autominuten können Sie das Stadtzentrum erreichen oder auch per S-Bahn (S5) mühelos die öffentlichen Verkehrsmittel nutzen.',
      ],
    },
    en: {
      title: 'Arrival by Long Distance Transport',
      paragraphs: [
        'Leipzig is easily accessible by train from all over Germany.',
        'Long-distance buses also serve Leipzig from over 100 German cities.',
        'From further afield, you can use the international Leipzig-Halle Airport in the northwest of the city, served by over 29 airlines.',
        'The city centre is just 20 minutes by car, or you can use public transport via the S-Bahn (S5).',
      ],
    },
  },
};

const CONTENT = {
  openingHours: {
    de: [
      { label: 'Montag – Freitag', value: '08:00 – 20:00 Uhr' },
      { label: 'Samstag',          value: '09:00 – 18:00 Uhr' },
      { label: 'Sonntag',          value: '10:00 – 16:00 Uhr' },
      { label: 'Feiertage',        value: 'Geschlossen' },
    ],
    en: [
      { label: 'Monday – Friday', value: '08:00 – 20:00' },
      { label: 'Saturday',        value: '09:00 – 18:00' },
      { label: 'Sunday',          value: '10:00 – 16:00' },
      { label: 'Public Holidays', value: 'Closed' },
    ],
  },
  contact: {
    de: [
      { label: 'Telefon', value: '+49 341 355 850 30' },
      { label: 'E-Mail',  value: 'office@agramessepark.de' },
      { label: 'Adresse', value: 'Bornaische Str. 210, 04279 Leipzig' },
    ],
    en: [
      { label: 'Phone',   value: '+49 341 355 850 30' },
      { label: 'Email',   value: 'office@agramessepark.de' },
      { label: 'Address', value: 'Bornaische Str. 210, 04279 Leipzig' },
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
};

// ── Anfahrt Übersicht – 3 Unterpunkte ────────────────────────────────────────
function DirectionsOverviewPage({ onSelect, onBack, t, language }) {
  return (
    <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}
      className="h-screen flex flex-col overflow-hidden">
      <BeaconHeader subtitle={t('service')} />
      <div className="px-8 pb-4">
        <motion.button whileTap={{ scale: 0.95 }} onClick={onBack}
          className="flex items-center gap-3 text-primary font-interface text-lg touch-manipulation mb-6">
          <ArrowLeft className="w-6 h-6" />{t('back')}
        </motion.button>
        <div className="flex items-center gap-4 mb-8">
          <MapPinned className="w-10 h-10 text-primary" />
          <h2 className="font-display font-bold text-4xl text-foreground">{t('directions')}</h2>
        </div>
      </div>
      <div className="flex-1 px-6 pb-28 space-y-4 overflow-y-auto">
        {DIRECTION_TYPES.map((type, i) => (
          <motion.button key={type.key}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            whileTap={{ scale: 0.98, y: 2 }}
            onClick={() => onSelect(type.key)}
            className="w-full kiosk-surface rounded-2xl px-8 py-7 border border-white/[0.06] flex items-center justify-between touch-manipulation">
            <div className="flex items-center gap-5">
              <type.icon className="w-10 h-10 text-primary/80" />
              <span className="font-display font-bold text-2xl text-foreground">
                {language === 'en' ? type.labelEn : type.label}
              </span>
            </div>
            <ChevronRight className="w-8 h-8 text-muted-foreground" />
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// ── Anfahrt Detail-Seite ──────────────────────────────────────────────────────
function DirectionDetailPage({ typeKey, onBack, t, language }) {
  const typeInfo  = DIRECTION_TYPES.find(d => d.key === typeKey);
  const content   = DIRECTION_CONTENT[typeKey];
  const lang      = content[language] ? language : 'de';
  const { title, paragraphs } = content[lang];

  return (
    <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}
      className="h-screen flex flex-col overflow-hidden">
      <BeaconHeader subtitle={t('service')} />
      <div className="px-8 pb-4">
        <motion.button whileTap={{ scale: 0.95 }} onClick={onBack}
          className="flex items-center gap-3 text-primary font-interface text-lg touch-manipulation mb-6">
          <ArrowLeft className="w-6 h-6" />{t('back')}
        </motion.button>
        <div className="flex items-center gap-4 mb-8">
          {typeInfo && <typeInfo.icon className="w-10 h-10 text-primary" />}
          <h2 className="font-display font-bold text-3xl text-foreground leading-tight">{title}</h2>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-8 pb-28 space-y-4">
        {paragraphs.map((para, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="kiosk-surface rounded-2xl p-6 border border-white/[0.06]">
            <p className="font-interface text-lg text-foreground leading-relaxed">{para}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ── ÖPNV-Seite mit LVB-iFrame ─────────────────────────────────────────────────
function PublicTransportPage({ onBack, t }) {
  return (
    <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}
      className="h-screen flex flex-col overflow-hidden">
      <BeaconHeader subtitle={t('service')} />
      <div className="px-8 pb-3">
        <motion.button whileTap={{ scale: 0.95 }} onClick={onBack}
          className="flex items-center gap-3 text-primary font-interface text-lg touch-manipulation mb-4">
          <ArrowLeft className="w-6 h-6" />{t('back')}
        </motion.button>
        <div className="flex items-center gap-4 mb-4">
          <Train className="w-9 h-9 text-primary" />
          <h2 className="font-display font-bold text-3xl text-foreground">{t('publicTransport')}</h2>
        </div>
      </div>
      <div className="flex-1 min-h-0 px-6 pb-28">
        <div className="w-full h-full rounded-2xl overflow-hidden border border-white/[0.08]">
          <iframe src={LVB_EMBED_URL} title="Abfahrtsmonitor Döhlitz Straßenbahnhof"
            className="w-full h-full" style={{ border: 'none', display: 'block' }} loading="lazy" />
        </div>
      </div>
    </motion.div>
  );
}

// ── Standard-Inhaltsseite ────────────────────────────────────────────────────
function ContentPage({ sectionKey, items, onBack, t }) {
  const sectionInfo = SERVICE_SECTIONS.find(s => s.key === sectionKey);
  return (
    <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}
      className="h-screen flex flex-col overflow-hidden">
      <BeaconHeader subtitle={t('service')} />
      <div className="px-8 pb-4">
        <motion.button whileTap={{ scale: 0.95 }} onClick={onBack}
          className="flex items-center gap-3 text-primary font-interface text-lg touch-manipulation mb-6">
          <ArrowLeft className="w-6 h-6" />{t('back')}
        </motion.button>
        <div className="flex items-center gap-4 mb-8">
          {sectionInfo && <sectionInfo.icon className="w-10 h-10 text-primary" />}
          <h2 className="font-display font-bold text-4xl text-foreground">{t(sectionKey)}</h2>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-8 pb-28 space-y-4">
        {items.map((item, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="kiosk-surface rounded-2xl p-6 border border-white/[0.06]">
            <p className="font-interface text-base text-primary/60 mb-1">{item.label}</p>
            <p className="font-interface text-xl text-foreground font-medium">{item.value}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ── Haupt-ServicePage ─────────────────────────────────────────────────────────
export default function ServicePage() {
  const { t, language } = useKiosk();
  const [selectedSection,   setSelectedSection]   = useState(null);
  const [selectedDirection, setSelectedDirection] = useState(null);

  const getContent = (key) => {
    const content = CONTENT[key];
    if (!content) return [];
    return content[language] || content['en'] || content['de'] || [];
  };

  // ÖPNV
  if (selectedSection === 'publicTransport') {
    return <PublicTransportPage onBack={() => setSelectedSection(null)} t={t} />;
  }

  // Anfahrt Detail
  if (selectedSection === 'directions' && selectedDirection) {
    return (
      <DirectionDetailPage
        typeKey={selectedDirection}
        onBack={() => setSelectedDirection(null)}
        t={t}
        language={language}
      />
    );
  }

  // Anfahrt Übersicht
  if (selectedSection === 'directions') {
    return (
      <DirectionsOverviewPage
        onSelect={(key) => setSelectedDirection(key)}
        onBack={() => setSelectedSection(null)}
        t={t}
        language={language}
      />
    );
  }

  // Alle anderen Sections
  if (selectedSection) {
    return (
      <ContentPage
        sectionKey={selectedSection}
        items={getContent(selectedSection)}
        onBack={() => setSelectedSection(null)}
        t={t}
      />
    );
  }

  // Übersicht
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <BeaconHeader subtitle={t('service')} />
      <div className="flex-1 px-6 pb-28 space-y-4 overflow-y-auto">
        {SERVICE_SECTIONS.map((section, i) => (
          <motion.button key={section.key}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileTap={{ scale: 0.98, y: 2 }}
            onClick={() => setSelectedSection(section.key)}
            className="w-full kiosk-surface rounded-2xl px-8 py-7 border border-white/[0.06] flex items-center justify-between touch-manipulation">
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
