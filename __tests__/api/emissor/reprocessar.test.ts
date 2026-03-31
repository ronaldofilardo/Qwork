/**
 * @file __tests__/api/emissor/reprocessar.test.ts
 * Testes: POST /api/emissor/laudos/[loteId]/reprocessar
 */

import { POST } from '@/app/api/emissor/laudos/[loteId]/reprocessar/route';
import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';

jest.mock('@/lib/session');
jest.mock('@/lib/db');

const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;
const mockQuery = query as jest.MockedFunction<typeof query>;

function callPOST(loteId: string) {
  return POST({} as Request, { params: { loteId } } as any);
}

describe('POST /api/emissor/laudos/[loteId]/reprocessar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue({
      cpf: '999',
      perfil: 'emissor',
      nome: 'Emissor',
    } as any);
  });

  it('403 se não emissor', async () => {
    mockRequireRole.mockRejectedValue(new Error('Sem permissão'));
    // Also mock next-auth fallback to fail
    jest.mock('next-auth', () => ({
      getServerSession: jest.fn().mockResolvedValue(null),
    }));
    const res = await callPOST('1');
    expect(res.status).toBe(403);
  });

  it('400 se loteId inválido', async () => {
    const res = await callPOST('abc');
    expect(res.status).toBe(400);
  });

  it('404 se lote não encontrado', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    const res = await callPOST('999');
    expect(res.status).toBe(404);
  });

  it('400 se lote não está concluído', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, status: 'ativo', codigo: 'L1', tomador_id: 5 }],
      rowCount: 1,
    } as any);
    const res = await callPOST('1');
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('concluído');
  });

  it('400 se laudo já enviado', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ id: 1, status: 'concluido', codigo: 'L1', tomador_id: 5 }],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({ rows: [{ id: 10 }], rowCount: 1 } as any); // laudo enviado exists
    const res = await callPOST('1');
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('enviado');
  });

  it('200 já na fila se emissão já solicitada', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ id: 1, status: 'concluido', codigo: 'L1', tomador_id: 5 }],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // no laudo enviado
      .mockResolvedValueOnce({
        rows: [{ id: 50, tentativas: 0 }],
        rowCount: 1,
      } as any); // already in queue
    const res = await callPOST('1');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.na_fila).toBe(true);
  });

  it('200 solicita reprocessamento com sucesso', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ id: 1, status: 'concluido', codigo: 'L1', tomador_id: 5 }],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // no laudo enviado
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // not in queue
      .mockResolvedValueOnce({ rows: [{ id: 100 }], rowCount: 1 } as any) // INSERT auditoria_laudos
      .mockResolvedValueOnce({ rowCount: 1 } as any); // INSERT audit_logs

    const res = await callPOST('1');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.message).toContain('Reprocessamento');
    expect(json.fila_item_id).toBe(100);
  });
});
