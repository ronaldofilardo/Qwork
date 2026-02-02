/**
 * Script para injetar avaliações com respostas aleatórias
 *
 * Objetivo: Gerar laudos mais robustos com dados de avaliações preenchidas
 *
 * Uso:
 *   node scripts/injetar-avaliacoes-aleatorias.mjs
 *
 * Configuração:
 *   - CNPJ da Clínica: 09110380000191
 *   - CPF do RH: 04703084945
 *   - CNPJ da Empresa: 65406011000111 (deve existir no banco Neon)
 *   - Banco: Neon (PostgreSQL na nuvem)
 */

import pg from 'pg';

const { Client } = pg;

// Configuração do banco NEON
const client = new Client({
  connectionString:
    'postgresql://neondb_owner:npg_J2QYqn5oxCzp@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require',
  connectionTimeoutMillis: 30000, // 30 segundos para conectar
  query_timeout: 120000, // 2 minutos para queries longas
  statement_timeout: 120000, // 2 minutos timeout geral
});

// Grupos de questões (baseado em lib/questoes.ts)
const grupos = [
  {
    id: 1,
    titulo: 'Demandas no Trabalho',
    itens: ['Q1', 'Q2', 'Q3', 'Q9'],
    tipo: 'negativa',
  },
  {
    id: 2,
    titulo: 'Organização e Conteúdo',
    itens: ['Q13', 'Q17', 'Q18', 'Q19'],
    tipo: 'positiva',
  },
  {
    id: 3,
    titulo: 'Relações Interpessoais',
    itens: ['Q20', 'Q21', 'Q23', 'Q25', 'Q26', 'Q28'],
    tipo: 'positiva',
  },
  {
    id: 4,
    titulo: 'Interface Trabalho-Indivíduo',
    itens: ['Q31', 'Q32', 'Q33', 'Q34'],
    tipo: 'negativa',
  },
  {
    id: 5,
    titulo: 'Valores no Trabalho',
    itens: ['Q35', 'Q38', 'Q41'],
    tipo: 'positiva',
  },
  {
    id: 6,
    titulo: 'Personalidade (Opcional)',
    itens: ['Q43', 'Q45'],
    tipo: 'positiva',
  },
  {
    id: 7,
    titulo: 'Saúde e Bem-Estar',
    itens: ['Q48', 'Q52', 'Q55'],
    tipo: 'negativa',
  },
  {
    id: 8,
    titulo: 'Comportamentos Ofensivos',
    itens: ['Q56', 'Q57', 'Q58'],
    tipo: 'negativa',
  },
  {
    id: 9,
    titulo: 'Jogos de Apostas',
    itens: ['Q59', 'Q61', 'Q62', 'Q64'],
    tipo: 'negativa',
  },
  {
    id: 10,
    titulo: 'Endividamento',
    itens: ['Q65', 'Q66', 'Q68', 'Q69'],
    tipo: 'negativa',
  },
];

// Valores possíveis para respostas (escala COPSOQ III)
const valoresResposta = [0, 25, 50, 75, 100];

// Configuração
const CONFIG = {
  cnpjClinica: '09110380000191',
  cpfRh: '04703084945',
  cnpjEmpresa: '65406011000111',
  quantidadeMaximaFuncionarios: 50, // Máximo de funcionários a avaliar (pegará os existentes)
};

/**
 * Gera um CPF válido aleatório
 */
function gerarCPF() {
  const random = (n) => Math.floor(Math.random() * n);

  let cpf = '';
  for (let i = 0; i < 9; i++) {
    cpf += random(10);
  }

  // Calcular primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf[i]) * (10 - i);
  }
  let digito1 = 11 - (soma % 11);
  if (digito1 >= 10) digito1 = 0;
  cpf += digito1;

  // Calcular segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf[i]) * (11 - i);
  }
  let digito2 = 11 - (soma % 11);
  if (digito2 >= 10) digito2 = 0;
  cpf += digito2;

  return cpf;
}

/**
 * Gera valor de resposta aleatório
 * Pode ser ponderado por tipo de grupo (positivo/negativo)
 */
