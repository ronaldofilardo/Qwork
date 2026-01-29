import { config } from 'dotenv';
config({ path: '.env.local' });

(async () => {
  try {
    const mod =
      await import('../lib/infrastructure/pdf/generators/pdf-generator');
    const { getPuppeteerInstance } = mod;

    const html = `<!doctype html><html><body><h1>Step Debug</h1><div class="hash-section">{{HASH_PDF}}</div></body></html>`;

    console.log('[STEP] getPuppeteerInstance');
    const puppeteer = await getPuppeteerInstance();

    console.log('[STEP] launch');
    const browser = await (puppeteer as any).launch({
      headless: true,
      args: ['--no-sandbox'],
      timeout: 30000,
    });

    console.log('[STEP] newPage');
    const page = await browser.newPage();

    console.log('[STEP] setDefaultTimeouts');
    try {
      if (typeof (page as any).setDefaultNavigationTimeout === 'function')
        (page as any).setDefaultNavigationTimeout(120000);
      else if (typeof (page as any).setDefaultTimeout === 'function')
        (page as any).setDefaultTimeout(120000);
    } catch (e) {
      console.warn('[STEP] setDefaultTimeouts failed', e);
    }

    console.log('[STEP] setContent start');
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 120000 });
    console.log('[STEP] setContent done');

    console.log('[STEP] generate pdf');
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
    });
    console.log(
      '[STEP] pdf generated, size:',
      (pdf as any).byteLength || pdf.length
    );

    console.log('[STEP] close browser');
    await browser.close();

    console.log('[STEP] done');
    process.exit(0);
  } catch (err) {
    console.error('[STEP] erro em step:', err);
    if (err instanceof Error) console.error(err.stack);
    process.exit(2);
  }
})();
