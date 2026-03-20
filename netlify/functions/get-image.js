/**
 * get-image.js – Netlify Function
 * Liefert ein gespeichertes Bild aus Netlify Blobs.
 * Endpunkt: GET /.netlify/functions/get-image?id=img_xxx
 */

export async function handler(event) {
  const imageId = event.queryStringParameters?.id;

  if (!imageId) {
    return { statusCode: 400, body: 'Missing id parameter' };
  }

  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore({
      name: 'kiosk-images',
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_AUTH_TOKEN,
    });

    const imageObj = await store.get(imageId, { type: 'json' });
    if (!imageObj) {
      return { statusCode: 404, body: 'Image not found' };
    }

    // Base64 → Binary zurückgeben
    return {
      statusCode: 200,
      headers: {
        'Content-Type': imageObj.mimeType,
        'Cache-Control': 'public, max-age=86400', // 1 Tag cachen
        'Access-Control-Allow-Origin': '*',
      },
      body: imageObj.imageData,
      isBase64Encoded: true,
    };
  } catch (err) {
    return { statusCode: 500, body: 'Storage error: ' + err.message };
  }
}
