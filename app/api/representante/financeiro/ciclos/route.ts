/**
 * GET /api/representante/financeiro/ciclos
 *
 * Retorna os ciclos mensais de comissão do representante logado.
 *
 * Query params:
 *   page  — página (default 1)
 *   limit — itens (default 12)
 *
 * Acesso: representante autenticado
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  requireRepresentante,
  repAuthErrorResponse,
} from '@/lib/session-representante';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const sess = requireRepresentante();
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(
      24,
      Math.max(1, parseInt(searchParams.get('limit') ?? '12', 10))
    );
    const offset = (page - 1) * limit;

    const [dataRes, countRes, resumoRes] = await Promise.all([
      query(
        `SELECT id, mes_ano, valor_total_recebido, status,
                nf_rpa_path, nf_rpa_nome_arquivo, data_envio_nf_rpa,
                data_validacao_suporte, data_bloqueio, criado_em, atualizado_em
         FROM ciclos_comissao_mensal
         WHERE representante_id = $1
         ORDER BY mes_ano DESC
         LIMIT $2 OFFSET $3`,
        [sess.representante_id, limit, offset]
      ),
      query(
        `SELECT COUNT(*) FROM ciclos_comissao_mensal WHERE representante_id = $1`,
        [sess.representante_id]
      ),
      query(
        `SELECT
           SUM(CASE WHEN status IN ('aberto','aguardando_nf_rpa','nf_rpa_enviada') THEN valor_total_recebido ELSE 0 END) AS valor_pendente,
           SUM(CASE WHEN status = 'validado' THEN valor_total_recebido ELSE 0 END)                                      AS valor_validado,
           SUM(valor_total_recebido)                                                                                     AS valor_total
         FROM ciclos_comissao_mensal
         WHERE representante_id = $1`,
        [sess.representante_id]
      ),
    ]);

    return NextResponse.json({
      ciclos: dataRes.rows,
      total: parseInt(countRes.rows[0].count as string, 10),
      page,
      limit,
      resumo: resumoRes.rows[0] ?? {},
    });
  } catch (err: unknown) {
    const e = err as Error;
    const { status, body } = repAuthErrorResponse(e);
    if (status !== 500) return NextResponse.json(body, { status });
    console.error('[GET /api/representante/financeiro/ciclos]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
