/**
 * get-config.js – Netlify Function
 */

const DEFAULTS = {
  system_mode: 'week',
  idle_timeout_seconds: 60,
  slideshow_images: [],
  emergency_type: 'evacuation',
  emergency_message: null,
  active_event_id: null,
  theme_mode: 'dark',
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
      body: JSON.stringify({ ...DEFAULTS, ...(config || {}) }),
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(DEFAULTS),
    };
  }
}