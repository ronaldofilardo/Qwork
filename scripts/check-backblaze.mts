#!/usr/bin/env -S node --loader ts-node/esm

/**
 * Script de diagnóstico: Verifica configuração do Backblaze e testa upload simples
 * Uso: pnpm tsx scripts/check-backblaze.mts
 */
import dotenv from 'dotenv';
import { uploadToBackblaze } from '@/lib/storage/backblaze-client';

// Carregar .env.local explicitamente para execuções manuais
dotenv.config({ path: '.env.local' });

async function main() {
  console.log('[CHECK] Verificando configurações de Backblaze...');

  // Mostrar quais variáveis relacionadas estão presentes (mas não seus valores completos)
  const present = {
    PROVIDER: !!process.env.BACKBLAZE_PROVIDER,
    ENDPOINT: !!process.env.BACKBLAZE_ENDPOINT,
    S2_ENDPOINT: !!process.env.BACKBLAZE_S2_ENDPOINT,
    BUCKET: !!process.env.BACKBLAZE_BUCKET,
    KEY_ID: !!(
      process.env.BACKBLAZE_KEY_ID ||
      process.env.BACKBLAZE_ACCESS_KEY_ID ||
      process.env.BACKBLAZE_KEY
    ),
    APP_KEY: !!(
      process.env.BACKBLAZE_APPLICATION_KEY ||
      process.env.BACKBLAZE_SECRET_ACCESS_KEY ||
      process.env.BACKBLAZE_SECRET_KEY
    ),
  };

  console.log('[CHECK] Env presence:', present);

  try {
    const buf = Buffer.from('health-check-' + Date.now());
    const key = `health/check-${Date.now()}.txt`;
    const res = await uploadToBackblaze(buf, key, 'text/plain');
    console.log('[CHECK] Upload OK:', res);
    console.log(
      '[CHECK] Para confirmar, use checkBackblazeFileExists com chave:',
      res.key
    );
  } catch (err: any) {
    console.error(
      '[CHECK] Falha ao testar upload:',
      err instanceof Error ? err.message : String(err)
    );
    process.exitCode = 2;
  }
}

main().catch((err) => {
  console.error('[CHECK] Erro inesperado:', err);
  process.exitCode = 3;
});
