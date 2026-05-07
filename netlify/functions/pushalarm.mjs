/**
 * pushalarm.mjs
 *
 * ⚠️  FASE DE HOMOLOGAÇÃO (TurboHive):
 * Com TurboHive, os alertas são consultados diretamente via GET /v3/alerts/page.
 * Este endpoint NÃO é necessário durante a homologação.
 *
 * ✅  FASE DE PRODUÇÃO (IoT Hub JIMI no Hetzner):
 * Quando migrar para o servidor próprio, configure pushURL no docker-compose
 * para apontar para https://seu-site.netlify.app/pushalarm e este arquivo
 * voltará a ser usado para receber alertas em tempo real via webhook.
 */
export default async () => {
  return new Response(JSON.stringify({ code: 0, ok: true, note: 'TurboHive mode - webhook not used' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const config = { path: '/pushalarm' };
