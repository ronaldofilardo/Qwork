#!/usr/bin/env tsx
/**
 * Correção: Relacionamentos dos laudos no banco de DESENVOLVIMENTO
 *
 * - Clínica: ID 7 → ID 36 (já corrigido)
 * - Laudo 2: pertence à entidade ID 35
 * - Laudo 3: pertence à clínica ID 37
 * - Laudo 4: pertence à entidade ID 37
 */

import { Pool } from 'pg';

const DEV_DB = 'postgresql://postgres:123456@localhost:5432/nr-bps_db';

async function main() {
  const pool = new Pool({ connectionString: DEV_DB });

  try {
    console.log(
      '╔══════════════════════════════════════════════════════════════╗'
    );
    console.log(
      '║  CORREÇÃO: Relacionamentos dos Laudos no DEV                ║'
    );
    console.log(
      '╚══════════════════════════════════════════════════════════════╝\n'
    );

    // 1. Verificar estrutura dos laudos
    console.log('1️⃣  SITUAÇÃO ATUAL DOS LAUDOS:\n');

    const laudos = await pool.query(`
      SELECT 
        l.id,
        l.numero_laudo,
        l.funcionario_id,
        l.avaliacao_id,
        a.lote_id,
        lt.clinica_id,
        f.nome AS funcionario_nome,
        f.contratante_id AS funcionario_contratante
      FROM laudos l
      LEFT JOIN avaliacoes a ON a.id = l.avaliacao_id
      LEFT JOIN lotes_avaliacao lt ON lt.id = a.lote_id
      LEFT JOIN funcionarios f ON f.id = l.funcionario_id
      ORDER BY l.id
    `);

    for (const laudo of laudos.rows) {
      console.log(`   Laudo ${laudo.id} (${laudo.numero_laudo})`);
      console.log(
        `      → funcionario_id: ${laudo.funcionario_id} (${laudo.funcionario_nome || 'N/A'})`
      );
      console.log(
        `      → funcionario_contratante: ${laudo.funcionario_contratante || 'NULL'}`
      );
      console.log(`      → avaliacao_id: ${laudo.avaliacao_id}`);
      console.log(`      → lote_id: ${laudo.lote_id}`);
      console.log(`      → clinica_id (do lote): ${laudo.clinica_id}\n`);
    }

    // 2. Verificar entidades e clínicas disponíveis
    console.log('2️⃣  ENTIDADES E CLÍNICAS DISPONÍVEIS:\n');

    const entidades = await pool.query(
      'SELECT id, nome, tipo FROM entidades ORDER BY id'
    );
    console.log('   Entidades:');
    for (const ent of entidades.rows) {
      console.log(`      ID ${ent.id}: ${ent.nome} (${ent.tipo})`);
    }

    const clinicas = await pool.query(
      'SELECT id, nome, entidade_id FROM clinicas ORDER BY id'
    );
    console.log('\n   Clínicas:');
    for (const cli of clinicas.rows) {
      console.log(
        `      ID ${cli.id}: ${cli.nome} → entidade_id: ${cli.entidade_id}`
      );
    }

    // 3. Correções necessárias
    console.log('\n3️⃣  APLICANDO CORREÇÕES:\n');

    await pool.query('BEGIN');

    try {
      // Corrigir clínica 7 → 36 (se ainda não foi)
      const clinicaUpdate = await pool.query(`
        UPDATE clinicas 
        SET entidade_id = 36 
        WHERE id = 7 AND entidade_id != 36
        RETURNING id, nome
      `);

      if (clinicaUpdate.rows.length > 0) {
        console.log(`   ✅ Clínica ID 7 → entidade_id: 36`);
      } else {
        console.log(`   ✓  Clínica ID 7 → entidade_id: 36 (já estava correto)`);
      }

      // Verificar e corrigir funcionários dos laudos
      console.log('\n   Corrigindo funcionários dos laudos:\n');

      // Laudo 2 → entidade 35
      const func2 = await pool.query(`
        SELECT f.id, f.nome, f.contratante_id
        FROM laudos l
        JOIN funcionarios f ON f.id = l.funcionario_id
        WHERE l.id = 2
      `);

      if (func2.rows.length > 0 && func2.rows[0].contratante_id !== 35) {
        await pool.query(
          `
          UPDATE funcionarios 
          SET contratante_id = 35 
          WHERE id = $1
        `,
          [func2.rows[0].id]
        );
        console.log(
          `      ✅ Laudo 2: Funcionário ${func2.rows[0].id} (${func2.rows[0].nome}) → contratante_id: 35`
        );
      } else if (func2.rows.length > 0) {
        console.log(
          `      ✓  Laudo 2: Funcionário ${func2.rows[0].id} → contratante_id: 35 (já correto)`
        );
      }

      // Laudo 3 → clínica 37 (precisa ter funcionário da clínica 37)
      const func3 = await pool.query(`
        SELECT f.id, f.nome, f.clinica_id, f.contratante_id
        FROM laudos l
        JOIN funcionarios f ON f.id = l.funcionario_id
        WHERE l.id = 3
      `);

      if (func3.rows.length > 0) {
        // Verificar se existe clínica 37
        const clinica37 = await pool.query(
          'SELECT id, entidade_id FROM clinicas WHERE id = 37'
        );

        if (clinica37.rows.length === 0) {
          // Criar clínica 37 se não existir
          const entidade37 = await pool.query(
            'SELECT id, nome, cnpj, email, telefone, endereco, cidade, estado, cep FROM entidades WHERE id = 37'
          );

          if (entidade37.rows.length > 0) {
            const e = entidade37.rows[0];
            await pool.query(
              `
              INSERT INTO clinicas (id, nome, cnpj, email, telefone, endereco, cidade, estado, ativa, entidade_id, criado_em, atualizado_em)
              VALUES (37, $1, $2, $3, $4, $5, $6, $7, true, 37, NOW(), NOW())
              ON CONFLICT (id) DO UPDATE SET entidade_id = 37
            `,
              [
                e.nome,
                e.cnpj,
                e.email,
                e.telefone,
                e.endereco,
                e.cidade,
                e.estado,
              ]
            );
            console.log(`      ✅ Clínica ID 37 criada para entidade 37`);
          }
        }

        // Atualizar funcionário para clinica_id 37
        if (func3.rows[0].clinica_id !== 37) {
          await pool.query(
            `
            UPDATE funcionarios 
            SET clinica_id = 37 
            WHERE id = $1
          `,
            [func3.rows[0].id]
          );
          console.log(
            `      ✅ Laudo 3: Funcionário ${func3.rows[0].id} (${func3.rows[0].nome}) → clinica_id: 37`
          );
        } else {
          console.log(
            `      ✓  Laudo 3: Funcionário ${func3.rows[0].id} → clinica_id: 37 (já correto)`
          );
        }
      }

      // Laudo 4 → entidade 37
      const func4 = await pool.query(`
        SELECT f.id, f.nome, f.contratante_id
        FROM laudos l
        JOIN funcionarios f ON f.id = l.funcionario_id
        WHERE l.id = 4
      `);

      if (func4.rows.length > 0 && func4.rows[0].contratante_id !== 37) {
        await pool.query(
          `
          UPDATE funcionarios 
          SET contratante_id = 37 
          WHERE id = $1
        `,
          [func4.rows[0].id]
        );
        console.log(
          `      ✅ Laudo 4: Funcionário ${func4.rows[0].id} (${func4.rows[0].nome}) → contratante_id: 37`
        );
      } else if (func4.rows.length > 0) {
        console.log(
          `      ✓  Laudo 4: Funcionário ${func4.rows[0].id} → contratante_id: 37 (já correto)`
        );
      }

      await pool.query('COMMIT');

      // 4. Verificação final
      console.log('\n4️⃣  VERIFICAÇÃO FINAL:\n');

      const laudosAfter = await pool.query(`
        SELECT 
          l.id,
          l.numero_laudo,
          f.nome AS funcionario_nome,
          f.contratante_id,
          f.clinica_id,
          e.nome AS entidade_nome,
          c.nome AS clinica_nome
        FROM laudos l
        LEFT JOIN funcionarios f ON f.id = l.funcionario_id
        LEFT JOIN entidades e ON e.id = f.contratante_id
        LEFT JOIN clinicas c ON c.id = f.clinica_id
        ORDER BY l.id
      `);

      for (const laudo of laudosAfter.rows) {
        console.log(`   ✅ Laudo ${laudo.id} (${laudo.numero_laudo})`);
        console.log(`      → Funcionário: ${laudo.funcionario_nome}`);
        if (laudo.contratante_id) {
          console.log(
            `      → Entidade: ID ${laudo.contratante_id} (${laudo.entidade_nome})`
          );
        }
        if (laudo.clinica_id) {
          console.log(
            `      → Clínica: ID ${laudo.clinica_id} (${laudo.clinica_nome})`
          );
        }
        console.log('');
      }

      console.log(
        '╔══════════════════════════════════════════════════════════════╗'
      );
      console.log(
        '║  ✅ CORREÇÕES APLICADAS COM SUCESSO!                        ║'
      );
      console.log(
        '╚══════════════════════════════════════════════════════════════╝\n'
      );
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('\n❌ ERRO:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
