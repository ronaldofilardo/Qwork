import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { verificarAceites } from '@/lib/termos/verificar-aceites';

export const dynamic = 'force-dynamic';

/**
 * GET /api/termos/verificar
 * Verifica se o usuário da sessão atual aceitou os termos e política de privacidade
 */
export async function GET() {
  try {
    const session = getSession();

    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Apenas RH e GESTOR precisam aceitar termos
    if (session.perfil !== 'rh' && session.perfil !== 'gestor') {
      return NextResponse.json({
        termos_uso_aceito: true,
        politica_privacidade_aceito: true,
        nao_requerido: true,
      });
    }

    const aceites = await verificarAceites(session.cpf, session.perfil);

    return NextResponse.json(aceites);
  } catch (error) {
    console.error('[TERMOS] Erro ao verificar aceites:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar aceites' },
      { status: 500 }
    );
  }
}
