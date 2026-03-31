/**
 * GET  /api/comissionamento/ciclos — lista ciclos do rep ou vendedor autenticado
 * POST /api/comissionamento/ciclos — cria ciclos para um mês (admin only)
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/session';
import {
  getCiclosByRepresentante,
  getCiclosByVendedor,
  criarCiclosDoMes,
} from '@/lib/db/comissionamento/ciclos';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await requireRole(
      ['admin', 'representante', 'vendedor'],
      false
    );
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get('limit') ?? '20'))
    );
    const anoStr = searchParams.get('ano');
    const ano = anoStr ? parseInt(anoStr) : undefined;
    const status = searchParams.get('status') as
      | import('@/lib/db/comissionamento/ciclos').StatusCiclo
      | undefined;

    // Admin pode ver de qualquer rep
    const repIdParam = searchParams.get('representante_id');
    const vendedorIdParam = searchParams.get('vendedor_id');

    if (session.perfil === 'admin') {
      if (!repIdParam) {
        return NextResponse.json(
          { error: 'representante_id é obrigatório para admin' },
          { status: 400 }
        );
      }
      const representanteId = parseInt(repIdParam);
      if (vendedorIdParam) {
        const vendedorId = parseInt(vendedorIdParam);
        const result = await getCiclosByVendedor(vendedorId, {
          status,
          ano,
          page,
          limit,
        });
        return NextResponse.json(result);
      }
      const result = await getCiclosByRepresentante(representanteId, {
        status,
        ano,
        page,
        limit,
      });
      return NextResponse.json(result);
    }

    if (session.perfil === 'representante') {
      const { query } = await import('@/lib/db');
      const repResult = await query<{ id: number }>(
        `SELECT id FROM representantes WHERE cpf = $1 LIMIT 1`,
        [session.cpf]
      );
      if (repResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Representante não encontrado' },
          { status: 404 }
        );
      }
      const result = await getCiclosByRepresentante(repResult.rows[0].id, {
        status,
        ano,
        page,
        limit,
      });
      return NextResponse.json(result);
    }

    // vendedor
    const { query } = await import('@/lib/db');
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
    const result = await getCiclosByVendedor(userResult.rows[0].id, {
      status,
      ano,
      page,
      limit,
    });
    return NextResponse.json(result);
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      (err.message === 'Sem permissão' || err.message === 'Não autenticado')
    ) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error('[GET /api/comissionamento/ciclos]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

const criarCiclosSchema = z.object({
  mes_referencia: z
    .string()
    .regex(/^\d{4}-\d{2}-01$/, 'Formato: YYYY-MM-01')
    .refine((v) => !isNaN(Date.parse(v)), 'Data inválida'),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await requireRole(['admin'], false);

    const body = await request.json();
    const parsed = criarCiclosSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const result = await criarCiclosDoMes(parsed.data.mes_referencia);
    return NextResponse.json({
      message: `Ciclos inicializados: ${result.criados} criados, ${result.existentes} já existentes.`,
      ...result,
    });
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      (err.message === 'Sem permissão' || err.message === 'Não autenticado')
    ) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error('[POST /api/comissionamento/ciclos]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
