// functions/api/softone.ts
export async function onRequest(context: any) {
  const S1_URL = "https://gustoraro.oncloud.gr/s1services";

  try {
    // Παίρνουμε το σώμα του αιτήματος από το frontend σας
    const body = await context.request.text();

    const response = await fetch(S1_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: body
    });

    const data = await response.arrayBuffer();

    return new Response(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json; charset=windows-1253'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to connect to SoftOne" }), { status: 500 });
  }
}