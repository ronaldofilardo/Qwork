#!/usr/bin/env tsx
/**
 * Análise: Uso das tabelas contratantes*, contratantes_senhas e contratantes_senhas_audit
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
      '║  ANÁLISE: Tabelas CONTRATANTES*                            ║'
    );
    console.log(
      '╚══════════════════════════════════════════════════════════════╝\n'
    );

    // 1. Verificar registros nas tabelas
    console.log('1️⃣  CONTEÚDO DAS TABELAS:\n');

    const tables = [
      'contratantes',
      'contratantes_senhas',
      'contratantes_senhas_audit',
    ];

    for (const table of tables) {
      try {
        const count = await pool.query(`SELECT COUNT(*) FROM "${table}"`);
        const total = parseInt(count.rows[0].count);

        console.log(`   ${table}`);
        console.log(`   → Registros: ${total}`);

        if (total > 0) {
          const sample = await pool.query(`SELECT * FROM "${table}" LIMIT 3`);
          console.log(`   → Primeiros registros:`);
          sample.rows.forEach((row, idx) => {
            console.log(
              `      ${idx + 1}. ${JSON.stringify(row, null, 2).substring(0, 100)}...`
            );
          });
        }
        console.log('');
      } catch (error: any) {
        console.log(`   ${table}: ❌ ERRO - ${error.message}\n`);
      }
    }

    // 2. Verificar Foreign Keys que referenciam contratantes
    console.log('2️⃣  FOREIGN KEYS REFERENCIANDO CONTRATANTES:\n');

    const fks = await pool.query(`
      SELECT  
        tc.table_name AS from_table,
        kcu.column_name AS from_column,
        ccu.table_name AS to_table,
        ccu.column_name AS to_column
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'contratantes'
      ORDER BY tc.table_name
    `);

    if (fks.rows.length > 0) {
      console.log('   Tabelas que referenciam "contratantes":');
      for (const fk of fks.rows) {
        console.log(
          `   → ${fk.from_table}.${fk.from_column} → ${fk.to_table}.${fk.to_column}`
        );

        // Verificar quantos registros usam essa FK
        try {
          const usage = await pool.query(`
            SELECT COUNT(*) FROM "${fk.from_table}" 
            WHERE "${fk.from_column}" IS NOT NULL
          `);
          const usageCount = parseInt(usage.rows[0].count);
          console.log(`     ∟ Registros usando FK: ${usageCount}`);
        } catch {}
      }
      console.log('');
    } else {
      console.log('   ✅ Nenhuma FK referenciando "contratantes"\n');
    }

    // 3. Verificar uso no código (entidades já substituiu contratantes?)
    console.log('3️⃣  COMPARAÇÃO: contratantes vs entidades:\n');

    const contratantes = await pool.query('SELECT COUNT(*) FROM contratantes');
    const entidades = await pool.query('SELECT COUNT(*) FROM entidades');

    console.log(`   contratantes: ${contratantes.rows[0].count} registros`);
    console.log(`   entidades:    ${entidades.rows[0].count} registros\n`);

    // 4. Verificar estrutura de contratantes vs entidades
    console.log('4️⃣  ESTRUTURA DAS TABELAS:\n');

    const contratantesCols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name='contratantes' 
      ORDER BY ordinal_position
    `);

    const entidadesCols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name='entidades' 
      ORDER BY ordinal_position
    `);

    console.log('   Colunas em CONTRATANTES:');
    contratantesCols.rows.forEach((c) => {
      console.log(`      ${c.column_name.padEnd(30)} ${c.data_type}`);
    });

    console.log('\n   Colunas em ENTIDADES:');
    entidadesCols.rows.slice(0, 15).forEach((c) => {
      console.log(`      ${c.column_name.padEnd(30)} ${c.data_type}`);
    });
    console.log(`      ... (${entidadesCols.rows.length} colunas no total)\n`);

    // 5. Recomendação
    console.log(
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
    );
    console.log('RECOMENDAÇÃO:\n');

    const contratantesCount = parseInt(contratantes.rows[0].count);
    const entidadesCount = parseInt(entidades.rows[0].count);

    if (contratantesCount === 0 && fks.rows.length === 0) {
      console.log('   ✅ SEGURO REMOVER:');
      console.log('      - Tabela "contratantes" está vazia');
      console.log('      - Nenhuma FK referenciando');
      console.log('      - Tabela "entidades" já assumiu o papel');
      console.log(
        '\n   📝 AÇÃO: Remover tabelas contratantes*, contratantes_senhas, contratantes_senhas_audit'
      );
      console.log('           e buscar/remover código legado no projeto\n');
    } else if (contratantesCount > 0) {
      console.log('   ⚠️  ATENÇÃO:');
      console.log(
        `      - Tabela "contratantes" tem ${contratantesCount} registros`
      );
      console.log(
        '      - Verificar se esses dados foram migrados para "entidades"'
      );
      console.log('      - Se sim, é seguro remover\n');
    } else if (fks.rows.length > 0) {
      console.log('   ⚠️  ATENÇÃO:');
      console.log(
        `      - ${fks.rows.length} FKs ainda referenciam "contratantes"`
      );
      console.log(
        '      - Necessário migrar essas referências para "entidades" primeiro\n'
      );
    }

    console.log(
      '╚══════════════════════════════════════════════════════════════╝\n'
    );
  } finally {
    await pool.end();
  }
}

main();
