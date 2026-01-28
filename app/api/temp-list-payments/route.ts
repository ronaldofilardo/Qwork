export const runtime = 'nodejs';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await query(
      'SELECT * FROM pagamentos ORDER BY criado_em DESC LIMIT 50'
    );
    return NextResponse.json({ payments: result.rows });
  } catch (error) {
    console.error('Erro ao consultar pagamentos:', error);
    return NextResponse.json(
      { error: 'Erro ao consultar pagamentos' },
      { status: 500 }
    );
  }
}
