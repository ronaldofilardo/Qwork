import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

// Logger estruturado para o cron
function logCronStart(
  tipo: 'inicio' | 'sucesso' | 'erro',
  dados: Record<string, any> = {}
) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    tipo,
    service: 'cron-auto-laudo',
    ...dados,
  };
  console.log('[CRON-AUTO-LAUDO]', JSON.stringify(logEntry));
}

export function GET(_req: NextRequest) {
  // Cron de emissão está desabilitado por decisão operacional.
  logCronStart('inicio', { motivo: 'cron_desabilitado' });
  console.warn(
    '[CRON-AUTO-LAUDO] Acesso recusado: cron de emissão está desabilitado'
  );
  return new Response(
    JSON.stringify({ success: false, message: 'Cron de emissão desabilitado' }),
    { status: 410, headers: { 'Content-Type': 'application/json' } }
  );
}
