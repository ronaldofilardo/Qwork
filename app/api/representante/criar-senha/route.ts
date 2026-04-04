/**
 * GET  /api/representante/criar-senha?token=XXX
 *   Valida o token de convite e retorna nome/email do representante.
 *   Respostas: { valido: true, nome, email } | { valido: false, motivo }
 *
 * POST /api/representante/criar-senha
 *   Body: { token, senha, confirmacao }
 *   Cria a senha do representante e marca o convite como usado.
 *   Respostas: { success: true } | { error }
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { createSession } from '@/lib/session';
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
      nome: string;
      email: string;
      status: string;
      convite_expira_em: string | null;
      convite_tentativas_falhas: number;
      convite_usado_em: string | null;
    }>(
      `SELECT id, nome, email, status,
              convite_expira_em, convite_tentativas_falhas, convite_usado_em
       FROM representantes
       WHERE convite_token = $1
       LIMIT 1`,
      [token]
    );

    if (res.rows.length === 0) {
      return NextResponse.json(
        { valido: false, motivo: 'token_invalido' },
        { status: 400 }
      );
    }

    const rep = res.rows[0];

    // Já usado
    if (rep.convite_usado_em) {
      return NextResponse.json(
        { valido: false, motivo: 'token_ja_usado' },
        { status: 400 }
      );
    }

    // Expirado (verificação on-demand — sem cron)
    if (
      !rep.convite_expira_em ||
      new Date(rep.convite_expira_em) < new Date()
    ) {
      // Marcar status como expirado no banco (lazy)
      await query(
        `UPDATE representantes
         SET status = 'expirado'
         WHERE id = $1 AND status = 'aguardando_senha'`,
        [rep.id]
      );
      return NextResponse.json(
        { valido: false, motivo: 'token_expirado' },
        { status: 400 }
      );
    }

    // Bloqueado por excesso de tentativas
    if (rep.convite_tentativas_falhas >= 3) {
      return NextResponse.json(
        { valido: false, motivo: 'token_bloqueado' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valido: true,
      nome: rep.nome,
      email: rep.email,
    });
  } catch (err) {
    console.error('[GET /api/representante/criar-senha]', err);
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

    // Validações básicas
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

    // Regras de complexidade: mínimo 8 chars, 1 maiúscula, 1 número
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

    // Buscar representante pelo token (com lock FOR UPDATE)
    const res = await query<{
      id: number;
      nome: string;
      email: string;
      cpf: string | null;
      cpf_responsavel_pj: string | null;
      status: string;
      convite_expira_em: string | null;
      convite_tentativas_falhas: number;
      convite_usado_em: string | null;
    }>(
      `SELECT id, nome, email, cpf, cpf_responsavel_pj, status,
              convite_expira_em, convite_tentativas_falhas, convite_usado_em
       FROM representantes
       WHERE convite_token = $1
       FOR UPDATE`,
      [token]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 400 });
    }

    const rep = res.rows[0];

    // Já usado
    if (rep.convite_usado_em) {
      return NextResponse.json(
        {
          error:
            'Este link já foi utilizado. Solicite um novo convite ao administrador.',
        },
        { status: 400 }
      );
    }

    // Expirado
    if (
      !rep.convite_expira_em ||
      new Date(rep.convite_expira_em) < new Date()
    ) {
      await query(
        `UPDATE representantes
         SET status = 'expirado'
         WHERE id = $1 AND status = 'aguardando_senha'`,
        [rep.id]
      );
      return NextResponse.json(
        { error: 'Link expirado. Solicite um novo convite ao administrador.' },
        { status: 400 }
      );
    }

    // Bloqueado
    if (rep.convite_tentativas_falhas >= 3) {
      return NextResponse.json(
        {
          error:
            'Link bloqueado por excesso de tentativas. Solicite um novo convite ao administrador.',
        },
        { status: 400 }
      );
    }

    // Tudo válido — criar hash da senha (rounds=12 padrão do projeto)
    const senhaHash = await bcrypt.hash(senha, 12);

    const repCpf = rep.cpf || rep.cpf_responsavel_pj || '';

    // Salvar senha na tabela dedicada representantes_senhas (primeira_senha_alterada=TRUE → senha escolhida pelo próprio rep)
    await query(
      `INSERT INTO public.representantes_senhas (representante_id, cpf, senha_hash, primeira_senha_alterada)
       VALUES ($1, $2, $3, TRUE)
       ON CONFLICT (representante_id, cpf)
       DO UPDATE SET senha_hash = $3, primeira_senha_alterada = TRUE, atualizado_em = NOW()`,
      [rep.id, repCpf, senhaHash]
    );

    // Manter retrocompatibilidade: ainda gravar em senha_repres + marcar convite como usado
    await query(
      `UPDATE representantes
       SET senha_repres             = $1,
           status                   = 'apto',
           convite_token            = NULL,
           convite_expira_em        = NULL,
           convite_tentativas_falhas = 0,
           convite_usado_em         = NOW()
       WHERE id = $2
         AND convite_token = $3`,
      [senhaHash, rep.id, token]
    );

    // Criar sessão para aceitar contratos na próxima página
    createSession({
      cpf: rep.cpf || rep.cpf_responsavel_pj || '',
      nome: rep.nome,
      perfil: 'representante' as any,
      representante_id: rep.id,
    });

    console.log(
      `[CRIAR_SENHA] Representante #${rep.id} (${rep.email}) criou sua senha — status: apto`
    );

    return NextResponse.json({
      success: true,
      message:
        'Senha criada com sucesso! Aceite o contrato e termos para continuar.',
    });
  } catch (err) {
    console.error('[POST /api/representante/criar-senha]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
