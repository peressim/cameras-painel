/**
 * iot-proxy.mjs
 * Proxy para o IoT Hub JIMI (servidor próprio no Hetzner).
 * O frontend chama /api/iothub/* e este proxy repassa para http://178.105.90.63:10088/*
 */

const IOTHUB_BASE = 'http://178.105.90.63:10088';

export default async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/iothub/, '');
  const targetUrl = `${IOTHUB_BASE}${path}${url.search}`;

  const proxyHeaders = new Headers();
  for (const [key, val] of request.headers.entries()) {
    const lower = key.toLowerCase();
    if (['host', 'origin', 'referer', 'x-forwarded-for'].includes(lower)) continue;
    proxyHeaders.set(key, val);
  }

  let proxyBody;
  if (!['GET', 'HEAD'].includes(request.method)) {
    proxyBody = await request.text();
  }

  try {
    const upstream = await fetch(targetUrl, {
      method:  request.method,
      headers: proxyHeaders,
      body:    proxyBody,
    });
    const text = await upstream.text();
    return new Response(text, {
      status:  upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('Content-Type') || 'application/json',
        ...corsHeaders(),
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ code: 500, message: `Proxy error: ${err.message}` }),
      { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
    );
  }
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export const config = { path: '/api/iothub/*' };
