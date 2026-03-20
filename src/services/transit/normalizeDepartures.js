/**
 * normalizeDepartures.js
 *
 * Normalisiert Abfahrtsdaten aus beliebiger Quelle
 * in das interne Modell der ServicePage.
 *
 * Internes Modell:
 * {
 *   id:            String       – eindeutige ID der Abfahrt
 *   line:          String       – Linienbezeichnung, z.B. "Tram 11", "Bus 70"
 *   destination:   String       – Ziel, z.B. "Markkleeberg"
 *   departureTime: String|null  – Uhrzeit als String, z.B. "14:35" (optional)
 *   minutes:       Number|null  – Minuten bis zur Abfahrt (optional)
 *   platform:      String|null  – Haltestellen-/Gleis-Info (optional)
 *   mode:          String       – "tram" | "bus" | "rail" | "unknown"
 *   operator:      String|null  – Betreiber, z.B. "LVB" (optional)
 * }
 */

/**
 * @param {Array} rawArray
 * @returns {Array}
 */
export function normalizeDepartures(rawArray) {
  if (!Array.isArray(rawArray)) return [];

  return rawArray.map((raw, index) => ({
    id: String(raw.id ?? index),
    line: String(raw.line || ''),
    destination: String(raw.destination || ''),
    departureTime: raw.departureTime || raw.departure_time || null,
    minutes: raw.minutes != null ? Number(raw.minutes) : null,
    platform: raw.platform || null,
    mode: raw.mode || 'unknown',
    operator: raw.operator || null,
  }));
}
