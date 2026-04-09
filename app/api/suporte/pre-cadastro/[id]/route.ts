/**
 * DELETE /api/suporte/pre-cadastro/[id]
 *
 * Soft-delete de um pré-cadastro que ainda NÃO aceitou o contrato.
 *
 * Operação: UPDATE [entidades|clinicas] SET ativa = false WHERE id = ?
 *
 * Guard de segurança: bloqueia se existir contrato aceito (aceito = true).
 *
 * Exclusivo perfil suporte.
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/session';
import { assertRoles, ROLES, isApiError } from '@/lib/authorization/policies';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  tipo: z.enum(['entidade', 'clinica']),
});

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const session = getSession();
    assertRoles(session, [ROLES.SUPORTE]);

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const parseResult = QuerySchema.safeParse({
      tipo: searchParams.get('tipo'),
    });
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Parâmetro tipo inválido (entidade ou clinica)' },
        { status: 400 }
      );
    }

    const { tipo } = parseResult.data;
    const tabela = tipo === 'entidade' ? 'entidades' : 'clinicas';

    // Safety: verificar existência e que não há contrato aceito
    const checkResult = await query(
      `SELECT t.id, c.aceito
       FROM ${tabela} t
       LEFT JOIN contratos c ON c.tomador_id = t.id AND c.tipo_tomador = $2
       WHERE t.id = $1`,
      [id, tipo]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Pré-cadastro não encontrado' },
        { status: 404 }
      );
    }

    const temContratoAceito = checkResult.rows.some((r) => r.aceito === true);
    if (temContratoAceito) {
      return NextResponse.json(
        { error: 'Não é possível remover um tomador com contrato aceito' },
        { status: 409 }
      );
    }

    // Soft-delete: marca o tomador como inativo (preserva histórico)
    await query(`UPDATE ${tabela} SET ativa = false WHERE id = $1`, [id]);

    return NextResponse.json(
      { success: true, message: 'Pré-cadastro removido com sucesso' },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (isApiError(error)) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }
    console.error('[SUPORTE PRE-CADASTRO DELETE] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno ao remover pré-cadastro' },
      { status: 500 }
    );
  }
}
