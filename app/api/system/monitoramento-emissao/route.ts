import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/system/monitoramento-emissao
 *
 * Dashboard de monitoramento de emissão automática de laudos.
 * Fornece métricas, latências, alertas e status do sistema.
 */
export const GET = async (_req: Request) => {
  const user = await requireRole(['admin', 'emissor']);
  if (!user) {
    return NextResponse.json(
      { error: 'Acesso negado', success: false },
      { status: 403 }
    );
  }

  try {
    // 1. Métricas gerais de emissão (últimas 24h)
    const metricasGerais = await query(`
      SELECT
        COUNT(*) FILTER (WHERE emitido_em >= NOW() - INTERVAL '24 hours') as emissoes_24h,
        COUNT(*) FILTER (WHERE enviado_em >= NOW() - INTERVAL '24 hours') as envios_24h,
        COUNT(*) FILTER (WHERE cancelado_automaticamente = true AND atualizado_em >= NOW() - INTERVAL '24 hours') as cancelamentos_auto_24h,
        COUNT(*) FILTER (WHERE status = 'concluido' AND emitido_em IS NULL) as pendentes_emissao,
        COUNT(*) FILTER (WHERE emitido_em IS NOT NULL AND enviado_em IS NULL) as pendentes_envio,
        AVG(EXTRACT(EPOCH FROM (emitido_em - atualizado_em)))::INTEGER as latencia_media_emissao_seg,
        AVG(EXTRACT(EPOCH FROM (enviado_em - emitido_em)))::INTEGER as latencia_media_envio_seg
      FROM lotes_avaliacao
      WHERE status IN ('concluido', 'cancelado')
        OR emitido_em IS NOT NULL
    `);

    // 2. Lotes com problemas/alertas críticos
    const alertasCriticos = await query(`
      SELECT * FROM vw_alertas_emissao_laudos
      WHERE tipo_alerta LIKE 'CRITICO%'
      ORDER BY idade_conclusao_segundos DESC
      LIMIT 10
    `);

    // 3. Lotes pendentes de emissão
    const lotesPendentesEmissao = await query(`
      SELECT
        id,
        codigo,
        status,
        EXTRACT(EPOCH FROM (NOW() - atualizado_em))::INTEGER as idade_segundos,
        COALESCE(ec.nome, cont.nome) as entidade_nome
      FROM lotes_avaliacao la
      LEFT JOIN empresas_clientes ec ON la.empresa_id = ec.id
      LEFT JOIN contratantes cont ON la.contratante_id = cont.id
      WHERE la.status = 'concluido'
        AND la.emitido_em IS NULL
      ORDER BY la.atualizado_em ASC
      LIMIT 20
    `);

    // 4. Lotes pendentes de envio
    const lotesPendentesEnvio = await query(`
      SELECT
        id,
        codigo,
        emitido_em,
        auto_emitir_em,
        EXTRACT(EPOCH FROM (NOW() - emitido_em))::INTEGER as idade_emissao_segundos,
        EXTRACT(EPOCH FROM (NOW() - auto_emitir_em))::INTEGER as atraso_envio_segundos,
        COALESCE(ec.nome, cont.nome) as entidade_nome
      FROM lotes_avaliacao la
      LEFT JOIN empresas_clientes ec ON la.empresa_id = ec.id
      LEFT JOIN contratantes cont ON la.contratante_id = cont.id
      WHERE la.emitido_em IS NOT NULL
        AND la.enviado_em IS NULL
        AND la.auto_emitir_em IS NOT NULL
      ORDER BY la.auto_emitir_em ASC
      LIMIT 20
    `);

    // 5. Histórico de emissões recentes (últimas 20)
    const historicoEmissoes = await query(`
      SELECT
        la.id,
        la.codigo,
        la.emitido_em,
        la.enviado_em,
        EXTRACT(EPOCH FROM (la.emitido_em - la.atualizado_em))::INTEGER as latencia_emissao_seg,
        EXTRACT(EPOCH FROM (la.enviado_em - la.emitido_em))::INTEGER as latencia_envio_seg,
        COALESCE(ec.nome, cont.nome) as entidade_nome
      FROM lotes_avaliacao la
      LEFT JOIN empresas_clientes ec ON la.empresa_id = ec.id
      LEFT JOIN contratantes cont ON la.contratante_id = cont.id
      WHERE la.emitido_em IS NOT NULL
      ORDER BY la.emitido_em DESC
      LIMIT 20
    `);

    // 6. Erros recentes de auditoria (últimas 24h)
    const errosRecentes = await query(`
      SELECT
        al.id,
        al.lote_id,
        al.acao,
        al.status,
        al.observacoes,
        al.criado_em,
        la.codigo
      FROM auditoria_laudos al
      LEFT JOIN lotes_avaliacao la ON al.lote_id = la.id
      WHERE al.status = 'erro'
        AND al.criado_em >= NOW() - INTERVAL '24 hours'
      ORDER BY al.criado_em DESC
      LIMIT 10
    `);

    // 7. Verificar emissor ativo
    const emissores = await query(`
      SELECT cpf, nome, email
      FROM funcionarios
      WHERE perfil = 'emissor' AND ativo = true
    `);

    const emissorStatus = {
      ok: emissores.rows.length === 1,
      total: emissores.rows.length,
      emissor: emissores.rows.length === 1 ? emissores.rows[0] : null,
      erro:
        emissores.rows.length === 0
          ? 'Nenhum emissor ativo no sistema'
          : emissores.rows.length > 1
            ? 'Múltiplos emissores ativos detectados'
            : null,
    };

    // 8. Percentis de latência (P50, P95, P99)
    const percentisLatencia = await query(`
      WITH latencias AS (
        SELECT
          EXTRACT(EPOCH FROM (emitido_em - atualizado_em))::INTEGER as lat_emissao,
          EXTRACT(EPOCH FROM (enviado_em - emitido_em))::INTEGER as lat_envio
        FROM lotes_avaliacao
        WHERE emitido_em >= NOW() - INTERVAL '7 days'
          AND emitido_em IS NOT NULL
      )
      SELECT
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY lat_emissao) as p50_emissao,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY lat_emissao) as p95_emissao,
        PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY lat_emissao) as p99_emissao,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY lat_envio) as p50_envio,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY lat_envio) as p95_envio,
        PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY lat_envio) as p99_envio
      FROM latencias
    `);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      metricas_gerais: metricasGerais.rows[0],
      percentis_latencia: percentisLatencia.rows[0] || {},
      alertas_criticos: alertasCriticos.rows,
      lotes_pendentes_emissao: lotesPendentesEmissao.rows,
      lotes_pendentes_envio: lotesPendentesEnvio.rows,
      historico_emissoes: historicoEmissoes.rows,
      erros_recentes: errosRecentes.rows,
      emissor_status: emissorStatus,
    });
  } catch (error) {
    console.error(
      '[GET /api/system/monitoramento-emissao] Erro ao buscar métricas:',
      error
    );
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        success: false,
        detalhes: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
};
