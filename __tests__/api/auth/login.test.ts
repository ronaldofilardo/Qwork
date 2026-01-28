import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/login/route';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { createSession } from '@/lib/session';

// Mock das dependências
jest.mock('@/lib/db');
jest.mock('bcryptjs');
jest.mock('@/lib/session');

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockCompare = bcrypt.compare as jest.MockedFunction<
  typeof bcrypt.compare
>;
const mockCreateSession = createSession as jest.MockedFunction<
  typeof createSession
>;

describe('/api/auth/login', () => {
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

    // Reset mocks para cada teste
    mockQuery.mockReset();
    mockCompare.mockReset();
    mockCreateSession.mockReset();
  });

  afterEach(() => {
    // Garantir limpeza completa dos mocks após cada teste
    jest.clearAllMocks();
    mockQuery.mockRestore();
    mockCompare.mockRestore();
    mockCreateSession.mockRestore();
  });

  it('deve retornar erro 400 se CPF não for fornecido', async () => {
    (mockRequest.json as jest.Mock).mockResolvedValue({ senha: '123' });

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('CPF e senha são obrigatórios');
  });

  it('deve retornar erro 400 se senha não for fornecida', async () => {
    (mockRequest.json as jest.Mock).mockResolvedValue({ cpf: '12345678901' });

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('CPF e senha são obrigatórios');
  });

  it('deve retornar erro 400 se senha não for fornecida', async () => {
    (mockRequest.json as jest.Mock).mockResolvedValue({ cpf: '12345678901' });

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('CPF e senha são obrigatórios');
  });

  it('deve retornar erro 401 se CPF não existir', async () => {
    (mockRequest.json as jest.Mock).mockResolvedValue({
      cpf: '99999999999',
      senha: '123',
    });

    // ✅ Padrão robusto: mockImplementation para controle preciso
    mockQuery.mockImplementation((sql: string) => {
      // Rate limiting query - retorna 0 tentativas
      if (sql.includes('audit_logs') && sql.includes('COUNT')) {
        return Promise.resolve({ rows: [{ count: 0 }], rowCount: 1 });
      }
      // Employee query - user not found
      if (sql.includes('funcionarios')) {
        return Promise.resolve({ rows: [], rowCount: 0 });
      }
      // Entity query - user not found
      if (sql.includes("tipo = 'entidade'")) {
        return Promise.resolve({ rows: [], rowCount: 0 });
      }
      // Clinic query - user not found
      if (sql.includes("tipo = 'clinica'")) {
        return Promise.resolve({ rows: [], rowCount: 0 });
      }
      // Audit log insert for failed login
      if (sql.includes('INSERT INTO audit_logs')) {
        return Promise.resolve({ rows: [], rowCount: 1 });
      }
      // Default
      return Promise.resolve({ rows: [], rowCount: 0 });
    });

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('CPF ou senha inválidos');

    // Verificar que bcrypt.compare e createSession não foram chamados
    expect(mockCompare).not.toHaveBeenCalled();
    expect(mockCreateSession).not.toHaveBeenCalled();
  });

  it('deve retornar erro 403 se usuário estiver inativo', async () => {
    (mockRequest.json as jest.Mock).mockResolvedValue({
      cpf: '55555555555',
      senha: '123',
    });

    // Mock usando mockImplementation para maior controle
    mockQuery.mockImplementation((sql: string) => {
      if (sql.includes('rate_limiting')) {
        // Rate limiting check
        return Promise.resolve({ rows: [{ count: 0 }], rowCount: 1 });
      } else if (sql.includes('contratantes_senhas')) {
        // Primeira query: contratantes_senhas - deve retornar vazio para funcionários
        return Promise.resolve({ rows: [], rowCount: 0 });
      } else if (sql.includes('funcionarios')) {
        // Segunda query: funcionários - usuário inativo
        return Promise.resolve({
          rows: [
            {
              cpf: '55555555555',
              nome: 'João Silva',
              perfil: 'funcionario',
              senha_hash: '$2a$10$hash',
              ativo: false,
              nivel_cargo: 'operacional',
            },
          ],
          rowCount: 1,
        });
      } else if (sql.includes('responsavel_cpf')) {
        // Terceira query: contratantes - responsabilidade, deve retornar vazio
        return Promise.resolve({ rows: [], rowCount: 0 });
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

  it('deve retornar erro 401 se senha estiver incorreta', async () => {
    (mockRequest.json as jest.Mock).mockResolvedValue({
      cpf: '66666666666',
      senha: 'wrongpassword',
    });

    // Mock usando mockImplementation para maior controle
    mockQuery.mockImplementation((sql: string) => {
      if (sql.includes('rate_limiting')) {
        // Rate limiting check
        return Promise.resolve({ rows: [{ count: 0 }], rowCount: 1 });
      } else if (sql.includes('contratantes_senhas')) {
        // Primeira query: contratantes_senhas - deve retornar vazio para funcionários
        return Promise.resolve({ rows: [], rowCount: 0 });
      } else if (sql.includes('funcionarios')) {
        // Segunda query: funcionários - usuário encontrado
        return Promise.resolve({
          rows: [
            {
              cpf: '66666666666',
              nome: 'Maria Gestão Santos',
              perfil: 'funcionario',
              senha_hash: '$2a$10$hash',
              ativo: true,
              nivel_cargo: 'operacional',
            },
          ],
          rowCount: 1,
        });
      } else if (sql.includes('responsavel_cpf')) {
        // Terceira query: contratantes - responsabilidade, deve retornar vazio
        return Promise.resolve({ rows: [], rowCount: 0 });
      }
      return Promise.resolve({ rows: [], rowCount: 0 });
    });

    mockCompare.mockResolvedValue(false);

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('CPF ou senha inválidos');
  });

  it('deve fazer login com sucesso para funcionário operacional', async () => {
    (mockRequest.json as jest.Mock).mockResolvedValue({
      cpf: '77777777777',
      senha: '123',
    });

    // Mock usando mockImplementation para maior controle
    mockQuery.mockImplementation((sql: string) => {
      if (sql.includes('rate_limiting')) {
        // Rate limiting check
        return Promise.resolve({ rows: [{ count: 0 }], rowCount: 1 });
      } else if (sql.includes('contratantes_senhas')) {
        // Primeira query: contratantes_senhas - deve retornar vazio para funcionários
        return Promise.resolve({ rows: [], rowCount: 0 });
      } else if (sql.includes('funcionarios')) {
        // Segunda query: funcionários
        return Promise.resolve({
          rows: [
            {
              cpf: '77777777777',
              nome: 'Maria Gestão Santos',
              perfil: 'funcionario',
              senha_hash: '$2a$10$hash',
              ativo: true,
              nivel_cargo: 'operacional',
            },
          ],
          rowCount: 1,
        });
      } else if (sql.includes('responsavel_cpf')) {
        // Terceira query: contratantes - responsabilidade, deve retornar vazio
        return Promise.resolve({ rows: [], rowCount: 0 });
      }
      return Promise.resolve({ rows: [], rowCount: 0 });
    });

    mockCompare.mockResolvedValue(true);
    mockCreateSession.mockResolvedValue();

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.cpf).toBe('77777777777');
    expect(data.nome).toBe('Maria Gestão Santos');
    expect(data.perfil).toBe('funcionario');
    expect(data.nivelCargo).toBe('operacional');

    expect(mockCreateSession).toHaveBeenCalledWith({
      cpf: '77777777777',
      nome: 'Maria Gestão Santos',
      perfil: 'funcionario',
      nivelCargo: 'operacional',
    });
  });

  it('deve mapear clinica para gestor (responsável) quando clínica existe', async () => {
    (mockRequest.json as jest.Mock).mockResolvedValue({
      cpf: '55500011122',
      senha: '123',
    });

    mockQuery.mockImplementation((sql: string) => {
      // Rate limiting check
      if (sql.includes('rate_limiting')) {
        return Promise.resolve({ rows: [{ count: 0 }], rowCount: 1 });
      }

      // contratantes_senhas - not present
      if (sql.includes('contratantes_senhas')) {
        return Promise.resolve({ rows: [], rowCount: 0 });
      }

      // funcionarios - return active funcionario
      if (
        sql.includes(
          'SELECT cpf, nome, perfil, senha_hash, ativo, nivel_cargo FROM funcionarios'
        )
      ) {
        return Promise.resolve({
          rows: [
            {
              cpf: '55500011122',
              nome: 'Responsável Teste',
              perfil: 'funcionario',
              senha_hash: '$2a$10$hash',
              ativo: true,
              nivel_cargo: null,
            },
          ],
          rowCount: 1,
        });
      }

      // contratantes by responsavel_cpf
      if (sql.includes('responsavel_cpf')) {
        return Promise.resolve({
          rows: [{ id: 42, tipo: 'clinica', ativa: true }],
          rowCount: 1,
        });
      }

      // contratante completo (pagamento_confirmado)
      if (sql.includes('pagamento_confirmado')) {
        return Promise.resolve({
          rows: [{ ativa: true, pagamento_confirmado: true }],
          rowCount: 1,
        });
      }

      // clinicas lookup by contratante_id
      if (sql.includes('SELECT id FROM clinicas WHERE contratante_id')) {
        return Promise.resolve({ rows: [{ id: 99 }], rowCount: 1 });
      }

      return Promise.resolve({ rows: [], rowCount: 0 });
    });

    mockCompare.mockResolvedValue(true);
    mockCreateSession.mockResolvedValue();

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.perfil).toBe('rh');
    expect(mockCreateSession).toHaveBeenCalledWith({
      cpf: '55500011122',
      nome: 'Responsável Teste',
      perfil: 'rh',
      contratante_id: 42,
      clinica_id: 99,
    });
  });

  it('deve não definir clinica_id se clínica não existir para o contratante', async () => {
    (mockRequest.json as jest.Mock).mockResolvedValue({
      cpf: '55500011123',
      senha: '123',
    });

    mockQuery.mockImplementation((sql: string) => {
      if (sql.includes('rate_limiting'))
        return Promise.resolve({ rows: [{ count: 0 }], rowCount: 1 });
      if (sql.includes('contratantes_senhas'))
        return Promise.resolve({ rows: [], rowCount: 0 });
      if (
        sql.includes(
          'SELECT cpf, nome, perfil, senha_hash, ativo, nivel_cargo FROM funcionarios'
        )
      ) {
        return Promise.resolve({
          rows: [
            {
              cpf: '55500011123',
              nome: 'Sem Clínica',
              perfil: 'funcionario',
              senha_hash: '$2a$10$hash',
              ativo: true,
              nivel_cargo: null,
            },
          ],
          rowCount: 1,
        });
      }
      if (sql.includes('responsavel_cpf'))
        return Promise.resolve({
          rows: [{ id: 43, tipo: 'clinica', ativa: true }],
          rowCount: 1,
        });
      if (sql.includes('pagamento_confirmado'))
        return Promise.resolve({
          rows: [{ ativa: true, pagamento_confirmado: true }],
          rowCount: 1,
        });
      if (sql.includes('SELECT id FROM clinicas WHERE contratante_id'))
        return Promise.resolve({ rows: [], rowCount: 0 });
      return Promise.resolve({ rows: [], rowCount: 0 });
    });

    mockCompare.mockResolvedValue(true);
    mockCreateSession.mockResolvedValue();

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.perfil).toBe('rh');
    expect(mockCreateSession).toHaveBeenCalledWith({
      cpf: '55500011123',
      nome: 'Sem Clínica',
      perfil: 'rh',
      contratante_id: 43,
      clinica_id: undefined,
    });
  });

  it('deve fazer login com sucesso para emissor', async () => {
    (mockRequest.json as jest.Mock).mockResolvedValue({
      cpf: '88888888888',
      senha: '123',
    });

    // Mock usando mockImplementation para maior controle
    mockQuery.mockImplementation((sql: string) => {
      if (sql.includes('rate_limiting')) {
        // Rate limiting check
        return Promise.resolve({ rows: [{ count: 0 }], rowCount: 1 });
      } else if (sql.includes('contratantes_senhas')) {
        // Primeira query: contratantes_senhas - deve retornar vazio para funcionários
        return Promise.resolve({ rows: [], rowCount: 0 });
      } else if (sql.includes('funcionarios')) {
        // Segunda query: funcionários
        return Promise.resolve({
          rows: [
            {
              cpf: '88888888888',
              nome: 'Emissor de Laudos',
              perfil: 'emissor',
              senha_hash: '$2a$10$hash',
              ativo: true,
              nivel_cargo: null,
            },
          ],
          rowCount: 1,
        });
      } else if (sql.includes('responsavel_cpf')) {
        // Terceira query: contratantes - responsabilidade, deve retornar vazio
        return Promise.resolve({ rows: [], rowCount: 0 });
      }
      return Promise.resolve({ rows: [], rowCount: 0 });
    });

    mockCompare.mockResolvedValue(true);
    mockCreateSession.mockResolvedValue();

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.cpf).toBe('88888888888');
    expect(data.nome).toBe('Emissor de Laudos');
    expect(data.perfil).toBe('emissor');
    expect(data.redirectTo).toBe('/emissor');

    expect(mockCreateSession).toHaveBeenCalledWith({
      cpf: '88888888888',
      nome: 'Emissor de Laudos',
      perfil: 'emissor',
      nivelCargo: null,
    });
  });

  it('deve fazer login com sucesso para admin', async () => {
    (mockRequest.json as jest.Mock).mockResolvedValue({
      cpf: '00000000000',
      senha: '123456',
    });

    // Mock para contratantes_senhas (primeira query) - deve retornar vazio
    mockQuery.mockResolvedValueOnce({
      rows: [],
      rowCount: 0,
    });

    // Mock para funcionarios (segunda query) - deve retornar dados do admin
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          cpf: '00000000000',
          nome: 'Admin',
          perfil: 'admin',
          senha_hash: '$2a$10$hash',
          ativo: true,
          nivel_cargo: null,
        },
      ],
      rowCount: 1,
    });

    // Mock para contratantes (terceira query) - responsabilidade, deve retornar vazio
    mockQuery.mockResolvedValueOnce({
      rows: [],
      rowCount: 0,
    });

    mockCompare.mockResolvedValue(true);
    mockCreateSession.mockResolvedValue();

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.cpf).toBe('00000000000');
    expect(data.nome).toBe('Admin');
    expect(data.perfil).toBe('admin');
    expect(data.nivelCargo).toBe(null);
  });

  it('deve fazer login com sucesso para RH', async () => {
    (mockRequest.json as jest.Mock).mockResolvedValue({
      cpf: '11111111111',
      senha: '123',
    });

    // Mock para contratantes_senhas (primeira query) - deve retornar dados do RH
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          cpf: '11111111111',
          senha_hash: '$2a$10$hash',
          contratante_id: 2,
          nome: 'Gestor RH',
          tipo: 'rh',
          ativa: true,
          pagamento_confirmado: true,
        },
      ],
      rowCount: 1,
    });

    mockCompare.mockResolvedValue(true);
    mockCreateSession.mockResolvedValue();

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.cpf).toBe('11111111111');
    expect(data.nome).toBe('Gestor RH');
    expect(data.perfil).toBe('rh');
  });

  it('deve fazer login com sucesso para funcionário gestão', async () => {
    (mockRequest.json as jest.Mock).mockResolvedValue({
      cpf: '33333333333',
      senha: '123',
    });

    // Mock para contratantes_senhas (primeira query) - deve retornar vazio
    mockQuery.mockResolvedValueOnce({
      rows: [],
      rowCount: 0,
    });

    // Mock para funcionarios (segunda query) - deve retornar dados do funcionário
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          cpf: '33333333333',
          nome: 'Maria Gestão Santos',
          perfil: 'funcionario',
          senha_hash: '$2a$10$hash',
          ativo: true,
          nivel_cargo: 'gestao',
        },
      ],
      rowCount: 1,
    });

    // Mock para contratantes (terceira query) - responsabilidade, deve retornar vazio
    mockQuery.mockResolvedValueOnce({
      rows: [],
      rowCount: 0,
    });

    mockCompare.mockResolvedValue(true);
    mockCreateSession.mockResolvedValue();

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.cpf).toBe('33333333333');
    expect(data.nome).toBe('Maria Gestão Santos');
    expect(data.perfil).toBe('funcionario');
    expect(data.nivelCargo).toBe('gestao');
  });

  it('deve retornar erro 500 em caso de erro interno', async () => {
    (mockRequest.json as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Erro interno do servidor');
  });

  // Testes para senhas corrigidas (correções de hash)
  describe('Testes de senhas corrigidas', () => {
    it('deve fazer login com senha corrigida do Admin (admin123)', async () => {
      (mockRequest.json as jest.Mock).mockResolvedValue({
        cpf: '00000000000',
        senha: 'admin123',
      });

      // Mock para contratantes_senhas (primeira query) - deve retornar vazio
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      // Mock para funcionarios (segunda query) - deve retornar dados do admin
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            cpf: '00000000000',
            nome: 'Admin',
            perfil: 'admin',
            senha_hash:
              '$2a$10$jslNqlvuCyeNibvDArgEx.OAlWip4CZFFxIyVQUgRMzviB.kqMTKe',
            ativo: true,
            nivel_cargo: null,
          },
        ],
        rowCount: 1,
      });

      // Mock para verificar se é responsável por contratante (terceira query) - deve retornar vazio
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      mockCompare.mockResolvedValue(true);
      mockCreateSession.mockResolvedValue();

      const response = await POST(mockRequest as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.cpf).toBe('00000000000');
      expect(data.perfil).toBe('admin');
    });

    it('deve fazer login com senha corrigida do Admin (admin123)', async () => {
      (mockRequest.json as jest.Mock).mockResolvedValue({
        cpf: '11111111111',
        senha: 'admin123',
      });

      // Mock para contratantes_senhas (primeira query) - deve retornar vazio
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      // Mock para funcionarios (segunda query) - deve retornar dados do admin
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            cpf: '11111111111',
            nome: 'Administrador Clínica',
            perfil: 'admin',
            senha_hash:
              '$2a$10$RoZFITAppqKWE9IIjc79o.qZ8NSG5EnpU10bwVucHh5AyxkgSBNSy',
            ativo: true,
            nivel_cargo: null,
          },
        ],
        rowCount: 1,
      });

      // Mock para verificar se é responsável por contratante (terceira query) - deve retornar vazio
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      mockCompare.mockResolvedValue(true);
      mockCreateSession.mockResolvedValue();

      const response = await POST(mockRequest as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.cpf).toBe('11111111111');
      expect(data.perfil).toBe('admin');
    });

    it('deve fazer login com senha corrigida do RH (rh123)', async () => {
      (mockRequest.json as jest.Mock).mockResolvedValue({
        cpf: '22222222222',
        senha: 'rh123',
      });

      // Mock para contratantes_senhas (primeira query) - deve retornar dados do RH
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            cpf: '22222222222',
            senha_hash:
              '$2a$10$Z4ZKDa/YHNoDlR9L11Z0qemVhjBXYGvTXYj6PHYWjFLq2tvV/0H/G',
            contratante_id: 3,
            nome: 'RH Gestor',
            tipo: 'clinica', // Tipo correto para RH
            ativa: true,
            pagamento_confirmado: true,
          },
        ],
        rowCount: 1,
      });

      mockCompare.mockResolvedValue(true);
      mockCreateSession.mockResolvedValue();

      const response = await POST(mockRequest as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.cpf).toBe('22222222222');
      expect(data.perfil).toBe('rh');
    });
  });

  // ========== TESTES PARA GESTOR DE ENTIDADE ==========

  describe('Gestor de Entidade', () => {
    it('deve fazer login com sucesso para gestor de entidade', async () => {
      (mockRequest.json as jest.Mock).mockResolvedValue({
        cpf: '12345678901',
        senha: 'entidade123',
      });

      // ✅ Padrão robusto: mockImplementation para controle preciso
      mockQuery.mockImplementation((sql: string) => {
        if (sql.includes('audit_logs') && sql.includes('COUNT')) {
          return Promise.resolve({ rows: [{ count: 0 }], rowCount: 1 });
        }
        if (sql.includes('contratantes_senhas')) {
          return Promise.resolve({
            rows: [
              {
                cpf: '12345678901',
                senha_hash: '$2a$10$hash',
                contratante_id: 456,
                nome: 'Maria Santos',
                tipo: 'entidade',
                ativa: true,
                pagamento_confirmado: true,
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

      mockCompare.mockResolvedValue(true);
      mockCreateSession.mockResolvedValue();

      const response = await POST(mockRequest as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.cpf).toBe('12345678901');
      expect(data.nome).toBe('Maria Santos');
      expect(data.perfil).toBe('gestor_entidade');
      expect(data.redirectTo).toBe('/entidade');

      expect(mockCreateSession).toHaveBeenCalledWith({
        cpf: '12345678901',
        nome: 'Maria Santos',
        perfil: 'gestor_entidade',
        contratante_id: 456,
      });
    });

    it('deve retornar erro 401 se senha estiver incorreta para gestor de entidade', async () => {
      (mockRequest.json as jest.Mock).mockResolvedValue({
        cpf: '12345678901',
        senha: 'wrongpassword',
      });

      mockQuery.mockImplementation((sql: string) => {
        if (sql.includes('audit_logs') && sql.includes('COUNT')) {
          return Promise.resolve({ rows: [{ count: 0 }], rowCount: 1 });
        }
        if (sql.includes('funcionarios')) {
          return Promise.resolve({ rows: [], rowCount: 0 });
        }
        if (sql.includes("tipo = 'entidade'")) {
          return Promise.resolve({
            rows: [
              {
                senha_hash: '$2a$10$hash',
                contratante_id: 456,
                nome: 'Maria Santos',
                ativa: true,
                pagamento_confirmado: true,
                data_liberacao_login: new Date(),
                status: 'aprovado',
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

    it('deve retornar erro 403 se entidade estiver inativa', async () => {
      (mockRequest.json as jest.Mock).mockResolvedValue({
        cpf: '12345678901',
        senha: 'entidade123',
      });

      mockQuery.mockImplementation((sql: string) => {
        if (sql.includes('audit_logs') && sql.includes('COUNT')) {
          return Promise.resolve({ rows: [{ count: 0 }], rowCount: 1 });
        }
        if (sql.includes('funcionarios')) {
          return Promise.resolve({ rows: [], rowCount: 0 });
        }
        if (sql.includes('contratantes_senhas')) {
          return Promise.resolve({
            rows: [
              {
                cpf: '12345678901',
                senha_hash: '$2a$10$hash',
                contratante_id: 456,
                nome: 'Maria Santos',
                tipo: 'entidade',
                ativa: false,
                pagamento_confirmado: true,
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

      mockCompare.mockResolvedValue(true);

      const response = await POST(mockRequest as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Contratante inativo');
    });

    it('deve autenticar funcionário com perfil gestor_entidade usando contratante_id do funcionário', async () => {
      (mockRequest.json as jest.Mock).mockResolvedValue({
        cpf: '33333333333',
        senha: 'senha123',
      });

      mockQuery.mockImplementation((sql: string) => {
        // Primeiro procura em contratantes_senhas -> vazio
        if (sql.includes('contratantes_senhas')) {
          return Promise.resolve({ rows: [], rowCount: 0 });
        }
        // Busca funcionário
        if (sql.includes('SELECT cpf, nome, perfil, senha_hash')) {
          return Promise.resolve({
            rows: [
              {
                cpf: '33333333333',
                nome: 'Gestor Funcionario',
                perfil: 'gestor_entidade',
                senha_hash: '$2a$10$hash',
                ativo: true,
                nivel_cargo: null,
              },
            ],
            rowCount: 1,
          });
        }
        // Busca contratante pelo responsavel_cpf -> vazio
        if (sql.includes('contratantes WHERE responsavel_cpf')) {
          return Promise.resolve({ rows: [], rowCount: 0 });
        }
        // Buscar contratante_id atribuído ao funcionário
        if (sql.includes('SELECT contratante_id FROM funcionarios WHERE cpf')) {
          return Promise.resolve({
            rows: [{ contratante_id: 789 }],
            rowCount: 1,
          });
        }
        // Verificar pagamento_confirmado
        if (
          sql.includes(
            'SELECT ativa, pagamento_confirmado FROM contratantes WHERE id ='
          )
        ) {
          return Promise.resolve({
            rows: [{ ativa: true, pagamento_confirmado: true }],
            rowCount: 1,
          });
        }
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
      expect(data.perfil).toBe('gestor_entidade');
      expect(data.redirectTo).toBe('/entidade');

      // Session deve conter contratante_id vindo do registro do funcionário
      expect(mockCreateSession).toHaveBeenCalledWith(
        expect.objectContaining({
          cpf: '33333333333',
          nome: 'Gestor Funcionario',
          perfil: 'gestor_entidade',
          contratante_id: 789,
        })
      );
    });

    it('deve retornar erro 403 se pagamento não estiver confirmado para entidade', async () => {
      (mockRequest.json as jest.Mock).mockResolvedValue({
        cpf: '12345678901',
        senha: 'entidade123',
      });

      mockQuery.mockImplementation((sql: string) => {
        if (sql.includes('audit_logs') && sql.includes('COUNT')) {
          return Promise.resolve({ rows: [{ count: 0 }], rowCount: 1 });
        }
        if (sql.includes('funcionarios')) {
          return Promise.resolve({ rows: [], rowCount: 0 });
        }
        if (sql.includes('contratantes_senhas')) {
          return Promise.resolve({
            rows: [
              {
                cpf: '12345678901',
                senha_hash: '$2a$10$hash',
                contratante_id: 456,
                nome: 'Maria Santos',
                tipo: 'entidade',
                ativa: true,
                pagamento_confirmado: false,
                data_liberacao_login: new Date(),
                status: 'aprovado',
              },
            ],
            rowCount: 1,
          });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });

      const response = await POST(mockRequest as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe(
        'Aguardando confirmação de pagamento. Verifique seu email para instruções ou contate o administrador.'
      );
      expect(data.codigo).toBe('PAGAMENTO_PENDENTE');
    });
  });

  // ========== TESTES PARA GESTOR DE CLÍNICA ==========

  describe('Gestor de Clínica', () => {
    it('deve fazer login com sucesso para gestor de clínica', async () => {
      (mockRequest.json as jest.Mock).mockResolvedValue({
        cpf: '04703084945',
        senha: '000191',
      });

      // ✅ Padrão robusto: mockImplementation para controle preciso
      mockQuery.mockImplementation((sql: string) => {
        if (sql.includes('audit_logs') && sql.includes('COUNT')) {
          return Promise.resolve({ rows: [{ count: 0 }], rowCount: 1 });
        }
        if (sql.includes('contratantes_senhas')) {
          return Promise.resolve({
            rows: [
              {
                cpf: '04703084945',
                senha_hash: '$2a$10$hash',
                contratante_id: 123,
                nome: 'João Silva',
                tipo: 'clinica',
                ativa: true,
                pagamento_confirmado: true,
              },
            ],
            rowCount: 1,
          });
        }
        // Simular lookup de clinicas por contratante_id
        if (sql.includes('SELECT id FROM clinicas WHERE contratante_id')) {
          return Promise.resolve({ rows: [{ id: 123 }], rowCount: 1 });
        }
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
      expect(data.cpf).toBe('04703084945');
      expect(data.nome).toBe('João Silva');
      expect(data.perfil).toBe('rh');
      expect(data.redirectTo).toBe('/rh');

      expect(mockCreateSession).toHaveBeenCalledWith({
        cpf: '04703084945',
        nome: 'João Silva',
        perfil: 'rh',
        contratante_id: 123,
        clinica_id: 123,
      });
    });

    it('deve retornar erro 401 se senha estiver incorreta para gestor de clínica', async () => {
      (mockRequest.json as jest.Mock).mockResolvedValue({
        cpf: '04703084945',
        senha: 'wrongpassword',
      });

      mockQuery.mockImplementation((sql: string) => {
        if (sql.includes('audit_logs') && sql.includes('COUNT')) {
          return Promise.resolve({ rows: [{ count: 0 }], rowCount: 1 });
        }
        if (sql.includes('funcionarios')) {
          return Promise.resolve({ rows: [], rowCount: 0 });
        }
        if (sql.includes("tipo = 'entidade'")) {
          return Promise.resolve({ rows: [], rowCount: 0 });
        }
        if (sql.includes("tipo = 'clinica'")) {
          return Promise.resolve({
            rows: [
              {
                senha_hash: '$2a$10$hash',
                contratante_id: 123,
                nome: 'João Silva',
                ativa: true,
                pagamento_confirmado: true,
                data_liberacao_login: new Date(),
                status: 'aprovado',
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

    it('deve retornar erro 403 se clínica estiver inativa', async () => {
      (mockRequest.json as jest.Mock).mockResolvedValue({
        cpf: '04703084945',
        senha: '000191',
      });

      mockQuery.mockImplementation((sql: string) => {
        if (sql.includes('audit_logs') && sql.includes('COUNT')) {
          return Promise.resolve({ rows: [{ count: 0 }], rowCount: 1 });
        }
        if (sql.includes('funcionarios')) {
          return Promise.resolve({ rows: [], rowCount: 0 });
        }
        if (sql.includes("tipo = 'entidade'")) {
          return Promise.resolve({ rows: [], rowCount: 0 });
        }
        if (sql.includes('contratantes_senhas')) {
          return Promise.resolve({
            rows: [
              {
                cpf: '04703084945',
                senha_hash: '$2a$10$hash',
                contratante_id: 123,
                nome: 'João Silva',
                tipo: 'clinica',
                ativa: false,
                pagamento_confirmado: true,
                data_liberacao_login: new Date(),
                status: 'aprovado',
              },
            ],
            rowCount: 1,
          });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });

      const response = await POST(mockRequest as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe(
        'Contratante inativo. Entre em contato com o administrador.'
      );
    });

    it('deve retornar erro 403 se pagamento não estiver confirmado', async () => {
      (mockRequest.json as jest.Mock).mockResolvedValue({
        cpf: '04703084945',
        senha: '000191',
      });

      mockQuery.mockImplementation((sql: string) => {
        if (sql.includes('audit_logs') && sql.includes('COUNT')) {
          return Promise.resolve({ rows: [{ count: 0 }], rowCount: 1 });
        }
        if (sql.includes('funcionarios')) {
          return Promise.resolve({ rows: [], rowCount: 0 });
        }
        if (sql.includes("tipo = 'entidade'")) {
          return Promise.resolve({ rows: [], rowCount: 0 });
        }
        if (sql.includes('contratantes_senhas')) {
          return Promise.resolve({
            rows: [
              {
                cpf: '04703084945',
                senha_hash: '$2a$10$hash',
                contratante_id: 123,
                nome: 'João Silva',
                tipo: 'clinica',
                ativa: true,
                pagamento_confirmado: false,
                data_liberacao_login: new Date(),
                status: 'aprovado',
              },
            ],
            rowCount: 1,
          });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });

      const response = await POST(mockRequest as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe(
        'Aguardando confirmação de pagamento. Verifique seu email para instruções ou contate o administrador.'
      );
      expect(data.codigo).toBe('PAGAMENTO_PENDENTE');
    });
  });

  // ========== TESTE PARA USUÁRIO ADMIN CRIADO APÓS LIMPEZA DE DADOS ==========

  describe('Usuário Admin criado após limpeza de CNPJs/CPFs', () => {
    it('deve permitir login do admin com CPF 00000000000 e senha 123', async () => {
      // Mock do usuário admin criado pelo seed
      // Mock para contratantes_senhas (primeira query) - deve retornar vazio
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      // Mock para funcionarios (segunda query) - deve retornar dados do admin
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            cpf: '00000000000',
            nome: 'Administrador',
            email: 'admin@bpsbrasil.com.br',
            senha_hash:
              '$2a$10$bOCO5aMKPsWK2QWpbxC3Zu3Y7Y2DzXboFkyVDxvXlMfTDl8kVQat2', // Hash da senha '123'
            perfil: 'admin',
            ativo: true,
            nivel_cargo: 'admin',
            clinica_id: null,
          },
        ],
        rowCount: 1,
      });

      // Mock para contratantes (terceira query) - responsabilidade, deve retornar vazio
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      // Mock da comparação de senha (senha '123' é válida)
      mockCompare.mockResolvedValue(true);

      // Mock da criação de sessão
      mockCreateSession.mockResolvedValue('session-token-123');
      (mockRequest.json as jest.Mock).mockResolvedValue({
        cpf: '00000000000',
        senha: '123',
      });

      const response = await POST(mockRequest as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.cpf).toBe('00000000000');
      expect(data.nome).toBe('Administrador');
      expect(data.perfil).toBe('admin');
      expect(data.redirectTo).toBe('/admin');

      // Verificar que as funções foram chamadas corretamente
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT cpf, nome, perfil'),
        ['00000000000']
      );
      expect(mockCompare).toHaveBeenCalledWith(
        '123',
        '$2a$10$bOCO5aMKPsWK2QWpbxC3Zu3Y7Y2DzXboFkyVDxvXlMfTDl8kVQat2'
      );
      expect(mockCreateSession).toHaveBeenCalledWith({
        cpf: '00000000000',
        nome: 'Administrador',
        perfil: 'admin',
        nivelCargo: 'admin',
      });
    });

    it('deve rejeitar login do admin com senha incorreta', async () => {
      // Mock para contratantes_senhas (primeira query) - deve retornar vazio
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      // Mock para funcionarios (segunda query) - deve retornar dados do admin
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            cpf: '00000000000',
            senha_hash:
              '$2a$10$bOCO5aMKPsWK2QWpbxC3Zu3Y7Y2DzXboFkyVDxvXlMfTDl8kVQat2',
            nome: 'Administrador',
            perfil: 'admin',
            ativo: true,
            nivel_cargo: null,
            clinica_id: null,
          },
        ],
        rowCount: 1,
      });

      // Mock da comparação de senha (senha incorreta)
      mockCompare.mockResolvedValue(false);
      (mockRequest.json as jest.Mock).mockResolvedValue({
        cpf: '00000000000',
        senha: 'senha_errada',
      });

      const response = await POST(mockRequest as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('CPF ou senha inválidos');

      // Verificar que createSession não foi chamado
      expect(mockCreateSession).not.toHaveBeenCalled();
    });
  });
});
