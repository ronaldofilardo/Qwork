import { NextRequest } from 'next/server';

jest.mock('@/lib/db');
const { query } = require('@/lib/db');
const mockQuery = query;

jest.mock('@/lib/session', () => ({
  ...jest.requireActual('@/lib/session'),
  getSession: jest.fn(),
}));
const sessionMod = require('@/lib/session');

describe('POST /api/rh/funcionarios - mapear clinica via contratante', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve criar funcionário quando RH tem clinica mapeada via contratante', async () => {
    sessionMod.getSession.mockReturnValue({
      cpf: '28785010049',
      nome: 'iepqiepoip poiopipoi',
      perfil: 'rh',
      clinica_id: 56,
      contratante_id: 56,
    });

    // Sequência de queries esperadas:
    // 1) verificar duplicata CPF -> retorna rows: []
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    // 2) requireRHWithEmpresaAccess -> SELECT clinica_id FROM empresas_clientes WHERE id = $1
    mockQuery.mockResolvedValueOnce({
      rows: [{ clinica_id: 20 }],
      rowCount: 1,
    });
    // 3) requireRHWithEmpresaAccess fallback -> SELECT id, ativa FROM clinicas WHERE contratante_id = $1
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 20, ativa: true }],
      rowCount: 1,
    });

    // 4) INSERT funcionarios -> rowCount 1
    mockQuery.mockResolvedValueOnce({ rowCount: 1 });

    // Prepare request
    const { POST } = await import('@/app/api/rh/funcionarios/route');

    const request = new NextRequest('http://localhost/api/rh/funcionarios', {
      method: 'POST',
      body: JSON.stringify({
        cpf: '12345678909',
        nome: 'Teste Func',
        data_nascimento: '1990-01-01',
        setor: 'TI',
        funcao: 'Dev',
        email: 'teste@ex.com',
        empresa_id: 8,
      }),
    });

    const response = await POST(request);
    const data = await response.json();
    console.log(
      '[TEST DEBUG] response status:',
      response.status,
      'body:',
      data
    );

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockQuery).toHaveBeenCalled();
  });
});
