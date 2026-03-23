/**
 * Testes para o dashboard de administração (admin page)
 * - Renderização do dashboard com abas de Clínicas e Emissores
 * - Fetch de dados das clínicas e estatísticas
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminPage from '@/app/admin/page';

// Mock do Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// Helper para criar resposta mockada
const createMockResponse = (data: unknown, ok = true) => ({
  ok,
  json: () => Promise.resolve(data),
  text: () => Promise.resolve(JSON.stringify(data)),
  status: ok ? 200 : 404,
  statusText: ok ? 'OK' : 'Not Found',
  headers: new Headers(),
  redirected: false,
  url: '',
});

describe('AdminPage - Dashboard de Administração', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar dashboard com seções de Volume e Emissores', async () => {
    const user = userEvent.setup();
    // Mock da sessão
    mockFetch.mockImplementation((url) => {
      if (url === '/api/auth/session') {
        return Promise.resolve(
          createMockResponse({
            cpf: '00000000000',
            nome: 'Admin Teste',
            perfil: 'admin',
          })
        );
      }

      if (url === '/api/admin/emissores') {
        return Promise.resolve(
          createMockResponse({
            success: true,
            emissores: [{ id: 1, ativo: true }],
          })
        );
      }

      return Promise.resolve(createMockResponse({ error: 'Not found' }, false));
    });

    render(<AdminPage />);

    // Aguarda carregamento
    await waitFor(() => {
      const headings = screen.getAllByText('Painel Administrativo');
      expect(headings.length).toBeGreaterThan(0);
    });

    // Verifica título e boas-vindas
    const headings = screen.getAllByText('Painel Administrativo');
    expect(headings[0]).toBeInTheDocument();
    expect(screen.getByText('Bem-vindo,')).toBeInTheDocument();

    // Verifica seções da sidebar
    expect(screen.getByRole('button', { name: /volume/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /emissores/i })
    ).toBeInTheDocument();
  });

  it('deve fazer fetch dos dados de emissores', async () => {
    mockFetch.mockImplementation((url) => {
      if (url === '/api/auth/session') {
        return Promise.resolve(
          createMockResponse({
            cpf: '00000000000',
            nome: 'Admin Teste',
            perfil: 'admin',
          })
        );
      }

      if (url === '/api/admin/emissores') {
        return Promise.resolve(
          createMockResponse({
            success: true,
            emissores: [
              { id: 1, ativo: true },
              { id: 2, ativo: false },
            ],
          })
        );
      }

      return Promise.resolve(createMockResponse({ error: 'Not found' }, false));
    });

    render(<AdminPage />);

    // Aguarda carregamento e fetch dos dados
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/session');
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/emissores');
    });
  });

  it('deve permitir alternar entre seções Volume e Emissores', async () => {
    const user = userEvent.setup();

    mockFetch.mockImplementation((url) => {
      if (url === '/api/auth/session') {
        return Promise.resolve(
          createMockResponse({
            cpf: '00000000000',
            nome: 'Admin Teste',
            perfil: 'admin',
          })
        );
      }

      if (url === '/api/admin/emissores') {
        return Promise.resolve(
          createMockResponse({ success: true, emissores: [] })
        );
      }

      return Promise.resolve(createMockResponse({ error: 'Not found' }, false));
    });

    render(<AdminPage />);

    // Aguarda carregamento inicial
    await waitFor(() => {
      const headings = screen.getAllByText('Painel Administrativo');
      expect(headings.length).toBeGreaterThan(0);
    });

    // Clica no botão Volume
    const volumeButton = screen.getByRole('button', { name: /volume/i });
    await user.click(volumeButton);

    // Clica em Emissores
    const emissoresButton = screen.getByRole('button', { name: /emissores/i });
    await user.click(emissoresButton);

    expect(
      screen.getByRole('button', { name: /financeiro/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /auditorias/i })
    ).toBeInTheDocument();
  });
});
