import 'dotenv/config';
import { emitirLaudosAutomaticamente } from '@/lib/laudo-auto';

(async () => {
  try {
    console.log('[SCRIPT] Iniciando emissão automática (one-shot)');
    await emitirLaudosAutomaticamente();
    console.log('[SCRIPT] Emissão concluída');
    process.exit(0);
  } catch (err) {
    console.error('[SCRIPT] Erro na emissão:', err);
    process.exit(1);
  }
})();
