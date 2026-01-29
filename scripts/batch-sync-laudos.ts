import { config } from 'dotenv';
config({ path: '.env.development' });

import path from 'path';
import fs from 'fs/promises';
import { argv } from 'process';
import {
  uploadToBackblaze,
  checkBackblazeFileExists,
} from '@/lib/storage/backblaze-client';
import { calcularHash } from '@/lib/storage/laudo-storage';

async function usage() {
  console.log(
    'Usage: node scripts/batch-sync-laudos.ts [--dry-run] [--limit N] [--force]'
  );
}

function parseArgs() {
  const args = argv.slice(2);
  return {
    dryRun: args.includes('--dry-run'),
    force: args.includes('--force'),
    limit: (() => {
      const i = args.indexOf('--limit');
      if (i >= 0) return Number(args[i + 1]) || 50;
      return 50;
    })(),
  };
}

async function main() {
  const { dryRun, force, limit } = parseArgs();
  console.log(
    `[SYNC] Starting batch sync (dryRun=${dryRun}, force=${force}, limit=${limit})`
  );

  const { query } = await import('@/lib/db');

  // Fetch recent laudos (unbounded logic: we select recent ones and rely on idempotency)
  const res = await query(
    `SELECT id, lote_id FROM laudos ORDER BY id DESC LIMIT $1`,
    [limit]
  );
  const laudos = res.rows;

  for (const laudo of laudos) {
    const laudoId: number = laudo.id;
    const loteId: number = laudo.lote_id;
    const metaPath = path.join(
      process.cwd(),
      'storage',
      'laudos',
      `laudo-${laudoId}.json`
    );
    const localPath = path.join(
      process.cwd(),
      'storage',
      'laudos',
      `laudo-${laudoId}.pdf`
    );

    let meta: any = null;
    try {
      const raw = await fs.readFile(metaPath, 'utf-8');
      meta = JSON.parse(raw);
    } catch (e) {
      // missing metadata is fine
    }

    if (meta?.arquivo_remoto?.key && !force) {
      // Verify remote exists
      try {
        const ok = await checkBackblazeFileExists(meta.arquivo_remoto.key);
        if (ok) {
          console.log(
            `[SYNC] Laudo ${laudoId} já possui arquivo remoto e existe no bucket, pulando`
          );
          continue;
        }
        console.log(
          `[SYNC] Laudo ${laudoId} tem metadados remoto mas objeto ausente — reupload será tentado`
        );
      } catch (err) {
        console.warn(
          `[SYNC] Falha ao checar Backblaze para laudo ${laudoId}:`,
          err?.message || err
        );
      }
    }

    // Check local file
    let buffer: Buffer;
    try {
      buffer = (await fs.readFile(localPath)) as unknown as Buffer;
    } catch (err) {
      console.log(
        `[SYNC] Laudo ${laudoId} não possui arquivo local (${localPath}), pulando`
      );
      continue;
    }

    const hash = calcularHash(buffer);

    // Build key
    const timestamp = Date.now();
    const key = `laudos/lote-${loteId}/laudo-${timestamp}-sync-${laudoId}.pdf`;

    console.log(`[SYNC] Preparando upload para laudo ${laudoId} -> ${key}`);
    if (dryRun) {
      console.log(
        `[SYNC][DRY] Would upload laudo ${laudoId} (hash=${hash}) to ${key}`
      );
      continue;
    }

    try {
      const res = await uploadToBackblaze(buffer, key, 'application/pdf');
      // Persistir metadados locais
      const newMeta = Object.assign({}, meta || {}, {
        arquivo_remoto: {
          provider: 'backblaze',
          bucket: res.bucket || process.env.BACKBLAZE_BUCKET || 'laudos-qwork',
          key: res.key || key,
          url:
            res.url ||
            `${process.env.BACKBLAZE_S2_ENDPOINT || process.env.BACKBLAZE_ENDPOINT || ''}/${process.env.BACKBLAZE_BUCKET || 'laudos-qwork'}/${res.key || key}`,
          uploadedAt: new Date().toISOString(),
        },
        hash: hash,
      });
      await fs.writeFile(metaPath, JSON.stringify(newMeta, null, 2));
      console.log(
        `[SYNC] Upload concluído e metadados atualizados para laudo ${laudoId}`
      );
    } catch (err) {
      console.error(
        `[SYNC] Falha ao subir laudo ${laudoId}:`,
        err?.message || err
      );
    }
  }

  console.log('[SYNC] Batch sync concluído');
}

// Execute if run directly
main().catch((e) => {
  console.error('[SYNC] Erro não tratado:', e);
  process.exit(1);
});

export { main };
