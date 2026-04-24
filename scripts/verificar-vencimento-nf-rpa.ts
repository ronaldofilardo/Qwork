/**
 * scripts/verificar-vencimento-nf-rpa.ts
 *
 * Verifica ciclos em status 'aguardando_nf_rpa' que ultrapassaram o dia 10
 * do mês seguinte sem envio de NF/RPA. Quando vencidos:
 *   - ciclo muda para 'vencido'
 *   - representante muda para 'apto_bloqueado' (se status='apto')
 *   - data_bloqueio é registrada no ciclo
 *
 * Executar via: npx ts-node scripts/verificar-vencimento-nf-rpa.ts
 * OU via API: POST /api/suporte/jobs/verificar-vencimento-nf-rpa
 *
 * Idealmente agendado para todos os dias entre dia 10-15 de cada mês (cron).
 */

import { query } from '../lib/db';

const DIA_CORTE = 10; // dia do mês — limite para envio de NF/RPA

async function verificarVencimentos(): Promise<void> {
  const agora = new Date();
  const diaAtual = agora.getDate();
  const mesAtual = agora.toISOString().slice(0, 7); // YYYY-MM

  if (diaAtual < DIA_CORTE) {
    console.log(
      `[nf-rpa-vencimento] Dia ${diaAtual} — ainda dentro do prazo. Nenhuma ação.`
    );
    return;
  }

  // Buscar ciclos 'aguardando_nf_rpa' de meses anteriores ao atual
  // (o mês atual ainda está com prazo até o dia DIA_CORTE)
  const result = await query(
    `SELECT c.id, c.representante_id, c.mes_ano
     FROM ciclos_comissao_mensal c
     WHERE c.status = 'aguardando_nf_rpa'
       AND c.mes_ano < $1`,
    [mesAtual]
  );

  if (result.rows.length === 0) {
    console.log('[nf-rpa-vencimento] Nenhum ciclo vencido encontrado.');
    return;
  }

  console.log(
    `[nf-rpa-vencimento] ${result.rows.length} ciclo(s) vencido(s). Processando...`
  );

  for (const row of result.rows as Array<{
    id: number;
    representante_id: number;
    mes_ano: string;
  }>) {
    try {
      // 1. Marcar ciclo como vencido
      await query(
        `UPDATE ciclos_comissao_mensal
         SET status = 'vencido',
             data_bloqueio = NOW(),
             atualizado_em = NOW()
         WHERE id = $1`,
        [row.id]
      );

      // 2. Bloquear representante se ainda estiver 'apto'
      const updated = await query(
        `UPDATE representantes
         SET status = 'apto_bloqueado',
             atualizado_em = NOW()
         WHERE id = $1
           AND status = 'apto'
         RETURNING id`,
        [row.representante_id]
      );

      console.log(
        `  → ciclo id=${row.id} mês=${row.mes_ano} rep=${row.representante_id}`,
        updated.rowCount
          ? '— representante BLOQUEADO'
          : '— representante já em outro status'
      );
    } catch (err) {
      console.error(`  ✗ Erro ao processar ciclo id=${row.id}:`, err);
    }
  }

  console.log('[nf-rpa-vencimento] Processamento concluído.');
}

verificarVencimentos()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[nf-rpa-vencimento] Erro fatal:', err);
    process.exit(1);
  });
