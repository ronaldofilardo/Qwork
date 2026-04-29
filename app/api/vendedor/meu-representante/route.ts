/**
 * GET /api/vendedor/meu-representante
 *
 * Retorna dados de comissionamento do representante linkado ao vendedor autenticado
 * via tabela hierarquia_comercial.
 *
 * Response:
 *  - representante: { percentual_comissao, modelo_comissionamento, valor_custo_fixo_entidade, valor_custo_fixo_clinica }
 *  - representante: null se vendedor não tiver vínculo ativo
 */
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    const session = await requireRole('vendedor', false);

    const userResult = await query<{ id: number }>(
      `SELECT id FROM public.usuarios WHERE cpf = $1 AND ativo = true LIMIT 1`,
      [session.cpf]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const vendedorId = userResult.rows[0].id;

    const repResult = await query<{
      percentual_comissao: number | null;
      modelo_comissionamento: string | null;
      valor_custo_fixo_entidade: number | null;
      valor_custo_fixo_clinica: number | null;
    }>(
      `SELECT
         r.percentual_comissao,
         r.modelo_comissionamento,
         r.valor_custo_fixo_entidade,
         r.valor_custo_fixo_clinica
       FROM public.hierarquia_comercial hc
       JOIN public.representantes r ON r.id = hc.representante_id
       WHERE hc.vendedor_id = $1 AND hc.ativo = true
       LIMIT 1`,
      [vendedorId]
    );

    if (repResult.rows.length === 0) {
      return NextResponse.json({ representante: null }, { status: 200 });
    }

    return NextResponse.json(
      { representante: repResult.rows[0] },
      { status: 200 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro interno';
    if (msg === 'Não autenticado' || msg === 'Perfil não autorizado') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
