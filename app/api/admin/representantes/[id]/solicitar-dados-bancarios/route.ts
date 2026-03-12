/**
 * POST /api/admin/representantes/[id]/solicitar-dados-bancarios
 * Admin solicita que representante confirme/atualize seus dados bancários.
 * Só pode ser executado para representantes com status 'apto'.
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole('admin', false);

    const repId = parseInt(params.id, 10);
    if (isNaN(repId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const repResult = await query(
      `SELECT id, status, dados_bancarios_status FROM representantes WHERE id = $1 LIMIT 1`,
      [repId]
    );
    if (repResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Representante não encontrado' },
        { status: 404 }
      );
    }

    const rep = repResult.rows[0] as {
      id: number;
      status: string;
      dados_bancarios_status: string;
    };

    if (rep.status !== 'apto') {
      return NextResponse.json(
        {
          error: `Ação disponível apenas para representantes com status "apto". Status atual: ${rep.status}`,
        },
        { status: 422 }
      );
    }

    if (rep.dados_bancarios_status === 'confirmado') {
      return NextResponse.json(
        { error: 'Dados bancários já confirmados pelo representante.' },
        { status: 409 }
      );
    }

    const updated = await query(
      `UPDATE representantes
       SET dados_bancarios_status = 'pendente_confirmacao',
           dados_bancarios_solicitado_em = NOW(),
           atualizado_em = NOW()
       WHERE id = $1
       RETURNING dados_bancarios_status, dados_bancarios_solicitado_em`,
      [repId]
    );

    return NextResponse.json({
      success: true,
      dados_bancarios_status: updated.rows[0].dados_bancarios_status,
      solicitado_em: updated.rows[0].dados_bancarios_solicitado_em,
    });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Não autenticado')
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    if (e.message === 'Sem permissão')
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    console.error(
      '[POST /api/admin/representantes/[id]/solicitar-dados-bancarios]',
      e
    );
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
