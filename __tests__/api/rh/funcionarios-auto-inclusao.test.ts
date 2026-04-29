/**
 * __tests__/api/rh/funcionarios-auto-inclusao.test.ts
 *
 * Testes de integração para bloqueio de auto-inclusão do RH como funcionário
 */

import { limparCPF } from '@/lib/cpf-utils';

describe('RH Auto-inclusão Validação', () => {
  describe('Lógica de validação de auto-inclusão', () => {
    const sessionCpf = '12345678901';

    it('deve detectar CPF igual sem formatação', () => {
      const cpfLimpo = limparCPF('12345678901');
      const match = cpfLimpo === sessionCpf;
      expect(match).toBe(true);
    });

    it('deve detectar CPF igual com formatação diferente', () => {
      const cpfLimpo = limparCPF('123.456.789-01');
      const match = cpfLimpo === sessionCpf;
      expect(match).toBe(true);
    });

    it('deve detectar CPF diferente', () => {
      const cpfLimpo = limparCPF('987.654.321-09');
      const match = cpfLimpo === sessionCpf;
      expect(match).toBe(false);
    });

    it('deve validar que lógica de bloqueio funciona em ambos os casos', () => {
      const responsavelCpf = '12345678901';

      // Caso 1: Tentativa de auto-inclusão - deve bloquear
      const cpf1Limpo = limparCPF('123.456.789-01');
      const shouldBlock1 = cpf1Limpo === responsavelCpf;
      expect(shouldBlock1).toBe(true);

      // Caso 2: CPF diferente - deve permitir
      const cpf2Limpo = limparCPF('98765432109');
      const shouldBlock2 = cpf2Limpo === responsavelCpf;
      expect(shouldBlock2).toBe(false);
    });
  });
});
