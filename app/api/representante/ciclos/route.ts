/**
 * GET /api/representante/ciclos
 *
 * Lista os ciclos de comissão do representante autenticado.
 * Retorna ciclos ordenados por mês (mais recente primeiro).
 *
 * Query params:
 *   - page: number (default 1)
 *   - limit: number (default 20, max 50)
 *   - ano: number — filtra pelo ano
 *   - status: StatusCiclo — filtra pelo status
 *
 * Acesso: representante autenticado
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  requireRepresentante,
  repAuthErrorResponse,
} from '@/lib/session-representante';
import { query } from '@/lib/db';
import {
  getCiclosByRepresentante,
  type StatusCiclo,
} from '@/lib/db/comissionamento/ciclos';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const sess = requireRepresentante();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10))
    );
    const anoStr = searchParams.get('ano');
    const statusParam = searchParams.get('status') as StatusCiclo | null;
    const ano = anoStr ? parseInt(anoStr, 10) : undefined;

    // Buscar o representante_id pelo cpf da sessão
    const repResult = await query<{ id: number }>(
      `SELECT id FROM representantes WHERE id = $1 LIMIT 1`,
      [sess.representante_id]
    );
    if (repResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Representante não encontrado.' },
        { status: 404 }
      );
    }

    const result = await getCiclosByRepresentante(sess.representante_id, {
      status: statusParam ?? undefined,
      ano,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const e = err as Error;
    const r = repAuthErrorResponse(e);
    if (r.status !== 500)
      return NextResponse.json(r.body, { status: r.status });
    console.error('[GET /api/representante/ciclos]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
