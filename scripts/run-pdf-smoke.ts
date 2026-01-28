async function run() {
  try {
    // Import dinâmico para respeitar resolução ESM do projeto
    const mod =
      await import('../lib/infrastructure/pdf/generators/pdf-generator');
    const { gerarPdf } = mod;

    console.log('[SMOKE] Iniciando geração de PDF de teste...');

    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Smoke Test</title>
    <style>body{font-family:Arial,sans-serif;padding:40px} .hash-section{margin-top:20px;font-size:10px;color:#666}</style>
  </head>
  <body>
    <h1>PDF Smoke Test</h1>
    <p>Este PDF é gerado durante o smoke test.</p>
    <div class="hash-section">{{HASH_PDF}}</div>
  </body>
</html>`;

    const result = await gerarPdf({
      tipo: 'recibo',
      html,
      filename: 'smoke-test.pdf',
      includeHash: true,
      saveToDisk: true,
      storageSubpath: 'smoke-tests',
    });

    console.log('[SMOKE] Geração concluída ✅');
    console.log('[SMOKE] hash:', result.hash);
    console.log('[SMOKE] size:', result.size);
    console.log('[SMOKE] localPath:', result.localPath || 'não salvo');
    process.exit(0);
  } catch (err) {
    console.error('[SMOKE] Falha na geração de PDF:', err);
    process.exit(2);
  }
}

void run();
