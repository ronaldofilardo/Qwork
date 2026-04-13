/**
 * GET /api/comercial/vinculos/sem-rep
 * Lista vínculos (vinculo_comissao) onde representante_id IS NULL.
 * Usado pelo Comercial para identificar clientes sem representante e atribuir um retroativamente.
 */
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireRole(['comercial', 'admin'], false);

    const result = await query(
      `SELECT
         v.id,
         v.entidade_id,
         v.clinica_id,
         v.status,
         v.data_inicio,
         v.data_expiracao,
         v.criado_em,
         v.valor_negociado,
         COALESCE(e.nome, c.nome)        AS cliente_nome,
         COALESCE(e.cnpj, c.cnpj)        AS cliente_cnpj,
         CASE WHEN v.clinica_id IS NOT NULL THEN 'clinica' ELSE 'entidade' END AS tipo_cliente,
         COUNT(DISTINCT cl.id)           AS total_laudos,
         COALESCE(SUM(cl.valor_comissao) FILTER (WHERE cl.status NOT IN ('cancelada')), 0) AS valor_comissao_total
       FROM vinculos_comissao v
       LEFT JOIN entidades   e  ON e.id  = v.entidade_id
       LEFT JOIN clinicas    c  ON c.id  = v.clinica_id
       LEFT JOIN comissoes_laudo cl ON cl.vinculo_id = v.id
       WHERE v.representante_id IS NULL
         AND v.status NOT IN ('encerrado')
       GROUP BY v.id, e.nome, c.nome, e.cnpj, c.cnpj
       ORDER BY v.criado_em DESC`,
      []
    );

    return NextResponse.json({ vinculos: result.rows });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Não autenticado' || e.message === 'Sem permissão')
      return NextResponse.json({ error: e.message }, { status: 403 });
    console.error('[GET /api/comercial/vinculos/sem-rep]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
