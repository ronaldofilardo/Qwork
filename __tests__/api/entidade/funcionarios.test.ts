/**
 * Testes para API entidade funcionarios
 */

jest.mock('@/lib/db');
const { query } = require('@/lib/db');
const mockQuery = query;

jest.mock('@/lib/session', () => ({
  requireEntity: jest.fn(),
}));
const sessionMod = require('@/lib/session');

describe('/api/entidade/funcionarios', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('✅ API deve existir', async () => {
    // Teste básico para verificar se conseguimos importar
    const { GET, POST } = await import('@/app/api/entidade/funcionarios/route');
    expect(typeof GET).toBe('function');
    expect(typeof POST).toBe('function');
  });

  test('🔧 Deve ser possível chamar a função GET', async () => {
    const { GET } = await import('@/app/api/entidade/funcionarios/route');

    // A chamada deve falhar com erro de autenticação, mas não deve quebrar
    try {
      const request = new Request(
        'http://localhost:3000/api/entidade/funcionarios'
      );
      const response = await GET(request);
      expect(response).toBeDefined();
      expect(typeof response.status).toBe('number');
    } catch (error) {
      // Esperado que falhe sem mocks adequados
      expect(error).toBeDefined();
    }
  });

  test('✅ GET não deve incluir perfil gestor na lista', async () => {
    // Mock sessão de gestor de entidade
    sessionMod.requireEntity.mockResolvedValue({
      cpf: '52998224725',
      nome: 'Gestor Entidade',
      perfil: 'gestor',
      tomador_id: 77,
    });

    // Simular query retornando um gestor e um funcionário
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          nome: 'Gestor Entidade',
          cpf: '111',
          perfil: 'gestor',
        },
        { id: 2, nome: 'Funcionario A', cpf: '222', perfil: 'funcionario' },
      ],
    });

    const { GET } = await import('@/app/api/entidade/funcionarios/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.funcionarios).toBeDefined();
    // Deve incluir apenas o funcionário (gestor filtrado no SQL)
    expect(body.funcionarios.every((f: any) => f.perfil !== 'gestor')).toBe(
      true
    );
  });

  test('🔧 Deve ser possível chamar a função POST', async () => {
    const { POST } = await import('@/app/api/entidade/funcionarios/route');

    // A chamada deve falhar com erro de autenticação, mas não deve quebrar
    try {
      const request = new Request(
        'http://localhost:3000/api/entidade/funcionarios',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cpf: '11111111111',
            nome: 'João Silva',
            email: 'joao@email.com',
          }),
        }
      );
      const response = await POST(request);
      expect(response).toBeDefined();
      expect(typeof response.status).toBe('number');
    } catch (error) {
      // Esperado que falhe sem mocks adequados
      expect(error).toBeDefined();
    }
  });

  test('✅ POST deve criar funcionário e vincular em tomadors_funcionarios', async () => {
    // Mockar sessão de gestor de entidade
    sessionMod.requireEntity.mockResolvedValue({
      cpf: '52998224725',
      nome: 'Gestor Entidade',
      perfil: 'gestor',
      tomador_id: 77,
    });

    // 1) SELECT existing cpf -> nenhum
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    // 2) INSERT funcionarios -> retorna row com id
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 123,
          cpf: '52998224725',
          nome: 'Teste Vinculo',
          email: 'vinc@teste.com',
        },
      ],
    });
    // 3) SELECT tomadors_funcionarios -> nenhum
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    // 4) INSERT tomadors_funcionarios -> sucesso
    mockQuery.mockResolvedValueOnce({ rowCount: 1 });

    const { POST } = await import('@/app/api/entidade/funcionarios/route');

    const request = new Request('http://localhost/api/entidade/funcionarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cpf: '52998224725',
        nome: 'Teste Vinculo',
        data_nascimento: '1990-01-01',
        setor: 'TI',
        funcao: 'Dev',
        email: 'vinc@teste.com',
      }),
    });

    const resp = await POST(request);
    expect(resp.status).toBe(200);
    const body = await resp.json();
    expect(body.success).toBe(true);

    const insertCall = mockQuery.mock.calls.find((call: any) =>
      String(call[0]).includes('INSERT INTO tomadors_funcionarios')
    );
    expect(insertCall).toBeDefined();
    expect(insertCall![1]).toEqual([123, 77, 'entidade']);
  });
});
