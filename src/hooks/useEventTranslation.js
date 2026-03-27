/**
 * useEventTranslation.js
 *
 * Hook der Event-Titel und -Beschreibungen übersetzt.
 *
 * Auf GitHub Pages: direkt zur MyMemory Translation API (öffentlich, kein Key nötig).
 * Auf eigenem Server später: kann wieder auf einen lokalen Proxy umgestellt werden.
 *
 * Features:
 * - Cached pro Sprache (kein Re-Fetch bei Sprachwechsel zurück)
 * - Übersetzt nur wenn Sprache != 'de'
 * - Fallback auf Original-Text bei Fehler
 * - Zeigt Original-Text während Übersetzung läuft
 */

import { useState, useEffect, useRef } from 'react';
import { useKiosk } from '../components/kiosk/KioskContext';

const LANG_MAP = {
  en: 'en-GB',
  ar: 'ar-SA',
  uk: 'uk-UA',
};

// Cache: { 'en': { eventId: { title, description } }, 'ar': { ... } }
const translationCache = {};

async function translateText(text, targetLang) {
  if (!text || !text.trim()) return text;
  const target = LANG_MAP[targetLang] || 'en-GB';
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=de-DE|${target}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.responseStatus === 200 && data.responseData?.translatedText) {
    return data.responseData.translatedText;
  }
  return text;
}

export function useEventTranslation(events) {
  const { language } = useKiosk();
  const [translatedEvents, setTranslatedEvents] = useState(events);
  const [isTranslating, setIsTranslating] = useState(false);
  const abortRef = useRef(null);

  useEffect(() => {
    // Deutsch: Original-Events direkt nutzen
    if (language === 'de' || !events.length) {
      setTranslatedEvents(events);
      setIsTranslating(false);
      return;
    }

    // Cache-Hit: sofort anwenden
    if (translationCache[language]) {
      const cached = translationCache[language];
      const allCached = events.every(e => cached[e.id]);
      if (allCached) {
        setTranslatedEvents(events.map(e => ({
          ...e,
          title:       cached[e.id].title,
          description: cached[e.id].description,
        })));
        setIsTranslating(false);
        return;
      }
    }

    setIsTranslating(true);

    if (abortRef.current) abortRef.current = false;
    const isCurrentRequest = { valid: true };
    abortRef.current = isCurrentRequest;

    async function translate() {
      try {
        const toTranslate = events.filter(e =>
          !translationCache[language]?.[e.id]
        );
        if (toTranslate.length === 0) return;

        if (!translationCache[language]) translationCache[language] = {};

        // MyMemory sequentiell aufrufen (Rate-Limit schonen)
        for (const e of toTranslate) {
          if (!isCurrentRequest.valid) return;
          const [title, description] = await Promise.all([
            translateText(e.title || '', language),
            translateText(e.description || '', language),
          ]);
          translationCache[language][e.id] = { title, description };
        }

        if (!isCurrentRequest.valid) return;

        setTranslatedEvents(events.map(e => {
          const cached = translationCache[language]?.[e.id];
          return cached ? { ...e, ...cached } : e;
        }));

      } catch (err) {
        console.warn('[useEventTranslation] Fehler:', err.message);
        if (isCurrentRequest.valid) setTranslatedEvents(events);
      } finally {
        if (isCurrentRequest.valid) setIsTranslating(false);
      }
    }

    translate();

    return () => { isCurrentRequest.valid = false; };
  }, [language, events]);

  return { translatedEvents, isTranslating };
}
