/**
 * POST /api/suporte/jobs/verificar-vencimento-nf-rpa
 *
 * Verifica ciclos vencidos (sem NF/RPA após dia 10) e bloqueia representantes.
 * Normalmente executado via cron entre os dias 11-15 de cada mês.
 *
 * Acesso: suporte, admin
 */
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

const DIA_CORTE = 10;

export async function POST(): Promise<NextResponse> {
  try {
    const session = await requireRole(['suporte', 'admin'], false);

    const agora = new Date();
    const diaAtual = agora.getDate();
    const mesAtual = agora.toISOString().slice(0, 7);

    if (diaAtual < DIA_CORTE) {
      return NextResponse.json({
        ok: true,
        message: `Dia ${diaAtual} — dentro do prazo. Nenhuma ação executada.`,
        ciclos_vencidos: 0,
        representantes_bloqueados: 0,
      });
    }

    const ciclosRes = await query(
      `SELECT id, representante_id, mes_ano
       FROM ciclos_comissao_mensal
       WHERE status = 'aguardando_nf_rpa'
         AND mes_ano < $1`,
      [mesAtual]
    );

    let ciclosVencidos = 0;
    let repsBloqueados = 0;

    for (const row of ciclosRes.rows as Array<{
      id: number;
      representante_id: number;
      mes_ano: string;
    }>) {
      await query(
        `UPDATE ciclos_comissao_mensal
         SET status = 'vencido',
             data_bloqueio = NOW(),
             atualizado_em = NOW()
         WHERE id = $1`,
        [row.id]
      );
      ciclosVencidos++;

      const upd = await query(
        `UPDATE representantes
         SET status = 'apto_bloqueado',
             atualizado_em = NOW()
         WHERE id = $1 AND status = 'apto'
         RETURNING id`,
        [row.representante_id]
      );
      if ((upd.rowCount ?? 0) > 0) repsBloqueados++;
    }

    console.info(
      JSON.stringify({
        event: 'job_verificar_vencimento_nf_rpa',
        ciclos_vencidos: ciclosVencidos,
        representantes_bloqueados: repsBloqueados,
        mes_atual: mesAtual,
        by_cpf: session.cpf,
      })
    );

    return NextResponse.json({
      ok: true,
      ciclos_vencidos: ciclosVencidos,
      representantes_bloqueados: repsBloqueados,
    });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Sem permissão' || e.message === 'Não autenticado') {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    console.error('[POST /api/suporte/jobs/verificar-vencimento-nf-rpa]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
