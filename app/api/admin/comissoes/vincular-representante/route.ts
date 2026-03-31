/**
 * POST /api/admin/comissoes/vincular-representante
 * Admin vincula um representante (por código) a uma entidade.
 * Usado quando o card de pagamento não tem representante associado.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { vincularRepresentantePorCodigo } from '@/lib/db/comissionamento';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await requireRole('admin', false);
    const body = await request.json();

    const { codigo, entidade_id, clinica_id } = body;

    if (!codigo?.trim() || (!entidade_id && !clinica_id)) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: codigo e (entidade_id ou clinica_id)' },
        { status: 400 }
      );
    }

    const result = await vincularRepresentantePorCodigo(
      codigo,
      entidade_id,
      clinica_id
    );

    if (!result) {
      return NextResponse.json(
        {
          error:
            'Representante não encontrado ou inativo para o código informado.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Não autenticado')
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    if (e.message === 'Sem permissão')
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    console.error('[POST /api/admin/comissoes/vincular-representante]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
