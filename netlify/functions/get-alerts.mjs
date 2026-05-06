/**
 * get-alerts.mjs
 * Retorna os alertas salvos no Netlify Blobs para o dashboard.
 * Chamado pelo frontend a cada 30 segundos.
 */
import { getStore } from "@netlify/blobs";

export default async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  try {
    const store = getStore({ name: "iothub-alerts", consistency: "strong" });
    const { blobs } = await store.list();

    if (!blobs || blobs.length === 0) {
      return jsonResponse([]);
    }

    // Busca os últimos 100 alertas
    const recent = blobs.slice(-100);
    const alerts = [];

    for (const blob of recent) {
      try {
        const data = await store.get(blob.key, { type: 'json' });
        if (data) {
          alerts.push({ _id: blob.key, ...data });
        }
      } catch {
        // Ignora blobs corrompidos
      }
    }

    // Ordena do mais recente para o mais antigo
    alerts.sort((a, b) => new Date(b.receivedAt || 0) - new Date(a.receivedAt || 0));

    return jsonResponse(alerts);
  } catch (err) {
    console.error('[get-alerts] Erro:', err);
    return jsonResponse([]);
  }
};

function jsonResponse(data) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() }
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export const config = {
  path: "/api/alerts"
};
