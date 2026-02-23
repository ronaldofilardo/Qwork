import {
  corrigirTimezone,
  formatarDataCorrigida,
  formatarDataApenasData,
  formatarHora,
} from '@/lib/pdf/timezone-helper';

describe('Timezone Helper - Sempre exibir horário de São Paulo (America/Sao_Paulo)', () => {
  /**
   * SOLUÇÃO DEFINITIVA (corrigida em 23/02/2026):
   * Usar timeZone: 'America/Sao_Paulo' em todas as funções de formatação.
   * Isso garante exibição correta independentemente de onde o código executa:
   *   - Vercel (UTC): new Date() = 22:13 UTC → exibe 19:13 São Paulo ✓
   *   - Máquina local Brasil (UTC-3): new Date() = 22:13 UTC → exibe 19:13 São Paulo ✓
   *
   * PROBLEMA ANTERIOR:
   *   A abordagem de subtrair 3h manualmente + toLocaleString sem timezone
   *   causava dupla subtração quando executado em máquina local no Brasil.
   */

  describe('corrigirTimezone', () => {
    it('deve parsear uma data Date e retorná-la sem modificação', () => {
      const dataOriginal = new Date('2026-02-17T16:31:16Z');
      const dataRetornada = corrigirTimezone(dataOriginal);

      // Não altera o timestamp
      expect(dataRetornada.getTime()).toBe(dataOriginal.getTime());
    });

    it('deve parsear uma string ISO e retornar o Date equivalente', () => {
      const str = '2026-02-17T16:31:16Z';
      const dataRetornada = corrigirTimezone(str);

      expect(dataRetornada).toBeInstanceOf(Date);
      expect(dataRetornada.getTime()).toBe(new Date(str).getTime());
    });

    it('deve retornar data atual se null/undefined', () => {
      const dataCorrigida = corrigirTimezone(null);
      expect(dataCorrigida).toBeInstanceOf(Date);
    });
  });

  describe('formatarDataCorrigida', () => {
    it('deve formatar timestamp UTC como horário de São Paulo (UTC-3)', () => {
      // 16:31 UTC = 13:31 São Paulo (UTC-3)
      const dataUTC = new Date('2026-02-17T16:31:16Z');
      const resultado = formatarDataCorrigida(dataUTC);

      expect(resultado).toContain('13:31:16');
      expect(resultado).toContain('17/02/2026');
    });

    it('deve formatar corretamente o caso do relatório individual (UTC)', () => {
      // 16:23 UTC = 13:23 São Paulo
      const data = new Date('2026-02-17T16:23:23Z');
      const resultado = formatarDataCorrigida(data);

      expect(resultado).toMatch(/17\/02\/2026.*13:23:23/);
    });

    it('deve formatar corretamente o caso do relatório de lote (UTC)', () => {
      // 16:30 UTC = 13:30 São Paulo
      const data = new Date('2026-02-17T16:30:20Z');
      const resultado = formatarDataCorrigida(data);

      expect(resultado).toMatch(/17\/02\/2026.*13:30:20/);
    });
  });

  describe('formatarDataApenasData', () => {
    it('deve formatar apenas data sem hora no fuso de São Paulo', () => {
      const data = new Date('2026-02-17T16:31:16Z');
      const resultado = formatarDataApenasData(data);

      expect(resultado).toMatch(/\d{2}\/\d{2}\/\d{4}/);
      expect(resultado).not.toContain(':');
      expect(resultado).toBe('17/02/2026');
    });
  });

  describe('formatarHora', () => {
    it('deve formatar hora UTC corretamente no fuso de São Paulo', () => {
      // 16:31 UTC = 13:31 São Paulo
      const data = new Date('2026-02-17T16:31:16Z');
      const resultado = formatarHora(data);

      expect(resultado).toMatch(/13:31:16/);
    });

    it('deve exibir 19:13 para laudo gerado às 19:13 São Paulo (22:13 UTC)', () => {
      // Caso real: emissor local no Brasil emite às 19:13 São Paulo = 22:13 UTC
      const data = new Date('2026-02-23T22:13:24Z');
      const resultado = formatarHora(data);

      expect(resultado).toMatch(/19:13:24/);
    });
  });

  describe('Casos reais reportados', () => {
    it('Caso 1: Relatório individual - timestamp UTC da Vercel', () => {
      // Vercel (UTC) registrou 16:31 UTC = 13:31 São Paulo
      const dataFromDB = new Date('2026-02-17T16:31:16Z');
      const resultado = formatarDataCorrigida(dataFromDB);

      expect(resultado).toContain('13:31:16');
    });

    it('Caso 2: Conclusão da avaliação - timestamp UTC da Vercel', () => {
      // Vercel (UTC) registrou 16:23 UTC = 13:23 São Paulo
      const dataFromDB = new Date('2026-02-17T16:23:23Z');
      const resultado = formatarDataCorrigida(dataFromDB);

      expect(resultado).toContain('13:23:23');
    });

    it('Caso 3: Relatório de lote - emitido_em UTC', () => {
      // Vercel (UTC) registrou 16:30 UTC = 13:30 São Paulo
      const dataFromDB = new Date('2026-02-17T16:30:20Z');
      const resultado = formatarDataCorrigida(dataFromDB);

      expect(resultado).toContain('13:30:20');
    });

    it('Caso 4: Laudo gerado localmente no Brasil às 19:13 (novo bug corrigido)', () => {
      // Emissor local: 19:13 São Paulo = 22:13 UTC
      const dataFromDB = new Date('2026-02-23T22:13:24Z');
      const resultado = formatarDataCorrigida(dataFromDB);

      expect(resultado).toContain('19:13:24');
    });
  });

  describe('Tratamento de datas limítrofes', () => {
    it('deve exibir hora correta de São Paulo para qualquer hora do dia', () => {
      // 10:00 UTC = 07:00 São Paulo
      const data1 = new Date('2026-02-17T10:00:00Z');
      // 17:00 UTC = 14:00 São Paulo
      const data2 = new Date('2026-02-17T17:00:00Z');

      const hora1 = formatarHora(data1);
      const hora2 = formatarHora(data2);

      expect(hora1).toMatch(/07:00:00/);
      expect(hora2).toMatch(/14:00:00/);
    });

    it('deve funcionar em horários variados sempre no fuso de São Paulo', () => {
      // Horários UTC → esperado em São Paulo (UTC-3)
      const casos = [
        { utc: '2026-02-17T11:30:00Z', spHora: '08:30:00' },
        { utc: '2026-02-17T15:00:00Z', spHora: '12:00:00' },
        { utc: '2026-02-17T21:45:00Z', spHora: '18:45:00' },
        { utc: '2026-02-18T02:59:59Z', spHora: '23:59:59' },
      ];

      for (const { utc, spHora } of casos) {
        const data = new Date(utc);
        const resultado = formatarHora(data);
        expect(resultado).toMatch(new RegExp(spHora));
      }
    });
  });
});
