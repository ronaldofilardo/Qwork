/**
 * @file __tests__/api/auth/login.test.ts
 * Testes: /api/auth/login - Nova Arquitetura
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/login/route';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { createSession } from '@/lib/session';

// Mock das dependências
jest.mock('@/lib/db');
jest.mock('bcryptjs');
jest.mock('@/lib/session');
jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn(() => jest.fn(() => null)), // Desabilita rate limit para testes
  rateLimitAsync: jest.fn().mockResolvedValue(null), // Desabilita rate limit async para testes
  RATE_LIMIT_CONFIGS: { auth: {} },
}));

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockCompare = bcrypt.compare as jest.MockedFunction<
  typeof bcrypt.compare
>;
const mockCreateSession = createSession as jest.MockedFunction<
  typeof createSession
>;

describe('/api/auth/login - Nova Arquitetura', () => {
  let mockRequest: Partial<NextRequest>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock da request
    mockRequest = {
      json: jest.fn(),
      headers: {
        get: jest.fn((name: string) => {
          if (name === 'x-forwarded-for') return '127.0.0.1';
          if (name === 'x-real-ip') return null;
          if (name === 'user-agent') return 'test-agent';
          return null;
        }),
      } as any,
    };

    mockQuery.mockReset();
    mockCompare.mockReset();
    mockCreateSession.mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar erro 400 se CPF não for fornecido', async () => {
    (mockRequest.json as jest.Mock).mockResolvedValue({ senha: '123' });

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('CPF é obrigatório');
  });

  it('deve retornar erro 400 se senha não for fornecida', async () => {
    (mockRequest.json as jest.Mock).mockResolvedValue({ cpf: '12345678901' });

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Senha ou data de nascimento é obrigatória');
  });

  it('deve retornar erro 401 se usuário não existir em usuarios', async () => {
    (mockRequest.json as jest.Mock).mockResolvedValue({
      cpf: '99999999999',
      senha: '123',
    });

    // Mock: usuário não encontrado na tabela usuarios
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('CPF ou senha inválidos');
  });

  it('deve retornar erro 403 se usuário gestor estiver inativo', async () => {
    (mockRequest.json as jest.Mock).mockResolvedValue({
      cpf: '11111111111',
      senha: '123',
    });

    // Mock: usuário inativo na tabela usuarios
    mockQuery.mockImplementation((sql: string) => {
      if (sql.includes('usuarios') && sql.includes('WHERE cpf =')) {
        return Promise.resolve({
          rows: [
            {
              cpf: '11111111111',
              nome: 'Gestor Inativo',
              tipo_usuario: 'gestor',
              clinica_id: null,
              entidade_id: 1,
              ativo: false,
            },
          ],
          rowCount: 1,
        });
      }
      if (sql.includes('INSERT INTO audit_logs')) {
        return Promise.resolve({ rows: [], rowCount: 1 });
      }
      return Promise.resolve({ rows: [], rowCount: 0 });
    });

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe(
      'Usuário inativo. Entre em contato com o administrador.'
    );
  });

  it('deve fazer login com sucesso para gestor com senha válida', async () => {
    (mockRequest.json as jest.Mock).mockResolvedValue({
      cpf: '12345678901',
      senha: '123456',
    });

    mockQuery.mockImplementation((sql: string) => {
      // Query na tabela usuarios
      if (sql.includes('usuarios') && sql.includes('WHERE cpf =')) {
        return Promise.resolve({
          rows: [
            {
              cpf: '12345678901',
              nome: 'Maria Santos',
              tipo_usuario: 'gestor',
              clinica_id: null,
              entidade_id: 1,
              ativo: true,
            },
          ],
          rowCount: 1,
        });
      }
      // Query na tabela entidades_senhas
      if (sql.includes('entidades_senhas')) {
        return Promise.resolve({
          rows: [
            {
              senha_hash: '$2a$10$ValidHash',
              id: 1,
              ativa: true,
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

    mockCompare.mockResolvedValue(true);
    mockCreateSession.mockResolvedValue();

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.cpf).toBe('12345678901');
    expect(data.nome).toBe('Maria Santos');
    expect(data.perfil).toBe('gestor');
    expect(data.redirectTo).toBe('/entidade');

    expect(mockCreateSession).toHaveBeenCalledWith({
      cpf: '12345678901',
      nome: 'Maria Santos',
      perfil: 'gestor',
      tomador_id: 1,
      clinica_id: null,
      entidade_id: 1,
    });
  });

  it('deve fazer login com sucesso para RH com senha válida', async () => {
    (mockRequest.json as jest.Mock).mockResolvedValue({
      cpf: '22222222222',
      senha: 'rh123',
    });

    mockQuery.mockImplementation((sql: string) => {
      // Query na tabela usuarios
      if (sql.includes('usuarios') && sql.includes('WHERE cpf =')) {
        return Promise.resolve({
          rows: [
            {
              cpf: '22222222222',
              nome: 'João Silva',
              tipo_usuario: 'rh',
              clinica_id: 1,
              entidade_id: null,
              ativo: true,
            },
          ],
          rowCount: 1,
        });
      }
      // Query na tabela clinicas_senhas
      if (sql.includes('clinicas_senhas')) {
        return Promise.resolve({
          rows: [
            {
              senha_hash: '$2a$10$ValidHash',
              clinica_id: 2,
              ativa: true,
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

    mockCompare.mockResolvedValue(true);
    mockCreateSession.mockResolvedValue();

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.cpf).toBe('22222222222');
    expect(data.nome).toBe('João Silva');
    expect(data.perfil).toBe('rh');
    expect(data.redirectTo).toBe('/rh');

    expect(mockCreateSession).toHaveBeenCalledWith({
      cpf: '22222222222',
      nome: 'João Silva',
      perfil: 'rh',
      tomador_id: 2,
      clinica_id: 1,
      entidade_id: null,
    });
  });

  it('deve fazer login para admin com senha válida', async () => {
    (mockRequest.json as jest.Mock).mockResolvedValue({
      cpf: '00000000000',
      senha: '5978rdF*',
    });

    mockQuery.mockImplementation((sql: string) => {
      // Query na tabela usuarios
      if (sql.includes('usuarios') && sql.includes('WHERE cpf =')) {
        return Promise.resolve({
          rows: [
            {
              cpf: '00000000000',
              nome: 'Administrador',
              tipo_usuario: 'admin',
              clinica_id: null,
              entidade_id: null,
              ativo: true,
              senha_hash: '$2a$10$ValidAdminHash',
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

    mockCompare.mockResolvedValue(true);
    mockCreateSession.mockResolvedValue();

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.cpf).toBe('00000000000');
    expect(data.nome).toBe('Administrador');
    expect(data.perfil).toBe('admin');
    expect(data.redirectTo).toBe('/admin');
  });

  it('deve retornar erro 401 se admin usar senha inválida', async () => {
    (mockRequest.json as jest.Mock).mockResolvedValue({
      cpf: '00000000000',
      senha: 'senhaErrada',
    });

    mockQuery.mockImplementation((sql: string) => {
      if (sql.includes('usuarios') && sql.includes('WHERE cpf =')) {
        return Promise.resolve({
          rows: [
            {
              cpf: '00000000000',
              nome: 'Administrador',
              tipo_usuario: 'admin',
              clinica_id: null,
              entidade_id: null,
              ativo: true,
              senha_hash: '$2a$10$ValidAdminHash',
            },
          ],
          rowCount: 1,
        });
      }
      if (sql.includes('INSERT INTO audit_logs')) {
        return Promise.resolve({ rows: [], rowCount: 1 });
      }
      return Promise.resolve({ rows: [], rowCount: 0 });
    });

    mockCompare.mockResolvedValue(false);

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('CPF ou senha inválidos');
  });

  it('deve retornar erro 401 se admin não tiver senha_hash configurada', async () => {
    (mockRequest.json as jest.Mock).mockResolvedValue({
      cpf: '00000000000',
      senha: 'qualquerSenha',
    });

    mockQuery.mockImplementation((sql: string) => {
      if (sql.includes('usuarios') && sql.includes('WHERE cpf =')) {
        return Promise.resolve({
          rows: [
            {
              cpf: '00000000000',
              nome: 'Administrador',
              tipo_usuario: 'admin',
              clinica_id: null,
              entidade_id: null,
              ativo: true,
              senha_hash: null,
            },
          ],
          rowCount: 1,
        });
      }
      if (sql.includes('INSERT INTO audit_logs')) {
        return Promise.resolve({ rows: [], rowCount: 1 });
      }
      return Promise.resolve({ rows: [], rowCount: 0 });
    });

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBeDefined();
  });

  it('deve fazer login para emissor com senha válida', async () => {
    (mockRequest.json as jest.Mock).mockResolvedValue({
      cpf: '33333333333',
      senha: 'emissor123',
    });

    mockQuery.mockImplementation((sql: string) => {
      // Query na tabela usuarios
      if (sql.includes('usuarios') && sql.includes('WHERE cpf =')) {
        return Promise.resolve({
          rows: [
            {
              cpf: '33333333333',
              nome: 'Emissor de Laudos',
              tipo_usuario: 'emissor',
              clinica_id: null,
              entidade_id: null,
              ativo: true,
              senha_hash: '$2a$10$ValidEmissorHash',
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

    mockCompare.mockResolvedValue(true);
    mockCreateSession.mockResolvedValue();

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.cpf).toBe('33333333333');
    expect(data.nome).toBe('Emissor de Laudos');
    expect(data.perfil).toBe('emissor');
    expect(data.redirectTo).toBe('/emissor');
  });

  it('deve retornar erro 401 se senha de gestor estiver incorreta', async () => {
    (mockRequest.json as jest.Mock).mockResolvedValue({
      cpf: '44444444444',
      senha: 'senhaErrada',
    });

    mockQuery.mockImplementation((sql: string) => {
      // Query na tabela usuarios
      if (sql.includes('usuarios') && sql.includes('WHERE cpf =')) {
        return Promise.resolve({
          rows: [
            {
              cpf: '44444444444',
              nome: 'Gestor Teste',
              tipo_usuario: 'gestor',
              clinica_id: null,
              entidade_id: 1,
              ativo: true,
            },
          ],
          rowCount: 1,
        });
      }
      // Query na tabela entidades_senhas
      if (sql.includes('entidades_senhas')) {
        return Promise.resolve({
          rows: [
            {
              senha_hash: '$2a$10$ValidHash',
              id: 1,
              ativa: true,
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

    mockCompare.mockResolvedValue(false); // Senha inválida

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('CPF ou senha inválidos');
  });

  it('deve retornar erro 403 se entidade estiver inativa', async () => {
    (mockRequest.json as jest.Mock).mockResolvedValue({
      cpf: '55555555555',
      senha: '123456',
    });

    mockQuery.mockImplementation((sql: string) => {
      // Query na tabela usuarios
      if (sql.includes('usuarios') && sql.includes('WHERE cpf =')) {
        return Promise.resolve({
          rows: [
            {
              cpf: '55555555555',
              nome: 'Gestor Entidade Inativa',
              tipo_usuario: 'gestor',
              clinica_id: null,
              entidade_id: 1,
              ativo: true,
            },
          ],
          rowCount: 1,
        });
      }
      // Query na tabela entidades_senhas - entidade inativa
      if (sql.includes('entidades_senhas')) {
        return Promise.resolve({
          rows: [
            {
              senha_hash: '$2a$10$ValidHash',
              id: 1,
              ativa: false, // Entidade inativa
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

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe(
      'Tomador inativo. Entre em contato com o administrador.'
    );
  });
});
