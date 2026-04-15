/**
 * POST /api/suporte/jobs/bloquear-sem-nf
 *
 * Job: suspende representantes que têm ciclos fechados (status='fechado')
 * sem NF enviada após o prazo de envio (dia 11 do mês seguinte ao ciclo).
 *
 * Lógica: ciclo.mes_referencia = mês M → prazo de envio = dia 10 de M+1.
 * Se hoje >= dia 11 de M+1 e ciclo ainda em 'fechado' → suspende o rep.
 *
 * Executado via cron no dia 11 de cada mês às 00:15.
 * Pode ser disparado manualmente pelo suporte/admin.
 *
 * Acesso: suporte, admin (+ cron via CRON_SECRET)
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`;

    if (!isCron) {
      await requireRole(['suporte', 'admin'], false);
    }

    // Calcular data-limite: ciclos cujo prazo de NF expirou (dia 10 do mês seguinte)
    // Prazo expirado = ciclo.mes_referencia + 1 mês + 10 dias < hoje
    const hoje = new Date();
    const prazoLimiteStr = hoje.toISOString().slice(0, 10); // YYYY-MM-DD

    // Ciclos fechados cujo prazo (11 dias após início do mês seguinte ao ciclo) já passou
    const ciclosVencidos = await query<{
      id: number;
      representante_id: number;
    }>(
      `SELECT id, representante_id
       FROM ciclos_comissao
       WHERE status = 'fechado'
         AND (mes_referencia + INTERVAL '1 month' + INTERVAL '10 days') < $1::date`,
      [prazoLimiteStr]
    );

    if (ciclosVencidos.rows.length === 0) {
      return NextResponse.json({
        ok: true,
        suspensos: 0,
        message: 'Nenhum representante a suspender.',
      });
    }

    const repIds = [
      ...new Set(ciclosVencidos.rows.map((r) => r.representante_id)),
    ];

    // Suspender representantes (somente os que não estão já suspensos/desativados/rejeitados)
    const suspensos = await query<{ id: number; nome: string }>(
      `UPDATE representantes
       SET status = 'suspenso', atualizado_em = NOW()
       WHERE id = ANY($1::int[])
         AND status NOT IN ('suspenso', 'desativado', 'rejeitado')
       RETURNING id, nome`,
      [repIds]
    );

    // Congelar comissões pendentes dos reps suspensos
    if (suspensos.rows.length > 0) {
      const suspensoIds = suspensos.rows.map((r) => r.id);
      await query(
        `UPDATE comissoes_laudo
         SET status = 'congelada_rep_suspenso',
             motivo_congelamento = 'rep_suspenso',
             atualizado_em = NOW()
         WHERE representante_id = ANY($1::int[])
           AND status = 'pendente_consolidacao'`,
        [suspensoIds]
      );
    }

    console.info(
      JSON.stringify({
        event: 'job_bloquear_sem_nf',
        ciclos_vencidos: ciclosVencidos.rows.length,
        reps_suspensos: suspensos.rows.length,
        nomes: suspensos.rows.map((r) => r.nome),
        prazo_limite: prazoLimiteStr,
      })
    );

    return NextResponse.json({
      ok: true,
      ciclos_vencidos: ciclosVencidos.rows.length,
      suspensos: suspensos.rows.length,
      detalhes: suspensos.rows,
    });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Sem permissão' || e.message === 'Não autenticado') {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    console.error('[POST /api/suporte/jobs/bloquear-sem-nf]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
