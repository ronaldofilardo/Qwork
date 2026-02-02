#!/usr/bin/env -S node --loader ts-node/esm

/**
 * Mostrar variáveis BACKBLAZE e flags relevantes (valores mascarados)
 * Uso: pnpm tsx scripts/show-backblaze-env.mts
 */
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const keys = Object.keys(process.env).filter((k) =>
  /BACKBLAZE_|DISABLE_LAUDO_REMOTE|DISABLE_REMOTE_STORAGE|NODE_ENV/i.test(k)
);

function mask(v: string | undefined) {
  if (!v) return '(unset)';
  if (v.length <= 8) return v;
  return v.slice(0, 8) + '...';
}

const out: Record<string, string> = {};
for (const k of keys.sort()) {
  out[k] = mask(process.env[k]);
}

console.log('[ENV] Relevant vars (masked):');
console.table(out);
