/**
 * GET /api/representante/equipe/leads
 * Retorna leads da equipe de forma hierárquica:
 *   - por_vendedor: leads dos vendedores da equipe do representante
 *   - diretos: leads onde representante_id = rep e vendedor_id IS NULL
 *
 * Query params:
 *   - mes=true  → filtra apenas o mês atual (date_trunc)
 *   - status    → filtra por status específico (opcional)
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  requireRepresentante,
  repAuthErrorResponse,
} from '@/lib/session-representante';

export const dynamic = 'force-dynamic';

interface LeadRow {
  id: number;
  cnpj: string | null;
  razao_social: string | null;
  contato_nome: string | null;
  status: string;
  origem: string | null;
  criado_em: string;
  data_expiracao: string | null;
  vendedor_id: number | null;
  vendedor_nome: string | null;
  valor_negociado: number | null;
  percentual_comissao_representante: number | null;
  num_vidas_estimado: number | null;
  requer_aprovacao_comercial: boolean;
  tipo_cliente: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const sess = requireRepresentante();
    const { searchParams } = new URL(request.url);
    const mesFiltro = searchParams.get('mes') === 'true';
    const statusFiltro = searchParams.get('status') ?? undefined;

    // ---- Leads dos vendedores da equipe ----
    const equipeWheres: string[] = [
      `hc.representante_id = $1`,
      `hc.ativo = true`,
    ];
    const equipeParams: unknown[] = [sess.representante_id];
    let idx = 2;

    if (mesFiltro) {
      equipeWheres.push(`lr.criado_em >= date_trunc('month', now())`);
    }
    if (statusFiltro) {
      equipeWheres.push(`lr.status = $${idx++}`);
      equipeParams.push(statusFiltro);
    }

    const equipeResult = await query<
      LeadRow & { v_id: number; v_nome: string }
    >(
      `SELECT
         lr.id,
         lr.cnpj,
         lr.razao_social,
         lr.contato_nome,
         lr.status,
         lr.origem,
         lr.criado_em,
         lr.data_expiracao,
         lr.valor_negociado,
         lr.percentual_comissao_representante,
         lr.num_vidas_estimado,
         lr.requer_aprovacao_comercial,
         lr.tipo_cliente,
         u.id   AS vendedor_id,
         u.nome AS vendedor_nome
       FROM public.hierarquia_comercial hc
       JOIN public.usuarios u ON u.id = hc.vendedor_id
       LEFT JOIN public.leads_representante lr ON lr.vendedor_id = u.id
       WHERE ${equipeWheres.join(' AND ')} AND lr.id IS NOT NULL
       ORDER BY u.nome, lr.criado_em DESC`,
      equipeParams
    );

    // Agrupa por vendedor
    const vendedorMap = new Map<
      number,
      { vendedor_id: number; vendedor_nome: string; leads: LeadRow[] }
    >();
    for (const row of equipeResult.rows) {
      const vid = row.vendedor_id as number;
      if (!vendedorMap.has(vid)) {
        vendedorMap.set(vid, {
          vendedor_id: vid,
          vendedor_nome: row.vendedor_nome ?? '',
          leads: [],
        });
      }
      vendedorMap.get(vid)!.leads.push({
        id: row.id,
        cnpj: row.cnpj,
        razao_social: row.razao_social,
        contato_nome: row.contato_nome,
        status: row.status,
        origem: row.origem,
        criado_em: row.criado_em,
        data_expiracao: row.data_expiracao,
        vendedor_id: vid,
        vendedor_nome: row.vendedor_nome,
        valor_negociado: row.valor_negociado,
        percentual_comissao_representante:
          row.percentual_comissao_representante,
        num_vidas_estimado: row.num_vidas_estimado,
        requer_aprovacao_comercial: row.requer_aprovacao_comercial,
        tipo_cliente: row.tipo_cliente,
      });
    }

    // ---- Leads diretos do representante (sem vendedor) ----
    const diretosWheres: string[] = [
      `lr.representante_id = $1`,
      `lr.vendedor_id IS NULL`,
    ];
    const diretosParams: unknown[] = [sess.representante_id];
    let didx = 2;

    if (mesFiltro) {
      diretosWheres.push(`lr.criado_em >= date_trunc('month', now())`);
    }
    if (statusFiltro) {
      diretosWheres.push(`lr.status = $${didx++}`);
      diretosParams.push(statusFiltro);
    }

    const diretosResult = await query<LeadRow>(
      `SELECT
         lr.id,
         lr.cnpj,
         lr.razao_social,
         lr.contato_nome,
         lr.status,
         lr.origem,
         lr.criado_em,
         lr.data_expiracao,
         lr.vendedor_id,
         NULL::text AS vendedor_nome,
         lr.valor_negociado,
         lr.percentual_comissao_representante,
         lr.num_vidas_estimado,
         lr.requer_aprovacao_comercial,
         lr.tipo_cliente
       FROM public.leads_representante lr
       WHERE ${diretosWheres.join(' AND ')}
       ORDER BY lr.criado_em DESC`,
      diretosParams
    );

    return NextResponse.json({
      por_vendedor: Array.from(vendedorMap.values()),
      diretos: diretosResult.rows,
      total: equipeResult.rows.length + diretosResult.rows.length,
    });
  } catch (err: unknown) {
    const e = err as Error;
    const r = repAuthErrorResponse(e);
    if (r.status !== 500)
      return NextResponse.json(r.body, { status: r.status });
    console.error('[GET /api/representante/equipe/leads]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
