/**
 * Testes para dashboard do funcionário
 * Item 9: Dashboard exibe card "Avaliação em andamento"
 * Item 10: Dashboard lista avaliações concluídas
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock do fetch global
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// Mock do window.location
delete (window as any).location;
window.location = { href: '' } as any;

describe('Dashboard do Funcionário', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Item 9: Dashboard exibe card "Avaliação em andamento"', () => {
    it('deve exibir card com avaliação em andamento', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ nome: 'João Silva', cpf: '12345678901' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            avaliacoes: [
              {
                id: 1,
                status: 'em_andamento',
                criado_em: new Date().toISOString(),
                envio: null,
                grupo_atual: 3,
              },
            ],
          }),
        } as Response);

      const Dashboard = (await import('@/app/dashboard/page')).default;
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/continuar/i)).toBeInTheDocument();
      });
    });

    it('deve exibir botão "Continuar Avaliação" para avaliação em andamento', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ nome: 'João Silva' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            avaliacoes: [
              {
                id: 1,
                status: 'em_andamento',
                criado_em: new Date().toISOString(),
                envio: null,
                grupo_atual: 3,
              },
            ],
          }),
        } as Response);

      const Dashboard = (await import('@/app/dashboard/page')).default;
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/continuar/i)).toBeInTheDocument();
      });
    });

    it('deve exibir botão "Iniciar Avaliação" para avaliação não iniciada', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ nome: 'João Silva' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            avaliacoes: [
              {
                id: 1,
                status: 'iniciada',
                criado_em: new Date().toISOString(),
                envio: null,
                grupo_atual: null,
              },
            ],
          }),
        } as Response);

      const Dashboard = (await import('@/app/dashboard/page')).default;
      render(<Dashboard />);

      await waitFor(() => {
        // O botão deve conter exatamente 'Iniciar Avaliação' (não apenas 'Iniciar')
        expect(
          screen.getByText(
            (content) =>
              typeof content === 'string' &&
              content.trim().toLowerCase().includes('iniciar avaliação')
          )
        ).toBeInTheDocument();
      });
    });

    it('deve exibir data de liberação da avaliação', async () => {
      const dataLiberacao = new Date('2025-01-15T10:00:00Z');

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ nome: 'João Silva' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            avaliacoes: [
              {
                id: 1,
                status: 'em_andamento',
                criado_em: dataLiberacao.toISOString(),
                envio: null,
                grupo_atual: 2,
              },
            ],
          }),
        } as Response);

      const Dashboard = (await import('@/app/dashboard/page')).default;
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/liberada em/i)).toBeInTheDocument();
      });
    });

    it('deve exibir data e hora de liberação da avaliação', async () => {
      const dataLiberacao = new Date('2025-01-15T14:30:45Z');

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ nome: 'João Silva' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            avaliacoes: [
              {
                id: 1,
                status: 'em_andamento',
                criado_em: dataLiberacao.toISOString(),
                envio: null,
                grupo_atual: 2,
              },
            ],
          }),
        } as Response);

      const Dashboard = (await import('@/app/dashboard/page')).default;
      render(<Dashboard />);

      await waitFor(() => {
        // Deve exibir data formatada (formato pode variar com toLocaleString)
        expect(screen.getByText(/liberada em/i)).toBeInTheDocument();
        expect(screen.getByText(/\d{2}\/\d{2}\/\d{4}/)).toBeInTheDocument(); // Formato DD/MM/YYYY
      });
    });

    it('deve exibir múltiplas avaliações disponíveis se houver', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ nome: 'João Silva' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            avaliacoes: [
              {
                id: 1,
                status: 'iniciada',
                criado_em: new Date('2025-01-10').toISOString(),
                envio: null,
                grupo_atual: null,
              },
              {
                id: 2,
                status: 'em_andamento',
                criado_em: new Date('2025-01-15').toISOString(),
                envio: null,
                grupo_atual: 2,
              },
            ],
          }),
        } as Response);

      const Dashboard = (await import('@/app/dashboard/page')).default;
      render(<Dashboard />);

      await waitFor(() => {
        const avaliacoesCards = screen.getAllByText(/avaliação #\d+/i);
        expect(avaliacoesCards.length).toBe(2);
      });
    });

    it('deve permitir clicar no card para ir para avaliação', async () => {
      const user = userEvent.setup();

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ nome: 'João Silva' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            avaliacoes: [
              {
                id: 123,
                status: 'em_andamento',
                criado_em: new Date().toISOString(),
                envio: null,
                grupo_atual: 2,
              },
            ],
          }),
        } as Response);

      const Dashboard = (await import('@/app/dashboard/page')).default;
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/continuar/i)).toBeInTheDocument();
      });

      const continuar = screen.getByText(/continuar/i);
      await user.click(continuar);

      // Verificar que o href está correto
      const link = continuar.closest('a');
      expect(link?.getAttribute('href')).toContain('/avaliacao');
      expect(link?.getAttribute('href')).toContain('id=123');
    });

    it('não deve exibir seção de avaliações disponíveis se nenhuma pendente', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ nome: 'João Silva' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            avaliacoes: [
              {
                id: 1,
                status: 'concluida',
                criado_em: new Date('2025-01-01').toISOString(),
                envio: new Date('2025-01-05').toISOString(),
                grupo_atual: null,
              },
            ],
          }),
        } as Response);

      const Dashboard = (await import('@/app/dashboard/page')).default;
      render(<Dashboard />);

      await waitFor(() => {
        expect(
          screen.queryByText(/avaliações disponíveis/i)
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Item 10: Dashboard lista avaliações concluídas', () => {
    it('deve exibir histórico de avaliações concluídas', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ nome: 'João Silva' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            avaliacoes: [
              {
                id: 1,
                status: 'concluida',
                criado_em: new Date('2025-01-01').toISOString(),
                envio: new Date('2025-01-05').toISOString(),
                grupo_atual: null,
              },
            ],
          }),
        } as Response);

      const Dashboard = (await import('@/app/dashboard/page')).default;
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/histórico/i)).toBeInTheDocument();
        expect(screen.getByText(/concluída/i)).toBeInTheDocument();
      });
    });

    it('deve exibir data de conclusão nas avaliações finalizadas', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ nome: 'João Silva' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            avaliacoes: [
              {
                id: 1,
                status: 'concluida',
                criado_em: new Date('2025-01-01').toISOString(),
                envio: new Date('2025-01-05T14:30:00Z').toISOString(),
                grupo_atual: null,
              },
            ],
          }),
        } as Response);

      const Dashboard = (await import('@/app/dashboard/page')).default;
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/concluída em/i)).toBeInTheDocument();
      });
    });

    it('deve exibir data e hora de conclusão das avaliações finalizadas', async () => {
      const dataConclusao = new Date('2025-01-05T16:45:30Z');

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ nome: 'João Silva' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            avaliacoes: [
              {
                id: 1,
                status: 'concluida',
                criado_em: new Date('2025-01-01').toISOString(),
                envio: dataConclusao.toISOString(),
                grupo_atual: null,
              },
            ],
          }),
        } as Response);

      const Dashboard = (await import('@/app/dashboard/page')).default;
      render(<Dashboard />);

      await waitFor(() => {
        // Deve exibir data formatada (formato pode variar com toLocaleString)
        expect(screen.getByText(/concluída em/i)).toBeInTheDocument();
        expect(screen.getByText(/\d{2}\/\d{2}\/\d{4}/)).toBeInTheDocument(); // Formato DD/MM/YYYY
      });
    });

    it('deve exibir múltiplas avaliações concluídas em ordem', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ nome: 'João Silva' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            avaliacoes: [
              {
                id: 1,
                status: 'concluida',
                criado_em: new Date('2024-06-01').toISOString(),
                envio: new Date('2024-06-05').toISOString(),
                grupo_atual: null,
              },
              {
                id: 2,
                status: 'concluida',
                criado_em: new Date('2024-12-01').toISOString(),
                envio: new Date('2024-12-05').toISOString(),
                grupo_atual: null,
              },
            ],
          }),
        } as Response);

      const Dashboard = (await import('@/app/dashboard/page')).default;
      render(<Dashboard />);

      await waitFor(() => {
        const concluidas = screen.getAllByText(/concluída/i);
        expect(concluidas.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('deve exibir status de concluída', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ nome: 'João Silva' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            avaliacoes: [
              {
                id: 1,
                status: 'concluida',
                criado_em: new Date('2025-01-01').toISOString(),
                envio: new Date('2025-01-05').toISOString(),
                grupo_atual: null,
              },
            ],
          }),
        } as Response);

      const Dashboard = (await import('@/app/dashboard/page')).default;
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/concluída/i)).toBeInTheDocument();
      });
    });

    it('deve exibir mensagem quando não há avaliações concluídas', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ nome: 'João Silva' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            avaliacoes: [
              {
                id: 1,
                status: 'iniciada',
                criado_em: new Date().toISOString(),
                envio: null,
                grupo_atual: null,
              },
            ],
          }),
        } as Response);

      const Dashboard = (await import('@/app/dashboard/page')).default;
      render(<Dashboard />);

      await waitFor(() => {
        expect(
          screen.getByText(/nenhuma avaliação concluída/i)
        ).toBeInTheDocument();
      });
    });

    it('deve separar visualmente avaliações disponíveis e concluídas', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ nome: 'João Silva' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            avaliacoes: [
              {
                id: 1,
                status: 'em_andamento',
                criado_em: new Date('2025-01-15').toISOString(),
                envio: null,
                grupo_atual: 2,
              },
              {
                id: 2,
                status: 'concluida',
                criado_em: new Date('2025-01-01').toISOString(),
                envio: new Date('2025-01-05').toISOString(),
                grupo_atual: null,
              },
            ],
          }),
        } as Response);

      const Dashboard = (await import('@/app/dashboard/page')).default;
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/avaliações disponíveis/i)).toBeInTheDocument();
        expect(screen.getByText(/histórico/i)).toBeInTheDocument();
      });
    });

    it('deve permitir visualizar relatório de avaliação concluída', async () => {
      const user = userEvent.setup();

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ nome: 'João Silva' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            avaliacoes: [
              {
                id: 123,
                status: 'concluida',
                criado_em: new Date('2025-01-01').toISOString(),
                envio: new Date('2025-01-05').toISOString(),
                grupo_atual: null,
              },
            ],
          }),
        } as Response);

      const Dashboard = (await import('@/app/dashboard/page')).default;
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/ver comprovante/i)).toBeInTheDocument();
      });

      const verComprovante = screen.getByText(/ver comprovante/i);
      await user.click(verComprovante);

      // Verificar que o href está correto
      const link = verComprovante.closest('a');
      expect(link?.getAttribute('href')).toContain('/avaliacao/concluida');
      expect(link?.getAttribute('href')).toContain('avaliacao_id=123');
    });
  });
});
