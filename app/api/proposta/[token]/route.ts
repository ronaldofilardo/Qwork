import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/proposta/[token]
 *
 * Endpoint legado — o fluxo de contratação personalizada com links de proposta
 * foi removido. O sistema atual usa fluxo direto: Cadastro → Aprovação → Pagamento.
 */
export async function GET(
  _request: NextRequest,
  _context: { params: { token: string } }
) {
  return NextResponse.json(
    {
      valido: false,
      error:
        'O fluxo de proposta personalizada foi descontinuado. Entre em contato com o suporte.',
    },
    { status: 410 }
  );
}
