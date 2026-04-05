// CommonJS postinstall installer for Puppeteer Chromium
const { execSync } = require('child_process');

try {
  console.log('[postinstall.cjs] Instalando Chrome para Puppeteer (npx puppeteer install --product=chrome)...');
  execSync('npx --yes puppeteer@24.31.0 install --product=chrome', { stdio: 'inherit' });
  console.log('[postinstall.cjs] Chrome para Puppeteer instalado com sucesso');
} catch (err) {
  console.warn('[postinstall.cjs] Falha ao instalar Chrome para Puppeteer (não fatal):', err && err.message ? err.message : err);
  // Não falhar o postinstall para não travar deploys automáticos, mas logamos instrução crucial
  console.warn('[postinstall.cjs] Se estiver em produção, configure build step para executar este script explicitamente');
}
