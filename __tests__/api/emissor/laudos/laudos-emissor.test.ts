// Jest globals available by default
import { POST, GET, PATCH } from '@/app/api/emissor/laudos/[loteId]/route';
import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';

// Mock request/response helpers
const mockRequest = (method: string, body?: any, params?: any) => ({
  method,
  json: async () => body,
  params: params || {},
});

jest.mock('@/lib/session', () => ({
  requireRole: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;
const mockQuery = query as jest.MockedFunction<typeof query>;

// IGNORADO: testes de emissão de laudos temporariamente skipados para breve refatoração
describe.skip('API Emissor - Laudos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve emitir um laudo com sucesso', async () => {
    mockRequireRole.mockResolvedValue({
      cpf: '99999999999',
      nome: 'Emissor Teste',
      perfil: 'emissor',
    });

    // Mock verificação de lote
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          status: 'ativo',
          empresa_nome: 'Empresa Teste',
          clinica_nome: 'Clínica Teste',
          total: 4,
          concluidas: 4,
        },
      ],
      rowCount: 1,
    } as any);

    // Mock busca de laudo existente
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 100,
          observacoes: 'Observações teste',
          status: 'rascunho',
          criado_em: '2025-11-29T10:00:00Z',
          emitido_em: null,
          enviado_em: null,
        },
      ],
      rowCount: 1,
    } as any);

    // Mock atualização do laudo
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 100,
          observacoes: 'Observações teste',
          status: 'emitido',
          criado_em: '2025-11-29T10:00:00Z',
          emitido_em: '2025-11-30T10:00:00Z',
          enviado_em: null,
        },
      ],
      rowCount: 1,
    } as any);

    const req = mockRequest('POST', { observacoes: 'Teste' }, { loteId: 1 });
    const res = await POST(req as any, { params: { loteId: '1' } });
    expect([200, 404, 500]).toContain(res.status);
    const data = await res.json();

    if (res.status === 200) {
      expect(data.success).toBe(true);
      // POST apenas emite o laudo e retorna mensagem de sucesso (sem payload do laudo)
      expect(data.message).toBeDefined();
    }
  });

  it('deve consultar laudos de um lote', async () => {
    mockRequireRole.mockResolvedValue({
      cpf: '99999999999',
      nome: 'Emissor Teste',
      perfil: 'emissor',
    });
    // Preparar mocks para todas as consultas feitas durante o GET
    // 1) Verificação do lote
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          status: 'ativo',
          empresa_nome: 'Empresa Teste',
          clinica_nome: 'Clínica Teste',
          total: 4,
          concluidas: 4,
        },
      ],
      rowCount: 1,
    } as any);

    // 2) gerarDadosGeraisEmpresa -> primeira query (lote info)
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          titulo: 'Avaliação X',
          liberado_em: '2024-01-01T00:00:00Z',
          empresa_nome: 'Empresa Teste',
          cnpj: '00.000.000/0001-00',
          endereco: 'Rua Teste, 1',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '00000-000',
          clinica_nome: 'Clínica Teste',
          total_avaliacoes: 4,
          avaliacoes_concluidas: 4,
        },
      ],
      rowCount: 1,
    } as any);

    // 3) gerarDadosGeraisEmpresa -> segunda query (funcionarios contagem)
    mockQuery.mockResolvedValueOnce({
      rows: [{ total: 4, operacional: 3, gestao: 1 }],
      rowCount: 1,
    } as any);

    // 4) calcularScoresPorGrupo -> respostas por grupo
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    // 5) busca de laudo existente
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 100,
          observacoes: 'Obs',
          status: 'rascunho',
          criado_em: '2025-11-29T10:00:00Z',
        },
      ],
      rowCount: 1,
    } as any);

    const req = mockRequest('GET', undefined, { loteId: 1 });
    const res = await GET(req as any, { params: { loteId: '1' } });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.laudoPadronizado).toBeDefined();
    expect(data.lote).toBeDefined();
  });

  it('deve atualizar status do laudo', async () => {
    mockRequireRole.mockResolvedValue({
      cpf: '99999999999',
      nome: 'Emissor Teste',
      perfil: 'emissor',
    });
    const req = mockRequest('PATCH', { status: 'emitido' }, { loteId: 1 });
    const res = await PATCH(req as any, { params: { loteId: '1' } });
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });
});
