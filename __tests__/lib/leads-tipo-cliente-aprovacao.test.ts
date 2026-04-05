import {
  CUSTO_POR_AVALIACAO,
  calcularRequerAprovacao,
  TIPOS_CLIENTE,
  TIPO_CLIENTE_LABEL,
} from '@/lib/leads-config';

describe('leads-config — constantes', () => {
  it('deve ter os custos corretos por tipo', () => {
    expect(CUSTO_POR_AVALIACAO.entidade).toBe(15);
    expect(CUSTO_POR_AVALIACAO.clinica).toBe(5);
  });

  it('deve listar os dois tipos de cliente', () => {
    expect(TIPOS_CLIENTE).toEqual(['entidade', 'clinica']);
  });

  it('deve ter labels para cada tipo', () => {
    expect(TIPO_CLIENTE_LABEL.entidade).toBe('Entidade');
    expect(TIPO_CLIENTE_LABEL.clinica).toBe('Clínica');
  });
});

describe('calcularRequerAprovacao', () => {
  // Entidade: custo = R$15
  describe('tipo entidade (custo R$15)', () => {
    it('valor 100, comissão 80% → QWork = 20 → não requer (20 >= 15)', () => {
      expect(calcularRequerAprovacao(100, 80, 'entidade')).toBe(false);
    });

    it('valor 100, comissão 90% → QWork = 10 → requer (10 < 15)', () => {
      expect(calcularRequerAprovacao(100, 90, 'entidade')).toBe(true);
    });

    it('valor 100, comissão 85% → QWork = 15 → não requer (15 >= 15)', () => {
      expect(calcularRequerAprovacao(100, 85, 'entidade')).toBe(false);
    });

    it('valor 15, comissão 0% → QWork = 15 → não requer', () => {
      expect(calcularRequerAprovacao(15, 0, 'entidade')).toBe(false);
    });

    it('valor 14.99, comissão 0% → QWork = 14.99 → requer', () => {
      expect(calcularRequerAprovacao(14.99, 0, 'entidade')).toBe(true);
    });

    it('valor 0 → false (não calcula para valor zero)', () => {
      expect(calcularRequerAprovacao(0, 50, 'entidade')).toBe(false);
    });

    it('valor negativo → false', () => {
      expect(calcularRequerAprovacao(-100, 50, 'entidade')).toBe(false);
    });
  });

  // Clínica: custo = R$5
  describe('tipo clínica (custo R$5)', () => {
    it('valor 100, comissão 90% → QWork = 10 → não requer (10 >= 5)', () => {
      expect(calcularRequerAprovacao(100, 90, 'clinica')).toBe(false);
    });

    it('valor 100, comissão 96% → QWork = 4 → requer (4 < 5)', () => {
      expect(calcularRequerAprovacao(100, 96, 'clinica')).toBe(true);
    });

    it('valor 100, comissão 95% → QWork = 5 → não requer (5 >= 5)', () => {
      expect(calcularRequerAprovacao(100, 95, 'clinica')).toBe(false);
    });

    it('valor 5, comissão 0% → QWork = 5 → não requer', () => {
      expect(calcularRequerAprovacao(5, 0, 'clinica')).toBe(false);
    });

    it('valor 4.99, comissão 0% → QWork = 4.99 → requer', () => {
      expect(calcularRequerAprovacao(4.99, 0, 'clinica')).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('comissão 100% → QWork = 0 → requer (para valor > 0)', () => {
      expect(calcularRequerAprovacao(100, 100, 'entidade')).toBe(true);
      expect(calcularRequerAprovacao(100, 100, 'clinica')).toBe(true);
    });

    it('comissão 0% → QWork = valor → depende se valor >= custo', () => {
      expect(calcularRequerAprovacao(15, 0, 'entidade')).toBe(false);
      expect(calcularRequerAprovacao(5, 0, 'clinica')).toBe(false);
      expect(calcularRequerAprovacao(4, 0, 'clinica')).toBe(true);
    });

    it('valor decimal alto sem floating point drift', () => {
      // 1000 * (1 - 98.5/100) = 1000 * 0.015 = 15.0
      expect(calcularRequerAprovacao(1000, 98.5, 'entidade')).toBe(false);
    });
  });
});
