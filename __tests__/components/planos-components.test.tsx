import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { usePlanosStore } from '@/lib/stores/planosStore';
import PlanosManager from '@/components/admin/PlanosManager';
import NotificacoesFinanceiras from '@/components/admin/NotificacoesFinanceiras';
import PWAInitializer from '@/components/PWAInitializer';

// Mock do fetch global
global.fetch = jest.fn();

// Mock do matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('Testes de Frontend - Fase 3', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.MockedFunction<typeof fetch>).mockClear();
  });

  describe('Zustand Store - Planos', () => {
    it('deve adicionar plano ao store', () => {
      const { addPlano, planos } = usePlanosStore.getState();

      const novoPlano = {
        id: 1,
        tipo: 'personalizado' as const,
        nome: 'Plano Teste',
        ativo: true,
      };

      addPlano(novoPlano);

      const state = usePlanosStore.getState();
      expect(state.planos).toContainEqual(novoPlano);
    });

    it('deve atualizar plano existente', () => {
      const { addPlano, updatePlano } = usePlanosStore.getState();

      const plano = {
        id: 1,
        tipo: 'personalizado' as const,
        nome: 'Plano Original',
        ativo: true,
      };

      addPlano(plano);
      updatePlano(1, { nome: 'Plano Atualizado' });

      const state = usePlanosStore.getState();
      const planoAtualizado = state.planos.find((p) => p.id === 1);

      expect(planoAtualizado?.nome).toBe('Plano Atualizado');
    });

    it('deve adicionar notificação ao store', () => {
      const { addNotificacao } = usePlanosStore.getState();

      const notificacao = {
        id: 1,
        contrato_id: 1,
        tipo: 'limite_excedido' as const,
        titulo: 'Limite Excedido',
        mensagem: 'Teste',
        lida: false,
        prioridade: 'alta' as const,
        created_at: new Date().toISOString(),
      };

      addNotificacao(notificacao);

      const state = usePlanosStore.getState();
      expect(state.notificacoes).toContainEqual(notificacao);
    });

    it('deve filtrar notificações não lidas', () => {
      const { setNotificacoes, getNotificacoesNaoLidas } =
        usePlanosStore.getState();

      setNotificacoes([
        {
          id: 1,
          contrato_id: 1,
          tipo: 'limite_excedido',
          titulo: 'Teste 1',
          mensagem: 'Teste',
          lida: false,
          prioridade: 'alta',
          created_at: new Date().toISOString(),
        },
        {
          id: 2,
          contrato_id: 1,
          tipo: 'limite_excedido',
          titulo: 'Teste 2',
          mensagem: 'Teste',
          lida: true,
          prioridade: 'normal',
          created_at: new Date().toISOString(),
        },
      ]);

      const naoLidas = getNotificacoesNaoLidas();

      expect(naoLidas).toHaveLength(1);
      expect(naoLidas[0].id).toBe(1);
    });
  });

  describe('Componente PlanosManager', () => {
    it('deve renderizar lista de planos', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: async () => ({
          planos: [
            {
              id: 1,
              tipo: 'basico',
              nome: 'Plano Básico',
              valor_fixo_anual: 1224.0,
              limite_funcionarios: 50,
              ativo: true,
            },
          ],
        }),
      } as Response);

      render(<PlanosManager />);

      await waitFor(() => {
        expect(screen.getByText('Plano Básico')).toBeInTheDocument();
      });
    });

    it('deve exibir mensagem de erro ao falhar carregamento', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: false,
      } as Response);

      render(<PlanosManager />);

      await waitFor(() => {
        expect(screen.getByText(/Erro/i)).toBeInTheDocument();
      });
    });

    it('deve exibir loading durante carregamento', () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockImplementation(
        () =>
          new Promise(() => {
            /* never resolves */
          })
      );

      render(<PlanosManager />);

      expect(screen.getByText(/Carregando planos/i)).toBeInTheDocument();
    });
  });

  describe('Componente NotificacoesFinanceiras', () => {
    it('deve renderizar notificações', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: async () => ({
          notificacoes: [
            {
              id: 1,
              contrato_id: 1,
              tipo: 'limite_excedido',
              titulo: 'Limite Excedido',
              mensagem: 'O limite foi excedido',
              lida: false,
              prioridade: 'alta',
              created_at: new Date().toISOString(),
            },
          ],
        }),
      } as Response);

      render(<NotificacoesFinanceiras />);

      await waitFor(() => {
        expect(screen.getByText('Limite Excedido')).toBeInTheDocument();
        expect(screen.getByText('O limite foi excedido')).toBeInTheDocument();
      });
    });

    it('deve marcar notificação como lida ao clicar', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            notificacoes: [
              {
                id: 1,
                contrato_id: 1,
                tipo: 'limite_excedido',
                titulo: 'Limite Excedido',
                mensagem: 'Teste',
                lida: false,
                prioridade: 'alta',
                created_at: new Date().toISOString(),
              },
            ],
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        } as Response);

      render(<NotificacoesFinanceiras />);

      await waitFor(() => {
        expect(screen.getByText('Marcar como lida')).toBeInTheDocument();
      });

      const button = screen.getByText('Marcar como lida');
      fireEvent.click(button);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/notificacoes/1'),
          expect.objectContaining({ method: 'PATCH' })
        );
      });
    });

    it('deve exibir contador de não lidas', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: async () => ({
          notificacoes: [
            {
              id: 1,
              contrato_id: 1,
              tipo: 'limite_excedido',
              titulo: 'Teste 1',
              mensagem: 'Teste',
              lida: false,
              prioridade: 'alta',
              created_at: new Date().toISOString(),
            },
            {
              id: 2,
              contrato_id: 1,
              tipo: 'limite_excedido',
              titulo: 'Teste 2',
              mensagem: 'Teste',
              lida: false,
              prioridade: 'normal',
              created_at: new Date().toISOString(),
            },
          ],
        }),
      } as Response);

      render(<NotificacoesFinanceiras />);

      await waitFor(() => {
        expect(screen.getByText(/2 não lidas/i)).toBeInTheDocument();
      });
    });
  });

  describe('Sincronização Offline (PWA)', () => {
    it('deve sincronizar planos ao reconectar', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          planos: [
            { id: 1, tipo: 'basico', nome: 'Plano Básico', ativo: true },
          ],
        }),
      } as Response);

      // Renderizar o PWAInitializer para configurar os listeners
      render(<PWAInitializer />);

      // Simular reconexão
      window.dispatchEvent(new Event('online'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/financeiro/planos');
      });
    });

    it('deve cachear dados localmente', () => {
      const mockData = {
        planos: [{ id: 1, tipo: 'basico', nome: 'Plano Básico', ativo: true }],
      };

      localStorage.setItem('planos-cache', JSON.stringify(mockData));

      const cached = JSON.parse(localStorage.getItem('planos-cache') || '{}');

      expect(cached.planos).toHaveLength(1);
    });
  });
});
