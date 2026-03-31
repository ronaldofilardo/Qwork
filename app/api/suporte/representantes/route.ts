/**
 * GET /api/suporte/representantes
 * Lista todos os representantes com seus vendedores vinculados.
 * Inclui filtros por status e busca por nome/email/código.
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requireRole(['suporte', 'comercial', 'admin'], false);

    const { searchParams } = new URL(request.url);
    const busca = searchParams.get('busca')?.trim() ?? '';
    const status = searchParams.get('status')?.trim() ?? '';

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (busca) {
      params.push(`%${busca}%`);
      conditions.push(
        `(r.nome ILIKE $${params.length} OR r.email ILIKE $${params.length} OR r.codigo ILIKE $${params.length})`
      );
    }

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
      params.push(status);
      conditions.push(`r.status = $${params.length}`);
    }

    // Filtro por grupo: ativos (excluindo desativado/rejeitado) ou inativos (desativado)
    const grupo = searchParams.get('grupo')?.trim() ?? '';
    if (grupo === 'inativos') {
      conditions.push(`r.status IN ('desativado', 'rejeitado')`);
    } else if (grupo === 'ativos') {
      conditions.push(`r.status NOT IN ('desativado', 'rejeitado')`);
    }

    const where =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Representantes com contagem de vendedores
    const repsResult = await query<{
      id: number;
      nome: string;
      email: string | null;
      codigo: string | null;
      status: string;
      tipo_pessoa: string | null;
      cpf: string | null;
      cnpj: string | null;
      percentual_comissao: number | null;
      criado_em: string;
      total_vendedores: number;
    }>(
      `SELECT
         r.id,
         r.nome,
         r.email,
         r.codigo,
         r.status,
         r.tipo_pessoa,
         r.cpf,
         r.cnpj,
         r.percentual_comissao,
         r.criado_em,
         (
           SELECT COUNT(DISTINCT hc2.vendedor_id)
           FROM hierarquia_comercial hc2
           JOIN usuarios u2 ON u2.id = hc2.vendedor_id
           WHERE hc2.representante_id = r.id AND hc2.ativo = true
         ) AS total_vendedores
       FROM representantes r
       ${where}
       ORDER BY r.nome ASC`,
      params
    );

    // Vendedores de todos os representantes em uma única query
    const repIds = repsResult.rows.map((r) => r.id);
    const vendedoresPorRep: Record<
      number,
      Array<{
        vendedor_id: number;
        nome: string;
        email: string | null;
        cpf: string | null;
        codigo: string | null;
        vinculo_id: number;
        vinculado_em: string;
      }>
    > = {};

    if (repIds.length > 0) {
      const vResult = await query<{
        representante_id: number;
        vendedor_id: number;
        nome: string;
        email: string | null;
        cpf: string | null;
        codigo: string | null;
        vinculo_id: number;
        vinculado_em: string;
      }>(
        `SELECT
           hc.representante_id,
           u.id  AS vendedor_id,
           u.nome,
           u.email,
           u.cpf,
           vp.codigo,
           hc.id AS vinculo_id,
           hc.criado_em AS vinculado_em
         FROM hierarquia_comercial hc
         JOIN usuarios u ON u.id = hc.vendedor_id
         LEFT JOIN vendedores_perfil vp ON vp.usuario_id = u.id
         WHERE hc.representante_id = ANY($1::int[])
           AND hc.ativo = true
         ORDER BY u.nome ASC`,
        [repIds]
      );

      for (const v of vResult.rows) {
        if (!vendedoresPorRep[v.representante_id])
          vendedoresPorRep[v.representante_id] = [];
        vendedoresPorRep[v.representante_id].push({
          vendedor_id: v.vendedor_id,
          nome: v.nome,
          email: v.email,
          cpf: v.cpf,
          codigo: v.codigo,
          vinculo_id: v.vinculo_id,
          vinculado_em: v.vinculado_em,
        });
      }
    }

    const representantes = repsResult.rows.map((r) => ({
      ...r,
      vendedores: vendedoresPorRep[r.id] ?? [],
    }));

    return NextResponse.json({ representantes, total: representantes.length });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Não autenticado' || e.message === 'Sem permissão')
      return NextResponse.json({ error: e.message }, { status: 403 });
    console.error('[GET /api/suporte/representantes]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
