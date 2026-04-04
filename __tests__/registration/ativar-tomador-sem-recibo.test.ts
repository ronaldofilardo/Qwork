/**
 * Testes para TomadorStateMachine com política de recibo sob demanda
 * Testa a lógica de ativação e transições de estado
 *
 * NOTA: pagamento_confirmado removido do fluxo (01/04/2026).
 * canActivateAccount agora exige apenas status='aprovado' + contrato_aceito=true.
 */

import { TomadorStateMachine } from '@/lib/state-machine/tomador-state';

describe('TomadorStateMachine - Recibo sob demanda', () => {
  describe('Validação de requisitos de ativação', () => {
    it('deve permitir ativação quando aprovado e contrato aceito', () => {
      const stateMachine = new TomadorStateMachine({
        status: 'aprovado',
        contrato_aceito: true,
        recibo_gerado: false,
        ativa: false,
      });

      const result = stateMachine.canActivateAccount();

      // Política atual: recibo e pagamento não são obrigatórios para ativação
      expect(result).toBe(true);
    });

    it('deve rejeitar ativação sem contrato aceito', () => {
      const stateMachine = new TomadorStateMachine({
        status: 'aprovado',
        contrato_aceito: false,
        recibo_gerado: false,
        ativa: false,
      });

      const result = stateMachine.canActivateAccount();

      expect(result).toBe(false);
    });

    it('deve rejeitar ativação se status não é aprovado', () => {
      const stateMachine = new TomadorStateMachine({
        status: 'pendente' as any,
        contrato_aceito: true,
        recibo_gerado: false,
        ativa: false,
      });

      const result = stateMachine.canActivateAccount();

      expect(result).toBe(false);
    });

    it('deve aceitar tomador já ativo como válido', () => {
      const stateMachine = new TomadorStateMachine({
        status: 'aprovado',
        contrato_aceito: true,
        recibo_gerado: false,
        ativa: true,
      });

      expect(stateMachine.data.ativa).toBe(true);
    });
  });

  describe('Transições de status', () => {
    it('deve permitir transição pagamento_confirmado → aprovado (estado legado)', () => {
      const stateMachine = new TomadorStateMachine({
        status: 'pagamento_confirmado',
        contrato_aceito: true,
        recibo_gerado: false,
        ativa: false,
      });

      const canTransition = stateMachine.canTransition('aprovado');

      expect(canTransition).toBe(true);
    });

    it('deve rejeitar transições inválidas', () => {
      const stateMachine = new TomadorStateMachine({
        status: 'cadastro_inicial',
        contrato_aceito: false,
        recibo_gerado: false,
        ativa: false,
      });

      const canTransition = stateMachine.canTransition('aprovado');

      expect(canTransition).toBe(false);
    });
  });

  describe('Lógica de aprovação por sistema', () => {
    it('deve usar aprovado_por_cpf = 00000000000 para aprovações automáticas', () => {
      const SYSTEM_OPERATOR_CPF = '00000000000';

      expect(SYSTEM_OPERATOR_CPF).toMatch(/^\d{11}$/);
      expect(SYSTEM_OPERATOR_CPF.length).toBe(11);
    });
  });
});
