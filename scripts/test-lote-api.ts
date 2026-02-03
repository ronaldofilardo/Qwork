import { query } from '../lib/db';

async function testLoteAPI() {
  console.log('🔍 Testando query da API de lote...\n');

  // Simular a query que a API faz (lote 1 e lote 2)
  for (const loteId of [1, 2]) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`LOTE #${loteId}`);
    console.log('='.repeat(60));

    // Query de estatísticas
    const statsResult = await query(
      `
      SELECT
        COUNT(DISTINCT f.id) as total_funcionarios,
        COUNT(DISTINCT CASE WHEN a.status = 'concluida' THEN f.id END) as funcionarios_concluidos,
        COUNT(DISTINCT CASE WHEN a.status != 'concluida' THEN f.id END) as funcionarios_pendentes
      FROM avaliacoes a
      JOIN funcionarios f ON a.funcionario_cpf = f.cpf
      WHERE a.lote_id = $1
    `,
      [loteId]
    );

    console.log('\n📊 Estatísticas:');
    console.log(`  Total: ${statsResult.rows[0].total_funcionarios}`);
    console.log(`  Concluídos: ${statsResult.rows[0].funcionarios_concluidos}`);
    console.log(`  Pendentes: ${statsResult.rows[0].funcionarios_pendentes}`);

    // Query de funcionários
    const funcionariosResult = await query(
      `
      SELECT
        f.cpf,
        f.nome,
        f.setor,
        f.funcao,
        f.nivel_cargo,
        a.id as avaliacao_id,
        a.status as avaliacao_status,
        a.inicio as avaliacao_data_inicio,
        a.envio as avaliacao_data_conclusao,
        a.motivo_inativacao,
        a.inativada_em
      FROM funcionarios f
      JOIN avaliacoes a ON a.funcionario_cpf = f.cpf
      WHERE a.lote_id = $1
      ORDER BY f.nome ASC
    `,
      [loteId]
    );

    console.log(`\n👥 Funcionários (${funcionariosResult.rows.length}):\n`);

    funcionariosResult.rows.forEach((func: any) => {
      console.log(`  ${func.nome} (${func.cpf})`);
      console.log(`    Avaliação #${func.avaliacao_id}`);
      console.log(`    Status: ${func.avaliacao_status}`);
      console.log(`    Início: ${func.avaliacao_data_inicio}`);
      console.log(`    Conclusão: ${func.avaliacao_data_conclusao || 'NULL'}`);
      console.log('');
    });
  }

  process.exit(0);
}

testLoteAPI().catch((err) => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
