import { POST } from '@/app/api/test/session/route';
import { query } from '@/lib/db';
import { NextRequest } from 'next/server';

jest.mock('@/lib/db');

const mockQuery = query as jest.MockedFunction<typeof query>;

describe('/api/test/session', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('mapeia clinica via contratante_id quando perfil = rh e clinica existe', async () => {
    const mockRequest: Partial<NextRequest> = {
      json: jest.fn().mockResolvedValue({
        cpf: '99900011122',
        nome: 'RH Teste',
        perfil: 'rh',
        contratante_id: 77,
      }),
      headers: { get: jest.fn() } as any,
    };

    // Simular lookup de clinica por contratante_id
    mockQuery.mockImplementation((sql: string) => {
      if (sql.includes('SELECT id FROM clinicas WHERE contratante_id')) {
        return Promise.resolve({
          rows: [{ id: 77, ativa: true }],
          rowCount: 1,
        });
      }
      return Promise.resolve({ rows: [], rowCount: 0 });
    });

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.session.clinica_id).toBe(77);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('SELECT id FROM clinicas WHERE contratante_id'),
      [77]
    );
  });

  it('não define clinica_id se clínica não existir', async () => {
    const mockRequest: Partial<NextRequest> = {
      json: jest.fn().mockResolvedValue({
        cpf: '99900011123',
        nome: 'RH Sem Clinica',
        perfil: 'rh',
        contratante_id: 88,
      }),
      headers: { get: jest.fn() } as any,
    };

    mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.session.clinica_id).toBeUndefined();
  });
});
