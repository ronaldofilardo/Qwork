/**
 * @file __tests__/api/entidade/parcelas-gerar-recibo.test.ts
 * Testes: POST /api/entidade/parcelas/gerar-recibo
 */

import { POST } from '@/app/api/entidade/parcelas/gerar-recibo/route';
import { requireEntity } from '@/lib/session';
import { queryAsGestorEntidade } from '@/lib/db-gestor';

jest.mock('@/lib/session');
jest.mock('@/lib/db-gestor');
jest.mock('fs/promises', () => ({ writeFile: jest.fn(), mkdir: jest.fn() }));
jest.mock('fs', () => ({ existsSync: jest.fn().mockReturnValue(true) }));

const mockRequireEntity = requireEntity as jest.MockedFunction<
  typeof requireEntity
>;
const mockQueryGestor = queryAsGestorEntidade as jest.MockedFunction<
  typeof queryAsGestorEntidade
>;

const session = { cpf: '111', perfil: 'gestor' as const, entidade_id: 5 };

function makeReq(body: Record<string, unknown>): Request {
  return {
    text: jest.fn().mockResolvedValue(JSON.stringify(body)),
  } as unknown as Request;
}

describe('POST /api/entidade/parcelas/gerar-recibo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireEntity.mockResolvedValue(session as any);
  });

  it('400 se parcela_numero ou pagamento_id ausente', async () => {
    const res = await POST(makeReq({ parcela_numero: 1 }));
    expect(res.status).toBe(400);
  });

  it('400 se tabela recibos não existe', async () => {
    mockQueryGestor.mockResolvedValue({ rows: [], rowCount: 0 } as any);
    const res = await POST(makeReq({ parcela_numero: 1, pagamento_id: 10 }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('recibos');
  });

  it('retorna recibo existente (idempotência)', async () => {
    mockQueryGestor
      .mockResolvedValueOnce({
        rows: [{ column_name: 'id' }],
        rowCount: 1,
      } as any) // table check
      .mockResolvedValueOnce({
        rows: [
          {
            id: 50,
            numero_recibo: 'R001',
            hash_pdf: 'abc',
            conteudo_pdf_path: '/storage/r.txt',
          },
        ],
        rowCount: 1,
      } as any);

    const res = await POST(makeReq({ parcela_numero: 1, pagamento_id: 10 }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.message).toContain('já existe');
    expect(json.recibo.id).toBe(50);
  });

  it('500 em caso de erro', async () => {
    mockRequireEntity.mockRejectedValue(new Error('fail'));
    const res = await POST(makeReq({ parcela_numero: 1, pagamento_id: 10 }));
    expect(res.status).toBe(500);
  });
});
