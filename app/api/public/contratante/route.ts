/**
 * DEPRECATED: Use /api/public/tomador instead
 * Redirects to /api/public/tomador for backward compatibility
 */
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/public/contratante?id=123 (DEPRECATED)
 *
 * ⚠️ ESSA API FOI DESCONTINUADA
 * Use: GET /api/public/tomador?id=123
 *
 * A arquitetura segregada (entidades/clinicas) substitui a tabela legada 'tomadors'
 */
export function GET(_request: NextRequest) {
  // Redirecionar para /api/public/tomador
  const searchParams = _request.nextUrl.searchParams;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      {
        error: 'API descontinuada. Use GET /api/public/tomador?id=<id>',
        deprecated: true,
      },
      { status: 301 }
    );
  }

  // Redirecionar internamente para /tomador
  const redirectUrl = new URL('/api/public/tomador', _request.url);
  redirectUrl.searchParams.set('id', id);

  return NextResponse.redirect(redirectUrl, { status: 301 });
}
