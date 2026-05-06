/**
 * iot-proxy.mjs
 * Proxy para as chamadas de API ao IoT Hub.
 * O frontend passa o endereço do IoT Hub no header "x-iothub-url"
 * para evitar expor credenciais na URL.
 *
 * Todas as requisições para /api/iot/* são redirecionadas para o IoT Hub real.
 */

export default async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  // Lê o endereço do IoT Hub do header enviado pelo frontend
  const iotHubUrl = request.headers.get('x-iothub-url');
  if (!iotHubUrl) {
    return new Response(
      JSON.stringify({ error: 'Header x-iothub-url não informado. Configure o IoT Hub no painel.' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
    );
  }

  // Extrai o path após /api/iot
  const url = new URL(request.url);
  const originalPath = url.pathname.replace(/^\/api\/iot/, '');
  const targetUrl = `${iotHubUrl.replace(/\/$/, '')}${originalPath}${url.search}`;

  // Copia os headers, removendo os que causam conflito
  const proxyHeaders = new Headers();
  for (const [key, value] of request.headers.entries()) {
    const lower = key.toLowerCase();
    if (['host', 'x-iothub-url', 'origin', 'referer'].includes(lower)) continue;
    proxyHeaders.set(key, value);
  }

  let proxyBody;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    proxyBody = await request.text();
  }

  try {
    const proxyResponse = await fetch(targetUrl, {
      method: request.method,
      headers: proxyHeaders,
      body: proxyBody,
    });

    const responseText = await proxyResponse.text();

    return new Response(responseText, {
      status: proxyResponse.status,
      headers: {
        'Content-Type': proxyResponse.headers.get('Content-Type') || 'application/json',
        ...corsHeaders()
      }
    });
  } catch (err) {
    console.error('[iot-proxy] Erro ao contatar IoT Hub:', err.message);
    return new Response(
      JSON.stringify({ error: `Não foi possível conectar ao IoT Hub: ${err.message}` }),
      { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
    );
  }
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-iothub-url',
  };
}

export const config = {
  path: "/api/iot/*"
};
