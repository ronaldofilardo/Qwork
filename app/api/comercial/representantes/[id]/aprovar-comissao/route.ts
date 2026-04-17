/**
 * POST /api/comercial/representantes/[id]/aprovar-comissao
 *
 * O Comercial define o modelo de comissionamento (percentual ou custo_fixo)
 * e o asaas_wallet_id. O representante é ativado imediatamente para 'apto'.
 *
 * Body (percentual): { modelo, percentual, percentual_comissao_comercial?, asaas_wallet_id? }
 * Body (custo_fixo): { modelo, valor_custo_fixo_entidade, valor_custo_fixo_clinica,
 *                      percentual_comissao_comercial?, asaas_wallet_id? }
 *
 * Validações:
 * - Representante deve estar em 'apto', 'apto_pendente' ou 'aprovacao_comercial'
 * - Se modelo = 'percentual': percentual obrigatório (0 < x ≤ 40); soma rep+comercial ≤ 40
 * - Se modelo = 'custo_fixo': valor_custo_fixo_entidade e valor_custo_fixo_clinica > 0;
 *                             percentual_comissao_comercial 0–40% (sobre o custo fixo)
 *
 * Acesso: comercial, admin
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

const BodySchema = z
  .object({
    modelo: z.enum(['percentual', 'custo_fixo']),
    /** Apenas modelo percentual */
    percentual: z.number().min(0.01).max(40).optional().nullable(),
    /** Modelo percentual: % do comercial sobre valor negociado; custo_fixo: % sobre custo fixo */
    percentual_comissao_comercial: z
      .number()
      .min(0)
      .max(40)
      .optional()
      .nullable(),
    /** Apenas modelo custo_fixo */
    valor_custo_fixo_entidade: z.number().positive().optional().nullable(),
    /** Apenas modelo custo_fixo */
    valor_custo_fixo_clinica: z.number().positive().optional().nullable(),
    asaas_wallet_id: z.string().max(200).optional().nullable(),
  })
  // percentual obrigatório para modelo percentual
  .refine(
    (d) =>
      d.modelo !== 'percentual' || (d.percentual != null && d.percentual > 0),
    {
      message: 'percentual é obrigatório para modelo percentual',
      path: ['percentual'],
    }
  )
  // soma rep + comercial ≤ 40 apenas para modelo percentual
  .refine(
    (d) => {
      if (d.modelo !== 'percentual') return true;
      const percRep = d.percentual ?? 0;
      const percCom = d.percentual_comissao_comercial ?? 0;
      return percRep + percCom <= 40;
    },
    {
      message: 'Soma dos percentuais (rep + comercial) não pode exceder 40%',
      path: ['percentual_comissao_comercial'],
    }
  )
  // custo fixo entidade obrigatório para modelo custo_fixo
  .refine(
    (d) =>
      d.modelo !== 'custo_fixo' ||
      (d.valor_custo_fixo_entidade != null && d.valor_custo_fixo_entidade > 0),
    {
      message: 'valor_custo_fixo_entidade é obrigatório para modelo custo_fixo',
      path: ['valor_custo_fixo_entidade'],
    }
  )
  // custo fixo clínica obrigatório para modelo custo_fixo
  .refine(
    (d) =>
      d.modelo !== 'custo_fixo' ||
      (d.valor_custo_fixo_clinica != null && d.valor_custo_fixo_clinica > 0),
    {
      message: 'valor_custo_fixo_clinica é obrigatório para modelo custo_fixo',
      path: ['valor_custo_fixo_clinica'],
    }
  );

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const session = await requireRole(['comercial', 'admin'], false);

    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const { modelo, percentual } = parsed.data;
    const percentualComercial = parsed.data.percentual_comissao_comercial ?? 0;
    const valorCFEntidade = parsed.data.valor_custo_fixo_entidade ?? null;
    const valorCFClinica = parsed.data.valor_custo_fixo_clinica ?? null;

    // Verificar que o representante existe, está em status elegível, e pertence ao comercial
    const existing = await query(
      `SELECT id, nome, status FROM representantes
       WHERE id = $1 AND ($2::varchar IS NULL OR gestor_comercial_cpf = $2)
       LIMIT 1`,
      [id, session.perfil === 'comercial' ? session.cpf : null]
    );
    if (existing.rows.length === 0) {
      return NextResponse.json(
        { error: 'Representante não encontrado' },
        { status: 404 }
      );
    }

    const rep = existing.rows[0] as {
      id: number;
      nome: string;
      status: string;
    };
    if (
      !['apto', 'apto_pendente', 'aprovacao_comercial'].includes(rep.status)
    ) {
      return NextResponse.json(
        {
          error: `Representante está com status '${rep.status}'. Apenas representantes ativos ou aguardando aprovação podem ter modelo de comissão definido.`,
          code: 'STATUS_INVALIDO',
        },
        { status: 409 }
      );
    }

    const walletId = parsed.data.asaas_wallet_id?.trim() || null;

    // percentual_comissao_comercial: salvo para ambos os modelos
    // - percentual: % sobre valor_negociado
    // - custo_fixo: % sobre o custo_fixo (comercial recebe percCom% do custo fixo)
    const percComercialFinal = percentualComercial;

    await query(
      `UPDATE representantes
       SET modelo_comissionamento        = $1,
           percentual_comissao           = $2,
           percentual_comissao_comercial = $3,
           valor_custo_fixo_entidade     = COALESCE($4, valor_custo_fixo_entidade),
           valor_custo_fixo_clinica      = COALESCE($5, valor_custo_fixo_clinica),
           asaas_wallet_id               = COALESCE($6, asaas_wallet_id),
           status                        = 'apto',
           atualizado_em                 = NOW()
       WHERE id = $7`,
      [
        modelo,
        modelo === 'percentual' ? percentual : null,
        percComercialFinal,
        modelo === 'custo_fixo' ? valorCFEntidade : null,
        modelo === 'custo_fixo' ? valorCFClinica : null,
        walletId,
        id,
      ]
    );

    // Propagar percentual_comissao_comercial para vinculos_comissao existentes deste rep
    await query(
      `UPDATE vinculos_comissao
       SET percentual_comissao_comercial = $1
       WHERE representante_id = $2`,
      [percComercialFinal, id]
    );

    console.info(
      JSON.stringify({
        event: 'comercial_definiu_modelo_comissao',
        representante_id: id,
        modelo,
        percentual: modelo === 'percentual' ? percentual : null,
        percentual_comissao_comercial: percComercialFinal,
        valor_custo_fixo_entidade:
          modelo === 'custo_fixo' ? valorCFEntidade : null,
        valor_custo_fixo_clinica:
          modelo === 'custo_fixo' ? valorCFClinica : null,
        asaas_wallet_id: walletId ? '***' : null,
        by_cpf: session.cpf,
      })
    );

    return NextResponse.json({
      ok: true,
      message:
        'Modelo de comissão definido. Representante ativado com sucesso.',
    });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Sem permissão' || e.message === 'Não autenticado') {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    console.error(
      '[POST /api/comercial/representantes/[id]/aprovar-comissao]',
      e
    );
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
