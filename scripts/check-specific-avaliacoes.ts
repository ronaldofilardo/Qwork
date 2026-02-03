import { query } from '../lib/db';

async function checkSpecificEvaluations() {
  console.log('🔍 Verificando avaliações específicas (IDs 1, 2, 3, 4)...\n');

  const result = await query(`
    SELECT 
      a.id,
      a.funcionario_cpf,
      a.status,
      a.inicio,
      a.envio,
      a.lote_id,
      l.numero_ordem,
      COUNT(DISTINCT (r.grupo, r.item)) as total_respostas,
      f.nome as funcionario_nome
    FROM avaliacoes a
    LEFT JOIN respostas r ON a.id = r.avaliacao_id
    LEFT JOIN lotes_avaliacao l ON a.lote_id = l.id
    LEFT JOIN funcionarios f ON a.funcionario_cpf = f.cpf
    WHERE a.id IN (1, 2, 3, 4)
    GROUP BY a.id, a.funcionario_cpf, a.status, a.inicio, a.envio, a.lote_id, l.numero_ordem, f.nome
    ORDER BY a.id
  `);

  console.log('📊 Resultado:\n');

  for (const row of result.rows) {
    console.log(`Avaliação #${row.id}:`);
    console.log(
      `  Funcionário: ${row.funcionario_nome || 'N/A'} (${row.funcionario_cpf})`
    );
    console.log(`  Status: ${row.status}`);
    console.log(`  Início: ${row.inicio}`);
    console.log(`  Envio: ${row.envio || 'NULL'}`);
    console.log(`  Lote: #${row.lote_id} (ordem ${row.numero_ordem})`);
    console.log(`  Respostas: ${row.total_respostas}/37`);
    console.log('');
  }

  // Verificar se há alguma com 37+ respostas mas não concluída
  const toFix = result.rows.filter(
    (r: any) => r.total_respostas >= 37 && r.status !== 'concluida'
  );

  if (toFix.length > 0) {
    console.log(
      `⚠️  Encontradas ${toFix.length} avaliações que precisam correção:\n`
    );
    toFix.forEach((r: any) =>
      console.log(
        `  - Avaliação #${r.id}: ${r.total_respostas} respostas, status '${r.status}'`
      )
    );
  } else {
    console.log('✅ Todas essas avaliações estão com status correto!');
  }

  process.exit(0);
}

checkSpecificEvaluations().catch((err) => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
