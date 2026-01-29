import { config } from 'dotenv';
config({ path: '.env.local' });

(async () => {
  try {
    const mod =
      await import('../lib/infrastructure/pdf/generators/pdf-generator');
    const { getPuppeteerInstance } = mod;
    console.log('[CHECK-LAUNCH] Obtendo instância...');
    const puppeteer = await getPuppeteerInstance();
    console.log('[CHECK-LAUNCH] Iniciando launch (não navegando)...');
    const browser = await (puppeteer as any).launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      timeout: 30000,
    });
    console.log('[CHECK-LAUNCH] Browser iniciado com sucesso');
    await (browser as any).close();
    console.log('[CHECK-LAUNCH] Browser fechado com sucesso');
    process.exit(0);
  } catch (err) {
    console.error('[CHECK-LAUNCH] Erro durante launch:', err);
    if (err instanceof Error) console.error(err.stack);
    process.exit(2);
  }
})();
