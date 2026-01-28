jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('@/lib/session', () => ({
  getSession: jest.fn(),
}));

const mockQuery = require('@/lib/db').query;
const mockGetSession = require('@/lib/session').getSession;

// Mock jsPDF to capture autoTable calls
jest.mock('jspdf', () => {
  const autoTableMock = jest.fn();
  const jsPDFMock = function () {
    return {
      internal: {
        pageSize: { width: 210, height: 297 },
        getNumberOfPages: () => 1,
      },
      setFontSize: jest.fn(),
      setFont: jest.fn(),
      text: jest.fn(),
      autoTable: autoTableMock,
      output: jest.fn().mockReturnValue(Buffer.from('PDF')),
      setPage: jest.fn(),
    };
  };
  return { __esModule: true, default: jsPDFMock };
});

import { POST } from '@/app/api/entidade/lote/[id]/relatorio/route';

describe('POST /api/entidade/lote/[id]/relatorio', () => {
  beforeEach(() => jest.clearAllMocks());

  it('gera PDF e chama autoTable apenas uma vez (sem duplicação)', async () => {
    mockGetSession.mockReturnValue({
      perfil: 'gestor_entidade',
      contratante_id: 77,
      cpf: '52998224725',
    });

    // 1) lote query
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 10,
          codigo: '003-250126',
          titulo: 'Lote 3',
          tipo: 'padrao',
          status: 'concluido',
        },
      ],
    });
    // 2) laudo query
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 5, emitido_em: '2026-01-25T13:59:36Z' }],
    });
    // 3) funcionarios query
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          nome: 'Func A',
          cpf: '07752435074',
          setor: 'Operacional',
          funcao: 'estagio',
          nivel_cargo: 'gestao',
          avaliacao_status: 'concluida',
          data_conclusao: '2026-01-25T00:00:00Z',
        },
      ],
    });

    const req = new Request('http://localhost/api/entidade/lote/10/relatorio', {
      method: 'POST',
    });
    const res = await POST(req, { params: { id: '10' } } as any);

    // Response should be a PDF buffer
    expect((res as any).headers.get('Content-Type')).toBe('application/pdf');

    // jsPDF.autoTable should have been called once (no duplication)
    const jsPDF = require('jspdf').default;
    const instance = jsPDF();
    expect(instance.autoTable).toHaveBeenCalledTimes(1);
  });
});
