/**
 * GET  /api/vendedor/dados — retorna dados do vendedor logado
 * PATCH /api/vendedor/dados — atualiza dados pessoais (email, telefone)
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

const patchSchema = z.object({
  email: z.string().email().optional(),
  telefone: z.string().min(8).max(20).optional(),
});

export async function GET(): Promise<NextResponse> {
  try {
    const session = await requireRole('vendedor', false);

    const result = await query(
      `SELECT u.id, u.cpf, u.nome, u.email, u.telefone, u.ativo, u.criado_em,
              COALESCE(vp.primeira_senha_alterada, TRUE) AS primeira_senha_alterada,
              COALESCE(vp.aceite_politica_privacidade, TRUE) AS aceite_politica_privacidade,
              vp.codigo
       FROM public.usuarios u
       LEFT JOIN public.vendedores_perfil vp ON vp.usuario_id = u.id
       WHERE u.cpf = $1 AND u.tipo_usuario = 'vendedor' AND u.ativo = true
       LIMIT 1`,
      [session.cpf]
    );
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    return NextResponse.json({ usuario: result.rows[0] });
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      (err.message === 'Sem permissão' || err.message === 'Não autenticado')
    ) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error('/api/vendedor/dados GET error:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await requireRole('vendedor', false);

    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos.', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, telefone } = parsed.data;
    if (!email && !telefone) {
      return NextResponse.json(
        { error: 'Nenhum campo para atualizar.' },
        { status: 400 }
      );
    }

    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;

    if (email) {
      sets.push(`email = $${i++}`);
      params.push(email);
    }
    if (telefone) {
      sets.push(`telefone = $${i++}`);
      params.push(telefone);
    }
    params.push(session.cpf);

    await query(
      `UPDATE public.usuarios SET ${sets.join(', ')} WHERE cpf = $${i} AND tipo_usuario = 'vendedor'`,
      params
    );

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      (err.message === 'Sem permissão' || err.message === 'Não autenticado')
    ) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error('/api/vendedor/dados PATCH error:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
