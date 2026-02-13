import { query } from '@/lib/db';
import { NextRequest } from 'next/server';

// Mock das dependências
jest.mock('@/lib/db');
jest.mock('@/lib/session', () => ({
  requireRole: jest.fn((role: string) => {
    if (role === 'rh') {
      return {
        cpf: '12345678901',
        nome: 'RH User Test',
        clinica_id: 50,
        perfil: 'rh',
      };
    }
    throw new Error('Invalid role');
  }),
}));

describe('/api/clinica/relatorio-individual-pdf', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna 400 quando faltam parâmetros obrigatórios', async () => {
    const { GET } =
      await import('@/app/api/clinica/relatorio-individual-pdf/route');

    const req = {
      url: 'http://localhost:3000/api/clinica/relatorio-individual-pdf',
    } as NextRequest;

    const response = await GET(req);
    expect(response.status).toBe(400);
    const data: unknown = await response.json();
    expect((data as Record<string, unknown>).error).toContain('obrigat');
  });

  it('retorna 404 quando avaliação não é encontrada', async () => {
    const { GET } =
      await import('@/app/api/clinica/relatorio-individual-pdf/route');

    (query as jest.Mock).mockResolvedValueOnce({ rows: [] });

    const req = {
      url: 'http://localhost:3000/api/clinica/relatorio-individual-pdf?lote_id=999&cpf=00000000000',
    } as NextRequest;

    const response = await GET(req);
    expect(response.status).toBe(404);
    const data: unknown = await response.json();
    expect((data as Record<string, unknown>).error).toContain('não encontrada');
  });

  it('deve validar acesso via funcionarios_clinicas', async () => {
    const { GET } =
      await import('@/app/api/clinica/relatorio-individual-pdf/route');

    (query as jest.Mock)
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            funcionario_cpf: '49651696036',
            concluida_em: new Date('2026-02-11').toISOString(),
            nome: 'João Santos',
            cpf: '49651696036',
            matricula: '001',
            funcao: 'Analista',
            nivel_cargo: 'Pleno',
            setor: 'TI',
            empresa_nome: 'Empresa Teste',
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            grupo: 1,
            valor: 7.5,
          },
        ],
      });

    const req = {
      url: 'http://localhost:3000/api/clinica/relatorio-individual-pdf?lote_id=1001&cpf=49651696036',
    } as NextRequest;

    const response = await GET(req);
    expect(response.status).toBe(200);

    // Validar que a query usou funcionarios_clinicas
    const calls = (query as jest.Mock).mock.calls;
    const sqlQuery = calls[0][0];
    expect(sqlQuery).toContain('funcionarios_clinicas');
    expect(sqlQuery).toContain('fc.clinica_id');
    expect(sqlQuery).toContain('fc.empresa_id');
  });

  it('retorna PDF com status 200', async () => {
    const { GET } =
      await import('@/app/api/clinica/relatorio-individual-pdf/route');

    (query as jest.Mock)
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            funcionario_cpf: '49651696036',
            concluida_em: new Date('2026-02-11').toISOString(),
            nome: 'João Santos',
            cpf: '49651696036',
            matricula: '001',
            funcao: 'Analista',
            nivel_cargo: 'Pleno',
            setor: 'TI',
            empresa_nome: 'Empresa Teste',
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            grupo: 1,
            valor: 7.5,
          },
        ],
      });

    const req = {
      url: 'http://localhost:3000/api/clinica/relatorio-individual-pdf?lote_id=1001&cpf=49651696036',
    } as NextRequest;

    const response = await GET(req);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
  });

  it('valida acesso por clinica_id', async () => {
    const { GET } =
      await import('@/app/api/clinica/relatorio-individual-pdf/route');

    (query as jest.Mock).mockResolvedValueOnce({ rows: [] });

    const req = {
      url: 'http://localhost:3000/api/clinica/relatorio-individual-pdf?lote_id=999&cpf=00000000000',
    } as NextRequest;

    const response = await GET(req);
    expect(response.status).toBe(404);

    const calls = (query as jest.Mock).mock.calls;
    const sqlQuery = calls[0][0];
    // parâmetro $3 é clinica_id (após $1=loteId e $2=cpf)
    expect(sqlQuery).toContain('fc.clinica_id = $3');
    expect(sqlQuery).toContain('la.empresa_id = fc.empresa_id');
  });
});

