/**
 * Testes para lib/pdf/timezone-helper.ts
 *
 * Contexto do bug:
 * - `laudos.emitido_em` é `timestamp without time zone` no Neon DB
 * - O driver `pg` chama `new Date(rawString)` sem sufixo 'Z'
 * - Em dev (UTC-3), JavaScript interpreta o valor como hora local → deslocamento +3h
 * - Resultado: "14:59:45" exibido quando o correto é "11:59:45" (UTC-3)
 * - Correção: `parsearComoUTC` adiciona 'Z' em strings sem indicador de fuso
 */

import {
  parsearComoUTC,
  corrigirTimezone,
  formatarDataCorrigida,
  formatarDataApenasData,
  formatarHora,
} from '../../lib/pdf/timezone-helper';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Retorna a diferença em horas entre o timestamp UTC e o valor exibido no fuso
 *  de São Paulo (UTC-3 em horário padrão; UTC-2 em horário de verão).
 *  Como os testes usam datas em março (sem horário de verão), a diferença é 3h.
 */
const SAO_PAULO_OFFSET_H = 3; // UTC-3 (março, sem horário de verão)

// ─────────────────────────────────────────────────────────────────────────────
// parsearComoUTC
// ─────────────────────────────────────────────────────────────────────────────

describe('parsearComoUTC', () => {
  const NAIVE_STRING = '2026-03-03T14:59:45.000';
  const NAIVE_WITH_SPACE = '2026-03-03 14:59:45';
  const UTC_MILLIS_EXPECTED = Date.UTC(2026, 2, 3, 14, 59, 45, 0); // 14:59:45 UTC

  test('string sem fuso → interpreta como UTC', () => {
    const resultado = parsearComoUTC(NAIVE_STRING);
    expect(resultado.getTime()).toBe(UTC_MILLIS_EXPECTED);
  });

  test('string com separador de espaço sem fuso → normaliza e interpreta como UTC', () => {
    const resultado = parsearComoUTC(NAIVE_WITH_SPACE);
    // getTime em milissegundos UTC deve coincidir com 14:59:45 UTC
    expect(resultado.getTime()).toBe(Date.UTC(2026, 2, 3, 14, 59, 45));
  });

  test('string já com sufixo Z → não duplica offset', () => {
    const comZ = '2026-03-03T14:59:45.000Z';
    const resultado = parsearComoUTC(comZ);
    expect(resultado.getTime()).toBe(UTC_MILLIS_EXPECTED);
  });

  test('string com offset explícito -03:00 → converte corretamente para UTC', () => {
    const comOffset = '2026-03-03T11:59:45.000-03:00';
    const resultado = parsearComoUTC(comOffset);
    // 11:59:45 BRT = 14:59:45 UTC
    expect(resultado.getTime()).toBe(UTC_MILLIS_EXPECTED);
  });

  test('string com offset +0000 → interpreta como UTC sem modificação', () => {
    const comOffset = '2026-03-03T14:59:45.000+0000';
    const resultado = parsearComoUTC(comOffset);
    expect(resultado.getTime()).toBe(UTC_MILLIS_EXPECTED);
  });

  test('instância de Date → retorna o mesmo objeto', () => {
    const date = new Date(UTC_MILLIS_EXPECTED);
    const resultado = parsearComoUTC(date);
    expect(resultado).toBe(date);
  });

  test('null → retorna new Date() (agora)', () => {
    const antes = Date.now();
    const resultado = parsearComoUTC(null);
    const depois = Date.now();
    expect(resultado.getTime()).toBeGreaterThanOrEqual(antes);
    expect(resultado.getTime()).toBeLessThanOrEqual(depois);
  });

  test('undefined → retorna new Date() (agora)', () => {
    const antes = Date.now();
    const resultado = parsearComoUTC(undefined);
    const depois = Date.now();
    expect(resultado.getTime()).toBeGreaterThanOrEqual(antes);
    expect(resultado.getTime()).toBeLessThanOrEqual(depois);
  });

  test('string vazia → retorna new Date() (agora)', () => {
    const antes = Date.now();
    const resultado = parsearComoUTC('');
    const depois = Date.now();
    expect(resultado.getTime()).toBeGreaterThanOrEqual(antes);
    expect(resultado.getTime()).toBeLessThanOrEqual(depois);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// corrigirTimezone (deprecated wrapper)
// ─────────────────────────────────────────────────────────────────────────────

describe('corrigirTimezone', () => {
  test('deve se comportar exatamente como parsearComoUTC', () => {
    const naive = '2026-03-03T12:00:06.000';
    expect(corrigirTimezone(naive).getTime()).toBe(
      parsearComoUTC(naive).getTime()
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// formatarDataCorrigida
// ─────────────────────────────────────────────────────────────────────────────

describe('formatarDataCorrigida', () => {
  /**
   * Bug original: `pg` retorna '2026-03-03T14:59:45.000' (naive).
   * Antes da correção: new Date() interpretava como local (UTC-3) → 14:59:45 UTC-3
   *   → formatado como 14:59:45 (incorreto — deveria ser 11:59:45 BRT).
   * Com parsearComoUTC: '14:59:45.000' é tratado como UTC
   *   → em BRT (UTC-3) = 11:59:45.
   */
  test('string naive (sem fuso) deve exibir hora em BRT, não em UTC', () => {
    // 14:59:45 UTC → 11:59:45 BRT (UTC-3)
    const naive = '2026-03-03T14:59:45.000';
    const resultado = formatarDataCorrigida(naive);
    expect(resultado).toContain('11:59:45');
    expect(resultado).not.toContain('14:59:45');
  });

  test('exibe data no formato DD/MM/AAAA', () => {
    const naive = '2026-03-03T14:59:45.000';
    const resultado = formatarDataCorrigida(naive);
    expect(resultado).toContain('03/03/2026');
  });

  test('string com Z → converte para BRT corretamente', () => {
    // 12:00:06 UTC → 09:00:06 BRT
    const comZ = '2026-03-03T12:00:06.000Z';
    const resultado = formatarDataCorrigida(comZ);
    expect(resultado).toContain('09:00:06');
  });

  test('instância de Date já em UTC → exibe hora em BRT', () => {
    const date = new Date(Date.UTC(2026, 2, 3, 15, 0, 0));
    const resultado = formatarDataCorrigida(date);
    // 15:00:00 UTC → 12:00:00 BRT
    expect(resultado).toContain('12:00:00');
  });

  test('null → retorna string de data atual (não lança exceção)', () => {
    expect(() => formatarDataCorrigida(null)).not.toThrow();
    expect(typeof formatarDataCorrigida(null)).toBe('string');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// formatarDataApenasData
// ─────────────────────────────────────────────────────────────────────────────

describe('formatarDataApenasData', () => {
  test('string naive → data exibida em BRT', () => {
    // 2026-03-03T01:00:00 UTC → 2026-03-02T22:00:00 BRT (véspera!)
    // mas usaremos um horário seguro para evitar virada de dia
    const naive = '2026-03-03T12:00:00.000';
    const resultado = formatarDataApenasData(naive);
    // 12:00:00 UTC → 09:00:00 BRT → ainda 03/03/2026
    expect(resultado).toBe('03/03/2026');
  });

  test('string naive próxima da meia-noite UTC → data BRT pode diferir da UTC', () => {
    // 2026-03-03T02:00:00 UTC → 2026-03-02T23:00:00 BRT → data é 02/03/2026
    const naive = '2026-03-03T02:00:00.000';
    const resultado = formatarDataApenasData(naive);
    expect(resultado).toBe('02/03/2026');
  });

  test('instância de Date → formata corretamente', () => {
    const date = new Date(Date.UTC(2026, 2, 15, 10, 0, 0));
    const resultado = formatarDataApenasData(date);
    // 10:00 UTC = 07:00 BRT → ainda 15/03/2026
    expect(resultado).toBe('15/03/2026');
  });

  test('null → não lança exceção', () => {
    expect(() => formatarDataApenasData(null)).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// formatarHora
// ─────────────────────────────────────────────────────────────────────────────

describe('formatarHora', () => {
  test('string naive → hora exibida em BRT (não UTC)', () => {
    // 14:59:45 UTC → 11:59:45 BRT
    const naive = '2026-03-03T14:59:45.000';
    const resultado = formatarHora(naive);
    expect(resultado).toBe('11:59:45');
  });

  test('string naive com espaço como separador → hora correta em BRT', () => {
    const naive = '2026-03-03 14:59:45';
    const resultado = formatarHora(naive);
    expect(resultado).toBe('11:59:45');
  });

  test('string com Z → hora correta em BRT', () => {
    const comZ = '2026-03-03T20:00:00.000Z';
    const resultado = formatarHora(comZ);
    // 20:00 UTC → 17:00 BRT
    expect(resultado).toBe('17:00:00');
  });

  test('instância de Date → hora correta em BRT', () => {
    const date = new Date(Date.UTC(2026, 2, 3, 18, 30, 0));
    const resultado = formatarHora(date);
    // 18:30 UTC → 15:30 BRT
    expect(resultado).toBe('15:30:00');
  });

  test('null → não lança exceção', () => {
    expect(() => formatarHora(null)).not.toThrow();
  });

  test(
    'offset de BRT é exatamente ' +
      SAO_PAULO_OFFSET_H +
      ' horas em março (sem horário de verão)',
    () => {
      // Verifica que a diferença entre UTC e BRT é de 3h em março
      const utcHora = 15;
      const naive = `2026-03-03T${String(utcHora).padStart(2, '0')}:00:00.000`;
      const resultado = formatarHora(naive);
      const brtHoraEsperada = utcHora - SAO_PAULO_OFFSET_H;
      expect(resultado).toContain(
        `${String(brtHoraEsperada).padStart(2, '0')}:`
      );
    }
  );
});
