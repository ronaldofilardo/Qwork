import { config } from 'dotenv';
config({ path: '.env.local' });

(async () => {
  try {
    const mod =
      await import('../lib/infrastructure/pdf/generators/pdf-generator');
    const { gerarPdf } = mod;

    console.log('[DEBUG-SMOKE] Iniciando geração de PDF de diagnóstico...');

    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Smoke Test Debug</title>
    <style>body{font-family:Arial,sans-serif;padding:40px} .hash-section{margin-top:20px;font-size:10px;color:#666}</style>
  </head>
  <body>
    <h1>PDF Smoke Test Debug</h1>
    <p>Este PDF é gerado durante o smoke test com diagnóstico.</p>
    <div class="hash-section">{{HASH_PDF}}</div>
  </body>
</html>`;

    const result = await gerarPdf({
      tipo: 'recibo',
      html,
      filename: 'smoke-debug.pdf',
      includeHash: true,
      saveToDisk: true,
      storageSubpath: 'smoke-tests',
    });

    console.log('[DEBUG-SMOKE] Geração concluída ✅');
    console.log('[DEBUG-SMOKE] hash:', result.hash);
    console.log('[DEBUG-SMOKE] size:', result.size);
    console.log('[DEBUG-SMOKE] localPath:', result.localPath || 'não salvo');
    process.exit(0);
  } catch (err) {
    console.error('[DEBUG-SMOKE] Falha na geração de PDF (stack):', err);
    if (err instanceof Error) console.error(err.stack);
    process.exit(2);
  }
})();
