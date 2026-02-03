import { loadEnv } from './load-env';
loadEnv();

(async () => {
  try {
    const mod =
      await import('../lib/infrastructure/pdf/generators/pdf-generator');
    const { gerarPdf } = mod;

    console.log(
      '[SMOKE-NOSAVE] Iniciando geração de PDF de teste (no save)...'
    );

    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Smoke Test No Save</title>
    <style>body{font-family:Arial,sans-serif;padding:40px} .hash-section{margin-top:20px;font-size:10px;color:#666}</style>
  </head>
  <body>
    <h1>PDF Smoke Test No Save</h1>
    <p>Este PDF é gerado durante o smoke test (no save).</p>
    <div class="hash-section">{{HASH_PDF}}</div>
  </body>
</html>`;

    const result = await gerarPdf({
      tipo: 'recibo',
      html,
      filename: 'smoke-test-no-save.pdf',
      includeHash: true,
      saveToDisk: false,
      storageSubpath: 'smoke-tests',
    });

    console.log('[SMOKE-NOSAVE] Geração concluída ✅');
    console.log('[SMOKE-NOSAVE] hash:', result.hash);
    console.log('[SMOKE-NOSAVE] size:', result.size);
    console.log('[SMOKE-NOSAVE] localPath:', result.localPath || 'não salvo');
    process.exit(0);
  } catch (err) {
    console.error('[SMOKE-NOSAVE] Falha na geração de PDF (stack):', err);
    if (err instanceof Error) console.error(err.stack);
    process.exit(2);
  }
})();
