import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Força renderização dinâmica - não pré-renderizar durante build
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(_req: NextRequest) {
  try {
    const res = await query('SELECT current_database() as db');
    const dbName = res.rows[0]?.db || null;
    return NextResponse.json({ success: true, database: dbName });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}
