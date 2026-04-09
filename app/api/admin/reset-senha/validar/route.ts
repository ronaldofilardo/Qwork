/**
 * GET /api/admin/reset-senha/validar?token=XXX
 *
 * Rota PÚBLICA — valida um token de reset de senha e retorna dados do usuário.
 * Não requer autenticação (o usuário ainda não tem sessão ativa — está inativo).
 *
 * Respostas:
 *   { valido: true, nome: string, perfil: string }
 *   { valido: false, motivo: 'token_invalido' | 'token_expirado' | 'token_ja_usado' | 'token_bloqueado' }
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

function validarEstadoToken(
  usadoEm: string | null | undefined,
  expiraEm: string | null,
  tentativasFalhas: number
): string | null {
  if (usadoEm) return 'token_ja_usado';
  if (!expiraEm || new Date(expiraEm) < new Date()) return 'token_expirado';
  if (tentativasFalhas >= 3) return 'token_bloqueado';
  return null;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token || token.length !== 64) {
    return NextResponse.json(
      { valido: false, motivo: 'token_invalido' },
      { status: 400 }
    );
  }

  try {
    // 1. Buscar em `usuarios`
    const usuarioRes = await query<{
      cpf: string;
      nome: string;
      tipo_usuario: string;
      reset_token_expira_em: string | null;
      reset_tentativas_falhas: number;
      reset_usado_em: string | null;
    }>(
      `SELECT cpf, nome, tipo_usuario,
              reset_token_expira_em, reset_tentativas_falhas, reset_usado_em
       FROM usuarios
       WHERE reset_token = $1
       LIMIT 1`,
      [token]
    );

    if (usuarioRes.rows.length > 0) {
      const u = usuarioRes.rows[0];
      const motivo = validarEstadoToken(
        u.reset_usado_em,
        u.reset_token_expira_em,
        u.reset_tentativas_falhas
      );
      if (motivo) {
        return NextResponse.json({ valido: false, motivo }, { status: 400 });
      }
      return NextResponse.json({
        valido: true,
        nome: u.nome,
        perfil: u.tipo_usuario,
      });
    }

    // 2. Buscar em `representantes`
    const repRes = await query<{
      id: number;
      nome: string;
      reset_token_expira_em: string | null;
      reset_tentativas_falhas: number;
      reset_usado_em: string | null;
    }>(
      `SELECT id, nome,
              reset_token_expira_em, reset_tentativas_falhas, reset_usado_em
       FROM representantes
       WHERE reset_token = $1
       LIMIT 1`,
      [token]
    );

    if (repRes.rows.length > 0) {
      const r = repRes.rows[0];
      const motivo = validarEstadoToken(
        r.reset_usado_em,
        r.reset_token_expira_em,
        r.reset_tentativas_falhas
      );
      if (motivo) {
        return NextResponse.json({ valido: false, motivo }, { status: 400 });
      }
      return NextResponse.json({
        valido: true,
        nome: r.nome,
        perfil: 'representante',
      });
    }

    return NextResponse.json(
      { valido: false, motivo: 'token_invalido' },
      { status: 400 }
    );
  } catch (err) {
    console.error('[GET /api/admin/reset-senha/validar]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}


