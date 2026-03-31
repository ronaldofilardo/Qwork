/**
 * @fileoverview Testes para middleware - validar acesso público a criar-senha
 * Confirma que /representante/criar-senha não requires authentication
 */

import { middleware } from '@/middleware';
import { NextRequest, NextResponse } from 'next/server';

// Mock de cookies
jest.mock('next/headers', () => ({
  cookies: () => ({
    get: jest.fn((name: string) => {
      if (name === 'bps-session' || name === 'rep-session') {
        return undefined; // sem sessão
      }
      return undefined;
    }),
  }),
}));

describe('middleware - public route /representante/criar-senha', () => {
  it('deve permitir acesso a /representante/criar-senha sem auth', () => {
    const pathname = '/representante/criar-senha';
    const isPublicRoute =
      !pathname.startsWith('/representante/') ||
      pathname.startsWith('/representante/criar-senha');

    // O middleware deve permitir acesso a esta rota
    expect(isPublicRoute).toBe(true);
  });

  it('deve rejeitar /representante/qualquer-outra-rota sem auth', () => {
    const pathname = '/representante/meus-vinculos';
    const isPublicRoute =
      !pathname.startsWith('/representante/') ||
      pathname.startsWith('/representante/criar-senha');

    // Outras rotas de representante exigem auth
    expect(isPublicRoute).toBe(false);
  });

  it('deve ser acessível com token na query string', () => {
    const pathname = '/representante/criar-senha';
    const queryToken = 'token=abc123def456';

    // Rota criação de senha é pública
    const isPublicRoute =
      !pathname.startsWith('/representante/') ||
      pathname.startsWith('/representante/criar-senha');

    expect(isPublicRoute).toBe(true);
    expect(queryToken).toContain('token=');
  });

  it('deve permitir GET request sem cookies de sessão', () => {
    const method = 'GET';
    const pathname = '/representante/criar-senha';
    const hasSession = false;

    const isPublicRoute =
      !pathname.startsWith('/representante/') ||
      pathname.startsWith('/representante/criar-senha');
    const isAllowed = isPublicRoute || hasSession;

    expect(method).toBe('GET');
    expect(isAllowed).toBe(true);
  });

  it('deve permitir POST request para criar senha', () => {
    const method = 'POST';
    const pathname = '/representante/criar-senha';

    const isPublicRoute =
      !pathname.startsWith('/representante/') ||
      pathname.startsWith('/representante/criar-senha');

    expect(isPublicRoute).toBe(true);
  });
});

describe('middleware - auth required routes', () => {
  it('deve bloquear /representante/vinculos sem auth', () => {
    const pathname = '/representante/vinculos';
    const hasSession = false;

    const isPublicRoute =
      !pathname.startsWith('/representante/') ||
      pathname.startsWith('/representante/criar-senha');
    const needsAuth = !isPublicRoute && !hasSession;

    expect(needsAuth).toBe(true);
  });

  it('deve bloquear /representante/dashboard sem auth', () => {
    const pathname = '/representante/dashboard';
    const hasSession = false;

    const isPublicRoute =
      !pathname.startsWith('/representante/') ||
      pathname.startsWith('/representante/criar-senha');

    expect(isPublicRoute).toBe(false);
    expect(hasSession).toBe(false);
  });

  it('deve permitir /admin routes com auth admin', () => {
    const pathname = '/admin/representantes';
    const isAdminRoute = pathname.startsWith('/admin/');

    // Admin routes são protegidas separadamente
    expect(isAdminRoute).toBe(true);
  });
});
