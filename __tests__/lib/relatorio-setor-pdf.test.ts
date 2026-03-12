/**
 * @fileoverview Testes da função gerarRelatorioSetorPDF
 * @description Valida geração de PDF por setor com médias agregadas dos funcionários.
 */

import { gerarRelatorioSetorPDF } from '@/lib/pdf/relatorio-setor';
import type { DadosRelatorioSetor } from '@/lib/pdf/relatorio-setor';

// Mock do jsPDF e autoTable para evitar dependência de DOM no Node
jest.mock('jspdf', () => {
  const mockDoc = {
    internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
    setFontSize: jest.fn(),
    setFont: jest.fn(),
    setTextColor: jest.fn(),
    text: jest.fn(),
    output: jest.fn(() => new ArrayBuffer(100)),
  };
  return jest.fn(() => mockDoc);
});

jest.mock('jspdf-autotable', () =>
  jest.fn((doc: any) => {
    // Simula o comportamento de jspdf-autotable que registra a posição final
    doc.lastAutoTable = { finalY: 100 };
  })
);

jest.mock('@/lib/pdf/timezone-helper', () => ({
  formatarDataCorrigida: jest.fn(() => '01/01/2026 10:00'),
}));

jest.mock('@/lib/pdf/relatorio-individual', () => ({
  buildGruposFromRespostas: jest.fn(
    (respostas: { grupo: number; valor: number }[]) => {
      if (respostas.length === 0) return [];
      return [
        {
          grupoId: 1,
          grupoNome: 'Demandas no Trabalho',
          dominio: 'Demandas no Trabalho',
          descricao: 'Avaliação das exigências',
          tipo: 'negativa' as const,
          media: respostas[0].valor,
          categoriaRisco: 'baixo' as const,
        },
      ];
    }
  ),
}));

describe('gerarRelatorioSetorPDF', () => {
  const dadosBase: DadosRelatorioSetor = {
    setor: 'TI',
    empresa_nome: 'Empresa Teste',
    lote_id: 42,
    total_funcionarios: 5,
    respostas: [
      { grupo: 1, valor: 25 },
      { grupo: 2, valor: 75 },
      { grupo: 3, valor: 80 },
    ],
  };

  it('deve retornar um Buffer', () => {
    const resultado = gerarRelatorioSetorPDF(dadosBase);
    expect(Buffer.isBuffer(resultado)).toBe(true);
  });

  it('deve retornar um Buffer com conteúdo (tamanho > 0)', () => {
    const resultado = gerarRelatorioSetorPDF(dadosBase);
    expect(resultado.length).toBeGreaterThan(0);
  });

  it('deve funcionar com lista de respostas vazia', () => {
    const dadosSemRespostas: DadosRelatorioSetor = {
      ...dadosBase,
      respostas: [],
      total_funcionarios: 0,
    };
    expect(() => gerarRelatorioSetorPDF(dadosSemRespostas)).not.toThrow();
    const resultado = gerarRelatorioSetorPDF(dadosSemRespostas);
    expect(Buffer.isBuffer(resultado)).toBe(true);
  });

  it('deve funcionar com todos os 10 grupos', () => {
    const dadosCom10Grupos: DadosRelatorioSetor = {
      ...dadosBase,
      respostas: Array.from({ length: 10 }, (_, i) => ({
        grupo: i + 1,
        valor: 50,
      })),
    };
    expect(() => gerarRelatorioSetorPDF(dadosCom10Grupos)).not.toThrow();
  });

  it('deve aceitar setor com caracteres especiais no nome', () => {
    const dadosSetorEspecial: DadosRelatorioSetor = {
      ...dadosBase,
      setor: 'Vendas & Pós-venda',
    };
    expect(() => gerarRelatorioSetorPDF(dadosSetorEspecial)).not.toThrow();
  });

  it('deve aceitar total_funcionarios = 1', () => {
    const dadosUmFuncionario: DadosRelatorioSetor = {
      ...dadosBase,
      total_funcionarios: 1,
    };
    const resultado = gerarRelatorioSetorPDF(dadosUmFuncionario);
    expect(Buffer.isBuffer(resultado)).toBe(true);
  });
});

describe('DadosRelatorioSetor — tipagem', () => {
  it('deve aceitar objeto com campos obrigatórios', () => {
    const dados: DadosRelatorioSetor = {
      setor: 'Operações',
      empresa_nome: 'Empresa X',
      lote_id: 1,
      total_funcionarios: 3,
      respostas: [{ grupo: 1, valor: 40 }],
    };
    expect(dados.setor).toBe('Operações');
    expect(dados.respostas).toHaveLength(1);
  });
});
