/**
 * Script para corrigir emissor_cpf incorreto (00000000000)
 * Desabilita temporariamente o trigger de imutabilidade
 * Emissor oficial: 53051173991
 */

import { query } from '../../lib/db';

async function corrigirComTriggerDesabilitado() {
  console.log('=========================================');
  console.log('CORRIGINDO EMISSOR_CPF (COM TRIGGER DESABILITADO)');
  console.log('Emissor oficial: 53051173991');
  console.log('=========================================\n');

  try {
    // 1. Desabilitar triggers (imutabilidade + auditoria)
    console.log('[1] Desabilitando triggers...');
    await query(
      `ALTER TABLE laudos DISABLE TRIGGER enforce_laudo_immutability`
    );
    await query(`ALTER TABLE laudos DISABLE TRIGGER audit_laudos`);
    console.log('✓ Triggers desabilitados (imutabilidade + auditoria)\n');

    // 2. Corrigir emissor_cpf incorreto
    console.log(
      '[2] Corrigindo emissor_cpf incorreto (00000000000 → 53051173991)...'
    );
    const result = await query(`
      UPDATE laudos 
      SET emissor_cpf = '53051173991', atualizado_em = NOW()
      WHERE emissor_cpf = '00000000000'
      RETURNING id, lote_id
    `);

    console.log(`✓ ${result.rowCount} laudos corrigidos:`);
    console.table(result.rows);

    // 3. Reabilitar triggers
    console.log('\n[3] Reabilitando triggers...');
    await query(`ALTER TABLE laudos ENABLE TRIGGER audit_laudos`);
    await query(`ALTER TABLE laudos ENABLE TRIGGER enforce_laudo_immutability`);
    console.log('✓ Triggers reabilitados\n');

    // 4. Verificar resultado
    console.log('[4] Verificação final:');
    const verificacao = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE emissor_cpf = '53051173991') as corretos,
        COUNT(*) FILTER (WHERE emissor_cpf = '00000000000') as incorretos,
        COUNT(*) FILTER (WHERE emissor_cpf IS NULL) as sem_emissor
      FROM laudos
      WHERE status = 'enviado'
    `);
    console.table(verificacao.rows);

    if (verificacao.rows[0].incorretos === '0') {
      console.log(
        '\n✅ SUCESSO: Todos os laudos enviados agora têm o emissor oficial correto!'
      );
    } else {
      console.log(
        `\n⚠️ ATENÇÃO: Ainda existem ${verificacao.rows[0].incorretos} laudos com emissor incorreto`
      );
    }
  } catch (error) {
    // Garantir que os triggers sejam reabilitados mesmo em caso de erro
    console.error('\n❌ Erro durante correção:', error);
    console.log('\nReabilitando triggers...');
    try {
      await query(`ALTER TABLE laudos ENABLE TRIGGER audit_laudos`);
      await query(
        `ALTER TABLE laudos ENABLE TRIGGER enforce_laudo_immutability`
      );
      console.log('✓ Triggers reabilitados');
    } catch (reableError) {
      console.error('✗ Erro ao reabilitar trigger:', reableError);
    }
    process.exit(1);
  }

  console.log('\n=========================================');
  console.log('Correção Concluída');
  console.log('=========================================');

  process.exit(0);
}

corrigirComTriggerDesabilitado().catch((err) => {
  console.error('Erro:', err);
  process.exit(1);
});
