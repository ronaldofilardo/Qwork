/**
 * Módulo centralizado de tipos e constantes de status
 *
 * Este módulo exporta todos os tipos, enums e funções de validação
 * relacionados aos status de Avaliação, Lote e Laudo.
 *
 * Uso recomendado:
 * ```typescript
 * import { StatusAvaliacao, StatusLote, StatusLaudo } from '@/lib/types/status';
 * ```
 */

// Re-exportar tudo de avaliacao-status
export {
  StatusAvaliacao,
  type StatusAvaliacaoType,
  STATUS_LEGADO_MAP,
  TRANSICOES_VALIDAS_AVALIACAO,
  validarTransicaoStatusAvaliacao,
  getDescricaoStatusAvaliacao,
  isStatusAvaliacaoValido,
  getCorStatusAvaliacao,
  avaliacaoEmProgresso,
  avaliacaoFinalizada,
  podeEditarAvaliacao,
  podeInativarAvaliacao,
  normalizarStatusAvaliacao,
} from './avaliacao-status';

// Re-exportar tudo de lote-status
export {
  StatusLote,
  type StatusLoteType,
  TRANSICOES_VALIDAS,
  validarTransicaoStatus,
  getDescricaoStatus,
  isStatusValido,
  getCorStatus,
  podeEmitirLaudo,
  podeEditarLote,
  podeAdicionarAvaliacoes,
} from './lote-status';

// Re-exportar tudo de laudo-status
export {
  StatusLaudo,
  type StatusLaudoType,
  TRANSICOES_VALIDAS_LAUDO,
  validarTransicaoStatusLaudo,
  getDescricaoStatusLaudo,
  isStatusLaudoValido,
  getCorStatusLaudo,
  podeEditarLaudo,
  podeEnviarLaudo,
  laudoFinalizado,
  podeReemitirLaudo,
} from './laudo-status';
