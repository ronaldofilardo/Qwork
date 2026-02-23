/**
 * @file custom-matchers.ts
 * ─────────────────────────────────────────────────────────────
 * Custom Jest matchers para o projeto QWork.
 *
 * PROBLEMA RESOLVIDO:
 *  Testes que usam `toBe('mensagem exata')` para verificar mensagens de erro
 *  quebram toda vez que há uma pequena mudança de capitalização ou pontuação.
 *  Ex: 'Tomador inativo.' vs 'Tomador Inativo' vs 'tomador inativo'.
 *
 *  A solução é usar padrões, não strings exatas, para mensagens de erro.
 *
 * REGISTRO:
 *  Este arquivo é registrado automaticamente via jest.react-setup.js.
 *  NÃO é necessário importar em cada test file.
 *
 * MATCHERS DISPONÍVEIS (acessíveis via `expect(value).matcher()`):
 *
 *   toMatchErrorPattern(pattern)      — verifica erro por regex/substring
 *   toBeApiError(statusCode?, msg?)   — verifica Response de API com erro
 *   toHaveRowCount(n)                 — verifica QueryResult do pg
 *   toBeValidId()                     — verifica se é número inteiro > 0
 *   toContainRows(subset)             — verifica subconjunto de rows
 */

// ────────────────────────────────────────────────────────────
// Extensão de tipos do Jest
// ────────────────────────────────────────────────────────────

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      /**
       * Verifica se o valor (string ou objeto com propriedade `error`/`message`)
       * corresponde ao padrão fornecido (RegExp ou substring case-insensitive).
       *
       * @example
       * expect(data.error).toMatchErrorPattern(/inativo/i);
       * expect(data.error).toMatchErrorPattern('inativo');
       */
      toMatchErrorPattern(pattern: string | RegExp): R;

      /**
       * Verifica se a resposta de uma API route retornou erro.
       * Aceita tanto `{ error: '...' }` quanto `{ message: '...' }`.
       *
       * @example
       * const res = await fetch('/api/rh/lotes');
       * const data = await res.json();
       * expect({ status: res.status, data }).toBeApiError(403, /sem permissão/i);
       */
      toBeApiError(statusCode?: number, messagePattern?: string | RegExp): R;

      /**
       * Verifica se o QueryResult do pg tem exatamente N linhas.
       *
       * @example
       * const result = await query('SELECT * FROM clinicas');
       * expect(result).toHaveRowCount(3);
       */
      toHaveRowCount(expectedCount: number): R;

      /**
       * Verifica se o valor é um ID válido (number inteiro > 0).
       *
       * @example
       * const id = await makeClinica();
       * expect(id).toBeValidId();
       */
      toBeValidId(): R;

      /**
       * Verifica se rows[] contém pelo menos um item que corresponde ao subconjunto.
       * Usa `expect.objectContaining` internamente.
       *
       * @example
       * expect(result.rows).toContainRowMatching({ status: 'aprovado' });
       */
      toContainRowMatching(subset: Record<string, unknown>): R;
    }
  }
}

// ────────────────────────────────────────────────────────────
// Implementações
// ────────────────────────────────────────────────────────────

function matchesPattern(value: string, pattern: string | RegExp): boolean {
  if (pattern instanceof RegExp) return pattern.test(value);
  return value.toLowerCase().includes(pattern.toLowerCase());
}

