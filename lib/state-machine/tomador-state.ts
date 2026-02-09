/**
 * Máquina de Estados para Tomadores
 * Gerencia transições válidas no fluxo de contratação
 */

export type TomadorStatus =
  | 'cadastro_inicial'
  | 'aguardando_contrato'
  | 'contrato_gerado'
  | 'aguardando_pagamento'
  | 'pagamento_confirmado'
  | 'aprovado'
  | 'rejeitado'
  | 'em_reanalise';

export type TipoPlano = 'fixo' | 'personalizado';

export interface TomadorState {
  status: TomadorStatus;
  tipo_plano?: TipoPlano;
  pagamento_confirmado: boolean;
  contrato_aceito: boolean;
  recibo_gerado: boolean;
  ativa: boolean;
}

export interface TransitionContext {
  admin_cpf?: string;
  contrato_id?: number;
  pagamento_id?: number;
  recibo_id?: number;
  motivo?: string;
}

/**
 * Define transições válidas entre estados
 */
const STATE_TRANSITIONS: Record<
  TomadorStatus,
  Partial<Record<TomadorStatus, (ctx?: TransitionContext) => boolean>>
> = {
  cadastro_inicial: {
    aguardando_contrato: () => true,
    aguardando_pagamento: (ctx) => !!ctx?.contrato_id, // Plano fixo: vai direto para pagamento após aceite
    rejeitado: (ctx) => !!ctx?.admin_cpf && !!ctx?.motivo,
  },
  aguardando_contrato: {
    contrato_gerado: (ctx) => !!ctx?.contrato_id,
    rejeitado: (ctx) => !!ctx?.admin_cpf && !!ctx?.motivo,
  },
  contrato_gerado: {
    aguardando_pagamento: () => true, // Após aceite do contrato
    rejeitado: (ctx) => !!ctx?.admin_cpf && !!ctx?.motivo,
  },
  aguardando_pagamento: {
    pagamento_confirmado: (ctx) => !!ctx?.pagamento_id,
    em_reanalise: (ctx) => !!ctx?.admin_cpf,
    rejeitado: (ctx) => !!ctx?.admin_cpf && !!ctx?.motivo,
  },
  pagamento_confirmado: {
    // Transição automática: pagamento confirmado + contrato aceito = aprovação automática
    // recibo_id é opcional (gerado sob demanda após ativação)
    aprovado: () => true,
  },
  aprovado: {
    em_reanalise: (ctx) => !!ctx?.admin_cpf && !!ctx?.motivo,
  },
  rejeitado: {
    em_reanalise: (ctx) => !!ctx?.admin_cpf,
  },
  em_reanalise: {
    aguardando_contrato: () => true,
    aprovado: (ctx) => !!ctx?.admin_cpf,
    rejeitado: (ctx) => !!ctx?.admin_cpf && !!ctx?.motivo,
  },
};

/**
 * Valida se uma transição de estado é permitida
 */
export function canTransition(
  currentStatus: TomadorStatus,
  nextStatus: TomadorStatus,
  context?: TransitionContext
): boolean {
  const allowedTransitions = STATE_TRANSITIONS[currentStatus];
  if (!allowedTransitions) return false;

  const validator = allowedTransitions[nextStatus];
  if (!validator) return false;

  return validator(context);
}

/**
 * Obtém próximos estados válidos a partir do estado atual
 */
export function getNextValidStates(
  currentStatus: TomadorStatus
): TomadorStatus[] {
  const transitions = STATE_TRANSITIONS[currentStatus];
  return transitions ? (Object.keys(transitions) as TomadorStatus[]) : [];
}

/**
 * Valida estado completo do tomador para ativação
 * recibo_gerado é opcional: pode ser gerado sob demanda após ativação
 */
export function canActivateAccount(state: TomadorState): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (state.status !== 'aprovado') {
    errors.push('Status deve ser "aprovado"');
  }

  if (!state.pagamento_confirmado) {
    errors.push('Pagamento deve estar confirmado');
  }

  if (!state.contrato_aceito) {
    errors.push('Contrato deve estar aceito');
  }

  // recibo_gerado não é mais obrigatório - pode ser gerado sob demanda

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Fluxo de estados para Plano Fixo
 */
