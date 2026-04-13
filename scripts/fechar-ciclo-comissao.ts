/**
 * scripts/fechar-ciclo-comissao.ts
 *
 * Fecha o ciclo do mês anterior: todos os ciclos com status 'aberto'
 * que pertencem a meses anteriores ao atual passam para
 * 'aguardando_nf_rpa', sinalizando que o representante deve enviar NF.
 *
 * Executar via: npx ts-node scripts/fechar-ciclo-comissao.ts
 * OU via API: POST /api/suporte/jobs/fechar-ciclo
 *
 * Idealmente agendado para o dia 1º de cada mês (cron).
 */

import { query } from '../lib/db';

async function fecharCiclosAbertos(): Promise<void> {
  const mesAtual = new Date().toISOString().slice(0, 7); // YYYY-MM

  console.log(`[fechar-ciclo] Fechando ciclos anteriores a ${mesAtual}...`);

  const result = await query(
    `UPDATE ciclos_comissao_mensal
     SET status        = 'aguardando_nf_rpa',
         atualizado_em = NOW()
     WHERE status  = 'aberto'
       AND mes_ano < $1
     RETURNING id, representante_id, mes_ano`,
    [mesAtual]
  );

  console.log(`[fechar-ciclo] ${result.rowCount ?? 0} ciclos fechados.`);
  for (const row of result.rows) {
    console.log(
      `  → ciclo id=${row.id} rep=${row.representante_id} mês=${row.mes_ano}`
    );
  }
}

fecharCiclosAbertos()
  .then(() => {
    console.log('[fechar-ciclo] Concluído.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('[fechar-ciclo] Erro:', err);
    process.exit(1);
  });
