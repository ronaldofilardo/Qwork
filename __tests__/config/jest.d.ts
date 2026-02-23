import '@testing-library/jest-dom';

// Extende os tipos do Jest para incluir matchers do jest-dom
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveClass(...classNames: string[]): R;
      toHaveAttribute(attr: string, value?: string): R;
      toHaveValue(value: string | number | string[]): R;
      toBeChecked(): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toBeVisible(): R;
      toBeEmptyDOMElement(): R;
      toContainElement(element: HTMLElement | null): R;
      toHaveTextContent(text: string | RegExp): R;
      toHaveDisplayValue(value: string | RegExp | (string | RegExp)[]): R;
      toHaveFocus(): R;
      toHaveFormValues(expectedValues: Record<string, unknown>): R;
      toHaveStyle(css: string | Record<string, unknown>): R;
      toBePartiallyChecked(): R;

      // Matchers adicionais de acessibilidade
      toHaveRole(role: string): R;
      toHaveAccessibleName(name?: string | RegExp): R;
      toHaveAccessibleDescription(desc?: string | RegExp): R;
      toHaveErrorMessage(msg?: string | RegExp): R;
      toBeRequired(): R;
      toBeInvalid(): R;
      toBeValid(): R;
    }
  }

  // ── Tipos utilitários globais para helpers de testes ─────────────────────

  /** Tipo tipado para mocks de query do db */
  type MockedQuery = jest.MockedFunction<
    (
      sql: string,
      params?: unknown[]
    ) => Promise<{ rows: unknown[]; rowCount: number }>
  >;

  /** Helper para tipar objetos de sessão mockados nos testes */
  interface MockSession {
    cpf: string;
    nome?: string;
    perfil: 'admin' | 'gestor' | 'rh' | 'funcionario' | 'emissor';
    entidade_id?: number;
    clinica_id?: number;
    tomador_id?: number;
    mfaVerified?: boolean;
  }
}
