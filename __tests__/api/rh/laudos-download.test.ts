/**
 * Teste atualizado em 10/02/2026 para refletir comportamento de proxy server-side do Backblaze
 * Remove mocks de filesystem (fs) e adiciona mock de global.fetch
 */

import { GET } from '@/app/api/rh/laudos/[laudoId]/download/route';
import { getSession, requireRHWithEmpresaAccess } from '@/lib/session';
import { query } from '@/lib/db';

jest.mock('@/lib/session');
jest.mock('@/lib/db');
jest.mock('@/lib/storage/backblaze-client');

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;
const mockRequireRHWithEmpresaAccess =
  requireRHWithEmpresaAccess as jest.MockedFunction<
    typeof requireRHWithEmpresaAccess
  >;
const mockQuery = query as jest.MockedFunction<typeof query>;

// Mock global fetch para simular download do Backblaze
global.fetch = jest.fn();

describe('/api/rh/laudos/[laudoId]/download', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar 403 quando usuário sem sessão RH', async () => {
    mockGetSession.mockResolvedValue(null as any);
    const response = await GET(
      {} as Request,
      { params: { laudoId: '10' } } as any
    );
    expect(response.status).toBe(403);
  });

  it('deve retornar 403 quando RH não tem acesso à empresa do laudo', async () => {
    mockGetSession.mockResolvedValue({
      cpf: '111.111.111-11',
      nome: 'RH Test',
      perfil: 'rh',
      clinica_id: 5,
    } as any);

    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 15,
          lote_id: 15,
          status: 'emitido',
          hash_pdf: 'abc123',
          clinica_id: 5,
          empresa_id: 10,
        },
      ],
      rowCount: 1,
    } as any);

    // requireRHWithEmpresaAccess falha quando RH não tem acesso à empresa
    mockRequireRHWithEmpresaAccess.mockRejectedValueOnce(
      new Error('Você não tem permissão para acessar esta empresa')
    );

    const response = await GET(
      {} as Request,
      { params: { laudoId: '15' } } as any
    );

    expect(response.status).toBe(403);
    expect(mockRequireRHWithEmpresaAccess).toHaveBeenCalledWith(10);
  });

  it('deve validar acesso através de requireRHWithEmpresaAccess com empresa_id correto', async () => {
    mockGetSession.mockResolvedValue({
      cpf: '222.222.222-22',
      nome: 'RH Test',
      perfil: 'rh',
      clinica_id: 5,
    } as any);

    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 15,
          lote_id: 15,
          status: 'emitido',
          hash_pdf: 'abc123',
          arquivo_remoto_key: 'laudos/lote-15/laudo.pdf',
          clinica_id: 5,
          empresa_id: 10,
        },
      ],
      rowCount: 1,
    } as any);

    // requireRHWithEmpresaAccess sucede
    mockRequireRHWithEmpresaAccess.mockResolvedValueOnce({} as any);

    // Mock do fetch do Backblaze retornando PDF
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      arrayBuffer: jest.fn().mockResolvedValue(Buffer.from('pdf-content')),
    });

    const response = await GET(
      {} as Request,
      { params: { laudoId: '15' } } as any
    );

    expect(response.status).toBe(200);
    expect(mockRequireRHWithEmpresaAccess).toHaveBeenCalledWith(10);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
  });

  it('deve retornar 404 quando laudo não encontrado', async () => {
    mockGetSession.mockResolvedValue({
      cpf: '333',
      nome: 'RH',
      perfil: 'rh',
      clinica_id: 5,
    } as any);

    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const response = await GET(
      {} as Request,
      { params: { laudoId: '999' } } as any
    );

    expect(response.status).toBe(404);
    expect(mockRequireRHWithEmpresaAccess).not.toHaveBeenCalled();
  });

  it('deve retornar o PDF quando RH tem acesso à empresa', async () => {
    mockGetSession.mockResolvedValue({
      cpf: '444.444.444-44',
      nome: 'RH',
      perfil: 'rh',
      clinica_id: 5,
    } as any);

    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 10,
          lote_id: 18,
          status: 'emitido',
          hash_pdf: 'hash123',
          arquivo_remoto_key: 'laudos/lote-18/laudo.pdf',
          clinica_id: 5,
          empresa_id: 20,
        },
      ],
      rowCount: 1,
    } as any);

    mockRequireRHWithEmpresaAccess.mockResolvedValueOnce({} as any);

    // Mock do fetch do Backblaze retornando PDF
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      arrayBuffer: jest.fn().mockResolvedValue(Buffer.from('pdf')),
    });

    const response = await GET(
      {} as Request,
      { params: { laudoId: '10' } } as any
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
    expect(response.headers.get('Content-Disposition')).toContain(
      'laudo-10.pdf'
    );
    expect(mockRequireRHWithEmpresaAccess).toHaveBeenCalledWith(20);
  });

  it('deve permitir acesso para usuário emissor sem validação de empresa', async () => {
    mockGetSession.mockResolvedValue({
      cpf: '555.555.555-55',
      nome: 'Emissor',
      perfil: 'emissor',
    } as any);

    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 12,
          lote_id: 20,
          status: 'emitido',
          hash_pdf: 'hash456',
          arquivo_remoto_key: 'laudos/lote-20/laudo.pdf',
          clinica_id: 5,
          empresa_id: 30,
        },
      ],
      rowCount: 1,
    } as any);

    // Mock do fetch do Backblaze retornando PDF
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      arrayBuffer: jest.fn().mockResolvedValue(Buffer.from('pdf')),
    });

    const response = await GET(
      {} as Request,
      { params: { laudoId: '12' } } as any
    );

    expect(response.status).toBe(200);
    // Emissor não passa por requireRHWithEmpresaAccess
    expect(mockRequireRHWithEmpresaAccess).not.toHaveBeenCalled();
  });

  it('deve retornar 403 quando perfil não é RH nem emissor', async () => {
    mockGetSession.mockResolvedValue({
      cpf: '666',
      nome: 'Admin',
      perfil: 'admin',
    } as any);

    const response = await GET(
      {} as Request,
      { params: { laudoId: '10' } } as any
    );

    expect(response.status).toBe(403);
  });
});
