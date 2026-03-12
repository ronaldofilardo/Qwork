/**
 * @file __tests__/api/entidade/parcelas-download-recibo.test.ts
 * Testes: GET /api/entidade/parcelas/download-recibo
 */

import { GET } from '@/app/api/entidade/parcelas/download-recibo/route';
import { requireEntity } from '@/lib/session';
import { queryAsGestorEntidade } from '@/lib/db-gestor';

jest.mock('@/lib/session');
jest.mock('@/lib/db-gestor');
jest.mock('fs/promises', () => ({
  readFile: jest.fn().mockResolvedValue(Buffer.from('recibo content')),
}));
jest.mock('fs', () => ({ existsSync: jest.fn().mockReturnValue(true) }));

const mockRequireEntity = requireEntity as jest.MockedFunction<
  typeof requireEntity
>;
const mockQueryGestor = queryAsGestorEntidade as jest.MockedFunction<
  typeof queryAsGestorEntidade
>;

const session = { cpf: '111', perfil: 'gestor' as const, entidade_id: 5 };

function makeReq(params: Record<string, string> = {}): Request {
  const url = new URL('http://localhost/api/entidade/parcelas/download-recibo');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return { url: url.toString() } as unknown as Request;
}

describe('GET /api/entidade/parcelas/download-recibo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireEntity.mockResolvedValue(session as any);
  });

  it('400 se id ausente', async () => {
    const res = await GET(makeReq());
    expect(res.status).toBe(400);
  });

  it('404 se recibo não encontrado', async () => {
    mockQueryGestor.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    const res = await GET(makeReq({ id: '99' }));
    expect(res.status).toBe(404);
  });

  it('403 se recibo não pertence à entidade', async () => {
    mockQueryGestor.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          numero_recibo: 'R001',
          conteudo_pdf_path: '/path',
          conteudo_texto: null,
          entidade_id: 999,
        },
      ],
      rowCount: 1,
    } as any);
    const res = await GET(makeReq({ id: '1' }));
    expect(res.status).toBe(403);
  });

  it('200 retorna conteúdo do arquivo', async () => {
    mockQueryGestor.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          numero_recibo: 'R001',
          conteudo_pdf_path: 'storage/r.txt',
          conteudo_texto: null,
          entidade_id: 5,
        },
      ],
      rowCount: 1,
    } as any);

    const res = await GET(makeReq({ id: '1' }));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/plain');
    expect(res.headers.get('Content-Disposition')).toContain('R001');
  });

  it('200 fallback para conteudo_texto', async () => {
    const { existsSync } = require('fs');
    existsSync.mockReturnValueOnce(false);

    mockQueryGestor.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          numero_recibo: 'R002',
          conteudo_pdf_path: null,
          conteudo_texto: 'Recibo texto',
          entidade_id: 5,
        },
      ],
      rowCount: 1,
    } as any);

    const res = await GET(makeReq({ id: '1' }));
    expect(res.status).toBe(200);
  });
});
