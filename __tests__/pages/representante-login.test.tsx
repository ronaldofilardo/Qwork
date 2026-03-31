/**
 * @fileoverview Testes da página de Login do Representante
 */
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { jest } from '@jest/globals';

// next/navigation is globally mocked in jest.setup.js
// Override useRouter to return a shared mock we can track
const nextNavigation = require('next/navigation');
const mockPush = jest.fn();

const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

import LoginRepresentante from '@/app/representante/login/page';

describe('Página Login Representante', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockPush.mockClear();
    jest.spyOn(nextNavigation, 'useRouter').mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    });
    mockFetch.mockReset();
  });

  it('deve renderizar formulário de login', () => {
    render(<LoginRepresentante />);
    expect(screen.getByText(/portal do representante/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
  });

  it('deve exibir campos de email e código', () => {
    render(<LoginRepresentante />);
    const emailInput = screen.getByPlaceholderText(/email/i);
    const codigoInput = screen.getByPlaceholderText('XXXX-XXXX');
    expect(emailInput).toBeInTheDocument();
    expect(codigoInput).toBeInTheDocument();
  });

  it('deve chamar API de login ao submeter', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    } as Response);

    render(<LoginRepresentante />);

    const emailInput = screen.getByPlaceholderText(/email/i);
    const codigoInput = screen.getByPlaceholderText('XXXX-XXXX');

    fireEvent.change(emailInput, { target: { value: 'rep@test.dev' } });
    fireEvent.change(codigoInput, { target: { value: 'AB12-CD34' } });

    const form = emailInput.closest('form');
    if (form) fireEvent.submit(form);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/representante/login',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('rep@test.dev'),
        })
      );
    });
  });

  it('deve redirecionar para dashboard após login sucesso', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    } as Response);

    render(<LoginRepresentante />);

    const emailInput = screen.getByPlaceholderText(/email/i);
    const codigoInput = screen.getByPlaceholderText('XXXX-XXXX');

    fireEvent.change(emailInput, { target: { value: 'rep@test.dev' } });
    fireEvent.change(codigoInput, { target: { value: 'AB12-CD34' } });

    await act(async () => {
      const form = emailInput.closest('form');
      if (form) fireEvent.submit(form);
      await new Promise((r) => setTimeout(r, 100));
    });

    expect(mockPush).toHaveBeenCalledWith('/representante/dashboard');
  });

  it('deve exibir erro quando login falha', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Credenciais inválidas' }),
    } as Response);

    render(<LoginRepresentante />);

    const emailInput = screen.getByPlaceholderText(/email/i);
    const codigoInput = screen.getByPlaceholderText('XXXX-XXXX');

    fireEvent.change(emailInput, { target: { value: 'bad@test.dev' } });
    fireEvent.change(codigoInput, { target: { value: 'XXXX-XXXX' } });

    const form = emailInput.closest('form');
    if (form) fireEvent.submit(form);

    await waitFor(() => {
      const text = document.body.textContent || '';
      expect(text).toMatch(/inválid|erro/i);
    });
  });
});
