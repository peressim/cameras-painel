/**
 * turbohive-proxy.mjs
 * Proxy para a API do TurboHive.
 * O frontend chama /api/th/* e este proxy repassa para turbohive.ai
 *
 * Usa HTTP como base e segue redirects manualmente para preservar o método POST.
 * (O servidor TurboHive redireciona HTTP→HTTPS convertendo POST em GET,
 *  e além disso os endpoints de vídeo só existem no servidor HTTP.)
 */

const TURBOHIVE_BASE = 'http://turbohive.ai';

export default async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  // Extrai o path após /api/th
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/th/, '');
  const targetUrl = `${TURBOHIVE_BASE}${path}${url.search}`;

  // Copia headers relevantes (incluindo Authorization Bearer do frontend)
  const proxyHeaders = new Headers();
  for (const [key, val] of request.headers.entries()) {
    const lower = key.toLowerCase();
    if (['host', 'origin', 'referer', 'x-forwarded-for'].includes(lower)) continue;
    proxyHeaders.set(key, val);
  }
  proxyHeaders.set('host', 'turbohive.ai');

  let proxyBody;
  if (!['GET', 'HEAD'].includes(request.method)) {
    proxyBody = await request.text();
  }

  try {
    // Primeira tentativa: HTTP, sem seguir redirects automaticamente
    let upstream = await fetch(targetUrl, {
      method:   request.method,
      headers:  proxyHeaders,
      body:     proxyBody,
      redirect: 'manual',
    });

    // Se o servidor redirecionar (301/302/307/308), seguimos manualmente
    // preservando o método e o body originais (o fetch padrão converte POST→GET)
    if (upstream.status >= 300 && upstream.status < 400) {
      const location = upstream.headers.get('location');
      if (location) {
        console.log(`[proxy] Redirect ${upstream.status} → ${location}`);
        upstream = await fetch(location, {
          method:  request.method,
          headers: proxyHeaders,
          body:    proxyBody,
        });
      }
    }

    const text = await upstream.text();

    return new Response(text, {
      status:  upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('Content-Type') || 'application/json',
        ...corsHeaders(),
      },
    });
  } catch (err) {
    console.error('[proxy] Erro ao contactar TurboHive:', err.message);
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

export const config = {
  path: '/api/th/*',
};
