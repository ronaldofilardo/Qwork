#!/usr/bin/env node

/**
 * CLI wrapper para o processador de fila implementado em `lib/laudo-auto-refactored`
 * Este arquivo apenas delega a execução para a função compartilhada e garante
 * saída com código apropriado para uso em cron/systemd.
 */

import { processarFilaEmissao } from '../lib/laudo-auto-refactored';

async function main(): Promise<void> {
  const startTime = Date.now();
  console.log('\n========================================');
  console.log('Worker de Fila de Emissão (wrapper)');
  console.log(`Início: ${new Date().toISOString()}`);
  console.log('========================================\n');

  try {
    await processarFilaEmissao();

    const duration = Date.now() - startTime;
    console.log('\n========================================');
    console.log('✅ Worker concluído com sucesso');
    console.log(`Duração: ${duration}ms`);
    console.log('========================================\n');
    process.exit(0);
  } catch (err) {
    console.error(
      '[WORKER] Erro ao processar fila:',
      err instanceof Error ? err.message : String(err)
    );
    process.exit(1);
  }
}

if (require.main === module) {
  void main();
}

export default main;
