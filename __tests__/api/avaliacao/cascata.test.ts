/**
 * @file __tests__/api/avaliacao/cascata.test.ts
 * Testes: POST /api/avaliacao/cascata
 */

import { POST } from '@/app/api/avaliacao/cascata/route';
import { requireAuth } from '@/lib/session';
import { queryWithContext } from '@/lib/db-security';

jest.mock('@/lib/session');
jest.mock('@/lib/db-security');

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
const mockQueryCtx = queryWithContext as jest.MockedFunction<
  typeof queryWithContext
>;

function makeReq(body: Record<string, unknown>): Request {
  return { json: jest.fn().mockResolvedValue(body) } as unknown as Request;
}

describe('POST /api/avaliacao/cascata', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue({
      cpf: '111',
      perfil: 'funcionario',
    } as any);
  });

  it('400 se respostas ausentes', async () => {
    const res = await POST(makeReq({}));
    expect(res.status).toBe(400);
  });

  it('retorna questões visíveis com cascata sem condições extras', async () => {
    mockQueryCtx.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    const res = await POST(makeReq({ respostas: { Q1: 3 } }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    // 1-56 always visible + Q59 + Q65 = 58
    expect(json.questoesVisiveis).toContain(1);
    expect(json.questoesVisiveis).toContain(56);
    expect(json.questoesVisiveis).toContain(59);
    expect(json.questoesVisiveis).toContain(65);
    expect(json.questoesVisiveis).not.toContain(57);
    expect(json.questoesVisiveis).not.toContain(58);
  });

  it('ativa Q57/Q58 quando Q56 > 0 (assédio sexual)', async () => {
    mockQueryCtx.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    const res = await POST(makeReq({ respostas: { Q56: 2 } }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.questoesVisiveis).toContain(57);
    expect(json.questoesVisiveis).toContain(58);
  });

  it('não ativa Q57/Q58 quando Q56 = 0', async () => {
    mockQueryCtx.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    const res = await POST(makeReq({ respostas: { Q56: 0 } }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.questoesVisiveis).not.toContain(57);
    expect(json.questoesVisiveis).not.toContain(58);
  });

  it('avalia condições de cascata do banco (operador gte)', async () => {
    // Condição: Q60 visível se Q59 >= 2
    mockQueryCtx.mockResolvedValueOnce({
      rows: [
        {
          questao_id: 60,
          questao_dependente: 59,
          operador: 'gte',
          valor_condicao: 2,
          categoria: 'behavioral',
        },
      ],
      rowCount: 1,
    } as any);
    const res = await POST(makeReq({ respostas: { Q59: 3 } }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.questoesVisiveis).toContain(60);
  });

  it('não ativa questão se condição não atendida', async () => {
    mockQueryCtx.mockResolvedValueOnce({
      rows: [
        {
          questao_id: 60,
          questao_dependente: 59,
          operador: 'gte',
          valor_condicao: 2,
          categoria: 'behavioral',
        },
      ],
      rowCount: 1,
    } as any);
    const res = await POST(makeReq({ respostas: { Q59: 1 } }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.questoesVisiveis).not.toContain(60);
  });
});
