/**
 * GET /api/admin/comissoes  — lista todas as comissões (admin)
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requireRole('admin', false);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') ?? undefined;
    const mes = searchParams.get('mes') ?? undefined; // YYYY-MM
    const repId = searchParams.get('rep_id') ?? undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = 30;
    const offset = (page - 1) * limit;

    const wheres: string[] = [];
    const params: unknown[] = [];
    let i = 1;

    const statusValidos = [
      'retida',
      'pendente_nf',
      'nf_em_analise',
      'congelada_rep_suspenso',
      'congelada_aguardando_admin',
      'liberada',
      'paga',
      'cancelada',
    ];
    if (status && statusValidos.includes(status)) {
      wheres.push(`c.status = $${i++}`);
      params.push(status);
    }

    if (mes) {
      wheres.push(`c.mes_emissao = $${i++}::date`);
      params.push(`${mes}-01`);
    }

    if (repId && !isNaN(parseInt(repId))) {
      wheres.push(`c.representante_id = $${i++}`);
      params.push(parseInt(repId));
    }

    const where = wheres.length ? `WHERE ${wheres.join(' AND ')}` : '';

    // Resumo geral para o painel admin
    const resumo = await query(
      `SELECT
         COUNT(*)                                                                          AS total_comissoes,
         COUNT(*) FILTER (WHERE c.status::text = 'pendente_nf')                                 AS pendentes_nf,
         COUNT(*) FILTER (WHERE c.status::text = 'nf_em_analise')                               AS em_analise,
         COUNT(*) FILTER (WHERE c.status::text = 'liberada')                                    AS liberadas,
         COUNT(*) FILTER (WHERE c.status::text = 'paga')                                        AS pagas,
         COUNT(*) FILTER (WHERE c.status::text LIKE 'congelada%')                               AS congeladas,
         COALESCE(SUM(c.valor_comissao) FILTER (WHERE c.status::text IN ('pendente_nf','nf_em_analise','liberada')),0) AS valor_a_pagar,
         COALESCE(SUM(c.valor_comissao) FILTER (WHERE c.status::text = 'paga'),0)                AS valor_pago_total
       FROM comissoes_laudo c`
    );

    const countResult = await query<{ total: string }>(
      `SELECT COUNT(*) as total FROM comissoes_laudo c ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.total ?? '0', 10);

    params.push(limit, offset);
    const rows = await query(
      `SELECT
         c.*,
         r.nome                        AS representante_nome,
         r.codigo                      AS representante_codigo,
         r.email                       AS representante_email,
         r.tipo_pessoa                 AS representante_tipo_pessoa,
         COALESCE(e.nome, cl.nome) AS entidade_nome,
         NULL::text                    AS numero_laudo
       FROM comissoes_laudo c
       JOIN  representantes r  ON r.id  = c.representante_id
       LEFT JOIN entidades e   ON e.id  = c.entidade_id
       LEFT JOIN clinicas  cl  ON cl.id = c.clinica_id
       ${where}
       ORDER BY c.criado_em DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      params
    );

    return NextResponse.json({
      comissoes: rows.rows,
      total,
      page,
      limit,
      resumo: resumo.rows[0],
    });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Não autenticado')
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    if (e.message === 'Sem permissão')
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    console.error('[GET /api/admin/comissoes]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
