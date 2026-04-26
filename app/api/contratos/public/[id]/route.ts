import { NextRequest, NextResponse } from 'next/server';
import { obterContrato } from '@/lib/contratos/contratos';

export const dynamic = 'force-dynamic';

/**
 * GET /api/contratos/public/[id]
 *
 * Endpoint público para visualizar contratos que ainda não foram aceitos.
 * Permite acesso anônimo apenas para contratos pendentes de aceite.
 * Usado por links de suporte para novos usuários (ex: /sucesso-cadastro?contrato_id=112)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contratoId = params.id;

    if (!contratoId) {
      return NextResponse.json(
        { error: 'ID do contrato é obrigatório' },
        { status: 400 }
      );
    }

    const contrato = await obterContrato(parseInt(contratoId));

    if (!contrato) {
      return NextResponse.json(
        { error: 'Contrato não encontrado' },
        { status: 404 }
      );
    }

    // Permitir acesso anônimo apenas para contratos não aceitos
    if (contrato.aceito) {
      return NextResponse.json(
        {
          error:
            'Contrato já foi aceito. Para visualizar, faça login em sua conta.',
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      contrato,
    });
  } catch (error) {
    console.error('Erro ao consultar contrato público:', error);
    return NextResponse.json(
      { error: 'Erro ao consultar contrato' },
      { status: 500 }
    );
  }
}
