export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getSession, regenerateSession, persistSession } from '@/lib/session';

export async function GET() {
  try {
    let session = await Promise.resolve(getSession());

    if (!session) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        {
          status: 401,
          headers: {
            'Cache-Control':
              'no-store, no-cache, must-revalidate, proxy-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
          },
        }
      );
    }

    // Persistir rotação de sessão quando necessário (somente em Route Handlers / Server Actions)
    if (session.rotationRequired) {
      const rotated = regenerateSession(session);
      persistSession(rotated);
      session = rotated;
    }

    return NextResponse.json(session, {
      headers: {
        'Cache-Control':
          'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    console.error('Erro ao obter sessão:', error);
    return NextResponse.json(
      { error: 'Erro interno' },
      {
        status: 500,
        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  }
}
