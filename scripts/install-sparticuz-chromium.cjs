// CommonJS postinstall installer for @sparticuz/chromium
try {
  const chromium = require('@sparticuz/chromium');
  if (chromium && typeof chromium.install === 'function') {
    console.log('[postinstall.cjs] Instalando binários do @sparticuz/chromium...');
    chromium.install()
      .then(() => console.log('[postinstall.cjs] Binários do @sparticuz/chromium instalados com sucesso'))
      .catch((err) => {
        console.warn('[postinstall.cjs] Falha ao instalar @sparticuz/chromium:', err && err.message ? err.message : err);
        // Não falhar o postinstall
      });
  } else {
    console.log('[postinstall.cjs] @sparticuz/chromium não expõe função install. Nenhuma ação necessária.');
  }
} catch (err) {
  console.warn('[postinstall.cjs] Falha ao instalar @sparticuz/chromium:', err && err.message ? err.message : err);
  // Não falhar o postinstall para não quebrar deploys automatizados
}
