import { config } from 'dotenv';

config({ path: '.env.development' });

async function main() {
  try {
    // Import dinâmico após carregar variáveis de ambiente
    const { emitirLaudosAutomaticamente, enviarLaudosAutomaticamente } = await import('../lib/laudo-auto');

    console.log('[RUN-LAUDO] Iniciando FASE 1 (emissão)');
    await emitirLaudosAutomaticamente();

    console.log('[RUN-LAUDO] Iniciando FASE 2 (envio)');
    await enviarLaudosAutomaticamente();

    console.log('[RUN-LAUDO] Fluxo automático finalizado');
  } catch (err) {
    console.error('[RUN-LAUDO] Erro ao executar fluxo automático:', err);
    process.exit(1);
  }
}

main();