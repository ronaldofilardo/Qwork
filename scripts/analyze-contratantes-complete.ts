#!/usr/bin/env tsx
/**
 * Análise completa: Uso das tabelas contratantes* e referências no código
 */

import { Pool } from 'pg';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

const DEV_DB = 'postgresql://postgres:123456@localhost:5432/nr-bps_db';
const PROJECT_ROOT = 'C:\\apps\\QWork';

async function searchInFiles(
  pattern: RegExp,
  extensions: string[] = ['.ts', '.tsx', '.js', '.jsx']
): Promise<{ file: string; matches: string[] }[]> {
  const results: { file: string; matches: string[] }[] = [];

  async function searchDir(dir: string, depth: number = 0) {
    if (depth > 5) return; // Limitar profundidade

    try {
      const entries = await readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        // Pular node_modules, .next, etc
        if (
          entry.name === 'node_modules' ||
          entry.name === '.next' ||
          entry.name === 'dist'
        )
          continue;

        if (entry.isDirectory()) {
          await searchDir(fullPath, depth + 1);
        } else if (
          entry.isFile() &&
          extensions.some((ext) => entry.name.endsWith(ext))
        ) {
          try {
            const content = await readFile(fullPath, 'utf-8');
            const matches = content.match(pattern);

            if (matches && matches.length > 0) {
              results.push({
                file: fullPath.replace(PROJECT_ROOT, ''),
                matches: [...new Set(matches)],
              });
            }
          } catch {}
        }
      }
    } catch {}
  }

  await searchDir(PROJECT_ROOT);
  return results;
}

