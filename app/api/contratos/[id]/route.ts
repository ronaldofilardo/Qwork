import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

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

    const contratoResult = await query(
      `SELECT * FROM contratos WHERE id = $1`,
      [contratoId]
    );

    if (contratoResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Contrato não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      contrato: contratoResult.rows[0],
    });
  } catch (error) {
    console.error('Erro ao consultar contrato:', error);
    return NextResponse.json(
      { error: 'Erro ao consultar contrato' },
      { status: 500 }
    );
  }
}
