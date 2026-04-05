#!/usr/bin/env node
/**
 * Script de Monitoramento: Detecção de Lotes Órfãos
 * 
 * Executa periodicamente para detectar lotes criados sem avaliações
 * Pode ser agendado via cron ou GitHub Actions
 */

const { query } = require('@/lib/db');

async function detectarLotesOrfaos() {
  console.log('[MONITOR] Iniciando verificação de lotes órfãos...\n');

  try {
    // Buscar lotes órfãos criados nas últimas 24h
    const result = await query(`
      SELECT 
        la.id,
        la.numero_ordem,
        la.descricao,
        la.tipo,
        la.liberado_em,
        la.liberado_por,
        ec.nome as empresa_nome,
        c.nome as clinica_nome
      FROM lotes_avaliacao la
      LEFT JOIN empresas_clientes ec ON la.empresa_id = ec.id
      LEFT JOIN clinicas c ON la.clinica_id = c.id
      WHERE la.status = 'ativo'
        AND la.liberado_em > NOW() - INTERVAL '24 hours'
        AND NOT EXISTS (
          SELECT 1 FROM avaliacoes WHERE lote_id = la.id
        )
      ORDER BY la.liberado_em DESC
    `);

    if (result.rowCount === 0) {
      console.log('✅ Nenhum lote órfão detectado (últimas 24h)');
      return { status: 'ok', count: 0 };
    }

    // Alertar sobre lotes órfãos
    console.error(`❌ ${result.rowCount} lote(s) órfão(s) detectado(s):\n`);

    for (const lote of result.rows) {
      console.error(`  Lote #${lote.numero_ordem} (ID: ${lote.id})`);
      console.error(`    Empresa: ${lote.empresa_nome}`);
      console.error(`    Clínica: ${lote.clinica_nome}`);
      console.error(`    Liberado em: ${lote.liberado_em}`);
      console.error(`    Liberado por: ${lote.liberado_por}`);
      console.error(`    Descrição: ${lote.descricao}\n`);
    }

    return { status: 'error', count: result.rowCount, lotes: result.rows };
  } catch (error: any) {
    console.error('[MONITOR] Erro ao verificar lotes órfãos:', error.message);
    return { status: 'error', error: error.message };
  }
}

async function verificarConsistenciaAuditoria() {
  console.log('[MONITOR] Verificando consistência de auditoria...\n');

  try {
    // Verificar audit_logs sem user_cpf nas últimas 24h
    const result = await query(`
      SELECT 
        resource,
        action,
        COUNT(*) as total
      FROM audit_logs
      WHERE created_at > NOW() - INTERVAL '24 hours'
        AND (user_cpf IS NULL OR user_cpf = '')
      GROUP BY resource, action
      ORDER BY total DESC
    `);

    if (result.rowCount === 0) {
      console.log('✅ Auditoria consistente (últimas 24h)');
      return { status: 'ok', count: 0 };
    }

    console.warn(`⚠️  ${result.rowCount} tipo(s) de ação sem contexto de usuário:\n`);

    for (const row of result.rows) {
      console.warn(`  ${row.resource}.${row.action}: ${row.total} registros sem user_cpf`);
    }

    return { status: 'warning', count: result.rowCount, inconsistencias: result.rows };
  } catch (error: any) {
    console.error('[MONITOR] Erro ao verificar auditoria:', error.message);
    return { status: 'error', error: error.message };
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('MONITORAMENTO DE INTEGRIDADE DO SISTEMA');
  console.log('='.repeat(60) + '\n');

  const resultados = {
    timestamp: new Date().toISOString(),
    lotesOrfaos: await detectarLotesOrfaos(),
    auditoria: await verificarConsistenciaAuditoria(),
  };

  console.log('\n' + '='.repeat(60));
  console.log('RESUMO');
  console.log('='.repeat(60));
  console.log(JSON.stringify(resultados, null, 2));

  // Exit code para CI/CD
  const hasErrors =
    resultados.lotesOrfaos.status === 'error' ||
    resultados.auditoria.status === 'error';

  process.exit(hasErrors ? 1 : 0);
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch((error) => {
    console.error('[FATAL] Erro durante monitoramento:', error);
    process.exit(1);
  });
}

module.exports = { detectarLotesOrfaos, verificarConsistenciaAuditoria };
