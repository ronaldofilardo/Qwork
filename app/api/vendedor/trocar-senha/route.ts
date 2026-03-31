/**
 * POST /api/vendedor/trocar-senha
 *
 * Força troca de senha no primeiro acesso do vendedor.
 * Body: { senha_atual, nova_senha }
 *
 * Autenticação via requireRole('vendedor').
 * Atualiza usuarios.senha_hash e seta vendedores_perfil.primeira_senha_alterada=TRUE.
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await requireRole('vendedor', false);

    const body = await request.json();
    const { senha_atual, nova_senha } = body as {
      senha_atual?: string;
      nova_senha?: string;
    };

    if (!senha_atual || !nova_senha) {
      return NextResponse.json(
        { error: 'Senha atual e nova senha são obrigatórias.' },
        { status: 400 }
      );
    }

    if (
      nova_senha.length < 8 ||
      !/[A-Z]/.test(nova_senha) ||
      !/[0-9]/.test(nova_senha)
    ) {
      return NextResponse.json(
        {
          error:
            'Nova senha deve ter mínimo 8 caracteres, uma maiúscula e um número.',
        },
        { status: 400 }
      );
    }

    // Buscar senha atual
    const userRes = await query<{ id: number; senha_hash: string | null }>(
      `SELECT id, senha_hash FROM usuarios WHERE cpf = $1 AND tipo_usuario = 'vendedor' AND ativo = true LIMIT 1`,
      [session.cpf]
    );

    if (userRes.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuário não encontrado.' },
        { status: 404 }
      );
    }

    const user = userRes.rows[0];

    if (!user.senha_hash) {
      return NextResponse.json(
        { error: 'Senha atual não configurada. Utilize o link de convite.' },
        { status: 400 }
      );
    }

    const senhaAtualValida = await bcrypt.compare(senha_atual, user.senha_hash);
    if (!senhaAtualValida) {
      return NextResponse.json(
        { error: 'Senha atual incorreta.' },
        { status: 401 }
      );
    }

    if (await bcrypt.compare(nova_senha, user.senha_hash)) {
      return NextResponse.json(
        { error: 'A nova senha não pode ser igual à senha atual.' },
        { status: 400 }
      );
    }

    const novaHash = await bcrypt.hash(nova_senha, 12);

    // Atualizar senha e marcar primeira_senha_alterada=TRUE
    await query(`UPDATE usuarios SET senha_hash = $1 WHERE id = $2`, [
      novaHash,
      user.id,
    ]);
    await query(
      `UPDATE vendedores_perfil SET primeira_senha_alterada = TRUE WHERE usuario_id = $1`,
      [user.id]
    );

    // Buscar código do vendedor para exibir na tela de sucesso
    const codigoResult = await query<{ codigo: string }>(
      `SELECT codigo FROM vendedores_perfil WHERE usuario_id = $1 LIMIT 1`,
      [user.id]
    );
    const codigo = codigoResult.rows[0]?.codigo ?? null;

    console.log(
      `[TROCAR_SENHA_VENDEDOR] usuario_id=${user.id} (CPF: ${session.cpf}) alterou senha`
    );

    return NextResponse.json({ success: true, codigo });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'UNAUTHORIZED' || e.message?.includes('401')) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }
    console.error('[POST /api/vendedor/trocar-senha]', err);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
