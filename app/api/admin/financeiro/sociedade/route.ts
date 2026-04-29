import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';
import {
  calcularDistribuicaoSociedade,
  getBeneficiariosSociedadePadrao,
  getConfiguracaoQWorkPadrao,
  type BeneficiarioSociedade,
  type ConfiguracaoQWorkSociedade,
  type ConfiguracaoGateway,
} from '@/lib/financeiro/sociedade';
import {
  normalizarDetalhesParcelas,
  type Parcela,
} from '@/lib/parcelas-helper';

export const dynamic = 'force-dynamic';

interface PagamentoSociedadeRow {
  id: number;
  asaas_payment_id: string | null;
  valor: string | number | null;
  asaas_net_value: string | number | null;
  numero_parcelas: number | null;
  detalhes_parcelas: Parcela[] | string | null;
  status: string | null;
  metodo: string | null;
  criado_em: string | null;
  data_pagamento: string | null;
  tomador_nome: string | null;
  representante_nome: string | null;
  representante_id: number | null;
  valor_representante: string | number | null;
  tipo_cobranca: string | null;
}

interface EventoSociedade {
  id: string;
  loteId: number;
  representanteId: number | null;
  data: string;
  tomador: string;
  pagamentoId: string | null;
  status: string;
  metodo: string;
  numeroParcelas: number | null;
  tipoCobranca: string;
  valorBruto: number;
  valorImpostos: number;
  valorGateway: number;
  valorCustoOperacional: number;
  valorRepresentante: number;
  valorSocioRonaldo: number;
  valorSocioAntonio: number;
  representanteNome: string | null;
}

interface ResumoPeriodo {
  entradaBruta: number;
  impostos: number;
  gateway: number;
  custoOperacional: number;
  representantes: number;
  ronaldo: number;
  antonio: number;
  totalEventos: number;
}

const BeneficiarioPatchSchema = z.object({
  beneficiarioId: z.enum(['qwork', 'ronaldo', 'antonio']),
  nome: z.string().min(2).max(150),
  nomeEmpresarial: z.string().min(2).max(200),
  documentoFiscal: z.string().max(30).optional().default(''),
  walletId: z.string().max(100).optional().nullable(),
  percentualParticipacao: z.number().min(0).max(100).optional().default(0),
  ativo: z.boolean(),
  observacoes: z.string().max(500).optional().nullable(),
});

function toNumber(value: string | number | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : 0;
}

function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

