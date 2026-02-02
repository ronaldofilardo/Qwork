import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { query } from '@/lib/db';

const EMISSOR_OFICIAL = '53051173991';

async function main() {
  console.log('=========================================');
  console.log('CORRIGINDO EMISSOR_CPF (SAFE - SET LOCAL)');
  console.log('=========================================\n');

  try {
    // 1. Verificar quantos laudos precisam correção
    const check = await query(
      `SELECT id, lote_id, emissor_cpf, status FROM laudos WHERE (emissor_cpf = '00000000000' OR emissor_cpf IS NULL) AND status = 'enviado'`
    );

    if (check.rowCount === 0) {
      console.log(
        'Nenhum laudo ENVIADO com emissor incorreto ou nulo encontrado. Nada a fazer.'
      );
      return;
    }

    console.log(
      `Encontrados ${check.rowCount} laudos ENVIADOS com emissor incorreto ou nulo:`
    );
    console.table(check.rows);

    // 2. Tentar correção segura usando SET LOCAL dentro de transação
    console.log('\nTentando correção segura (SET LOCAL app.current_user_*)...');
    await query('BEGIN');
    await query(`SET LOCAL app.current_user_cpf = '${EMISSOR_OFICIAL}'`);
    await query(`SET LOCAL app.current_user_perfil = 'emissor'`);

    const res = await query(
      `UPDATE laudos
       SET emissor_cpf = $1, atualizado_em = NOW()
       WHERE (emissor_cpf = '00000000000' OR emissor_cpf IS NULL) AND status = 'enviado'
       RETURNING id, lote_id, emissor_cpf`,
      [EMISSOR_OFICIAL]
    );

    await query('COMMIT');

    console.log(
      `\n✓ ${res.rowCount} laudos atualizados com sucesso (modo SAFE):`
    );
    console.table(res.rows);
  } catch (error) {
    console.error('\n❌ Erro durante correção SAFE (vai dar rollback):', error);
    try {
      await query('ROLLBACK');
    } catch (rbErr) {
      console.error('Erro ao dar rollback:', rbErr);
    }
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Erro:', err);
    process.exit(1);
  });
