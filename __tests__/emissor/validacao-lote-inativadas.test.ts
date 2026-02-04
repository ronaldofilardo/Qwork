/**
 * Testes para validação de lotes considerando avaliações inativadas
 *
 * Contexto: Fix aplicado para considerar avaliações inativadas como finalizadas
 * Bug original: Comparação '3' === 3 falhava (string vs number)
 *
 * Alterações testadas:
 * - GET /api/emissor/laudos/[loteId] - validação com parseInt
 * - POST /api/emissor/laudos/[loteId] - geração de laudo com validação correta
 * - Lotes com avaliações inativadas devem ser considerados prontos
 */

// Garantir que os testes usem o banco de teste (proteção contra apontar ao Neon/produção)
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  process.env.DATABASE_URL ||
  'postgresql://localhost/nr-bps_db_test';

// Declarar mocks ANTES de carregar os módulos para evitar execução do módulo real (que valida DATABASE_URL)
jest.mock('@/lib/session');
jest.mock('@/lib/db');
jest.mock('@/lib/laudo-auto', () => ({
  gerarLaudoCompletoEmitirPDF: jest.fn().mockResolvedValue(123),
}));

// Variáveis que serão populadas dinamicamente após resetModules
let GET: any;
let POST: any;
let mockRequireRole: jest.MockedFunction<any>;
let mockQuery: jest.MockedFunction<any>;

// Recarregar módulos isoladamente antes de cada teste (garante que mocks sejam aplicados)
beforeEach(() => {
  jest.resetModules();
  // Garantir que as mocks estejam disponíveis e obter referências
  const session = require('@/lib/session');
  const db = require('@/lib/db');

  mockRequireRole = session.requireRole;
  mockQuery = db.query;

  // Importar a rota (vai usar os módulos mockados acima)
  const route = require('@/app/api/emissor/laudos/[loteId]/route');
  GET = route.GET;
  POST = route.POST;
});

