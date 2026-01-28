/**
 * Máquina de Estados para Contratantes
 * Gerencia transições válidas no fluxo de contratação
 */

export type ContratanteStatus =
  | 'cadastro_inicial'
  | 'aguardando_contrato'
  | 'contrato_gerado'
  | 'aguardando_pagamento'
  | 'pagamento_confirmado'
  | 'aprovado'
  | 'rejeitado'
  | 'em_reanalise';

export type TipoPlano = 'fixo' | 'personalizado';

export interface ContratanteState {
  status: ContratanteStatus;
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
  ContratanteStatus,
  Partial<Record<ContratanteStatus, (ctx?: TransitionContext) => boolean>>
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
  currentStatus: ContratanteStatus,
  nextStatus: ContratanteStatus,
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
  currentStatus: ContratanteStatus
): ContratanteStatus[] {
  const transitions = STATE_TRANSITIONS[currentStatus];
  return transitions ? (Object.keys(transitions) as ContratanteStatus[]) : [];
}

/**
 * Valida estado completo do contratante para ativação
 * recibo_gerado é opcional: pode ser gerado sob demanda após ativação
 */
export function canActivateAccount(state: ContratanteState): {
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
export const FLUXO_PLANO_FIXO: ContratanteStatus[] = [
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
export const FLUXO_PLANO_PERSONALIZADO: ContratanteStatus[] = [
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
export function getExpectedFlow(tipo_plano: TipoPlano): ContratanteStatus[] {
  return tipo_plano === 'fixo' ? FLUXO_PLANO_FIXO : FLUXO_PLANO_PERSONALIZADO;
}

/**
 * Valida se o estado atual está no caminho esperado
 */
export function isInExpectedFlow(
  currentStatus: ContratanteStatus,
  tipo_plano: TipoPlano
): boolean {
  const expectedFlow = getExpectedFlow(tipo_plano);
  return expectedFlow.includes(currentStatus);
}

/**
 * Obtém próximo passo esperado no fluxo
 */
export function getNextExpectedStep(
  currentStatus: ContratanteStatus,
  tipo_plano: TipoPlano
): ContratanteStatus | null {
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
export class ContratanteStateMachine {
  constructor(private state: ContratanteState) {}

  getCurrentStatus(): ContratanteStatus {
    return this.state.status;
  }

  getState(): ContratanteState {
    return { ...this.state };
  }

  canTransitionTo(
    nextStatus: ContratanteStatus,
    context?: TransitionContext
  ): boolean {
    return canTransition(this.state.status, nextStatus, context);
  }

  transition(
    nextStatus: ContratanteStatus,
    context?: TransitionContext
  ): { success: boolean; error?: string } {
    if (!this.canTransitionTo(nextStatus, context)) {
      return {
        success: false,
        error: `Transição inválida de "${this.state.status}" para "${nextStatus}"`,
      };
    }

    // Atualizar estado baseado na transição
    this.state.status = nextStatus;

    if (nextStatus === 'pagamento_confirmado') {
      this.state.pagamento_confirmado = true;
    }

    if (nextStatus === 'aprovado') {
      this.state.ativa = true;
    }

    return { success: true };
  }

  canActivate(): { valid: boolean; errors: string[] } {
    return canActivateAccount(this.state);
  }

  getNextValidStates(): ContratanteStatus[] {
    return getNextValidStates(this.state.status);
  }
}

/**
 * Factory para criar máquina de estados
 */
export function createStateMachine(
  state: ContratanteState
): ContratanteStateMachine {
  return new ContratanteStateMachine(state);
}
