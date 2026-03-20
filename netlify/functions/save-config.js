/**
 * save-config.js – Netlify Function
 * Speichert die Kiosk-Config im Netlify Blob Store.
 * Endpunkt: POST /.netlify/functions/save-config
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

export async function handler(event, context) {
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

  // Netlify Blobs – siteID und token explizit übergeben
  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore({
      name: 'kiosk',
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_AUTH_TOKEN,
    });
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
