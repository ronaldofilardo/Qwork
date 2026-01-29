import { config } from 'dotenv';
config({ path: '.env.local' });

(async () => {
  try {
    const mod =
      await import('../lib/infrastructure/pdf/generators/pdf-generator');
    const { getPuppeteerInstance } = mod;

    const htmlTemplate = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>PDF Full Steps</title>
    <style>body{font-family:Arial,sans-serif;padding:40px} .hash-section{margin-top:20px;font-size:10px;color:#666}</style>
  </head>
  <body>
    <h1>PDF Full Steps</h1>
    <p>Gerando inicial, calculando hash, injetando e gerando final</p>
    <div class="hash-section">{{HASH_PDF}}</div>
  </body>
</html>`;

    console.log('[FULL] getPuppeteerInstance');
    const puppeteer = await getPuppeteerInstance();

    console.log('[FULL] launch');
    const browser = await (puppeteer as any).launch({
      headless: true,
      args: ['--no-sandbox'],
      timeout: 30000,
    });

    console.log('[FULL] newPage');
    const page = await browser.newPage();

    console.log('[FULL] initial setContent');
    await page.setContent(htmlTemplate.replace('{{HASH_PDF}}', 'CALCULANDO'), {
      waitUntil: 'networkidle0',
      timeout: 120000,
    });

    console.log('[FULL] initial pdf');
    const initial = await page.pdf({ format: 'A4', printBackground: true });
    console.log('[FULL] initial size', initial.length);

    console.log('[FULL] calc hash');
    const crypto = await import('crypto');
    const hash = crypto.createHash('sha256').update(initial).digest('hex');
    console.log('[FULL] hash', hash.substring(0, 16) + '...');

    console.log('[FULL] inject hash and setContent');
    await page.setContent(htmlTemplate.replace('{{HASH_PDF}}', hash), {
      waitUntil: 'networkidle0',
      timeout: 120000,
    });

    console.log('[FULL] final pdf');
    const final = await page.pdf({ format: 'A4', printBackground: true });
    console.log('[FULL] final size', final.length);

    console.log('[FULL] closing');
    await browser.close();

    console.log('[FULL] done');
    process.exit(0);
  } catch (err) {
    console.error('[FULL] erro:', err);
    if (err instanceof Error) console.error(err.stack);
    process.exit(2);
  }
})();
