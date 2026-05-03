/**
 * ⚠️ FUNÇÃO LEGADA - NÃO UTILIZAR
 *
 * O cron de emissão automática foi DESABILITADO por decisão operacional.
 *
 * EMISSÃO AGORA É IMEDIATA:
 * - Quando lote muda para status='concluido'
 * - Acionada automaticamente por recalcularStatusLote() em lib/lotes.ts
 * - Usa bypass RLS para operações de sistema
 *
 * Esta função é mantida apenas para compatibilidade com código legado.
 */
export function triggerAutoLaudoCron(): void {
  console.warn(
    '[AUTO-TRIGGER] ⚠️ FUNÇÃO LEGADA: Cron de emissão desabilitado. Emissão é IMEDIATA ao concluir lote.'
  );
  return;
}
