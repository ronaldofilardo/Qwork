import { config } from 'dotenv';
config({ path: '.env.local' });

import { emitirLaudoImediato } from '../lib/laudo-auto';

(async () => {
  const loteId = 5;
  console.log(
    `\n[FORCE-EMIT] Forçando re-emissão do laudo para lote ${loteId}...`
  );
  console.log(
    '[INFO] Isso vai regenerar o PDF e atualizar o emissor se necessário\n'
  );

  const sucesso = await emitirLaudoImediato(loteId);

  console.log(`\n[FORCE-EMIT] Resultado: ${sucesso ? '✓ SUCESSO' : '✗ FALHA'}`);
  process.exit(sucesso ? 0 : 1);
})();
