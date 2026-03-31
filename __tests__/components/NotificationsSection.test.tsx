/**
 * @file __tests__/components/NotificationsSection.test.tsx
 * Testes: NotificationsSection
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import NotificationsSection from '../../components/NotificationsSection';

// Mock do fetch global
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
const mockOnNavigateToLote = jest.fn();

describe('NotificationsSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  const mockNotificacoes = [
    {
      id: '1',
      tipo: 'lote_concluido' as const,
      lote_id: 10,
      titulo: 'Lote Teste A',
      empresa_nome: 'Empresa A',
      data_evento: new Date().toISOString(),
      mensagem: 'Lote "Lote Teste A" enviado',
    },
    {
      id: '2',
      tipo: 'laudo_enviado' as const,
      lote_id: 11,
      titulo: 'Lote Teste B',
      empresa_nome: 'Empresa B',
      data_evento: new Date().toISOString(),
      mensagem: 'Laudo recebido para o lote "Lote Teste B"',
    },
  ];

  it('deve renderizar corretamente quando há notificações', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        notificacoes: mockNotificacoes,
        totalNaoLidas: 2,
      }),
    } as any);

    render(<NotificationsSection onNavigateToLote={mockOnNavigateToLote} />);

    await waitFor(() => {
      expect(
        screen.getByText('🔔 Notificações da Clínica')
      ).toBeInTheDocument();
    });

    expect(screen.getByText('2')).toBeInTheDocument(); // Badge de não lidas
    expect(screen.getByText('Lote Enviado')).toBeInTheDocument();
    expect(screen.getByText('Laudo Recebido')).toBeInTheDocument();
    expect(screen.getByText('001-301125')).toBeInTheDocument();
    expect(screen.getByText('002-301125')).toBeInTheDocument();
  });

  it('deve mostrar placeholder quando não há notificações', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        notificacoes: [],
        totalNaoLidas: 0,
      }),
    } as any);

    render(<NotificationsSection onNavigateToLote={mockOnNavigateToLote} />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/rh/notificacoes');
    });

    expect(screen.getByText('Nenhuma notificação')).toBeInTheDocument();
  });

  it('deve chamar onNavigateToLote quando uma notificação é clicada', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        notificacoes: mockNotificacoes,
        totalNaoLidas: 2,
      }),
    } as any);

    render(<NotificationsSection onNavigateToLote={mockOnNavigateToLote} />);

    await waitFor(() => {
      expect(screen.getByText('Lote Teste A')).toBeInTheDocument();
    });

    const row = screen.getByText('Lote Teste A').closest('tr');
    fireEvent.click(row);

    expect(mockOnNavigateToLote).toHaveBeenCalledWith(10);
  });

  it('deve mostrar ícones corretos para cada tipo de notificação', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        notificacoes: mockNotificacoes,
        totalNaoLidas: 2,
      }),
    } as any);

    render(<NotificationsSection onNavigateToLote={mockOnNavigateToLote} />);

    await waitFor(() => {
      expect(screen.getByText('Lote Enviado')).toBeInTheDocument();
    });

    // Verificar se os ícones estão presentes (através das classes ou títulos)
    const loteIcon = screen.getByText('Lote Enviado').previousElementSibling;
    const laudoIcon = screen.getByText('Laudo Recebido').previousElementSibling;

    expect(loteIcon).toHaveClass('bg-blue-500');
    expect(laudoIcon).toHaveClass('bg-purple-500');
  });

  it('deve formatar datas corretamente', async () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const notificacoesComDatas = [
      {
        ...mockNotificacoes[0],
        data_evento: now.toISOString(),
      },
      {
        ...mockNotificacoes[1],
        data_evento: oneHourAgo.toISOString(),
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        notificacoes: notificacoesComDatas,
        totalNaoLidas: 2,
      }),
    } as any);

    render(<NotificationsSection onNavigateToLote={mockOnNavigateToLote} />);

    await waitFor(() => {
      expect(screen.getByText('Agora')).toBeInTheDocument();
      expect(screen.getByText('1h atrás')).toBeInTheDocument();
    });
  });

  it('deve mostrar apenas as 5 notificações mais recentes', async () => {
    const manyNotifications = Array.from({ length: 10 }, (_, i) => ({
      id: `${i + 1}`,
      tipo: (i % 2 === 0 ? 'lote_concluido' : 'laudo_enviado') as const,
      lote_id: i + 1,
      codigo: `${(i + 1).toString().padStart(3, '0')}-301125`,
      titulo: `Lote ${i + 1}`,
      empresa_nome: `Empresa ${i + 1}`,
      data_evento: new Date().toISOString(),
      mensagem: `Mensagem ${i + 1}`,
    }));

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        notificacoes: manyNotifications,
        totalNaoLidas: 10,
      }),
    } as any);

    render(<NotificationsSection onNavigateToLote={mockOnNavigateToLote} />);

    await waitFor(() => {
      expect(screen.getAllByText(/Lote \d+/)).toHaveLength(5);
    });
  });

  it('deve renderizar notificações retornadas pela API (últimos 7 dias)', async () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 25 * 60 * 60 * 1000); // 25 horas atrás

    const notificacoesRetornadas = [
      {
        ...mockNotificacoes[0],
        data_evento: now.toISOString(),
      },
      {
        ...mockNotificacoes[1],
        data_evento: yesterday.toISOString(), // Ainda deve aparecer (API retorna 7 dias)
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        notificacoes: notificacoesRetornadas,
        totalNaoLidas: 2,
      }),
    } as any);

    render(<NotificationsSection onNavigateToLote={mockOnNavigateToLote} />);

    await waitFor(() => {
      expect(screen.getByText('Lote Teste A')).toBeInTheDocument();
      expect(screen.getByText('Lote Teste B')).toBeInTheDocument();
    });
  });

  it('deve mostrar estado de loading durante o fetch', async () => {
    // Primeiro carrega notificações
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        notificacoes: mockNotificacoes,
        totalNaoLidas: 2,
      }),
    } as any);

    render(<NotificationsSection onNavigateToLote={mockOnNavigateToLote} />);

    // Espera o componente renderizar com notificações
    await waitFor(() => {
      expect(
        screen.getByText('🔔 Notificações da Clínica')
      ).toBeInTheDocument();
    });

    // Agora testa o loading durante atualização manual
    let resolveFetch: (value: any) => void;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });

    mockFetch.mockReturnValueOnce(fetchPromise as any);

    const refreshButton = screen.getByTitle('Atualizar notificações');
    fireEvent.click(refreshButton);

    expect(refreshButton).toBeDisabled();

    // Resolver o fetch
    resolveFetch({
      ok: true,
      json: async () => ({
        success: true,
        notificacoes: mockNotificacoes,
        totalNaoLidas: 2,
      }),
    });

    await waitFor(() => {
      expect(refreshButton).not.toBeDisabled();
    });
  });

  it('deve permitir atualizar notificações manualmente', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        notificacoes: mockNotificacoes,
        totalNaoLidas: 2,
      }),
    } as any);

    render(<NotificationsSection onNavigateToLote={mockOnNavigateToLote} />);

    await waitFor(() => {
      expect(screen.getByText('Lote Teste A')).toBeInTheDocument();
    });

    const refreshButton = screen.getByTitle('Atualizar notificações');
    fireEvent.click(refreshButton);

    // Deve chamar fetch novamente
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  it('deve lidar com erro na busca de notificações', async () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<NotificationsSection onNavigateToLote={mockOnNavigateToLote} />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Erro ao buscar notificações:',
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });
});
