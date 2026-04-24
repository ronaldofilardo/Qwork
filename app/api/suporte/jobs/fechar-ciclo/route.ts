/**
 * POST /api/suporte/jobs/fechar-ciclo
 *
 * Dispara manualmente o fechamento de ciclos de comissão abertos do mês anterior.
 * Normalmente executado via cron no dia 1º de cada mês.
 *
 * Acesso: suporte, admin
 */
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST(): Promise<NextResponse> {
  try {
    const session = await requireRole(['suporte', 'admin'], false);

    const mesAtual = new Date().toISOString().slice(0, 7);

    const result = await query(
      `UPDATE ciclos_comissao_mensal
       SET status        = 'aguardando_nf_rpa',
           atualizado_em = NOW()
       WHERE status  = 'aberto'
         AND mes_ano < $1
       RETURNING id, representante_id, mes_ano`,
      [mesAtual]
    );

    console.info(
      JSON.stringify({
        event: 'job_fechar_ciclo_comissao',
        ciclos_fechados: result.rowCount,
        mes_atual: mesAtual,
        by_cpf: session.cpf,
      })
    );

    return NextResponse.json({
      ok: true,
      ciclos_fechados: result.rowCount ?? 0,
      detalhes: result.rows,
    });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Sem permissão' || e.message === 'Não autenticado') {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    console.error('[POST /api/suporte/jobs/fechar-ciclo]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
