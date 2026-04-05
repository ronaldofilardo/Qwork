/**
 * GET /api/representante/equipe/vendedores — lista vendedores da equipe do representante
 * POST /api/representante/equipe/vendedores — vincula novo usuário vendedor à equipe
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  requireRepresentante,
  repAuthErrorResponse,
} from '@/lib/session-representante';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const sess = requireRepresentante();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = 20;
    const offset = (page - 1) * limit;
    const soInativos = searchParams.get('ativo') === 'false';

    const countResult = await query<{ total: string }>(
      `SELECT COUNT(*) AS total
       FROM public.hierarquia_comercial hc
       JOIN public.usuarios u ON u.id = hc.vendedor_id
       WHERE hc.representante_id = $1 AND hc.ativo = ${soInativos ? 'false' : 'true'}
         AND u.ativo = ${soInativos ? 'false' : 'true'}`,
      [sess.representante_id]
    );
    const total = parseInt(countResult.rows[0]?.total ?? '0', 10);

    const rows = await query(
      `SELECT
         hc.id            AS vinculo_id,
         hc.ativo,
         hc.percentual_override,
         hc.criado_em     AS vinculado_em,
         hc.data_fim,
         u.id             AS vendedor_id,
         u.nome           AS vendedor_nome,
         u.email          AS vendedor_email,
         u.cpf            AS vendedor_cpf,
         vp.id            AS vendedor_perfil_id,
         vp.codigo        AS codigo_vendedor,
         vp.aceite_termos,
         COUNT(DISTINCT lr.id) FILTER (WHERE lr.status NOT IN ('expirado','convertido')) AS leads_ativos
       FROM public.hierarquia_comercial hc
       JOIN public.usuarios u ON u.id = hc.vendedor_id
       LEFT JOIN public.vendedores_perfil vp ON vp.usuario_id = u.id
       LEFT JOIN public.leads_representante lr ON lr.vendedor_id = u.id
       WHERE hc.representante_id = $1 AND hc.ativo = ${soInativos ? 'false' : 'true'}
         AND u.ativo = ${soInativos ? 'false' : 'true'}
       GROUP BY hc.id, u.id, vp.id, vp.codigo, vp.aceite_termos
       ORDER BY u.nome
       LIMIT $2 OFFSET $3`,
      [sess.representante_id, limit, offset]
    );

    return NextResponse.json({ vendedores: rows.rows, total, page, limit });
  } catch (err: unknown) {
    return repAuthErrorResponse(err as Error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const sess = requireRepresentante();
    const body = await request.json();
    const { vendedor_id, percentual_override } = body as {
      vendedor_id: number;
      percentual_override?: number;
    };

    if (!vendedor_id || typeof vendedor_id !== 'number') {
      return NextResponse.json(
        { error: 'vendedor_id é obrigatório.' },
        { status: 400 }
      );
    }

    // Verificar se o usuário existe e tem perfil vendedor
    const userCheck = await query(
      `SELECT id FROM public.usuarios WHERE id = $1 AND perfil = 'vendedor' LIMIT 1`,
      [vendedor_id]
    );
    if (userCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuário vendedor não encontrado.' },
        { status: 404 }
      );
    }

    // Verificar se já existe vínculo ativo
    const existing = await query(
      `SELECT id FROM public.hierarquia_comercial
       WHERE vendedor_id = $1 AND representante_id = $2`,
      [vendedor_id, sess.representante_id]
    );
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'Este vendedor já está vinculado à sua equipe.' },
        { status: 409 }
      );
    }

    const result = await query(
      `INSERT INTO public.hierarquia_comercial
         (vendedor_id, representante_id, ativo, percentual_override)
       VALUES ($1, $2, true, $3)
       RETURNING id`,
      [vendedor_id, sess.representante_id, percentual_override ?? null]
    );

    return NextResponse.json(
      { vinculo_id: result.rows[0].id },
      { status: 201 }
    );
  } catch (err: unknown) {
    return repAuthErrorResponse(err as Error);
  }
}
