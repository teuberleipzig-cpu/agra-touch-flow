/**
 * normalizeAgraEvents.js
 *
 * Normalisiert rohe API-Antworten der AGRA-Eventseite
 * (WordPress + The Events Calendar REST API) in ein stabiles internes Modell.
 *
 * Die UI-Komponenten arbeiten nur gegen dieses Modell –
 * nie direkt gegen die Rohstruktur der API.
 *
 * Interne Feldnamen spiegeln bewusst die bereits in der UI verwendeten
 * snake_case-Felder wider, um Änderungen an Komponenten zu minimieren.
 */

/**
 * Entfernt HTML-Tags aus einem String.
 * @param {string|null} html
 * @returns {string}
 */
function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

/**
 * Normalisiert ein einzelnes Event aus der AGRA-API.
 *
 * @param {object} raw - Rohes Event-Objekt aus der WordPress REST API
 * @returns {object} Normalisiertes Event-Objekt
 */
export function normalizeAgraEvent(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const title = stripHtml(raw.title || '');
  const description = raw.description
    ? stripHtml(raw.description).slice(0, 300)
    : null;

  return {
    // Identifikation
    id: String(raw.id ?? ''),

    // Texte
    title,
    description,

    // Datumsfelder – ISO-Format aus der API übernehmen
    // Format: "2025-06-14 10:00:00" (Ortszeit Leipzig)
    start_date: raw.start_date || null,
    end_date: raw.end_date || null,

    // Optionaler vorformatierter Datumstext (z.B. von zukünftiger Quelle)
    date_text: raw.date_text || null,

    // Medien
    image_url: raw.image?.url || raw.image_url || null,

    // Links
    website_url: raw.url || raw.website_url || null,
    ticket_url: raw.website || raw.ticket_url || null,

    // Herkunft (für Debugging / spätere Erweiterung)
    _source: 'agra-api',
  };
}

/**
 * Normalisiert ein Array von rohen Events.
 * Filtert ungültige Einträge und dedupliziert nach ID.
 *
 * @param {Array} rawArray
 * @returns {Array} Array normalisierter Events
 */
export function normalizeAgraEvents(rawArray) {
  if (!Array.isArray(rawArray)) return [];

  const seen = new Set();
  const result = [];

  for (const raw of rawArray) {
    const normalized = normalizeAgraEvent(raw);
    if (!normalized || !normalized.id || seen.has(normalized.id)) continue;
    seen.add(normalized.id);
    result.push(normalized);
  }

  return result;
}
