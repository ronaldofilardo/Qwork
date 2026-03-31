import { NextResponse } from 'next/server';
import { destroySession, getSession } from '@/lib/session';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';
export async function POST() {
  try {
    // Registrar logout em session_logs antes de destruir a sessão
    try {
      const session = getSession();
      if (session) {
        if (session.sessionLogId) {
          await query(
            `UPDATE session_logs SET logout_timestamp = NOW() WHERE id = $1`,
            [session.sessionLogId]
          );
        } else {
          // Fallback: atualizar sessão aberta mais recente para este CPF+perfil
          await query(
            `UPDATE session_logs
             SET logout_timestamp = NOW()
             WHERE id = (
               SELECT id FROM session_logs
               WHERE cpf = $1 AND perfil = $2 AND logout_timestamp IS NULL
               ORDER BY login_timestamp DESC
               LIMIT 1
             )`,
            [session.cpf, session.perfil]
          );
        }
      }
    } catch (err) {
      console.warn('[LOGOUT] Falha ao registrar logout em session_logs:', err);
    }

    await Promise.resolve(destroySession());
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro no logout:', error);
    return NextResponse.json(
      { error: 'Erro ao fazer logout' },
      { status: 500 }
    );
  }
}
