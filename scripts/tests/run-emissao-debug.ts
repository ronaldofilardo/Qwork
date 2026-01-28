import dotenv from 'dotenv';
// Carrega .env.local explicitamente (usa Neon)
dotenv.config({ path: '.env.local', override: true });
// Forçar NODE_ENV em tempo de execução para simular ambiente de development
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
(process.env as any).NODE_ENV = 'development'; // Usa DATABASE_URL (Neon)
import { gerarLaudoCompletoEmitirPDF } from '@/lib/laudo-auto';

// Uso: npx tsx scripts/tests/run-emissao-debug.ts
// Executa em modo development para usar Neon (DATABASE_URL)
void (async () => {
  try {
    console.log(
      '[DEBUG] Iniciando emissão de laudo (development/Neon) - lote 11'
    );
    console.log('[DEBUG] NODE_ENV:', process.env.NODE_ENV);
    console.log('[DEBUG] DATABASE_URL presente:', !!process.env.DATABASE_URL);
    console.log('[INFO] Output files will be written to storage/laudos');

    const id = await gerarLaudoCompletoEmitirPDF(11, '00000000000');
    console.log('[DEBUG] ✅ Resultado: laudoId=', id);
  } catch (err) {
    console.error('[DEBUG] ❌ Erro na emissão de laudo:', err);
    process.exit(1);
  }
})();
