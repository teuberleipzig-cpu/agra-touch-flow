export async function handler(event) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  const imageId = event.queryStringParameters?.id;
  if (!imageId) {
    return { statusCode: 400, headers: corsHeaders, body: 'Missing id parameter' };
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
      return { statusCode: 404, headers: corsHeaders, body: 'Image not found' };
    }

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': imageObj.mimeType,
        'Cache-Control': 'public, max-age=86400',
      },
      body: imageObj.imageData,
      isBase64Encoded: true,
    };
  } catch (err) {
    return { statusCode: 500, headers: corsHeaders, body: 'Storage error: ' + err.message };
  }
}
