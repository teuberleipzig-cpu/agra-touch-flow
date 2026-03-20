/**
 * getDepartures.js – STUB
 *
 * TODO: Echte ÖPNV-Anbindung (Phase 2 oder später)
 *
 * Optionen für eine spätere Implementierung:
 *   - MDV / LVB EFA-API (Elektronische Fahrplanauskunft)
 *     Endpunkt: https://efal.kvv.de/efa/... (Region Leipzig)
 *   - DB REST API (https://v6.db.transport.rest/)
 *   - Abfahrtsmonitor-Scraper (als Proxy auf deinem Server)
 *
 * Für Phase 1 liefert diese Funktion statische Dummy-Daten,
 * identisch mit den bisherigen Hardcode-Daten in ServicePage.jsx.
 *
 * Die ServicePage.jsx wird in einem späteren Schritt auf diese
 * Funktion umgestellt, wenn echte Daten eingebunden werden.
 */

import { normalizeDepartures } from './normalizeDepartures.js';

// Statische Fallback-Abfahrten (entsprechen dem aktuellen Stand in ServicePage.jsx)
const STATIC_DEPARTURES = [
  { id: '1', line: 'Tram 11', destination: 'Markkleeberg', minutes: 5, mode: 'tram' },
  { id: '2', line: 'Tram 11', destination: 'Zentrum', minutes: 8, mode: 'tram' },
  { id: '3', line: 'Bus 70', destination: 'Connewitz', minutes: 12, mode: 'bus' },
];

/**
 * Gibt Abfahrten für die Haltestelle AGRA zurück.
 * Aktuell: statische Daten. Später: Live-API.
 *
 * @returns {Promise<Array>} Normalisierte Abfahrts-Objekte
 */
export async function getDepartures() {
  // TODO: Hier später echten API-Call einbauen
  return normalizeDepartures(STATIC_DEPARTURES);
}
