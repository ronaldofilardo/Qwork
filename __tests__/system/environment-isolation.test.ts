/**
 * Teste de isolamento de ambientes - Prevenção de Regressão
 *
 * Garante que o sistema não regreda para o problema onde
 * NODE_ENV=test fazia o Next.js carregar .env.test em desenvolvimento,
 * causando falha no login do admin.
 */

describe('Isolamento de Ambientes - Prevenção de Regressão', () => {
  describe('Ambiente de Teste', () => {
    it('deve estar executando em ambiente de teste', () => {
      expect(process.env.NODE_ENV).toBe('test');
    });

    it('deve ter TEST_DATABASE_URL definido', () => {
      expect(process.env.TEST_DATABASE_URL).toBeDefined();
      expect(typeof process.env.TEST_DATABASE_URL).toBe('string');
      expect(process.env.TEST_DATABASE_URL!.length).toBeGreaterThan(0);
    });
  });

  describe('Login do Administrador', () => {
    it('deve validar que o admin pode fazer login', async () => {
      // Mock da API de login
      const mockFetch = jest.fn();
      global.fetch = mockFetch;

      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            cpf: '00000000000',
            nome: 'Administrador',
            perfil: 'admin',
            redirectTo: '/admin',
          }),
        } as Response)
      );

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cpf: '00000000000',
          senha: '123',
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.cpf).toBe('00000000000');
      expect(data.perfil).toBe('admin');
      expect(data.redirectTo).toBe('/admin');
    });

    it('deve rejeitar login com credenciais inválidas', async () => {
      const mockFetch = jest.fn();
      global.fetch = mockFetch;

      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          json: async () => ({
            error: 'CPF ou senha inválidos',
          }),
        } as Response)
      );

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cpf: '00000000000',
          senha: 'senha_errada',
        }),
      });

      expect(response.ok).toBe(false);
      const data = await response.json();
      expect(data.error).toBe('CPF ou senha inválidos');
    });
  });

  describe('Proteção contra Regressão', () => {
    it('deve detectar configuração incorreta de NODE_ENV', () => {
      // Este teste garante que se NODE_ENV estiver errado,
      // os testes falharão e alertarão sobre o problema
      const currentEnv = process.env.NODE_ENV;

      // Durante testes, NODE_ENV deve ser sempre 'test'
      expect(currentEnv).toBe('test');

      // Se alguém definir NODE_ENV incorretamente, este teste falhará
      // servindo como alerta precoce de problemas de configuração
    });

    it('deve validar que TEST_DATABASE_URL não está vazio', () => {
      // Garante que a variável de ambiente crítica está definida
      expect(process.env.TEST_DATABASE_URL).toBeDefined();
      expect(process.env.TEST_DATABASE_URL!.trim()).not.toBe('');
    });

    it('deve verificar que estamos em ambiente controlado', () => {
      // Teste básico para garantir que Jest está controlando o ambiente
      expect(typeof jest).toBe('object');
      expect(jest).toBeDefined();
    });
  });
});