describe('/api/clinica/relatorio-lote-pdf', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna 400 quando falta lote_id', async () => {
    const { GET } = await import('@/app/api/clinica/relatorio-lote-pdf/route');

    const req = {
      url: 'http://localhost:3000/api/clinica/relatorio-lote-pdf',
    } as NextRequest;

    const response = await GET(req);
    expect(response.status).toBe(400);
    const data: unknown = await response.json();
    expect((data as Record<string, unknown>).error).toContain('obrigat');
  });

  it('retorna 404 quando lote não é encontrado', async () => {
    const { GET } = await import('@/app/api/clinica/relatorio-lote-pdf/route');

    (query as jest.Mock).mockResolvedValueOnce({ rows: [] });

    const req = {
      url: 'http://localhost:3000/api/clinica/relatorio-lote-pdf?lote_id=999',
    } as NextRequest;

    const response = await GET(req);
    expect(response.status).toBe(404);
    const data: unknown = await response.json();
    expect((data as Record<string, unknown>).error).toContain('não encontrado');
  });

  it('deve validar acesso via clinica_id', async () => {
    const { GET } = await import('@/app/api/clinica/relatorio-lote-pdf/route');

    (query as jest.Mock)
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1001,
            criado_em: new Date('2026-02-10').toISOString(),
            hash_pdf: 'abc123',
            emitido_em: new Date('2026-02-11').toISOString(),
            status: 'finalizado',
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            nome: 'João Santos',
            cpf: '49651696036',
            concluida_em: new Date('2026-02-11').toISOString(),
            status: 'concluida',
          },
        ],
      });

    const req = {
      url: 'http://localhost:3000/api/clinica/relatorio-lote-pdf?lote_id=1001',
    } as NextRequest;

    const response = await GET(req);
    expect(response.status).toBe(200);

    const calls = (query as jest.Mock).mock.calls;
    const sqlQuery = calls[0][0];
    expect(sqlQuery).toContain('la.clinica_id = $2');
    expect(sqlQuery).toContain('funcionarios_clinicas');
  });

  it('retorna PDF com status 200', async () => {
    const { GET } = await import('@/app/api/clinica/relatorio-lote-pdf/route');

    (query as jest.Mock)
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1001,
            criado_em: new Date('2026-02-10').toISOString(),
            hash_pdf: 'abc123',
            emitido_em: new Date('2026-02-11').toISOString(),
            status: 'finalizado',
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            nome: 'João Santos',
            cpf: '49651696036',
            concluida_em: new Date('2026-02-11').toISOString(),
            status: 'concluida',
          },
        ],
      });

    const req = {
      url: 'http://localhost:3000/api/clinica/relatorio-lote-pdf?lote_id=1001',
    } as NextRequest;

    const response = await GET(req);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
  });

  it('filtra apenas funcionários com status concluida', async () => {
    const { GET } = await import('@/app/api/clinica/relatorio-lote-pdf/route');

    (query as jest.Mock)
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1001,
            criado_em: new Date('2026-02-10').toISOString(),
            hash_pdf: 'abc123',
            emitido_em: new Date('2026-02-11').toISOString(),
            status: 'finalizado',
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [],
      });

    const req = {
      url: 'http://localhost:3000/api/clinica/relatorio-lote-pdf?lote_id=1001',
    } as NextRequest;

    const response = await GET(req);
    expect(response.status).toBe(200);

    const calls = (query as jest.Mock).mock.calls;
    const sqlQuery = calls[1][0];
    expect(sqlQuery).toContain("a.status = 'concluida'");
  });

  it('validar correspondência entre clinica_id e empresa_id', async () => {
    const { GET } = await import('@/app/api/clinica/relatorio-lote-pdf/route');

    (query as jest.Mock)
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1001,
            criado_em: new Date('2026-02-10').toISOString(),
            hash_pdf: 'abc123',
            emitido_em: new Date('2026-02-11').toISOString(),
            status: 'finalizado',
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            nome: 'João Santos',
            cpf: '49651696036',
            concluida_em: new Date('2026-02-11').toISOString(),
            status: 'concluida',
          },
        ],
      });

    const req = {
      url: 'http://localhost:3000/api/clinica/relatorio-lote-pdf?lote_id=1001',
    } as NextRequest;

    const response = await GET(req);
    expect(response.status).toBe(200);

    const calls = (query as jest.Mock).mock.calls;
    const sqlQuery = calls[1][0];
    // Usa subquery para validar empresa_id:
    expect(sqlQuery).toContain(
      'fc.empresa_id IN (SELECT empresa_id FROM lotes_avaliacao WHERE id = $1)'
    );
    expect(sqlQuery).toContain('fc.clinica_id = $2');
  });
});
