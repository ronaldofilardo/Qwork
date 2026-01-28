import { NextRequest, NextResponse } from 'next/server';
import { query, getDatabaseInfo } from '@/lib/db';

export async function GET(_req: NextRequest) {
  try {
    const res = await query(
      'SELECT id, nome, cnpj, email, telefone, status, ativa, criado_em FROM contratantes ORDER BY id DESC LIMIT 10'
    );
    const info = getDatabaseInfo();
    return NextResponse.json({
      success: true,
      database: info.databaseUrl || null,
      rows: res.rows,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}
