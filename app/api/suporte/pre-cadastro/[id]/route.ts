/**
 * DELETE /api/suporte/pre-cadastro/[id]
 *
 * Remove permanentemente um pré-cadastro que ainda NÃO aceitou o contrato.
 *
 * Sequência de remoção:
 *   usuarios → senhas (entidades_senhas / clinicas_senhas) → contratos → tabela principal
 *
 * Guard de segurança: bloqueia deleção se existir contrato aceito (aceito = true).
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
    const tabelaSenhas =
      tipo === 'entidade' ? 'entidades_senhas' : 'clinicas_senhas';
    const idColunaSenhas = tipo === 'entidade' ? 'entidade_id' : 'clinica_id';

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

    // Deleção em cascata (ordem FK)
    if (tipo === 'entidade') {
      await query(`DELETE FROM usuarios WHERE entidade_id = $1`, [id]);
    } else {
      await query(`DELETE FROM usuarios WHERE clinica_id = $1`, [id]);
    }

    await query(
      `DELETE FROM ${tabelaSenhas} WHERE ${idColunaSenhas} = $1`,
      [id]
    );

    await query(
      `DELETE FROM contratos WHERE tomador_id = $1 AND tipo_tomador = $2`,
      [id, tipo]
    );

    await query(`DELETE FROM ${tabela} WHERE id = $1`, [id]);

    return new NextResponse(null, { status: 204 });
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
