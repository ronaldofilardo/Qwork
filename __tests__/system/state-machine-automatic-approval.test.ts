/**
 * Testes para verificar transição automática na máquina de estados
 * após remoção de exigência de admin_cpf/recibo_id
 */

import {
  canTransition,
  canActivateAccount,
  ContratanteStateMachine,
} from '@/lib/state-machine/contratante-state';

describe('Máquina de Estados - Aprovação Automática', () => {
  describe('Transição pagamento_confirmado → aprovado', () => {
    it('deve permitir transição sem admin_cpf ou recibo_id', () => {
      const result = canTransition('pagamento_confirmado', 'aprovado', {});
      expect(result).toBe(true);
    });

    it('deve permitir transição mesmo com context vazio', () => {
      const result = canTransition('pagamento_confirmado', 'aprovado');
      expect(result).toBe(true);
    });

    it('deve permitir transição com apenas pagamento_id', () => {
      const result = canTransition('pagamento_confirmado', 'aprovado', {
        pagamento_id: 123,
      });
      expect(result).toBe(true);
    });
  });

  describe('canActivateAccount - Recibo sob demanda', () => {
    it('deve validar com sucesso sem recibo_gerado', () => {
      const state = {
        status: 'aprovado' as const,
        pagamento_confirmado: true,
        contrato_aceito: true,
        recibo_gerado: false,
        ativa: false,
      };

      const result = canActivateAccount(state);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('deve falhar se status não for aprovado', () => {
      const state = {
        status: 'pendente' as const,
        pagamento_confirmado: true,
        contrato_aceito: true,
        recibo_gerado: false,
        ativa: false,
      };

      const result = canActivateAccount(state);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Status deve ser "aprovado"');
    });

    it('deve falhar se pagamento não estiver confirmado', () => {
      const state = {
        status: 'aprovado' as const,
        pagamento_confirmado: false,
        contrato_aceito: true,
        recibo_gerado: false,
        ativa: false,
      };

      const result = canActivateAccount(state);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Pagamento deve estar confirmado');
    });

    it('deve falhar se contrato não estiver aceito', () => {
      const state = {
        status: 'aprovado' as const,
        pagamento_confirmado: true,
        contrato_aceito: false,
        recibo_gerado: false,
        ativa: false,
      };

      const result = canActivateAccount(state);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Contrato deve estar aceito');
    });
  });

  describe('ContratanteStateMachine - Fluxo automático', () => {
    it('deve permitir transição automática de pagamento_confirmado para aprovado', () => {
      const machine = new ContratanteStateMachine({
        status: 'pagamento_confirmado',
        pagamento_confirmado: true,
        contrato_aceito: true,
        recibo_gerado: false,
        ativa: false,
      });

      const canTransitionToAprovado = machine.canTransitionTo('aprovado');
      expect(canTransitionToAprovado).toBe(true);

      const result = machine.transition('aprovado');
      expect(result.success).toBe(true);
      expect(machine.getCurrentStatus()).toBe('aprovado');
    });
  });
});
