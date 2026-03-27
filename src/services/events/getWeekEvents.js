/**
 * getWeekEvents.js
 *
 * Fetch-Strategie (in dieser Reihenfolge):
 *   1. /api/agra-events  – Proxy (Netlify oder eigener Server)
 *   2. Direkt von agramessepark.de – funktioniert wenn CORS erlaubt ist (GitHub Pages)
 *   3. /data/events-cache.json – lokaler Fallback
 */

import { normalizeAgraEvents } from './normalizeAgraEvents.js';

const PROXY_URL  = '/api/agra-events';
const DIRECT_URL = 'https://agramessepark.de/wp-json/tribe/events/v1/events';
const CACHE_URL  = '/data/events-cache.json';

async function fetchFromUrl(baseUrl, useProxy) {
  const today  = new Date().toISOString().split('T')[0];
  const params = `?per_page=50&start_date=${today}&status=publish`;

  const [res1, res2] = await Promise.all([
    fetch(`${baseUrl}${params}&page=1`),
    fetch(`${baseUrl}${params}&page=2`),
  ]);

  if (!res1.ok && !res2.ok) throw new Error(`Nicht erreichbar (${res1.status})`);

  const [data1, data2] = await Promise.all([
    res1.ok ? res1.json() : Promise.resolve({ events: [] }),
    res2.ok ? res2.json() : Promise.resolve({ events: [] }),
  ]);

  return [...(data1.events || []), ...(data2.events || [])];
}

async function fetchFromCache() {
  const res = await fetch(CACHE_URL);
  if (!res.ok) throw new Error('Cache nicht verfügbar');
  const data = await res.json();
  return Array.isArray(data) ? data : (data.events || []);
}

export async function getWeekEvents() {
  // Versuch 1: Proxy (Netlify / eigener Server)
  try {
    const raw    = await fetchFromUrl(PROXY_URL);
    const events = normalizeAgraEvents(raw);
    if (events.length > 0) return events;
    console.info('[getWeekEvents] Proxy: 0 Events, versuche direkt...');
  } catch {
    console.info('[getWeekEvents] Kein Proxy, versuche direkt...');
  }

  // Versuch 2: Direkt (GitHub Pages – funktioniert wenn CORS offen)
  try {
    const raw    = await fetchFromUrl(DIRECT_URL);
    const events = normalizeAgraEvents(raw);
    if (events.length > 0) return events;
    console.info('[getWeekEvents] Direkt: 0 Events, versuche Cache...');
  } catch (err) {
    console.warn('[getWeekEvents] Direkt-Fetch fehlgeschlagen:', err.message);
  }

  // Versuch 3: Lokaler Cache
  try {
    const raw    = await fetchFromCache();
    const events = normalizeAgraEvents(raw);
    console.info(`[getWeekEvents] Cache: ${events.length} Events`);
    return events;
  } catch (err) {
    console.warn('[getWeekEvents] Cache-Fehler:', err.message);
  }

  return [];
}
