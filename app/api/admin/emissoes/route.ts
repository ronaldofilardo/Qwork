import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireRole('admin');

    const result = await query(`
      SELECT * FROM v_solicitacoes_emissao
      ORDER BY 
        CASE 
          WHEN status_pagamento = 'aguardando_cobranca' THEN 1
          WHEN status_pagamento = 'aguardando_pagamento' THEN 2
          WHEN status_pagamento = 'pago' THEN 3
          ELSE 4
        END,
        solicitacao_emissao_em DESC
    `);

    return NextResponse.json({
      solicitacoes: result.rows,
      total: result.rows.length,
    });
  } catch (error: any) {
    console.error('[ERRO] API admin/emissoes:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao carregar solicitações' },
      { status: error.status || 500 }
    );
  }
}
