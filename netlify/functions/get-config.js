/**
 * get-config.js – Netlify Function
 *
 * Liefert die aktuelle Kiosk-Config aus dem Netlify Blob Store.
 * Fällt auf Defaults zurück wenn noch keine Config gespeichert wurde.
 *
 * Endpunkt: GET /.netlify/functions/get-config
 *
 * Die Stelen pollen diesen Endpunkt alle 30 Sekunden
 * (statt /config/kiosk-config.json direkt zu lesen).
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
    // Kein Browser-Cache – Stelen sollen immer aktuelle Config bekommen
    'Cache-Control': 'no-store',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore('kiosk');
    const config = await store.get('config', { type: 'json' });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(config ?? DEFAULTS),
    };
  } catch (err) {
    console.error('Blob store error:', err);
    // Immer Defaults zurückgeben – Kiosk läuft weiter
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(DEFAULTS),
    };
  }
}
