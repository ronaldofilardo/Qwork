import {
  generateAvaliacoesReportTxt,
  generateAvaliacoesPDF,
} from '@/components/admin/auditorias/helpers';
import type { AuditoriaAvaliacao } from '@/components/admin/auditorias/types';

jest.mock('jspdf', () => {
  return {
    __esModule: true,
    default: jest.fn(() => ({
      setFontSize: jest.fn(),
      text: jest.fn(),
      internal: {
        pageSize: {
          getWidth: jest.fn(() => 210),
          getHeight: jest.fn(() => 297),
        },
        pages: [{}, {}],
      },
      save: jest.fn(),
    })),
  };
});

jest.mock('jspdf-autotable', () => {
  return jest.fn();
});

global.alert = jest.fn();

const mockCreateObjectURL = jest.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = jest.fn();

Object.defineProperty(global.URL, 'createObjectURL', {
  value: mockCreateObjectURL,
  writable: true,
});

Object.defineProperty(global.URL, 'revokeObjectURL', {
  value: mockRevokeObjectURL,
  writable: true,
});

function makeAvaliacao(
  overrides: Partial<AuditoriaAvaliacao> = {}
): AuditoriaAvaliacao {
  return {
    avaliacao_id: 1,
    cpf: '12345678901',
    lote: 'LOTE-001',
    liberado_em: '2024-03-01T10:00:00Z',
    avaliacao_status: 'concluida',
    concluida_em: '2024-03-01T15:00:00Z',
    criado_em: '2024-03-01T08:00:00Z',
    empresa_nome: 'Empresa Teste',
    entidade_nome: null,
    clinica_nome: null,
    ...overrides,
  };
}

describe('Export Helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateAvaliacoesReportTxt', () => {
    it('deve gerar relatório sem erros', () => {
      const data: AuditoriaAvaliacao[] = [makeAvaliacao()];
      expect(() => generateAvaliacoesReportTxt(data)).not.toThrow();
    });

    it('deve alertar quando lista vazia', () => {
      generateAvaliacoesReportTxt([]);
      expect(global.alert).toHaveBeenCalledWith(
        'Nenhuma avaliação para exportar.'
      );
    });

    it('deve contar status corretamente', () => {
      const data: AuditoriaAvaliacao[] = [
        makeAvaliacao({ avaliacao_id: 1, avaliacao_status: 'concluida' }),
        makeAvaliacao({ avaliacao_id: 2, avaliacao_status: 'iniciada' }),
      ];
      expect(() => generateAvaliacoesReportTxt(data)).not.toThrow();
    });
  });

  describe('generateAvaliacoesPDF', () => {
    it('deve gerar PDF sem erros', () => {
      const data: AuditoriaAvaliacao[] = [makeAvaliacao()];
      expect(() => generateAvaliacoesPDF(data)).not.toThrow();
    });

    it('deve alertar quando lista vazia', () => {
      generateAvaliacoesPDF([]);
      expect(global.alert).toHaveBeenCalledWith(
        'Nenhuma avaliação para exportar.'
      );
    });

    it('deve processar múltiplas avaliações', () => {
      const data: AuditoriaAvaliacao[] = [
        makeAvaliacao({ avaliacao_id: 1 }),
        makeAvaliacao({ avaliacao_id: 2 }),
        makeAvaliacao({ avaliacao_id: 3 }),
      ];
      expect(() => generateAvaliacoesPDF(data)).not.toThrow();
    });
  });
});
