/**
 * @fileoverview Testes do Portal Layout e páginas do representante
 */
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { jest } from '@jest/globals';

// next/navigation is globally mocked in jest.setup.js
// Override useRouter/usePathname with spies to get trackable instances
const nextNavigation = require('next/navigation');
const mockPush = jest.fn();
const mockPathname = jest.fn().mockReturnValue('/representante/dashboard');

const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

jest.spyOn(console, 'error').mockImplementation(() => {});

const mockSession = {
  id: 1,
  nome: 'Carlos Rep',
  email: 'carlos@test.dev',
  codigo: 'AB12-CD34',
  status: 'apto',
  tipo_pessoa: 'pf',
  telefone: '11999990000',
  aceite_termos: true,
  aceite_disclaimer_nv: true,
  criado_em: '2026-01-01T00:00:00Z',
  aprovado_em: '2026-01-15T00:00:00Z',
};

// Importar layout dinamicamente (é 'use client')
import PortalLayout from '@/app/representante/(portal)/layout';

describe('Portal Layout do Representante', () => {
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
    jest.spyOn(nextNavigation, 'usePathname').mockReturnValue(mockPathname());
  });

  it('deve exibir loading enquanto carrega sessão', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));
    render(<PortalLayout><div>Conteúdo filho</div></PortalLayout>);
    expect(document.querySelector('.animate-spin')).toBeTruthy();
  });

  it('deve redirecionar para login quando API /me retorna erro', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 401, json: () => Promise.resolve({}) } as Response);

    await act(async () => {
      render(<PortalLayout><div>Conteúdo</div></PortalLayout>);
      // Allow useEffect async callback to complete
      await new Promise((r) => setTimeout(r, 100));
    });

    expect(mockPush).toHaveBeenCalledWith('/representante/login');
  });

  it('deve renderizar conteúdo quando sessão é válida', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ representante: mockSession }),
    } as Response);

    render(<PortalLayout><div data-testid="child">Conteúdo filho</div></PortalLayout>);

    await waitFor(() => {
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });
  });

  it('deve exibir nome do representante no header', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ representante: mockSession }),
    } as Response);

    render(<PortalLayout><div>Filho</div></PortalLayout>);

    await waitFor(() => {
      expect(screen.getByText(/Carlos Rep/i)).toBeInTheDocument();
    });
  });

  it('deve exibir links de navegação (Dashboard, Leads, Vínculos, Comissões)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ representante: mockSession }),
    } as Response);

    render(<PortalLayout><div>Filho</div></PortalLayout>);

    await waitFor(() => {
      // Desktop + mobile nav links render duplicates
      expect(screen.getAllByText('Dashboard').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Leads').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Vínculos').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Comissões').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('deve chamar logout ao clicar no botão de sair', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ representante: mockSession }),
    } as Response);

    render(<PortalLayout><div>Filho</div></PortalLayout>);

    await waitFor(() => {
      expect(screen.getByText(/Carlos Rep/i)).toBeInTheDocument();
    });

    // Encontrar botão de logout
    const logoutBtn = screen.getByText(/sair/i) || screen.getByRole('button', { name: /logout|sair/i });
    if (logoutBtn) {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) } as Response);
      fireEvent.click(logoutBtn);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/representante/logout', expect.objectContaining({ method: 'POST' }));
      });
    }
  });
});
