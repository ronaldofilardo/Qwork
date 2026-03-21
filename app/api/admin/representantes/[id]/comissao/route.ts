/**
 * PATCH /api/admin/representantes/[id]/comissao
 * Admin define o percentual de comissão individual de um representante.
 *
 * Body: { percentual: number }  (0.01 a 100.00)
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { atualizarPercentualComissaoRep } from '@/lib/db/comissionamento';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole('comercial', false);

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
