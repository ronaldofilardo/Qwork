import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import EmpresasSection from '@/components/clinica/EmpresasSection';

// Mock do fetch
global.fetch = jest.fn();

// Mock do window.confirm
const mockConfirm = jest.fn();
global.confirm = mockConfirm;

describe('EmpresasSection', () => {
  const mockEmpresas = [
    {
      id: 1,
      nome: 'Empresa Teste 1',
      cnpj: '12.345.678/0001-90',
      ativa: true,
      total_funcionarios: 50,
      total_avaliacoes: 25,
    },
    {
      id: 2,
      nome: 'Empresa Teste 2',
      cnpj: '98.765.432/0001-10',
      ativa: false,
      total_funcionarios: 30,
      total_avaliacoes: 15,
    },
  ];

  const mockStats = {
    total_empresas: 2,
    total_funcionarios: 80,
    total_avaliacoes: 40,
    avaliacoes_concluidas: 35,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfirm.mockClear();
  });

  it('renders loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementationOnce(
      () => new Promise(() => {})
    );

    render(<EmpresasSection />);

    // Verifica se o spinner de loading está presente
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders empresas data correctly', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockEmpresas),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStats),
      });

    render(<EmpresasSection />);

    await waitFor(() => {
      expect(screen.getByText('Empresas Clientes')).toBeInTheDocument();
    });

    // Verifica header
    expect(screen.getByText('Empresas Clientes')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Gestão de empresas clientes e suas avaliações psicossociais'
      )
    ).toBeInTheDocument();

    // Verifica estatísticas
    expect(screen.getByText('2')).toBeInTheDocument(); // total empresas
    expect(screen.getByText('80')).toBeInTheDocument(); // total funcionários
    expect(screen.getByText('40')).toBeInTheDocument(); // total avaliações
    expect(screen.getByText('35')).toBeInTheDocument(); // avaliações concluídas

    // Verifica tabela
    expect(screen.getByText('Empresa Teste 1')).toBeInTheDocument();
    expect(screen.getByText('12.345.678/0001-90')).toBeInTheDocument();
    expect(screen.getByText('Empresa Teste 2')).toBeInTheDocument();
    expect(screen.getByText('98.765.432/0001-10')).toBeInTheDocument();
  });

  it('displays status badges correctly', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockEmpresas),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStats),
      });

    render(<EmpresasSection />);

    await waitFor(() => {
      expect(screen.getByText('Ativa')).toBeInTheDocument();
      expect(screen.getByText('Inativa')).toBeInTheDocument();
    });

    // Verifica classes CSS dos badges
    const ativaBadge = screen.getByText('Ativa');
    const inativaBadge = screen.getByText('Inativa');

    expect(ativaBadge).toHaveClass('bg-green-100');
    expect(ativaBadge).toHaveClass('text-green-800');
    expect(inativaBadge).toHaveClass('bg-red-100');
    expect(inativaBadge).toHaveClass('text-red-800');
  });

  it('shows correct action buttons based on status', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockEmpresas),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStats),
      });

    render(<EmpresasSection />);

    await waitFor(() => {
      expect(screen.getByText('Desativar')).toBeInTheDocument();
      expect(screen.getByText('Ativar')).toBeInTheDocument();
    });
  });

  it('handles empty empresas list', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            total_empresas: 0,
            total_funcionarios: 0,
            total_avaliacoes: 0,
            avaliacoes_concluidas: 0,
          }),
      });

    render(<EmpresasSection />);

    await waitFor(() => {
      expect(
        screen.getByText('Nenhuma empresa cadastrada')
      ).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    // Mock console.error
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    render(<EmpresasSection />);

    await waitFor(() => {
      expect(screen.getByText('Erro de Configuração')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('toggles empresa status correctly', async () => {
    mockConfirm.mockReturnValue(true);

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockEmpresas),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStats),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockEmpresas),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStats),
      });

    render(<EmpresasSection />);

    await waitFor(() => {
      expect(screen.getByText('Empresa Teste 1')).toBeInTheDocument();
    });

    const desativarButton = screen.getByText('Desativar');
    fireEvent.click(desativarButton);

    expect(mockConfirm).toHaveBeenCalledWith(
      'Desativar esta empresa? Todos os funcionários serão inativados também.'
    );
  });

  it('cancels empresa status toggle when user declines', async () => {
    mockConfirm.mockReturnValue(false);

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockEmpresas),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStats),
      });

    render(<EmpresasSection />);

    await waitFor(() => {
      expect(screen.getByText('Empresa Teste 1')).toBeInTheDocument();
    });

    const desativarButton = screen.getByText('Desativar');
    fireEvent.click(desativarButton);

    expect(mockConfirm).toHaveBeenCalledWith(
      'Desativar esta empresa? Todos os funcionários serão inativados também.'
    );

    // Verifica que não fez chamada para API
    expect(global.fetch).toHaveBeenCalledTimes(2); // Apenas as duas chamadas iniciais
  });

  it('handles API error on status toggle', async () => {
    mockConfirm.mockReturnValue(true);

    // Mock alert
    const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockEmpresas),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStats),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Erro interno' }),
      });

    render(<EmpresasSection />);

    await waitFor(() => {
      expect(screen.getByText('Empresa Teste 1')).toBeInTheDocument();
    });

    const desativarButton = screen.getByText('Desativar');
    fireEvent.click(desativarButton);

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        'Erro ao atualizar status: Erro interno'
      );
    });

    mockAlert.mockRestore();
  });

  it('calculates completion percentage correctly', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockEmpresas),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStats),
      });

    render(<EmpresasSection />);

    await waitFor(() => {
      expect(screen.getByText(/88%/)).toBeInTheDocument();
    });

    // Verifica que o cálculo está correto (35/40 = 87.5% arredondado para 88%)
    expect(screen.getByText('35')).toBeInTheDocument(); // avaliações concluídas
    expect(screen.getByText('40')).toBeInTheDocument(); // total de avaliações
  });
});
