/**
 * Máquina de Estados da Avaliação
 *
 * Define os possíveis estados de uma avaliação e suas transições válidas.
 * Padronização: usa 'concluida' (feminino) para diferenciar de lotes que usam 'concluido'.
 */

/**
 * Status possíveis de uma avaliação
 */
export enum StatusAvaliacao {
  RASCUNHO = 'rascunho',
  INICIADA = 'iniciada',
  EM_ANDAMENTO = 'em_andamento',
  CONCLUIDA = 'concluida',
  INATIVADA = 'inativada',
}

/**
 * Tipo de status da avaliação (string literal)
 */
export type StatusAvaliacaoType =
  | 'rascunho'
  | 'iniciada'
  | 'em_andamento'
  | 'concluida'
  | 'concluido' // Legado - manter para compatibilidade
  | 'inativada';

/**
 * Status legado (mapeamento para migração)
 * DEPRECATED: Usar apenas para conversão de dados antigos
 * Nota: 'concluido' era o valor antigo, agora normalizamos para 'concluida'
 */
export const STATUS_LEGADO_MAP: Record<string, StatusAvaliacaoType> = {
  concluido: 'concluida', // Masculino legado → Feminino correto
  concluded: 'concluida',
  finished: 'concluida',
};

/**
 * Transições válidas da máquina de estados
 * Cada status só pode transitar para os estados listados
 */
export const TRANSICOES_VALIDAS_AVALIACAO: Record<
  StatusAvaliacaoType,
  StatusAvaliacaoType[]
> = {
  rascunho: ['iniciada', 'inativada'],
  iniciada: ['em_andamento', 'concluida', 'inativada'],
  em_andamento: ['concluida', 'inativada'],
  concluida: [], // Estado final (não pode mais alterar)
  concluido: [], // Legado - também estado final
  inativada: [], // Estado final
};

/**
 * Validar se uma transição de estado é válida
 */
export function validarTransicaoStatusAvaliacao(
  statusAtual: StatusAvaliacaoType,
  novoStatus: StatusAvaliacaoType
): { valido: boolean; erro?: string } {
  // Estados finais não podem transitar
  if (
    statusAtual === 'concluida' ||
    statusAtual === 'concluido' ||
    statusAtual === 'inativada'
  ) {
    return {
      valido: false,
      erro: `Avaliação no estado '${statusAtual}' não pode ser alterada`,
    };
  }

  // Verificar se transição é permitida
  const transicoesPermitidas = TRANSICOES_VALIDAS_AVALIACAO[statusAtual];
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
export function getDescricaoStatusAvaliacao(
  status: StatusAvaliacaoType
): string {
  const descricoes: Record<StatusAvaliacaoType, string> = {
    rascunho: 'Rascunho',
    iniciada: 'Iniciada',
    em_andamento: 'Em Andamento',
    concluida: 'Concluída',
    concluido: 'Concluída', // Legado - mesmo que concluida
    inativada: 'Inativada',
  };

  return descricoes[status] || status;
}

/**
 * Validar se status é válido
 */
export function isStatusAvaliacaoValido(
  status: string
): status is StatusAvaliacaoType {
  return Object.values(StatusAvaliacao).includes(status as StatusAvaliacao);
}

/**
 * Obter cor para exibição do status (UI)
 */
export function getCorStatusAvaliacao(status: StatusAvaliacaoType): string {
  const cores: Record<StatusAvaliacaoType, string> = {
    rascunho: 'bg-gray-100 text-gray-800 border-gray-300',
    iniciada: 'bg-blue-100 text-blue-800 border-blue-300',
    em_andamento: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    concluida: 'bg-green-100 text-green-800 border-green-300',
    concluido: 'bg-green-100 text-green-800 border-green-300', // Legado - mesmo que concluida
    inativada: 'bg-red-100 text-red-800 border-red-300',
  };

  return cores[status] || 'bg-gray-100 text-gray-800 border-gray-300';
}

/**
 * Verificar se avaliação está em progresso
 */
export function avaliacaoEmProgresso(status: StatusAvaliacaoType): boolean {
  return status === 'iniciada' || status === 'em_andamento';
}

/**
 * Verificar se avaliação está finalizada (concluída ou inativada)
 */
export function avaliacaoFinalizada(status: StatusAvaliacaoType): boolean {
  return status === 'concluida' || status === 'inativada';
}

/**
 * Verificar se avaliação pode ser editada
 */
export function podeEditarAvaliacao(status: StatusAvaliacaoType): boolean {
  return status === 'iniciada' || status === 'em_andamento';
}

/**
 * Verificar se avaliação pode ser inativada
 */
export function podeInativarAvaliacao(status: StatusAvaliacaoType): boolean {
  return status !== 'concluida' && status !== 'inativada';
}

/**
 * Normalizar status legado para o padrão atual
 */
export function normalizarStatusAvaliacao(
  status: string
): StatusAvaliacaoType | null {
  // Se já é um status válido, retornar
  if (isStatusAvaliacaoValido(status)) {
    return status as StatusAvaliacaoType;
  }

  // Tentar mapear status legado
  const statusNormalizado = STATUS_LEGADO_MAP[status.toLowerCase()];
  if (statusNormalizado) {
    return statusNormalizado;
  }

  return null;
}
