/**
 * GET /api/admin/representantes  — lista todos os representantes (admin)
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await requireRole('admin', false);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') ?? undefined;
    const busca = searchParams.get('busca') ?? undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = 30;
    const offset = (page - 1) * limit;

    const wheres: string[] = [];
    const params: unknown[] = [];
    let i = 1;

    const statusValidos = [
      'ativo',
      'apto_pendente',
      'apto',
      'apto_bloqueado',
      'suspenso',
      'desativado',
      'rejeitado',
    ];
    if (status && statusValidos.includes(status)) {
      wheres.push(`r.status = $${i++}`);
      params.push(status);
    }

    if (busca?.trim()) {
      wheres.push(
        `(r.nome ILIKE $${i} OR r.email ILIKE $${i} OR r.codigo ILIKE $${i})`
      );
      params.push(`%${busca.trim()}%`);
      i++;
    }

    const where = wheres.length ? `WHERE ${wheres.join(' AND ')}` : '';

    const countResult = await query<{ total: string }>(
      `SELECT COUNT(*) as total FROM representantes r ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.total ?? '0', 10);

    params.push(limit, offset);
    const rows = await query(
      `SELECT
         r.id, r.nome, r.email, r.codigo, r.status, r.tipo_pessoa,
         r.telefone, r.cpf, r.cnpj, r.criado_em, r.aprovado_em,
         r.aceite_termos, r.aceite_disclaimer_nv,
         r.banco_codigo, r.agencia, r.conta, r.tipo_conta, r.titular_conta, r.pix_chave, r.pix_tipo,
         r.dados_bancarios_status, r.dados_bancarios_solicitado_em, r.dados_bancarios_confirmado_em,
         r.bloqueio_conflito_pf_id, r.percentual_comissao,
         COUNT(DISTINCT l.id)                                              AS total_leads,
         COUNT(DISTINCT l.id) FILTER (WHERE l.status  = 'convertido')     AS leads_convertidos,
         COUNT(DISTINCT v.id)                                              AS total_vinculos,
         COUNT(DISTINCT v.id) FILTER (WHERE v.status  = 'ativo')          AS vinculos_ativos,
         COUNT(DISTINCT c.id)                                              AS total_comissoes,
         COALESCE(SUM(c.valor_comissao) FILTER (WHERE c.status = 'paga'), 0) AS valor_total_pago
       FROM representantes r
       LEFT JOIN leads_representante l  ON l.representante_id = r.id
       LEFT JOIN vinculos_comissao   v  ON v.representante_id = r.id
       LEFT JOIN comissoes_laudo     c  ON c.representante_id = r.id
       ${where}
       GROUP BY r.id
       ORDER BY r.criado_em DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      params
    );

    void session;
    return NextResponse.json({ representantes: rows.rows, total, page, limit });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Não autenticado')
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    if (e.message === 'Sem permissão')
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    console.error('[GET /api/admin/representantes]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
