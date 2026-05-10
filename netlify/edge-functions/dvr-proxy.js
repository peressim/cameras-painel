/**
 * dvr-proxy.js — Netlify Edge Function
 * Proxeia /api/dvr/* → http://178.105.90.63:23010/*
 * Permite servir vídeos de eventos gravados no cartão de memória.
 */

const DVR_BASE = 'http://178.105.90.63:23010';

export default async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  const url  = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/dvr/, '');
  const targetUrl = `${DVR_BASE}${path}${url.search}`;

  try {
    const upstream = await fetch(targetUrl, {
      method: request.method,
      headers: {
        'Accept': request.headers.get('Accept') || '*/*',
        'Range':  request.headers.get('Range')  || '',
      },
    });

    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        'Content-Type':  upstream.headers.get('Content-Type') || 'video/mp4',
        'Cache-Control': 'no-cache',
        'Accept-Ranges': 'bytes',
        ...corsHeaders(),
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `DVR proxy error: ${err.message}` }),
      { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
    );
  }
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Range',
  };
}

export const config = {
  path: '/api/dvr/*',
};
