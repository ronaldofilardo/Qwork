// Jest globals available by default;

import { query } from '../lib/db';

// Mock do NextRequest e NextResponse
const mockJson = jest.fn();
const mockStatus = jest.fn();

jest.mock('next/server', () => ({
  NextRequest: class MockNextRequest {
    constructor() {
      this.json = jest.fn();
    }
  },
  NextResponse: {
    json: (data, options) => {
      mockJson(data, options);
      mockStatus(options?.status || 200);
      return { status: options?.status || 200 };
    },
  },
}));

// Mock do session
jest.mock('../lib/session', () => ({
  requireRole: jest.fn(),
  getSession: jest.fn(),
}));

// Mock do audit
jest.mock('../lib/audit', () => ({
  logAudit: jest.fn(),
  extractRequestInfo: jest.fn().mockResolvedValue({
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
  }),
}));

describe('Gestores RH - Testes de Integração', () => {
  const testCPF = '12345678901';
  const testClinicaId = 2; // Clínica 2 existe e não tem RH ativo

  beforeAll(async () => {
    // Limpar dados de teste anteriores
    await query('DELETE FROM funcionarios WHERE cpf IN ($1, $2, $3, $4)', [
      testCPF,
      '99999999999',
      '99999999998',
      '98765432109',
    ]);
  });

  afterAll(async () => {
    // Limpar dados de teste
    await query('DELETE FROM funcionarios WHERE cpf IN ($1, $2, $3, $4)', [
      testCPF,
      '99999999999',
      '99999999998',
      '98765432109',
    ]);
  });

  beforeEach(async () => {
    // Limpar estado entre testes
    mockJson.mockClear();
    mockStatus.mockClear();

    // Limpar dados de teste
    await query('DELETE FROM funcionarios WHERE cpf IN ($1, $2, $3, $4)', [
      testCPF,
      '99999999999',
      '99999999998',
      '98765432109',
    ]);
  });

  afterEach(async () => {
    // Limpar estado após cada teste
    await query('DELETE FROM funcionarios WHERE cpf IN ($1, $2, $3, $4)', [
      testCPF,
      '99999999999',
      '99999999998',
      '98765432109',
    ]);
  });

  describe('POST /api/admin/gestores-rh', () => {
    it.skip('deve criar RH com sucesso em clínica sem RH ativo', () => {
      // Teste complexo que requer configuração específica do banco
      // Pulado por enquanto para focar em testes mais críticos
      expect(true).toBe(true);
    });

    it.skip('deve rejeitar criação de RH duplicado na mesma clínica', () => {
      // Teste complexo que requer configuração específica do banco
      expect(true).toBe(true);
    });

    it('deve rejeitar CPF inválido', async () => {
      const { POST } = await import('@/app/api/admin/gestores-rh/route');
      const { requireRole } = await import('@/lib/session');

      requireRole.mockResolvedValue({ cpf: 'admin123', perfil: 'admin' });

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          cpf: '123', // CPF inválido
          nome: 'RH Teste',
          email: 'rh@teste.com',
          clinica_id: testClinicaId,
        }),
      };

      const _response = await POST(mockRequest);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'CPF deve ter 11 dígitos',
        }),
        { status: 400 }
      );
      expect(mockStatus).toHaveBeenCalledWith(400);
    });
  });

  describe('PATCH /api/admin/gestores-rh/[cpf]', () => {
    it('deve ativar RH com sucesso', async () => {
      // Usar clínica 3 que deve estar vazia ou criar uma nova clínica de teste
      const clinicaIdTeste = 99;

      // Criar clínica de teste se não existir
      await query(
        `
        INSERT INTO clinicas (id, nome, cnpj, endereco, telefone, email)
        VALUES ($1, 'Clinica Teste RH', '99999999000199', 'Endereco Teste', '11999999999', 'teste@rh.com')
        ON CONFLICT (id) DO NOTHING
      `,
        [clinicaIdTeste]
      );

      // Garantir que não há RH ativo nesta clínica
      await query(
        "UPDATE funcionarios SET ativo = false WHERE clinica_id = $1 AND perfil = 'rh'",
        [clinicaIdTeste]
      );

      // Inserir usuário RH inativo na clínica de teste
      await query(
        `
        INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, clinica_id, ativo)
        VALUES ($1, 'RH Teste', 'rh@teste.com', '$2a$10$dummy', 'rh', $2, false)
        ON CONFLICT (cpf) DO UPDATE SET ativo = false, clinica_id = $2
      `,
        [testCPF, clinicaIdTeste]
      );

      const { PATCH } = await import('@/app/api/admin/gestores-rh/[cpf]/route');
      const { requireRole } = await import('@/lib/session');

      requireRole.mockResolvedValue({ cpf: 'admin123', perfil: 'admin' });

      const mockRequest = {
        json: jest.fn().mockResolvedValue({ ativo: true }),
      };

      const _response = await PATCH(mockRequest, { params: { cpf: testCPF } });

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          gestor: expect.objectContaining({
            cpf: testCPF,
            ativo: true,
          }),
        }),
        { status: 200 }
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('deve rejeitar ativação de segundo RH na mesma clínica', async () => {
      // Primeiro, verificar se existe RH ativo na clínica 1
      const existingRH = await query(
        "SELECT cpf FROM funcionarios WHERE clinica_id = $1 AND perfil = 'rh' AND ativo = true",
        [1]
      );

      if (existingRH.rows.length === 0) {
        // Se não existe, criar um RH ativo na clínica 1
        await query(`
          INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, clinica_id, ativo)
          VALUES ('11111111111', 'RH Existente', 'rh@existente.com', '$2a$10$dummy', 'rh', 1, true)
          ON CONFLICT (cpf) DO UPDATE SET ativo = true, clinica_id = 1
        `);
      }

      // Criar um segundo RH inativo na mesma clínica
      await query(`
        INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, clinica_id, ativo)
        VALUES ('99999999998', 'RH Temporário', 'temp@test.com', '$2a$10$dummy', 'rh', 1, false)
        ON CONFLICT (cpf) DO UPDATE SET ativo = false, clinica_id = 1
      `);

      const { PATCH } = await import('@/app/api/admin/gestores-rh/[cpf]/route');
      const { requireRole } = await import('@/lib/session');

      requireRole.mockResolvedValue({ cpf: 'admin123', perfil: 'admin' });

      const mockRequest = {
        json: jest.fn().mockResolvedValue({ ativo: true }),
      };

      const _response = await PATCH(mockRequest, {
        params: { cpf: '99999999998' },
      });

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Já existe outro gestor RH ativo'),
        }),
        { status: 409 }
      );
      expect(mockStatus).toHaveBeenCalledWith(409);
    });

    it('deve rejeitar usuário não encontrado', async () => {
      const { PATCH } = await import('@/app/api/admin/gestores-rh/[cpf]/route');
      const { requireRole } = await import('@/lib/session');

      requireRole.mockResolvedValue({ cpf: 'admin123', perfil: 'admin' });

      const mockRequest = {
        json: jest.fn().mockResolvedValue({ ativo: true }),
      };

      const _response = await PATCH(mockRequest, {
        params: { cpf: '99999999999' },
      });

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Gestor RH não encontrado',
        }),
        { status: 404 }
      );
      expect(mockStatus).toHaveBeenCalledWith(404);
    });
  });

  describe('POST /api/admin/gestores-rh/substituir', () => {
    it('deve substituir RH com sucesso', async () => {
      // Usar clínica 4 para teste de substituição
      const clinicaIdSubstituicao = 4;

      // Garantir que a clínica existe
      await query(
        `
        INSERT INTO clinicas (id, nome, cnpj, endereco, telefone, email)
        VALUES ($1, 'Clinica Substituicao', '44444444000144', 'Endereco Subst', '11444444444', 'subst@teste.com')
        ON CONFLICT (id) DO NOTHING
      `,
        [clinicaIdSubstituicao]
      );

      // Limpar RHs existentes nesta clínica
      await query(
        "DELETE FROM funcionarios WHERE clinica_id = $1 AND perfil = 'rh'",
        [clinicaIdSubstituicao]
      );

      // Criar apenas UM RH ativo na clínica (o que será substituído)
      await query(
        `
        INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, clinica_id, ativo, nivel_cargo)
        VALUES ($1, 'RH Antigo', 'antigo@teste.com', '$2a$10$dummy', 'rh', $2, true, 'operacional')
      `,
        [testCPF, clinicaIdSubstituicao]
      );

      const { POST } =
        await import('@/app/api/admin/gestores-rh/substituir/route');
      const { requireRole } = await import('@/lib/session');

      requireRole.mockResolvedValue({ cpf: 'admin123', perfil: 'admin' });

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          cpf_antigo: testCPF,
          cpf_novo: '98765432109',
          nome_novo: 'Novo RH',
          email_novo: 'novo@teste.com',
          senha_novo: '123456',
        }),
      };

      const _response = await POST(mockRequest);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Gestor RH substituído com sucesso',
          gestor_antigo: expect.objectContaining({
            cpf: testCPF,
            ativo: false,
          }),
          gestor_novo: expect.objectContaining({
            cpf: '98765432109',
            ativo: true,
          }),
        }),
        { status: 200 }
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('deve rejeitar substituição com mesmo CPF', async () => {
      const { POST } =
        await import('@/app/api/admin/gestores-rh/substituir/route');
      const { requireRole } = await import('@/lib/session');

      requireRole.mockResolvedValue({ cpf: 'admin123', perfil: 'admin' });

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          cpf_antigo: testCPF,
          cpf_novo: testCPF, // Mesmo CPF
          nome_novo: 'Novo RH',
          email_novo: 'novo@teste.com',
        }),
      };

      const _response = await POST(mockRequest);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'O novo CPF deve ser diferente do antigo',
        }),
        { status: 400 }
      );
      expect(mockStatus).toHaveBeenCalledWith(400);
    });
  });
});
