import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import { EntidadesContent } from '@/components/admin/EntidadesContent';

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

describe('EntidadesContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  it('deve renderizar loading inicialmente', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));

    render(<EntidadesContent />);

    // Verifica se o spinner de loading está presente
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('deve renderizar lista de entidades', async () => {
    const mockEntidades = [
      {
        id: 1,
        nome: 'Empresa XYZ Ltda',
        cnpj: '12345678000190',
        email: 'contato@empresa.com',
        telefone: '11999999999',
        endereco: 'Rua Teste, 123',
        cidade: 'São Paulo',
        estado: 'SP',
        ativa: true,
        status: 'aprovado',
        responsavel_nome: 'João Silva',
        responsavel_cpf: '12345678901',
        responsavel_email: 'joao@empresa.com',
        responsavel_celular: '11999999999',
        criado_em: '2024-01-01 00:00:00',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          tomadores: mockEntidades,
          total: 1,
        }),
    } as Response);

    render(<EntidadesContent />);

    await waitFor(() => {
      expect(screen.getByText('Empresa XYZ Ltda [ID=1]')).toBeInTheDocument();
      expect(screen.getByText('Ativa')).toBeInTheDocument();
    });
  });

  it('deve mostrar mensagem quando não há entidades', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          tomadores: [],
          total: 0,
        }),
    } as Response);

    render(<EntidadesContent />);

    await waitFor(() => {
      expect(
        screen.getByText('Nenhuma entidade cadastrada')
      ).toBeInTheDocument();
    });
  });

  it('deve mostrar botão de deletar para entidades ativas', async () => {
    const mockEntidades = [
      {
        id: 1,
        nome: 'Empresa XYZ Ltda',
        cnpj: '12345678000190',
        email: 'contato@empresa.com',
        telefone: '11999999999',
        endereco: 'Rua Teste, 123',
        cidade: 'São Paulo',
        estado: 'SP',
        ativa: true,
        status: 'aprovado',
        responsavel_nome: 'João Silva',
        responsavel_cpf: '12345678901',
        responsavel_email: 'joao@empresa.com',
        responsavel_celular: '11999999999',
        criado_em: '2024-01-01 00:00:00',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          tomadores: mockEntidades,
          total: 1,
        }),
    } as Response);

    render(<EntidadesContent />);

    await waitFor(() => {
      expect(screen.getByText('Empresa XYZ Ltda [ID=1]')).toBeInTheDocument();
    });

    // Verifica se o botão de deletar está presente
    const deleteButton = screen.getByTitle('Deletar entidade definitivamente');
    expect(deleteButton).toBeInTheDocument();
  });

  it('deve deletar entidade com confirmação', async () => {
    const mockEntidades = [
      {
        id: 1,
        nome: 'Empresa XYZ Ltda',
        cnpj: '12345678000190',
        email: 'contato@empresa.com',
        telefone: '11999999999',
        endereco: 'Rua Teste, 123',
        cidade: 'São Paulo',
        estado: 'SP',
        ativa: true,
        status: 'aprovado',
        responsavel_nome: 'João Silva',
        responsavel_cpf: '12345678901',
        responsavel_email: 'joao@empresa.com',
        responsavel_celular: '11999999999',
        criado_em: '2024-01-01 00:00:00',
      },
    ];

    // Mock para buscar entidades
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          tomadores: mockEntidades,
          total: 1,
        }),
    } as Response);

    // Mock para deletar
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          totaisExcluidos: {
            gestores: 1,
            empresas: 1,
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

    render(<EntidadesContent />);

    await waitFor(() => {
      expect(screen.getByText('Empresa XYZ Ltda [ID=1]')).toBeInTheDocument();
    });

    const deleteButton = screen.getByTitle('Deletar entidade definitivamente');
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
        'Entidade deletada com sucesso!\n\n' +
          'Totais excluídos:\n' +
          '- 1 gestor(es)\n' +
          '- 1 empresa(s)\n' +
          '- 5 funcionário(s)\n' +
          '- 10 avaliação(ões)\n\n' +
          'A operação foi registrada no log de auditoria.'
      );
    });

    // Verifica se a lista foi recarregada
    await waitFor(() => {
      expect(
        screen.getByText('Nenhuma entidade cadastrada')
      ).toBeInTheDocument();
    });

    mockAlert.mockRestore();
  });

  it('não deve deletar entidade se confirmação for cancelada', async () => {
    const mockEntidades = [
      {
        id: 1,
        nome: 'Empresa XYZ Ltda',
        cnpj: '12345678000190',
        email: 'contato@empresa.com',
        telefone: '11999999999',
        endereco: 'Rua Teste, 123',
        cidade: 'São Paulo',
        estado: 'SP',
        ativa: true,
        status: 'aprovado',
        responsavel_nome: 'João Silva',
        responsavel_cpf: '12345678901',
        responsavel_email: 'joao@empresa.com',
        responsavel_celular: '11999999999',
        criado_em: '2024-01-01 00:00:00',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          tomadores: mockEntidades,
          total: 1,
        }),
    } as Response);

    render(<EntidadesContent />);

    await waitFor(() => {
      expect(screen.getByText('Empresa XYZ Ltda [ID=1]')).toBeInTheDocument();
    });

    const deleteButton = screen.getByTitle('Deletar entidade definitivamente');
    fireEvent.click(deleteButton);

    // Modal deve abrir
    await waitFor(() => {
      expect(screen.getByTestId('admin-password-input')).toBeInTheDocument();
    });

    // Cancelar (fechar modal)
    fireEvent.click(screen.getByText('Cancelar'));

    // Verifica que não fez chamada de delete
    expect(mockFetch).toHaveBeenCalledTimes(1); // Apenas a busca inicial
  });

  it('deve mostrar erro ao falhar na deleção', async () => {
    const mockEntidades = [
      {
        id: 1,
        nome: 'Empresa XYZ Ltda',
        cnpj: '12345678000190',
        email: 'contato@empresa.com',
        telefone: '11999999999',
        endereco: 'Rua Teste, 123',
        cidade: 'São Paulo',
        estado: 'SP',
        ativa: true,
        status: 'aprovado',
        responsavel_nome: 'João Silva',
        responsavel_cpf: '12345678901',
        responsavel_email: 'joao@empresa.com',
        responsavel_celular: '11999999999',
        criado_em: '2024-01-01 00:00:00',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          tomadores: mockEntidades,
          total: 1,
        }),
    } as Response);

    // Mock para deletar com erro
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Erro ao deletar' }),
    } as Response);

    const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(<EntidadesContent />);

    await waitFor(() => {
      expect(screen.getByText('Empresa XYZ Ltda [ID=1]')).toBeInTheDocument();
    });

    const deleteButton = screen.getByTitle('Deletar entidade definitivamente');
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
