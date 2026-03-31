/**
 * @file __tests__/api/emissor/laudos/laudos-emissor.test.ts
 * Testes: API Emissor - Laudos (complementar)
 */

// Jest globals available by default
import { POST, PATCH } from '@/app/api/emissor/laudos/[loteId]/route';
import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';

jest.mock('@/lib/session', () => ({
  requireRole: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('@/lib/laudo-auto', () => ({
  gerarLaudoCompletoEmitirPDF: jest.fn().mockResolvedValue(42),
}));

const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;
const mockQuery = query as jest.MockedFunction<typeof query>;

// Testes complementares: cobrem cenários NÃO cobertos por laudos.test.ts
describe('API Emissor - Laudos (complementar)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST deve retornar 404 se lote não encontrado', async () => {
    mockRequireRole.mockResolvedValue({
      cpf: '99999999999',
      nome: 'Emissor Teste',
      perfil: 'emissor' as const,
    });

    // loteCheck retorna vazio
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const req = {} as Request;
    const res = await POST(req, { params: { loteId: '999' } });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe('Lote não encontrado');
  });

  it('POST deve retornar 400 se laudo já foi enviado', async () => {
    mockRequireRole.mockResolvedValue({
      cpf: '99999999999',
      nome: 'Emissor Teste',
      perfil: 'emissor' as const,
    });

    // loteCheck - lote concluído e pago
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          status: 'concluido',
          status_pagamento: 'pago',
          pago_em: '2025-01-01',
          empresa_nome: 'Empresa',
          total_liberadas: '4',
          concluidas: '4',
          inativadas: '0',
        },
      ],
      rowCount: 1,
    } as any);

    // laudoExistente - laudo já enviado
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 100, status: 'enviado', emitido_em: '2025-01-01' }],
      rowCount: 1,
    } as any);

    const req = {} as Request;
    const res = await POST(req, { params: { loteId: '1' } });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Laudo já foi enviado para este lote');
  });

  it('PATCH deve retornar 400 se status não for enviado', async () => {
    mockRequireRole.mockResolvedValue({
      cpf: '99999999999',
      nome: 'Emissor Teste',
      perfil: 'emissor' as const,
    });

    const req = {
      json: jest.fn().mockResolvedValue({ status: 'emitido' }),
    } as any;
    const res = await PATCH(req, { params: { loteId: '1' } });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Status inválido');
  });
});
