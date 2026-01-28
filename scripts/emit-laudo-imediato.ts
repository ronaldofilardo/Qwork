import 'dotenv/config';
import { emitirLaudoImediato } from '@/lib/laudo-auto';

async function main() {
  const loteId = 7; // lote relacionado ao código 007-260126
  console.log(`Iniciando emissão imediata para lote ${loteId}...`);
  try {
    const result = await emitirLaudoImediato(loteId);
    console.log(`Resultado da emissão: ${result}`);
  } catch (err: any) {
    console.error('Erro durante emissão imediata:', err?.message || err);
    process.exit(1);
  }
}

main();