async function main() {
  const pool = new Pool({ connectionString: DEV_DB });

  try {
    console.log(
      '╔══════════════════════════════════════════════════════════════╗'
    );
    console.log(
      '║  ANÁLISE COMPLETA: Tabelas CONTRATANTES*                   ║'
    );
    console.log(
      '╚══════════════════════════════════════════════════════════════╝\n'
    );

    // 1. Verificar dados nas tabelas
    console.log('1️⃣  DADOS NAS TABELAS:\n');

    const tables = [
      'contratantes',
      'contratantes_senhas',
      'contratantes_senhas_audit',
    ];

    for (const table of tables) {
      try {
        const count = await pool.query(`SELECT COUNT(*) FROM "${table}"`);
        const total = parseInt(count.rows[0].count);

        console.log(`   ${table.padEnd(30)} ${total} registros`);

        if (total > 0) {
          const sample = await pool.query(`SELECT * FROM "${table}" LIMIT 1`);
          console.log(
            `      Exemplo: ${JSON.stringify(sample.rows[0]).substring(0, 100)}...`
          );
        }
      } catch (error: any) {
        console.log(`   ${table.padEnd(30)} ❌ Tabela não existe`);
      }
    }

    // 2. Verificar Foreign Keys
    console.log('\n2️⃣  FOREIGN KEYS ATIVAS:\n');

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
        AND ccu.table_name IN ('contratantes', 'contratantes_senhas', 'contratantes_senhas_audit')
      ORDER BY tc.table_name
    `);

    if (fks.rows.length > 0) {
      console.log('   ⚠️  FKs encontradas referenciando contratantes*:\n');
      for (const fk of fks.rows) {
        console.log(
          `      ${fk.from_table}.${fk.from_column} → ${fk.to_table}.${fk.to_column}`
        );
      }
    } else {
      console.log('   ✅ NENHUMA FK referenciando contratantes*');
    }

    // 3. Buscar no código
    console.log('\n3️⃣  REFERÊNCIAS NO CÓDIGO:\n');

    console.log('   Buscando referências a "contratantes" no código...\n');

    const codeRefs = await searchInFiles(/\bcontratantes\b/gi);

    if (codeRefs.length > 0) {
      console.log(`   ⚠️  Encontradas ${codeRefs.length} referências:\n`);

      for (const ref of codeRefs.slice(0, 20)) {
        console.log(`      ${ref.file}`);
        console.log(
          `         Matches: ${ref.matches.slice(0, 3).join(', ')}${ref.matches.length > 3 ? '...' : ''}`
        );
      }

      if (codeRefs.length > 20) {
        console.log(`\n      ... e mais ${codeRefs.length - 20} arquivos`);
      }
    } else {
      console.log('   ✅ Nenhuma referência encontrada no código');
    }

    // 4. Comparar com entidades
    console.log('\n4️⃣  COMPARAÇÃO: contratantes vs entidades:\n');

    try {
      const contratantes = await pool.query(
        'SELECT COUNT(*) FROM contratantes'
      );
      const entidades = await pool.query('SELECT COUNT(*) FROM entidades');

      console.log(
        `   contratantes:     ${contratantes.rows[0].count} registros`
      );
      console.log(`   entidades:        ${entidades.rows[0].count} registros`);

      // Verificar estrutura
      const contCols = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='contratantes' 
        ORDER BY ordinal_position
      `);

      const entCols = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='entidades' 
        ORDER BY ordinal_position
      `);

      console.log(`\n   Colunas em contratantes: ${contCols.rows.length}`);
      console.log(`   Colunas em entidades:    ${entCols.rows.length}`);
    } catch (error: any) {
      console.log(`   ⚠️  Erro ao comparar: ${error.message}`);
    }

    // 5. Recomendação
    console.log(
      '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
    );
    console.log('RECOMENDAÇÃO:\n');

    const hasData = await pool
      .query('SELECT COUNT(*) FROM contratantes')
      .then((r) => parseInt(r.rows[0].count) > 0)
      .catch(() => false);
    const hasCodeRefs = codeRefs.length > 0;
    const hasFKs = fks.rows.length > 0;

    if (!hasData && !hasFKs && !hasCodeRefs) {
      console.log('   ✅ SEGURO REMOVER IMEDIATAMENTE:');
      console.log('      • Tabelas vazias');
      console.log('      • Sem FKs ativas');
      console.log('      • Sem referências no código\n');
      console.log(
        '   📝 AÇÃO: DROP das tabelas contratantes, contratantes_senhas, contratantes_senhas_audit'
      );
    } else if (!hasData && !hasFKs && hasCodeRefs) {
      console.log('   ⚠️  REMOVER COM REFATORAÇÃO:');
      console.log('      • Tabelas vazias ✅');
      console.log('      • Sem FKs ativas ✅');
      console.log(`      • ${codeRefs.length} referências no código ⚠️\n`);
      console.log('   📝 AÇÃO:');
      console.log(
        '      1. Refatorar código para remover referências a "contratantes"'
      );
      console.log('      2. Substituir por "entidades" onde necessário');
      console.log('      3. DROP das tabelas');
    } else if (!hasData && hasFKs) {
      console.log('   ⚠️  REMOVER FKs PRIMEIRO:');
      console.log('      • Tabelas vazias ✅');
      console.log(`      • ${fks.rows.length} FKs ativas ⚠️\n`);
      console.log('   📝 AÇÃO:');
      console.log('      1. Remover/migrar FKs para entidades');
      console.log('      2. Refatorar código se necessário');
      console.log('      3. DROP das tabelas');
    } else {
      console.log('   ⚠️  MIGRAÇÃO NECESSÁRIA:');
      console.log(`      • Tabelas com dados (${hasData ? 'SIM' : 'NÃO'}) ⚠️`);
      console.log(
        `      • FKs ativas (${hasFKs ? 'SIM' : 'NÃO'}) ${hasFKs ? '⚠️' : '✅'}`
      );
      console.log(
        `      • Refs no código (${hasCodeRefs ? 'SIM' : 'NÃO'}) ${hasCodeRefs ? '⚠️' : '✅'}\n`
      );
      console.log('   📝 AÇÃO:');
      console.log('      1. Migrar dados para entidades');
      console.log('      2. Atualizar FKs');
      console.log('      3. Refatorar código');
      console.log('      4. DROP das tabelas');
    }

    console.log(
      '\n╚══════════════════════════════════════════════════════════════╝\n'
    );
  } finally {
    await pool.end();
  }
}

main();
