/**
 * translate.js – Netlify Function
 *
 * Proxy zwischen der Kiosk-App und der MyMemory Translation API.
 * Der Key (falls vorhanden) bleibt serverseitig.
 *
 * POST body: { texts: string[], targetLang: 'en'|'ar'|'uk' }
 * Response:  { translations: string[] }
 *
 * MyMemory Sprach-Codes:
 *   Deutsch   → de-DE
 *   Englisch  → en-GB
 *   Arabisch  → ar-SA
 *   Ukrainisch→ uk-UA
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const LANG_MAP = {
  en: 'en-GB',
  ar: 'ar-SA',
  uk: 'uk-UA',
  de: 'de-DE',
};

async function translateText(text, targetLang) {
  if (!text || !text.trim()) return text;

  const sourceLang = 'de-DE';
  const target     = LANG_MAP[targetLang] || 'en-GB';
  const url        = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${target}`;

  const res  = await fetch(url);
  const data = await res.json();

  if (data.responseStatus === 200 && data.responseData?.translatedText) {
    return data.responseData.translatedText;
  }
  // Fallback: Original zurückgeben
  return text;
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { texts, targetLang } = body;

  if (!Array.isArray(texts) || !targetLang) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Missing texts or targetLang' }) };
  }

  // Deutsch → keine Übersetzung nötig
  if (targetLang === 'de') {
    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ translations: texts }),
    };
  }

  try {
    // Texte sequentiell übersetzen (MyMemory Rate-Limit schonen)
    const translations = [];
    for (const text of texts) {
      const translated = await translateText(text, targetLang);
      translations.push(translated);
    }

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ translations }),
    };
  } catch (err) {
    console.error('[translate]', err);
    // Fallback: Original-Texte zurückgeben
    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ translations: texts }),
    };
  }
}
