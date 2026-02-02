#!/usr/bin/env -S node --loader ts-node/esm

/**
 * Script de monitoramento do Backblaze
 * - Chama `checkBackblazeConnection()` e retorna código de saída:
 *   0 = ok, 2 = falha na conexão, 3 = erro na verificação
 * Uso (local): pnpm tsx scripts/monitor-backblaze.mts
 */
import dotenv from 'dotenv';
import { checkBackblazeConnection } from '@/lib/storage/backblaze-client';

// Carregar .env.local para execução manual em dev
dotenv.config({ path: '.env.local' });

async function main() {
  console.log(
    `[MONITOR] Iniciando verificação de conexão (${new Date().toISOString()})`
  );

  const presence = {
    BACKBLAZE_PROVIDER: !!process.env.BACKBLAZE_PROVIDER,
    BACKBLAZE_ENDPOINT: !!process.env.BACKBLAZE_ENDPOINT,
    BACKBLAZE_S2_ENDPOINT: !!process.env.BACKBLAZE_S2_ENDPOINT,
    BACKBLAZE_BUCKET: !!process.env.BACKBLAZE_BUCKET,
    BACKBLAZE_KEY_ID: !!(
      process.env.BACKBLAZE_KEY_ID ||
      process.env.BACKBLAZE_ACCESS_KEY_ID ||
      process.env.BACKBLAZE_KEY
    ),
    BACKBLAZE_APP_KEY: !!(
      process.env.BACKBLAZE_APPLICATION_KEY ||
      process.env.BACKBLAZE_SECRET_ACCESS_KEY ||
      process.env.BACKBLAZE_SECRET_KEY
    ),
    DISABLE_LAUDO_REMOTE:
      process.env.DISABLE_LAUDO_REMOTE === '1' ||
      process.env.DISABLE_LAUDO_REMOTE === 'true',
    DISABLE_REMOTE_STORAGE:
      process.env.DISABLE_REMOTE_STORAGE === '1' ||
      process.env.DISABLE_REMOTE_STORAGE === 'true',
  };

  console.log('[MONITOR] Env presence:', presence);

  try {
    const ok = await checkBackblazeConnection();
    if (ok) {
      console.log('[MONITOR] Conexão Backblaze OK ✅');
      process.exitCode = 0;
    } else {
      console.error('[MONITOR] Falha na conexão com Backblaze ❌');
      process.exitCode = 2;
    }
  } catch (err: any) {
    console.error(
      '[MONITOR] Erro verificando conexão:',
      err instanceof Error ? err.message : String(err)
    );
    process.exitCode = 3;
  }
}

main().catch((e) => {
  console.error('[MONITOR] Erro inesperado:', e);
  process.exitCode = 4;
});
