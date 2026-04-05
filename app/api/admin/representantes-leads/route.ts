/**
 * GET /api/admin/representantes-leads
 *
 * Lista cadastros leads de representantes (da landing page) para revisão.
 * Apenas admin.
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';
import { verificarCpfEmUso } from '@/lib/cpf-conflict';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await requireRole(['comercial', 'suporte'], false);
    void session;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') ?? undefined;
    const tipoPessoa = searchParams.get('tipo_pessoa') ?? undefined;
    const busca = searchParams.get('busca') ?? undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = 30;
    const offset = (page - 1) * limit;

    const wheres: string[] = [];
    const params: unknown[] = [];
    let i = 1;

    const statusValidos = [
      'pendente_verificacao',
      'verificado',
      'rejeitado',
      'convertido',
    ];
    if (status && statusValidos.includes(status)) {
      wheres.push(`l.status = $${i++}`);
      params.push(status);
    }

    if (tipoPessoa === 'pf' || tipoPessoa === 'pj') {
      wheres.push(`l.tipo_pessoa = $${i++}`);
      params.push(tipoPessoa);
    }

    if (busca?.trim()) {
      wheres.push(
        `(l.nome ILIKE $${i} OR l.email ILIKE $${i} OR l.cpf ILIKE $${i} OR l.cnpj ILIKE $${i})`
      );
      params.push(`%${busca.trim()}%`);
      i++;
    }

    const where = wheres.length ? `WHERE ${wheres.join(' AND ')}` : '';

    const countResult = await query<{ total: string }>(
      `SELECT COUNT(*) as total FROM representantes_cadastro_leads l ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.total ?? '0', 10);

    params.push(limit, offset);
    const rows = await query(
      `SELECT
         l.id, l.tipo_pessoa, l.nome, l.email, l.telefone,
         l.cpf, l.cnpj, l.razao_social, l.cpf_responsavel,
         l.doc_cpf_filename, l.doc_cpf_key, l.doc_cpf_url,
         l.doc_cnpj_filename, l.doc_cnpj_key, l.doc_cnpj_url,
         l.doc_cpf_resp_filename, l.doc_cpf_resp_key, l.doc_cpf_resp_url,
         l.status, l.motivo_rejeicao,
         l.ip_origem, l.criado_em, l.verificado_em, l.convertido_em,
         l.representante_id,
         r.convite_token, r.aceite_termos
       FROM representantes_cadastro_leads l
       LEFT JOIN public.representantes r ON r.id = l.representante_id
       ${where}
       ORDER BY
         CASE l.status
           WHEN 'pendente_verificacao' THEN 0
           WHEN 'verificado' THEN 1
           WHEN 'convertido' THEN 2
           ELSE 3
         END,
         l.criado_em DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      params
    );

    // Contar pendentes (para badge independente dos filtros)
    const pendentesResult = await query<{ cnt: string }>(
      `SELECT COUNT(*) as cnt FROM representantes_cadastro_leads WHERE status = 'pendente_verificacao'`
    );
    const pendentes = parseInt(pendentesResult.rows[0]?.cnt ?? '0', 10);

    // Enriquecer leads PF com verificação de conflito CPF cross-table
    const leadsEnriquecidos = await Promise.all(
      rows.rows.map(async (lead: Record<string, unknown>) => {
        if (
          lead.tipo_pessoa === 'pf' &&
          lead.cpf &&
          lead.status === 'verificado'
        ) {
          const conflicts = await verificarCpfEmUso(String(lead.cpf));
          if (conflicts.length > 0) {
            return { ...lead, cpf_conflict: conflicts[0] };
          }
        }
        return { ...lead, cpf_conflict: null };
      })
    );

    return NextResponse.json({
      leads: leadsEnriquecidos,
      total,
      pendentes,
      page,
      limit,
    });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Não autenticado')
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    if (e.message === 'Sem permissão')
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    console.error('[GET /api/admin/representantes-leads]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
