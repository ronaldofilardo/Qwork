import { config } from 'dotenv';
config({ path: '.env.development' });

import path from 'path';
import fs from 'fs/promises';
import { argv } from 'process';
import { findLatestLaudoForLote, checkBackblazeFileExists } from '@/lib/storage/backblaze-client';

async function usage() {
  console.log('Usage: node scripts/link-remote-laudos.ts [--dry-run] [--limit N]');
}

function parseArgs() {
  const args = argv.slice(2);
  return {
    dryRun: args.includes('--dry-run'),
    limit: (() => {
      const i = args.indexOf('--limit');
      if (i >= 0) return Number(args[i + 1]) || 100;
      return 100;
    })(),
  };
}

async function main() {
  const { dryRun, limit } = parseArgs();
  console.log(`[LINK] Starting link remote laudos (dryRun=${dryRun}, limit=${limit})`);

  const { query } = await import('@/lib/db');

  // Select laudos that have no arquivo_remoto metadata or no metadata file
  const res = await query(
    `SELECT l.id AS laudo_id, l.lote_id
     FROM laudos l
     LEFT JOIN (SELECT id, lote_id FROM laudos) sub ON sub.id = l.id
     WHERE 1 = 1
     ORDER BY l.id DESC
     LIMIT $1`,
    [limit]
  );

  for (const row of res.rows) {
    const laudoId: number = row.laudo_id;
    const loteId: number = row.lote_id;
    const metaPath = path.join(process.cwd(), 'storage', 'laudos', `laudo-${laudoId}.json`);

    // Check existing metadata file
    let meta: any = null;
    try {
      const raw = await fs.readFile(metaPath, 'utf-8');
      meta = JSON.parse(raw);
    } catch (e) {
      // no metadata file
    }

    if (meta?.arquivo_remoto?.key) {
      // already linked
      continue;
    }

    // Try to find latest object for lote
    const key = await findLatestLaudoForLote(loteId);
    if (!key) {
      console.log(`[LINK] No remote object found for laudo ${laudoId} (lote ${loteId})`);
      continue;
    }

    // Verify that object exists
    const exists = await checkBackblazeFileExists(key).catch((e) => {
      console.warn(`[LINK] Error checking existence for ${key}:`, e?.message || e);
      return false;
    });

    if (!exists) {
      console.log(`[LINK] Remote key found but object missing for ${key}`);
      continue;
    }

    const metaToWrite = Object.assign({}, meta || {}, {
      arquivo_remoto: {
        provider: 'backblaze',
        bucket: process.env.BACKBLAZE_BUCKET || 'laudos-qwork',
        key,
        url: `${process.env.BACKBLAZE_S2_ENDPOINT || process.env.BACKBLAZE_ENDPOINT || ''}/${process.env.BACKBLAZE_BUCKET || 'laudos-qwork'}/${key}`,
        uploadedAt: new Date().toISOString(),
      },
    });

    if (dryRun) {
      console.log(`[LINK][DRY] Would link laudo ${laudoId} -> ${key}`);
      continue;
    }

    try {
      await fs.writeFile(metaPath, JSON.stringify(metaToWrite, null, 2));
      console.log(`[LINK] Linked laudo ${laudoId} to remote key ${key}`);
    } catch (e) {
      console.error(`[LINK] Failed to write metadata for laudo ${laudoId}:`, e?.message || e);
    }
  }

  console.log('[LINK] Completed');
}

if (require.main === module) {
  main().catch((e) => {
    console.error('[LINK] Unhandled error:', e);
    process.exit(1);
  });
}

export { main };
