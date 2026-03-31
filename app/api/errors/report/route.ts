import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/errors/report
 *
 * Recebe relatórios de erros do client-side error boundary.
 * Loga de forma estruturada para facilitar diagnóstico em produção.
 * Não requer autenticação (pode ser chamado em estado de erro).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { errorId, message, digest, url, userAgent, timestamp } = body;

    // Validar campos obrigatórios
    if (!errorId || !message) {
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes' },
        { status: 400 }
      );
    }

    // Sanitizar dados antes de logar (prevenir log injection)
    const sanitize = (s: unknown): string =>
      typeof s === 'string' ? s.replace(/[\r\n]/g, ' ').slice(0, 1000) : '';

    console.error(
      JSON.stringify({
        level: 'error',
        type: 'client_error_report',
        errorId: sanitize(errorId),
        message: sanitize(message),
        digest: sanitize(digest),
        url: sanitize(url),
        userAgent: sanitize(userAgent),
        timestamp: sanitize(timestamp),
        reportedAt: new Date().toISOString(),
      })
    );

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
