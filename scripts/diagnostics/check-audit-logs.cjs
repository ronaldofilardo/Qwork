#!/usr/bin/env node

/**
 * Verificação de Audit Logs e Eventos
 *
 * Analisa:
 * - Logs de auditoria do banco (tabelas audit_*)
 * - Histórico de mudanças em lotes
 * - Histórico de mudanças em laudos
 * - Tentativas de emissão
 * - Solicitações de emissão
 *
 * Uso:
 *   node scripts/check-audit-logs.cjs [DATABASE_URL]
 */

const { Client } = require('pg');

async function checkAuditLogs() {
  const dbUrl =
    process.argv[2] ||
    process.env.DATABASE_URL ||
    (process.env.LOCAL_DATABASE_URL ?? 'postgresql://postgres@localhost:5432/nr-bps_db');

  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  console.log('\n' + '='.repeat(80));
  console.log('🔍 ANÁLISE DE AUDIT LOGS E EVENTOS');
  console.log('='.repeat(80));

  try {
    // 1. Verificar tabelas de auditoria existentes
    console.log('\n📋 TABELAS DE AUDITORIA:');
    console.log('-'.repeat(80));

    const auditTables = await client.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
        AND (
          tablename LIKE 'audit%'
          OR tablename LIKE '%_log'
          OR tablename LIKE '%_history'
        )
      ORDER BY tablename
    `);

    if (auditTables.rows.length === 0) {
      console.log('   ℹ️  Nenhuma tabela de auditoria encontrada');
    } else {
      console.log(`   ${auditTables.rows.length} tabelas encontradas:\n`);

      for (const table of auditTables.rows) {
        const count = await client.query(
          `SELECT COUNT(*) as total FROM ${table.tablename}`
        );

        // Verificar quais colunas existem
        const columns = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = '${table.tablename}' 
            AND table_schema = 'public'
        `);

        const hasCreatedAt = columns.rows.some(
          (c) =>
            c.column_name === 'criado_em' ||
            c.column_name === 'data_hora' ||
            c.column_name === 'created_at'
        );

        const orderBy = hasCreatedAt
          ? columns.rows.find((c) => c.column_name === 'criado_em')
              ?.column_name ||
            columns.rows.find((c) => c.column_name === 'data_hora')
              ?.column_name ||
            columns.rows.find((c) => c.column_name === 'created_at')
              ?.column_name
          : columns.rows[0]?.column_name || 'id';

        const recent = await client.query(`
          SELECT * FROM ${table.tablename} 
          ORDER BY ${orderBy} DESC
          LIMIT 3
        `);

        console.log(`   ${table.tablename}:`);
        console.log(`      Total: ${count.rows[0].total} registros`);

        if (recent.rows.length > 0) {
          console.log(`      Registros recentes:`);
          recent.rows.forEach((row, idx) => {
            const keys = Object.keys(row).slice(0, 5); // primeiras 5 colunas
            const preview = keys.map((k) => `${k}=${row[k]}`).join(', ');
            console.log(`         ${idx + 1}. ${preview}`);
          });
        }
        console.log('');
      }
    }

    // 2. Solicitações de Emissão
    console.log('\n📬 SOLICITAÇÕES DE EMISSÃO (últimas 10):');
    console.log('-'.repeat(80));

    try {
      const emissoesQuery = await client.query(`
        SELECT 
          le.id,
          le.lote_id,
          le.solicitante_cpf,
          le.solicitado_em,
          le.status as emissao_status,
          l.status as lote_status,
          ld.status as laudo_status,
          ld.hash_pdf IS NOT NULL as laudo_tem_hash
        FROM lotes_emissao le
        JOIN lotes_avaliacao l ON l.id = le.lote_id
        LEFT JOIN laudos ld ON ld.lote_id = le.lote_id
        ORDER BY le.solicitado_em DESC
        LIMIT 10
      `);

      if (emissoesQuery.rows.length === 0) {
        console.log('   ℹ️  Nenhuma solicitação de emissão encontrada');
      } else {
        console.log(`   ${emissoesQuery.rows.length} solicitações:\n`);
        emissoesQuery.rows.forEach((row) => {
          const hashIcon = row.laudo_tem_hash ? '✓' : '✗';
          console.log(`   Emissão ${row.id} (Lote ${row.lote_id})`);
          console.log(`      Solicitante: ${row.solicitante_cpf}`);
          console.log(`      Solicitado: ${row.solicitado_em?.toISOString()}`);
          console.log(`      Status Emissão: ${row.emissao_status}`);
          console.log(`      Status Lote: ${row.lote_status}`);
          console.log(`      Status Laudo: ${row.laudo_status}`);
          console.log(`      Laudo Hash: ${hashIcon}`);
          console.log('');
        });
      }
    } catch (err) {
      console.log(
        '   ℹ️  Tabela lotes_emissao não existe ou erro ao consultar'
      );
    }

    // 3. Jobs de PDF
    console.log('\n🖨️  JOBS DE GERAÇÃO DE PDF:');
    console.log('-'.repeat(80));

    try {
      const pdfJobs = await client.query(`
        SELECT 
          id,
          tipo,
          referencia_id,
          status,
          tentativas,
          erro_mensagem,
          criado_em,
          processado_em
        FROM pdf_jobs
        ORDER BY criado_em DESC
        LIMIT 10
      `);

      if (pdfJobs.rows.length === 0) {
        console.log('   ✅ Nenhum job de PDF pendente ou processado');
      } else {
        console.log(`   ${pdfJobs.rows.length} jobs:\n`);
        pdfJobs.rows.forEach((row) => {
          const statusIcon =
            row.status === 'sucesso'
              ? '✅'
              : row.status === 'erro'
                ? '❌'
                : row.status === 'processando'
                  ? '⏳'
                  : '•';
          console.log(`   ${statusIcon} Job ${row.id} (${row.tipo})`);
          console.log(`      Referência: ${row.referencia_id}`);
          console.log(`      Status: ${row.status}`);
          console.log(`      Tentativas: ${row.tentativas}`);
          if (row.erro_mensagem) {
            console.log(`      Erro: ${row.erro_mensagem.substring(0, 100)}`);
          }
          console.log(`      Criado: ${row.criado_em?.toISOString()}`);
          console.log('');
        });
      }
    } catch (err) {
      console.log('   ℹ️  Tabela pdf_jobs não existe ou erro ao consultar');
    }

    // 4. Jobs de Geração de Laudo
    console.log('\n📄 JOBS DE GERAÇÃO DE LAUDO:');
    console.log('-'.repeat(80));

    try {
      const laudoJobs = await client.query(`
        SELECT 
          id,
          lote_id,
          status,
          tentativas,
          erro_mensagem,
          criado_em,
          iniciado_em,
          concluido_em
        FROM laudo_generation_jobs
        ORDER BY criado_em DESC
        LIMIT 10
      `);

      if (laudoJobs.rows.length === 0) {
        console.log('   ✅ Nenhum job de geração de laudo pendente');
      } else {
        console.log(`   ${laudoJobs.rows.length} jobs:\n`);
        laudoJobs.rows.forEach((row) => {
          const statusIcon =
            row.status === 'completed'
              ? '✅'
              : row.status === 'failed'
                ? '❌'
                : row.status === 'processing'
                  ? '⏳'
                  : '•';
          console.log(`   ${statusIcon} Job ${row.id} (Lote ${row.lote_id})`);
          console.log(`      Status: ${row.status}`);
          console.log(`      Tentativas: ${row.tentativas}`);
          if (row.erro_mensagem) {
            console.log(`      Erro: ${row.erro_mensagem.substring(0, 100)}`);
          }
          console.log(`      Criado: ${row.criado_em?.toISOString()}`);
          if (row.concluido_em) {
            console.log(`      Concluído: ${row.concluido_em.toISOString()}`);
          }
          console.log('');
        });
      }
    } catch (err) {
      console.log(
        '   ℹ️  Tabela laudo_generation_jobs não existe ou erro ao consultar'
      );
    }

    // 5. Fila de Emissão
    console.log('\n🔄 FILA DE EMISSÃO:');
    console.log('-'.repeat(80));

    try {
      const queue = await client.query(`
        SELECT 
          id,
          lote_id,
          status,
          prioridade,
          tentativas,
          erro_mensagem,
          criado_em,
          processado_em
        FROM emissao_queue
        ORDER BY 
          CASE status 
            WHEN 'pendente' THEN 1
            WHEN 'processando' THEN 2
            WHEN 'erro' THEN 3
            ELSE 4
          END,
          prioridade DESC,
          criado_em ASC
        LIMIT 10
      `);

      if (queue.rows.length === 0) {
        console.log('   ✅ Fila de emissão vazia');
      } else {
        console.log(`   ${queue.rows.length} itens na fila:\n`);
        queue.rows.forEach((row) => {
          const statusIcon =
            row.status === 'concluido'
              ? '✅'
              : row.status === 'erro'
                ? '❌'
                : row.status === 'processando'
                  ? '⏳'
                  : '•';
          console.log(`   ${statusIcon} Item ${row.id} (Lote ${row.lote_id})`);
          console.log(`      Status: ${row.status}`);
          console.log(`      Prioridade: ${row.prioridade}`);
          console.log(`      Tentativas: ${row.tentativas}`);
          if (row.erro_mensagem) {
            console.log(`      Erro: ${row.erro_mensagem.substring(0, 100)}`);
          }
          console.log('');
        });
      }
    } catch (err) {
      console.log(
        '   ℹ️  Tabela emissao_queue não existe ou erro ao consultar'
      );
    }

    // 6. Eventos Recentes de Lotes
    console.log('\n📊 MUDANÇAS RECENTES EM LOTES:');
    console.log('-'.repeat(80));

    try {
      const lotesAudit = await client.query(`
        SELECT 
          operacao,
          usuario_cpf,
          data_hora,
          lote_id,
          campo_alterado,
          valor_anterior,
          valor_novo
        FROM audit_lotes_avaliacao
        ORDER BY data_hora DESC
        LIMIT 15
      `);

      if (lotesAudit.rows.length === 0) {
        console.log('   ℹ️  Nenhum evento de auditoria de lotes');
      } else {
        console.log(`   ${lotesAudit.rows.length} eventos:\n`);
        lotesAudit.rows.forEach((row) => {
          const opIcon =
            row.operacao === 'UPDATE'
              ? '📝'
              : row.operacao === 'INSERT'
                ? '➕'
                : row.operacao === 'DELETE'
                  ? '🗑️'
                  : '•';
          console.log(`   ${opIcon} ${row.operacao} no Lote ${row.lote_id}`);
          console.log(`      Usuário: ${row.usuario_cpf}`);
          console.log(`      Data: ${row.data_hora?.toISOString()}`);
          if (row.campo_alterado) {
            console.log(`      Campo: ${row.campo_alterado}`);
            console.log(
              `      Valor: ${row.valor_anterior} → ${row.valor_novo}`
            );
          }
          console.log('');
        });
      }
    } catch (err) {
      console.log('   ℹ️  Tabela audit_lotes_avaliacao não existe');
    }

    // 7. Eventos Recentes de Laudos
    console.log('\n📋 MUDANÇAS RECENTES EM LAUDOS:');
    console.log('-'.repeat(80));

    try {
      const laudosAudit = await client.query(`
        SELECT 
          operacao,
          usuario_cpf,
          data_hora,
          laudo_id,
          campo_alterado,
          valor_anterior,
          valor_novo
        FROM audit_laudos
        ORDER BY data_hora DESC
        LIMIT 15
      `);

      if (laudosAudit.rows.length === 0) {
        console.log('   ℹ️  Nenhum evento de auditoria de laudos');
      } else {
        console.log(`   ${laudosAudit.rows.length} eventos:\n`);
        laudosAudit.rows.forEach((row) => {
          const opIcon =
            row.operacao === 'UPDATE'
              ? '📝'
              : row.operacao === 'INSERT'
                ? '➕'
                : row.operacao === 'DELETE'
                  ? '🗑️'
                  : '•';
          console.log(`   ${opIcon} ${row.operacao} no Laudo ${row.laudo_id}`);
          console.log(`      Usuário: ${row.usuario_cpf}`);
          console.log(`      Data: ${row.data_hora?.toISOString()}`);
          if (row.campo_alterado) {
            console.log(`      Campo: ${row.campo_alterado}`);
            console.log(
              `      Valor: ${row.valor_anterior} → ${row.valor_novo}`
            );
          }
          console.log('');
        });
      }
    } catch (err) {
      console.log('   ℹ️  Tabela audit_laudos não existe');
    }

    // 8. Erros Recentes (se houver tabela de logs)
    console.log('\n❌ ERROS RECENTES:');
    console.log('-'.repeat(80));

    try {
      const errors = await client.query(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
          AND tablename LIKE '%error%' OR tablename LIKE '%log%'
      `);

      if (errors.rows.length === 0) {
        console.log('   ℹ️  Nenhuma tabela de erros/logs encontrada');
      } else {
        for (const table of errors.rows) {
          const recentErrors = await client.query(`
            SELECT * FROM ${table.tablename} 
            ORDER BY id DESC 
            LIMIT 5
          `);

          if (recentErrors.rows.length > 0) {
            console.log(`\n   Tabela: ${table.tablename}`);
            recentErrors.rows.forEach((row, idx) => {
              console.log(
                `      ${idx + 1}. ${JSON.stringify(row).substring(0, 150)}`
              );
            });
          }
        }
      }
    } catch (err) {
      console.log('   ℹ️  Erro ao consultar tabelas de log');
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ ANÁLISE DE AUDIT LOGS CONCLUÍDA');
    console.log('='.repeat(80));
  } catch (error) {
    console.error('\n❌ Erro na análise:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

checkAuditLogs().catch((err) => {
  console.error('\n💥 Erro fatal:', err);
  process.exit(1);
});
