import { NextRequest } from 'next/server';

const mockQuery = jest.fn();
const mockRequireRH = jest.fn();

jest.mock('@/lib/db', () => ({
  query: mockQuery,
}));

jest.mock('@/lib/session', () => ({
  requireRHWithEmpresaAccess: mockRequireRH,
}));

describe('/api/rh/funcionarios - POST (Criar Funcionário)', () => {
  let POST: (request: NextRequest) => Promise<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  beforeAll(async () => {
    const mod = await import('@/app/api/rh/funcionarios/route');
    POST = mod.POST;
  });

  it('deve retornar 403 quando quem tenta criar não é RH', async () => {
    // Fazer com que requireRHWithEmpresaAccess lance um erro simulando falta de permissão
    mockRequireRH.mockImplementation(() => {
      throw new Error(
        'Sem permissão: Apenas gestores RH ou administradores podem acessar empresas'
      );
    });

    const body = {
      cpf: '52998224725',
      nome: 'Funcionario Teste',
      data_nascimento: '1974-10-24',
      setor: 'TI',
      funcao: 'Dev',
      email: 'teste@empresa.com',
      empresa_id: 1,
    };

    const request = new NextRequest(
      'http://localhost:3000/api/rh/funcionarios',
      {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain('gestores RH');
  });
});
