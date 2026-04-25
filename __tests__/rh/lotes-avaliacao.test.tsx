/**
 * @file __tests__/rh/lotes-avaliacao.test.tsx
 * Testes: RH Empresa Dashboard - Sistema de Lotes
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import EmpresaDashboardPage from '@/app/rh/empresa/[id]/page';

// Mock do Next.js router
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  pathname: '/rh/empresa/1',
  query: { id: '1' },
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useParams: () => ({ id: '1' }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock do Chart.js
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
  },
}));

jest.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="chart-bar">Chart</div>,
}));

// Mock do componente Header
jest.mock('@/components/Header', () => {
  return function MockHeader() {
    return <div data-testid="header">Header</div>;
  };
});

// Mock do fetch global
const mockFetch = jest.spyOn(global, 'fetch');

// Mock do window.alert
const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});

describe('RH Empresa Dashboard - Sistema de Lotes', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Configurar mocks
    mockFetch.mockImplementation(async (url) => {
      const urlString = typeof url === 'string' ? url : url.toString();

      if (urlString === '/api/auth/session') {
        return {
          ok: true,
          json: async () =>
            await Promise.resolve({
              cpf: '11111111111',
              nome: 'Gestor RH',
              perfil: 'rh',
            }),
        } as Response;
      }

      if (urlString === '/api/rh/empresas') {
        return {
          ok: true,
          json: async () =>
            await Promise.resolve([
              {
                id: 1,
                nome: 'Indústria Metalúrgica São Paulo',
                cnpj: '11222333000144',
              },
            ]),
        } as Response;
      }

      if (urlString === '/api/rh/dashboard?empresa_id=1') {
        return {
          ok: true,
          json: async () =>
            await Promise.resolve({
              stats: {
                total_avaliacoes: 8,
                concluidas: 6,
                funcionarios_avaliados: 5,
              },
              resultados: [],
              distribuicao: [],
            }),
        } as Response;
      }

      if (urlString === '/api/admin/funcionarios?empresa_id=1') {
        return {
          ok: true,
          json: async () =>
            await Promise.resolve({
              funcionarios: [
                {
                  cpf: '12345678901',
                  nome: 'João Silva',
                  setor: 'Produção',
                  funcao: 'Operador',
                  ativo: true,
                  avaliacoes: [],
                },
              ],
            }),
        } as Response;
      }

      if (
        urlString === '/api/rh/lotes?empresa_id=1&limit=5' ||
        urlString === '/api/rh/lotes?empresa_id=1'
      ) {
        return {
          ok: true,
          json: async () =>
            await Promise.resolve({
              lotes: [
                {
                  id: 1,
                  titulo: 'Avaliação Trimestral Q4 2025',
                  tipo: 'completo',
                  status: 'ativo',
                  liberado_em: '2025-11-29T10:00:00Z',
                  total_avaliacoes: 5,
                  avaliacoes_concluidas: 3,
                  avaliacoes_inativadas: 0,
                },
              ],
            }),
        } as Response;
      }

      if (urlString === '/api/rh/laudos') {
        return {
          ok: true,
          json: async () => await Promise.resolve([]),
        } as Response;
      }

      // Mock da API de liberação de lote
      if (urlString === '/api/rh/liberar-lote') {
        return {
          ok: true,
          json: async () =>
            await Promise.resolve({
              success: true,
              lote: {
                id: 2,
                titulo: 'Novo Ciclo Criado',
                tipo: 'completo',
                status: 'ativo',
                liberado_em: new Date().toISOString(),
                total_avaliacoes: 1,
              },
            }),
        } as Response;
      }

      throw new Error(`URL não mapeada: ${urlString}`);
    });
  });

  afterEach(() => {
    mockFetch.mockRestore();
  });

  describe('Seção de Início de Ciclo', () => {
    it('deve exibir botão para iniciar novo ciclo', async () => {
      render(<EmpresaDashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('🚀 Iniciar Novo Ciclo')).toBeInTheDocument();
      });
    });

    it.skip('deve exibir lotes recentes na sidebar', async () => {
      render(<EmpresaDashboardPage />);

      await waitFor(
        () => {
          expect(screen.getByText('001-291125')).toBeInTheDocument();
          // Verifica que mostra as estatísticas do lote
          expect(screen.getByText('3')).toBeInTheDocument(); // avaliacoes_concluidas
          expect(screen.getByText('Pendente')).toBeInTheDocument(); // status
        },
        { timeout: 10000 }
      );
    });

    it('deve chamar a API diretamente ao clicar em Iniciar Ciclo (sem modal)', async () => {
      const user = userEvent.setup();
      render(<EmpresaDashboardPage />);

      const btn = await screen.findByRole('button', {
        name: /iniciar novo ciclo/i,
      });
      expect(btn).toBeInTheDocument();

      await user.click(btn);

      // Não deve abrir modal
      expect(
        screen.queryByText('Iniciar Ciclo de Coletas Avaliativas')
      ).toBeNull();

      // API deve ter sido chamada diretamente
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/rh/liberar-lote',
          expect.objectContaining({ method: 'POST' })
        );
      });
    });

    it('deve navegar para página do lote após sucesso', async () => {
      const user = userEvent.setup();
      render(<EmpresaDashboardPage />);

      const btn = await screen.findByRole('button', {
        name: /iniciar novo ciclo/i,
      });
      await user.click(btn);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/rh/empresa/1/lote/2');
      });
    });

    it('não deve navegar quando a API retorna sucesso sem lote', async () => {
      const user = userEvent.setup();
      render(<EmpresaDashboardPage />);

      // Aguarda componente carregar antes de trocar o mock
      const btn = await screen.findByRole('button', {
        name: /iniciar novo ciclo/i,
      });

      // Agora sobrescreve o mock só para liberar-lote sem lote no retorno
      mockFetch.mockImplementation(async (url: RequestInfo | URL) => {
        const urlString =
          typeof url === 'string' ? url : ((url as Request).url ?? String(url));
        if (urlString === '/api/rh/liberar-lote') {
          return {
            ok: true,
            json: async () => ({ success: true }),
          } as Response;
        }
        return Promise.reject(new Error(`URL inesperada: ${urlString}`));
      });

      await user.click(btn);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/rh/liberar-lote',
          expect.objectContaining({ method: 'POST' })
        );
      });

      // Não deve navegar
      expect(mockRouter.push).not.toHaveBeenCalledWith(
        expect.stringContaining('/lote/')
      );
    });
  });

  describe('Integração com API de Lotes', () => {
    it('deve chamar API de liberação de lote corretamente', async () => {
      const user = userEvent.setup();
      render(<EmpresaDashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('🚀 Iniciar Novo Ciclo')).toBeInTheDocument();
      });

      await user.click(screen.getByText('🚀 Iniciar Novo Ciclo'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/rh/liberar-lote',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
            }),
          })
        );
      });
    });

    it('deve Iniciar Ciclo com sucesso', async () => {
      const user = userEvent.setup();
      render(<EmpresaDashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('🚀 Iniciar Novo Ciclo')).toBeInTheDocument();
      });

      await user.click(screen.getByText('🚀 Iniciar Novo Ciclo'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/rh/liberar-lote',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
            }),
          })
        );
      });
    });

    it('navega para detalhes do lote após sucesso (fluxo RH)', async () => {
      const user = userEvent.setup();
      render(<EmpresaDashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('🚀 Iniciar Novo Ciclo')).toBeInTheDocument();
      });

      await user.click(screen.getByText('🚀 Iniciar Novo Ciclo'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/rh/liberar-lote',
          expect.objectContaining({ method: 'POST' })
        );

        expect(mockRouter.push).toHaveBeenCalledWith('/rh/empresa/1/lote/2');
      });
    });

    it('quando resposta RH não traz lote, não navega', async () => {
      const user = userEvent.setup();
      render(<EmpresaDashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('🚀 Iniciar Novo Ciclo')).toBeInTheDocument();
      });

      mockFetch.mockImplementationOnce(async (url: string) => {
        if (url === '/api/rh/liberar-lote') {
          return {
            ok: true,
            json: async () => ({ success: true }),
          } as Response;
        }
        return Promise.reject(new Error('URL inesperada'));
      });

      await user.click(screen.getByText('🚀 Iniciar Novo Ciclo'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/rh/liberar-lote',
          expect.objectContaining({ method: 'POST' })
        );

        expect(mockRouter.push).not.toHaveBeenCalledWith(
          expect.stringContaining('/lote/')
        );
      });
    });
  });

  describe('Overlay de Loading ao Iniciar Ciclo', () => {
    it('exibe overlay de loading enquanto API está em andamento', async () => {
      let resolveLiberar!: (value: Response) => void;
      const pendingPromise = new Promise<Response>((resolve) => {
        resolveLiberar = resolve;
      });

      // Substitui APENAS a chamada ao liberar-lote por uma promise pendente
      const originalImpl = mockFetch.getMockImplementation();
      mockFetch.mockImplementation(
        async (url: RequestInfo | URL, init?: RequestInit) => {
          const urlString =
            typeof url === 'string'
              ? url
              : ((url as Request).url ?? String(url));
          if (urlString === '/api/rh/liberar-lote') {
            return pendingPromise;
          }
          return originalImpl!(url, init);
        }
      );

      const user = userEvent.setup();
      render(<EmpresaDashboardPage />);

      await waitFor(() => {
        expect(
          screen.getByText('\u{1F680} Iniciar Novo Ciclo')
        ).toBeInTheDocument();
      });

      // Clicar no botão inicia a operação
      await user.click(screen.getByText('\u{1F680} Iniciar Novo Ciclo'));

      // Overlay deve aparecer enquanto API ainda não respondeu
      await waitFor(() => {
        expect(
          screen.getByTestId('liberando-ciclo-overlay')
        ).toBeInTheDocument();
      });

      // Botão deve estar desabilitado
      expect(
        screen.getByRole('button', { name: /iniciar novo ciclo|liberando/i })
      ).toBeDisabled();

      // Resolver a API
      resolveLiberar({
        ok: true,
        json: async () => ({ success: true, lote: { id: 99 } }),
      } as Response);

      // Overlay deve sumir após a API responder
      await waitFor(() => {
        expect(
          screen.queryByTestId('liberando-ciclo-overlay')
        ).not.toBeInTheDocument();
      });
    });

    it('oculta overlay mesmo quando API retorna erro', async () => {
      mockFetch.mockImplementation(async (url: RequestInfo | URL) => {
        const urlString =
          typeof url === 'string' ? url : ((url as Request).url ?? String(url));
        if (urlString === '/api/rh/liberar-lote') {
          return {
            ok: false,
            json: async () => ({ error: 'Nenhum funcionário elegível' }),
          } as Response;
        }
        // demais URLs usam o mock padrão do beforeEach
        const defaults: Record<string, unknown> = {
          '/api/auth/session': {
            cpf: '11111111111',
            nome: 'Gestor RH',
            perfil: 'rh',
          },
          '/api/rh/empresas': [
            {
              id: 1,
              nome: 'Indústria Metalúrgica São Paulo',
              cnpj: '11222333000144',
            },
          ],
          '/api/rh/dashboard?empresa_id=1': {
            stats: {
              total_avaliacoes: 8,
              concluidas: 6,
              funcionarios_avaliados: 5,
            },
            resultados: [],
            distribuicao: [],
          },
          '/api/admin/funcionarios?empresa_id=1': { funcionarios: [] },
          '/api/rh/lotes?empresa_id=1&limit=5': { lotes: [] },
          '/api/rh/lotes?empresa_id=1': { lotes: [] },
          '/api/rh/laudos': [],
        };
        if (urlString in defaults) {
          return {
            ok: true,
            json: async () => defaults[urlString],
          } as Response;
        }
        throw new Error(`URL não mapeada: ${urlString}`);
      });

      const user = userEvent.setup();
      render(<EmpresaDashboardPage />);

      await waitFor(() => {
        expect(
          screen.getByText('\u{1F680} Iniciar Novo Ciclo')
        ).toBeInTheDocument();
      });

      await user.click(screen.getByText('\u{1F680} Iniciar Novo Ciclo'));

      // Overlay deve sumir após erro
      await waitFor(() => {
        expect(
          screen.queryByTestId('liberando-ciclo-overlay')
        ).not.toBeInTheDocument();
      });
    });
  });
});