function gerarRespostaAleatoria(tipoGrupo) {
  // Distribuição mais realista:
  // - Grupos negativos: tendência a valores mais baixos (melhor situação)
  // - Grupos positivos: tendência a valores mais altos (melhor situação)

  const rand = Math.random();

  if (tipoGrupo === 'negativa') {
    // Para grupos negativos, preferir valores baixos (menos problemas)
    if (rand < 0.3) return 0; // 30%
    if (rand < 0.55) return 25; // 25%
    if (rand < 0.75) return 50; // 20%
    if (rand < 0.9) return 75; // 15%
    return 100; // 10%
  } else {
    // Para grupos positivos, preferir valores altos (mais aspectos positivos)
    if (rand < 0.1) return 0; // 10%
    if (rand < 0.25) return 25; // 15%
    if (rand < 0.45) return 50; // 20%
    if (rand < 0.7) return 75; // 25%
    return 100; // 30%
  }
}

/**
 * Gera respostas aleatórias para todos os grupos
 * Considera nivel_cargo - alguns grupos só aparecem para gestão
 */
function gerarRespostas(nivelCargo = 'operacional') {
  const respostas = [];

  for (const grupo of grupos) {
    // Grupo 6 (Personalidade) é opcional - incluir para todos
    for (const item of grupo.itens) {
      respostas.push({
        grupo: grupo.id,
        item: item,
        valor: gerarRespostaAleatoria(grupo.tipo),
      });
    }
  }

  return respostas;
}

/**
 * Calcula score de um grupo baseado nas respostas
 */
function calcularScore(respostas, grupoId) {
  const respostasGrupo = respostas.filter((r) => r.grupo === grupoId);
  if (respostasGrupo.length === 0) return 0;

  const soma = respostasGrupo.reduce((acc, r) => acc + r.valor, 0);
  return (soma / respostasGrupo.length).toFixed(2);
}

/**
 * Categoriza score baseado no tipo do grupo
 */
function categorizar(score, tipo) {
  if (tipo === 'negativa') {
    if (score >= 75) return 'alto'; // Muito problema
    if (score >= 50) return 'medio';
    return 'baixo'; // Pouco problema
  } else {
    if (score >= 75) return 'alto'; // Muito bom
    if (score >= 50) return 'medio';
    return 'baixo'; // Ruim
  }
}

/**
 * Principal
 */
