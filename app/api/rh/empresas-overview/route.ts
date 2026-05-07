import { NextResponse, NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { requireClinica } from '@/lib/session';

export const dynamic = 'force-dynamic';

// ─── Tipos Exportados ────────────────────────────────────────────────────────

export type LoteStatusTipo =
  | 'rascunho'
  | 'ativo'
  | 'concluido'
  | 'emissao_solicitada'
  | 'emissao_em_andamento'
  | 'laudo_emitido'
  | 'cancelado'
  | 'finalizado';

export type StatusPagamentoTipo =
  | 'aguardando_cobranca'
  | 'aguardando_pagamento'
  | 'pago'
  | 'expirado'
  | null;

export interface LoteAtualInfo {
  id: number;
  numero_ordem: number;
  status: LoteStatusTipo;
  status_pagamento: StatusPagamentoTipo;
  percentual_conclusao: number;
  total_avaliacoes: number;
  avaliacoes_concluidas: number;
  liberado_em: string | null;
  liberado_por: string | null;
  /** True se existe laudo com status 'emitido' ou 'enviado' para este lote (independente de lotes_avaliacao.status) */
  tem_laudo_emitido: boolean;
}

export interface LoteAnteriorInfo {
  id: number;
  numero_ordem: number;
  status: LoteStatusTipo;
  status_pagamento: StatusPagamentoTipo;
  solicitacao_emissao_em: string | null;
  link_pagamento_enviado_em: string | null;
  pago_em: string | null;
  dias_desde_solicitacao: number | null;
}

export interface ElegibilidadeInfo {
  elegivel: boolean;
  count_elegiveis: number;
  motivo_bloqueio: string | null;
}

export interface LaudosStatusInfo {
  aguardando_emissao: number;
  aguardando_pagamento: number;
  pago: number;
  laudo_emitido: number;
}

export interface EmpresaOverview {
  id: number;
  nome: string;
  cnpj: string;
  responsavel_nome: string;
  responsavel_email: string;
  lote_atual: LoteAtualInfo | null;
  lote_anterior: LoteAnteriorInfo | null;
  elegibilidade: ElegibilidadeInfo;
  laudos_status: LaudosStatusInfo;
}

export interface ResumoKPI {
  total_empresas: number;
  lotes_em_andamento: number;
  percentual_medio_conclusao: number;
  total_laudos_pendentes: number;
  // Stats estendidos para SummaryStatsCards
  total_funcionarios: number;
  total_funcionarios_inativos: number;
  total_lotes: number;
  total_lotes_pendentes: number;
  total_laudos_emitidos: number;
  total_laudos_aguardando_emissao: number;
  total_laudos_aguardando_pagamento: number;
}

export interface EmpresasOverviewResponse {
  empresas: EmpresaOverview[];
  resumo_kpi: ResumoKPI;
}

// ─── Tipos internos das linhas SQL ───────────────────────────────────────────
interface EmpresaRow {
  empresa_id: number;
  empresa_nome: string;
  cnpj: string;
  responsavel_nome: string | null;
  responsavel_email: string | null;
  // Lote atual
  lote_atual_id: number | null;
  lote_atual_numero_ordem: number | null;
  lote_atual_status: string | null;
  lote_total_avaliacoes: number | null;
  lote_avaliacoes_concluidas: number | null;
  lote_liberado_em: string | null;
  lote_liberado_por: string | null;
  // Lote anterior
  lote_ant_id: number | null;
  lote_ant_numero_ordem: number | null;
  lote_ant_status: string | null;
  lote_ant_status_pagamento: string | null;
  lote_ant_solicitacao_emissao_em: string | null;
  lote_ant_link_pagamento_enviado_em: string | null;
  lote_ant_pago_em: string | null;
  lote_ant_dias_solicitacao: number | null;
  // Laudos do lote atual
  laudos_aguardando_emissao: number | null;
  laudos_aguardando_pagamento: number | null;
  laudos_pago: number | null;
  laudos_laudo_emitido: number | null;
  // Flag do lote atual
  lote_atual_tem_laudo_emitido: boolean | null;
  lote_atual_status_pagamento: string | null;
  // Elegibilidade: determinada em memória com base nos lotes
  // (count de funcionários elegíveis via subquery já calculada)
  count_elegiveis: number | null;
}

function computarElegibilidade(row: EmpresaRow): ElegibilidadeInfo {
  // Regra: somente elegível se não existe lote ativo (ou somente finalizado/laudo_emitido no lote anterior)
  const statusAtual = row.lote_atual_status;

  // Elegível: sem lote, ou ciclo terminal que permite novo ciclo
  if (
    !statusAtual ||
    statusAtual === 'finalizado' ||
    statusAtual === 'laudo_emitido' ||
    statusAtual === 'cancelado' ||
    statusAtual === 'concluido'
  ) {
    return {
      elegivel: true,
      count_elegiveis: row.count_elegiveis ?? 0,
      motivo_bloqueio: null,
    };
  }

  // Bloqueado nos demais estados
  const labelStatus: Record<string, string> = {
    rascunho: 'Lote atual em rascunho',
    ativo: 'Lote atual ainda em andamento',
    emissao_solicitada: 'Emissão de laudo solicitada para o lote atual',
    emissao_em_andamento: 'Emissão de laudo em andamento',
  };

  return {
    elegivel: false,
    count_elegiveis: row.count_elegiveis ?? 0,
    motivo_bloqueio:
      labelStatus[statusAtual] ?? `Lote atual status: ${statusAtual}`,
  };
}

/**
 * GET /api/rh/empresas-overview
 * Retorna lista de empresas com dados de lotes, laudos e elegibilidade.
 * Usado pela tabela do dashboard /rh.
 *
 * Query Params:
 *   busca?: string   – Filtra por nome ou CNPJ (case-insensitive)
 *   ordenar?: 'prioridade' | 'nome'  – Padrão: prioridade
 */
export async function GET(request: NextRequest) {
  let session;
  try {
    session = await requireClinica();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Clínica não identificada';
    return NextResponse.json({ error: msg }, { status: 403 });
  }

  const clinicaId = session.clinica_id!;
  const params = request.nextUrl.searchParams;
  const busca = (params.get('busca') ?? '').trim();

  try {
    const buscaParam = busca ? `%${busca.toLowerCase()}%` : null;
    const queryParams: (string | number)[] = [clinicaId];
    if (buscaParam) queryParams.push(buscaParam);

    const buscaFilter = buscaParam
      ? `AND (LOWER(ec.nome) LIKE $2 OR LOWER(ec.cnpj) LIKE $2)`
      : '';

    const result = await query<EmpresaRow>(
      `
      SELECT
        ec.id                             AS empresa_id,
        ec.nome                           AS empresa_nome,
        ec.cnpj,
        COALESCE(
          (
            SELECT f.nome
            FROM funcionarios f
            JOIN funcionarios_clinicas fc ON fc.funcionario_id = f.id
            WHERE fc.empresa_id = ec.id
              AND fc.clinica_id = $1
              AND fc.ativo = TRUE
              AND f.perfil = 'rh'
            LIMIT 1
          ),
          ''
        )                                 AS responsavel_nome,
        COALESCE(
          (
            SELECT f.email
            FROM funcionarios f
            JOIN funcionarios_clinicas fc ON fc.funcionario_id = f.id
            WHERE fc.empresa_id = ec.id
              AND fc.clinica_id = $1
              AND fc.ativo = TRUE
              AND f.perfil = 'rh'
            LIMIT 1
          ),
          ''
        )                                 AS responsavel_email,

        -- Lote atual (maior numero_ordem)
        la_atual.id                       AS lote_atual_id,
        la_atual.numero_ordem             AS lote_atual_numero_ordem,
        la_atual.status                   AS lote_atual_status,
        COALESCE(cnt_av.total, 0)         AS lote_total_avaliacoes,
        COALESCE(cnt_av.concluidas, 0)    AS lote_avaliacoes_concluidas,
        la_atual.liberado_em::text        AS lote_liberado_em,
        la_atual.liberado_por             AS lote_liberado_por,
        la_atual.tem_laudo_emitido        AS lote_atual_tem_laudo_emitido,
        la_atual.status_pagamento::text   AS lote_atual_status_pagamento,

        -- Lote anterior (numero_ordem - 1)
        la_ant.id                         AS lote_ant_id,
        la_ant.numero_ordem               AS lote_ant_numero_ordem,
        la_ant.status                     AS lote_ant_status,
        la_ant.status_pagamento::text     AS lote_ant_status_pagamento,
        la_ant.solicitacao_emissao_em::text AS lote_ant_solicitacao_emissao_em,
        la_ant.link_pagamento_enviado_em::text AS lote_ant_link_pagamento_enviado_em,
        la_ant.pago_em::text              AS lote_ant_pago_em,
        EXTRACT(EPOCH FROM (NOW() - la_ant.solicitacao_emissao_em)) / 86400 AS lote_ant_dias_solicitacao,

        -- Laudos do lote atual agrupados por status
        COALESCE(laud.aguardando_emissao, 0) AS laudos_aguardando_emissao,
        COALESCE(laud.aguardando_pagamento, 0) AS laudos_aguardando_pagamento,
        COALESCE(laud.pago, 0)               AS laudos_pago,
        COALESCE(laud.laudo_emitido, 0)      AS laudos_laudo_emitido,

        -- Funcionários elegíveis para próximo ciclo
        COALESCE(
          (
            SELECT COUNT(*)
            FROM funcionarios_clinicas fc2
            JOIN funcionarios f2 ON fc2.funcionario_id = f2.id
            WHERE fc2.empresa_id = ec.id
              AND fc2.clinica_id = $1
              AND fc2.ativo = TRUE
              AND f2.ativo = TRUE
              AND f2.perfil = 'funcionario'
              AND (
                f2.indice_avaliacao = 0
                OR f2.indice_avaliacao < COALESCE(la_atual.numero_ordem, 0) - 1
                OR f2.data_ultimo_lote < NOW() - INTERVAL '1 year'
              )
          ),
          0
        )                                 AS count_elegiveis

      FROM empresas_clientes ec

      -- Lote atual: mais recente por numero_ordem
      LEFT JOIN LATERAL (
        SELECT la.id, la.numero_ordem, la.status, la.status_pagamento,
               la.solicitacao_emissao_em, la.link_pagamento_enviado_em, la.pago_em,
               la.liberado_em, la.liberado_por,
               EXISTS (
                 SELECT 1 FROM laudos ld
                 WHERE ld.lote_id = la.id
                   AND ld.status IN ('emitido', 'enviado')
               ) AS tem_laudo_emitido
        FROM lotes_avaliacao la
        WHERE la.empresa_id = ec.id
        ORDER BY la.numero_ordem DESC
        LIMIT 1
      ) la_atual ON true

      -- Lote anterior: segundo mais recente
      LEFT JOIN LATERAL (
        SELECT id, numero_ordem, status, status_pagamento,
               solicitacao_emissao_em, link_pagamento_enviado_em, pago_em,
               liberado_em
        FROM lotes_avaliacao
        WHERE empresa_id = ec.id
        ORDER BY numero_ordem DESC
        LIMIT 1 OFFSET 1
      ) la_ant ON true

      -- Contagem de avaliações do lote atual
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*)                                     AS total,
          COUNT(*) FILTER (WHERE a.status = 'concluido') AS concluidas
        FROM avaliacoes a
        WHERE a.lote_id = la_atual.id
          AND a.status != 'inativada'
      ) cnt_av ON la_atual.id IS NOT NULL

      -- Laudos agrupados por status real (lotes_avaliacao + tabela laudos)
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*) FILTER (
            WHERE la_l.solicitacao_emissao_em IS NOT NULL
              AND COALESCE(la_l.status_pagamento::text, 'aguardando_cobranca') = 'aguardando_cobranca'
              AND la_l.status NOT IN ('laudo_emitido', 'finalizado')
              AND NOT EXISTS (
                SELECT 1 FROM laudos ld
                WHERE ld.lote_id = la_l.id AND ld.status IN ('emitido', 'enviado')
              )
          )                                             AS aguardando_emissao,
          COUNT(*) FILTER (
            WHERE la_l.status_pagamento = 'aguardando_pagamento'
              AND NOT EXISTS (
                SELECT 1 FROM laudos ld
                WHERE ld.lote_id = la_l.id AND ld.status IN ('emitido', 'enviado')
              )
          )                                             AS aguardando_pagamento,
          COUNT(*) FILTER (
            WHERE la_l.status_pagamento = 'pago'
              AND la_l.status NOT IN ('laudo_emitido', 'finalizado')
              AND NOT EXISTS (
                SELECT 1 FROM laudos ld
                WHERE ld.lote_id = la_l.id AND ld.status IN ('emitido', 'enviado')
              )
          )                                             AS pago,
          COUNT(*) FILTER (
            WHERE la_l.status IN ('laudo_emitido', 'finalizado')
              OR EXISTS (
                SELECT 1 FROM laudos ld
                WHERE ld.lote_id = la_l.id AND ld.status IN ('emitido', 'enviado')
              )
          )                                             AS laudo_emitido
        FROM lotes_avaliacao la_l
        WHERE la_l.empresa_id = ec.id
          AND la_l.status NOT IN ('cancelado', 'rascunho')
      ) laud ON true

      WHERE ec.ativa = true
        AND (
          ec.clinica_id = $1
          OR EXISTS (
            SELECT 1 FROM funcionarios_clinicas fc3
            WHERE fc3.empresa_id = ec.id AND fc3.clinica_id = $1
          )
        )
        ${buscaFilter}

      ORDER BY
        -- Prioridade: críticos primeiro, depois por status de urgência
        CASE
          WHEN la_atual.status IN ('emissao_solicitada', 'emissao_em_andamento')
            THEN 1
          WHEN la_ant.status_pagamento = 'aguardando_pagamento'
            THEN 2
          WHEN la_atual.status = 'concluido'
            THEN 3
          WHEN la_atual.status = 'ativo'
            THEN 4
          ELSE 5
        END,
        ec.nome
      `,
      queryParams as string[],
      session
    );

    const empresas: EmpresaOverview[] = result.rows.map((row) => {
      const loteAtual: LoteAtualInfo | null = row.lote_atual_id
        ? {
            id: row.lote_atual_id,
            numero_ordem: row.lote_atual_numero_ordem!,
            status: row.lote_atual_status as LoteStatusTipo,
            total_avaliacoes: Number(row.lote_total_avaliacoes ?? 0),
            avaliacoes_concluidas: Number(row.lote_avaliacoes_concluidas ?? 0),
            percentual_conclusao:
              Number(row.lote_total_avaliacoes ?? 0) > 0
                ? Math.round(
                    (Number(row.lote_avaliacoes_concluidas ?? 0) /
                      Number(row.lote_total_avaliacoes)) *
                      100
                  )
                : 0,
            liberado_em: row.lote_liberado_em,
            liberado_por: row.lote_liberado_por,
            tem_laudo_emitido: row.lote_atual_tem_laudo_emitido ?? false,
            status_pagamento:
              (row.lote_atual_status_pagamento as StatusPagamentoTipo) ?? null,
          }
        : null;

      const loteAnterior: LoteAnteriorInfo | null = row.lote_ant_id
        ? {
            id: row.lote_ant_id,
            numero_ordem: row.lote_ant_numero_ordem!,
            status: row.lote_ant_status as LoteStatusTipo,
            status_pagamento:
              row.lote_ant_status_pagamento as StatusPagamentoTipo,
            solicitacao_emissao_em: row.lote_ant_solicitacao_emissao_em,
            link_pagamento_enviado_em: row.lote_ant_link_pagamento_enviado_em,
            pago_em: row.lote_ant_pago_em,
            dias_desde_solicitacao: row.lote_ant_dias_solicitacao
              ? Math.round(Number(row.lote_ant_dias_solicitacao))
              : null,
          }
        : null;

      const elegibilidade = computarElegibilidade(row);

      return {
        id: row.empresa_id,
        nome: row.empresa_nome,
        cnpj: row.cnpj,
        responsavel_nome: row.responsavel_nome ?? '',
        responsavel_email: row.responsavel_email ?? '',
        lote_atual: loteAtual,
        lote_anterior: loteAnterior,
        elegibilidade,
        laudos_status: {
          aguardando_emissao: Number(row.laudos_aguardando_emissao ?? 0),
          aguardando_pagamento: Number(row.laudos_aguardando_pagamento ?? 0),
          pago: Number(row.laudos_pago ?? 0),
          laudo_emitido: Number(row.laudos_laudo_emitido ?? 0),
        },
      };
    });

    // KPIs
    const total_empresas = empresas.length;
    const lotes_em_andamento = empresas.filter(
      (e) =>
        e.lote_atual &&
        !e.lote_atual.tem_laudo_emitido &&
        [
          'ativo',
          'emissao_solicitada',
          'emissao_em_andamento',
          'concluido',
        ].includes(e.lote_atual.status)
    ).length;
    const pcts = empresas
      .filter((e) => e.lote_atual && e.lote_atual.total_avaliacoes > 0)
      .map((e) => e.lote_atual!.percentual_conclusao);
    const percentual_medio_conclusao =
      pcts.length > 0
        ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length)
        : 0;
    const total_laudos_pendentes = empresas.reduce(
      (acc, e) => acc + e.laudos_status.aguardando_pagamento,
      0
    );

    // Stats estendidos — derivados do array de empresas
    const total_lotes_pendentes = empresas.filter(
      (e) =>
        e.lote_atual &&
        ['emissao_solicitada', 'emissao_em_andamento'].includes(
          e.lote_atual.status
        )
    ).length;
    const total_laudos_aguardando_emissao = empresas.reduce(
      (acc, e) => acc + e.laudos_status.aguardando_emissao,
      0
    );
    const total_laudos_aguardando_pagamento = empresas.reduce(
      (acc, e) => acc + e.laudos_status.aguardando_pagamento,
      0
    );

    // Stats que precisam de query separada
    interface StatsRow {
      total_funcionarios: string;
      total_funcionarios_inativos: string;
      total_lotes: string;
      total_laudos_emitidos: string;
    }
    const statsResult = await query<StatsRow>(
      `
      SELECT
        (
          SELECT COUNT(DISTINCT f.id)
          FROM funcionarios f
          JOIN funcionarios_clinicas fc ON fc.funcionario_id = f.id
          JOIN empresas_clientes ec2 ON ec2.id = fc.empresa_id
          WHERE fc.clinica_id = $1
            AND fc.ativo = TRUE
            AND f.ativo = TRUE
            AND f.perfil = 'funcionario'
            AND ec2.ativa = TRUE
        ) AS total_funcionarios,
        (
          SELECT COUNT(DISTINCT f.id)
          FROM funcionarios f
          JOIN funcionarios_clinicas fc ON fc.funcionario_id = f.id
          WHERE fc.clinica_id = $1
            AND (fc.ativo = FALSE OR f.ativo = FALSE)
            AND f.perfil = 'funcionario'
        ) AS total_funcionarios_inativos,
        (
          SELECT COUNT(la.id)
          FROM lotes_avaliacao la
          JOIN empresas_clientes ec2 ON ec2.id = la.empresa_id
          WHERE (
            ec2.clinica_id = $1
            OR EXISTS (
              SELECT 1 FROM funcionarios_clinicas fc3
              WHERE fc3.empresa_id = ec2.id AND fc3.clinica_id = $1
            )
          )
          AND ec2.ativa = TRUE
          AND la.status NOT IN ('cancelado', 'rascunho')
        ) AS total_lotes,
        (
          SELECT COUNT(la.id)
          FROM lotes_avaliacao la
          JOIN empresas_clientes ec2 ON ec2.id = la.empresa_id
          WHERE (
            ec2.clinica_id = $1
            OR EXISTS (
              SELECT 1 FROM funcionarios_clinicas fc3
              WHERE fc3.empresa_id = ec2.id AND fc3.clinica_id = $1
            )
          )
          AND ec2.ativa = TRUE
          AND (
            la.status IN ('laudo_emitido', 'finalizado')
            OR EXISTS (
              SELECT 1 FROM laudos ld
              WHERE ld.lote_id = la.id AND ld.status IN ('emitido', 'enviado')
            )
          )
        ) AS total_laudos_emitidos
      `,
      [clinicaId],
      session
    );
    const stats = statsResult.rows[0];

    const response: EmpresasOverviewResponse = {
      empresas,
      resumo_kpi: {
        total_empresas,
        lotes_em_andamento,
        percentual_medio_conclusao,
        total_laudos_pendentes,
        total_funcionarios: Number(stats?.total_funcionarios ?? 0),
        total_funcionarios_inativos: Number(
          stats?.total_funcionarios_inativos ?? 0
        ),
        total_lotes: Number(stats?.total_lotes ?? 0),
        total_lotes_pendentes,
        total_laudos_emitidos: Number(stats?.total_laudos_emitidos ?? 0),
        total_laudos_aguardando_emissao,
        total_laudos_aguardando_pagamento,
      },
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error('[rh/empresas-overview] erro:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
