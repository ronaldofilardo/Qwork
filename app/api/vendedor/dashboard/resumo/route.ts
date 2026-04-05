/**
 * GET /api/vendedor/dashboard/resumo
 *
 * Retorna métricas do dashboard para o vendedor autenticado:
 * - Representantes vinculados (hierarquia_comercial)
 * - Emissões do mês corrente (lotes)
 */
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    const session = await requireRole('vendedor', false);

    // Buscar ID do usuário pelo CPF da sessão
    const userResult = await query<{ id: number }>(
      `SELECT id FROM usuarios WHERE cpf = $1 AND ativo = true LIMIT 1`,
      [session.cpf]
    );
    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    const vendedorId = userResult.rows[0].id;

    const mesAtual = new Date().toISOString().slice(0, 7); // 'YYYY-MM'

    const resumoResult = await query<{
      representantes_ativos: string;
      emissoes_mes: string;
    }>(
      `SELECT
         COUNT(DISTINCT hc.representante_id) FILTER (WHERE hc.ativo = true) AS representantes_ativos,
         COUNT(DISTINCT lr.id) FILTER (
           WHERE TO_CHAR(lr.data_conversao, 'YYYY-MM') = $2
         )                                                                   AS emissoes_mes
       FROM hierarquia_comercial hc
       LEFT JOIN leads_representante lr ON lr.vendedor_id = $1
       WHERE hc.vendedor_id = $1`,
      [vendedorId, mesAtual]
    );

    const row = resumoResult.rows[0];

    const repResult = await query<{ id: number; nome: string; codigo: string }>(
      `SELECT r.id, r.nome, r.codigo
       FROM public.hierarquia_comercial hc
       JOIN public.representantes r ON r.id = hc.representante_id
       WHERE hc.vendedor_id = $1 AND hc.ativo = true
       LIMIT 1`,
      [vendedorId]
    );

    return NextResponse.json({
      representantes_ativos: parseInt(row?.representantes_ativos ?? '0', 10),
      emissoes_mes: parseInt(row?.emissoes_mes ?? '0', 10),
      representante: repResult.rows[0] ?? null,
    });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Não autenticado')
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    if (e.message === 'Sem permissão')
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    console.error('[GET /api/vendedor/dashboard/resumo]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