/** Código da configuração do gateway pelo método de pagamento. */
function codigoGatewayMetodo(
  metodo: string | null | undefined,
  parcelas: number
): string | null {
  const m = String(metodo ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (m.includes('pix')) return 'pix';
  if (m.includes('boleto')) return 'boleto';
  if (m.includes('credit') || m.includes('cartao')) {
    const p = Math.max(1, parcelas);
    if (p <= 1) return 'credit_card_1x';
    if (p <= 6) return 'credit_card_2_6x';
    return 'credit_card_7_12x';
  }
  return null;
}

/**
 * Custo operacional = taxa do método (boleto/pix/cartão).
 * Esta é a taxa cobrada pelo gateway pelo processamento do meio de pagamento.
 */
function calcularCustoMetodo(
  metodo: string | null | undefined,
  parcelas: number,
  valorBruto: number,
  configs: ConfiguracaoGateway[]
): number {
  const codigo = codigoGatewayMetodo(metodo, parcelas);
  if (!codigo) return 0;
  const c = configs.find((cfg) => cfg.codigo === codigo && cfg.ativo);
  if (!c) return 0;
  return c.tipo === 'taxa_fixa'
    ? c.valor
    : toNumber(valorBruto * (c.valor / 100));
}

/**
 * Taxa de transação = valor fixo por transação cobrado pelo gateway (taxa_transacao).
 * Pago pelo QWork independentemente do método.
 */
function calcularTaxaTransacao(configs: ConfiguracaoGateway[]): number {
  const c = configs.find((cfg) => cfg.codigo === 'taxa_transacao' && cfg.ativo);
  if (!c) return 0;
  return c.tipo === 'taxa_fixa' ? c.valor : 0;
}

function getParcelasAuditadas(row: PagamentoSociedadeRow): Array<{
  numero: number;
  total: number;
  valor: number;
  data: string;
}> {
  const valorTotal = toNumber(row.valor);
  const totalParcelas = Math.max(1, Number(row.numero_parcelas ?? 1));
  const dataFallback =
    row.data_pagamento ?? row.criado_em ?? new Date().toISOString();

  if (!row.detalhes_parcelas || totalParcelas <= 1) {
    return [
      {
        numero: 1,
        total: 1,
        valor: valorTotal,
        data: dataFallback,
      },
    ];
  }

  try {
    const detalhes =
      typeof row.detalhes_parcelas === 'string'
        ? (JSON.parse(row.detalhes_parcelas) as Parcela[])
        : row.detalhes_parcelas;

    const normalizadas = normalizarDetalhesParcelas(
      Array.isArray(detalhes) ? detalhes : [],
      row.status ?? '',
      row.data_pagamento ?? null
    );

    const pagas = normalizadas.filter(
      (parcela) => parcela.pago || parcela.status === 'pago'
    );

    if (pagas.length === 0) {
      return [];
    }

    return pagas.map((parcela) => ({
      numero: parcela.numero,
      total: normalizadas.length || totalParcelas,
      valor: toNumber(parcela.valor),
      data: parcela.data_pagamento ?? dataFallback,
    }));
  } catch {
    return [
      {
        numero: 1,
        total: totalParcelas,
        valor: valorTotal,
        data: dataFallback,
      },
    ];
  }
}

function aggregateResumo(
  eventos: EventoSociedade[],
  from: Date
): ResumoPeriodo {
  const filtered = eventos.filter((evento) => new Date(evento.data) >= from);

  return filtered.reduce<ResumoPeriodo>(
    (acc, evento) => {
      acc.entradaBruta += evento.valorBruto;
      acc.impostos += evento.valorImpostos;
      acc.gateway += evento.valorGateway;
      acc.custoOperacional += evento.valorCustoOperacional;
      acc.representantes += evento.valorRepresentante;
      acc.ronaldo += evento.valorSocioRonaldo;
      acc.antonio += evento.valorSocioAntonio;
      acc.totalEventos += 1;
      return acc;
    },
    {
      entradaBruta: 0,
      impostos: 0,
      gateway: 0,
      custoOperacional: 0,
      representantes: 0,
      ronaldo: 0,
      antonio: 0,
      totalEventos: 0,
    }
  );
}

function buildMensagensSimuladas(eventos: EventoSociedade[]) {
  return eventos.slice(0, 6).flatMap((evento) => {
    const mensagens = [
      {
        perfil: 'admin',
        titulo: 'Pagamento auditado na Sociedade',
        mensagem: `Pagamento de R$ ${evento.valorBruto.toFixed(2)} de ${evento.tomador} auditado com sucesso.`,
      },
    ];

    if (evento.valorRepresentante > 0) {
      mensagens.push({
        perfil: 'representante',
        titulo: 'Comissão de representante simulada',
        mensagem: `O representante ${evento.representanteNome ?? 'vinculado'} possui R$ ${evento.valorRepresentante.toFixed(2)} simulados neste pagamento.`,
      });
    }

    return mensagens;
  });
}

async function getPagamentosSociedade(
  dias: number
): Promise<PagamentoSociedadeRow[]> {
  try {
    // Fonte autoritativa: comissoes_laudo via lotes_avaliacao.
    // repasses_split foi removida na migration 1212 — não é mais usada.
    // JOIN com pagamentos usa dados_adicionais->>'lote_id' (gravado pelo /api/pagamento/asaas/criar)
    // como chave primária, com fallback por entidade/clinica + janela de 24h para pagamentos antigos.
    // Quando não há comissoes_laudo (lote sem representante), usa pagamentos.valor como valor_laudo.
    const result = await query<PagamentoSociedadeRow>(
      `SELECT
         la.id,
         COALESCE(p.asaas_payment_id, NULL::varchar) AS asaas_payment_id,
         COALESCE(cl_agg.valor_laudo, p.valor, 0)::numeric(10,2) AS valor,
         COALESCE(p.asaas_net_value, (p.dados_adicionais->>'netValue')::numeric, 0)::numeric(10,2) AS asaas_net_value,
         la.pagamento_parcelas AS numero_parcelas,
         NULL::jsonb AS detalhes_parcelas,
         'pago' AS status,
         la.pagamento_metodo AS metodo,
         la.criado_em::text,
         la.pago_em::text AS data_pagamento,
         COALESCE(t.nome, 'Tomador #' || COALESCE(la.entidade_id, la.clinica_id)::text) AS tomador_nome,
         r.nome AS representante_nome,
         cl_agg.first_rep_id AS representante_id,
         COALESCE(cl_agg.valor_representante, 0) AS valor_representante,
         'laudo'::text AS tipo_cobranca
       FROM lotes_avaliacao la
       LEFT JOIN tomadores t ON t.id = COALESCE(la.entidade_id, la.clinica_id)
       LEFT JOIN pagamentos p ON p.status = 'pago'
         AND (
           -- Primário: vínculo direto via lote_id gravado pelo /api/pagamento/asaas/criar
           (p.dados_adicionais->>'lote_id')::int = la.id
           OR (
             -- Fallback: fuzzy por entidade/clinica + janela 24h (pagamentos antigos sem lote_id)
             (p.dados_adicionais->>'lote_id') IS NULL
             AND COALESCE(p.entidade_id, p.clinica_id) = COALESCE(la.entidade_id, la.clinica_id)
             AND ABS(EXTRACT(EPOCH FROM (p.data_pagamento - la.pago_em))) < 86400
           )
         )
       LEFT JOIN LATERAL (
         SELECT
           MIN(c.representante_id) AS first_rep_id,
           COALESCE(SUM(c.valor_comissao), 0) AS valor_representante,
           MAX(c.valor_laudo) AS valor_laudo
         FROM comissoes_laudo c
         WHERE c.lote_pagamento_id = la.id
       ) cl_agg ON TRUE
       LEFT JOIN representantes r ON r.id = cl_agg.first_rep_id
       WHERE la.status_pagamento = 'pago'
         AND la.pago_em >= NOW() - ($1::text || ' days')::interval
       ORDER BY la.pago_em DESC
       LIMIT 100`,
      [String(dias)]
    );

    return result.rows;
  } catch (error) {
    console.warn(
      '[Sociedade] getPagamentosSociedade error:',
      error instanceof Error ? error.message : String(error)
    );
    return [];
  }
}

async function getPagamentosManutencao(
  dias: number
): Promise<PagamentoSociedadeRow[]> {
  try {
    const result = await query<PagamentoSociedadeRow>(
      `SELECT
         p.id,
         p.asaas_payment_id,
         p.valor::numeric(10,2) AS valor,
         COALESCE(p.asaas_net_value, 0)::numeric(10,2) AS asaas_net_value,
         COALESCE(p.numero_parcelas, 1) AS numero_parcelas,
         NULL::jsonb AS detalhes_parcelas,
         'pago' AS status,
         COALESCE(p.metodo, 'boleto') AS metodo,
         p.criado_em::text,
         p.data_pagamento::text,
         COALESCE(
           (SELECT t.nome FROM tomadores t WHERE t.id = p.entidade_id LIMIT 1),
           (SELECT t.nome FROM tomadores t WHERE t.id = p.clinica_id LIMIT 1),
           'Tomador não identificado'
         ) AS tomador_nome,
         NULL::text AS representante_nome,
         NULL::int AS representante_id,
         0 AS valor_representante,
         'manutencao'::text AS tipo_cobranca
       FROM pagamentos p
       WHERE p.tipo_cobranca = 'manutencao'
         AND p.status = 'pago'
         AND p.data_pagamento >= NOW() - ($1::text || ' days')::interval
       ORDER BY p.data_pagamento DESC
       LIMIT 50`,
      [String(dias)]
    );
    return result.rows;
  } catch (error) {
    console.warn(
      '[Sociedade] getPagamentosManutencao error:',
      error instanceof Error ? error.message : String(error)
    );
    return [];
  }
}

async function getConfiguracoes(): Promise<ConfiguracaoGateway[]> {
  try {
    const result = await query<{
      codigo: string;
      descricao: string | null;
      tipo: 'taxa_fixa' | 'percentual';
      valor: string | number;
      ativo: boolean;
    }>(
      `SELECT codigo, descricao, tipo, valor, ativo
       FROM configuracoes_gateway
       WHERE ativo = TRUE
       ORDER BY codigo ASC`
    );

    return result.rows.map((row) => ({
      codigo: row.codigo,
      descricao: row.descricao,
      tipo: row.tipo,
      valor: Number(row.valor),
      ativo: row.ativo,
    }));
  } catch (error) {
    console.warn(
      '[Sociedade] getConfiguracoes error:',
      error instanceof Error ? error.message : String(error)
    );
    return [];
  }
}

async function getRepresentantesWalletStats(): Promise<{
  comWallet: number;
  semWallet: number;
}> {
  try {
    const result = await query<{
      com_wallet: string | number;
      sem_wallet: string | number;
    }>(
      `SELECT
         COUNT(*) FILTER (WHERE asaas_wallet_id IS NOT NULL) AS com_wallet,
         COUNT(*) FILTER (WHERE asaas_wallet_id IS NULL) AS sem_wallet
       FROM representantes`
    );

    return {
      comWallet: toNumber(result.rows[0]?.com_wallet),
      semWallet: toNumber(result.rows[0]?.sem_wallet),
    };
  } catch (error) {
    console.warn(
      '[Sociedade] getRepresentantesWalletStats error:',
      error instanceof Error ? error.message : String(error)
    );
    return {
      comWallet: 0,
      semWallet: 0,
    };
  }
}

async function getQWorkConfig(): Promise<{
  qwork: ConfiguracaoQWorkSociedade;
  persistenciaDisponivel: boolean;
}> {
  const fallback = getConfiguracaoQWorkPadrao();

  try {
    const result = await query<{
      codigo: string;
      nome: string;
      nome_empresarial: string | null;
      documento_fiscal: string | null;
      asaas_wallet_id: string | null;
      percentual_participacao: string | number | null;
      ativo: boolean;
      observacoes: string | null;
    }>(
      `SELECT codigo, nome, nome_empresarial, documento_fiscal, asaas_wallet_id,
              percentual_participacao, ativo, observacoes
         FROM beneficiarios_sociedade
        WHERE codigo = 'qwork'
        LIMIT 1`
    );

    if (result.rows.length === 0) {
      return { qwork: fallback, persistenciaDisponivel: true };
    }

    const row = result.rows[0];
    return {
      persistenciaDisponivel: true,
      qwork: {
        id: 'qwork',
        nome: 'QWork',
        nomeEmpresarial: row.nome_empresarial ?? fallback.nomeEmpresarial,
        documentoFiscal: row.documento_fiscal ?? '',
        walletId: row.asaas_wallet_id ?? null,
        percentualParticipacao: 0,
        ativo: row.ativo,
        observacoes: row.observacoes ?? fallback.observacoes,
      },
    };
  } catch (error) {
    console.warn(
      '[Sociedade] Fallback para configuração do QWork:',
      error instanceof Error ? error.message : String(error)
    );
    return { qwork: fallback, persistenciaDisponivel: false };
  }
}

async function getBeneficiarios(): Promise<{
  beneficiarios: BeneficiarioSociedade[];
  persistenciaDisponivel: boolean;
}> {
  const fallback = getBeneficiariosSociedadePadrao();

  try {
    const result = await query<{
      codigo: string;
      nome: string;
      nome_empresarial: string | null;
      documento_fiscal: string | null;
      asaas_wallet_id: string | null;
      percentual_participacao: string | number;
      ativo: boolean;
      observacoes: string | null;
    }>(
      `SELECT codigo, nome, nome_empresarial, documento_fiscal, asaas_wallet_id,
              percentual_participacao, ativo, observacoes
         FROM beneficiarios_sociedade
        WHERE codigo IN ('ronaldo', 'antonio')
        ORDER BY codigo ASC`
    );

    if (result.rows.length === 0) {
      return { beneficiarios: fallback, persistenciaDisponivel: true };
    }

    const byId = new Map(fallback.map((item) => [item.id, item]));

    for (const row of result.rows) {
      byId.set(row.codigo, {
        id: row.codigo,
        nome: row.nome,
        nomeEmpresarial: row.nome_empresarial ?? '',
        documentoFiscal: row.documento_fiscal ?? '',
        walletId: row.asaas_wallet_id ?? null,
        percentualParticipacao: toNumber(row.percentual_participacao),
        ativo: row.ativo,
        observacoes: row.observacoes,
      });
    }

    return {
      persistenciaDisponivel: true,
      beneficiarios: Array.from(byId.values()),
    };
  } catch (error) {
    console.warn(
      '[Sociedade] Fallback para beneficiários padrão:',
      error instanceof Error ? error.message : String(error)
    );
    return { beneficiarios: fallback, persistenciaDisponivel: false };
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireRole('admin', false);

    const { searchParams } = new URL(request.url);
    const dias = Math.min(
      Math.max(Number(searchParams.get('dias') ?? 30), 7),
      90
    );

    const [
      qworkInfo,
      beneficiariosInfo,
      pagamentosRows,
      pagamentosManutencao,
      repWalletStats,
      configuracoes,
    ] = await Promise.all([
      getQWorkConfig(),
      getBeneficiarios(),
      getPagamentosSociedade(dias),
      getPagamentosManutencao(dias),
      getRepresentantesWalletStats(),
      getConfiguracoes(),
    ]);

    const todasLinhas = [...pagamentosRows, ...pagamentosManutencao];

    const eventosRecentes = todasLinhas
      .flatMap((row) => {
        const valorBrutoTotal = toNumber(row.valor);
        const valorRepresentanteTotal = toNumber(row.valor_representante);
        const valorLiquidoGatewayTotal = toNumber(row.asaas_net_value);
        const valorGatewayTotal =
          valorLiquidoGatewayTotal > 0 &&
          valorLiquidoGatewayTotal <= valorBrutoTotal
            ? toNumber(valorBrutoTotal - valorLiquidoGatewayTotal)
            : 0;

        const percentualImpostos =
          configuracoes.find((c) => c.codigo === 'impostos')?.valor ?? 7;

        const parcelas = getParcelasAuditadas(row);
        const eventosBase = parcelas.length
          ? parcelas
          : [
              {
                numero: 1,
                total: Math.max(1, Number(row.numero_parcelas ?? 1)),
                valor: valorBrutoTotal,
                data:
                  row.data_pagamento ??
                  row.criado_em ??
                  new Date().toISOString(),
              },
            ];

        return eventosBase.map((parcela) => {
          const proporcao =
            valorBrutoTotal > 0
              ? Math.min(1, Math.max(0, parcela.valor / valorBrutoTotal))
              : 1;

          const valorBruto = toNumber(parcela.valor);
          const valorRepresentante = toNumber(
            valorRepresentanteTotal * proporcao
          );

          // Custo operacional = taxa do método (boleto/pix/cartão) — proporcional ao valor da parcela
          // Taxa de transação = taxa fixa por transação do gateway — rateada proporcionalmente
          const custoMetodoTotal =
            configuracoes.length > 0
              ? calcularCustoMetodo(
                  row.metodo,
                  Number(row.numero_parcelas ?? 1),
                  valorBrutoTotal,
                  configuracoes
                )
              : 0;
          const taxaTransacaoTotal =
            configuracoes.length > 0 ? calcularTaxaTransacao(configuracoes) : 0;

          const valorCustoOperacional =
            custoMetodoTotal > 0 ? toNumber(custoMetodoTotal * proporcao) : 0;
          const valorTaxaTransacao =
            taxaTransacaoTotal > 0
              ? toNumber(taxaTransacaoTotal * proporcao)
              : 0;

          // Gateway total para a parcela: custo do método + taxa de transação
          // Se configs disponíveis, usa os valores calculados; senão usa asaas_net_value
          const totalGatewayParcela =
            configuracoes.length > 0
              ? toNumber(valorCustoOperacional + valorTaxaTransacao)
              : valorGatewayTotal > 0
                ? toNumber(valorGatewayTotal * proporcao)
                : 0;

          const valorLiquidoGateway =
            totalGatewayParcela > 0
              ? toNumber(valorBruto - totalGatewayParcela)
              : undefined;

          const distribuicao = calcularDistribuicaoSociedade({
            valorBruto,
            valorLiquidoGateway,
            metodoPagamento: row.metodo,
            modeloRepresentante: 'custo_fixo',
            valorRepresentanteFixo: valorRepresentante,
            percentualImpostos,
          });

          return {
            id: `${row.id}-${parcela.numero}`,
            loteId: row.id,
            representanteId: row.representante_id ?? null,
            data: parcela.data,
            tomador:
              eventosBase.length > 1
                ? `${row.tomador_nome ?? 'Tomador não identificado'} · Parcela ${parcela.numero}/${parcela.total}`
                : (row.tomador_nome ?? 'Tomador não identificado'),
            pagamentoId: row.asaas_payment_id,
            status: row.status ?? 'pago',
            metodo: row.metodo ?? 'asaas',
            numeroParcelas: row.numero_parcelas ?? null,
            tipoCobranca: row.tipo_cobranca ?? 'laudo',
            valorBruto,
            valorImpostos: distribuicao.valorImpostos,
            valorGateway: valorTaxaTransacao,
            valorCustoOperacional,
            valorRepresentante,
            valorSocioRonaldo: distribuicao.valorSocioRonaldo,
            valorSocioAntonio: distribuicao.valorSocioAntonio,
            representanteNome: row.representante_nome ?? null,
          } satisfies EventoSociedade;
        });
      })
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      .slice(0, 100);

    const hoje = startOfToday();
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - 7);
    const inicioMes = new Date(hoje);
    inicioMes.setDate(hoje.getDate() - 30);

    return NextResponse.json({
      success: true,
      modoOperacao:
        process.env.ASAAS_SPLIT_MODE === 'real' ? 'real' : 'simulacao',
      persistenciaDisponivel:
        beneficiariosInfo.persistenciaDisponivel &&
        qworkInfo.persistenciaDisponivel,
      qwork: qworkInfo.qwork,
      beneficiarios: beneficiariosInfo.beneficiarios,
      configuracao: {
        qworkWalletConfigurada: Boolean(
          qworkInfo.qwork.walletId || process.env.ASAAS_QWORK_WALLET_ID
        ),
        representantesComWallet: repWalletStats.comWallet,
        representantesSemWallet: repWalletStats.semWallet,
        socioRonaldoWalletConfigurada: Boolean(
          beneficiariosInfo.beneficiarios.find((item) => item.id === 'ronaldo')
            ?.walletId
        ),
        socioAntonioWalletConfigurada: Boolean(
          beneficiariosInfo.beneficiarios.find((item) => item.id === 'antonio')
            ?.walletId
        ),
      },
      resumo: {
        dia: aggregateResumo(eventosRecentes, hoje),
        semana: aggregateResumo(eventosRecentes, inicioSemana),
        mes: aggregateResumo(eventosRecentes, inicioMes),
      },
      eventosRecentes,
      mensagensSimuladas: buildMensagensSimuladas(eventosRecentes),
    });
  } catch (error) {
    console.error('[GET /api/admin/financeiro/sociedade]', error);
    return NextResponse.json(
      { error: 'Erro ao carregar auditoria da Sociedade' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireRole('admin', false);
    const body = await request.json();
    const parsed = BeneficiarioPatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    try {
      await query(
        `INSERT INTO beneficiarios_sociedade (
           codigo, nome, nome_empresarial, documento_fiscal,
           asaas_wallet_id, percentual_participacao, ativo, observacoes
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (codigo) DO UPDATE SET
           nome = EXCLUDED.nome,
           nome_empresarial = EXCLUDED.nome_empresarial,
           documento_fiscal = EXCLUDED.documento_fiscal,
           asaas_wallet_id = EXCLUDED.asaas_wallet_id,
           percentual_participacao = EXCLUDED.percentual_participacao,
           ativo = EXCLUDED.ativo,
           observacoes = EXCLUDED.observacoes,
           atualizado_em = NOW()`,
        [
          data.beneficiarioId,
          data.nome,
          data.nomeEmpresarial,
          data.documentoFiscal || null,
          data.walletId?.trim() || null,
          data.percentualParticipacao,
          data.ativo,
          data.observacoes || null,
        ]
      );

      return NextResponse.json({
        success: true,
        persisted: true,
        beneficiario: data,
        message:
          data.beneficiarioId === 'qwork'
            ? 'Configuração institucional do QWork atualizada com sucesso.'
            : 'Beneficiário societário atualizado com sucesso.',
      });
    } catch (dbError) {
      console.warn(
        '[PATCH /api/admin/financeiro/sociedade] Persistência ainda indisponível:',
        dbError instanceof Error ? dbError.message : String(dbError)
      );
      return NextResponse.json({
        success: true,
        persisted: false,
        beneficiario: data,
        message:
          'Modo simulação ativo: a interface foi atualizada, mas a persistência definitiva depende da migration da Sociedade.',
      });
    }
  } catch (error) {
    console.error('[PATCH /api/admin/financeiro/sociedade]', error);
    return NextResponse.json(
      { error: 'Erro ao salvar beneficiário societário' },
      { status: 500 }
    );
  }
}
