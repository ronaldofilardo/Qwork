import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireRole('admin');

    const result = await query(`
      SELECT COUNT(*) as count
      FROM lotes_avaliacao
      WHERE status_pagamento = 'aguardando_cobranca'
    `);

    return NextResponse.json({ count: parseInt(result.rows[0]?.count || '0') });
  } catch (error: any) {
    console.error('[ERRO] admin/emissoes/contagem:', error);
    return NextResponse.json(
      { error: error.message },
      { status: error.status || 500 }
    );
  }
}
