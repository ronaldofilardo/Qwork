/**
 * Máquina de Estados para Comissões
 * Gerencia transições válidas no fluxo de comissionamento.
 *
 * IMPORTANTE: Toda rota que altera status de comissão DEVE usar
 * `canTransitionComissao()` antes de fazer o UPDATE.
 */

import type { StatusComissao } from '@/lib/types/comissionamento';

export interface ComissaoTransitionContext {
  admin_cpf?: string;
  motivo?: string;
  nota_fiscal?: string;
  valor_pago?: number;
}

/**
 * Transições válidas entre estados de comissão com guards
 */
const COMMISSION_TRANSITIONS: Record<
  StatusComissao,
  Partial<Record<StatusComissao, (ctx?: ComissaoTransitionContext) => boolean>>
> = {
  retida: {
    congelada_aguardando_admin: (ctx) => !!ctx?.admin_cpf,
    liberada: (ctx) => !!ctx?.admin_cpf,
    cancelada: (ctx) => !!ctx?.admin_cpf,
  },
  congelada_aguardando_admin: {
    retida: (ctx) => !!ctx?.admin_cpf, // descongelar → volta para retida
    liberada: (ctx) => !!ctx?.admin_cpf,
    cancelada: (ctx) => !!ctx?.admin_cpf,
  },
  liberada: {
    paga: (ctx) => !!ctx?.admin_cpf,
    congelada_aguardando_admin: (ctx) => !!ctx?.admin_cpf && !!ctx?.motivo,
    cancelada: (ctx) => !!ctx?.admin_cpf,
  },
  paga: {
    // Estado final — sem transições de saída
  },
  cancelada: {
    // Estado final — sem transições de saída
  },
};

/**
 * Valida se uma transição de status de comissão é permitida
 */
export function canTransitionComissao(
  currentStatus: StatusComissao,
  nextStatus: StatusComissao,
  context?: ComissaoTransitionContext
): boolean {
  const allowedTransitions = COMMISSION_TRANSITIONS[currentStatus];
  if (!allowedTransitions) return false;

  const validator = allowedTransitions[nextStatus];
  if (!validator) return false;

  return validator(context);
}

/**
 * Obtém próximos estados válidos a partir do estado atual
 */
export function getNextValidComissaoStates(
  currentStatus: StatusComissao
): StatusComissao[] {
  const transitions = COMMISSION_TRANSITIONS[currentStatus];
  return transitions ? (Object.keys(transitions) as StatusComissao[]) : [];
}

/**
 * Valida transição e retorna mensagem de erro se inválida
 */
export function validateComissaoTransition(
  currentStatus: StatusComissao,
  nextStatus: StatusComissao,
  context?: ComissaoTransitionContext
): { valido: boolean; erro?: string } {
  if (currentStatus === 'paga' || currentStatus === 'cancelada') {
    return {
      valido: false,
      erro: `Comissão no estado '${currentStatus}' não pode ser alterada (estado final)`,
    };
  }

  if (!canTransitionComissao(currentStatus, nextStatus, context)) {
    const validos = getNextValidComissaoStates(currentStatus);
    return {
      valido: false,
      erro: `Transição de '${currentStatus}' para '${nextStatus}' não é permitida. Estados válidos: ${validos.join(', ')}`,
    };
  }

  return { valido: true };
}
