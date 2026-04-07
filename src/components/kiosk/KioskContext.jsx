/**
 * KioskContext.jsx – Base44-unabhängige Version
 *
 * Änderungen gegenüber der Originalversion:
 *   - base44.entities.KioskConfig.list() + .subscribe() ersetzt durch
 *     loadKioskConfig() aus src/config/weekModeConfig.js
 *   - Periodisches Polling alle 30 Sekunden (ersetzt den Base44 Subscribe-Mechanismus)
 *   - base44.entities.Event.filter() entfernt (im Wochenmodus nicht gebraucht)
 *   - base44-Import vollständig entfernt
 *
 * Alles andere (Übersetzungen, Idle-Detection, Sprache, RTL) ist unverändert.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { loadKioskConfig } from '@/config/weekModeConfig.js';

const KioskContext = createContext();

const TRANSLATIONS = {
  de: {
    welcome: "Willkommen auf unserem Veranstaltungsgelände",
    nextEvent: "Nächste Veranstaltung am",
    venueMap: "Geländeplan",
    events: "Veranstaltungen",
    service: "Service & Informationen",
    back: "Zurück",
    home: "Start",
    thisWeek: "Diese Woche",
    nextWeek: "Nächste Woche",
    monthOverview: "Monatsübersicht",
    openingHours: "Öffnungszeiten",
    venueRules: "Hausordnung",
    contact: "Kontakt",
    directions: "Anfahrt",
    publicTransport: "Öffentlicher Nahverkehr",
    downloadMap: "Plan aufs Handy laden",
    scanQR: "QR-Code scannen",
    halls: "Hallen",
    parking: "Parkplätze",
    sanitary: "Sanitär",
    admin: "Verwaltung",
    gastronomy: "Gastronomie",
    youAreHere: "Sie sind hier",
    standplan: "Standplan",
    searchExhibitor: "Aussteller suchen",
    program: "Programm",
    search: "Suchen...",
    stand: "Stand",
    hall: "Halle",
    route: "Route",
    timetable: "Zeitplan",
    stages: "Bühnen",
    highlights: "Highlights",
    today: "Heute",
    toilets: "Toiletten",
    firstAid: "Erste Hilfe",
    emergencyExits: "Notausgänge",
    exitNow: "AUSGANG",
    followArrows: "PFEILEN FOLGEN",
    emergency: "NOTFALL",
    weatherWarning: "WETTERWARNUNG",
    evacuation: "EVAKUIERUNG",
    stayCalm: "Ruhe bewahren",
    noEvents: "Keine Veranstaltungen",
  },
  en: {
    welcome: "Welcome to our event venue",
    nextEvent: "Next event on",
    venueMap: "Venue Map",
    events: "Events",
    service: "Service & Information",
    back: "Back",
    home: "Home",
    thisWeek: "This Week",
    nextWeek: "Next Week",
    monthOverview: "Month Overview",
    openingHours: "Opening Hours",
    venueRules: "Venue Rules",
    contact: "Contact",
    directions: "Directions",
    publicTransport: "Public Transport",
    downloadMap: "Download Map to Phone",
    scanQR: "Scan QR Code",
    halls: "Halls",
    parking: "Parking",
    sanitary: "Restrooms",
    admin: "Administration",
    gastronomy: "Food & Drink",
    youAreHere: "You are here",
    standplan: "Floor Plan",
    searchExhibitor: "Find Exhibitor",
    program: "Program",
    search: "Search...",
    stand: "Stand",
    hall: "Hall",
    route: "Route",
    timetable: "Timetable",
    stages: "Stages",
    highlights: "Highlights",
    today: "Today",
    toilets: "Restrooms",
    firstAid: "First Aid",
    emergencyExits: "Emergency Exits",
    exitNow: "EXIT",
    followArrows: "FOLLOW ARROWS",
    emergency: "EMERGENCY",
    weatherWarning: "WEATHER WARNING",
    evacuation: "EVACUATION",
    stayCalm: "Stay calm",
    noEvents: "No events",
  },
  ar: {
    welcome: "مرحباً بكم في موقع الفعاليات",
    nextEvent: "الفعالية القادمة في",
    venueMap: "خريطة الموقع",
    events: "الفعاليات",
    service: "الخدمات والمعلومات",
    back: "رجوع",
    home: "الرئيسية",
    thisWeek: "هذا الأسبوع",
    nextWeek: "الأسبوع القادم",
    monthOverview: "نظرة شهرية",
    openingHours: "ساعات العمل",
    venueRules: "قواعد الموقع",
    contact: "اتصل بنا",
    directions: "الاتجاهات",
    publicTransport: "النقل العام",
    downloadMap: "تحميل الخريطة على الهاتف",
    scanQR: "مسح رمز QR",
    halls: "القاعات",
    parking: "مواقف السيارات",
    sanitary: "دورات المياه",
    admin: "الإدارة",
    gastronomy: "المطاعم",
    youAreHere: "أنت هنا",
    standplan: "مخطط الأجنحة",
    searchExhibitor: "البحث عن عارض",
    program: "البرنامج",
    search: "بحث...",
    stand: "جناح",
    hall: "قاعة",
    route: "مسار",
    timetable: "الجدول الزمني",
    stages: "المنصات",
    highlights: "أبرز الأحداث",
    today: "اليوم",
    toilets: "دورات المياه",
    firstAid: "الإسعافات الأولية",
    emergencyExits: "مخارج الطوارئ",
    exitNow: "مخرج",
    followArrows: "اتبع الأسهم",
    emergency: "طوارئ",
    weatherWarning: "تحذير طقس",
    evacuation: "إخلاء",
    stayCalm: "حافظ على هدوئك",
    noEvents: "لا توجد فعاليات",
  },
  uk: {
    welcome: "Ласкаво просимо на наш подієвий майданчик",
    nextEvent: "Наступна подія",
    venueMap: "Карта території",
    events: "Події",
    service: "Сервіс та інформація",
    back: "Назад",
    home: "Головна",
    thisWeek: "Цього тижня",
    nextWeek: "Наступного тижня",
    monthOverview: "Огляд місяця",
    openingHours: "Години роботи",
    venueRules: "Правила",
    contact: "Контакти",
    directions: "Як дістатися",
    publicTransport: "Громадський транспорт",
    downloadMap: "Завантажити план на телефон",
    scanQR: "Сканувати QR-код",
    halls: "Зали",
    parking: "Парковка",
    sanitary: "Санвузли",
    admin: "Адміністрація",
    gastronomy: "Їжа та напої",
    youAreHere: "Ви тут",
    standplan: "План стендів",
    searchExhibitor: "Знайти учасника",
    program: "Програма",
    search: "Шукати...",
    stand: "Стенд",
    hall: "Зал",
    route: "Маршрут",
    timetable: "Розклад",
    stages: "Сцени",
    highlights: "Головне",
    today: "Сьогодні",
    toilets: "Туалети",
    firstAid: "Перша допомога",
    emergencyExits: "Аварійні виходи",
    exitNow: "ВИХІД",
    followArrows: "СЛІДУЙТЕ СТРІЛКАМ",
    emergency: "НАДЗВИЧАЙНА СИТУАЦІЯ",
    weatherWarning: "ПОПЕРЕДЖЕННЯ ПРО ПОГОДУ",
    evacuation: "ЕВАКУАЦІЯ",
    stayCalm: "Зберігайте спокій",
    noEvents: "Немає подій",
  }
};

// Polling-Intervall für die Kiosk-Konfiguration (in Millisekunden)
// Die Stelen prüfen alle 30 Sekunden auf Modus-Änderungen vom Büro aus.
const CONFIG_POLL_INTERVAL_MS = 30_000;

export function KioskProvider({ children }) {
  const [language, setLanguage] = useState('de');
  const [systemMode, setSystemMode] = useState('week');
  const [config, setConfig] = useState(null);
  const [activeEvent, setActiveEvent] = useState(null);
  const [isIdle, setIsIdle] = useState(true); // Screensaver gesperrt – temporär für Wochenende
  const idleTimer = useRef(null);
  const idleTimeout = config?.idle_timeout_seconds || 60;
  const isDarkMode = (config?.theme_mode || 'dark') !== 'light';

  const t = useCallback((key) => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS['de'][key] || key;
  }, [language]);

  const isRTL = language === 'ar';

  const resetIdle = useCallback(() => {
    setIsIdle(false);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      setIsIdle(true);
    }, idleTimeout * 1000);
  }, [idleTimeout]);

  // Konfiguration laden und periodisch pollen
  // Ersetzt: base44.entities.KioskConfig.list() + .subscribe()
  useEffect(() => {
    let pollTimer = null;
    let isMounted = true;

    const fetchConfig = async () => {
      const newConfig = await loadKioskConfig();
      if (!isMounted) return;
      setConfig(newConfig);
      setSystemMode(newConfig.system_mode || 'week');

      // Venue-Map vorladen sobald Config bekannt ist (nutzt die konfigurierte URL)
      const mapUrl = newConfig.map_image_url || '/assets/venue-map.jpg';
      const preloadMap = new window.Image();
      preloadMap.src = mapUrl;

      // Screensaver-Bilder vorladen damit sie beim ersten Idle sofort da sind
      const slides = newConfig.slideshow_images || [];
      slides.forEach(item => {
        const url = typeof item === 'string' ? item : item?.url;
        if (url) { const img = new window.Image(); img.src = url; }
      });
    };

    // Sofort beim Start laden
    fetchConfig();

    // Danach alle 30 Sekunden pollen (ermöglicht Modus-Wechsel vom Büro)
    pollTimer = setInterval(fetchConfig, CONFIG_POLL_INTERVAL_MS);

    return () => {
      isMounted = false;
      if (pollTimer) clearInterval(pollTimer);
    };
  }, []);

  // Theme vom Config-Objekt direkt aufs Root-Element schreiben
  useEffect(() => {
    const theme = config?.theme_mode === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  }, [config]);

  // Idle-Detection (unverändert)
  useEffect(() => {
    const events = ['touchstart', 'mousedown', 'mousemove', 'keydown'];
    events.forEach(e => window.addEventListener(e, resetIdle));
    resetIdle();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetIdle));
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [resetIdle]);

  return (
    <KioskContext.Provider value={{
      language, setLanguage,
      systemMode, setSystemMode,
      config, activeEvent,
      isIdle, setIsIdle, resetIdle,
      t, isRTL,
      isDarkMode
    }}>
      <div dir={isRTL ? 'rtl' : 'ltr'} style={{ height: '100%' }}>
        {children}
      </div>
    </KioskContext.Provider>
  );
}

export function useKiosk() {
  const ctx = useContext(KioskContext);
  if (!ctx) throw new Error('useKiosk must be used within KioskProvider');
  return ctx;
}
