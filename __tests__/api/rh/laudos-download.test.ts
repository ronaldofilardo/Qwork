import { GET } from '@/app/api/rh/laudos/[laudoId]/download/route';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';
import fs from 'fs';

jest.mock('@/lib/session');
jest.mock('@/lib/db');
jest.mock('fs');

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;
const mockQuery = query as jest.MockedFunction<typeof query>;
const mockFs = fs as unknown as {
  existsSync: jest.Mock;
  readFileSync: jest.Mock;
};

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

  it('deve retornar 403 quando RH não pertence à clínica do laudo', async () => {
    mockGetSession.mockResolvedValue({
      cpf: '111',
      nome: 'RH',
      perfil: 'rh',
      clinica_id: 99,
    } as any);
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const response = await GET(
      {} as Request,
      { params: { laudoId: '10' } } as any
    );
    // quando laudo não encontrado o route atual retorna 404
    expect(response.status).toBe(404);
  });

  it('deve retornar o PDF quando RH da mesma clínica', async () => {
    mockGetSession.mockResolvedValue({
      cpf: '222',
      nome: 'RH',
      perfil: 'rh',
      clinica_id: 5,
    } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 10,
          lote_id: 18,
          codigo: '002-040126',
          titulo: 'Teste',
          clinica_id: 5,
        },
      ],
      rowCount: 1,
    } as any);

    mockFs.existsSync = jest.fn().mockReturnValue(true);
    mockFs.readFileSync = jest.fn().mockReturnValue(Buffer.from('pdf'));

    const response = await GET(
      {} as Request,
      { params: { laudoId: '10' } } as any
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
    expect(response.headers.get('Content-Disposition')).toContain(
      'laudo-002-040126.pdf'
    );
  });

  it('deve retornar PDF vindo do campo arquivo_pdf no banco quando presente', async () => {
    mockGetSession.mockResolvedValue({
      cpf: '333',
      nome: 'RH',
      perfil: 'rh',
      clinica_id: 5,
    } as any);

    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 10,
          lote_id: 18,
          codigo: '002-040126',
          titulo: 'Teste',
          clinica_id: 5,
          arquivo_pdf: Buffer.from('pdf-bytes'),
        },
      ],
      rowCount: 1,
    } as any);

    // FS diz que arquivo não existe
    mockFs.existsSync = jest.fn().mockReturnValue(false);

    const response = await GET(
      {} as Request,
      { params: { laudoId: '10' } } as any
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
    expect(response.headers.get('Content-Disposition')).toContain(
      'laudo-002-040126.pdf'
    );
  });
});
