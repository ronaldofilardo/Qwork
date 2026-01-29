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

jest.mock('@/lib/storage/backblaze-client', () => ({
  getPresignedUrl: jest
    .fn()
    .mockResolvedValue('https://signed.example.com/laudo.pdf'),
  findLatestLaudoForLote: jest
    .fn()
    .mockResolvedValue('laudos/lote-30/laudo-123.pdf'),
}));

describe('/api/rh/laudos/[laudoId]/download remote', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve redirecionar para URL assinada quando metadata remoto existe', async () => {
    mockGetSession.mockResolvedValue({
      cpf: '222',
      nome: 'RH',
      perfil: 'rh',
      clinica_id: 1,
    } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 30,
          lote_id: 30,
          codigo: '008-280126',
          titulo: 'Lote 8',
          clinica_id: null,
        },
      ],
      rowCount: 1,
    } as any);

    // Simulate metadata file exists and contains arquivo_remoto.key
    mockFs.existsSync = jest.fn().mockReturnValue(false);
    mockFs.readFileSync = jest.fn().mockReturnValue(
      JSON.stringify({
        arquivo_remoto: { key: 'laudos/lote-30/laudo-123.pdf' },
      })
    );

    const res = await GET({} as Request, { params: { laudoId: '30' } } as any);

    expect(res.status).toBe(307);
    expect(res.headers.get('Location')).toBe(
      'https://signed.example.com/laudo.pdf'
    );
  });

  it('deve redirecionar usando o ultimo arquivo do lote quando metadata ausente', async () => {
    mockGetSession.mockResolvedValue({
      cpf: '222',
      nome: 'RH',
      perfil: 'rh',
      clinica_id: 1,
    } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 30,
          lote_id: 30,
          codigo: '008-280126',
          titulo: 'Lote 8',
          clinica_id: null,
        },
      ],
      rowCount: 1,
    } as any);

    mockFs.existsSync = jest.fn().mockReturnValue(false);
    // Simulate readFileSync throws for metadata
    mockFs.readFileSync = jest.fn(() => {
      throw new Error('file not found');
    });

    const res = await GET({} as Request, { params: { laudoId: '30' } } as any);
    expect(res.status).toBe(307);
    expect(res.headers.get('Location')).toBe(
      'https://signed.example.com/laudo.pdf'
    );
  });

  it('deve retornar 404 quando metadata e objeto remoto estiverem ausentes', async () => {
    mockGetSession.mockResolvedValue({
      cpf: '222',
      nome: 'RH',
      perfil: 'rh',
      clinica_id: 1,
    } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 15,
          lote_id: 31,
          codigo: '009-280126',
          titulo: 'Lote 9',
          clinica_id: null,
        },
      ],
      rowCount: 1,
    } as any);

    mockFs.existsSync = jest.fn().mockReturnValue(false);
    // Simulate readFileSync throws for metadata
    mockFs.readFileSync = jest.fn(() => {
      throw new Error('file not found');
    });

    // Override backblaze helper to return no object for the lote
    const bb = require('@/lib/storage/backblaze-client');
    bb.findLatestLaudoForLote = jest.fn().mockResolvedValue(null);

    const res = await GET({} as Request, { params: { laudoId: '15' } } as any);
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe('Arquivo do laudo não encontrado');
  });
});
