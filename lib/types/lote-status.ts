/**
 * Máquina de Estados do Lote
 *
 * Define os possíveis estados de um lote de avaliações e suas transições válidas.
 *
 * IMPORTANTE: Sincronização entre status e fila_emissao
 * - Quando lote.status = 'emissao_solicitada', DEVE existir registro em fila_emissao
 * - A inserção em fila_emissao DEVE atualizar lote.status para 'emissao_solicitada'
 * - Esta consistência é garantida por transação e validações
 *
 * Padronização: usa 'concluido' (sem acento, forma masculina) para consistência
 * com avaliações e laudos.
 */

/**
 * Status possíveis de um lote
 */
export enum StatusLote {
  RASCUNHO = 'rascunho',
  ATIVO = 'ativo',
  CONCLUIDO = 'concluido',
  EMISSAO_SOLICITADA = 'emissao_solicitada',
  EMISSAO_EM_ANDAMENTO = 'emissao_em_andamento',
  LAUDO_EMITIDO = 'laudo_emitido',
  CANCELADO = 'cancelado',
  FINALIZADO = 'finalizado',
}

/**
 * Tipo de status do lote (string literal)
 */
export type StatusLoteType =
  | 'rascunho'
  | 'ativo'
  | 'concluido'
  | 'emissao_solicitada'
  | 'emissao_em_andamento'
  | 'laudo_emitido'
  | 'cancelado'
  | 'finalizado';

/**
 * Transições válidas da máquina de estados
 * Cada status só pode transitar para os estados listados
 */
export const TRANSICOES_VALIDAS: Record<StatusLoteType, StatusLoteType[]> = {
  rascunho: ['ativo', 'cancelado'],
  ativo: ['concluido', 'cancelado'],
  concluido: ['emissao_solicitada', 'cancelado'],
  emissao_solicitada: ['emissao_em_andamento', 'concluido', 'cancelado'],
  emissao_em_andamento: ['laudo_emitido', 'emissao_solicitada', 'cancelado'],
  laudo_emitido: ['finalizado'],
  cancelado: [], // Estado final
  finalizado: [], // Estado final
};

/**
 * Validar se uma transição de estado é válida
 */
export function validarTransicaoStatus(
  statusAtual: StatusLoteType,
  novoStatus: StatusLoteType
): { valido: boolean; erro?: string } {
  // Estados finais não podem transitar
  if (statusAtual === 'cancelado' || statusAtual === 'finalizado') {
    return {
      valido: false,
      erro: `Lote no estado '${statusAtual}' não pode ser alterado`,
    };
  }

  // Verificar se transição é permitida
  const transicoesPermitidas = TRANSICOES_VALIDAS[statusAtual];
  if (!transicoesPermitidas.includes(novoStatus)) {
    return {
      valido: false,
      erro: `Transição de '${statusAtual}' para '${novoStatus}' não é permitida. Estados permitidos: ${transicoesPermitidas.join(', ')}`,
    };
  }

  return { valido: true };
}

/**
 * Obter descrição legível do status
 */
export function getDescricaoStatus(status: StatusLoteType): string {
  const descricoes: Record<StatusLoteType, string> = {
    rascunho: 'Rascunho',
    ativo: 'Ativo',
    concluido: 'Concluído',
    emissao_solicitada: 'Emissão Solicitada',
    emissao_em_andamento: 'Emissão em Andamento',
    laudo_emitido: 'Laudo Emitido',
    cancelado: 'Cancelado',
    finalizado: 'Finalizado',
  };

  return descricoes[status] || status;
}

/**
 * Validar se status é válido
 */
export function isStatusValido(status: string): status is StatusLoteType {
  return Object.values(StatusLote).includes(status as StatusLote);
}

/**
 * Obter cor para exibição do status (UI)
 */
export function getCorStatus(status: StatusLoteType): string {
  const cores: Record<StatusLoteType, string> = {
    rascunho: 'bg-gray-100 text-gray-800 border-gray-300',
    ativo: 'bg-blue-100 text-blue-800 border-blue-300',
    concluido: 'bg-green-100 text-green-800 border-green-300',
    emissao_solicitada: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    emissao_em_andamento: 'bg-orange-100 text-orange-800 border-orange-300',
    laudo_emitido: 'bg-purple-100 text-purple-800 border-purple-300',
    cancelado: 'bg-red-100 text-red-800 border-red-300',
    finalizado: 'bg-teal-100 text-teal-800 border-teal-300',
  };

  return cores[status] || 'bg-gray-100 text-gray-800 border-gray-300';
}

/**
 * Verificar se lote pode ter ação de emissão
 */
export function podeEmitirLaudo(status: StatusLoteType): boolean {
  return status === 'emissao_solicitada';
}

/**
 * Verificar se lote pode ser editado
 */
export function podeEditarLote(status: StatusLoteType): boolean {
  return status === 'rascunho' || status === 'ativo';
}

/**
 * Verificar se lote permite adicionar avaliações
 */
export function podeAdicionarAvaliacoes(status: StatusLoteType): boolean {
  return status === 'ativo';
}
