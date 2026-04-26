/**
 * GET /api/comercial/representantes-leads
 *
 * Lista candidatos (leads de cadastro da landing page) atribuídos ao comercial logado.
 * Filtro de segurança: comercial_cpf = session.cpf (automático).
 *
 * Query params:
 *   status   - pendente_verificacao | verificado | convertido | rejeitado
 *   busca    - texto livre (nome, email, cpf, cnpj)
 *   page     - paginação (default 1)
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await requireRole('comercial', false);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') ?? undefined;
    const busca = searchParams.get('busca') ?? undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = 30;
    const offset = (page - 1) * limit;

    const wheres: string[] = [];
    const params: unknown[] = [];
    let i = 1;

    // Sempre filtrar por comercial_cpf do usuário logado
    wheres.push(`l.comercial_cpf = $${i++}`);
    params.push(session.cpf);

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

    if (busca?.trim()) {
      wheres.push(
        `(l.nome ILIKE $${i} OR l.email ILIKE $${i} OR l.cpf ILIKE $${i} OR l.cnpj ILIKE $${i} OR l.razao_social ILIKE $${i})`
      );
      params.push(`%${busca.trim()}%`);
      i++;
    }

    const where = `WHERE ${wheres.join(' AND ')}`;

    const countResult = await query<{ total: string }>(
      `SELECT COUNT(*) as total FROM representantes_cadastro_leads l ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.total ?? '0', 10);

    // Contar pendentes do comercial (para badge)
    const pendentesResult = await query<{ cnt: string }>(
      `SELECT COUNT(*) as cnt FROM representantes_cadastro_leads
       WHERE comercial_cpf = $1 AND status = 'pendente_verificacao'`,
      [session.cpf]
    );
    const pendentes = parseInt(pendentesResult.rows[0]?.cnt ?? '0', 10);

    params.push(limit, offset);
    const rows = await query(
      `SELECT
         l.id, l.tipo_pessoa, l.nome, l.email, l.telefone,
         l.cpf, l.cnpj, l.razao_social, l.cpf_responsavel,
         l.doc_cpf_filename, l.doc_cpf_key,
         l.doc_cnpj_filename, l.doc_cnpj_key,
         l.doc_cpf_resp_filename, l.doc_cpf_resp_key,
         l.status, l.motivo_rejeicao,
         l.criado_em, l.verificado_em, l.convertido_em,
         l.representante_id, l.comercial_cpf
       FROM representantes_cadastro_leads l
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

    return NextResponse.json({
      leads: rows.rows,
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
    console.error('[GET /api/comercial/representantes-leads]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
