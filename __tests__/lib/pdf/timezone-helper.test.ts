import {
  corrigirTimezone,
  formatarDataCorrigida,
  formatarDataApenasData,
  formatarHora,
} from '@/lib/pdf/timezone-helper';

describe('Timezone Helper - Correção de +3 Horas em PROD', () => {
  /**
   * PROBLEMA ORIGINAL (reportado em 17/02/2026):
   * - Relatório Individual: 16:31:16 ao invés de 13:31:16 (+3 horas)
   * - Conclusão da Avaliação: 16:23:23 ao invés de 13:23:23 (+3 horas)
   * - Relatório de Lote: 16:30:20 ao invés de 13:30:20 (+3 horas)
   *
   * SOLUÇÃO: Subtrair 3 horas de todos os timestamps antes de formatar
   */

  describe('corrigirTimezone', () => {
    it('deve subtrair 3 horas de uma data Date', () => {
      const dataOriginal = new Date('2026-02-17T16:31:16Z');
      const dataCorrigida = corrigirTimezone(dataOriginal);

      // Depois de subtrair 3 horas, o tempo deve estar 3h menor
      const diffMs = dataOriginal.getTime() - dataCorrigida.getTime();
      const diffHoras = diffMs / (1000 * 60 * 60);
      expect(diffHoras).toBe(3);
    });

    it('deve subtrair 3 horas de uma string ISO', () => {
      const dataOriginal = new Date('2026-02-17T16:23:23Z');
      const dataCorrigida = corrigirTimezone(dataOriginal);

      // Depois de subtrair 3 horas, o tempo deve estar 3h menor
      const diffMs = dataOriginal.getTime() - dataCorrigida.getTime();
      const diffHoras = diffMs / (1000 * 60 * 60);
      expect(diffHoras).toBe(3);
    });

    it('deve retornar data atual se null/undefined', () => {
      const dataCorrigida = corrigirTimezone(null);
      expect(dataCorrigida).toBeInstanceOf(Date);
    });
  });

  describe('formatarDataCorrigida', () => {
    it('deve formatar data com timezone corrigido (problema original)', () => {
      // Dados SEM timezone do banco: "2026-02-17 16:31:16"
      // JavaScript interpreta como local: 16:31
      // Exibição atual: 16:31 (ERRADO, deveria ser 13:31)
      const dataProblematica = new Date('2026-02-17 16:31:16');
      const resultado = formatarDataCorrigida(dataProblematica);

      // Deve exibir 13:31:16, não 16:31:16
      expect(resultado).toContain('13:31:16');
      expect(resultado).not.toContain('16:31:16');
    });

    it('deve formatar corretamente o exemplo do relatório individual', () => {
      // Dados do banco: "2026-02-17 16:23:23"
      const data = new Date('2026-02-17 16:23:23');
      const resultado = formatarDataCorrigida(data);

      // Esperado: 17/02/2026, 13:23:23
      expect(resultado).toMatch(/17\/02\/2026.*13:23:23/);
    });

    it('deve formatar corretamente o exemplo do relatório lote', () => {
      // Dados do banco: "2026-02-17 16:30:20"
      const data = new Date('2026-02-17 16:30:20');
      const resultado = formatarDataCorrigida(data);

      // Esperado: 17/02/2026, 13:30:20
      expect(resultado).toMatch(/17\/02\/2026.*13:30:20/);
    });
  });

  describe('formatarDataApenasData', () => {
    it('deve formatar apenas data sem hora', () => {
      const data = new Date('2026-02-17T16:31:16Z');
      const resultado = formatarDataApenasData(data);

      // Deve exibir apenas data: 17/02/2026
      expect(resultado).toMatch(/\d{2}\/\d{2}\/\d{4}/);
      expect(resultado).not.toContain(':');
    });
  });

  describe('formatarHora', () => {
    it('deve formatar apenas a hora com timezone corrigido', () => {
      // Dados do banco: "2026-02-17 16:31:16"
      const data = new Date('2026-02-17 16:31:16');
      const resultado = formatarHora(data);

      // Deve exibir 13:31:16 (não 16:31:16)
      expect(resultado).toMatch(/13:31:16/);
      expect(resultado).not.toContain('16:31:16');
    });
  });

  describe('Casos reais reportados', () => {
    it('Caso 1: Geração do relatório individual - concluída_em', () => {
      // Problema: "17/02/2026, 16:31:16" mas o correto é "17/02/2026, 13:31:16"
      // Dados do banco: "2026-02-17 16:31:16"
      const dataFromDB = '2026-02-17 16:31:16';
      const resultado = formatarDataCorrigida(dataFromDB);

      expect(resultado).toContain('13:31:16');
      expect(resultado).not.toContain('16:31:16');
    });

    it('Caso 2: Conclusão da avaliação dentro do relatório', () => {
      // Problema: "17/02/2026, 16:23:23" mas o correto é "17/02/2026, 13:23:23"
      // Dados do banco: "2026-02-17 16:23:23"
      const dataFromDB = '2026-02-17 16:23:23';
      const resultado = formatarDataCorrigida(dataFromDB);

      expect(resultado).toContain('13:23:23');
      expect(resultado).not.toContain('16:23:23');
    });

    it('Caso 3: Relatório de lote - emitido_em', () => {
      // Problema: "Concluído em 17/02/2026, 16:30:20" mas correto é "Concluído em 17/02/2026, 13:30:20"
      // Dados do banco: "2026-02-17 16:30:20"
      const dataFromDB = '2026-02-17 16:30:20';
      const resultado = formatarDataCorrigida(dataFromDB);

      expect(resultado).toContain('13:30:20');
      expect(resultado).not.toContain('16:30:20');
    });
  });

  describe('Tratamento de datas limítrofes', () => {
    it('deve manter diferença de 3 horas para qualquer hora do dia', () => {
      // Validar que sempre subtrai 3 horas
      const data1 = new Date('2026-02-17 10:00:00');
      const data2 = new Date('2026-02-17 14:00:00');

      const corrigida1 = corrigirTimezone(data1);
      const corrigida2 = corrigirTimezone(data2);

      // Diferença deve ser sempre 3 horas
      const diff = (data1.getTime() - corrigida1.getTime()) / (1000 * 60 * 60);
      expect(diff).toBe(3);

      const diff2 = (data2.getTime() - corrigida2.getTime()) / (1000 * 60 * 60);
      expect(diff2).toBe(3);
    });

    it('deve funcionar em horários variados', () => {
      const horarios = ['08:30:00', '12:00:00', '18:45:00', '23:59:59'];

      for (const horario of horarios) {
        const data = new Date(`2026-02-17 ${horario}`);
        const corrigida = corrigirTimezone(data);

        const diff = (data.getTime() - corrigida.getTime()) / (1000 * 60 * 60);
        expect(diff).toBe(3);
      }
    });
  });
});