describe('Validação de Lote com Avaliações Inativadas', () => {
  const mockEmissor = {
    cpf: '53051173991',
    nome: 'Emissor Teste',
    perfil: 'emissor' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue(mockEmissor);
  });

  describe('GET - Validação com parseInt', () => {
    it('deve aceitar lote com todas avaliações concluídas (retorno como string)', async () => {
      // Simular retorno do PostgreSQL como strings
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              id: 18,
              status: 'concluido',
              empresa_nome: 'Empresa Teste',
              total_liberadas: '3', // STRING (como retorna do PostgreSQL)
              concluidas: '3', // STRING
              inativadas: '0', // STRING
            },
          ],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // BEGIN
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // laudos

      const mockReq = {} as Request;
      const response = await GET(mockReq, { params: { loteId: '18' } });
      const data = await response.json();

      expect(response.status).not.toBe(400);
      expect(data.error).not.toContain('não está pronto');
    });

    it('deve aceitar lote com avaliações concluídas + inativadas (strings)', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              id: 9,
              status: 'concluido',
              empresa_nome: 'Empresa Teste',
              total_liberadas: '4', // STRING
              concluidas: '1', // STRING
              inativadas: '3', // STRING - 1+3 = 4
            },
          ],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // BEGIN
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // laudos

      const mockReq = {} as Request;
      const response = await GET(mockReq, { params: { loteId: '9' } });
      const data = await response.json();

      expect(response.status).not.toBe(400);
      expect(data.error).not.toContain('não está pronto');
    });

    it('deve rejeitar lote com avaliações pendentes', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              id: 99,
              status: 'ativo',
              empresa_nome: 'Empresa Teste',
              total_liberadas: '5', // STRING
              concluidas: '2', // STRING
              inativadas: '1', // STRING - 2+1 = 3 < 5
            },
          ],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // BEGIN
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // laudos
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // ROLLBACK

      const mockReq = {} as Request;
      const response = await GET(mockReq, { params: { loteId: '99' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('não está pronto');
    });
  });

  describe('POST - Geração de Laudo com Validação', () => {
    it('deve gerar laudo para lote com todas avaliações concluídas', async () => {
      const { gerarLaudoCompletoEmitirPDF } = require('@/lib/laudo-auto');

      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              id: 18,
              status: 'concluido',
              empresa_nome: 'Empresa Teste',
              total_liberadas: '3', // STRING
              concluidas: '3', // STRING
              inativadas: '0', // STRING
            },
          ],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // laudo existente

      const mockReq = {} as Request;
      const response = await POST(mockReq, { params: { loteId: '18' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(gerarLaudoCompletoEmitirPDF).toHaveBeenCalledWith(
        18,
        '53051173991'
      );
    });

    it('deve gerar laudo para lote com concluídas + inativadas', async () => {
      const { gerarLaudoCompletoEmitirPDF } = require('@/lib/laudo-auto');

      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              id: 9,
              status: 'concluido',
              empresa_nome: 'Empresa Teste',
              total_liberadas: '4', // STRING
              concluidas: '1', // STRING
              inativadas: '3', // STRING - 1+3 = 4
            },
          ],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // laudo existente

      const mockReq = {} as Request;
      const response = await POST(mockReq, { params: { loteId: '9' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(gerarLaudoCompletoEmitirPDF).toHaveBeenCalledWith(
        9,
        '53051173991'
      );
    });

    it('deve rejeitar lote com avaliações pendentes', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 99,
            status: 'ativo',
            empresa_nome: 'Empresa Teste',
            total_liberadas: '5', // STRING
            concluidas: '2', // STRING
            inativadas: '1', // STRING - 2+1 = 3 < 5
          },
        ],
        rowCount: 1,
      } as any);

      const mockReq = {} as Request;
      const response = await POST(mockReq, { params: { loteId: '99' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('não está pronto');
      expect(data.detalhes).toContain('3/5 avaliações finalizadas');
    });

    it('deve rejeitar se laudo já foi enviado', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              id: 18,
              status: 'concluido',
              total_liberadas: '3',
              concluidas: '3',
              inativadas: '0',
            },
          ],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({
          rows: [{ id: 18, status: 'enviado' }],
          rowCount: 1,
        } as any); // laudo já existe e foi enviado

      const mockReq = {} as Request;
      const response = await POST(mockReq, { params: { loteId: '18' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Laudo já foi enviado');
    });

    it('deve rejeitar quando laudo já foi emitido (imutável)', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              id: 18,
              status: 'concluido',
              total_liberadas: '3',
              concluidas: '3',
              inativadas: '0',
            },
          ],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({
          rows: [
            { id: 18, status: 'emitido', emitido_em: '2026-01-01T10:00:00Z' },
          ],
          rowCount: 1,
        } as any); // laudo já emitido

      const mockReq = {} as Request;
      const response = await POST(mockReq, { params: { loteId: '18' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Laudo já foi gerado');
    });

    it('deve permitir emitir quando laudo existe em rascunho', async () => {
      const { gerarLaudoCompletoEmitirPDF } = require('@/lib/laudo-auto');

      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              id: 18,
              status: 'concluido',
              total_liberadas: '3',
              concluidas: '3',
              inativadas: '0',
            },
          ],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({
          rows: [{ id: 18, status: 'rascunho' }],
          rowCount: 1,
        } as any); // laudo existe em rascunho

      const mockReq = {} as Request;
      const response = await POST(mockReq, { params: { loteId: '18' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(gerarLaudoCompletoEmitirPDF).toHaveBeenCalledWith(
        18,
        '53051173991'
      );
    });

    it('deve rejeitar se não for emissor', async () => {
      mockRequireRole.mockResolvedValue(null as any);

      const mockReq = {} as Request;
      const response = await POST(mockReq, { params: { loteId: '18' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Acesso negado');
    });
  });

  describe('Casos Edge - Comparação de Tipos', () => {
    it('deve funcionar quando PostgreSQL retorna números', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              id: 20,
              status: 'concluido',
              total_liberadas: 2, // NUMBER (caso raro)
              concluidas: 1, // NUMBER
              inativadas: 1, // NUMBER
            },
          ],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // BEGIN
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const mockReq = {} as Request;
      const response = await GET(mockReq, { params: { loteId: '20' } });
      const data = await response.json();

      expect(response.status).not.toBe(400);
    });

    it('deve funcionar com valores null/undefined (tratados como 0)', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              id: 21,
              status: 'concluido',
              total_liberadas: '0',
              concluidas: null, // NULL
              inativadas: undefined, // UNDEFINED
            },
          ],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // BEGIN
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // laudos
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // ROLLBACK

      const mockReq = {} as Request;
      const response = await GET(mockReq, { params: { loteId: '21' } });
      const data = await response.json();

      // Deve rejeitar porque 0 + 0 = 0, mas total = 0 também (isLoteConcluido = false por totalLiberadas === 0)
      expect(response.status).toBe(400);
    });
  });
});
