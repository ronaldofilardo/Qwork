/**
 * GET /api/vendedor/meu-representante
 *
 * Retorna dados de comissionamento do representante linkado ao vendedor autenticado
 * via tabela hierarquia_comercial.
 *
 * Response:
 *  - representante: { percentual_comissao, percentual_comissao_comercial, modelo_comissionamento, valor_custo_fixo_entidade, valor_custo_fixo_clinica }
 *  - representante: null se não encontrado
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await requireRole('vendedor', false);

    // 1. Buscar usuario pelo CPF da sessao
    const userResult = await query<{ id: number }>(
      `SELECT id FROM public.usuarios WHERE cpf = $1 AND ativo = true LIMIT 1`,
      [session.cpf]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { representante: null },
        { status: 200 }
      );
    }

    const vendedorId = userResult.rows[0].id;

    // 2. Buscar representante vinculado via hierarquia_comercial
    const repResult = await query<{
      percentual_comissao: number | null;
      percentual_comissao_comercial: number | null;
      modelo_comissionamento: string | null;
      valor_custo_fixo_entidade: number | null;
      valor_custo_fixo_clinica: number | null;
    }>(
      `
      SELECT
        r.percentual_comissao,
        r.percentual_comissao_comercial,
        r.modelo_comissionamento,
        r.valor_custo_fixo_entidade,
        r.valor_custo_fixo_clinica
      FROM public.hierarquia_comercial hc
      JOIN public.representantes r ON r.id = hc.representante_id
      WHERE hc.vendedor_id = $1 AND hc.ativo = true
      LIMIT 1
      `,
      [vendedorId]
    );

    if (repResult.rows.length === 0) {
      return NextResponse.json(
        { representante: null },
        { status: 200 }
      );
    }

    const representante = repResult.rows[0];

    return NextResponse.json(
      { representante },
      { status: 200 }
    );
  } catch (err) {
    console.error('[GET /api/vendedor/meu-representante]', err);
    return NextResponse.json(
      { error: 'Erro ao buscar representante' },
      { status: 500 }
    );
  }
}
