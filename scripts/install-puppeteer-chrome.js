// Script para instalar Chromium usado pelo Puppeteer durante build (executar no CI/build step)
const { execSync } = require('child_process');

try {
  console.log('[postinstall] Instalando Chrome para Puppeteer (npx puppeteer install --product=chrome)...');
  // Forçar instalação de navegador (usar npx para garantir download independente de gerenciador)
  execSync('npx --yes puppeteer@24.31.0 install --product=chrome', { stdio: 'inherit' });
  console.log('[postinstall] Chrome para Puppeteer instalado com sucesso');
} catch (err) {
  console.warn('[postinstall] Falha ao instalar Chrome para Puppeteer (não fatal):', err && err.message ? err.message : err);
  // Não falhar o build para não travar deploys automáticos, mas logamos instrução crucial
  console.warn('[postinstall] Se estiver em produção, configure build step para executar este script explicitamente');
}
