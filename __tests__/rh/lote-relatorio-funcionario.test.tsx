import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DetalhesLotePage from '@/app/rh/empresa/[id]/lote/[loteId]/page';

// Mock do Next.js router
const mockPush = jest.fn();
const mockParams = { id: '1', loteId: '1' };

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useParams: () => mockParams,
}));

// Mock do fetch
global.fetch = jest.fn();

// Mock do window.URL.createObjectURL e revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock do window.confirm
global.confirm = jest.fn();

// Mock dos dados
const mockLote = {
  id: 1,
  titulo: 'Lote de Teste',
  descricao: 'Descrição do lote',
  tipo: 'completo',
  status: 'ativo',
  liberado_em: '2024-01-01T10:00:00Z',
  liberado_por_nome: 'Admin User',
  empresa_nome: 'Empresa Teste',
};

const mockEstatisticas = {
  total_avaliacoes: 3,
  avaliacoes_concluidas: 2,
  avaliacoes_inativadas: 0,
  avaliacoes_pendentes: 1,
};

const mockFuncionarios = [
  {
    cpf: '12345678901',
    nome: 'João Silva',
    setor: 'TI',
    funcao: 'Desenvolvedor',
    matricula: '001',
    turno: 'manhã',
    escala: '5x2',
    avaliacao: {
      id: 1,
      status: 'concluida',
      data_inicio: '2024-01-01T10:00:00Z',
      data_conclusao: '2024-01-02T10:00:00Z',
    },
  },
  {
    cpf: '98765432100',
    nome: 'Maria Santos',
    setor: 'RH',
    funcao: 'Gerente',
    matricula: '002',
    turno: 'manhã',
    escala: '5x2',
    avaliacao: {
      id: 2,
      status: 'em_andamento',
      data_inicio: '2024-01-01T10:00:00Z',
      data_conclusao: null,
    },
  },
  {
    cpf: '11122233344',
    nome: 'Pedro Costa',
    setor: 'Financeiro',
    funcao: 'Analista',
    matricula: '003',
    turno: 'tarde',
    escala: '5x2',
    avaliacao: {
      id: 3,
      status: 'concluida',
      data_inicio: '2024-01-01T10:00:00Z',
      data_conclusao: '2024-01-03T10:00:00Z',
    },
  },
];

