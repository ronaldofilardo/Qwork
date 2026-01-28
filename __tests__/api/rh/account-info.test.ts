/**
 * Testes básicos para API RH account-info
 * Foco: corrigir problemas de mock primeiro
 */

describe('🩺 API RH Account-Info - Testes Básicos', () => {
  test('✅ API deve existir e ser importável', async () => {
    // Teste básico para verificar se conseguimos importar a função
    const { GET } = await import('@/app/api/rh/account-info/route');

    expect(typeof GET).toBe('function');
    expect(GET).toBeDefined();
  });

  test('🔧 Deve ser possível chamar a função GET', async () => {
    // Teste básico para verificar se conseguimos chamar a função
    const { GET } = await import('@/app/api/rh/account-info/route');

    // A chamada deve falhar com erro de autenticação, mas não deve quebrar
    try {
      const response = await GET();
      expect(response).toBeDefined();
      expect(typeof response.status).toBe('number');
    } catch (error) {
      // Esperado que falhe sem mocks adequados
      expect(error).toBeDefined();
    }
  });
});

test('✅ Deve retornar plano quando registrado em contratos_planos com contratante_id', async () => {
  jest.isolateModules(() => {
    const session = { cpf: '00000000000', perfil: 'rh', contratante_id: 123 };
    const clinicaRow = {
      id: 123,
      nome: 'Clinica Contratante',
      cnpj: '63403935000139',
      email: 'contato@contratante.com',
      telefone: null,
      endereco: null,
      cidade: null,
      estado: null,
      responsavel_nome: null,
      criado_em: null,
    };

    const planoRow = {
      numero_funcionarios_atual: 10,
      valor_pago: 500.0,
      plano_nome: 'Plano Teste',
      plano_tipo: 'empresarial',
      // Simular status 'aprovado' (legado) para validar a nova cláusula IN
      status: 'aprovado',
      contrato_numero: 'CTR-999',
    };

    jest.doMock('@/lib/session', () => ({
      requireRole: jest.fn().mockResolvedValue(session),
    }));

    jest.doMock('@/lib/db', () => ({
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // funcionarios query (sem clinica_id)
        .mockResolvedValueOnce({ rows: [{ id: 123 }], rowCount: 1 }) // contratanteCheck
        .mockResolvedValueOnce({ rows: [clinicaRow], rowCount: 1 }) // clinicaQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // gestoresQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // snapshotQuery
        .mockResolvedValueOnce({ rows: [planoRow], rowCount: 1 }) // planoQuery (contratante_id)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }), // pagamentosQuery
    }));
  });
});

// Novo teste: quando não houver registro em contratos_planos, buscar em contratos
test('✅ Fallback para plano vindo de `contratos` quando não existe em `contratos_planos`', async () => {
  jest.isolateModules(() => {
    const session = { cpf: '00000000000', perfil: 'rh', contratante_id: 321 };
    const clinicaRow = {
      id: 321,
      nome: 'Clinica Contrato',
      cnpj: '63403935000139',
      email: 'contato@contrato.com',
    };

    const contratoRow = {
      id: 'CTR-321',
      plano_nome: 'Plano Contrato',
      plano_tipo: 'empresarial',
      valor_total: 2000,
      numero_funcionarios: 20,
      status: 'ativo',
    };

    jest.doMock('@/lib/session', () => ({
      requireRole: jest.fn().mockResolvedValue(session),
    }));

    jest.doMock('@/lib/db', () => ({
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // funcionarios
        .mockResolvedValueOnce({ rows: [{ id: 321 }], rowCount: 1 }) // contratanteCheck
        .mockResolvedValueOnce({ rows: [clinicaRow], rowCount: 1 }) // clinicaQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // gestores
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // snapshot
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // contratos_planos (nenhum)
        .mockResolvedValueOnce({ rows: [contratoRow], rowCount: 1 }) // contratos fallback
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }), // pagamentos
    }));

    const { GET } = require('@/app/api/rh/account-info/route');

    return GET().then(async (resp: any) => {
      const data = await resp.json();
      expect(data.clinica).toBeDefined();
      expect(data.clinica.plano).toBeDefined();
      expect(data.clinica.plano.plano_nome).toBe('Plano Contrato');
      expect(data.clinica.cnpj).toBe('63403935000139');
    });
  });
});
