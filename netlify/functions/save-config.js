/**
 * save-config.js – Netlify Function
 *
 * Ersetzt save-config.php für den Netlify-Betrieb.
 *
 * WICHTIG: Netlify Functions können das Dateisystem nicht dauerhaft
 * beschreiben – jeder Function-Aufruf läuft in einer isolierten Umgebung.
 *
 * Lösung: Die Config wird in einer Netlify Blob (Key-Value-Store)
 * gespeichert. Die Kiosk-App holt sie dann über eine zweite Function
 * (get-config.js) statt direkt aus der JSON-Datei.
 *
 * Endpunkt: POST /.netlify/functions/save-config
 * Body: { _pin: "4081", system_mode: "week", ... }
 */

const ADMIN_PIN = '4081';

const ALLOWED_FIELDS = [
  'system_mode',
  'idle_timeout_seconds',
  'slideshow_images',
  'emergency_type',
  'emergency_message',
  'active_event_id',
];

const DEFAULTS = {
  system_mode: 'week',
  idle_timeout_seconds: 60,
  slideshow_images: [],
  emergency_type: 'evacuation',
  emergency_message: null,
  active_event_id: null,
};

export async function handler(event) {
  // CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // Body parsen
  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  // PIN prüfen
  if (String(data._pin || '') !== ADMIN_PIN) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Invalid PIN' }) };
  }

  // Config zusammenbauen
  const config = { ...DEFAULTS };
  for (const field of ALLOWED_FIELDS) {
    if (field in data) config[field] = data[field];
  }

  // Validierung
  if (!['week', 'event', 'emergency'].includes(config.system_mode)) {
    config.system_mode = 'week';
  }
  config.idle_timeout_seconds = Math.max(10, Math.min(300, Number(config.idle_timeout_seconds) || 60));
  if (!Array.isArray(config.slideshow_images)) config.slideshow_images = [];

  // In Netlify Blobs speichern
  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore('kiosk');
    await store.setJSON('config', config);
  } catch (err) {
    console.error('Blob store error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Could not save config: ' + err.message }),
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      message: 'Config saved. Stelen update within 30 seconds.',
      config,
    }),
  };
}
