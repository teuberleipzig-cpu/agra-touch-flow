/**
 * normalizeAgraEvents.js
 *
 * Normalisiert rohe API-Antworten der AGRA-Eventseite
 * (WordPress + The Events Calendar REST API) in ein stabiles internes Modell.
 */

/**
 * Dekodiert HTML-Entities universell (&#8211; → –, &amp; → &, etc.)
 */
function decodeHtmlEntities(str) {
  if (!str) return '';
  if (typeof document === 'undefined') {
    // SSR-Fallback: häufigste Entities manuell
    return str
      .replace(/&#8211;/g, '\u2013')
      .replace(/&#8212;/g, '\u2014')
      .replace(/&#8216;/g, '\u2018')
      .replace(/&#8217;/g, '\u2019')
      .replace(/&#8220;/g, '\u201C')
      .replace(/&#8221;/g, '\u201D')
      .replace(/&#8230;/g, '\u2026')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&nbsp;/g, ' ');
  }
  const txt = document.createElement('textarea');
  txt.innerHTML = str;
  return txt.value;
}

/**
 * Entfernt HTML-Tags und dekodiert Entities.
 * @param {string|null} html
 * @returns {string}
 */
function stripHtml(html) {
  if (!html) return '';
  const stripped = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return decodeHtmlEntities(stripped);
}

/**
 * Normalisiert ein einzelnes Event aus der AGRA-API.
 */
export function normalizeAgraEvent(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const title = stripHtml(raw.title || '');
  const description = raw.description
    ? stripHtml(raw.description).slice(0, 300)
    : null;

  return {
    id: String(raw.id ?? ''),
    title,
    description,
    start_date: raw.start_date || null,
    end_date: raw.end_date || null,
    date_text: raw.date_text || null,
    image_url: raw.image?.url || raw.image_url || null,
    website_url: raw.url || raw.website_url || null,
    ticket_url: raw.website || raw.ticket_url || null,
    _source: 'agra-api',
  };
}

/**
 * Normalisiert ein Array von rohen Events.
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