const customMatchers: jest.ExpectExtend = {
  // ── toMatchErrorPattern ─────────────────────────────────
  toMatchErrorPattern(
    this: jest.MatcherContext,
    received: unknown,
    pattern: string | RegExp
  ) {
    const str =
      typeof received === 'string'
        ? received
        : typeof received === 'object' && received !== null
          ? ((received as Record<string, unknown>).error ??
            (received as Record<string, unknown>).message ??
            JSON.stringify(received))
          : String(received);

    const pass = matchesPattern(String(str), pattern);
    const patternStr =
      pattern instanceof RegExp ? pattern.toString() : `"${pattern}"`;

    return {
      pass,
      message: () =>
        pass
          ? `Expected error NOT to match ${patternStr}, but it did.\nReceived: "${str}"`
          : `Expected error to match ${patternStr}.\nReceived: "${str}"`,
    };
  },

  // ── toBeApiError ────────────────────────────────────────
  toBeApiError(
    this: jest.MatcherContext,
    received: unknown,
    statusCode?: number,
    messagePattern?: string | RegExp
  ) {
    if (typeof received !== 'object' || received === null) {
      return {
        pass: false,
        message: () =>
          `Expected an object with { status, data }, got: ${typeof received}`,
      };
    }

    const obj = received as { status?: number; data?: Record<string, unknown> };
    const status = obj.status;
    const data = obj.data ?? {};
    const errorMsg = String(data.error ?? data.message ?? '');

    const statusOk = statusCode === undefined || status === statusCode;
    const messageOk =
      messagePattern === undefined || matchesPattern(errorMsg, messagePattern);

    const pass = statusOk && messageOk && (!!data.error || !!data.message);
    const issues: string[] = [];
    if (!statusOk) issues.push(`expected status ${statusCode}, got ${status}`);
    if (!messageOk) {
      const pat =
        messagePattern instanceof RegExp
          ? messagePattern.toString()
          : `"${messagePattern}"`;
      issues.push(`expected message to match ${pat}, got "${errorMsg}"`);
    }
    if (!data.error && !data.message)
      issues.push(`data has no 'error' or 'message' key`);

    return {
      pass,
      message: () =>
        pass
          ? `Expected response NOT to be an API error`
          : `Expected API error response.\nIssues:\n  - ${issues.join('\n  - ')}\nReceived: ${JSON.stringify(obj)}`,
    };
  },

  // ── toHaveRowCount ──────────────────────────────────────
  toHaveRowCount(
    this: jest.MatcherContext,
    received: unknown,
    expectedCount: number
  ) {
    const result = received as { rows?: unknown[]; rowCount?: number };
    const actual = result.rows?.length ?? result.rowCount ?? -1;
    const pass = actual === expectedCount;

    return {
      pass,
      message: () =>
        pass
          ? `Expected QueryResult NOT to have ${expectedCount} rows`
          : `Expected QueryResult to have ${expectedCount} rows, but got ${actual}.\nrows: ${JSON.stringify(result.rows)}`,
    };
  },

  // ── toBeValidId ─────────────────────────────────────────
  toBeValidId(this: jest.MatcherContext, received: unknown) {
    const pass =
      typeof received === 'number' &&
      Number.isInteger(received) &&
      received > 0;

    return {
      pass,
      message: () =>
        pass
          ? `Expected ${received} NOT to be a valid ID (positive integer)`
          : `Expected a valid ID (positive integer > 0), got: ${received} (${typeof received})`,
    };
  },

  // ── toContainRowMatching ────────────────────────────────
  toContainRowMatching(
    this: jest.MatcherContext,
    received: unknown,
    subset: Record<string, unknown>
  ) {
    if (!Array.isArray(received)) {
      return {
        pass: false,
        message: () => `Expected an array of rows, got ${typeof received}`,
      };
    }

    const pass = received.some((row) =>
      Object.entries(subset).every(([key, val]) => {
        const rowVal = (row as Record<string, unknown>)[key];
        if (val instanceof RegExp) return val.test(String(rowVal));
        return rowVal === val;
      })
    );

    return {
      pass,
      message: () =>
        pass
          ? `Expected rows NOT to contain a row matching ${JSON.stringify(subset)}`
          : `Expected rows to contain a row matching ${JSON.stringify(subset)}.\nRows received:\n${JSON.stringify(received, null, 2)}`,
    };
  },
};

// ────────────────────────────────────────────────────────────
// Registro
// ────────────────────────────────────────────────────────────

expect.extend(customMatchers);

export {};
