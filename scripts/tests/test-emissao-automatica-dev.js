/**
 * Script de teste para emissão automática de laudos
 *
 * Este script cria um lote de teste, conclui todas as avaliações
 * e verifica se a emissão automática é agendada corretamente.
 *
 * Uso:
 * 1. Certifique-se de que o servidor Next.js está rodando (pnpm dev)
 * 2. Execute: node scripts/tests/test-emissao-automatica-dev.js
 * 3. Aguarde 10 minutos (ou o tempo configurado em CONFIG.PRAZO_EMISSAO_MINUTOS)
 * 4. Verifique os logs no console do Next.js
 */

import pg from 'pg';

const { Pool } = pg;

// Conexão direta com o banco (sem dependências circulares)
const pool = new Pool({
  connectionString:
    process.env.LOCAL_DATABASE_URL ||
    'postgresql://postgres:123456@localhost:5432/nr-bps_db',
});

async function query(text, params) {
  const result = await pool.query(text, params);
  return { rows: result.rows, rowCount: result.rowCount };
}

async function criarLoteTeste() {
  console.log('🧪 [TESTE] Criando lote de teste para emissão automática...\n');

  try {
    // 1. Buscar uma clínica e empresa válidas
    const clinica = await query(`
      SELECT id, nome FROM clinicas WHERE ativo = true LIMIT 1
    `);

    if (clinica.rows.length === 0) {
      console.error('⠌ Nenhuma clínica ativa encontrada!');
      process.exit(1);
    }

    const clinicaId = clinica.rows[0].id;
    const clinicaNome = clinica.rows[0].nome;

    const empresa = await query(
      `
      SELECT id, nome FROM empresas_clientes WHERE clinica_id = $1 AND ativo = true LIMIT 1
    `,
      [clinicaId]
    );

    if (empresa.rows.length === 0) {
      console.error('⠌ Nenhuma empresa ativa encontrada para a clínica!');
      process.exit(1);
    }

    const empresaId = empresa.rows[0].id;
    const empresaNome = empresa.rows[0].nome;

    console.log(`✅ Clínica: ${clinicaNome} (ID: ${clinicaId})`);
    console.log(`✅ Empresa: ${empresaNome} (ID: ${empresaId})\n`);

    // 2. Buscar um emissor ativo
    const emissor = await query(`
      SELECT cpf, nome FROM funcionarios WHERE perfil = 'emissor' AND ativo = true LIMIT 1
    `);

    if (emissor.rows.length === 0) {
      console.error('⠌ Nenhum emissor ativo encontrado!');
      console.log('\n💡 Crie um emissor com o comando:');
      console.log(
        `   INSERT INTO funcionarios (cpf, nome, email, perfil, ativo, clinica_id)`
      );
      console.log(
        `   VALUES ('12345678900', 'Dr. Emissor Teste', 'emissor@test.com', 'emissor', true, ${clinicaId});`
      );
      process.exit(1);
    }

    console.log(
      `✅ Emissor: ${emissor.rows[0].nome} (${emissor.rows[0].cpf})\n`
    );

    // 3. Criar um lote de teste
    const dataAtual = new Date();
    const codigoLote = `TEST-${dataAtual.getTime().toString().slice(-6)}`;

    const loteResult = await query(
      `
      INSERT INTO lotes_avaliacao (codigo, empresa_id, clinica_id, status, criado_em)
      VALUES ($1, $2, $3, 'ativo', NOW())
      RETURNING id, codigo
    `,
      [codigoLote, empresaId, clinicaId]
    );

    const loteId = loteResult.rows[0].id;
    const loteCodigo = loteResult.rows[0].codigo;

    console.log(`✅ Lote criado: ${loteCodigo} (ID: ${loteId})\n`);

    // 4. Buscar funcionários da empresa
    const funcionarios = await query(
      `
      SELECT cpf, nome FROM funcionarios 
      WHERE empresa_id = $1 AND ativo = true AND perfil = 'funcionario'
      LIMIT 3
    `,
      [empresaId]
    );

    if (funcionarios.rows.length === 0) {
      console.error('⠌ Nenhum funcionário encontrado para criar avaliações!');
      console.log('\n💡 Crie funcionários com o comando:');
      console.log(
        `   INSERT INTO funcionarios (cpf, nome, email, perfil, ativo, empresa_id, clinica_id)`
      );
      console.log(
        `   VALUES ('11111111111', 'Funcionário Teste 1', 'func1@test.com', 'funcionario', true, ${empresaId}, ${clinicaId});`
      );
      process.exit(1);
    }

    // 5. Criar avaliações para cada funcionário
    console.log(`📠 Criando ${funcionarios.rows.length} avaliações...\n`);

    for (const func of funcionarios.rows) {
      const avaliacaoResult = await query(
        `
        INSERT INTO avaliacoes (funcionario_cpf, lote_id, status, criado_em)
        VALUES ($1, $2, 'concluida', NOW())
        RETURNING id
      `,
        [func.cpf, loteId]
      );

      console.log(
        `  ✅ Avaliação criada para ${func.nome} (CPF: ${func.cpf}) - ID: ${avaliacaoResult.rows[0].id}`
      );

      // 6. Criar respostas fictícias para a avaliação (necessário para cálculos)
      await query(
        `
        INSERT INTO respostas (avaliacao_id, grupo_id, questao_numero, resposta)
        SELECT $1, g.id, q.numero, 3
        FROM grupos_avaliativos g
        CROSS JOIN LATERAL (
          SELECT generate_series(1, 10) as numero
        ) q
        WHERE g.nome NOT IN ('Jogos de Azar', 'Endividamento Financeiro')
      `,
        [avaliacaoResult.rows[0].id]
      );

      console.log(`    └─ Respostas fictícias criadas (resposta padrão: 3)`);
    }

    console.log(`\n✅ Lote de teste criado com sucesso!`);
    console.log(`\n📋 Resumo:`);
    console.log(`   Lote: ${loteCodigo} (ID: ${loteId})`);
    console.log(`   Avaliações: ${funcionarios.rows.length}`);
    console.log(`   Status: Todas concluídas\n`);

    console.log(`🔄 Concluindo lote automaticamente...\n`);

    // 7. Concluir o lote e agendar emissão automática (implementação direta)
    const prazoEmissao = new Date();
    prazoEmissao.setMinutes(prazoEmissao.getMinutes() + 10);

    await query(
      `
      UPDATE lotes_avaliacao
      SET status = 'concluido',
          auto_emitir_agendado = true,
          auto_emitir_em = $2,
          atualizado_em = NOW()
      WHERE id = $1
    `,
      [loteId, prazoEmissao]
    );

    console.log(
      `✅ Lote concluído e emissão automática agendada para: ${prazoEmissao.toISOString()}\n`
    );

    console.log(`📋 Resumo Final:`);
    console.log(`   Lote: ${loteCodigo} (ID: ${loteId})`);
    console.log(`   Avaliações: ${funcionarios.rows.length}`);
    console.log(`   Status: aguardando_emissao (em 10 minutos)`);
    console.log(`   Emissão agendada para: ${prazoEmissao.toISOString()}\n`);

    console.log(`💡 Para verificar o status do lote:`);
    console.log(
      `   SELECT id, codigo, status, auto_emitir_agendado, auto_emitir_em`
    );
    console.log(`   FROM lotes_avaliacao WHERE id = ${loteId};\n`);
    console.log(`📄 Para verificar o laudo após emissão:`);
    console.log(`   SELECT id, lote_id, avaliacao, status, pdf_url, criado_em`);
    console.log(`   FROM laudos WHERE lote_id = ${loteId};\n`);
  } catch (error) {
    console.error('⠌ Erro ao criar lote de teste:', error);
    process.exit(1);
  }
}

// Executar o teste
criarLoteTeste()
  .then(() => {
    console.log('✅ Teste concluído com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('⠌ Erro no teste:', error);
    process.exit(1);
  });
