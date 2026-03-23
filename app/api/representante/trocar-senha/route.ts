/**
 * POST /api/representante/trocar-senha
 * Troca de senha obrigatória no primeiro acesso do representante.
 * Body: { senha_atual: string, nova_senha: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import {
  requireRepresentante,
  repAuthErrorResponse,
} from '@/lib/session-representante';

export const dynamic = 'force-dynamic';

const SENHA_MIN_LENGTH = 8;

export async function POST(request: NextRequest) {
  try {
    const sess = requireRepresentante();

    const body = await request.json();
    const { senha_atual, nova_senha } = body as {
      senha_atual?: string;
      nova_senha?: string;
    };

    if (!senha_atual || typeof senha_atual !== 'string') {
      return NextResponse.json(
        { error: 'Senha atual é obrigatória' },
        { status: 400 }
      );
    }

    if (!nova_senha || typeof nova_senha !== 'string') {
      return NextResponse.json(
        { error: 'Nova senha é obrigatória' },
        { status: 400 }
      );
    }

    if (nova_senha.length < SENHA_MIN_LENGTH) {
      return NextResponse.json(
        {
          error: `Nova senha deve ter no mínimo ${SENHA_MIN_LENGTH} caracteres`,
        },
        { status: 400 }
      );
    }

    if (!/[A-Z]/.test(nova_senha)) {
      return NextResponse.json(
        { error: 'Nova senha deve conter pelo menos uma letra maiúscula' },
        { status: 400 }
      );
    }

    if (!/[0-9]/.test(nova_senha)) {
      return NextResponse.json(
        { error: 'Nova senha deve conter pelo menos um número' },
        { status: 400 }
      );
    }

    if (senha_atual === nova_senha) {
      return NextResponse.json(
        { error: 'A nova senha deve ser diferente da senha atual' },
        { status: 400 }
      );
    }

    // Buscar hash atual em representantes_senhas
    const senhaResult = await query<{ senha_hash: string }>(
      `SELECT senha_hash FROM public.representantes_senhas
       WHERE representante_id = $1 LIMIT 1`,
      [sess.representante_id]
    );

    if (senhaResult.rows.length === 0 || !senhaResult.rows[0].senha_hash) {
      return NextResponse.json(
        { error: 'Registro de senha não encontrado. Contate o administrador.' },
        { status: 404 }
      );
    }

    const hashAtual = senhaResult.rows[0].senha_hash;
    const senhaAtualValida = await bcrypt.compare(senha_atual, hashAtual);

    if (!senhaAtualValida) {
      return NextResponse.json(
        { error: 'Senha atual incorreta' },
        { status: 401 }
      );
    }

    // Atualizar senha e marcar primeira_senha_alterada = TRUE
    const novoHash = await bcrypt.hash(nova_senha, 12);

    await query(
      `UPDATE public.representantes_senhas
       SET senha_hash = $1, primeira_senha_alterada = TRUE, atualizado_em = NOW()
       WHERE representante_id = $2`,
      [novoHash, sess.representante_id]
    );

    // Atualizar também senha_repres em representantes para retrocompatibilidade
    await query(
      `UPDATE public.representantes SET senha_repres = $1 WHERE id = $2`,
      [novoHash, sess.representante_id]
    );

    console.log(
      `[TROCAR_SENHA_REP] Representante #${sess.representante_id} trocou a senha no primeiro acesso`
    );

    return NextResponse.json({
      success: true,
      message: 'Senha alterada com sucesso!',
    });
  } catch (err: unknown) {
    const e = err as Error;
    const r = repAuthErrorResponse(e);
    return NextResponse.json(r.body, { status: r.status });
  }
}
