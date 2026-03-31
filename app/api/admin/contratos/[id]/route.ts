import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/session';
import { assertRoles, ROLES } from '@/lib/authorization/policies';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getSession();
    assertRoles(session, [ROLES.SUPORTE]);

    const tomadorId = params.id;

    if (!tomadorId) {
      return NextResponse.json(
        { error: 'ID do tomador é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar contrato do tomador
    const contratoResult = await query(
      `SELECT c.*
       FROM contratos c
       WHERE c.tomador_id = $1
       ORDER BY c.criado_em DESC
       LIMIT 1`,
      [tomadorId]
    );

    if (contratoResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Contrato não encontrado para este tomador' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      contrato: contratoResult.rows[0],
    });
  } catch (error) {
    console.error('Erro ao buscar contrato:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar contrato' },
      { status: 500 }
    );
  }
}
