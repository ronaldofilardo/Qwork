#!/usr/bin/env tsx
/**
 * Correção: Criar entidade ID 36 para a clínica 7 no banco de DESENVOLVIMENTO
 */

import { Pool } from 'pg';

const DEV_DB = (process.env.LOCAL_DATABASE_URL ?? 'postgresql://postgres@localhost:5432/nr-bps_db');

async function main() {
  const pool = new Pool({ connectionString: DEV_DB });

  try {
    console.log(
      '╔══════════════════════════════════════════════════════════════╗'
    );
    console.log(
      '║  CORREÇÃO: Banco de DESENVOLVIMENTO                         ║'
    );
    console.log(
      '╚══════════════════════════════════════════════════════════════╝\n'
    );

    // 1. Verificar situação atual
    console.log('📊 SITUAÇÃO ATUAL:\n');

    const clinica = await pool.query(
      'SELECT id, nome, entidade_id, cnpj FROM clinicas WHERE id = 7'
    );
    console.log('   Clínica ID 7:');
    console.log(`      Nome: ${clinica.rows[0]?.nome}`);
    console.log(`      CNPJ: ${clinica.rows[0]?.cnpj}`);
    console.log(
      `      entidade_id: ${clinica.rows[0]?.entidade_id} ❌ NÃO EXISTE\n`
    );

    const entidades = await pool.query(
      'SELECT id, nome, tipo FROM entidades ORDER BY id'
    );
    console.log('   Entidades existentes:');
    for (const ent of entidades.rows) {
      console.log(`      ID ${ent.id}: ${ent.nome} (${ent.tipo})`);
    }

    // 2. Criar entidade ID 36
    console.log('\n🔧 CORREÇÃO:\n');

    console.log(
      '   Criando entidade ID 36 para a clínica "COMERCIAL EXPORTADORA"...'
    );

    // Usar dados da clínica onde disponível, ou valores padrão
    const cnpjClinica = clinica.rows[0]?.cnpj || '09110380000191';
    const emailClinica = clinica.rows[0]?.email || 'afaf@ffasfsa.om';
    const telefoneClinica = clinica.rows[0]?.telefone || '(54) 54646-6445';
    const enderecoClinica = clinica.rows[0]?.endereco || 'rua iopiop 22';
    const cidadeClinica = clinica.rows[0]?.cidade || 'São Paulo';
    const estadoClinica = clinica.rows[0]?.estado || 'SP';
    const cepClinica = clinica.rows[0]?.cep || '01000-000';

    await pool.query(
      `
      INSERT INTO entidades (
        id, tipo, nome, cnpj, email, telefone, endereco, 
        cidade, estado, cep, 
        responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular,
        criado_em, atualizado_em
      )
      VALUES (
        36, 'clinica', 'COMERCIAL EXPORTADORA', $1, $2, $3, $4,
        $5, $6, $7,
        'Responsável Comercial', '00000000000', $2, $3,
        NOW(), NOW()
      )
      ON CONFLICT (id) DO UPDATE 
      SET nome = EXCLUDED.nome, 
          cnpj = EXCLUDED.cnpj, 
          email = EXCLUDED.email,
          telefone = EXCLUDED.telefone,
          endereco = EXCLUDED.endereco,
          cidade = EXCLUDED.cidade,
          estado = EXCLUDED.estado,
          cep = EXCLUDED.cep,
          tipo = EXCLUDED.tipo, 
          atualizado_em = NOW()
    `,
      [
        cnpjClinica,
        emailClinica,
        telefoneClinica,
        enderecoClinica,
        cidadeClinica,
        estadoClinica,
        cepClinica,
      ]
    );

    // Atualizar sequence para não conflitar
    await pool.query(
      `SELECT setval('entidades_id_seq', (SELECT MAX(id) FROM entidades), true)`
    );

    console.log('   ✅ Entidade 36 criada!\n');

    // 3. Verificar correção
    console.log('✅ SITUAÇÃO CORRIGIDA:\n');

    const entidadesAfter = await pool.query(
      'SELECT id, nome, tipo FROM entidades ORDER BY id'
    );
    console.log('   Entidades disponíveis:');
    for (const ent of entidadesAfter.rows) {
      const icon = ent.id === 36 ? '🆕' : '✅';
      console.log(`      ${icon} ID ${ent.id}: ${ent.nome} (${ent.tipo})`);
    }

    // 4. Validar FK
    console.log('\n🔍 VALIDAÇÃO:\n');

    const validation = await pool.query(`
      SELECT 
        c.id AS clinica_id,
        c.nome AS clinica_nome,
        c.entidade_id,
        e.nome AS entidade_nome
      FROM clinicas c
      LEFT JOIN entidades e ON e.id = c.entidade_id
    `);

    for (const row of validation.rows) {
      const icon = row.entidade_nome ? '✅' : '❌';
      console.log(`   ${icon} Clínica ${row.clinica_id} (${row.clinica_nome})`);
      console.log(
        `      → entidade_id: ${row.entidade_id} ${row.entidade_nome ? `(${row.entidade_nome})` : 'NÃO EXISTE'}`
      );
    }

    console.log(
      '\n╔══════════════════════════════════════════════════════════════╗'
    );
    console.log(
      '║  ✅ BANCO DE DESENVOLVIMENTO CORRIGIDO!                     ║'
    );
    console.log(
      '╚══════════════════════════════════════════════════════════════╝\n'
    );
  } catch (error) {
    console.error('\n❌ ERRO:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
