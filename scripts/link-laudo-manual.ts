import { config } from 'dotenv';
config({ path: '.env.development' });

import path from 'path';
import fs from 'fs/promises';
import { argv } from 'process';

function usage() {
  console.log(
    'Usage: node scripts/link-laudo-manual.ts --laudo <id> --key <s3-key> [--bucket <bucket>] [--dry-run]'
  );
}

function parseArgs() {
  const args = argv.slice(2);
  return {
    laudoId: (() => {
      const i = args.indexOf('--laudo');
      if (i >= 0) return Number(args[i + 1]);
      return undefined;
    })(),
    key: (() => {
      const i = args.indexOf('--key');
      if (i >= 0) return args[i + 1];
      return undefined;
    })(),
    bucket: (() => {
      const i = args.indexOf('--bucket');
      if (i >= 0) return args[i + 1];
      return process.env.BACKBLAZE_BUCKET || 'laudos-qwork';
    })(),
    dryRun: args.includes('--dry-run'),
  };
}

async function main() {
  const { laudoId, key, bucket, dryRun } = parseArgs();

  if (!laudoId || !key) {
    usage();
    process.exit(1);
  }

  const metaPath = path.join(
    process.cwd(),
    'storage',
    'laudos',
    `laudo-${laudoId}.json`
  );

  const metaToWrite = {
    arquivo: `laudo-${laudoId}.pdf`,
    hash: null,
    criadoEm: new Date().toISOString(),
    arquivo_remoto: {
      provider: 'backblaze',
      bucket,
      key,
      url: `${process.env.BACKBLAZE_S2_ENDPOINT || process.env.BACKBLAZE_ENDPOINT || ''}/${bucket}/${key}`,
      uploadedAt: new Date().toISOString(),
    },
  };

  console.log(
    `[LINK-MANUAL] Laudo ${laudoId} -> ${bucket}/${key} (dryRun=${dryRun})`
  );

  if (dryRun) {
    console.log(JSON.stringify(metaToWrite, null, 2));
    return;
  }

  // Ensure directory exists
  const dir = path.dirname(metaPath);
  await fs.mkdir(dir, { recursive: true });

  await fs.writeFile(metaPath, JSON.stringify(metaToWrite, null, 2));
  console.log(`[LINK-MANUAL] Wrote metadata to ${metaPath}`);
}

if (require.main === module) {
  main().catch((e) => {
    console.error('[LINK-MANUAL] Error:', e);
    process.exit(1);
  });
}

export { main };
