/**
 * GET /api/admin/usuarios
 *
 * Lista usuários do sistema com perfil suporte ou comercial.
 * Apenas admin pode acessar.
 */
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export interface UsuarioSistema {
  id: number;
  cpf: string;
  nome: string;
  email: string | null;
  tipo_usuario: string;
  ativo: boolean;
  criado_em: string;
}

export async function GET(): Promise<NextResponse> {
  try {
    const session = await requireRole('admin', false);

    const result = await query<UsuarioSistema>(
      `SELECT id, cpf, nome, email, tipo_usuario, ativo, criado_em
       FROM usuarios
       WHERE tipo_usuario IN ('suporte', 'comercial')
       ORDER BY tipo_usuario, nome`,
      [],
      session
    );

    return NextResponse.json({
      usuarios: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Sem permissão') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }
    console.error('[GET /api/admin/usuarios]', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
