#!/usr/bin/env -S node --loader ts-node/esm

/**
 * Script para enviar um laudo local específico para Backblaze
 * Uso: pnpm tsx scripts/upload-laudo.mts <laudoId>
 */
import fs from 'fs/promises';
import path from 'path';
import { uploadLaudoToBackblaze } from '@/lib/storage/laudo-storage';
import { query } from '@/lib/db';

async function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0) {
    console.error('Usage: pnpm tsx scripts/upload-laudo.mts <laudoId>');
    process.exitCode = 2;
    return;
  }

  const laudoId = Number(argv[0]);
  if (!laudoId || Number.isNaN(laudoId)) {
    console.error('Parâmetro inválido: laudoId precisa ser um número');
    process.exitCode = 2;
    return;
  }

  const laudosDir = path.join(process.cwd(), 'storage', 'laudos');
  const pdfPath = path.join(laudosDir, `laudo-${laudoId}.pdf`);

  try {
    await fs.access(pdfPath);
  } catch (err) {
    console.error(`Arquivo não encontrado: ${pdfPath}`);
    process.exitCode = 3;
    return;
  }

  console.log(`[UPLOAD] Lendo arquivo ${pdfPath}`);
  const pdfBuffer = await fs.readFile(pdfPath);

  // Tentar descobrir lote_id via DB
  let loteId: number | null = null;
  try {
    const res = await query(`SELECT lote_id FROM laudos WHERE id = $1`, [
      laudoId,
    ]);
    if (res.rows.length === 0) {
      console.warn(
        `[UPLOAD] Registro de laudo não encontrado no DB para id=${laudoId}. Tentando prosseguir sem loteId.`
      );
    } else {
      loteId = res.rows[0].lote_id;
      console.log(
        `[UPLOAD] Encontrado lote_id=${loteId} para laudo ${laudoId}`
      );
    }
  } catch (err: any) {
    console.warn(
      '[UPLOAD] Não foi possível consultar o DB para obter lote_id:',
      err?.message || String(err)
    );
    console.warn(
      '[UPLOAD] Se o DB não estiver disponível, será necessário fornecer variáveis de ambiente ou executar manualmente.'
    );
  }

  try {
    if (!loteId) {
      // fallback: usar 0 para loteId — o upload para Backblaze não exige loteId, mas nossa função espera um número
      loteId = 0;
    }

    const res = await uploadLaudoToBackblaze(laudoId, loteId, pdfBuffer);
    console.log('[UPLOAD] Upload concluído:', res);
    console.log(
      `[UPLOAD] Verifique storage/laudos/laudo-${laudoId}.json para metadados atualizados`
    );
  } catch (err: any) {
    console.error(
      '[UPLOAD] Falha ao enviar laudo:',
      err instanceof Error ? err.message : String(err)
    );
    process.exitCode = 4;
  }
}

main().catch((err) => {
  console.error('[UPLOAD] Erro inesperado:', err);
  process.exitCode = 5;
});
