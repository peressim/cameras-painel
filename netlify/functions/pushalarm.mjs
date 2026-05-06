/**
 * pushalarm.mjs
 * Recebe os alertas do IoT Hub (msg-dispatch-iothub) e os salva no Netlify Blobs.
 * Configure pushURL=https://SEU-SITE.netlify.app/pushalarm no docker-compose do IoT Hub.
 */
import { getStore } from "@netlify/blobs";

export default async (request) => {
  // Responde a OPTIONS (CORS preflight)
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders()
    });
  }

  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  let body;
  try {
    const text = await request.text();
    body = JSON.parse(text);
  } catch {
    // IoT Hub pode enviar sem body ou mal-formatado — responde OK sempre
    return new Response(JSON.stringify({ code: 0, ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() }
    });
  }

  try {
    const store = getStore({ name: "iothub-alerts", consistency: "strong" });
    const alertId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    await store.set(alertId, JSON.stringify({
      ...body,
      receivedAt: new Date().toISOString(),
      _read: false,
    }));
  } catch (err) {
    console.error('[pushalarm] Erro ao salvar alerta:', err);
    // Mesmo com erro, responde OK para o IoT Hub não ficar retentando
  }

  // IoT Hub exige exatamente { code: 0, ok: true }
  return new Response(JSON.stringify({ code: 0, ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() }
  });
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export const config = {
  path: "/pushalarm"
};
