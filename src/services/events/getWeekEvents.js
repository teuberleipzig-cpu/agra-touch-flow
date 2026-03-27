/**
 * getWeekEvents.js – GitHub Pages Version
 *
 * Fetch-Strategie:
 *   1. Direkt von agramessepark.de (funktioniert wenn CORS offen ist)
 *   2. /data/events-cache.json – lokaler Fallback
 */

import { normalizeAgraEvents } from './normalizeAgraEvents.js';

const BASE       = import.meta.env.BASE_URL || '/';
const DIRECT_URL = 'https://agramessepark.de/wp-json/tribe/events/v1/events';
const CACHE_URL  = `${BASE}data/events-cache.json`;

async function fetchDirect() {
  const today  = new Date().toISOString().split('T')[0];
  const params = `?per_page=50&start_date=${today}&status=publish`;

  const [res1, res2] = await Promise.all([
    fetch(`${DIRECT_URL}${params}&page=1`),
    fetch(`${DIRECT_URL}${params}&page=2`),
  ]);

  if (!res1.ok && !res2.ok) throw new Error(`API nicht erreichbar (${res1.status})`);

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
  // Versuch 1: Direkt von agramessepark.de
  try {
    const raw    = await fetchDirect();
    const events = normalizeAgraEvents(raw);
    if (events.length > 0) return events;
    console.info('[getWeekEvents] API: 0 Events, versuche Cache...');
  } catch (err) {
    console.warn('[getWeekEvents] Direkt-Fetch fehlgeschlagen:', err.message);
  }

  // Versuch 2: Lokaler Cache
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
