// Script para instalar os binários do @sparticuz/chromium durante o postinstall
(async () => {
  try {
    const chromium = require('@sparticuz/chromium');
    if (chromium && typeof chromium.install === 'function') {
      console.log('[postinstall] Instalando binários do @sparticuz/chromium...');
      await chromium.install();
      console.log('[postinstall] Binários do @sparticuz/chromium instalados com sucesso');
    } else {
      console.log('[postinstall] @sparticuz/chromium não expõe função install. Nenhuma ação necessária.');
    }
  } catch (err) {
    console.warn('[postinstall] Falha ao instalar @sparticuz/chromium:', err && err.message ? err.message : err);
    process.exit(0); // não falhar o postinstall para não quebrar deploys automatizados
  }
})();