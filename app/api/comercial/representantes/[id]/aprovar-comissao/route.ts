/**
 * POST /api/comercial/representantes/[id]/aprovar-comissao
 *
 * O Comercial define o modelo de comissionamento (percentual ou custo_fixo)
 * e o asaas_wallet_id. O representante é ativado imediatamente para 'apto'.
 *
 * Body: { modelo: 'percentual' | 'custo_fixo', percentual?: number, asaas_wallet_id?: string }
 *
 * Validações:
 * - Representante deve estar em 'apto', 'apto_pendente' ou 'aprovacao_comercial'
 * - Se modelo = 'percentual', percentual é obrigatório (0 < x ≤ 40)
 * - Se modelo = 'custo_fixo', percentual não é utilizado
 *
 * Acesso: comercial, admin
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';
import { MAX_PERCENTUAL_COMISSAO } from '@/lib/leads-config';

export const dynamic = 'force-dynamic';

const BodySchema = z
  .object({
    modelo: z.enum(['percentual', 'custo_fixo']),
    percentual: z.number().min(0.01).max(40).optional().nullable(),
    asaas_wallet_id: z.string().max(200).optional().nullable(),
  })
  .refine(
    (d) =>
      d.modelo !== 'percentual' || (d.percentual != null && d.percentual > 0),
    {
      message: 'percentual é obrigatório para modelo percentual',
      path: ['percentual'],
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

    // Verificar que o representante existe e está em status elegível
    const existing = await query(
      `SELECT id, nome, status FROM representantes WHERE id = $1 LIMIT 1`,
      [id]
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

    // Atualizar modelo, percentual, walletId e ativar imediatamente
    // Para modelo percentual: auto-calcula percentual_comissao_comercial = teto - rep
    const percComercialAuto =
      modelo === 'percentual' && percentual != null
        ? MAX_PERCENTUAL_COMISSAO - percentual
        : null;

    await query(
      `UPDATE representantes
       SET modelo_comissionamento        = $1,
           percentual_comissao           = $2,
           percentual_comissao_comercial = COALESCE($3, percentual_comissao_comercial),
           asaas_wallet_id               = COALESCE($4, asaas_wallet_id),
           status                        = 'apto',
           atualizado_em                 = NOW()
       WHERE id = $5`,
      [modelo, modelo === 'percentual' ? percentual : null, percComercialAuto, walletId, id]
    );

    console.info(
      JSON.stringify({
        event: 'comercial_definiu_modelo_comissao',
        representante_id: id,
        modelo,
        percentual: modelo === 'percentual' ? percentual : null,
        percentual_comissao_comercial: percComercialAuto,
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
