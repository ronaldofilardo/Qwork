import { emitirLaudoImediato } from '@/lib/laudo-auto';

const loteId = Number(process.argv[2] || 26);

(async () => {
  try {
    console.log('Invocando emitirLaudoImediato para lote', loteId);
    const result = await emitirLaudoImediato(loteId);
    console.log('Resultado emitirLaudoImediato:', result);
    process.exit(0);
  } catch (err) {
    console.error(
      'Erro ao executar emitirLaudoImediato:',
      err instanceof Error ? err.stack || err.message : err
    );
    process.exit(1);
  }
})();
