/**
 * GET /api/vendedor/meu-representante
 * Retorna os dados de comissionamento do representante vinculado ao vendedor logado.
 * Usado pelo modal "Novo Lead" do vendedor para exibir simulação de comissão.
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

    const result = await query<{
      percentual_comissao: number | null;
      percentual_comissao_comercial: number | null;
      modelo_comissionamento: string | null;
      valor_custo_fixo_entidade: number | null;
      valor_custo_fixo_clinica: number | null;
    }>(
      `SELECT
         r.percentual_comissao,
         r.percentual_comissao_comercial,
         r.modelo_comissionamento,
         r.valor_custo_fixo_entidade,
         r.valor_custo_fixo_clinica
       FROM public.hierarquia_comercial hc
       JOIN public.representantes r ON r.id = hc.representante_id
       WHERE hc.vendedor_id = $1 AND hc.ativo = true
       LIMIT 1`,
      [vendedorId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ representante: null });
    }

    const row = result.rows[0];
    return NextResponse.json({
      representante: {
        percentual_comissao: row.percentual_comissao,
        percentual_comissao_comercial: row.percentual_comissao_comercial,
        modelo_comissionamento: row.modelo_comissionamento,
        valor_custo_fixo_entidade: row.valor_custo_fixo_entidade,
        valor_custo_fixo_clinica: row.valor_custo_fixo_clinica,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro interno';
    if (msg === 'Não autenticado' || msg === 'Perfil não autorizado') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
