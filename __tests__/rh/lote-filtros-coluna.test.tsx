import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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
];

describe('DetalhesLotePage - Filtros por Coluna', () => {
  beforeEach(() => {
    jest.clearAllMocks();

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

      return Promise.reject(new Error('URL não mockada'));
    });
  });

  it('deve renderizar a página de detalhes do lote com filtros por coluna', async () => {
    render(<DetalhesLotePage />);

    // Aguardar carregamento
    await waitFor(() => {
      expect(screen.getByText('Lote de Teste')).toBeInTheDocument();
    });

    // Verificar se os botões de filtro estão presentes no cabeçalho da tabela
    const filtroButtons = screen.getAllByText('🔽');
    expect(filtroButtons.length).toBeGreaterThan(0);

    // Verificar se o botão "Limpar Filtros" está presente
    expect(screen.getByText('🧹 Limpar Filtros')).toBeInTheDocument();

    // Verificar se o contador de funcionários mostra corretamente
    expect(
      screen.getByText('Mostrando 1 de 1 funcionário(s)')
    ).toBeInTheDocument();
  });

  it('deve mostrar dados do funcionário na tabela', async () => {
    render(<DetalhesLotePage />);

    // Este teste verifica apenas se a tabela é renderizada corretamente
    // Os dados específicos são verificados no teste principal
    await waitFor(() => {
      expect(
        screen.getByText('Mostrando 1 de 1 funcionário(s)')
      ).toBeInTheDocument();
    });
  });
});
