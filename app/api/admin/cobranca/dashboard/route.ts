import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Força renderização dinâmica - não pré-renderizar durante build
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/admin/cobranca/dashboard
 *
 * Retorna métricas gerais de cobrança para o dashboard
 */
export async function GET(_request: NextRequest) {
  try {
    const columnExistsResult = await query(
      `SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pagamentos' AND column_name = 'detalhes_parcelas') as column_exists`
    );
    const columnExists = columnExistsResult.rows[0].column_exists;

    if (!columnExists) {
      return NextResponse.json({
        success: true,
        dashboard: {
          metrics: {
            total_pagamentos: 0,
            valor_total_contratado: 0,
            valor_recebido: 0,
            valor_a_receber: 0,
            parcelas_vencidas: 0,
            parcelas_pendentes: 0,
            parcelas_pagas: 0,
            taxa_inadimplencia: 0,
          },
          parcelas_vencidas: [],
          proximos_vencimentos: [],
          inadimplentes: [],
        },
      });
    }

    // Query 8: Dashboard com métricas gerais (inclui pagamentos com e sem parcelas)
    const metricsResult = await query(
      `SELECT
        COUNT(DISTINCT p.id) FILTER (WHERE p.numero_parcelas > 1) as total_pagamentos_parcelados,
        COALESCE(SUM(p.valor), 0) as valor_total_contratado,
        COALESCE(SUM(
          CASE
            WHEN parcela IS NOT NULL AND parcela->>'status' = 'pago' THEN (parcela->>'valor')::numeric
            WHEN parcela IS NULL AND p.status = 'pago' THEN p.valor
            ELSE 0
          END
        ), 0) as valor_recebido,
        COALESCE(SUM(
          CASE
            WHEN parcela IS NOT NULL AND parcela->>'status' = 'pendente' THEN (parcela->>'valor')::numeric
            WHEN parcela IS NULL AND p.status <> 'pago' THEN p.valor
            ELSE 0
          END
        ), 0) as valor_a_receber,
        COUNT(CASE WHEN parcela->>'status' = 'pendente'
                   AND (parcela->>'data_vencimento')::date < CURRENT_DATE
              THEN 1 END) as parcelas_vencidas,
        COUNT(CASE WHEN parcela->>'status' = 'pendente' THEN 1 END) as parcelas_pendentes,
        COUNT(CASE WHEN parcela->>'status' = 'pago' THEN 1 END) as parcelas_pagas
      FROM pagamentos p
      LEFT JOIN LATERAL jsonb_array_elements(p.detalhes_parcelas) as parcela ON true`
    );

    // Query 3: Parcelas vencidas (top 10)
    const parcelasVencidasResult = await query(
      `SELECT
        p.id as pagamento_id,
        c.id as tomador_id,
        c.nome as tomador_nome,
        c.email,
        c.telefone,
        parcela->>'numero' as parcela_numero,
        (parcela->>'valor')::numeric as parcela_valor,
        (parcela->>'data_vencimento')::date as data_vencimento,
        CURRENT_DATE - (parcela->>'data_vencimento')::date as dias_atraso,
        parcela->>'status' as status_parcela
      FROM pagamentos p
      INNER JOIN tomadors c ON c.id = p.tomador_id
      CROSS JOIN LATERAL jsonb_array_elements(p.detalhes_parcelas) as parcela
      WHERE p.detalhes_parcelas IS NOT NULL
        AND parcela->>'status' = 'pendente'
        AND (parcela->>'data_vencimento')::date < CURRENT_DATE
      ORDER BY (parcela->>'data_vencimento')::date ASC
      LIMIT 10`
    );

    // Query 4: Próximos vencimentos (próximos 30 dias, top 10)
    const proximosVencimentosResult = await query(
      `SELECT
        p.id as pagamento_id,
        c.nome as tomador_nome,
        c.email,
        parcela->>'numero' as parcela_numero,
        (parcela->>'valor')::numeric as parcela_valor,
        (parcela->>'data_vencimento')::date as data_vencimento,
        (parcela->>'data_vencimento')::date - CURRENT_DATE as dias_ate_vencimento
      FROM pagamentos p
      INNER JOIN tomadors c ON c.id = p.tomador_id
      CROSS JOIN LATERAL jsonb_array_elements(p.detalhes_parcelas) as parcela
      WHERE p.detalhes_parcelas IS NOT NULL
        AND parcela->>'status' = 'pendente'
        AND (parcela->>'data_vencimento')::date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
      ORDER BY (parcela->>'data_vencimento')::date ASC
      LIMIT 10`
    );

    // Query 10: tomadors inadimplentes
    const inadimplentesResult = await query(
      `SELECT
        c.id,
        c.nome,
        c.email,
        c.telefone,
        COUNT(*) as total_parcelas_vencidas,
        SUM((parcela->>'valor')::numeric) as valor_total_vencido,
        MIN((parcela->>'data_vencimento')::date) as primeira_parcela_vencida,
        MAX(CURRENT_DATE - (parcela->>'data_vencimento')::date) as dias_maior_atraso
      FROM tomadors c
      INNER JOIN pagamentos p ON p.tomador_id = c.id
      CROSS JOIN LATERAL jsonb_array_elements(p.detalhes_parcelas) as parcela
      WHERE parcela->>'status' = 'pendente'
        AND (parcela->>'data_vencimento')::date < CURRENT_DATE
      GROUP BY c.id, c.nome, c.email, c.telefone
      HAVING COUNT(*) > 0
      ORDER BY dias_maior_atraso DESC, valor_total_vencido DESC
      LIMIT 5`
    );

    const metrics = metricsResult.rows[0] || {
      total_pagamentos_parcelados: 0,
      valor_total_contratado: 0,
      valor_recebido: 0,
      valor_a_receber: 0,
      parcelas_vencidas: 0,
      parcelas_pendentes: 0,
      parcelas_pagas: 0,
    };

    return NextResponse.json({
      success: true,
      dashboard: {
        metrics: {
          total_pagamentos: Number(metrics.total_pagamentos_parcelados),
          valor_total_contratado: parseFloat(metrics.valor_total_contratado),
          valor_recebido: parseFloat(metrics.valor_recebido),
          valor_a_receber: parseFloat(metrics.valor_a_receber),
          parcelas_vencidas: Number(metrics.parcelas_vencidas),
          parcelas_pendentes: Number(metrics.parcelas_pendentes),
          parcelas_pagas: Number(metrics.parcelas_pagas),
          taxa_inadimplencia:
            Number(metrics.parcelas_pendentes) > 0
              ? (
                  (Number(metrics.parcelas_vencidas) /
                    Number(metrics.parcelas_pendentes)) *
                  100
                ).toFixed(2)
              : 0,
        },
        parcelas_vencidas: parcelasVencidasResult.rows.map((row) => ({
          ...row,
          parcela_valor: parseFloat(row.parcela_valor),
        })),
        proximos_vencimentos: proximosVencimentosResult.rows.map((row) => ({
          ...row,
          parcela_valor: parseFloat(row.parcela_valor),
        })),
        inadimplentes: inadimplentesResult.rows.map((row) => ({
          ...row,
          valor_total_vencido: parseFloat(row.valor_total_vencido),
        })),
      },
    });
  } catch (error) {
    console.error('Erro ao buscar dashboard de cobrança:', error);
    // Durante build/export, se o banco não estiver disponível, retornar dados vazios
    // para evitar falha na geração de páginas estáticas
    if (
      process.env.NODE_ENV === 'production' &&
      error instanceof Error &&
      error.message.includes('fetch failed')
    ) {
      console.warn(
        'Banco de dados não disponível durante build - retornando dados vazios para dashboard'
      );
      return NextResponse.json({
        success: true,
        dashboard: {
          metrics: {
            total_pagamentos: 0,
            valor_total_contratado: 0,
            valor_recebido: 0,
            valor_a_receber: 0,
            parcelas_vencidas: 0,
            parcelas_pendentes: 0,
            parcelas_pagas: 0,
            taxa_inadimplencia: 0,
          },
          parcelas_vencidas: [],
          proximos_vencimentos: [],
          inadimplentes: [],
        },
      });
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao buscar dashboard de cobrança',
      },
      { status: 500 }
    );
  }
}
