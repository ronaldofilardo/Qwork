/**
 * @deprecated Esta rota foi movida para /api/cadastro/tomadores
 * Este arquivo mantém compatibilidade com código legado
 *
 * Redirecionamento: /api/cadastro/tomador → /api/cadastro/tomadores
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/cadastro/tomador
 * @deprecated Use POST /api/cadastro/tomadores
 *
 * Redirecionamento automático para a nova rota
 */
export async function POST(request: NextRequest) {
  console.warn(
    '[DEPRECATED] POST /api/cadastro/tomador - Use /api/cadastro/tomadores instead'
  );

  try {
    // Redirecionar para a rota correta
    const baseUrl = request.nextUrl.origin;
    const tomadoresUrl = `${baseUrl}/api/cadastro/tomadores`;

    // Copiar o content-type original e fazer forward do raw body
    const contentType = request.headers.get('content-type');
    const body = await request.arrayBuffer();

    const response = await fetch(tomadoresUrl, {
      method: 'POST',
      headers: {
        'Content-Type': contentType || 'application/json',
      },
      body,
    });

    // Retornar a resposta da rota verdadeira
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[DEPRECATED ROUTE ERROR]', error);
    return NextResponse.json(
      {
        error: 'Erro ao processar cadastro',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
