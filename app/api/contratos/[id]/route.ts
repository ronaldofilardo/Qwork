import { NextRequest, NextResponse } from 'next/server';
import { obterContrato } from '@/lib/contratos/contratos';

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

    // Usar função obterContrato que já faz JOIN com tomadores
    const contrato = await obterContrato(parseInt(contratoId));

    if (!contrato) {
      return NextResponse.json(
        { error: 'Contrato não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      contrato,
    });
  } catch (error) {
    console.error('Erro ao consultar contrato:', error);
    return NextResponse.json(
      { error: 'Erro ao consultar contrato' },
      { status: 500 }
    );
  }
}
