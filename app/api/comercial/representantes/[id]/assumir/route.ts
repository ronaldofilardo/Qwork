/**
 * POST /api/comercial/representantes/[id]/assumir
 *
 * Permite que o próprio usuário comercial se auto-atribua como gestor
 * de um representante que ainda não possui gestor (gestor_comercial_cpf IS NULL).
 *
 * Regras:
 *   - Representante deve existir, estar ativo e sem gestor atribuído
 *   - O comercial só pode assumir representantes sem gestor (não pode "roubar" de outro)
 *   - Admin pode chamar este endpoint para atribuir a si mesmo também
 *
 * Acesso: comercial, admin
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const session = await requireRole(['comercial', 'admin'], false);

    const representanteId = parseInt(params.id, 10);
    if (isNaN(representanteId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    // Verificar que o representante existe, está ativo e sem gestor
    const repCheck = await query<{
      id: number;
      nome: string;
      gestor_comercial_cpf: string | null;
    }>(
      `SELECT id, nome, gestor_comercial_cpf
       FROM representantes
       WHERE id = $1 AND ativo = true
       LIMIT 1`,
      [representanteId]
    );

    if (repCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Representante não encontrado ou inativo' },
        { status: 404 }
      );
    }

    if (repCheck.rows[0].gestor_comercial_cpf !== null) {
      return NextResponse.json(
        { error: 'Este representante já possui um gestor comercial atribuído' },
        { status: 409 }
      );
    }

    await query(
      `UPDATE representantes
       SET gestor_comercial_cpf = $1, atualizado_em = NOW()
       WHERE id = $2`,
      [session.cpf, representanteId]
    );

    console.info(
      JSON.stringify({
        event: 'representante_assumido_pelo_comercial',
        representante_id: representanteId,
        representante_nome: repCheck.rows[0].nome,
        gestor_comercial_cpf: session.cpf,
        by_cpf: session.cpf,
      })
    );

    return NextResponse.json({
      success: true,
      representante_id: representanteId,
      gestor_comercial_cpf: session.cpf,
    });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Não autenticado' || e.message === 'Sem permissão')
      return NextResponse.json({ error: e.message }, { status: 403 });
    console.error('[POST /api/comercial/representantes/[id]/assumir]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
