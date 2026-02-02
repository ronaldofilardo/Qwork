/**
 * Testes para o componente CentroOperacoes
 * - Renderização das abas Lotes e Laudos
 * - Filtragem por domínio
 * - Navegação entre abas
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CentroOperacoes from '@/components/CentroOperacoes';

// Mock do fetch
global.fetch = jest.fn();

describe('CentroOperacoes', () => {
  const mockNotificacoes = [
    {
      id: 1,
      tipo: 'lote_concluido_aguardando_laudo',
      prioridade: 'alta',
      titulo: 'Lote #123 concluído',
      mensagem: 'Aguardando emissão de laudo',
      dados_contexto: {},
      lida: false,
      criado_em: '2026-01-31T10:00:00Z',
    },
    {
      id: 2,
      tipo: 'laudo_enviado',
      prioridade: 'normal',
      titulo: 'Laudo #456 enviado',
      mensagem: 'Laudo disponível para visualização',
      dados_contexto: {},
      lida: false,
      criado_em: '2026-01-31T11:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ notificacoes: mockNotificacoes }),
    });
  });

  it('renders with clinica user type and shows only Lotes and Laudos tabs', async () => {
    render(<CentroOperacoes tipoUsuario="clinica" />);

    await waitFor(() => {
      expect(screen.getByText('Centro de Operações')).toBeInTheDocument();
    });

    // Verifica que apenas as abas Lotes e Laudos existem
    expect(screen.getByText(/Lotes \(/)).toBeInTheDocument();
    expect(screen.getByText(/Laudos \(/)).toBeInTheDocument();

    // Verifica que as abas Todos e Financeiro não existem
    expect(screen.queryByText(/Todos \(/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Financeiro \(/)).not.toBeInTheDocument();
  });

  it('filters notifications by Lotes tab', async () => {
    render(<CentroOperacoes tipoUsuario="clinica" />);

    await waitFor(() => {
      expect(screen.getByText('Lote #123 concluído')).toBeInTheDocument();
    });

    // Deve mostrar apenas notificações de lotes
    expect(screen.getByText('Lote #123 concluído')).toBeInTheDocument();
    expect(screen.queryByText('Laudo #456 enviado')).not.toBeInTheDocument();
  });

  it('filters notifications by Laudos tab when clicked', async () => {
    render(<CentroOperacoes tipoUsuario="clinica" />);

    await waitFor(() => {
      expect(screen.getByText('Lote #123 concluído')).toBeInTheDocument();
    });

    // Clica na aba Laudos
    const laudosTab = screen.getByText(/Laudos \(/);
    fireEvent.click(laudosTab);

    // Aguarda a filtragem
    await waitFor(() => {
      expect(screen.queryByText('Lote #123 concluído')).not.toBeInTheDocument();
    });

    // Deve mostrar apenas notificações de laudos
    expect(screen.getByText('Laudo #456 enviado')).toBeInTheDocument();
  });

  it('highlights active tab correctly', async () => {
    render(<CentroOperacoes tipoUsuario="clinica" />);

    await waitFor(() => {
      expect(screen.getByText('Centro de Operações')).toBeInTheDocument();
    });

    // A aba Lotes deve estar ativa por padrão
    const lotesTab = screen.getByText(/Lotes \(/).closest('button');
    expect(lotesTab).toHaveClass('border-primary');
    expect(lotesTab).toHaveClass('text-primary');

    // Clica na aba Laudos
    const laudosTab = screen.getByText(/Laudos \(/).closest('button');
    fireEvent.click(laudosTab);

    await waitFor(() => {
      expect(laudosTab).toHaveClass('border-primary');
      expect(laudosTab).toHaveClass('text-primary');
    });
  });

  it('shows correct counters for each tab', async () => {
    render(<CentroOperacoes tipoUsuario="clinica" />);

    await waitFor(() => {
      expect(screen.getByText(/Lotes \(1\)/)).toBeInTheDocument();
      expect(screen.getByText(/Laudos \(1\)/)).toBeInTheDocument();
    });
  });

  it('handles empty notifications state', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ notificacoes: [] }),
    });

    render(<CentroOperacoes tipoUsuario="clinica" />);

    await waitFor(() => {
      expect(
        screen.getByText('Nenhuma notificação pendente')
      ).toBeInTheDocument();
    });
  });

  it('resolves notification when clicking resolve button', async () => {
    render(<CentroOperacoes tipoUsuario="clinica" />);

    await waitFor(() => {
      expect(screen.getByText('Lote #123 concluído')).toBeInTheDocument();
    });

    // Clica no botão Resolver
    const resolverButton = screen.getByText('Resolver');
    fireEvent.click(resolverButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/notificacoes/resolver',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ notificacao_id: 1 }),
        })
      );
    });
  });

  it('calls correct API endpoint for clinica user type', async () => {
    render(<CentroOperacoes tipoUsuario="clinica" />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/clinica/notificacoes');
    });
  });

  it('calls correct API endpoint for contratante user type', async () => {
    render(<CentroOperacoes tipoUsuario="contratante" />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/rh/notificacoes');
    });
  });

  it('shows loading state initially', () => {
    render(<CentroOperacoes tipoUsuario="clinica" />);

    // Verifica o spinner de loading
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });
});
