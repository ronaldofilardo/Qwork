import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LaudosSection from '@/components/clinica/LaudosSection';

// Mock do fetch
global.fetch = jest.fn();

describe('LaudosSection', () => {
  const mockLaudos = [
    {
      id: 1,
      lote_id: 1,
      lote_codigo: 'LOTE001',
      lote_titulo: 'Avaliação Psicossocial 2024',
      empresa_nome: 'Empresa ABC',
      status: 'enviado',
      data_emissao: '2024-12-01T10:00:00Z',
      arquivos: {
        relatorio_lote: '/api/download/lote1.pdf',
      },
    },
    {
      id: 2,
      lote_id: 2,
      lote_codigo: 'LOTE002',
      lote_titulo: 'Avaliação Setorial Q4',
      empresa_nome: 'Empresa XYZ',
      status: 'pendente',
      data_emissao: null,
      arquivos: {
        relatorio_lote: null,
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementationOnce(
      () => new Promise(() => {})
    );

    render(<LaudosSection />);

    // Verifica se o spinner de loading está presente
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders laudos data correctly', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ laudos: mockLaudos }),
    });

    render(<LaudosSection />);

    await waitFor(() => {
      expect(screen.getByText('Laudos')).toBeInTheDocument();
    });

    // Verifica header
    expect(screen.getByText('Laudos')).toBeInTheDocument();
    expect(
      screen.getByText('Laudos emitidos para empresas clientes')
    ).toBeInTheDocument();

    // Verifica cards de estatísticas
    expect(screen.getByText('2')).toBeInTheDocument(); // total laudos
    expect(screen.getAllByText('1')).toHaveLength(2); // laudos emitidos e pendentes

    // Verifica tabela
    expect(screen.getByText('LOTE001')).toBeInTheDocument();
    expect(screen.getByText('Avaliação Psicossocial 2024')).toBeInTheDocument();
    expect(screen.getByText('Empresa ABC')).toBeInTheDocument();
    expect(screen.getByText('LOTE002')).toBeInTheDocument();
    expect(screen.getByText('Avaliação Setorial Q4')).toBeInTheDocument();
    expect(screen.getByText('Empresa XYZ')).toBeInTheDocument();
  });

  it('displays status badges correctly', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ laudos: mockLaudos }),
    });

    render(<LaudosSection />);

    await waitFor(() => {
      expect(screen.getByText('emitido')).toBeInTheDocument();
      expect(screen.getByText('pendente')).toBeInTheDocument();
    });

    // Verifica classes CSS dos badges
    const emitidoBadge = screen.getByText('emitido');
    const pendenteBadge = screen.getByText('pendente');

    expect(emitidoBadge).toHaveClass('bg-green-100');
    expect(emitidoBadge).toHaveClass('text-green-800');
    expect(pendenteBadge).toHaveClass('bg-yellow-100');
    expect(pendenteBadge).toHaveClass('text-yellow-800');
  });

  it('formats dates correctly', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ laudos: mockLaudos }),
    });

    render(<LaudosSection />);

    await waitFor(() => {
      expect(screen.getByText('01/12/2024')).toBeInTheDocument();
      expect(screen.getByText('-')).toBeInTheDocument(); // data null
    });
  });

  it('shows download button for emitted laudos', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ laudos: mockLaudos }),
    });

    render(<LaudosSection />);

    await waitFor(() => {
      const downloadButtons = screen.getAllByText('Baixar');
      expect(downloadButtons).toHaveLength(1); // Apenas o laudo emitido tem botão
    });
  });

  it('handles empty laudos list', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ laudos: [] }),
    });

    render(<LaudosSection />);

    await waitFor(() => {
      expect(screen.getByText('Nenhum laudo disponível')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    // Mock console.error
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    render(<LaudosSection />);

    await waitFor(() => {
      expect(screen.getByText('Nenhum laudo disponível')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('handles different status values', async () => {
    const laudosWithDifferentStatuses = [
      {
        id: 1,
        lote_id: 1,
        lote_codigo: 'LOTE001',
        lote_titulo: 'Teste',
        empresa_nome: 'Empresa A',
        status: 'processando',
        data_emissao: null,
        arquivos: { relatorio_lote: null },
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ laudos: laudosWithDifferentStatuses }),
    });

    render(<LaudosSection />);

    await waitFor(() => {
      const statusBadge = screen.getByText('processando');
      expect(statusBadge).toHaveClass('bg-blue-100');
      expect(statusBadge).toHaveClass('text-blue-800');
    });
  });
});
