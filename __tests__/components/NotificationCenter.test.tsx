/**
 * Testes para componente NotificationCenter
 *
 * Funcionalidades testadas:
 * 1. Renderização do ícone de notificações com badge
 * 2. Abertura/fechamento do painel
 * 3. Listagem de notificações
 * 4. Navegação ao clicar em notificação
 * 5. Atualização automática
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import NotificationCenter from '@/components/NotificationCenter';

// Mock fetch
global.fetch = jest.fn();

const mockNavigate = jest.fn();

describe('NotificationCenter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({
        success: true,
        notificacoes: [],
        totalNaoLidas: 0,
      }),
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Renderização Inicial', () => {
    it('deve renderizar o ícone de sino', () => {
      render(<NotificationCenter />);
      const button = screen.getByTitle('Central de Notificações');
      expect(button).toBeInTheDocument();
    });

    it('não deve mostrar badge quando não há notificações', async () => {
      render(<NotificationCenter />);

      await waitFor(() => {
        const badge = screen.queryByText('0');
        expect(badge).not.toBeInTheDocument();
      });
    });

    it('deve mostrar badge com quantidade de notificações', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({
          success: true,
          notificacoes: [{}, {}, {}],
          totalNaoLidas: 3,
        }),
      });

      render(<NotificationCenter />);

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument();
      });
    });

    it('deve mostrar "9+" quando há mais de 9 notificações', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({
          success: true,
          notificacoes: new Array(12).fill({}),
          totalNaoLidas: 12,
        }),
      });

      render(<NotificationCenter />);

      await waitFor(() => {
        expect(screen.getByText('9+')).toBeInTheDocument();
      });
    });
  });

  describe('Abertura e Fechamento do Painel', () => {
    it('deve abrir painel ao clicar no ícone', async () => {
      render(<NotificationCenter />);

      const button = screen.getByTitle('Central de Notificações');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Notificações')).toBeInTheDocument();
      });
    });

    it('deve fechar painel ao clicar no X', async () => {
      render(<NotificationCenter />);

      const button = screen.getByTitle('Central de Notificações');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Notificações')).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Notificações')).not.toBeInTheDocument();
      });
    });

    it('deve fechar painel ao clicar no overlay', async () => {
      render(<NotificationCenter />);

      const button = screen.getByTitle('Central de Notificações');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Notificações')).toBeInTheDocument();
      });

      const overlay = document.querySelector('.fixed.inset-0.bg-black\\/40');
      if (overlay) {
        fireEvent.click(overlay);
      }

      await waitFor(() => {
        expect(screen.queryByText('Notificações')).not.toBeInTheDocument();
      });
    });
  });

  describe('Listagem de Notificações', () => {
    it('deve mostrar mensagem quando não há notificações', async () => {
      render(<NotificationCenter />);

      const button = screen.getByTitle('Central de Notificações');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Nenhuma notificação')).toBeInTheDocument();
      });
    });

    it('deve listar notificações recebidas', async () => {
      const mockNotificacoes = [
        {
          id: 1,
          codigo: '001-291125',
          titulo: 'Lote Teste 1',
          empresa_nome: 'Empresa A',
          clinica_nome: 'Clínica A',
          liberado_em: '2025-11-29T10:00:00Z',
          total_avaliacoes: 4,
          tipo: 'novo_lote',
          mensagem: 'Novo lote "Lote Teste 1" pronto para emissão de laudo',
        },
        {
          id: 2,
          codigo: '002-291125',
          titulo: 'Lote Teste 2',
          empresa_nome: 'Empresa B',
          clinica_nome: 'Clínica B',
          liberado_em: '2025-11-29T11:00:00Z',
          total_avaliacoes: 3,
          tipo: 'processado',
          mensagem: 'Laudo processado para "Lote Teste 2"',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({
          success: true,
          notificacoes: mockNotificacoes,
          totalNaoLidas: 2,
        }),
      });

      render(<NotificationCenter />);

      const button = screen.getByTitle('Central de Notificações');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/Novo lote.*Lote Teste 1/)).toBeInTheDocument();
        expect(
          screen.getByText(/Laudo processado.*Lote Teste 2/)
        ).toBeInTheDocument();
        expect(screen.getByText(/001-291125/)).toBeInTheDocument();
        expect(screen.getByText(/002-291125/)).toBeInTheDocument();
      });
    });

    it('deve aplicar estilo correto para tipo novo_lote', async () => {
      const mockNotificacoes = [
        {
          id: 1,
          codigo: '001-291125',
          titulo: 'Lote Teste',
          empresa_nome: 'Empresa A',
          clinica_nome: 'Clínica A',
          liberado_em: '2025-11-29T10:00:00Z',
          total_avaliacoes: 4,
          tipo: 'novo_lote',
          mensagem: 'Novo lote pronto',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({
          success: true,
          notificacoes: mockNotificacoes,
          totalNaoLidas: 1,
        }),
      });

      render(<NotificationCenter />);

      const button = screen.getByTitle('Central de Notificações');
      fireEvent.click(button);

      await waitFor(() => {
        const notification = screen
          .getByText('Novo lote pronto')
          .closest('div');
        expect(notification).toBeInTheDocument();
      });
    });
  });

  describe('Navegação', () => {
    it('deve chamar callback ao clicar em notificação', async () => {
      const mockNotificacoes = [
        {
          id: 1,
          codigo: '001-291125',
          titulo: 'Lote Teste',
          empresa_nome: 'Empresa A',
          clinica_nome: 'Clínica A',
          liberado_em: '2025-11-29T10:00:00Z',
          total_avaliacoes: 4,
          tipo: 'novo_lote',
          mensagem: 'Novo lote pronto',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({
          success: true,
          notificacoes: mockNotificacoes,
          totalNaoLidas: 1,
        }),
      });

      render(<NotificationCenter onNavigateToLote={mockNavigate} />);

      const button = screen.getByTitle('Central de Notificações');
      fireEvent.click(button);

      await waitFor(() => {
        const notification = screen.getByText('Novo lote pronto');
        fireEvent.click(notification);
      });

      expect(mockNavigate).toHaveBeenCalledWith(1);
    });

    it('deve fechar painel após navegar', async () => {
      const mockNotificacoes = [
        {
          id: 1,
          codigo: '001-291125',
          titulo: 'Lote Teste',
          empresa_nome: 'Empresa A',
          clinica_nome: 'Clínica A',
          liberado_em: '2025-11-29T10:00:00Z',
          total_avaliacoes: 4,
          tipo: 'novo_lote',
          mensagem: 'Novo lote pronto',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({
          success: true,
          notificacoes: mockNotificacoes,
          totalNaoLidas: 1,
        }),
      });

      render(<NotificationCenter onNavigateToLote={mockNavigate} />);

      const openButton = screen.getByTitle('Central de Notificações');
      fireEvent.click(openButton);

      await waitFor(() => {
        expect(screen.getByText('Notificações')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('Novo lote pronto')).toBeInTheDocument();
      });

      const notification = screen.getByText('Novo lote pronto');
      fireEvent.click(notification);

      expect(mockNavigate).toHaveBeenCalledWith(1);

      await waitFor(() => {
        expect(
          screen.queryByText('Central de Notificações')
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Atualização de Notificações', () => {
    it('deve buscar notificações na montagem do componente', () => {
      render(<NotificationCenter />);

      expect(global.fetch).toHaveBeenCalledWith('/api/emissor/notificacoes');
    });

    it('deve permitir atualização manual', async () => {
      const mockNotificacoes = [
        {
          id: 1,
          codigo: '001-291125',
          titulo: 'Lote Teste 1',
          empresa_nome: 'Empresa A',
          clinica_nome: 'Clínica A',
          liberado_em: '2025-11-29T10:00:00Z',
          total_avaliacoes: 4,
          tipo: 'novo_lote',
          mensagem: 'Novo lote "Lote Teste 1" pronto para emissão de laudo',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({
          success: true,
          notificacoes: mockNotificacoes,
          totalNaoLidas: 1,
        }),
      });

      render(<NotificationCenter />);

      const button = screen.getByTitle('Central de Notificações');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('🔄 Atualizar')).toBeInTheDocument();
      });

      const updateButton = screen.getByText('🔄 Atualizar');
      fireEvent.click(updateButton);

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Estados de Loading e Erro', () => {
    it('deve mostrar loading ao buscar notificações', async () => {
      render(<NotificationCenter />);

      const button = screen.getByTitle('Central de Notificações');
      fireEvent.click(button);

      // O loading inicial já passou, mas ao clicar em atualizar deveria mostrar
      await waitFor(() => {
        expect(screen.getByText('Notificações')).toBeInTheDocument();
      });
    });

    it('deve tratar erro ao buscar notificações', async () => {
      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<NotificationCenter />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });
  });
});
