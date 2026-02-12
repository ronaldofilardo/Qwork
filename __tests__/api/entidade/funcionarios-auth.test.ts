import { NextRequest } from 'next/server';

const mockQuery = jest.fn();
const mockRequireEntity = jest.fn();

jest.mock('@/lib/db', () => ({
  query: mockQuery,
}));

jest.mock('@/lib/session', () => ({
  requireEntity: mockRequireEntity,
}));

describe('/api/entidade/funcionarios - acesso por perfil', () => {
  let GET: () => Promise<Response>;
  let POST: (request: NextRequest) => Promise<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  beforeAll(async () => {
    const mod = await import('@/app/api/entidade/funcionarios/route');
    GET = mod.GET;
    POST = mod.POST;
  });

  it('GET deve retornar 403 quando não for gestor de entidade', async () => {
    mockRequireEntity.mockImplementation(() => {
      throw new Error('Acesso restrito a gestores de entidade');
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Acesso restrito a gestores de entidade');
  });

  it('POST deve retornar 403 quando não for gestor de entidade', async () => {
    mockRequireEntity.mockImplementation(() => {
      throw new Error('Acesso restrito a gestores de entidade');
    });

    const request = new NextRequest(
      'http://localhost:3000/api/entidade/funcionarios',
      {
        method: 'POST',
        body: JSON.stringify({
          cpf: '11111111111',
          nome: 'João',
          data_nascimento: '1990-01-01',
          setor: 'RH',
          funcao: 'Assistente',
          email: 'a@b.com',
        }),
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Acesso restrito a gestores de entidade');
  });

  it('POST deve criar funcionário quando autorizado e dados válidos', async () => {
    mockRequireEntity.mockResolvedValue({
      entidade_id: 5,
      cpf: '66840536033',
      perfil: 'gestor',
    });

    // Mock de validateGestorContext e set_config que são chamados internamente
    // Primeiro select retorna 0 resultados (cpf não existe)
    // Segundo select é da validateGestorContext
    // Terceiro é resultado do insert de funcionário
    // Quarto é do insert de funcionarios_entidades
    mockQuery
      .mockResolvedValueOnce({ rows: [] }) // Check if funcionário exists
      .mockResolvedValueOnce({
        // validateGestorContext
        rows: [{ cpf: '66840536033', entidade_id: 5, ativa: true }],
      })
      .mockResolvedValueOnce({
        // set_config app.current_user_cpf
        rows: [],
      })
      .mockResolvedValueOnce({
        // set_config app.current_user_perfil
        rows: [],
      })
      .mockResolvedValueOnce({
        // INSERT funcionario
        rows: [
          {
            id: 123,
            cpf: '11111111111',
            nome: 'João',
            email: 'a@b.com',
            setor: 'RH',
            funcao: 'Assistente',
            data_nascimento: '1990-01-01',
          },
        ],
      })
      .mockResolvedValueOnce({
        // INSERT funcionarios_entidades
        rows: [],
      });

    const request = new NextRequest(
      'http://localhost:3000/api/entidade/funcionarios',
      {
        method: 'POST',
        body: JSON.stringify({
          cpf: '71188557076',
          nome: 'João',
          data_nascimento: '1990-01-01',
          setor: 'RH',
          funcao: 'Assistente',
          email: 'a@b.com',
        }),
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // Verify the INSERT funcionarios call (índice 4)
    const insertCallArgs = mockQuery.mock.calls[4];
    expect(insertCallArgs[0]).toMatch(/INSERT INTO funcionarios/);
    expect(insertCallArgs[1][0]).toBe('71188557076');
  });
});
