#!/usr/bin/env tsx
/**
 * Script para copiar dados respeitando dependências entre tabelas
 */

import { Pool } from 'pg';

const DEV_DB = {
  connectionString: 'postgresql://postgres:123456@localhost:5432/nr-bps_db',
  name: 'DESENVOLVIMENTO',
};

const PROD_DB = {
  connectionString:
    'postgresql://neondb_owner:npg_J2QYqn5oxCzp@ep-divine-sky-acuderi7.sa-east-1.aws.neon.tech/neondb?sslmode=require',
  name: 'PRODUÇÃO',
};

// Ordem correta de cópia das tabelas (respeitando foreign keys)
const TABLE_ORDER = [
  // Tabelas base sem dependências
  'planos',
  'questoes',

  // Entidades (antiga contratantes) - depende de planos
  'entidades',

  // Tabelas que dependem de entidades
  'entidades_senhas',
  'clinicas',
  'contratos',

  // Tabelas que dependem de clinicas
  'clinicas_senhas',
  'empresas_clientes',

  // Funcionários e suas relações
  'funcionarios',
  'funcionarios_clinicas',
  'funcionarios_entidades',

  // Lotes (depende de clinicas e entidades)
  'lotes_avaliacao',

  // Avaliações (depende de lotes e funcionarios)
  'avaliacoes',
  'avaliacao_resets',

  // Respostas (depende de avaliacoes e questoes)
  'respostas',

  // Resultados (depende de avaliacoes)
  'resultados',

  // Laudos (depende de lotes)
  'laudos',
  'auditoria_laudos',

  // Pagamentos e contratos
  'pagamentos',
  'recibos',
  'contratacao_personalizada',
  'tokens_retomada_pagamento',

  // Notificações
  'notificacoes',
  'notificacoes_admin',

  // Auditoria
  'auditoria',
  'auditoria_recibos',
  'audit_logs',

  // Usuários (depende de entidades e clinicas)
  'usuarios',

  // Jobs e outras tabelas
  'pdf_jobs',

  // Tabelas deprecated/legacy
  '_deprecated_fila_emissao',
];

async function disableTriggersOnTable(
  pool: Pool,
  tableName: string
): Promise<void> {
  try {
    await pool.query(`ALTER TABLE "${tableName}" DISABLE TRIGGER USER`);
  } catch (error: any) {
    console.warn(
      `    ⚠️  Não foi possível desabilitar triggers em ${tableName}: ${error.message}`
    );
  }
}

async function enableTriggersOnTable(
  pool: Pool,
  tableName: string
): Promise<void> {
  try {
    await pool.query(`ALTER TABLE "${tableName}" ENABLE TRIGGER USER`);
  } catch (error: any) {
    console.warn(
      `    ⚠️  Não foi possível habilitar triggers em ${tableName}: ${error.message}`
    );
  }
}

