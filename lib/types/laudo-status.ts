/**
 * Máquina de Estados do Laudo
 *
 * Define os possíveis estados de um laudo e suas transições válidas.
 *
 * Fluxo: rascunho → pdf_gerado → (upload) → enviado
 */

/**
 * Status possíveis de um laudo
 */
export enum StatusLaudo {
  RASCUNHO = 'rascunho',
  PDF_GERADO = 'pdf_gerado',
  EMITIDO = 'emitido',
  ENVIADO = 'enviado',
  ERRO = 'erro',
}

/**
 * Tipo de status do laudo (string literal)
 */
export type StatusLaudoType =
  | 'rascunho'
  | 'pdf_gerado'
  | 'emitido'
  | 'enviado'
  | 'erro';

/**
 * Transições válidas da máquina de estados
 * Cada status só pode transitar para os estados listados
 */
export const TRANSICOES_VALIDAS_LAUDO: Record<
  StatusLaudoType,
  StatusLaudoType[]
> = {
  rascunho: ['pdf_gerado', 'emitido', 'erro'],
  pdf_gerado: ['emitido', 'rascunho', 'erro'],
  emitido: ['enviado', 'erro'],
  enviado: [],
  erro: ['rascunho'],
};

/**
 * Validar se uma transição de estado é válida
 */
export function validarTransicaoStatusLaudo(
  statusAtual: StatusLaudoType,
  novoStatus: StatusLaudoType
): { valido: boolean; erro?: string } {
  // Estado final 'enviado' não pode transitar
  if (statusAtual === 'enviado') {
    return {
      valido: false,
      erro: `Laudo no estado '${statusAtual}' não pode ser alterado`,
    };
  }

  // Verificar se transição é permitida
  const transicoesPermitidas = TRANSICOES_VALIDAS_LAUDO[statusAtual] ?? [];
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
export function getDescricaoStatusLaudo(status: StatusLaudoType): string {
  const descricoes: Record<StatusLaudoType, string> = {
    rascunho: 'Rascunho',
    pdf_gerado: 'PDF Gerado',
    emitido: 'Emitido',
    enviado: 'Enviado',
    erro: 'Erro na Emissão',
  };

  return descricoes[status] ?? status;
}

/**
 * Validar se status é válido
 */
export function isStatusLaudoValido(status: string): status is StatusLaudoType {
  return [
    'rascunho',
    'pdf_gerado',
    'emitido',
    'enviado',
    'erro',
  ].includes(status);
}

/**
 * Obter cor para exibição do status (UI)
 */
export function getCorStatusLaudo(status: StatusLaudoType): string {
  const cores: Record<StatusLaudoType, string> = {
    rascunho: 'bg-gray-100 text-gray-800 border-gray-300',
    pdf_gerado: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    emitido: 'bg-green-100 text-green-800 border-green-300',
    enviado: 'bg-blue-100 text-blue-800 border-blue-300',
    erro: 'bg-red-100 text-red-800 border-red-300',
  };

  return cores[status] ?? 'bg-gray-100 text-gray-800 border-gray-300';
}

/**
 * Verificar se laudo pode ser editado
 */
export function podeEditarLaudo(status: StatusLaudoType): boolean {
  return status === 'rascunho' || status === 'erro';
}

/**
 * Verificar se laudo pode ser assinado digitalmente (fluxo legado)
 * @deprecated sem uso ativo desde a remoção do ZapSign
 */
export function podeAssinarLaudo(_status: StatusLaudoType): boolean {
  return false;
}

/**
 * Verificar se laudo pode ser enviado (fluxo legado)
 */
export function podeEnviarLaudo(status: StatusLaudoType): boolean {
  return status === 'emitido';
}

/**
 * Verificar se laudo está em processo de assinatura
 * @deprecated sempre retorna false desde a remoção do ZapSign
 */
export function laudoAguardandoAssinatura(_status: StatusLaudoType): boolean {
  return false;
}

/**
 * Verificar se laudo está finalizado (gerado ou assinado)
 */
export function laudoFinalizado(status: StatusLaudoType): boolean {
  return (
    status === 'pdf_gerado' ||
    status === 'emitido' ||
    status === 'enviado'
  );
}

/**
 * Verificar se laudo pode ser reemitido
 */
export function podeReemitirLaudo(status: StatusLaudoType): boolean {
  return status === 'erro';
}

/** Status imutáveis — não podem ser regredidos */
export const STATUS_IMUTAVEL: StatusLaudoType[] = [
  'pdf_gerado',

  'emitido',
  'enviado',
];
