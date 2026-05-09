/**
 * media-proxy.js — Netlify Edge Function
 * Proxeia /api/media/* → http://178.105.90.63:8881/*
 *
 * Edge Functions não têm timeout de 10s como as Functions normais,
 * o que permite transmitir streams FLV contínuos ao vivo.
 */

const MEDIA_BASE = 'http://178.105.90.63:8881';

export default async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  const url  = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/media/, '');
  const targetUrl = `${MEDIA_BASE}${path}${url.search}`;

  try {
    const upstream = await fetch(targetUrl, {
      method:  request.method,
      headers: {
        'Accept': request.headers.get('Accept') || '*/*',
        'Range':  request.headers.get('Range')  || '',
      },
    });

    // Passa o body como stream para não buffer o vídeo inteiro
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        'Content-Type':  upstream.headers.get('Content-Type') || 'video/x-flv',
        'Cache-Control': 'no-cache',
        ...corsHeaders(),
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Media proxy error: ${err.message}` }),
      { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
    );
  }
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Range',
  };
}

export const config = {
  path: '/api/media/*',
};
