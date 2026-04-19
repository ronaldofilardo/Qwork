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
} from '@/lib/financeiro/sociedade';

export const dynamic = 'force-dynamic';

interface PagamentoSociedadeRow {
  id: number;
  asaas_payment_id: string | null;
  valor: string | number | null;
  status: string | null;
  metodo: string | null;
  criado_em: string | null;
  data_pagamento: string | null;
  tomador_nome: string | null;
  representante_nome: string | null;
  valor_representante: string | number | null;
  valor_comercial: string | number | null;
}

interface EventoSociedade {
  id: string;
  data: string;
  tomador: string;
  pagamentoId: string | null;
  status: string;
  metodo: string;
  valorBruto: number;
  valorImpostos: number;
  valorRepresentante: number;
  valorComercial: number;
  valorSocioRonaldo: number;
  valorSocioAntonio: number;
  representanteNome: string | null;
}

interface ResumoPeriodo {
  entradaBruta: number;
  impostos: number;
  representantes: number;
  comercial: number;
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

function aggregateResumo(eventos: EventoSociedade[], from: Date): ResumoPeriodo {
  const filtered = eventos.filter((evento) => new Date(evento.data) >= from);

  return filtered.reduce<ResumoPeriodo>(
    (acc, evento) => {
      acc.entradaBruta += evento.valorBruto;
      acc.impostos += evento.valorImpostos;
      acc.representantes += evento.valorRepresentante;
      acc.comercial += evento.valorComercial;
      acc.ronaldo += evento.valorSocioRonaldo;
      acc.antonio += evento.valorSocioAntonio;
      acc.totalEventos += 1;
      return acc;
    },
    {
      entradaBruta: 0,
      impostos: 0,
      representantes: 0,
      comercial: 0,
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

    if (evento.valorComercial > 0) {
      mensagens.push({
        perfil: 'comercial',
        titulo: 'Comissão comercial simulada',
        mensagem: `Há R$ ${evento.valorComercial.toFixed(2)} simulados para o comercial no pagamento ${evento.pagamentoId ?? evento.id}.`,
      });
    }

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

async function relationExists(relationName: string): Promise<boolean> {
  try {
    const result = await query<{ exists: boolean }>(
      `SELECT to_regclass($1) IS NOT NULL AS exists`,
      [relationName]
    );

    return Boolean(result.rows[0]?.exists);
  } catch {
    return false;
  }
}

async function getPagamentosSociedade(
  dias: number
): Promise<PagamentoSociedadeRow[]> {
  try {
    const [hasPagamentos, hasTomadores, hasRepasses, hasRepresentantes] =
      await Promise.all([
        relationExists('public.pagamentos'),
        relationExists('public.tomadores'),
        relationExists('public.repasses_split'),
        relationExists('public.representantes'),
      ]);

    if (!hasPagamentos) {
      return [];
    }

    if (!hasRepasses || !hasRepresentantes) {
      const result = await query<PagamentoSociedadeRow>(
        `SELECT
           p.id,
           p.asaas_payment_id,
           p.valor,
           p.status,
           p.metodo,
           p.criado_em,
           p.data_pagamento,
           ${hasTomadores ? "COALESCE(t.nome, 'Tomador #' || COALESCE(p.entidade_id, p.clinica_id)::text)" : "'Tomador #' || COALESCE(p.entidade_id, p.clinica_id)::text"} AS tomador_nome,
           NULL AS representante_nome,
           0 AS valor_representante,
           0 AS valor_comercial
         FROM pagamentos p
         ${hasTomadores ? 'LEFT JOIN tomadores t ON t.id = COALESCE(p.entidade_id, p.clinica_id)' : ''}
         WHERE p.status = 'pago'
           AND COALESCE(p.data_pagamento, p.criado_em) >= NOW() - ($1::text || ' days')::interval
         ORDER BY COALESCE(p.data_pagamento, p.criado_em) DESC
         LIMIT 100`,
        [String(dias)]
      );

      return result.rows;
    }

    const result = await query<PagamentoSociedadeRow>(
      `SELECT
         p.id,
         p.asaas_payment_id,
         p.valor,
         p.status,
         p.metodo,
         p.criado_em,
         p.data_pagamento,
         COALESCE(t.nome, 'Tomador #' || COALESCE(p.entidade_id, p.clinica_id)::text) AS tomador_nome,
         r.nome AS representante_nome,
         COALESCE(rs.valor_representante, 0) AS valor_representante,
         COALESCE(rs.valor_comercial, 0) AS valor_comercial
       FROM pagamentos p
       LEFT JOIN tomadores t ON t.id = COALESCE(p.entidade_id, p.clinica_id)
       LEFT JOIN LATERAL (
         SELECT representante_id, valor_representante, COALESCE(valor_comercial, 0) AS valor_comercial
           FROM repasses_split
          WHERE asaas_payment_id = p.asaas_payment_id
          ORDER BY id DESC
          LIMIT 1
       ) rs ON TRUE
       LEFT JOIN representantes r ON r.id = rs.representante_id
       WHERE p.status = 'pago'
         AND COALESCE(p.data_pagamento, p.criado_em) >= NOW() - ($1::text || ' days')::interval
       ORDER BY COALESCE(p.data_pagamento, p.criado_em) DESC
       LIMIT 100`,
      [String(dias)]
    );

    return result.rows;
  } catch (error) {
    console.warn(
      '[Sociedade] Fallback para pagamentos/repasses:',
      error instanceof Error ? error.message : String(error)
    );
    return [];
  }
}

async function getComercialWalletCount(): Promise<number> {
  try {
    const result = await query<{ total: string | number }>(
      `SELECT COUNT(*) AS total
         FROM usuarios
        WHERE tipo_usuario = 'comercial'
          AND ativo = TRUE
          AND asaas_wallet_id IS NOT NULL`
    );

    return toNumber(result.rows[0]?.total);
  } catch (error) {
    console.warn(
      '[Sociedade] Fallback para wallets do comercial:',
      error instanceof Error ? error.message : String(error)
    );
    return 0;
  }
}

async function getRepresentantesWalletStats(): Promise<{
  comWallet: number;
  semWallet: number;
}> {
  try {
    const result = await query<{ com_wallet: string | number; sem_wallet: string | number }>(
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
      '[Sociedade] Fallback para wallets de representantes:',
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
    await requireRole('admin', true);

    const { searchParams } = new URL(request.url);
    const dias = Math.min(Math.max(Number(searchParams.get('dias') ?? 30), 7), 90);

    const [qworkInfo, beneficiariosInfo, pagamentosRows, comercialWalletCount, repWalletStats] =
      await Promise.all([
        getQWorkConfig(),
        getBeneficiarios(),
        getPagamentosSociedade(dias),
        getComercialWalletCount(),
        getRepresentantesWalletStats(),
      ]);

    const eventosRecentes = pagamentosRows.map<EventoSociedadeRowToEvento>((row) => row).map((row) => {
      const valorBruto = toNumber(row.valor);
      const valorRepresentante = toNumber(row.valor_representante);
      const valorComercial = toNumber(row.valor_comercial);
      const baseMargemLivre = valorBruto - toNumber(valorBruto * 0.07) - valorRepresentante;
      const percentualComercial = baseMargemLivre > 0 ? (valorComercial / baseMargemLivre) * 100 : 0;

      const distribuicao = calcularDistribuicaoSociedade({
        valorBruto,
        modeloRepresentante: 'custo_fixo',
        valorRepresentanteFixo: valorRepresentante,
        percentualComercial,
      });

      return {
        id: String(row.id),
        data: row.data_pagamento ?? row.criado_em ?? new Date().toISOString(),
        tomador: row.tomador_nome ?? 'Tomador não identificado',
        pagamentoId: row.asaas_payment_id,
        status: row.status ?? 'pago',
        metodo: row.metodo ?? 'asaas',
        valorBruto,
        valorImpostos: distribuicao.valorImpostos,
        valorRepresentante,
        valorComercial,
        valorSocioRonaldo: distribuicao.valorSocioRonaldo,
        valorSocioAntonio: distribuicao.valorSocioAntonio,
        representanteNome: row.representante_nome ?? null,
      } satisfies EventoSociedade;
    });

    const hoje = startOfToday();
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - 7);
    const inicioMes = new Date(hoje);
    inicioMes.setDate(hoje.getDate() - 30);

    return NextResponse.json({
      success: true,
      modoOperacao: process.env.ASAAS_SPLIT_MODE === 'real' ? 'real' : 'simulacao',
      persistenciaDisponivel:
        beneficiariosInfo.persistenciaDisponivel && qworkInfo.persistenciaDisponivel,
      qwork: qworkInfo.qwork,
      beneficiarios: beneficiariosInfo.beneficiarios,
      configuracao: {
        qworkWalletConfigurada: Boolean(
          qworkInfo.qwork.walletId || process.env.ASAAS_QWORK_WALLET_ID
        ),
        comercialWalletConfigurada: comercialWalletCount > 0,
        representantesComWallet: repWalletStats.comWallet,
        representantesSemWallet: repWalletStats.semWallet,
        socioRonaldoWalletConfigurada: Boolean(
          beneficiariosInfo.beneficiarios.find((item) => item.id === 'ronaldo')?.walletId
        ),
        socioAntonioWalletConfigurada: Boolean(
          beneficiariosInfo.beneficiarios.find((item) => item.id === 'antonio')?.walletId
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

    if (error instanceof Error && error.message === 'MFA_REQUIRED') {
      return NextResponse.json(
        {
          error: 'MFA_REQUIRED',
          message: 'Autenticação de dois fatores requerida para visualizar a Sociedade.',
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao carregar auditoria da Sociedade' },
      { status: 500 }
    );
  }
}

type EventoSociedadeRowToEvento = PagamentoSociedadeRow;

export async function PATCH(request: NextRequest) {
  try {
    await requireRole('admin', true);
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

    if (error instanceof Error && error.message === 'MFA_REQUIRED') {
      return NextResponse.json(
        {
          error: 'MFA_REQUIRED',
          message: 'Autenticação de dois fatores requerida para editar a Sociedade.',
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao salvar beneficiário societário' },
      { status: 500 }
    );
  }
}
