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

  it('deve renderizar dashboard com abas de Clínicas e Emissores', async () => {
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

      if (url === '/api/admin/clinicas') {
        return Promise.resolve(
          createMockResponse([
            {
              id: 1,
              nome: 'Clínica São Paulo',
              ativa: true,
            },
          ])
        );
      }

      if (url === '/api/admin/clinicas/stats') {
        return Promise.resolve(
          createMockResponse({
            success: true,
            data: [
              {
                clinica_id: 1,
                total_empresas: 5,
                total_lotes: 10,
                total_avaliacoes: 100,
                avaliacoes_concluidas: 80,
                avaliacoes_em_andamento: 20,
              },
            ],
          })
        );
      }

      return Promise.resolve(createMockResponse({ error: 'Not found' }, false));
    });

    render(<AdminPage />);

    // Aguarda carregamento
    await waitFor(() => {
      expect(screen.getByText('Painel Administrativo')).toBeInTheDocument();
    });

    // Verifica título e descrição
    expect(screen.getByText('Painel Administrativo')).toBeInTheDocument();
    expect(screen.getByText('Bem-vindo,')).toBeInTheDocument();

    // Clica na seção tomadores para expandir
    const tomadoresButton = screen.getByRole('button', { name: /tomadores/i });
    await user.click(tomadoresButton);

    // Verifica se abas existem
    expect(screen.getByText('tomadores')).toBeInTheDocument();
    expect(screen.getByText('Clínicas')).toBeInTheDocument();
    expect(screen.getByText('Entidades')).toBeInTheDocument();
  });

  it('deve fazer fetch dos dados das clínicas', async () => {
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

      if (url === '/api/admin/clinicas') {
        return Promise.resolve(
          createMockResponse([
            { id: 1, nome: 'Clínica A', ativa: true },
            { id: 2, nome: 'Clínica B', ativa: true },
          ])
        );
      }

      if (url === '/api/admin/clinicas/stats') {
        return Promise.resolve(
          createMockResponse({
            success: true,
            data: [
              {
                clinica_id: 1,
                total_empresas: 10,
                total_lotes: 5,
                total_avaliacoes: 200,
                avaliacoes_concluidas: 180,
                avaliacoes_em_andamento: 20,
              },
              {
                clinica_id: 2,
                total_empresas: 8,
                total_lotes: 3,
                total_avaliacoes: 150,
                avaliacoes_concluidas: 140,
                avaliacoes_em_andamento: 10,
              },
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
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/tomadores?tipo=clinica'
      );
      // stats endpoint foi removido do fluxo; não é mais chamado pelo componente
    });
  });

  it('deve permitir alternar entre abas Clínicas e Emissores', async () => {
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

      if (url === '/api/admin/clinicas') {
        return Promise.resolve(createMockResponse([]));
      }

      if (url === '/api/admin/clinicas/stats') {
        return Promise.resolve(createMockResponse({ success: true, data: [] }));
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
      expect(screen.getByText('Painel Administrativo')).toBeInTheDocument();
    });

    // Clica na seção tomadores para expandir
    const tomadoresButton = screen.getByRole('button', { name: /tomadores/i });
    await user.click(tomadoresButton);

    // Verifica que podemos clicar nas abas
    const clinicasElements = screen.getAllByText('Clínicas');
    const entidadesElement = screen.getByText('Entidades');

    expect(clinicasElements.length).toBeGreaterThan(0);
    expect(entidadesElement).toBeInTheDocument();
  });
});
