/**
 * get-config.js – Netlify Function
 * Liest die Kiosk-Config aus dem Netlify Blob Store.
 * Endpunkt: GET /.netlify/functions/get-config
 */

const DEFAULTS = {
  system_mode: 'week',
  idle_timeout_seconds: 60,
  slideshow_images: [],
  emergency_type: 'evacuation',
  emergency_message: null,
  active_event_id: null,
};

export async function handler(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore({
      name: 'kiosk',
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_AUTH_TOKEN,
    });
    const config = await store.get('config', { type: 'json' });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(config ?? DEFAULTS),
    };
  } catch (err) {
    console.error('Blob store error:', err);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(DEFAULTS),
    };
  }
}
