/**
 * get-alerts.mjs
 *
 * ⚠️  FASE DE HOMOLOGAÇÃO (TurboHive):
 * Com TurboHive, o painel consulta alertas diretamente via /api/th/v3/alerts/page.
 * Este arquivo não é utilizado durante a homologação.
 *
 * ✅  FASE DE PRODUÇÃO (IoT Hub JIMI no Hetzner):
 * Quando migrar para o servidor próprio, este endpoint retornará os alertas
 * armazenados no Netlify Blobs (recebidos via pushalarm webhook).
 */
export default async () => {
  return new Response(JSON.stringify([]), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const config = { path: '/api/alerts' };
