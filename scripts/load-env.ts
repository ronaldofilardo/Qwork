import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

export function loadEnv() {
  const root = process.cwd();
  const emissorPath = path.join(root, '.env.emissor.local');
  const localPath = path.join(root, '.env.local');

  if (fs.existsSync(emissorPath)) {
    console.log('[ENV] Carregando .env.emissor.local');
    dotenv.config({ path: emissorPath });
    return;
  }

  if (fs.existsSync(localPath)) {
    console.log('[ENV] Carregando .env.local');
    dotenv.config({ path: localPath });
    return;
  }

  console.warn(
    '[ENV] Nenhum arquivo .env.emissor.local ou .env.local encontrado. Usando variáveis de ambiente do sistema.'
  );
}
