/**
 * @file __tests__/lib/business-rules.test.ts
 * Testes unitários para lib/config/business-rules.ts
 */

import {
  PERCENTUAL_MINIMO_EMISSAO,
  PRAZO_EXPIRACAO_LEAD_DIAS,
  VIGENCIA_VINCULO_COMISSAO_DIAS,
  MAX_PARCELAS,
} from '@/lib/config/business-rules';

describe('Business Rules', () => {
  describe('PERCENTUAL_MINIMO_EMISSAO', () => {
    it('deve ser 70', () => {
      expect(PERCENTUAL_MINIMO_EMISSAO).toBe(70);
    });

    it('deve ser do tipo number', () => {
      expect(typeof PERCENTUAL_MINIMO_EMISSAO).toBe('number');
    });
  });

  describe('PRAZO_EXPIRACAO_LEAD_DIAS', () => {
    it('deve ser 90', () => {
      expect(PRAZO_EXPIRACAO_LEAD_DIAS).toBe(90);
    });

    it('deve ser do tipo number', () => {
      expect(typeof PRAZO_EXPIRACAO_LEAD_DIAS).toBe('number');
    });
  });

  describe('VIGENCIA_VINCULO_COMISSAO_DIAS', () => {
    it('deve ser 365', () => {
      expect(VIGENCIA_VINCULO_COMISSAO_DIAS).toBe(365);
    });

    it('deve ser do tipo number', () => {
      expect(typeof VIGENCIA_VINCULO_COMISSAO_DIAS).toBe('number');
    });
  });

  describe('MAX_PARCELAS', () => {
    it('deve ser 12', () => {
      expect(MAX_PARCELAS).toBe(12);
    });

    it('deve ser do tipo number', () => {
      expect(typeof MAX_PARCELAS).toBe('number');
    });
  });
});
