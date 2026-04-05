import { query } from '../lib/db';

async function checkDirectStatus() {
  console.log('🔍 Verificando status direto no banco de produção...\n');

  const result = await query(
    'SELECT id, funcionario_cpf, status, inicio, envio FROM avaliacoes WHERE id IN (1,2,3,4) ORDER BY id'
  );

  console.table(result.rows);

  process.exit(0);
}

checkDirectStatus().catch((err) => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
