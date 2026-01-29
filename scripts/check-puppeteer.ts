import { config } from 'dotenv';
config({ path: '.env.local' });

(async () => {
  try {
    const mod =
      await import('../lib/infrastructure/pdf/generators/pdf-generator');
    const { getPuppeteerInstance } = mod;
    console.log('[CHECK-PUPP] Obtendo instância do Puppeteer...');
    const inst = await getPuppeteerInstance();
    console.log(
      '[CHECK-PUPP] Instância obtida:',
      typeof inst,
      Object.keys(inst || {})
    );

    // se for objeto com launch, não vamos lançar aqui - apenas verificar shape
    if ((inst as any).launch) {
      console.log('[CHECK-PUPP] Instância tem launch -> OK');
    } else {
      console.warn(
        '[CHECK-PUPP] Instância NÃO possui launch - formato inesperado'
      );
    }

    process.exit(0);
  } catch (err) {
    console.error('[CHECK-PUPP] Erro ao obter instância do Puppeteer:', err);
    if (err instanceof Error) console.error(err.stack);
    process.exit(2);
  }
})();