describe('DetalhesLotePage - Relatório Individual de Funcionário', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.confirm as jest.Mock).mockReturnValue(true);

    // Mock da sessão
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url === '/api/auth/session') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ perfil: 'rh' }),
        });
      }

      if (url === '/api/rh/lotes/1/funcionarios?empresa_id=1') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              lote: mockLote,
              estatisticas: mockEstatisticas,
              funcionarios: mockFuncionarios,
            }),
        });
      }

      // Mock do endpoint de relatório individual
      if (
        url.includes('/api/avaliacao/relatorio-impressao?lote_id=') &&
        url.includes('cpf_filter=')
      ) {
        return Promise.resolve({
          ok: true,
          blob: () =>
            Promise.resolve(
              new Blob(['PDF content'], { type: 'application/pdf' })
            ),
        });
      }

      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Not found' }),
      });
    });
  });

  it.skip('deve renderizar coluna de Ações com botões de relatório', async () => {
    render(<DetalhesLotePage />);

    await waitFor(() => {
      expect(screen.getByText('AÇÕES')).toBeInTheDocument();
    });

    // Verificar se os botões PDF aparecem nas linhas
    const pdfButtons = screen.getAllByText('📄 PDF');
    expect(pdfButtons.length).toBeGreaterThan(0);
  });

  it.skip('deve habilitar botão PDF apenas para avaliações concluídas', async () => {
    render(<DetalhesLotePage />);

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });

    const pdfButtons = screen.getAllByText('📄 PDF');

    // Verificar que existem botões habilitados e desabilitados
    const enabledButtons = pdfButtons.filter(
      (btn) => !(btn as HTMLButtonElement).disabled
    );
    const disabledButtons = pdfButtons.filter(
      (btn) => (btn as HTMLButtonElement).disabled
    );

    expect(enabledButtons.length).toBe(2); // João e Pedro têm avaliações concluídas
    expect(disabledButtons.length).toBe(1); // Maria tem avaliação em andamento
  });

  it.skip('deve gerar relatório individual quando botão PDF é clicado', async () => {
    render(<DetalhesLotePage />);

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });

    // Encontrar o botão PDF da primeira linha (João Silva)
    const pdfButtons = screen.getAllByText('📄 PDF');
    const joaoPdfButton = pdfButtons[0];

    // Clicar no botão
    fireEvent.click(joaoPdfButton);

    // Verificar se o confirm foi chamado
    await waitFor(() => {
      expect(global.confirm).toHaveBeenCalledWith(
        'Gerar relatório PDF de João Silva?'
      );
    });

    // Verificar se a API foi chamada com o CPF correto
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/avaliacao/relatorio-impressao?lote_id=1')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('cpf_filter=12345678901')
      );
    });
  });

  it.skip('não deve gerar relatório se usuário cancelar confirmação', async () => {
    (global.confirm as jest.Mock).mockReturnValue(false);

    render(<DetalhesLotePage />);

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });

    const pdfButtons = screen.getAllByText('📄 PDF');
    const joaoPdfButton = pdfButtons[0];

    // Contar quantas chamadas fetch existem antes do clique
    const fetchCallsBefore = (global.fetch as jest.Mock).mock.calls.length;

    fireEvent.click(joaoPdfButton);

    await waitFor(() => {
      expect(global.confirm).toHaveBeenCalled();
    });

    // Verificar que não houve nova chamada para o endpoint de relatório
    const fetchCallsAfter = (global.fetch as jest.Mock).mock.calls.filter(
      (call) => call[0].includes('/api/avaliacao/relatorio-impressao?cpf=')
    ).length;

    expect(fetchCallsAfter).toBe(0);
  });

  it.skip('deve criar link de download com nome correto do arquivo', async () => {
    const mockClick = jest.fn();
    const mockAppendChild = jest
      .spyOn(document.body, 'appendChild')
      .mockImplementation(() => null as any);
    const mockRemoveChild = jest
      .spyOn(document.body, 'removeChild')
      .mockImplementation(() => null as any);

    // Mock do createElement para capturar o elemento <a>
    const originalCreateElement = document.createElement;
    document.createElement = jest.fn((tagName) => {
      if (tagName === 'a') {
        const element = originalCreateElement.call(
          document,
          tagName
        ) as HTMLAnchorElement;
        element.click = mockClick;
        return element;
      }
      return originalCreateElement.call(document, tagName);
    }) as any;

    render(<DetalhesLotePage />);

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });

    const pdfButtons = screen.getAllByText('📄 PDF');
    fireEvent.click(pdfButtons[0]);

    await waitFor(() => {
      expect(mockClick).toHaveBeenCalled();
    });

    // Limpar mocks
    mockAppendChild.mockRestore();
    mockRemoveChild.mockRestore();
    document.createElement = originalCreateElement;
  });

  it.skip('deve mostrar tooltip explicativo em botões desabilitados', async () => {
    render(<DetalhesLotePage />);

    await waitFor(() => {
      expect(screen.getByText('Maria Santos')).toBeInTheDocument();
    });

    const pdfButtons = screen.getAllByText('📄 PDF');
    const mariaPdfButton = pdfButtons.find(
      (btn) => (btn as HTMLButtonElement).disabled
    );

    expect(mariaPdfButton).toHaveAttribute(
      'title',
      'Relatório disponível apenas para avaliações concluídas'
    );
  });

  it.skip('deve exibir alerta em caso de erro na geração do relatório', async () => {
    // Mock de erro na API
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url === '/api/auth/session') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ perfil: 'rh' }),
        });
      }

      if (url === '/api/rh/lotes/1/funcionarios?empresa_id=1') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              lote: mockLote,
              estatisticas: mockEstatisticas,
              funcionarios: mockFuncionarios,
            }),
        });
      }

      if (
        url.includes('/api/avaliacao/relatorio-impressao?lote_id=') &&
        url.includes('cpf_filter=')
      ) {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Erro ao gerar relatório' }),
        });
      }

      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Not found' }),
      });
    });

    const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(<DetalhesLotePage />);

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });

    const pdfButtons = screen.getAllByText('📄 PDF');
    fireEvent.click(pdfButtons[0]);

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        expect.stringContaining('Erro ao gerar relatório')
      );
    });

    mockAlert.mockRestore();
  });
});
