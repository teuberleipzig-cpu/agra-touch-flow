const ADMIN_PIN = '4081';

const ALLOWED_FIELDS = [
  'system_mode', 'idle_timeout_seconds', 'slideshow_images',
  'scheduled_overrides', 'emergency_type', 'emergency_message', 'active_event_id',
  'map_image_url', 'map_points', 'map_zones', 'stelen',
];

const DEFAULTS = {
  system_mode: 'week', idle_timeout_seconds: 60, slideshow_images: [],
  scheduled_overrides: [], emergency_type: 'evacuation',
  emergency_message: null, active_event_id: null,
  map_image_url: '/assets/venue-map.png', map_points: [], map_zones: [], stelen: {},
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
  'Content-Type': 'application/json',
};

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let data;
  try { data = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  if (String(data._pin || '') !== ADMIN_PIN) {
    return { statusCode: 403, headers: CORS, body: JSON.stringify({ error: 'Invalid PIN' }) };
  }

  const config = { ...DEFAULTS };
  for (const field of ALLOWED_FIELDS) {
    if (field in data) config[field] = data[field];
  }

  if (!['week', 'event', 'emergency'].includes(config.system_mode)) config.system_mode = 'week';
  config.idle_timeout_seconds = Math.max(10, Math.min(300, Number(config.idle_timeout_seconds) || 60));
  if (!Array.isArray(config.slideshow_images))    config.slideshow_images    = [];
  if (!Array.isArray(config.scheduled_overrides)) config.scheduled_overrides = [];
  if (!Array.isArray(config.map_points))          config.map_points          = [];
  if (!Array.isArray(config.map_zones))           config.map_zones           = [];
  if (typeof config.stelen !== 'object' || Array.isArray(config.stelen)) config.stelen = {};

  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore({
      name: 'kiosk',
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_AUTH_TOKEN,
    });
    await store.setJSON('config', config);
  } catch (err) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Storage error: ' + err.message }) };
  }

  return {
    statusCode: 200,
    headers: CORS,
    body: JSON.stringify({ success: true, message: 'Config saved.', config }),
  };
}
