#!/usr/bin/env node
/**
 * Detectar Lotes Órfãos em PROD
 *
 * Lotes órfãos = Lotes criados mas sem avaliações associadas
 * Isso indica falha no fluxo de criação de avaliações
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.production' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function detectarLotesOrfaos() {
  console.log('🔍 Detectando Lotes Órfãos em PROD (Lotes sem Avaliações)\n');

  try {
    // Buscar lotes sem avaliações
    const lotesOrfaos = await pool.query(`
      SELECT 
        la.id,
        la.numero_ordem,
        la.descricao,
        la.status,
        la.tipo,
        la.liberado_em,
        la.liberado_por,
        la.clinica_id,
        la.empresa_id,
        la.entidade_id,
        COALESCE(c.nome, 'N/A') as clinica_nome,
        COALESCE(ec.nome, 'N/A') as empresa_nome,
        COALESCE(e.nome, 'N/A') as entidade_nome,
        (SELECT COUNT(*) FROM avaliacoes WHERE lote_id = la.id) as total_avaliacoes
      FROM lotes_avaliacao la
      LEFT JOIN clinicas c ON la.clinica_id = c.id
      LEFT JOIN empresas_clientes ec ON la.empresa_id = ec.id
      LEFT JOIN entidades e ON la.entidade_id = e.id
      WHERE NOT EXISTS (
        SELECT 1 FROM avaliacoes WHERE lote_id = la.id
      )
      ORDER BY la.liberado_em DESC
      LIMIT 50
    `);

    console.log(`📊 Total de lotes órfãos: ${lotesOrfaos.rowCount}\n`);

    if (lotesOrfaos.rowCount === 0) {
      console.log('✅ Nenhum lote órfão detectado em PROD!\n');
      return;
    }

    console.log('❌ LOTES ÓRFÃOS DETECTADOS:\n');
    console.log(
      '═════════════════════════════════════════════════════════════════════════\n'
    );

    // Agrupar por tipo (RH vs Entidade)
    const lotesRH = lotesOrfaos.rows.filter(
      (l) => l.clinica_id && l.empresa_id
    );
    const lotesEntidade = lotesOrfaos.rows.filter((l) => l.entidade_id);
    const lotesIndefinidos = lotesOrfaos.rows.filter(
      (l) => !l.clinica_id && !l.empresa_id && !l.entidade_id
    );

    if (lotesRH.length > 0) {
      console.log(`🏢 LOTES RH/CLÍNICA (${lotesRH.length} órfãos):\n`);
      lotesRH.forEach((lote) => {
        console.log(`  📋 Lote #${lote.numero_ordem} (ID: ${lote.id})`);
        console.log(
          `     Empresa: ${lote.empresa_nome} (ID: ${lote.empresa_id})`
        );
        console.log(
          `     Clínica: ${lote.clinica_nome} (ID: ${lote.clinica_id})`
        );
        console.log(`     Status: ${lote.status}`);
        console.log(`     Liberado em: ${lote.liberado_em}`);
        console.log(`     Avaliações: ${lote.total_avaliacoes} ❌\n`);
      });
    }

    if (lotesEntidade.length > 0) {
      console.log(`\n🏛️  LOTES ENTIDADE (${lotesEntidade.length} órfãos):\n`);
      lotesEntidade.forEach((lote) => {
        console.log(`  📋 Lote #${lote.numero_ordem} (ID: ${lote.id})`);
        console.log(
          `     Entidade: ${lote.entidade_nome} (ID: ${lote.entidade_id})`
        );
        console.log(`     Status: ${lote.status}`);
        console.log(`     Liberado em: ${lote.liberado_em}`);
        console.log(`     Avaliações: ${lote.total_avaliacoes} ❌\n`);
      });
    }

    if (lotesIndefinidos.length > 0) {
      console.log(
        `\n⚠️  LOTES INDEFINIDOS (${lotesIndefinidos.length} órfãos):\n`
      );
      lotesIndefinidos.forEach((lote) => {
        console.log(`  📋 Lote #${lote.numero_ordem} (ID: ${lote.id})`);
        console.log(`     SEM CLÍNICA/EMPRESA/ENTIDADE ASSOCIADA!`);
        console.log(`     Status: ${lote.status}`);
        console.log(`     Liberado em: ${lote.liberado_em}`);
        console.log(`     Avaliações: ${lote.total_avaliacoes} ❌\n`);
      });
    }

    console.log(
      '═════════════════════════════════════════════════════════════════════════\n'
    );

    // Diagnosticar causa mais provável
    console.log('\n🔍 ANÁLISE DE CAUSAS PROVÁVEIS:\n');

    // 1. Verificar se há funcionários para as empresas/entidades dos lotes órfãos
    for (const lote of lotesRH.slice(0, 3)) {
      console.log(
        `\n📌 Lote RH #${lote.numero_ordem} (Empresa ID: ${lote.empresa_id})`
      );

      // Buscar funcionários via relacionamento
      const funcionarios = await pool.query(
        `
        SELECT COUNT(DISTINCT f.cpf) as total
        FROM funcionarios f
        INNER JOIN funcionarios_clinicas fc ON fc.funcionario_id = f.id
        INNER JOIN empresas_clientes ec ON ec.clinica_id = fc.clinica_id
        WHERE ec.id = $1
          AND fc.ativo = true
          AND f.ativo = true
          AND f.perfil = 'funcionario'
      `,
        [lote.empresa_id]
      );

      console.log(
        `   Funcionários ativos via funcionarios_clinicas: ${funcionarios.rows[0].total}`
      );

      // Testar elegibilidade
      const elegiveis = await pool.query(
        `
        SELECT COUNT(*) as total
        FROM calcular_elegibilidade_lote($1, $2)
      `,
        [lote.empresa_id, lote.numero_ordem]
      );

      console.log(
        `   Elegíveis via calcular_elegibilidade_lote: ${elegiveis.rows[0].total}`
      );

      if (elegiveis.rows[0].total === 0) {
        console.log(
          `   ❌ CAUSA: Nenhum funcionário elegível no momento da criação do lote`
        );
      } else {
        console.log(
          `   ⚠️  CAUSA: Erro na criação das avaliações (funcionários elegíveis existem!)`
        );
      }
    }

    for (const lote of lotesEntidade.slice(0, 3)) {
      console.log(
        `\n📌 Lote Entidade #${lote.numero_ordem} (Entidade ID: ${lote.entidade_id})`
      );

      // Buscar funcionários via relacionamento
      const funcionarios = await pool.query(
        `
        SELECT COUNT(DISTINCT f.cpf) as total
        FROM funcionarios f
        INNER JOIN funcionarios_entidades fe ON fe.funcionario_id = f.id
        WHERE fe.entidade_id = $1
          AND fe.ativo = true
          AND f.ativo = true
          AND f.perfil = 'funcionario'
      `,
        [lote.entidade_id]
      );

      console.log(
        `   Funcionários ativos via funcionarios_entidades: ${funcionarios.rows[0].total}`
      );

      // Testar elegibilidade
      const elegiveis = await pool.query(
        `
        SELECT COUNT(*) as total
        FROM calcular_elegibilidade_lote_tomador($1, $2)
      `,
        [lote.entidade_id, lote.numero_ordem]
      );

      console.log(
        `   Elegíveis via calcular_elegibilidade_lote_tomador: ${elegiveis.rows[0].total}`
      );

      if (elegiveis.rows[0].total === 0) {
        console.log(
          `   ❌ CAUSA: Nenhum funcionário elegível no momento da criação do lote`
        );
      } else {
        console.log(
          `   ⚠️  CAUSA: Erro na criação das avaliações (funcionários elegíveis existem!)`
        );
      }
    }

    console.log('\n\n💡 RECOMENDAÇÕES:\n');
    console.log(
      '═════════════════════════════════════════════════════════════════════════'
    );
    console.log(
      '1. Se elegíveis = 0: Validar ANTES de criar lote (retornar erro 400)'
    );
    console.log(
      '2. Se elegíveis > 0: Investigar erros no INSERT avaliacoes (verificar logs)'
    );
    console.log(
      '3. Considerar usar transações para garantir atomicidade (lote + avaliacoes)'
    );
    console.log(
      '4. Limpar lotes órfãos: DELETE FROM lotes_avaliacao WHERE id IN (...)'
    );
    console.log(
      '═════════════════════════════════════════════════════════════════════════\n'
    );
  } catch (error) {
    console.error('❌ Erro ao detectar lotes órfãos:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

detectarLotesOrfaos();
