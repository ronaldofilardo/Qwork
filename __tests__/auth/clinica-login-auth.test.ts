import { NextRequest } from 'next/server';
import { POST as loginHandler } from '@/app/api/auth/login/route';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

// Mock do banco de dados
jest.mock('@/lib/db', () => ({
  query: jest.fn(),
  getDatabaseInfo: jest.fn(() => 'test-db'),
}));

// Mock do bcrypt
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

// Mock da sessão
jest.mock('@/lib/session', () => ({
  createSession: jest.fn(),
  getSession: jest.fn(),
}));

// Mock da auditoria
jest.mock('@/lib/auditoria/auditoria', () => ({
  registrarAuditoria: jest.fn(),
  extrairContextoRequisicao: jest.fn(() => ({
    ipAddress: '127.0.0.1',
    userAgent: 'test',
  })),
}));

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockBcryptCompare = bcrypt.compare as jest.MockedFunction<
  typeof bcrypt.compare
>;
const mockCreateSession = require('@/lib/session').createSession;

describe('Autenticação de Clínica - Perfil RH (Nova Arquitetura)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Login de RH de Clínica', () => {
    it('deve autenticar RH de clínica com sucesso', async () => {
      const clinicaId = 1;
      const rhCpf = '12345678901';
      const senha = 'senha123';

      mockQuery.mockImplementation((sql: string) => {
        // Query para tabela usuarios
        if (sql.includes('FROM usuarios') && sql.includes('WHERE cpf =')) {
          return Promise.resolve({
            rows: [
              {
                cpf: rhCpf,
                nome: 'Dr. João Silva',
                tipo_usuario: 'rh',
                clinica_id: clinicaId,
                entidade_id: null,
                ativo: true,
              },
            ],
            rowCount: 1,
          });
        }
        // Query para clinicas_senhas
        if (sql.includes('FROM clinicas_senhas')) {
          return Promise.resolve({
            rows: [
              {
                senha_hash: 'hashed_password',
                entidade_id: 1,
                ativa: true,
                pagamento_confirmado: true,
              },
            ],
            rowCount: 1,
          });
        }
        // Audit log
        if (sql.includes('INSERT INTO audit_logs')) {
          return Promise.resolve({ rows: [], rowCount: 1 });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });

      // Mock da comparação de senha
      mockBcryptCompare.mockResolvedValueOnce(true);

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ cpf: rhCpf, senha }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await loginHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.perfil).toBe('rh');
      expect(data.redirectTo).toBe('/rh');

      // Verificar se a sessão foi criada com clinica_id
      expect(mockCreateSession).toHaveBeenCalledWith({
        cpf: rhCpf,
        nome: 'Dr. João Silva',
        perfil: 'rh',
        contratante_id: 1,
        clinica_id: clinicaId,
        entidade_id: null,
      });
    });

    it('deve rejeitar login de usuário inativo', async () => {
      const rhCpf = '12345678901';
      const senha = 'senha123';

      mockQuery.mockImplementation((sql: string) => {
        // Query para tabela usuarios - usuário inativo
        if (sql.includes('FROM usuarios') && sql.includes('WHERE cpf =')) {
          return Promise.resolve({
            rows: [
              {
                cpf: rhCpf,
                nome: 'Dr. João Silva',
                tipo_usuario: 'rh',
                clinica_id: 1,
                entidade_id: null,
                ativo: false, // Usuário inativo
              },
            ],
            rowCount: 1,
          });
        }
        // Audit log
        if (sql.includes('INSERT INTO audit_logs')) {
          return Promise.resolve({ rows: [], rowCount: 1 });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ cpf: rhCpf, senha }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await loginHandler(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Usuário inativo');
      expect(mockCreateSession).not.toHaveBeenCalled();
    });

    it('deve rejeitar senha incorreta para RH de clínica', async () => {
      const rhCpf = '12345678901';
      const senha = 'senhaErrada';

      mockQuery.mockImplementation((sql: string) => {
        // Query para tabela usuarios
        if (sql.includes('FROM usuarios') && sql.includes('WHERE cpf =')) {
          return Promise.resolve({
            rows: [
              {
                cpf: rhCpf,
                nome: 'Dr. João Silva',
                tipo_usuario: 'rh',
                clinica_id: 1,
                entidade_id: null,
                ativo: true,
              },
            ],
            rowCount: 1,
          });
        }
        // Query para clinicas_senhas
        if (sql.includes('FROM clinicas_senhas')) {
          return Promise.resolve({
            rows: [
              {
                senha_hash: 'hashed_password',
                entidade_id: 1,
                ativa: true,
                pagamento_confirmado: true,
              },
            ],
            rowCount: 1,
          });
        }
        // Audit log
        if (sql.includes('INSERT INTO audit_logs')) {
          return Promise.resolve({ rows: [], rowCount: 1 });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });

      // Mock da comparação de senha - retorna false
      mockBcryptCompare.mockResolvedValueOnce(false);

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ cpf: rhCpf, senha }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await loginHandler(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('CPF ou senha inválidos');
      expect(mockCreateSession).not.toHaveBeenCalled();
    });

    it('deve rejeitar login se entidade estiver inativa', async () => {
      const rhCpf = '12345678901';
      const senha = 'senha123';

      mockQuery.mockImplementation((sql: string) => {
        // Query para tabela usuarios
        if (sql.includes('FROM usuarios') && sql.includes('WHERE cpf =')) {
          return Promise.resolve({
            rows: [
              {
                cpf: rhCpf,
                nome: 'Dr. João Silva',
                tipo_usuario: 'rh',
                clinica_id: 1,
                entidade_id: null,
                ativo: true,
              },
            ],
            rowCount: 1,
          });
        }
        // Query para clinicas_senhas - entidade inativa
        if (sql.includes('FROM clinicas_senhas')) {
          return Promise.resolve({
            rows: [
              {
                senha_hash: 'hashed_password',
                entidade_id: 1,
                ativa: false, // Entidade inativa
                pagamento_confirmado: true,
              },
            ],
            rowCount: 1,
          });
        }
        // Audit log
        if (sql.includes('INSERT INTO audit_logs')) {
          return Promise.resolve({ rows: [], rowCount: 1 });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ cpf: rhCpf, senha }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await loginHandler(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe(
        'Contratante inativo. Entre em contato com o administrador.'
      );
      expect(mockCreateSession).not.toHaveBeenCalled();
    });

    it('deve rejeitar login se pagamento não estiver confirmado', async () => {
      const rhCpf = '12345678901';
      const senha = 'senha123';

      mockQuery.mockImplementation((sql: string) => {
        // Query para tabela usuarios
        if (sql.includes('FROM usuarios') && sql.includes('WHERE cpf =')) {
          return Promise.resolve({
            rows: [
              {
                cpf: rhCpf,
                nome: 'Dr. João Silva',
                tipo_usuario: 'rh',
                clinica_id: 1,
                entidade_id: null,
                ativo: true,
              },
            ],
            rowCount: 1,
          });
        }
        // Query para clinicas_senhas - pagamento não confirmado
        if (sql.includes('FROM clinicas_senhas')) {
          return Promise.resolve({
            rows: [
              {
                senha_hash: 'hashed_password',
                entidade_id: 1,
                ativa: true,
                pagamento_confirmado: false, // Pagamento não confirmado
              },
            ],
            rowCount: 1,
          });
        }
        // Audit log
        if (sql.includes('INSERT INTO audit_logs')) {
          return Promise.resolve({ rows: [], rowCount: 1 });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ cpf: rhCpf, senha }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await loginHandler(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Aguardando confirmação de pagamento');
      expect(mockCreateSession).not.toHaveBeenCalled();
    });
  });
});
