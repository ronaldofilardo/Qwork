/**
 * Máquina de Estados para Representantes
 * Gerencia transições válidas no ciclo de vida do representante.
 */

import type { StatusRepresentante } from '@/lib/types/comissionamento';

export interface RepresentanteTransitionContext {
  admin_cpf?: string;
  motivo?: string;
  documentos_validados?: boolean;
}

/**
 * Transições válidas entre estados do representante com guards
 */
const REPRESENTANTE_TRANSITIONS: Record<
  StatusRepresentante,
  Partial<
    Record<
      StatusRepresentante,
      (ctx?: RepresentanteTransitionContext) => boolean
    >
  >
> = {
  ativo: {
    apto_pendente: () => true, // rep submete documentação
    suspenso: (ctx) => !!ctx?.admin_cpf && !!ctx?.motivo,
    desativado: (ctx) => !!ctx?.admin_cpf && !!ctx?.motivo,
  },
  apto_pendente: {
    apto: (ctx) => !!ctx?.admin_cpf && !!ctx?.documentos_validados,
    ativo: (ctx) => !!ctx?.admin_cpf, // documentação rejeitada, volta
    rejeitado: (ctx) => !!ctx?.admin_cpf && !!ctx?.motivo,
    suspenso: (ctx) => !!ctx?.admin_cpf && !!ctx?.motivo,
  },
  apto: {
    suspenso: (ctx) => !!ctx?.admin_cpf && !!ctx?.motivo,
    desativado: (ctx) => !!ctx?.admin_cpf && !!ctx?.motivo,
  },
  aprovacao_comercial: {
    ativo: (ctx) => !!ctx?.admin_cpf,
    rejeitado: (ctx) => !!ctx?.admin_cpf && !!ctx?.motivo,
  },
  aguardando_senha: {
    ativo: () => true, // senha definida
  },
  suspenso: {
    ativo: (ctx) => !!ctx?.admin_cpf, // reativação
    apto: (ctx) => !!ctx?.admin_cpf, // reativação mantendo aptidão
    desativado: (ctx) => !!ctx?.admin_cpf && !!ctx?.motivo,
  },
  desativado: {
    // Estado final — sem transições de saída
  },
  rejeitado: {
    // Estado final — sem transições de saída
  },
  expirado: {
    // Estado final — sem transições de saída
  },
};

/**
 * Valida se uma transição de status de representante é permitida
 */
export function canTransitionRepresentante(
  currentStatus: StatusRepresentante,
  nextStatus: StatusRepresentante,
  context?: RepresentanteTransitionContext
): boolean {
  const allowedTransitions = REPRESENTANTE_TRANSITIONS[currentStatus];
  if (!allowedTransitions) return false;

  const validator = allowedTransitions[nextStatus];
  if (!validator) return false;

  return validator(context);
}

/**
 * Obtém próximos estados válidos a partir do estado atual
 */
export function getNextValidRepresentanteStates(
  currentStatus: StatusRepresentante
): StatusRepresentante[] {
  const transitions = REPRESENTANTE_TRANSITIONS[currentStatus];
  return transitions ? (Object.keys(transitions) as StatusRepresentante[]) : [];
}

/**
 * Valida transição e retorna mensagem de erro se inválida
 */
export function validateRepresentanteTransition(
  currentStatus: StatusRepresentante,
  nextStatus: StatusRepresentante,
  context?: RepresentanteTransitionContext
): { valido: boolean; erro?: string } {
  const finais: StatusRepresentante[] = ['desativado', 'rejeitado', 'expirado'];
  if (finais.includes(currentStatus)) {
    return {
      valido: false,
      erro: `Representante no estado '${currentStatus}' não pode ser alterado (estado final)`,
    };
  }

  if (!canTransitionRepresentante(currentStatus, nextStatus, context)) {
    const validos = getNextValidRepresentanteStates(currentStatus);
    return {
      valido: false,
      erro: `Transição de '${currentStatus}' para '${nextStatus}' não é permitida. Estados válidos: ${validos.join(', ')}`,
    };
  }

  return { valido: true };
}
