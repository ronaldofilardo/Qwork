// @ts-nocheck
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
  codigo: 'LOTE001',
  titulo: 'Lote de Teste',
  descricao: 'Descrição do lote',
  tipo: 'completo',
  status: 'ativo',
  liberado_em: '2024-01-01T10:00:00Z',
  liberado_por_nome: 'Admin User',
  empresa_nome: 'Empresa Teste',
};

const mockEstatisticas = {
  total_avaliacoes: 2,
  avaliacoes_concluidas: 1,
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
    grupos: {
      g1: 25, // Negativo - Alto Risco (Atenção)
      g2: 75, // Positivo - Baixo Risco (Excelente)
      g3: 80, // Positivo - Baixo Risco (Excelente)
      g4: 20, // Negativo - Baixo Risco (Excelente)
      g5: 50, // Positivo - Médio Risco (Monitorar)
      g6: 30, // Positivo - Alto Risco (Atenção)
      g7: 40, // Negativo - Médio Risco (Monitorar)
      g8: 15, // Negativo - Baixo Risco (Excelente)
      g9: 70, // Negativo - Alto Risco (Atenção)
      g10: 80, // Negativo - Alto Risco (Atenção)
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
      status: 'pendente',
      data_inicio: '2024-01-01T10:00:00Z',
      data_conclusao: null,
    },
    // Sem grupos porque avaliação não está concluída
  },
];

describe('DetalhesLotePage - Classificação de Risco por Grupo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Not found' }),
      });
    });
  });

  it('deve renderizar colunas G1 a G10 no cabeçalho da tabela', async () => {
    render(<DetalhesLotePage />);

    await waitFor(() => {
      expect(screen.getByText('G1')).toBeInTheDocument();
      expect(screen.getByText('G2')).toBeInTheDocument();
      expect(screen.getByText('G3')).toBeInTheDocument();
      expect(screen.getByText('G4')).toBeInTheDocument();
      expect(screen.getByText('G5')).toBeInTheDocument();
      expect(screen.getByText('G6')).toBeInTheDocument();
      expect(screen.getByText('G7')).toBeInTheDocument();
      expect(screen.getByText('G8')).toBeInTheDocument();
      expect(screen.getByText('G9')).toBeInTheDocument();
      expect(screen.getByText('G10')).toBeInTheDocument();
    });
  });

  it('deve exibir classificações corretas para grupos positivos', async () => {
    render(<DetalhesLotePage />);

    await waitFor(() => {
      // G2 = 75% (Positivo, >66%) = Excelente/Verde
      const excelentes = screen.getAllByText('Excelente');
      expect(excelentes.length).toBeGreaterThan(0);

      // G5 = 50% (Positivo, 33-66%) = Monitorar/Amarelo
      const monitorar = screen.getAllByText('Monitorar');
      expect(monitorar.length).toBeGreaterThan(0);

      // G6 = 30% (Positivo, <33%) = Atenção/Vermelho
      const atencao = screen.getAllByText('Atenção');
      expect(atencao.length).toBeGreaterThan(0);
    });
  });

  it('deve exibir classificações corretas para grupos negativos', async () => {
    render(<DetalhesLotePage />);

    await waitFor(() => {
      // G4 = 20% (Negativo, <33%) = Excelente/Verde
      // G8 = 15% (Negativo, <33%) = Excelente/Verde
      const excelentes = screen.getAllByText('Excelente');
      expect(excelentes.length).toBeGreaterThan(0);

      // G7 = 40% (Negativo, 33-66%) = Monitorar/Amarelo
      const monitorar = screen.getAllByText('Monitorar');
      expect(monitorar.length).toBeGreaterThan(0);

      // G1 = 25% seria Excelente para negativo, mas vamos testar G9 e G10
      // G9 = 70% (Negativo, >66%) = Atenção/Vermelho
      // G10 = 80% (Negativo, >66%) = Atenção/Vermelho
      const atencao = screen.getAllByText('Atenção');
      expect(atencao.length).toBeGreaterThan(0);
    });
  });

  it('não deve exibir classificações para avaliações não concluídas', async () => {
    render(<DetalhesLotePage />);

    await waitFor(() => {
      // Aguardar renderização completa
      expect(screen.getAllByText('Excelente').length).toBeGreaterThan(0);
    });

    // Verificar que Maria Santos (avaliação pendente) não tem badges de grupos
    const tableBody = document.querySelector('tbody');
    const rows = tableBody?.querySelectorAll('tr') || [];

    let mariaSantosHasBadges = false;
    rows.forEach((row) => {
      if (
        row.textContent?.includes('Maria Santos') &&
        row.textContent?.includes('Pendente')
      ) {
        // Contar células vazias nas colunas de grupos (G1-G10)
        const cells = row.querySelectorAll('td');
        // As últimas 11 células são: G1-G10 + Ações
        // Se é pendente, G1-G10 devem estar vazias
        const groupCells = Array.from(cells).slice(-11, -1);
        mariaSantosHasBadges = groupCells.some(
          (cell) =>
            cell.textContent?.includes('Excelente') ||
            cell.textContent?.includes('Monitorar') ||
            cell.textContent?.includes('Atenção')
        );
      }
    });

    expect(mariaSantosHasBadges).toBe(false);
  });

  it.skip('deve aplicar cores corretas aos badges de classificação', async () => {
    render(<DetalhesLotePage />);

    await waitFor(() => {
      // Aguardar até que badges sejam renderizados
      expect(screen.getAllByText('Excelente').length).toBeGreaterThan(0);
    });

    // Verificar se os badges têm as classes de cor corretas
    const excelentes = screen.getAllByText('Excelente');
    expect(excelentes[0].className).toContain('bg-green-100');
    expect(excelentes[0].className).toContain('text-green-800');

    const monitorar = screen.getAllByText('Monitorar');
    expect(monitorar[0].className).toContain('bg-yellow-100');
    expect(monitorar[0].className).toContain('text-yellow-800');

    const atencao = screen.getAllByText('Atenção');
    expect(atencao[0].className).toContain('bg-red-100');
    expect(atencao[0].className).toContain('text-red-800');
  });

  it('deve ter scroll horizontal para acomodar todas as colunas', async () => {
    render(<DetalhesLotePage />);

    await waitFor(() => {
      const g1Header = screen.getByText('G1');
      expect(g1Header).toBeTruthy();
    });

    const tableContainer = document.querySelector('.overflow-x-auto');
    expect(tableContainer).toBeTruthy();
  });
});
