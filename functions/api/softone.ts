// functions/api/softone.ts
const DATABASE_URLS: Record<string, string> = {
  'default': 'https://gustoraro.oncloud.gr/s1services',
  'soft1': 'https://gustoraro2.oncloud.gr/s1services',
};

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function onRequestPost(context: any) {
  try {
    const bodyText = await context.request.text();
    const payload = JSON.parse(bodyText);
    const database = payload.database || 'soft1';
    const S1_URL = DATABASE_URLS[database] || DATABASE_URLS['default'];

    delete payload.database;

    console.log(`[PROXY DEBUG] Forwarding to: ${S1_URL}`);
    console.log(`[PROXY DEBUG] Payload:`, JSON.stringify(payload, null, 2));

    const response = await fetch(S1_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload)
    });

    const data = await response.arrayBuffer();

    return new Response(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json; charset=windows-1253'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Proxy error", details: error }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}