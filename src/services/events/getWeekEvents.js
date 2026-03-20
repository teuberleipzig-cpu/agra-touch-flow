/**
 * getWeekEvents.js
 *
 * Zentraler Event-Fetch-Service für den Wochenmodus.
 *
 * Fetch-Strategie (in dieser Reihenfolge):
 *   1. /api/agra-events  – Proxy-Endpunkt auf deiner eigenen Domain
 *                          (Nginx auf dem Webserver leitet intern an agramessepark.de weiter)
 *                          In der Entwicklung übernimmt der Vite Dev-Server den Proxy.
 *   2. /data/events-cache.json – Lokale Fallback-Datei, falls die API nicht erreichbar ist.
 *                                Für Kiosk-Betrieb essentiell.
 *
 * Die Funktion wirft keine Exceptions nach außen – im Fehlerfall
 * wird immer ein leeres Array zurückgegeben (defensiv für Kiosk).
 */

import { normalizeAgraEvents } from './normalizeAgraEvents.js';

const API_URL = '/api/agra-events';
const CACHE_URL = '/data/events-cache.json';

/**
 * Baut die Request-URL für die AGRA-API auf.
 * Fetcht Seite 1 und Seite 2 parallel (wie die originale Base44-Funktion).
 */
async function fetchFromApi() {
  const today = new Date().toISOString().split('T')[0];
  const params = `?per_page=50&start_date=${today}&status=publish`;

  const [res1, res2] = await Promise.all([
    fetch(`${API_URL}${params}&page=1`),
    fetch(`${API_URL}${params}&page=2`),
  ]);

  if (!res1.ok && !res2.ok) {
    throw new Error(`AGRA API nicht erreichbar (Status ${res1.status})`);
  }

  const [data1, data2] = await Promise.all([
    res1.ok ? res1.json() : Promise.resolve({ events: [] }),
    res2.ok ? res2.json() : Promise.resolve({ events: [] }),
  ]);

  return [
    ...(data1.events || []),
    ...(data2.events || []),
  ];
}

/**
 * Liest die lokale Fallback-Datei.
 */
async function fetchFromCache() {
  const res = await fetch(CACHE_URL);
  if (!res.ok) throw new Error('Lokaler Events-Cache nicht verfügbar');
  const data = await res.json();
  // Cache kann entweder { events: [...] } oder direkt [...] sein
  return Array.isArray(data) ? data : (data.events || []);
}

/**
 * Lädt Events für den Wochenmodus.
 * Gibt immer ein Array zurück – nie null/undefined, nie Exception.
 *
 * @returns {Promise<Array>} Normalisierte Event-Objekte
 */
export async function getWeekEvents() {
  // Versuch 1: Live-API über Proxy
  try {
    const raw = await fetchFromApi();
    const events = normalizeAgraEvents(raw);
    if (events.length > 0) {
      return events;
    }
    // API hat geantwortet, aber keine Events geliefert → Fallback
    console.info('[getWeekEvents] API lieferte 0 Events, versuche Cache...');
  } catch (apiError) {
    console.warn('[getWeekEvents] API-Fehler:', apiError.message);
  }

  // Versuch 2: Lokaler Cache
  try {
    const raw = await fetchFromCache();
    const events = normalizeAgraEvents(raw);
    console.info(`[getWeekEvents] Cache geladen: ${events.length} Events`);
    return events;
  } catch (cacheError) {
    console.warn('[getWeekEvents] Cache-Fehler:', cacheError.message);
  }

  // Letzter Ausweg: Leeres Array (Kiosk zeigt "Keine Veranstaltungen")
  return [];
}
