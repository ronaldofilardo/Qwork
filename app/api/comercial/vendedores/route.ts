/**
 * GET  /api/comercial/vendedores — lista vendedores com seus vínculos
 * POST /api/comercial/vendedores — cria novo vendedor e opcionalmente vincula a representante
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';
import { checkCpfUnicoSistema } from '@/lib/validators/cpf-unico';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await requireRole(['comercial', 'admin'], false);
    void session;

    const { searchParams } = new URL(request.url);
    const busca = searchParams.get('busca') ?? undefined;
    const representanteId = searchParams.get('representante_id') ?? undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = 30;
    const offset = (page - 1) * limit;

    const params: unknown[] = [];
    const wheres: string[] = [`u.tipo_usuario = 'vendedor'`];
    let i = 1;

    if (busca?.trim()) {
      wheres.push(
        `(u.nome ILIKE $${i} OR u.email ILIKE $${i} OR u.cpf ILIKE $${i})`
      );
      params.push(`%${busca.trim()}%`);
      i++;
    }

    if (representanteId) {
      const repIdNum = parseInt(representanteId, 10);
      if (!isNaN(repIdNum)) {
        wheres.push(
          `u.id IN (SELECT vendedor_id FROM hierarquia_comercial WHERE representante_id = $${i++} AND ativo = true)`
        );
        params.push(repIdNum);
      }
    }

    const where = `WHERE ${wheres.join(' AND ')}`;

    const countResult = await query<{ total: string }>(
      `SELECT COUNT(*) as total FROM usuarios u ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.total ?? '0', 10);

    params.push(limit, offset);
    const rows = await query(
      `SELECT
         u.id,
         u.cpf,
         u.nome,
         u.email,
         u.ativo,
         u.criado_em,
         -- Vínculos com representantes
         json_agg(
           json_build_object(
             'hierarquia_id', hc.id,
             'representante_id', hc.representante_id,
             'representante_nome', r.nome,
             'ativo', hc.ativo
           )
         ) FILTER (WHERE hc.id IS NOT NULL) AS vinculos
       FROM usuarios u
       LEFT JOIN hierarquia_comercial hc ON hc.vendedor_id = u.id AND hc.ativo = true
       LEFT JOIN representantes r ON r.id = hc.representante_id
       ${where}
       GROUP BY u.id
       ORDER BY u.criado_em DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      params
    );

    return NextResponse.json({ vendedores: rows.rows, total, page, limit });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Não autenticado')
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    if (e.message === 'Sem permissão')
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    console.error('[GET /api/comercial/vendedores]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

const criarVendedorSchema = z.object({
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos'),
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(200),
  email: z.string().email('E-mail inválido').optional(),
  senha: z.string().min(4, 'Senha deve ter no mínimo 4 caracteres'),
  representante_id: z.number().int().positive().optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await requireRole(['comercial', 'admin'], false);
    void session;

    const body = await request.json();
    const parsed = criarVendedorSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          detalhes: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { cpf, nome, email, senha, representante_id } = parsed.data;

    // Verificar CPF em uso (cross-perfil: representantes, vendedores, gestores, rh)
    const cpfCheck = await checkCpfUnicoSistema(cpf);
    if (!cpfCheck.disponivel) {
      return NextResponse.json(
        { error: cpfCheck.message ?? 'CPF já cadastrado no sistema' },
        { status: 409 }
      );
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    // Inserir vendedor
    const insertResult = await query<{ id: number }>(
      `INSERT INTO usuarios (cpf, nome, email, tipo_usuario, senha_hash, ativo)
       VALUES ($1, $2, $3, 'vendedor', $4, true)
       RETURNING id`,
      [cpf, nome, email ?? null, senhaHash]
    );
    const vendedorId = insertResult.rows[0].id;

    // Vincular a representante se informado
    if (representante_id) {
      // Verificar se representante existe
      const repExists = await query(
        `SELECT id FROM representantes WHERE id = $1 LIMIT 1`,
        [representante_id]
      );
      if (repExists.rows.length > 0) {
        await query(
          `INSERT INTO hierarquia_comercial (vendedor_id, representante_id, ativo)
           VALUES ($1, $2, true)
           ON CONFLICT (vendedor_id, representante_id) DO UPDATE SET ativo = true, atualizado_em = now()`,
          [vendedorId, representante_id]
        );
      }
    }

    return NextResponse.json(
      { success: true, vendedor_id: vendedorId, cpf, nome },
      { status: 201 }
    );
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Não autenticado')
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    if (e.message === 'Sem permissão')
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    console.error('[POST /api/comercial/vendedores]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
