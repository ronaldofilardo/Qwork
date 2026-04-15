/**
 * POST /api/suporte/jobs/fechar-ciclos-mensais
 *
 * Job mensal: fecha todos os ciclos de comissão abertos de meses anteriores.
 * Para cada ciclo aberto, vincula as comissões pendentes ao ciclo e muda
 * o status do ciclo para 'fechado'.
 *
 * Executado via cron no dia 1º de cada mês às 00:05.
 * Também pode ser disparado manualmente pelo suporte/admin.
 *
 * Acesso: suporte, admin (+ cron via CRON_SECRET)
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';
import { fecharCiclo, getOrCreateCiclo } from '@/lib/db/comissionamento/ciclos';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Suporte/admin autenticado ou cron via secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const isCron =
      cronSecret && authHeader === `Bearer ${cronSecret}`;

    if (!isCron) {
      await requireRole(['suporte', 'admin'], false);
    }

    // Mês anterior: referência para fechar ciclos vencidos
    const agora = new Date();
    const mesAtualStr = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-01`;

    // 1. Criar ciclos para representantes com comissões sem ciclo em meses passados
    const semCiclo = await query<{ representante_id: number; mes_emissao: string }>(
      `SELECT DISTINCT representante_id, mes_emissao
       FROM comissoes_laudo
       WHERE ciclo_id IS NULL
         AND status NOT IN ('cancelada', 'retida')
         AND mes_emissao < $1::date
       ORDER BY mes_emissao, representante_id`,
      [mesAtualStr]
    );

    for (const row of semCiclo.rows) {
      await getOrCreateCiclo({
        representante_id: row.representante_id,
        mes_referencia: row.mes_emissao,
      });
    }

    // 2. Fechar todos os ciclos abertos de meses anteriores ao atual
    const ciclosAbertos = await query<{ id: number }>(
      `SELECT id FROM ciclos_comissao
       WHERE status = 'aberto'
         AND mes_referencia < $1::date`,
      [mesAtualStr]
    );

    const resultados: Array<{ id: number; ok: boolean; erro?: string }> = [];

    for (const row of ciclosAbertos.rows) {
      const { erro } = await fecharCiclo(row.id);
      resultados.push({ id: row.id, ok: !erro, erro });
    }

    const fechados = resultados.filter((r) => r.ok).length;
    const erros = resultados.filter((r) => !r.ok);

    console.info(
      JSON.stringify({
        event: 'job_fechar_ciclos_mensais',
        ciclos_novos_criados: semCiclo.rows.length,
        ciclos_fechados: fechados,
        erros: erros.length,
        mes_corte: mesAtualStr,
      })
    );

    return NextResponse.json({
      ok: true,
      ciclos_criados: semCiclo.rows.length,
      ciclos_fechados: fechados,
      erros,
    });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Sem permissão' || e.message === 'Não autenticado') {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    console.error('[POST /api/suporte/jobs/fechar-ciclos-mensais]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
