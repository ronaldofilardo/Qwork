import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/entidades/[id]
 * Ativa ou desativa uma entidade pelo ID
 * Body: { ativa: boolean }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole('admin');

    const { ativa } = await request.json();
    const entidadeId = parseInt(params.id);

    if (isNaN(entidadeId)) {
      return NextResponse.json(
        { error: 'ID da entidade inválido' },
        { status: 400 }
      );
    }

    if (typeof ativa !== 'boolean') {
      return NextResponse.json(
        { error: 'Status ativa deve ser boolean' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE entidades 
       SET ativa = $1, atualizado_em = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING id, nome, cnpj, email, telefone, endereco, ativa, criado_em`,
      [ativa, entidadeId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Entidade não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, entidade: result.rows[0] });
  } catch (error) {
    console.error('Erro ao atualizar entidade:', error);

    if (error instanceof Error && error.message === 'Sem permissão') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
