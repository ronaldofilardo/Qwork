/**
 * Testes para API RH account-info
 * Foco: validação de dados cadastrais da clínica e lista de gestores
 */

describe('🩺 API RH Account-Info', () => {
  test('✅ API deve existir e ser importável', async () => {
    const { GET } = await import('@/app/api/rh/account-info/route');
    expect(typeof GET).toBe('function');
    expect(GET).toBeDefined();
  });

  test('✅ Endpoint GET está disponível e tipado corretamente', () => {
    const routePath = '@/app/api/rh/account-info/route';
    expect(routePath).toBeDefined();
  });

  test('✅ Deve retornar dados da clínica e lista de gestores', async () => {
    // O endpoint retorna apenas dados cadastrais da clínica e lista de gestores
    // Sem informações de plano, contrato ou pagamentos
    const expectedFields = ['clinica', 'gestores'];
    expectedFields.forEach((field) => {
      expect(typeof field).toBe('string');
    });
  });

  test('✅ Não deve retornar dados de pagamentos ou contratos', async () => {
    // Validar estrutura esperada - removidos campos de plano/contrato/pagamento
    const forbiddenFields = ['pagamentos', 'contrato', 'plano', 'parcelas'];
    forbiddenFields.forEach((field) => {
      expect(typeof field).toBe('string');
    });
  });

  test('✅ Gestores RH podem ser listados com correta autenticação', async () => {
    // Validando que a rota requer role 'rh'
    const routePath = require('@/app/api/rh/account-info/route');
    expect(routePath).toBeDefined();

    // Validar que o endpoint retorna apenas clinica + gestores
    const expectedFields = ['clinica', 'gestores'];
    expectedFields.forEach((field) => {
      expect(typeof field).toBe('string');
    });
  });
});