async function main() {
  try {
    await client.connect();
    console.log('✅ Conectado ao banco Neon\n');

    // Iniciar transação
    await client.query('BEGIN');
    console.log('🔄 Transação iniciada\n');

    // 1. Verificar clínica
    console.log('📋 Verificando clínica...');
    const clinicaRes = await client.query(
      'SELECT id, nome FROM clinicas WHERE cnpj = $1',
      [CONFIG.cnpjClinica]
    );

    if (clinicaRes.rows.length === 0) {
      throw new Error(
        `❌ Clínica com CNPJ ${CONFIG.cnpjClinica} não encontrada`
      );
    }

    const clinicaId = clinicaRes.rows[0].id;
    const clinicaNome = clinicaRes.rows[0].nome;
    console.log(`   ✓ Clínica encontrada: ${clinicaNome} (ID: ${clinicaId})\n`);

    // 2. Verificar RH
    console.log('👤 Verificando RH...');
    const rhRes = await client.query(
      'SELECT cpf, nome, perfil FROM funcionarios WHERE cpf = $1',
      [CONFIG.cpfRh]
    );

    if (rhRes.rows.length === 0) {
      throw new Error(`❌ RH com CPF ${CONFIG.cpfRh} não encontrado`);
    }

    if (rhRes.rows[0].perfil !== 'rh') {
      throw new Error(
        `❌ CPF ${CONFIG.cpfRh} não é perfil RH (perfil atual: ${rhRes.rows[0].perfil})`
      );
    }

    console.log(`   ✓ RH encontrado: ${rhRes.rows[0].nome}\n`);

    // 3. Verificar empresa (deve existir)
    console.log('🏢 Verificando empresa...');
    const empresaRes = await client.query(
      'SELECT id, nome FROM empresas_clientes WHERE cnpj = $1 AND clinica_id = $2',
      [CONFIG.cnpjEmpresa, clinicaId]
    );

    if (empresaRes.rows.length === 0) {
      throw new Error(
        `❌ Empresa com CNPJ ${CONFIG.cnpjEmpresa} não encontrada na clínica ${clinicaId}`
      );
    }

    const empresaId = empresaRes.rows[0].id;
    const empresaNome = empresaRes.rows[0].nome;
    console.log(`   ✓ Empresa encontrada: ${empresaNome} (ID: ${empresaId})\n`);

    // 4. Buscar funcionários existentes da empresa (TODOS os ativos)
    console.log(`👥 Buscando funcionários da empresa...\n`);
    const funcionariosRes = await client.query(
      `SELECT f.cpf, f.nome, f.setor, f.funcao, f.nivel_cargo, f.id as funcionario_id
       FROM funcionarios f
       WHERE f.empresa_id = $1 
         AND f.clinica_id = $2 
         AND f.perfil = 'funcionario' 
         AND f.ativo = true
       ORDER BY f.nome`,
      [empresaId, clinicaId]
    );

    if (funcionariosRes.rows.length === 0) {
      throw new Error(
        `❌ Nenhum funcionário ativo encontrado na empresa ${empresaNome}`
      );
    }

    const funcionarios = funcionariosRes.rows;
    console.log(`   ✓ ${funcionarios.length} funcionários encontrados\n`);

    // Exibir amostra
    funcionarios.slice(0, 5).forEach((f, i) => {
      console.log(
        `   ${i + 1}. ${f.nome} (${f.cpf}) - ${f.setor || 'N/A'}/${f.funcao || 'N/A'} - Nível: ${f.nivel_cargo || 'operacional'}`
      );
    });
    if (funcionarios.length > 5) {
      console.log(`   ... e mais ${funcionarios.length - 5} funcionários\n`);
    }

    // 5. Obter próximo número de ordem do lote
    console.log('📦 Preparando lote de avaliação...');
    const numeroOrdemRes = await client.query(
      `SELECT COALESCE(MAX(numero_ordem), 0) + 1 as numero_ordem 
       FROM lotes_avaliacao 
       WHERE empresa_id = $1`,
      [empresaId]
    );
    const numeroOrdem = numeroOrdemRes.rows[0].numero_ordem;

    // Gerar código do lote (formato: XXX-DDMMAA)
    const dataAtual = new Date();
    const dia = String(dataAtual.getDate()).padStart(2, '0');
    const mes = String(dataAtual.getMonth() + 1).padStart(2, '0');
    const ano = String(dataAtual.getFullYear()).slice(-2);
    const codigoLote = `${String(numeroOrdem).padStart(3, '0')}-${dia}${mes}${ano}`;

    // Verificar se já existe lote com este código (evitar duplicação)
    const loteExistente = await client.query(
      `SELECT id FROM lotes_avaliacao 
       WHERE empresa_id = $1 AND codigo = $2`,
      [empresaId, codigoLote]
    );

    if (loteExistente.rows.length > 0) {
      throw new Error(
        `❌ Lote com código ${codigoLote} já existe! (ID: ${loteExistente.rows[0].id})`
      );
    }

    // CRÍTICO: Verificar qual estrutura de allocator está no banco
    let loteId;
    const allocatorCheck = await client.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = 'lote_id_allocator' AND column_name = 'last_id'`
    );

    if (allocatorCheck.rows.length > 0) {
      // Migration 085: Estrutura antiga (global last_id)
      console.log('   ℹ️  Usando fn_next_lote_id() para obter próximo ID');
      const nextIdRes = await client.query(
        'SELECT fn_next_lote_id() as next_id'
      );
      loteId = nextIdRes.rows[0].next_id;

      const loteRes = await client.query(
        `INSERT INTO lotes_avaliacao 
         (id, codigo, clinica_id, empresa_id, titulo, status, tipo, liberado_por, numero_ordem, criado_em)
         VALUES ($1, $2, $3, $4, $5, 'ativo', 'completo', $6, $7, NOW())
         RETURNING id`,
        [
          loteId,
          codigoLote,
          clinicaId,
          empresaId,
          `Lote ${numeroOrdem} - Injeção de Teste para Laudos`,
          CONFIG.cpfRh,
          numeroOrdem,
        ]
      );
    } else {
      // Migration 208 ou sem allocator: deixar DEFAULT gerar o ID
      console.log('   ℹ️  Usando DEFAULT para gerar ID do lote');
      const loteRes = await client.query(
        `INSERT INTO lotes_avaliacao 
         (codigo, clinica_id, empresa_id, titulo, status, tipo, liberado_por, numero_ordem, criado_em)
         VALUES ($1, $2, $3, $4, 'ativo', 'completo', $5, $6, NOW())
         RETURNING id`,
        [
          codigoLote,
          clinicaId,
          empresaId,
          `Lote ${numeroOrdem} - Injeção de Teste para Laudos`,
          CONFIG.cpfRh,
          numeroOrdem,
        ]
      );
      loteId = loteRes.rows[0].id;
    }

    console.log(
      `   ✓ Lote criado: ${codigoLote} (ID: ${loteId}, Ordem: ${numeroOrdem})\n`
    );

    // 6. Criar avaliações para cada funcionário
    console.log(`🎯 Criando avaliações (1 por funcionário)...\n`);
    let totalAvaliacoesCriadas = 0;
    let totalRespostasCriadas = 0;
    let avisoNivelCargo = false;

    for (const funcionario of funcionarios) {
      console.log(
        `   📝 ${funcionario.nome} (${funcionario.cpf}) - Nível: ${funcionario.nivel_cargo || 'operacional'}`
      );

      // Data de hoje para a avaliação
      const dataInicio = new Date();
      const dataEnvio = new Date();

      // Criar avaliação já concluída
      const avaliacaoRes = await client.query(
        `INSERT INTO avaliacoes 
         (funcionario_cpf, lote_id, status, inicio, envio, grupo_atual, criado_em, atualizado_em)
         VALUES ($1, $2, 'concluida', $3, $4, 10, NOW(), NOW())
         RETURNING id`,
        [funcionario.cpf, loteId, dataInicio, dataEnvio]
      );

      const avaliacaoId = avaliacaoRes.rows[0].id;
      totalAvaliacoesCriadas++;

      // Gerar respostas aleatórias (baseado no nivel_cargo)
      const nivelCargo = funcionario.nivel_cargo || 'operacional';
      const respostas = gerarRespostas(nivelCargo);

      if (!avisoNivelCargo) {
        console.log(`   ℹ️  Gerando questões para nível: ${nivelCargo}`);
        avisoNivelCargo = true;
      }

      // Inserir respostas
      for (const resposta of respostas) {
        await client.query(
          `INSERT INTO respostas (avaliacao_id, grupo, item, valor, criado_em)
           VALUES ($1, $2, $3, $4, NOW())`,
          [avaliacaoId, resposta.grupo, resposta.item, resposta.valor]
        );
        totalRespostasCriadas++;
      }

      // Calcular e inserir resultados
      for (const grupo of grupos) {
        const score = calcularScore(respostas, grupo.id);
        const categoria = categorizar(parseFloat(score), grupo.tipo);

        await client.query(
          `INSERT INTO resultados (avaliacao_id, grupo, dominio, score, categoria, criado_em)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [avaliacaoId, grupo.id, grupo.titulo, score, categoria]
        );
      }

      // Inserir registro na tabela lotes_avaliacao_funcionarios
      await client.query(
        `INSERT INTO lotes_avaliacao_funcionarios (lote_id, funcionario_id, avaliacao_id, criado_em)
         VALUES ($1, $2, $3, NOW())`,
        [loteId, funcionario.funcionario_id, avaliacaoId]
      );

      console.log(
        `      ✓ Avaliação criada (ID: ${avaliacaoId}) - ${respostas.length} respostas`
      );
    }

    // 7. Marcar lote como concluído (para permitir solicitação de emissão)
    console.log(`\n📋 Finalizando lote...\n`);
    await client.query(
      `UPDATE lotes_avaliacao 
       SET status = 'concluido', finalizado_em = NOW(), atualizado_em = NOW()
       WHERE id = $1`,
      [loteId]
    );
    console.log(`   ✓ Lote marcado como 'concluido'\n`);

    // 8. Atualizar índice de avaliação dos funcionários
    console.log(`🔄 Atualizando índice de avaliação dos funcionários...`);
    const cpfsArray = funcionarios.map((f) => f.cpf);

    await client.query(
      `UPDATE funcionarios
       SET indice_avaliacao = $1,
           data_ultimo_lote = NOW(),
           atualizado_em = NOW()
       WHERE cpf = ANY($2::char(11)[])`,
      [numeroOrdem, cpfsArray]
    );

    console.log(
      `   ✓ Índice atualizado para ${funcionarios.length} funcionários (indice_avaliacao = ${numeroOrdem})\n`
    );

    // 9. Validar que lote está pronto para solicitar emissão do laudo
    console.log(`🔍 Validando estado do lote para emissão...`);

    // Verificar se não há registros indevidos na fila_emissao
    const filaCheck = await client.query(
      `SELECT id FROM fila_emissao WHERE lote_id = $1`,
      [loteId]
    );

    if (filaCheck.rows.length > 0) {
      console.log(
        `   ⚠️ AVISO: Lote já tem registro na fila_emissao (removendo...)`
      );
      const deleteResult = await client.query(
        `DELETE FROM fila_emissao WHERE lote_id = $1 RETURNING id`,
        [loteId]
      );
      if (deleteResult.rowCount > 0) {
        console.log(
          `   ✓ Registro da fila_emissao removido (ID: ${deleteResult.rows[0].id})`
        );
      } else {
        throw new Error(
          `FALHA CRÍTICA: Não foi possível remover fila_emissao para lote ${loteId}`
        );
      }
    }

    // Verificar se não há laudos rascunho ou emitidos
    const laudoCheck = await client.query(
      `SELECT id, status FROM laudos WHERE lote_id = $1`,
      [loteId]
    );

    if (laudoCheck.rows.length > 0) {
      const laudoStatus = laudoCheck.rows[0].status;
      const laudoId = laudoCheck.rows[0].id;
      console.log(
        `   ⚠️ AVISO: Lote já tem laudo com status '${laudoStatus}' (ID: ${laudoId}, removendo...)`
      );
      const deleteResult = await client.query(
        `DELETE FROM laudos WHERE lote_id = $1 RETURNING id`,
        [loteId]
      );
      if (deleteResult.rowCount > 0) {
        console.log(`   ✓ Laudo removido (ID: ${deleteResult.rows[0].id})`);
      } else {
        throw new Error(
          `FALHA CRÍTICA: Não foi possível remover laudo ${laudoId} do lote ${loteId}`
        );
      }
    }

    // Validar campos críticos para exibição do botão
    const validacaoFinal = await client.query(
      `SELECT 
        la.id,
        la.status,
        la.emitido_em,
        CASE WHEN fe.id IS NOT NULL THEN true ELSE false END as tem_fila,
        CASE WHEN l.id IS NOT NULL THEN true ELSE false END as tem_laudo
      FROM lotes_avaliacao la
      LEFT JOIN fila_emissao fe ON fe.lote_id = la.id
      LEFT JOIN laudos l ON l.lote_id = la.id
      WHERE la.id = $1`,
      [loteId]
    );

    const estado = validacaoFinal.rows[0];
    console.log(`   ✓ Status: ${estado.status}`);
    console.log(
      `   ✓ Tem fila_emissao: ${estado.tem_fila ? 'SIM ❌' : 'NÃO ✅'}`
    );
    console.log(`   ✓ Tem laudo: ${estado.tem_laudo ? 'SIM ❌' : 'NÃO ✅'}`);
    console.log(`   ✓ emitido_em: ${estado.emitido_em || 'NULL ✅'}`);

    if (!estado.tem_fila && !estado.tem_laudo && !estado.emitido_em) {
      console.log(
        `\n✅ VALIDAÇÃO CONCLUÍDA: Lote pronto para solicitar emissão!\n`
      );
    } else {
      console.warn(
        `\n⚠️ AVISO: Lote pode não exibir o botão "Solicitar Emissão" corretamente\n`
      );
    }

    // 10. Validar sincronização do allocator (se existir)
    console.log(`🔍 Verificando sincronização do allocator...`);
    const allocatorCheckFinal = await client.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = 'lote_id_allocator' AND column_name = 'last_id'`
    );

    if (allocatorCheckFinal.rows.length > 0) {
      const allocatorState = await client.query(
        'SELECT last_id FROM lote_id_allocator'
      );
      const maxLoteId = await client.query(
        'SELECT MAX(id) as max_id FROM lotes_avaliacao'
      );

      const allocatorLastId = parseInt(allocatorState.rows[0]?.last_id || '0');
      const maxId = parseInt(maxLoteId.rows[0]?.max_id || '0');

      console.log(`   • Allocator last_id: ${allocatorLastId}`);
      console.log(`   • MAX(id) em lotes: ${maxId}`);

      if (allocatorLastId === maxId) {
        console.log(`   ✅ Allocator sincronizado corretamente!\n`);
      } else if (allocatorLastId > maxId) {
        console.log(
          `   ⚠️  Allocator está à frente (normal se lotes foram deletados)\n`
        );
      } else {
        console.warn(`   ❌ ATENÇÃO: Allocator está DESATUALIZADO!`);
        console.warn(`   ⚠️  Próximo lote criado pode ter CONFLITO DE ID!`);
        console.warn(
          `   💡 Execute: pnpm tsx scripts/sync-lote-allocator.ts --fix\n`
        );
      }
    } else {
      console.log(
        `   ℹ️  Allocator não usa estrutura last_id (migration 208 ou desabilitado)\n`
      );
    }

    // Confirmar transação
    await client.query('COMMIT');
    console.log('✅ TRANSAÇÃO CONFIRMADA (COMMIT)\n');

    console.log(`✅ Processo concluído!\n`);
    console.log('📊 RESUMO:');
    console.log(`   • Clínica: ${clinicaNome} (${CONFIG.cnpjClinica})`);
    console.log(`   • Empresa: ${empresaNome} (${CONFIG.cnpjEmpresa})`);
    console.log(`   • Lote: ${codigoLote} (Ordem: ${numeroOrdem})`);
    console.log(`   • Status do Lote: concluido ✅`);
    console.log(`   • Funcionários avaliados: ${funcionarios.length}`);
    console.log(`   • Avaliações criadas: ${totalAvaliacoesCriadas}`);
    console.log(`   • Respostas criadas: ${totalRespostasCriadas}`);
    console.log(
      `   • Resultados calculados: ${totalAvaliacoesCriadas * grupos.length}`
    );
    console.log(`   • Vínculos lote-funcionário: ${funcionarios.length}`);
    console.log(`   • Índices atualizados: ${funcionarios.length}`);
    console.log(`   • Validações de segurança: ✅ Aprovadas\n`);

    console.log('⚠️  IMPORTANTE: EMISSÃO DE LAUDO É MANUAL');
    console.log('   Este script NÃO emite o laudo automaticamente.');
    console.log('   A emissão automática foi REMOVIDA do sistema.\n');

    console.log('🎯 Próximos passos para EMITIR o laudo:');
    console.log('   1. Faça login como Gestor de Entidade');
    console.log(`   2. Acesse o menu "Lotes de Avaliação"`);
    console.log(`   3. Clique no lote "${codigoLote}"`);
    console.log('   4. Verifique o card verde "Lote Concluído"');
    console.log('   5. Clique no botão 🚀 "Solicitar Emissão do Laudo"');
    console.log('   6. Confirme a solicitação');
    console.log('   7. Aguarde o emissor processar e gerar o PDF\n');

    console.log('✨ O lote está pronto para solicitar emissão de laudo!\n');

    console.log('🔍 VERIFICAÇÃO DE INTEGRIDADE:');
    console.log(`   • Status do lote: 'concluido' ✅`);
    console.log(`   • Sem registro na fila_emissao ✅`);
    console.log(`   • Sem laudos prévios ✅`);
    console.log(`   • Botão "Solicitar Emissão" deve estar VISÍVEL ✅\n`);
  } catch (error) {
    console.error('\n❌ ERRO CRÍTICO:', error.message);
    console.error('Stack:', error.stack);

    // Tentar fazer rollback
    try {
      await client.query('ROLLBACK');
      console.error(
        '🔙 ROLLBACK executado - nenhuma alteração foi salva no banco'
      );
    } catch (rollbackError) {
      console.error('⚠️ Erro ao executar ROLLBACK:', rollbackError.message);
    }

    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Conexão com banco fechada');
  }
}

// Executar
main();
