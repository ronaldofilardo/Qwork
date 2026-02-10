#!/usr/bin/env node
/**
 * Verificar Funções de Elegibilidade em PROD
 * 
 * Compara:
 * 1. Existência das funções calcular_elegibilidade_lote e calcular_elegibilidade_lote_tomador
 * 2. Definição das funções (uso de funcionarios_clinicas / funcionarios_entidades)
 * 3. Teste real de elegibilidade em PROD
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.production' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function verificarElegibilidadeProd() {
  console.log('🔍 Verificando Funções de Elegibilidade em PROD\n');

  try {
    // 1. Verificar existência das funções
    console.log('1️⃣ VERIFICANDO EXISTÊNCIA DAS FUNÇÕES\n');
    
    const funcoes = await pool.query(`
      SELECT 
        p.proname as nome_funcao,
        pg_get_functiondef(p.oid) as definicao
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
        AND p.proname IN ('calcular_elegibilidade_lote', 'calcular_elegibilidade_lote_tomador')
      ORDER BY p.proname
    `);

    if (funcoes.rowCount === 0) {
      console.error('❌ NENHUMA FUNÇÃO DE ELEGIBILIDADE ENCONTRADA EM PROD!\n');
      return;
    }

    console.log(`✅ Encontradas ${funcoes.rowCount} funções:\n`);
    funcoes.rows.forEach(func => {
      console.log(`📌 ${func.nome_funcao}`);
      
      // Verificar se usa tabelas de relacionamento corretas
      const usaFuncionariosClinicas = func.definicao.includes('funcionarios_clinicas');
      const usaFuncionariosEntidades = func.definicao.includes('funcionarios_entidades');
      const usaEmpresaIdDireto = func.definicao.includes('f.empresa_id');
      const usaTomadorIdDireto = func.definicao.includes('f.tomador_id') || func.definicao.includes('f.contratante_id');
      
      if (func.nome_funcao === 'calcular_elegibilidade_lote') {
        if (usaFuncionariosClinicas) {
          console.log('  ✅ Usa funcionarios_clinicas (CORRETO - arquitetura segregada)');
        } else if (usaEmpresaIdDireto) {
          console.log('  ❌ Usa f.empresa_id direto (INCORRETO - coluna removida!)');
        } else {
          console.log('  ⚠️  Não identificado relacionamento');
        }
      }
      
      if (func.nome_funcao === 'calcular_elegibilidade_lote_tomador') {
        if (usaFuncionariosEntidades) {
          console.log('  ✅ Usa funcionarios_entidades (CORRETO - arquitetura segregada)');
        } else if (usaTomadorIdDireto) {
          console.log('  ❌ Usa f.tomador_id/contratante_id direto (INCORRETO - coluna removida!)');
        } else {
          console.log('  ⚠️  Não identificado relacionamento');
        }
      }
      
      console.log('');
    });

    // 2. Testar execução de calcular_elegibilidade_lote
    console.log('\n2️⃣ TESTANDO calcular_elegibilidade_lote (RH/CLÍNICA)\n');
    
    // Buscar uma empresa ativa em PROD
    const empresa = await pool.query(`
      SELECT id, nome, clinica_id
      FROM empresas_clientes
      WHERE ativa = true
      LIMIT 1
    `);

    if (empresa.rowCount > 0) {
      const empresaId = empresa.rows[0].id;
      const empresaNome = empresa.rows[0].nome;
      
      console.log(`📋 Testando com empresa: ${empresaNome} (ID: ${empresaId})\n`);
      
      try {
        const elegiveis = await pool.query(`
          SELECT * FROM calcular_elegibilidade_lote($1, 1)
          LIMIT 5
        `, [empresaId]);
        
        console.log(`✅ Função executou com sucesso!`);
        console.log(`   Funcionários elegíveis: ${elegiveis.rowCount}\n`);
        
        if (elegiveis.rowCount > 0) {
          console.log('   Primeiros 5 elegíveis:');
          elegiveis.rows.forEach((f, i) => {
            console.log(`   ${i + 1}. ${f.funcionario_nome} (${f.funcionario_cpf})`);
            console.log(`      Motivo: ${f.motivo_inclusao}`);
            console.log(`      Índice: ${f.indice_atual}`);
          });
        } else {
          console.log('   ⚠️  Nenhum funcionário elegível encontrado');
        }
      } catch (err) {
        console.error(`❌ ERRO ao executar calcular_elegibilidade_lote:`);
        console.error(`   ${err.message}\n`);
        
        if (err.message.includes('column') && err.message.includes('does not exist')) {
          console.error('   🔥 ERRO CRÍTICO: Função está usando coluna que não existe!');
          console.error('   💡 Solução: Aplicar Migration 606 para atualizar função\n');
        }
      }
    } else {
      console.log('⚠️  Nenhuma empresa ativa encontrada em PROD para teste\n');
    }

    // 3. Testar execução de calcular_elegibilidade_lote_tomador
    console.log('\n3️⃣ TESTANDO calcular_elegibilidade_lote_tomador (ENTIDADE)\n');
    
    // Buscar uma entidade ativa em PROD
    const entidade = await pool.query(`
      SELECT id, nome
      FROM entidades
      WHERE ativa = true
      LIMIT 1
    `);

    if (entidade.rowCount > 0) {
      const entidadeId = entidade.rows[0].id;
      const entidadeNome = entidade.rows[0].nome;
      
      console.log(`📋 Testando com entidade: ${entidadeNome} (ID: ${entidadeId})\n`);
      
      try {
        const elegiveis = await pool.query(`
          SELECT * FROM calcular_elegibilidade_lote_tomador($1, 1)
          LIMIT 5
        `, [entidadeId]);
        
        console.log(`✅ Função executou com sucesso!`);
        console.log(`   Funcionários elegíveis: ${elegiveis.rowCount}\n`);
        
        if (elegiveis.rowCount > 0) {
          console.log('   Primeiros 5 elegíveis:');
          elegiveis.rows.forEach((f, i) => {
            console.log(`   ${i + 1}. ${f.funcionario_nome} (${f.funcionario_cpf})`);
            console.log(`      Motivo: ${f.motivo_inclusao}`);
            console.log(`      Índice: ${f.indice_atual}`);
          });
        } else {
          console.log('   ⚠️  Nenhum funcionário elegível encontrado');
        }
      } catch (err) {
        console.error(`❌ ERRO ao executar calcular_elegibilidade_lote_tomador:`);
        console.error(`   ${err.message}\n`);
        
        if (err.message.includes('function') && err.message.includes('does not exist')) {
          console.error('   🔥 ERRO CRÍTICO: Função calcular_elegibilidade_lote_tomador não existe!');
          console.error('   💡 Solução: Aplicar Migration 606 para criar função\n');
        } else if (err.message.includes('column') && err.message.includes('does not exist')) {
          console.error('   🔥 ERRO CRÍTICO: Função está usando coluna que não existe!');
          console.error('   💡 Solução: Aplicar Migration 606 para atualizar função\n');
        }
      }
    } else {
      console.log('⚠️  Nenhuma entidade ativa encontrada em PROD para teste\n');
    }

    // 4. Verificar funcionários com relacionamento correto
    console.log('\n4️⃣ VERIFICANDO RELACIONAMENTOS DE FUNCIONÁRIOS\n');
    
    const relacionamentos = await pool.query(`
      SELECT 
        'funcionarios_clinicas' as tabela,
        COUNT(*) as total
      FROM funcionarios_clinicas
      UNION ALL
      SELECT 
        'funcionarios_entidades' as tabela,
        COUNT(*) as total
      FROM funcionarios_entidades
    `);

    console.log('📊 Total de relacionamentos ativos:');
    relacionamentos.rows.forEach(r => {
      console.log(`   ${r.tabela}: ${r.total}`);
    });
    console.log('');

    // 5. Resumo e Recomendações
    console.log('\n📋 RESUMO E DIAGNÓSTICO\n');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const temCalcLote = funcoes.rows.some(f => f.nome_funcao === 'calcular_elegibilidade_lote');
    const temCalcTomador = funcoes.rows.some(f => f.nome_funcao === 'calcular_elegibilidade_lote_tomador');
    
    if (!temCalcLote) {
      console.log('❌ calcular_elegibilidade_lote: NÃO EXISTE');
      console.log('   💡 Ação: Aplicar Migration 606');
    } else {
      const funcLote = funcoes.rows.find(f => f.nome_funcao === 'calcular_elegibilidade_lote');
      if (funcLote.definicao.includes('f.empresa_id')) {
        console.log('❌ calcular_elegibilidade_lote: USA COLUNA REMOVIDA (f.empresa_id)');
        console.log('   💡 Ação: Aplicar Migration 606 para atualizar');
      } else if (funcLote.definicao.includes('funcionarios_clinicas')) {
        console.log('✅ calcular_elegibilidade_lote: CORRETO (usa funcionarios_clinicas)');
      }
    }
    
    if (!temCalcTomador) {
      console.log('❌ calcular_elegibilidade_lote_tomador: NÃO EXISTE');
      console.log('   💡 Ação: Aplicar Migration 606');
    } else {
      const funcTomador = funcoes.rows.find(f => f.nome_funcao === 'calcular_elegibilidade_lote_tomador');
      if (funcTomador.definicao.includes('f.tomador_id') || funcTomador.definicao.includes('f.contratante_id')) {
        console.log('❌ calcular_elegibilidade_lote_tomador: USA COLUNA REMOVIDA');
        console.log('   💡 Ação: Aplicar Migration 606 para atualizar');
      } else if (funcTomador.definicao.includes('funcionarios_entidades')) {
        console.log('✅ calcular_elegibilidade_lote_tomador: CORRETO (usa funcionarios_entidades)');
      }
    }
    
    console.log('\n═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Erro ao verificar elegibilidade:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

verificarElegibilidadeProd();
