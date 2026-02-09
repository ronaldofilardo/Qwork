import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import { ClinicasContent } from '@/components/admin/ClinicasContent';

const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

const mockConsoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => {});

// Mock do ModalCadastrotomador
jest.mock('@/components/modals/ModalCadastrotomador', () => ({
  __esModule: true,
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="modal-cadastro-tomador">Modal Aberto</div>
    ) : null,
}));

describe('ClinicasContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  it('deve renderizar loading inicialmente', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));

    render(<ClinicasContent />);

    // Verifica se o spinner de loading está presente
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('deve renderizar lista de clínicas', async () => {
    const mockClinicas = [
      {
        id: 1,
        nome: 'Clínica Teste',
        cnpj: '12345678000190',
        email: 'contato@clinica.com',
        telefone: '1133334444',
        endereco: 'Rua Teste, 123',
        cidade: 'São Paulo',
        estado: 'SP',
        ativa: true,
        status: 'aprovado',
        responsavel_nome: 'Dr. João Silva',
        responsavel_cpf: '12345678901',
        responsavel_email: 'joao@clinica.com',
        criado_em: '2024-01-01 00:00:00',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          tomadores: mockClinicas,
          total: 1,
        }),
    } as Response);

    render(<ClinicasContent />);

    await waitFor(() => {
      expect(screen.getByText('Clínica Teste [ID=1]')).toBeInTheDocument();
      expect(screen.getByText('Ativa')).toBeInTheDocument();
    });
  });

  it('deve mostrar mensagem quando não há clínicas', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          tomadores: [],
          total: 0,
        }),
    } as Response);

    render(<ClinicasContent />);

    await waitFor(() => {
      expect(
        screen.getByText('Nenhuma clínica cadastrada')
      ).toBeInTheDocument();
    });
  });

  it('deve mostrar botão de deletar para clínicas ativas', async () => {
    const mockClinicas = [
      {
        id: 1,
        nome: 'Clínica Teste',
        cnpj: '12345678000190',
        email: 'contato@clinica.com',
        telefone: '1133334444',
        endereco: 'Rua Teste, 123',
        cidade: 'São Paulo',
        estado: 'SP',
        ativa: true,
        status: 'aprovado',
        responsavel_nome: 'Dr. João Silva',
        responsavel_cpf: '12345678901',
        responsavel_email: 'joao@clinica.com',
        criado_em: '2024-01-01 00:00:00',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          tomadores: mockClinicas,
          total: 1,
        }),
    } as Response);

    render(<ClinicasContent />);

    await waitFor(() => {
      expect(screen.getByText('Clínica Teste [ID=1]')).toBeInTheDocument();
    });

    // Verifica se o botão de deletar está presente
    const deleteButton = screen.getByTitle('Deletar clínica definitivamente');
    expect(deleteButton).toBeInTheDocument();
  });

  it('deve deletar clínica com confirmação', async () => {
    const mockClinicas = [
      {
        id: 1,
        nome: 'Clínica Teste',
        cnpj: '12345678000190',
        email: 'contato@clinica.com',
        telefone: '1133334444',
        endereco: 'Rua Teste, 123',
        cidade: 'São Paulo',
        estado: 'SP',
        ativa: true,
        status: 'aprovado',
        responsavel_nome: 'Dr. João Silva',
        responsavel_cpf: '12345678901',
        responsavel_email: 'joao@clinica.com',
        criado_em: '2024-01-01 00:00:00',
      },
    ];

    // Mock para buscar clínicas (aprovadas)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          tomadores: mockClinicas,
          total: 1,
        }),
    } as Response);

    // Mock para buscar clínicas (plano personalizado pendente)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          tomadores: [],
          total: 0,
        }),
    } as Response);

    // Mock para deletar com resposta detalhada
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          totaisExcluidos: {
            gestores: 1,
            empresas: 2,
            funcionarios: 5,
            avaliacoes: 10,
          },
        }),
    } as Response);

    // Mock para buscar após deletar (lista vazia)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          tomadores: [],
          total: 0,
        }),
    } as Response);

    const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(<ClinicasContent />);

    await waitFor(() => {
      expect(screen.getByText('Clínica Teste [ID=1]')).toBeInTheDocument();
    });

    const deleteButton = screen.getByTitle('Deletar clínica definitivamente');
    fireEvent.click(deleteButton);

    // Modal deve abrir solicitando senha
    await waitFor(() => {
      expect(screen.getByTestId('admin-password-input')).toBeInTheDocument();
    });

    // Preencher senha e motivo
    fireEvent.change(screen.getByTestId('admin-password-input'), {
      target: { value: 'rightpass' },
    });
    fireEvent.change(screen.getByTestId('motivo-input'), {
      target: { value: 'teste' },
    });

    // Confirmar
    fireEvent.click(screen.getByTestId('modal-confirm-button'));

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        'Clínica deletada com sucesso!\n\nTotais excluídos:\n- 1 gestor(es)\n- 2 empresa(s)\n- 5 funcionário(s)\n- 10 avaliação(ões)\n\nA operação foi registrada no log de auditoria.'
      );
    });

    // Verifica se a lista foi recarregada
    await waitFor(() => {
      expect(
        screen.getByText('Nenhuma clínica cadastrada')
      ).toBeInTheDocument();
    });

    mockAlert.mockRestore();
  });

  it('não deve deletar clínica se confirmação for cancelada', async () => {
    const mockClinicas = [
      {
        id: 1,
        nome: 'Clínica Teste',
        cnpj: '12345678000190',
        email: 'contato@clinica.com',
        telefone: '1133334444',
        endereco: 'Rua Teste, 123',
        cidade: 'São Paulo',
        estado: 'SP',
        ativa: true,
        status: 'aprovado',
        responsavel_nome: 'Dr. João Silva',
        responsavel_cpf: '12345678901',
        responsavel_email: 'joao@clinica.com',
        criado_em: '2024-01-01 00:00:00',
      },
    ];

    // Mock para buscar clínicas (aprovadas)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          tomadores: mockClinicas,
          total: 1,
        }),
    } as Response);

    // Mock para buscar clínicas (plano personalizado pendente)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          tomadores: [],
          total: 0,
        }),
    } as Response);

    render(<ClinicasContent />);

    await waitFor(() => {
      expect(screen.getByText('Clínica Teste [ID=1]')).toBeInTheDocument();
    });

    const deleteButton = screen.getByTitle('Deletar clínica definitivamente');
    fireEvent.click(deleteButton);

    // Modal deve abrir
    await waitFor(() => {
      expect(screen.getByTestId('admin-password-input')).toBeInTheDocument();
    });

    // Cancelar (fechar modal)
    fireEvent.click(screen.getByText('Cancelar'));

    // Verifica que não fez chamada de delete (apenas as buscas iniciais)
    expect(mockFetch).toHaveBeenCalledTimes(2); // Apenas as buscas iniciais
  });

  it('deve mostrar erro ao falhar na deleção', async () => {
    const mockClinicas = [
      {
        id: 1,
        nome: 'Clínica Teste',
        cnpj: '12345678000190',
        email: 'contato@clinica.com',
        telefone: '1133334444',
        endereco: 'Rua Teste, 123',
        cidade: 'São Paulo',
        estado: 'SP',
        ativa: true,
        status: 'aprovado',
        responsavel_nome: 'Dr. João Silva',
        responsavel_cpf: '12345678901',
        responsavel_email: 'joao@clinica.com',
        criado_em: '2024-01-01 00:00:00',
      },
    ];

    // Mock para buscar clínicas (aprovadas)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          tomadores: mockClinicas,
          total: 1,
        }),
    } as Response);

    // Mock para buscar clínicas (plano personalizado pendente)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          tomadores: [],
          total: 0,
        }),
    } as Response);

    // Mock para deletar com erro
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Erro ao deletar' }),
    } as Response);

    const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(<ClinicasContent />);

    await waitFor(() => {
      expect(screen.getByText('Clínica Teste [ID=1]')).toBeInTheDocument();
    });

    const deleteButton = screen.getByTitle('Deletar clínica definitivamente');
    fireEvent.click(deleteButton);

    // Modal deve abrir
    await waitFor(() => {
      expect(screen.getByTestId('admin-password-input')).toBeInTheDocument();
    });

    // Preencher senha e confirmar
    fireEvent.change(screen.getByTestId('admin-password-input'), {
      target: { value: 'rightpass' },
    });
    fireEvent.click(screen.getByTestId('modal-confirm-button'));

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Erro ao deletar');
    });

    mockAlert.mockRestore();
  });
});
