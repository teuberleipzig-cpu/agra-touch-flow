/**
 * upload-image.js – Netlify Function
 * Nimmt ein Base64-kodiertes Bild entgegen und speichert es in Netlify Blobs.
 * Endpunkt: POST /.netlify/functions/upload-image
 * Body: { _pin, imageData (base64), mimeType, filename }
 * Gibt zurück: { success, imageId, imageUrl }
 */

const ADMIN_PIN = '4081';
const MAX_SIZE_BYTES = 4 * 1024 * 1024; // 4 MB

export async function handler(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  let data;
  try { data = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  if (String(data._pin || '') !== ADMIN_PIN)
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Invalid PIN' }) };

  const { imageData, mimeType, filename } = data;
  if (!imageData || !mimeType)
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing imageData or mimeType' }) };

  // Größencheck
  const sizeBytes = Math.round((imageData.length * 3) / 4);
  if (sizeBytes > MAX_SIZE_BYTES)
    return { statusCode: 413, headers, body: JSON.stringify({ error: 'Image too large (max 4 MB)' }) };

  // Eindeutige ID
  const imageId = `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore({
      name: 'kiosk-images',
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_AUTH_TOKEN,
    });

    // Bild als JSON-Objekt speichern (Base64 + Metadaten)
    await store.setJSON(imageId, {
      imageData,
      mimeType,
      filename: filename || imageId,
      uploadedAt: new Date().toISOString(),
    });
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Storage error: ' + err.message }) };
  }

  // URL zum Abruf über get-image Function
  const imageUrl = `/.netlify/functions/get-image?id=${imageId}`;

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true, imageId, imageUrl }),
  };
}
