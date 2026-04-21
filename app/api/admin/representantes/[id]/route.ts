/**
 * GET /api/admin/representantes/[id]
 * Retorna perfil completo de um representante com agregados de leads, vínculos e comissões.
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(['comercial', 'suporte'], false);

    const id = parseInt(params.id, 10);
    if (isNaN(id))
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    const result = await query(
      `SELECT
         r.id, r.nome, r.email, r.id::text AS codigo, r.status, r.tipo_pessoa,
         r.telefone, r.cpf, r.cnpj, r.criado_em, r.aprovado_em,
         r.aceite_termos, r.aceite_termos_em,
         r.aceite_disclaimer_nv, r.aceite_disclaimer_nv_em,
         r.banco_codigo, r.agencia, r.conta, r.tipo_conta, r.titular_conta,
         r.pix_chave, r.pix_tipo,
         r.dados_bancarios_status, r.dados_bancarios_solicitado_em, r.dados_bancarios_confirmado_em,
         r.percentual_comissao,
         COUNT(DISTINCT l.id)                                                        AS total_leads,
         COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'convertido')                AS leads_convertidos,
         COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'pendente')                  AS leads_pendentes,
         COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'expirado')                  AS leads_expirados,
         COUNT(DISTINCT l.id) FILTER (
           WHERE l.status = 'pendente'
             AND l.data_expiracao BETWEEN NOW() AND NOW() + INTERVAL '30 days'
         )                                                                           AS leads_a_vencer_30d,
         COUNT(DISTINCT v.id)                                                        AS total_vinculos,
         COUNT(DISTINCT v.id) FILTER (WHERE v.status = 'ativo')                     AS vinculos_ativos,
         COUNT(DISTINCT v.id) FILTER (WHERE v.status = 'suspenso')                  AS vinculos_suspensos,
         COUNT(DISTINCT v.id) FILTER (WHERE v.status = 'inativo')                   AS vinculos_inativos,
         COUNT(DISTINCT v.id) FILTER (
           WHERE v.status = 'ativo'
             AND v.data_expiracao BETWEEN NOW()::DATE AND NOW()::DATE + 30
         )                                                                           AS vinculos_a_vencer_30d,
         COUNT(DISTINCT c.id)                                                        AS total_comissoes,
         COALESCE(SUM(c.valor_comissao) FILTER (WHERE c.status = 'paga'), 0)         AS valor_total_pago,
         COALESCE(SUM(c.valor_comissao) FILTER (WHERE c.status IN ('aprovada','liberada')), 0) AS valor_pendente
       FROM representantes r
       LEFT JOIN leads_representante l ON l.representante_id = r.id
       LEFT JOIN vinculos_comissao   v ON v.representante_id = r.id
       LEFT JOIN comissoes_laudo     c ON c.representante_id = r.id
       WHERE r.id = $1
       GROUP BY r.id`,
      [id]
    );

    if (result.rows.length === 0)
      return NextResponse.json(
        { error: 'Representante não encontrado' },
        { status: 404 }
      );

    return NextResponse.json({ representante: result.rows[0] });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Não autenticado' || e.message === 'Sem permissão')
      return NextResponse.json({ error: e.message }, { status: 403 });
    console.error('[GET /api/admin/representantes/[id]]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
