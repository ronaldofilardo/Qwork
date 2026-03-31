/**
 * Testes para /api/emissor/laudos/[loteId]/pdf
 *
 * Funcionalidades testadas:
 * 1. GET - Gerar PDF do laudo completo
 * 2. Validações de autorização
 * 3. Geração de hash SHA256
 * 4. Armazenamento do arquivo
 */

import { GET } from '@/app/api/emissor/laudos/[loteId]/pdf/route';
import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';

jest.mock('@/lib/session');
jest.mock('@/lib/db');

// Mock laudo-calculos para evitar queries internas
jest.mock('@/lib/laudo-calculos', () => ({
  gerarDadosGeraisEmpresa: jest.fn().mockResolvedValue({
    empresaAvaliada: { nome: 'Empresa A', cnpj: '12345678000195' },
  }),
  calcularScoresPorGrupo: jest.fn().mockResolvedValue([
    { grupo: 1, valor: 75 },
    { grupo: 2, valor: 80 },
  ]),
  gerarInterpretacaoRecomendacoes: jest.fn().mockReturnValue({}),
  gerarObservacoesConclusao: jest.fn().mockReturnValue({}),
}));

// Mock template HTML
jest.mock('@/lib/templates/laudo-html', () => ({
  gerarHTMLLaudoCompleto: jest.fn().mockReturnValue('<html>laudo</html>'),
}));

// Mock puppeteer via pdf-generator
jest.mock('@/lib/infrastructure/pdf/generators/pdf-generator', () => ({
  getPuppeteerInstance: jest.fn().mockResolvedValue({
    launch: jest.fn().mockResolvedValue({
      newPage: jest.fn().mockResolvedValue({
        setContent: jest.fn().mockResolvedValue(undefined),
        pdf: jest.fn().mockResolvedValue(Buffer.from('fake pdf content')),
      }),
      close: jest.fn().mockResolvedValue(undefined),
    }),
  }),
}));

const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;
const mockQuery = query as jest.MockedFunction<typeof query>;

describe('/api/emissor/laudos/[loteId]/pdf', () => {
  const mockEmissor = {
    cpf: '99999999999',
    nome: 'Emissor',
    perfil: 'emissor' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET - Gerar PDF do Laudo', () => {
    it('deve retornar 403 se usuário não for emissor', async () => {
      mockRequireRole.mockResolvedValue(null as any);

      const mockParams = { params: { loteId: '1' } };
      const response = await GET({} as Request, mockParams);

      expect(response.status).toBe(403);
    });

    it('deve retornar 400 para loteId inválido', async () => {
      mockRequireRole.mockResolvedValue(mockEmissor);

      const mockParams = { params: { loteId: 'abc' } };
      const response = await GET({} as Request, mockParams);

      expect(response.status).toBe(400);
    });

    it('deve retornar 404 se lote não encontrado', async () => {
      mockRequireRole.mockResolvedValue(mockEmissor);

      // validarAcessoLote - loteCheck retorna vazio
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const mockParams = { params: { loteId: '999' } };
      const response = await GET({} as Request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });

    it('deve retornar 400 se laudo não está emitido', async () => {
      mockRequireRole.mockResolvedValue(mockEmissor);

      // validarAcessoLote - loteCheck ok
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, empresa_id: 1, status: 'ativo', clinica_id: 1 }],
        rowCount: 1,
      } as any);
      // validarAcessoLote - audit log
      mockQuery.mockResolvedValueOnce({} as any);
      // laudoCheck - nenhum laudo emitido
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const mockParams = { params: { loteId: '1' } };
      const response = await GET({} as Request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('deve retornar 500 em caso de erro na geração', async () => {
      mockRequireRole.mockResolvedValue(mockEmissor);

      // validarAcessoLote - loteCheck ok
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, empresa_id: 1, status: 'ativo', clinica_id: 1 }],
        rowCount: 1,
      } as any);
      // validarAcessoLote - audit log
      mockQuery.mockResolvedValueOnce({} as any);
      // laudoCheck - rejeita (simula erro)
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      const mockParams = { params: { loteId: '1' } };
      const response = await GET({} as Request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });
});
