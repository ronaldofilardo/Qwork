/**
 * GET /api/admin/representantes/busca
 * Busca representantes por nome ou código (mínimo 2 caracteres).
 * Usado pelo modal de vínculo de representante em contexto admin e suporte.
 * Auth: admin | suporte
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

interface RepBusca {
  id: number;
  nome: string;
  codigo: string;
  cpf: string | null;
  modelo_comissionamento: 'percentual' | 'custo_fixo' | null;
  percentual_comissao: string | null;
  percentual_comissao_comercial: string | null;
  valor_custo_fixo_entidade: string | null;
  valor_custo_fixo_clinica: string | null;
  status: string;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await requireRole(['admin', 'suporte'], false);

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') ?? '').trim();

    if (q.length < 2) {
      return NextResponse.json({ representantes: [] });
    }

    const termo = `%${q}%`;

    const rows = await query<RepBusca>(
      `SELECT
         r.id,
         r.nome,
         r.codigo,
         r.cpf,
         r.modelo_comissionamento,
         r.percentual_comissao,
         r.percentual_comissao_comercial,
         r.valor_custo_fixo_entidade,
         r.valor_custo_fixo_clinica,
         r.status
       FROM public.representantes r
       WHERE r.status NOT IN ('desativado', 'rejeitado')
         AND (
           r.nome  ILIKE $1
           OR r.codigo ILIKE $1
         )
       ORDER BY r.nome
       LIMIT 10`,
      [termo]
    );

    return NextResponse.json({ representantes: rows.rows });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Não autenticado' || e.message === 'Sem permissão')
      return NextResponse.json({ error: e.message }, { status: 403 });
    console.error('[GET /api/admin/representantes/busca]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