async function copyTableData(
  devPool: Pool,
  prodPool: Pool,
  tableName: string
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    // Verificar se a tabela existe em ambos os bancos
    const devExists = await devPool.query(
      `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = $1
      )
    `,
      [tableName]
    );

    const prodExists = await prodPool.query(
      `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = $1
      )
    `,
      [tableName]
    );

    if (!devExists.rows[0].exists) {
      return { success: false, count: 0, error: 'Tabela não existe no DEV' };
    }

    if (!prodExists.rows[0].exists) {
      return { success: false, count: 0, error: 'Tabela não existe no PROD' };
    }

    // Contar registros no desenvolvimento
    const countResult = await devPool.query(
      `SELECT COUNT(*) as count FROM "${tableName}"`
    );
    const totalRecords = parseInt(countResult.rows[0].count);

    if (totalRecords === 0) {
      return { success: true, count: 0 };
    }

    console.log(`    📊 ${totalRecords} registros encontrados`);

    // Desabilitar triggers
    await disableTriggersOnTable(prodPool, tableName);

    // Obter todos os dados
    const dataResult = await devPool.query(
      `SELECT * FROM "${tableName}" ORDER BY 1`
    );

    if (dataResult.rows.length === 0) {
      return { success: true, count: 0 };
    }

    // Obter nomes das colunas
    const columns = Object.keys(dataResult.rows[0]);
    const columnNames = columns.map((c) => `"${c}"`).join(', ');

    // Inserir em lotes
    const batchSize = 100;
    let insertedCount = 0;

    for (let i = 0; i < dataResult.rows.length; i += batchSize) {
      const batch = dataResult.rows.slice(i, i + batchSize);

      // Construir query de inserção
      const values = batch
        .map((row, rowIndex) => {
          const rowValues = columns
            .map((col, colIndex) => {
              return `$${rowIndex * columns.length + colIndex + 1}`;
            })
            .join(', ');
          return `(${rowValues})`;
        })
        .join(', ');

      const flatValues = batch.flatMap((row) => columns.map((col) => row[col]));

      const insertQuery = `
        INSERT INTO "${tableName}" (${columnNames})
        VALUES ${values}
        ON CONFLICT DO NOTHING
      `;

      try {
        const result = await prodPool.query(insertQuery, flatValues);
        insertedCount += result.rowCount || 0;

        const progress = Math.min(i + batchSize, dataResult.rows.length);
        console.log(`    ✓ ${progress}/${dataResult.rows.length} processados`);
      } catch (batchError: any) {
        console.error(
          `    ❌ Erro no lote ${i}-${i + batchSize}: ${batchError.message}`
        );
        // Continuar com o próximo lote
      }
    }

    // Atualizar sequences se existirem
    try {
      const sequenceQuery = `
        SELECT column_name, column_default
        FROM information_schema.columns
        WHERE table_name = $1
          AND column_default LIKE 'nextval%'
      `;
      const sequences = await prodPool.query(sequenceQuery, [tableName]);

      for (const seq of sequences.rows) {
        const sequenceName = seq.column_default.match(/nextval\('(.+?)'/)?.[1];
        if (sequenceName) {
          await prodPool.query(
            `
            SELECT setval($1, COALESCE((SELECT MAX("${seq.column_name}") FROM "${tableName}"), 1), true)
          `,
            [sequenceName]
          );
          console.log(`    🔄 Sequence ${sequenceName} atualizada`);
        }
      }
    } catch (seqError: any) {
      console.warn(`    ⚠️  Erro ao atualizar sequences: ${seqError.message}`);
    }

    // Reabilitar triggers
    await enableTriggersOnTable(prodPool, tableName);

    return { success: true, count: insertedCount };
  } catch (error: any) {
    return { success: false, count: 0, error: error.message };
  }
}

async function main() {
  const devPool = new Pool({ connectionString: DEV_DB.connectionString });
  const prodPool = new Pool({ connectionString: PROD_DB.connectionString });

  try {
    console.log(
      '╔══════════════════════════════════════════════════════════════╗'
    );
    console.log(
      '║  CÓPIA DE DADOS: DESENVOLVIMENTO → PRODUÇÃO                 ║'
    );
    console.log(
      '╚══════════════════════════════════════════════════════════════╝\\n'
    );

    const results: Array<{
      table: string;
      success: boolean;
      count: number;
      error?: string;
    }> = [];

    for (const tableName of TABLE_ORDER) {
      console.log(`\\n📋 Copiando: ${tableName}`);
      const result = await copyTableData(devPool, prodPool, tableName);
      results.push({ table: tableName, ...result });

      if (result.success) {
        if (result.count > 0) {
          console.log(`   ✅ ${result.count} registros copiados`);
        } else {
          console.log(`   ⏭️  Tabela vazia ou sem dados novos`);
        }
      } else {
        console.log(`   ❌ Erro: ${result.error}`);
      }
    }

    // Relatório final
    console.log('\\n' + '━'.repeat(70));
    console.log('RESUMO DA CÓPIA');
    console.log('━'.repeat(70) + '\\n');

    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);
    const totalRecords = successful.reduce((sum, r) => sum + r.count, 0);

    console.log(`✅ Tabelas copiadas com sucesso: ${successful.length}`);
    console.log(`❌ Tabelas com erro: ${failed.length}`);
    console.log(`📊 Total de registros copiados: ${totalRecords}\\n`);

    if (failed.length > 0) {
      console.log('Tabelas com erro:');
      failed.forEach((f) => {
        console.log(`   ❌ ${f.table}: ${f.error}`);
      });
    }

    console.log(
      '\\n╔══════════════════════════════════════════════════════════════╗'
    );
    console.log(
      '║  ✅ CÓPIA DE DADOS CONCLUÍDA!                               ║'
    );
    console.log(
      '╚══════════════════════════════════════════════════════════════╝\\n'
    );
  } catch (error) {
    console.error('\\n❌ ERRO CRÍTICO:', error);
    process.exit(1);
  } finally {
    await devPool.end();
    await prodPool.end();
  }
}

main();
