/**
 * PATCH /api/admin/representantes/[id]/comissao
 * Admin define o percentual de comissão individual de um representante.
 *
 * Body: { percentual: number }  (0.01 a 100.00)
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';
import { atualizarPercentualComissaoRep } from '@/lib/db/comissionamento';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole('comercial', false);

    const id = parseInt(params.id, 10);
    if (isNaN(id))
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    const body = await request.json();
    const { percentual } = body;

    if (typeof percentual !== 'number' || isNaN(percentual)) {
      return NextResponse.json(
        { error: 'percentual deve ser um número válido' },
        { status: 400 }
      );
    }

    if (percentual < 0 || percentual > 100) {
      return NextResponse.json(
        { error: 'percentual deve estar entre 0 e 100' },
        { status: 400 }
      );
    }

    // Ownership check: comercial só pode alterar representantes atribuídos a ele
    const owned = await query<{ id: number }>(
      `SELECT 1 AS id FROM representantes WHERE id = $1 AND gestor_comercial_cpf = $2 LIMIT 1`,
      [id, session.cpf]
    );
    if (owned.rows.length === 0) {
      return NextResponse.json(
        { error: 'Representante não encontrado' },
        { status: 404 }
      );
    }

    const result = await atualizarPercentualComissaoRep(id, percentual);

    if (result.erro) {
      return NextResponse.json({ error: result.erro }, { status: 422 });
    }

    return NextResponse.json({
      success: true,
      representante: result.representante,
    });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Não autenticado')
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    if (e.message === 'Sem permissão')
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    console.error('[PATCH /api/admin/representantes/[id]/comissao]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
