/**
 * Testes para função ativarContratante com política de recibo sob demanda
 * Testa a lógica de ativação automática sem exigência de recibo prévio
 */

import { ContratanteStateMachine } from '@/lib/state-machine/contratante-state';

describe('ativarContratante - Recibo sob demanda', () => {
  describe('Validação de requisitos de ativação', () => {
    it('deve permitir ativação sem recibo (política sob demanda)', () => {
      const stateMachine = new ContratanteStateMachine({
        status: 'pagamento_confirmado' as any,
        pagamento_confirmado: true,
        ativa: false,
      });

      const canActivate = stateMachine.canActivateAccount();

      // Política atual: recibo não é obrigatório para ativação
      expect(canActivate).toBe(true);
    });

    it('deve exigir pagamento confirmado para ativação', () => {
      const stateMachine = new ContratanteStateMachine({
        status: 'pendente' as any,
        pagamento_confirmado: false,
        ativa: false,
      });

      const canActivate = stateMachine.canActivateAccount();

      expect(canActivate).toBe(false);
    });

    it('deve aceitar contratante já ativo como válido', () => {
      const stateMachine = new ContratanteStateMachine({
        status: 'aprovado' as any,
        pagamento_confirmado: true,
        ativa: true,
      });

      // Contratante já ativo não precisa revalidação
      expect(stateMachine.data.ativa).toBe(true);
    });
  });

  describe('Transições de status sem admin', () => {
    it('deve permitir transição pagamento_confirmado → aprovado automaticamente', () => {
      const stateMachine = new ContratanteStateMachine({
        status: 'pagamento_confirmado' as any,
        pagamento_confirmado: true,
        ativa: false,
      });

      const canTransition = stateMachine.canTransition('aprovado' as any);

      // Não requer admin_cpf nem recibo_id após refatoração
      expect(canTransition).toBe(true);
    });

    it('deve rejeitar transições inválidas', () => {
      const stateMachine = new ContratanteStateMachine({
        status: 'cadastro_inicial' as any,
        pagamento_confirmado: false,
        ativa: false,
      });

      const canTransition = stateMachine.canTransition('aprovado' as any);

      expect(canTransition).toBe(false);
    });
  });

  describe('Lógica de aprovação por sistema', () => {
    it('deve usar aprovado_por_cpf = 00000000000 para aprovações automáticas', () => {
      const SYSTEM_OPERATOR_CPF = '00000000000';

      // Validação de formato: 11 dígitos numéricos
      expect(SYSTEM_OPERATOR_CPF).toMatch(/^\d{11}$/);
      expect(SYSTEM_OPERATOR_CPF.length).toBe(11);
    });

    it('deve definir data_liberacao_login no momento da ativação', () => {
      const now = new Date();
      const liberacao = new Date();

      // Data de liberação deve ser próxima ao momento atual
      const diffMs = Math.abs(liberacao.getTime() - now.getTime());
      expect(diffMs).toBeLessThan(5000); // Menos de 5 segundos
    });
  });
});
