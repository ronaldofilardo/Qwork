/**
 * GET  /api/vendedor/criar-senha?token=XXX
 *   Valida o token de convite e retorna nome/email do vendedor.
 *   Respostas: { valido: true, nome, email } | { valido: false, motivo }
 *
 * POST /api/vendedor/criar-senha
 *   Body: { token, senha, confirmacao }
 *   Cria a senha do vendedor e marca o convite como usado.
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

// --------------------------------------------------------------------------
// GET — validar token de convite
// --------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token || token.length !== 64) {
    return NextResponse.json(
      { valido: false, motivo: 'token_invalido' },
      { status: 400 }
    );
  }

  try {
    const res = await query<{
      id: number;
      usuario_id: number;
      nome: string;
      email: string | null;
      convite_expira_em: string | null;
      convite_tentativas_falhas: number;
      convite_usado_em: string | null;
    }>(
      `SELECT vp.id, vp.usuario_id,
              u.nome, u.email,
              vp.convite_expira_em, vp.convite_tentativas_falhas, vp.convite_usado_em
       FROM vendedores_perfil vp
       JOIN usuarios u ON u.id = vp.usuario_id
       WHERE vp.convite_token = $1
       LIMIT 1`,
      [token]
    );

    if (res.rows.length === 0) {
      return NextResponse.json(
        { valido: false, motivo: 'token_invalido' },
        { status: 400 }
      );
    }

    const vend = res.rows[0];

    if (vend.convite_usado_em) {
      return NextResponse.json(
        { valido: false, motivo: 'token_ja_usado' },
        { status: 400 }
      );
    }

    if (
      !vend.convite_expira_em ||
      new Date(vend.convite_expira_em) < new Date()
    ) {
      return NextResponse.json(
        { valido: false, motivo: 'token_expirado' },
        { status: 400 }
      );
    }

    if (vend.convite_tentativas_falhas >= 3) {
      return NextResponse.json(
        { valido: false, motivo: 'token_bloqueado' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valido: true,
      nome: vend.nome,
      email: vend.email,
    });
  } catch (err) {
    console.error('[GET /api/vendedor/criar-senha]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// --------------------------------------------------------------------------
// POST — criar senha com token de convite
// --------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, senha, confirmacao } = body as {
      token?: string;
      senha?: string;
      confirmacao?: string;
    };

    if (!token || typeof token !== 'string' || token.length !== 64) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 400 });
    }
    if (!senha || typeof senha !== 'string') {
      return NextResponse.json({ error: 'Senha obrigatória' }, { status: 400 });
    }
    if (senha !== confirmacao) {
      return NextResponse.json(
        { error: 'Senha e confirmação não conferem' },
        { status: 400 }
      );
    }
    if (senha.length < 8) {
      return NextResponse.json(
        { error: 'Senha deve ter pelo menos 8 caracteres' },
        { status: 400 }
      );
    }
    if (!/[A-Z]/.test(senha)) {
      return NextResponse.json(
        { error: 'Senha deve conter pelo menos uma letra maiúscula' },
        { status: 400 }
      );
    }
    if (!/[0-9]/.test(senha)) {
      return NextResponse.json(
        { error: 'Senha deve conter pelo menos um número' },
        { status: 400 }
      );
    }

    // Buscar vendedor pelo token (com lock FOR UPDATE)
    const res = await query<{
      perfil_id: number;
      usuario_id: number;
      nome: string;
      email: string | null;
      convite_expira_em: string | null;
      convite_tentativas_falhas: number;
      convite_usado_em: string | null;
    }>(
      `SELECT vp.id AS perfil_id, vp.usuario_id,
              u.nome, u.email,
              vp.convite_expira_em, vp.convite_tentativas_falhas, vp.convite_usado_em
       FROM vendedores_perfil vp
       JOIN usuarios u ON u.id = vp.usuario_id
       WHERE vp.convite_token = $1
       FOR UPDATE OF vp`,
      [token]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 400 });
    }

    const vend = res.rows[0];

    if (vend.convite_usado_em) {
      return NextResponse.json(
        {
          error:
            'Este link já foi utilizado. Solicite um novo convite ao representante.',
        },
        { status: 400 }
      );
    }

    if (
      !vend.convite_expira_em ||
      new Date(vend.convite_expira_em) < new Date()
    ) {
      return NextResponse.json(
        { error: 'Link expirado. Solicite um novo convite ao representante.' },
        { status: 400 }
      );
    }

    if (vend.convite_tentativas_falhas >= 3) {
      return NextResponse.json(
        {
          error:
            'Link bloqueado por excesso de tentativas. Solicite um novo convite.',
        },
        { status: 400 }
      );
    }

    const senhaHash = await bcrypt.hash(senha, 12);

    // Atualizar senha + ativar usuário (estava inativo enquanto aguardava convite)
    await query(
      `UPDATE usuarios SET senha_hash = $1, ativo = true WHERE id = $2`,
      [senhaHash, vend.usuario_id]
    );

    // Marcar convite como usado — vendedor escolheu a própria senha, não precisa trocar no 1º login
    await query(
      `UPDATE vendedores_perfil
       SET convite_token             = NULL,
           convite_expira_em         = NULL,
           convite_tentativas_falhas = 0,
           convite_usado_em          = NOW(),
           primeira_senha_alterada   = TRUE
       WHERE id = $1 AND convite_token = $2`,
      [vend.perfil_id, token]
    );

    console.log(
      `[CRIAR_SENHA_VENDEDOR] Vendedor usuario_id=${vend.usuario_id} (${vend.email}) criou sua senha`
    );

    return NextResponse.json({
      success: true,
      message: 'Senha criada com sucesso! Você já pode fazer login.',
    });
  } catch (err) {
    console.error('[POST /api/vendedor/criar-senha]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
