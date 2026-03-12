/**
 * @file __tests__/api/rh/laudos-download-remote.test.ts
 * Testes: /api/rh/laudos/[laudoId]/download remote
 */

import { GET } from '@/app/api/rh/laudos/[laudoId]/download/route';
import { getSession, requireRHWithEmpresaAccess } from '@/lib/session';
import { query } from '@/lib/db';

jest.mock('@/lib/session');
jest.mock('@/lib/db');

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;
const mockRequireRH = requireRHWithEmpresaAccess as jest.MockedFunction<
  typeof requireRHWithEmpresaAccess
>;
const mockQuery = query as jest.MockedFunction<typeof query>;

jest.mock('@/lib/storage/backblaze-client', () => ({
  getPresignedUrl: jest
    .fn()
    .mockResolvedValue('https://signed.example.com/laudo.pdf'),
}));

const rhSession = {
  cpf: '222',
  nome: 'RH',
  perfil: 'rh' as const,
  clinica_id: 1,
};

const laudoRow = {
  id: 30,
  lote_id: 30,
  status: 'emitido',
  hash_pdf: 'abc123',
  arquivo_remoto_provider: 'backblaze',
  arquivo_remoto_bucket: 'qwork-laudos',
  arquivo_remoto_key: 'laudos/lote-30/laudo-30.pdf',
  arquivo_remoto_url: 'https://bucket.example.com/laudos/lote-30/laudo-30.pdf',
  clinica_id: 1,
  empresa_id: 5,
};

describe('/api/rh/laudos/[laudoId]/download remote', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRH.mockResolvedValue(undefined as any);
  });

  it('deve retornar PDF via proxy quando laudo emitido com arquivo remoto', async () => {
    mockGetSession.mockResolvedValue(rhSession as any);
    mockQuery.mockResolvedValueOnce({ rows: [laudoRow], rowCount: 1 } as any);

    // Mock fetch for server-side proxy download
    const pdfBytes = new Uint8Array([37, 80, 68, 70]); // %PDF
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(pdfBytes.buffer),
    });

    const res = await GET({} as Request, { params: { laudoId: '30' } } as any);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
    expect(res.headers.get('Content-Disposition')).toContain('laudo-30.pdf');
  });

  it('deve retornar 404 quando laudo não encontrado ou não emitido', async () => {
    mockGetSession.mockResolvedValue(rhSession as any);
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const res = await GET({} as Request, { params: { laudoId: '99' } } as any);
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe('Laudo não encontrado');
  });

  it('deve retornar 404 quando arquivo_remoto_key ausente', async () => {
    mockGetSession.mockResolvedValue(rhSession as any);
    const laudoSemKey = { ...laudoRow, arquivo_remoto_key: null };
    mockQuery.mockResolvedValueOnce({
      rows: [laudoSemKey],
      rowCount: 1,
    } as any);

    const res = await GET({} as Request, { params: { laudoId: '30' } } as any);
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toContain('não foi enviado ao bucket');
  });
});
