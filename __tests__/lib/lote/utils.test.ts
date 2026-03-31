/**
 * @file __tests__/lib/lote/utils.test.ts
 * Testes unitários para lib/lote/utils.ts
 *
 * Valida:
 *  - normalizeString: remove acentos, converte para minúsculas, trim
 *  - formatDate: formata data pt-BR com hora, retorna '-' para null/undefined
 *  - formatarData: formata data descritiva com "às"
 *  - getClassificacaoLabel: grupos positivos e negativos
 *  - getClassificacaoStyle: retorna label + colorClass, null para undefined
 *  - getStatusBadgeInfo: mapeamento de status para label + cor
 */

import {
  normalizeString,
  formatDate,
  formatarData,
  getClassificacaoLabel,
  getClassificacaoStyle,
  getStatusBadgeInfo,
} from '@/lib/lote/utils';

describe('normalizeString', () => {
  it('deve remover acentos e converter para minúsculas', () => {
    expect(normalizeString('São Paulo')).toBe('sao paulo');
  });

  it('deve fazer trim de espaços', () => {
    expect(normalizeString('  teste  ')).toBe('teste');
  });

  it('deve lidar com string vazia', () => {
    expect(normalizeString('')).toBe('');
  });

  it('deve remover diacríticos compostos', () => {
    expect(normalizeString('Ação Ênfase Über')).toBe('acao enfase uber');
  });
});

describe('formatDate', () => {
  it('deve retornar "-" para null', () => {
    expect(formatDate(null)).toBe('-');
  });

  it('deve formatar data válida em pt-BR', () => {
    // Arrange
    const dateStr = '2026-03-15T14:30:00Z';

    // Act
    const result = formatDate(dateStr);

    // Assert - deve conter dia/mês/ano e hora
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    expect(result).toMatch(/\d{2}:\d{2}/);
  });
});

describe('formatarData', () => {
  it('deve retornar "-" para null', () => {
    expect(formatarData(null)).toBe('-');
  });

  it('deve retornar "-" para data inválida', () => {
    expect(formatarData('invalid-date')).toBe('-');
  });

  it('deve formatar data válida com "às"', () => {
    const result = formatarData('2026-03-15T14:30:00Z');
    expect(result).toContain('às');
  });
});

describe('getClassificacaoLabel', () => {
  it('deve retornar string vazia para media undefined', () => {
    expect(getClassificacaoLabel(undefined, 1)).toBe('');
  });

  // Grupos positivos (2, 3, 5, 6): maior é melhor
  describe('grupos positivos', () => {
    it('deve retornar "Excelente" quando media > 66', () => {
      expect(getClassificacaoLabel(80, 2)).toBe('Excelente');
    });

    it('deve retornar "Monitorar" quando media >= 33 e <= 66', () => {
      expect(getClassificacaoLabel(50, 3)).toBe('Monitorar');
    });

    it('deve retornar "Atenção" quando media < 33', () => {
      expect(getClassificacaoLabel(20, 5)).toBe('Atenção');
    });
  });

  // Grupos negativos (1, 4, 7, 8, 9, 10): menor é melhor
  describe('grupos negativos', () => {
    it('deve retornar "Excelente" quando media < 33', () => {
      expect(getClassificacaoLabel(20, 1)).toBe('Excelente');
    });

    it('deve retornar "Monitorar" quando media >= 33 e <= 66', () => {
      expect(getClassificacaoLabel(50, 4)).toBe('Monitorar');
    });

    it('deve retornar "Atenção" quando media > 66', () => {
      expect(getClassificacaoLabel(80, 7)).toBe('Atenção');
    });
  });

  // Edge cases nos limites exatos
  describe('limites exatos', () => {
    it('grupo positivo: media=33 deve ser "Monitorar"', () => {
      expect(getClassificacaoLabel(33, 2)).toBe('Monitorar');
    });

    it('grupo positivo: media=66 deve ser "Monitorar"', () => {
      expect(getClassificacaoLabel(66, 2)).toBe('Monitorar');
    });

    it('grupo negativo: media=33 deve ser "Monitorar"', () => {
      expect(getClassificacaoLabel(33, 1)).toBe('Monitorar');
    });

    it('grupo negativo: media=66 deve ser "Monitorar"', () => {
      expect(getClassificacaoLabel(66, 1)).toBe('Monitorar');
    });
  });
});

describe('getClassificacaoStyle', () => {
  it('deve retornar null para media undefined', () => {
    expect(getClassificacaoStyle(undefined, 1)).toBeNull();
  });

  it('deve retornar label e colorClass para grupo positivo excelente', () => {
    const result = getClassificacaoStyle(80, 2);
    expect(result).toEqual({
      label: 'Excelente',
      colorClass: 'bg-green-100 text-green-800',
    });
  });

  it('deve retornar label e colorClass para grupo negativo atenção', () => {
    const result = getClassificacaoStyle(80, 1);
    expect(result).toEqual({
      label: 'Atenção',
      colorClass: 'bg-red-100 text-red-800',
    });
  });
});

describe('getStatusBadgeInfo', () => {
  it('deve retornar badge para "concluida"', () => {
    const result = getStatusBadgeInfo('concluida');
    expect(result.label).toBe('Concluída');
    expect(result.color).toContain('green');
  });

  it('deve retornar badge para "concluido" (legacy)', () => {
    const result = getStatusBadgeInfo('concluido');
    expect(result.label).toBe('Concluída');
  });

  it('deve retornar badge para "em_andamento"', () => {
    const result = getStatusBadgeInfo('em_andamento');
    expect(result.label).toBe('Em andamento');
    expect(result.color).toContain('yellow');
  });

  it('deve retornar badge para "iniciada"', () => {
    const result = getStatusBadgeInfo('iniciada');
    expect(result.label).toBe('Iniciada');
    expect(result.color).toContain('blue');
  });

  it('deve retornar badge para "inativada"', () => {
    const result = getStatusBadgeInfo('inativada');
    expect(result.label).toBe('Inativada');
    expect(result.color).toContain('red');
  });

  it('deve retornar fallback para status desconhecido', () => {
    const result = getStatusBadgeInfo('desconhecido');
    expect(result.label).toBe('desconhecido');
    expect(result.color).toContain('gray');
  });
});
