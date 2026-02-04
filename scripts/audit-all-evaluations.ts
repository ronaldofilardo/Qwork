import { query } from '../lib/db';

async function auditAllEvaluations() {
  console.log('🔍 Auditoria completa de avaliações...\n');

  // Buscar TODAS as avaliações com contagem de respostas
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
    GROUP BY a.id, a.funcionario_cpf, a.status, a.inicio, a.envio, a.lote_id, l.numero_ordem, f.nome
    ORDER BY a.id
  `);

  console.log(`📊 Total de avaliações no sistema: ${result.rows.length}\n`);

  // Separar por categoria
  const corretas = [];
  const incorretas = [];

  for (const row of result.rows) {
    const respostas = parseInt(row.total_respostas);
    const status = row.status;

    let problema = null;

    // Verificar inconsistências
    if (respostas >= 37 && status !== 'concluida') {
      problema = `❌ TEM 37 respostas mas status = '${status}'`;
      incorretas.push({ ...row, problema });
    } else if (respostas < 37 && status === 'concluida') {
      problema = `❌ Status 'concluida' mas só tem ${respostas} respostas`;
      incorretas.push({ ...row, problema });
    } else {
      corretas.push(row);
    }
  }

  // Resumo
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`✅ Avaliações CORRETAS: ${corretas.length}`);
  console.log(`❌ Avaliações INCORRETAS: ${incorretas.length}\n`);
  console.log('═══════════════════════════════════════════════════════════\n');

  if (incorretas.length > 0) {
    console.log('⚠️  AVALIAÇÕES COM PROBLEMAS:\n');

    incorretas.forEach((av) => {
      console.log(`🔴 Avaliação #${av.id}:`);
      console.log(
        `   Funcionário: ${av.funcionario_nome} (${av.funcionario_cpf})`
      );
      console.log(`   Lote: #${av.lote_id} (ordem ${av.numero_ordem})`);
      console.log(`   Status atual: ${av.status}`);
      console.log(`   Respostas: ${av.total_respostas}/37`);
      console.log(`   Início: ${av.inicio}`);
      console.log(`   Envio: ${av.envio || 'NULL'}`);
      console.log(`   >>> ${av.problema}`);
      console.log('');
    });

    console.log(
      '\n🔧 Deseja corrigir automaticamente? (Criar script de correção)\n'
    );
  } else {
    console.log('✨ Todas as avaliações estão com status consistente!\n');
    console.log('Detalhamento:');

    const byStatus = {
      concluida: corretas.filter((a) => a.status === 'concluida'),
      inativada: corretas.filter((a) => a.status === 'inativada'),
      iniciada: corretas.filter((a) => a.status === 'iniciada'),
      em_andamento: corretas.filter((a) => a.status === 'em_andamento'),
    };

    console.log(
      `  - Concluídas: ${byStatus.concluida.length} (todas com 37 respostas)`
    );
    console.log(`  - Inativadas: ${byStatus.inativada.length}`);
    console.log(`  - Iniciadas: ${byStatus.iniciada.length} (em andamento)`);
    console.log(`  - Em andamento: ${byStatus.em_andamento.length}`);
  }

  process.exit(incorretas.length > 0 ? 1 : 0);
}

auditAllEvaluations().catch((err) => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
