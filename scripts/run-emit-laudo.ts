import { config } from 'dotenv';
config({ path: '.env.development' });

import { emitirLaudoImediato } from '@/lib/laudo-auto';

async function main() {
  const args = process.argv
    .slice(2)
    .map((s) => Number(s))
    .filter((n) => !Number.isNaN(n));
  if (args.length === 0) {
    console.error('Uso: tsx scripts/run-emit-laudo.ts <loteId> [<loteId>...]');
    process.exit(1);
  }

  for (const loteId of args) {
    try {
      console.log(`[RUN-EMIT] Iniciando emissão para lote ${loteId}...`);
      const result = await emitirLaudoImediato(loteId);
      console.log(`[RUN-EMIT] Resultado para lote ${loteId}:`, result);
    } catch (err) {
      console.error(`[RUN-EMIT] Erro ao emitir lote ${loteId}:`, err);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
