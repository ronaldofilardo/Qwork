import { query } from '@/lib/db';
import { NextRequest } from 'next/server';

// Mock das dependências
jest.mock('@/lib/db');
jest.mock('@/lib/session', () => ({
  requireEntity: jest.fn(() => ({
    cpf: '29930511059',
    nome: 'Entidade Test',
    entidade_id: 100,
    perfil: 'gestor',
  })),
}));

describe('/api/entidade/relatorio-individual-pdf', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna 400 quando faltam parâmetros obrigatórios', async () => {
    const { GET } =
      await import('@/app/api/entidade/relatorio-individual-pdf/route');

    const req = {
      url: 'http://localhost:3000/api/entidade/relatorio-individual-pdf',
    } as NextRequest;

    const response = await GET(req);
    expect(response.status).toBe(400);
    const data: unknown = await response.json();
    expect((data as Record<string, unknown>).error).toContain('obrigat');
  });

  it('retorna 404 quando avaliação não é encontrada', async () => {
    const { GET } =
      await import('@/app/api/entidade/relatorio-individual-pdf/route');

    (query as jest.Mock).mockResolvedValueOnce({ rows: [] });

    const req = {
      url: 'http://localhost:3000/api/entidade/relatorio-individual-pdf?lote_id=999&cpf=00000000000',
    } as NextRequest;

    const response = await GET(req);
    expect(response.status).toBe(404);
    const data: unknown = await response.json();
    expect((data as Record<string, unknown>).error).toContain('não encontrada');
  });

  it('deve usar tabela CORRIGIDA: entidades (não contratante)', async () => {
    const { GET } =
      await import('@/app/api/entidade/relatorio-individual-pdf/route');

    (query as jest.Mock)
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            funcionario_cpf: '49651696036',
            concluida_em: new Date('2026-02-11').toISOString(),
            nome: 'Maria Silva',
            cpf: '49651696036',
            matricula: '001',
            funcao: 'Gestor',
            nivel_cargo: 'Senior',
            setor: 'RH',
            empresa_nome: 'Entidade 100',
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
      url: 'http://localhost:3000/api/entidade/relatorio-individual-pdf?lote_id=1007&cpf=49651696036',
    } as NextRequest;

    const response = await GET(req);
    expect(response.status).toBe(200);

    // Validar que a query usou JOIN entidades (não contratante)
    const calls = (query as jest.Mock).mock.calls;
    const sqlQuery = calls[0][0];
    expect(sqlQuery).toContain('JOIN entidades e');
    expect(sqlQuery).not.toContain('JOIN contratante');
  });

  it('valida acesso por entidade_id', async () => {
    const { GET } =
      await import('@/app/api/entidade/relatorio-individual-pdf/route');

    (query as jest.Mock).mockResolvedValueOnce({ rows: [] });

    const req = {
      url: 'http://localhost:3000/api/entidade/relatorio-individual-pdf?lote_id=1005&cpf=73922219063',
    } as NextRequest;

    const response = await GET(req);
    expect(response.status).toBe(404);

    // Validar que a query foi chamada com entidade_id correto
    const calls = (query as jest.Mock).mock.calls;
    const queryCall: unknown = calls[0];
    const sqlQuery = (queryCall as unknown[])[0] as string;
    expect(sqlQuery).toContain('AND fe.entidade_id = $3');
    expect(sqlQuery).toContain('AND la.entidade_id = $3');
  });

  it('retorna PDF com sucesso quando avaliação existe', async () => {
    const { GET } =
      await import('@/app/api/entidade/relatorio-individual-pdf/route');

    (query as jest.Mock)
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            funcionario_cpf: '49651696036',
            concluida_em: new Date('2026-02-11').toISOString(),
            nome: 'Maria Silva',
            cpf: '49651696036',
            matricula: '001',
            funcao: 'Gestor',
            nivel_cargo: 'Senior',
            setor: 'RH',
            empresa_nome: 'Entidade 100',
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          { grupo: 1, valor: 7.5 },
          { grupo: 2, valor: 6.2 },
        ],
      });

    const req = {
      url: 'http://localhost:3000/api/entidade/relatorio-individual-pdf?lote_id=1007&cpf=49651696036',
    } as NextRequest;

    const response = await GET(req);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
    expect(response.headers.get('Content-Disposition')).toContain(
      'relatorio-individual'
    );
  });
});
