/**
 * @fileoverview Testes da página de Login do Representante
 *
 * A página /representante/login foi convertida para redirect server-side
 * para /login. O login unificado (/api/auth/login) gerencia todos os perfis.
 */
const mockRedirect = jest.fn();
jest.mock('next/navigation', () => ({
  redirect: (url: string) => mockRedirect(url),
}));

import LoginRepresentante from '@/app/representante/login/page';

describe('Página Login Representante', () => {
  beforeEach(() => {
    mockRedirect.mockClear();
  });

  it('deve redirecionar para /login (login unificado)', () => {
    LoginRepresentante();
    expect(mockRedirect).toHaveBeenCalledWith('/login');
  });

  it('deve exportar uma função padrão', () => {
    expect(typeof LoginRepresentante).toBe('function');
  });
});
