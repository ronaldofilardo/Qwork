import { query } from '../lib/db';

async function checkDataConsistency() {
  console.log('🔍 VERIFICAÇÃO DE CONSISTÊNCIA DE DADOS\n');
  console.log('='.repeat(80));

  // Verificar dados em PRODUÇÃO
  delete process.env.DATABASE_URL;

  console.log('\n📊 1. Verificando perfis vs usuario_tipo em funcionarios...');
  const perfilCheck = await query(`
    SELECT 
      perfil,
      usuario_tipo,
      COUNT(*) as total
    FROM funcionarios
    GROUP BY perfil, usuario_tipo
    ORDER BY perfil, usuario_tipo
  `);

  console.log('\n   Combinações perfil + usuario_tipo:');
  perfilCheck.rows.forEach((row: any) => {
    const match =
      row.perfil === row.usuario_tipo ||
      row.usuario_tipo.includes(row.perfil) ||
      (row.perfil === 'funcionario' &&
        row.usuario_tipo.startsWith('funcionario_'));
    const status = match ? '✅' : '❌';
    console.log(
      `   ${status} perfil="${row.perfil}" + usuario_tipo="${row.usuario_tipo}" (${row.total} registros)`
    );
  });

  console.log('\n📊 2. Verificando funcionários sem usuario_tipo ou perfil...');
  const missingData = await query(`
    SELECT 
      cpf,
      nome,
      perfil,
      usuario_tipo,
      ativo
    FROM funcionarios
    WHERE usuario_tipo IS NULL OR perfil IS NULL
  `);

  if (missingData.rows.length > 0) {
    console.log(
      `\n   ❌ ${missingData.rows.length} funcionários com dados faltando:`
    );
    missingData.rows.forEach((row: any) => {
      console.log(
        `   - CPF ${row.cpf}: perfil="${row.perfil}", usuario_tipo="${row.usuario_tipo}"`
      );
    });
  } else {
    console.log('   ✅ Todos os funcionários têm perfil e usuario_tipo');
  }

  console.log('\n📊 3. Verificando avaliacoes com status inválido...');
  const statusCheck = await query(`
    SELECT DISTINCT status, COUNT(*) as total
    FROM avaliacoes
    GROUP BY status
    ORDER BY status
  `);

  console.log('\n   Status de avaliações:');
  const validStatuses = ['iniciada', 'em_andamento', 'concluida', 'inativada'];
  statusCheck.rows.forEach((row: any) => {
    const isValid = validStatuses.includes(row.status);
    const status = isValid ? '✅' : '❌';
    console.log(`   ${status} "${row.status}" (${row.total} registros)`);
  });

  console.log(
    '\n📊 4. Verificando avaliacoes com 37 respostas mas não concluídas...'
  );
  const incompleteCheck = await query(`
    SELECT 
      a.id,
      a.funcionario_cpf,
      a.status,
      a.envio,
      COUNT(DISTINCT (r.grupo, r.item)) as total_respostas
    FROM avaliacoes a
    LEFT JOIN respostas r ON a.id = r.avaliacao_id
    WHERE a.status != 'inativada'
    GROUP BY a.id, a.funcionario_cpf, a.status, a.envio
    HAVING COUNT(DISTINCT (r.grupo, r.item)) >= 37 AND a.status != 'concluida'
  `);

  if (incompleteCheck.rows.length > 0) {
    console.log(
      `\n   ❌ ${incompleteCheck.rows.length} avaliações com 37+ respostas mas não concluídas:`
    );
    incompleteCheck.rows.forEach((row: any) => {
      console.log(
        `   - Avaliação #${row.id} (CPF ${row.funcionario_cpf}): ${row.total_respostas} respostas, status="${row.status}"`
      );
    });
  } else {
    console.log(
      '   ✅ Todas as avaliações com 37 respostas estão marcadas como concluídas'
    );
  }

  console.log('\n📊 5. Verificando lotes com status inconsistente...');
  const loteStatusCheck = await query(`
    SELECT 
      l.id,
      l.numero_ordem,
      l.status as lote_status,
      COUNT(DISTINCT a.id) FILTER (WHERE a.status IN ('iniciada', 'em_andamento')) as pendentes,
      COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'concluida') as concluidas,
      COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'inativada') as inativadas,
      COUNT(DISTINCT a.id) as total
    FROM lotes_avaliacao l
    LEFT JOIN avaliacoes a ON l.id = a.lote_id
    WHERE l.status != 'cancelado'
    GROUP BY l.id, l.numero_ordem, l.status
    ORDER BY l.id DESC
    LIMIT 10
  `);

  console.log('\n   Últimos 10 lotes:');
  loteStatusCheck.rows.forEach((row: any) => {
    const shouldBeConcluido = row.pendentes === 0 && row.concluidas > 0;
    const shouldBePendente = row.pendentes > 0;

    let expectedStatus = 'liberado';
    if (shouldBeConcluido) expectedStatus = 'concluido';
    else if (shouldBePendente) expectedStatus = 'liberado';

    const isCorrect =
      row.lote_status === expectedStatus ||
      (row.lote_status === 'emitido' && shouldBeConcluido) ||
      (row.lote_status === 'enviado' && shouldBeConcluido);

    const status = isCorrect ? '✅' : '⚠️';
    console.log(
      `   ${status} Lote #${row.id}: status="${row.lote_status}" | ${row.pendentes} pendentes, ${row.concluidas} concluídas, ${row.inativadas} inativadas`
    );
  });

  console.log('\n📊 6. Verificando triggers e funções críticas...');
  const triggersCheck = await query(`
    SELECT 
      event_object_table as table_name,
      trigger_name,
      action_statement
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
      AND event_object_table IN ('avaliacoes', 'lotes_avaliacao', 'respostas')
    ORDER BY event_object_table, trigger_name
  `);

  if (triggersCheck.rows.length > 0) {
    console.log(`\n   Triggers ativos:`);
    triggersCheck.rows.forEach((row: any) => {
      console.log(`   ✅ ${row.table_name}.${row.trigger_name}`);
    });
  } else {
    console.log('   ⚠️  Nenhum trigger encontrado nas tabelas críticas');
  }

  console.log('\n📊 7. Verificando função validar_sessao_rls...');
  const rlsFunctionCheck = await query(`
    SELECT 
      proname as function_name,
      prosrc as source
    FROM pg_proc
    WHERE proname = 'validar_sessao_rls'
  `);

  if (rlsFunctionCheck.rows.length > 0) {
    console.log('   ✅ Função validar_sessao_rls existe');
    const source = rlsFunctionCheck.rows[0].source;
    if (source.includes('current_user_perfil')) {
      console.log('   ✅ Função usa current_user_perfil');
    } else {
      console.log('   ⚠️  Função NÃO usa current_user_perfil');
    }
  } else {
    console.log('   ❌ Função validar_sessao_rls NÃO existe');
  }

  console.log('\n\n📊 RESUMO');
  console.log('='.repeat(80));
  console.log(
    'A análise acima mostra todos os pontos de inconsistência de dados.'
  );
  console.log('Use essas informações para criar correções específicas.\n');

  process.exit(0);
}

checkDataConsistency().catch((err) => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