export const FLUXO_PLANO_FIXO: TomadorStatus[] = [
  'cadastro_inicial',
  'aguardando_contrato', // Sistema gera contrato
  'contrato_gerado', // Contrato gerado
  'aguardando_pagamento', // Após aceite
  'pagamento_confirmado', // Pagamento realizado
  'aprovado', // Admin aprova e libera login
];

/**
 * Fluxo de estados para Plano Personalizado
 */
export const FLUXO_PLANO_PERSONALIZADO: TomadorStatus[] = [
  'cadastro_inicial',
  'aguardando_contrato', // Admin preenche valores e gera link
  'contrato_gerado', // Sistema gera contrato após admin
  'aguardando_pagamento', // Após aceite
  'pagamento_confirmado', // Pagamento realizado
  'aprovado', // Admin aprova e libera login
];

/**
 * Obtém fluxo esperado baseado no tipo de plano
 */
export function getExpectedFlow(tipo_plano: TipoPlano): TomadorStatus[] {
  return tipo_plano === 'fixo' ? FLUXO_PLANO_FIXO : FLUXO_PLANO_PERSONALIZADO;
}

/**
 * Valida se o estado atual está no caminho esperado
 */
export function isInExpectedFlow(
  currentStatus: TomadorStatus,
  tipo_plano: TipoPlano
): boolean {
  const expectedFlow = getExpectedFlow(tipo_plano);
  return expectedFlow.includes(currentStatus);
}

/**
 * Obtém próximo passo esperado no fluxo
 */
export function getNextExpectedStep(
  currentStatus: TomadorStatus,
  tipo_plano: TipoPlano
): TomadorStatus | null {
  const flow = getExpectedFlow(tipo_plano);
  const currentIndex = flow.indexOf(currentStatus);

  if (currentIndex === -1 || currentIndex === flow.length - 1) {
    return null;
  }

  return flow[currentIndex + 1];
}

/**
 * Classe para gerenciar transições com validação
 */
export class TomadorStateMachine {
  public data: TomadorState;

  constructor(state: TomadorState) {
    this.data = { ...state };
  }

  getCurrentStatus(): TomadorStatus {
    return this.data.status;
  }

  getState(): TomadorState {
    return { ...this.data };
  }

  canTransitionTo(
    nextStatus: TomadorStatus,
    context?: TransitionContext
  ): boolean {
    return canTransition(this.data.status, nextStatus, context);
  }

  canTransition(
    nextStatus: TomadorStatus,
    context?: TransitionContext
  ): boolean {
    return this.canTransitionTo(nextStatus, context);
  }

  transition(
    nextStatus: TomadorStatus,
    context?: TransitionContext
  ): { success: boolean; error?: string } {
    if (!this.canTransitionTo(nextStatus, context)) {
      return {
        success: false,
        error: `Transição inválida de "${this.data.status}" para "${nextStatus}"`,
      };
    }

    // Atualizar estado baseado na transição
    this.data.status = nextStatus;

    if (nextStatus === 'pagamento_confirmado') {
      this.data.pagamento_confirmado = true;
    }

    if (nextStatus === 'aprovado') {
      this.data.ativa = true;
    }

    return { success: true };
  }

  canActivateAccount(): boolean {
    const result = canActivateAccount(this.data);
    return result.valid;
  }

  canActivate(): { valid: boolean; errors: string[] } {
    return canActivateAccount(this.data);
  }

  getNextValidStates(): TomadorStatus[] {
    return getNextValidStates(this.data.status);
  }
}

/**
 * Factory para criar máquina de estados
 */
export function createStateMachine(state: TomadorState): TomadorStateMachine {
  return new TomadorStateMachine(state);
}

// Compatibilidade com nome antigo (tomador -> Tomador)
export type tomadorStatus = TomadorStatus;
export type tomadorState = TomadorState;
export class tomadorStateMachine extends TomadorStateMachine {}
export { createStateMachine as createtomadorStateMachine };
