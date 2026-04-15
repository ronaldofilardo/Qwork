/**
 * GET /api/suporte/ciclos
 *
 * Lista todos os ciclos de comissão para o painel de suporte.
 * Retorna ciclos enriquecidos com dados do beneficiário, resumo do mês e legadas.
 *
 * Query params:
 *   - page: number (default 1)
 *   - limit: number (default 20, max 100)
 *   - ano: number
 *   - mes: number (1-12)
 *   - status: StatusCiclo
 *   - com_resumo: '1' — inclui resumo do mês e comissões legadas
 *
 * Acesso: suporte, admin
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import {
  getAllCiclosAdmin,
  getResumoCiclosMes,
  getComissoesLegadasMes,
  type StatusCiclo,
} from '@/lib/db/comissionamento/ciclos';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await requireRole(['suporte', 'admin'], false);

    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10))
    );
    const anoStr = searchParams.get('ano');
    const mesStr = searchParams.get('mes');
    const statusParam = searchParams.get('status') as StatusCiclo | null;
    const comResumo = searchParams.get('com_resumo') === '1';

    const ano = anoStr ? parseInt(anoStr, 10) : undefined;
    const mes = mesStr ? parseInt(mesStr, 10) : undefined;

    const { ciclos, total } = await getAllCiclosAdmin({
      status: statusParam ?? undefined,
      ano,
      mes,
      page,
      limit,
    });

    const response: Record<string, unknown> = { ciclos, total, page, limit };

    if (comResumo && ano && mes) {
      const mesReferencia = `${ano}-${String(mes).padStart(2, '0')}-01`;
      const [resumo, legadas] = await Promise.all([
        getResumoCiclosMes(mesReferencia),
        getComissoesLegadasMes(mesReferencia),
      ]);
      response.resumo = resumo;
      response.legadas = legadas;
    }

    return NextResponse.json(response);
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Sem permissão' || e.message === 'Não autenticado') {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    console.error('[GET /api/suporte/ciclos]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
