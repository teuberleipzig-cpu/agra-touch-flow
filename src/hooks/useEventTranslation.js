/**
 * useEventTranslation.js
 *
 * Hook der Event-Titel und -Beschreibungen übersetzt.
 *
 * Features:
 * - Cached pro Sprache (kein Re-Fetch bei Sprachwechsel zurück)
 * - Übersetzt nur wenn Sprache != 'de'
 * - Fallback auf Original-Text bei Fehler
 * - Zeigt Original-Text während Übersetzung läuft
 */

import { useState, useEffect, useRef } from 'react';
import { useKiosk } from '../components/kiosk/KioskContext';

const TRANSLATE_ENDPOINT = '/.netlify/functions/translate';

// Cache: { 'en': { eventId: { title, description } }, 'ar': { ... } }
const translationCache = {};

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

    // Übersetzung starten
    setIsTranslating(true);

    // Vorherigen Request abbrechen
    if (abortRef.current) abortRef.current = false;
    const isCurrentRequest = { valid: true };
    abortRef.current = isCurrentRequest;

    async function translate() {
      try {
        // Nur Events die noch nicht gecacht sind
        const toTranslate = events.filter(e =>
          !translationCache[language]?.[e.id]
        );

        if (toTranslate.length === 0) return;

        // Titel und Beschreibungen als flaches Array
        const texts = toTranslate.flatMap(e => [
          e.title || '',
          e.description || '',
        ]);

        const res = await fetch(TRANSLATE_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texts, targetLang: language }),
        });

        if (!res.ok) throw new Error('Translation failed');
        if (!isCurrentRequest.valid) return;

        const { translations } = await res.json();

        // Cache aufbauen
        if (!translationCache[language]) translationCache[language] = {};

        toTranslate.forEach((e, i) => {
          translationCache[language][e.id] = {
            title:       translations[i * 2]       || e.title,
            description: translations[i * 2 + 1]   || e.description,
          };
        });

        if (!isCurrentRequest.valid) return;

        // Alle Events (inkl. vorher gecachte) anwenden
        setTranslatedEvents(events.map(e => {
          const cached = translationCache[language]?.[e.id];
          return cached ? { ...e, ...cached } : e;
        }));

      } catch (err) {
        console.warn('[useEventTranslation] Fehler:', err.message);
        // Fallback: Original-Texte
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
