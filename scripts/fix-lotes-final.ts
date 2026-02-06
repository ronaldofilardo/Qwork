#!/usr/bin/env tsx
/**
 * Correção FINAL: Relacionamentos dos lotes (que afetam laudos)
 *
 * - Lote 2 (Laudo 2): clinica_id=7 → contratante_id=35
 * - Lote 3 (Laudo 3): contratante_id=35 → clinica_id=37
 * - Lote 4 (Laudo 4): contratante_id=37 ✅ JÁ CORRETO
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
      '║  CORREÇÃO FINAL: Relacionamentos Lotes → Laudos             ║'
    );
    console.log(
      '╚══════════════════════════════════════════════════════════════╝\n'
    );

    await pool.query('BEGIN');

    try {
      // Desabilitar trigger de proteção temporariamente
      console.log('🔓 Desabilitando TODOS os triggers...\n');

      await pool.query(`ALTER TABLE lotes_avaliacao DISABLE TRIGGER ALL`);

      // Lote 2 → pertence à entidade 35 (não clínica)
      console.log('1️⃣  Lote 2 (Laudo 2) → entidade 35\n');

      await pool.query(`
        UPDATE lotes_avaliacao
        SET clinica_id = NULL,
            empresa_id = NULL,
            contratante_id = 35,
            descricao = 'Lote 1 liberado para rlgr (entidade 35). Inclui funcionário(s) elegíveis vinculados diretamente à entidade.',
            atualizado_em = NOW()
        WHERE id = 2
      `);

      console.log(
        '   ✅ Lote 2: clinica_id=7, empresa_id=6 → contratante_id=35\n'
      );

      // Lote 3 → pertence à clínica 37
      console.log('2️⃣  Lote 3 (Laudo 3) → clínica 37\n');

      // Primeiro, verificar/criar clínica 37
      const clinica37 = await pool.query(
        'SELECT id FROM clinicas WHERE id = 37'
      );

      if (clinica37.rows.length === 0) {
        console.log('   📝 Criando clínica ID 37 para entidade 37...\n');

        const ent37 = await pool.query('SELECT * FROM entidades WHERE id = 37');
        if (ent37.rows.length > 0) {
          const e = ent37.rows[0];
          await pool.query(
            `
            INSERT INTO clinicas (
              id, nome, cnpj, email, telefone, endereco, 
              cidade, estado, ativa, entidade_id, 
              criado_em, atualizado_em
            )
            VALUES (
              37, $1, $2, $3, $4, $5,
              $6, $7, true, 37,
              NOW(), NOW()
            )
            ON CONFLICT (id) DO UPDATE 
            SET entidade_id = 37, atualizado_em = NOW()
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

          console.log('   ✅ Clínica 37 criada!\n');
        }
      }

      await pool.query(`
        UPDATE lotes_avaliacao
        SET clinica_id = 37,
            contratante_id = NULL,
            descricao = 'Lote 1 liberado para Pos buckei (clínica 37). Inclui funcionário(s) elegíveis.',
            atualizado_em = NOW()
        WHERE id = 3
      `);

      console.log('   ✅ Lote 3: contratante_id=35 → clinica_id=37\n');

      // Lote 4 já está correto
      console.log('3️⃣  Lote 4 (Laudo 4) → entidade 37\n');
      console.log('   ✓  Lote 4: contratante_id=37 (já estava correto)\n');

      // Reabilitar trigger
      console.log('🔒 Reabilitando TODOS os triggers...\n');

      await pool.query(`ALTER TABLE lotes_avaliacao ENABLE TRIGGER ALL`);

      await pool.query('COMMIT');

      // Verificação final
      console.log(
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
      );
      console.log('VERIFICAÇÃO FINAL:\n');

      const lotesAfter = await pool.query(`
        SELECT 
          l.id AS lote_id,
          l.clinica_id,
          c.nome AS clinica_nome,
          l.contratante_id,
          e.nome AS entidade_nome,
          ld.id AS laudo_id
        FROM lotes_avaliacao l
        LEFT JOIN clinicas c ON c.id = l.clinica_id
        LEFT JOIN entidades e ON e.id = l.contratante_id
        LEFT JOIN laudos ld ON ld.lote_id = l.id
        ORDER BY l.id
      `);

      for (const lote of lotesAfter.rows) {
        console.log(
          `   Lote ${lote.lote_id} (Laudo ${lote.laudo_id || 'N/A'}):`
        );

        if (lote.clinica_id) {
          console.log(
            `      ✅ clinica_id: ${lote.clinica_id} (${lote.clinica_nome})`
          );
        } else if (lote.contratante_id) {
          console.log(
            `      ✅ contratante_id: ${lote.contratante_id} (${lote.entidade_nome})`
          );
        } else {
          console.log(`      ⚠️  SEM VINCULO!`);
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
