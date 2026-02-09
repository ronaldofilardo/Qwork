/**
 * Enums de status do sistema
 */

export const AVALIACAO_STATUS = {
  INICIADA: 'iniciada',
  EM_ANDAMENTO: 'em_andamento',
  CONCLUIDO: 'concluido',
  INATIVADA: 'inativada',
} as const;

export type AvaliacaoStatus =
  (typeof AVALIACAO_STATUS)[keyof typeof AVALIACAO_STATUS];

export const LOTE_STATUS = {
  RASCUNHO: 'rascunho',
  ATIVO: 'ativo',
  CONCLUIDO: 'concluido',
  CANCELADO: 'cancelado',
  FINALIZADO: 'finalizado',
} as const;

export type LoteStatus = (typeof LOTE_STATUS)[keyof typeof LOTE_STATUS];

export const LAUDO_STATUS = {
  RASCUNHO: 'rascunho',
  EMITIDO: 'emitido',
  ENVIADO: 'enviado',
} as const;

export type LaudoStatus = (typeof LAUDO_STATUS)[keyof typeof LAUDO_STATUS];

export const tomador_STATUS = {
  PENDENTE: 'pendente',
  APROVADO: 'aprovado',
  REJEITADO: 'rejeitado',
  ATIVO: 'ativo',
  INATIVO: 'inativo',
} as const;

export type tomadorStatus =
  (typeof tomador_STATUS)[keyof typeof tomador_STATUS];

export function isStatusValid<T extends string>(
  status: T,
  validStatuses: Record<string, T>
): boolean {
  return Object.values(validStatuses).includes(status);
}
