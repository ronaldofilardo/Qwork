/**
 * DEPRECATED: Use @/lib/state-machine/tomador-state ao invés deste arquivo
 *
 * Este arquivo é mantido por compatibilidade retrógrada.
 * Toda a lógica foi movida para tomador-state.ts
 */

export {
  type TomadorStatus as tomadorStatus,
  type TipoPlano,
  type TomadorState as tomadorState,
  type TransitionContext,
  canTransition,
  getNextValidStates,
  canActivateAccount,
  FLUXO_PLANO_FIXO,
  FLUXO_PLANO_PERSONALIZADO,
  getExpectedFlow,
  isInExpectedFlow,
  getNextExpectedStep,
  TomadorStateMachine as tomadorStateMachine,
  createStateMachine,
} from './tomador-state.js';
