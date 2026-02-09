/**
 * Testes de API para rota /api/admin/emissores/create
 * Valida criação de emissores independentes via API
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/admin/emissores/create/route';
import { query } from '@/lib/db';
import * as sessionLib from '@/lib/session';

// Mockar validadores para testes (permitir a maioria dos CPFs exceto o CPF inválido usado nos testes)
jest.mock('@/lib/validators', () => ({
  validarCPF: jest.fn((cpf: string) => cpf !== '12345678901'),
  validarEmail: jest.fn(
    (email: string) => email.includes('@') && email.includes('.')
  ),
}));

// Mock de dependências
jest.mock('@/lib/session');
jest.mock('@/lib/audit', () => ({
  logAudit: jest.fn(),
  extractRequestInfo: jest.fn(() => ({
    ip_address: '127.0.0.1',
    user_agent: 'test-agent',
    endpoint: '/api/admin/emissores/create',
    metodo_http: 'POST',
  })),
}));

describe('API /api/admin/emissores/create', () => {
  const mockAdminSession = {
    cpf: '11111111111',
    nome: 'Admin Teste',
    perfil: 'admin' as const,
    clinica_id: null,
  };

  const _mockRHSession = {
    cpf: '22222222222',
    nome: 'RH Teste',
    perfil: 'rh' as const,
    clinica_id: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // Limpar emissores de teste
    await query(
      "DELETE FROM funcionarios WHERE cpf LIKE '888%' AND perfil = 'emissor'"
    );
  });

  it('deve criar emissor com dados válidos', async () => {
    (sessionLib.requireRole as jest.Mock).mockResolvedValue(mockAdminSession);

    const request = new NextRequest(
      'http://localhost:3000/api/admin/emissores/create',
      {
        method: 'POST',
        body: JSON.stringify({
          cpf: '88800000045',
          nome: 'Emissor API Teste 1',
          email: 'emissor.api1@teste.com',
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.emissor.cpf).toBe('88800000045');
    expect(data.emissor.clinica_id).toBeNull();
    expect(data.senha_temporaria).toBe('123456');

    // Verificar no banco
    const result = await query(
      'SELECT cpf, nome, email, perfil, clinica_id FROM funcionarios WHERE cpf = $1',
      ['88800000045']
    );

    expect(result.rows.length).toBe(1);
    expect(result.rows[0].perfil).toBe('emissor');
    expect(result.rows[0].clinica_id).toBeNull();
  });

  it('deve permitir admin sem MFA verificar criar emissor', async () => {
    (sessionLib.requireRole as jest.Mock).mockResolvedValue({
      ...mockAdminSession,
      mfaVerified: false,
    });

    const request = new NextRequest(
      'http://localhost:3000/api/admin/emissores/create',
      {
        method: 'POST',
        body: JSON.stringify({
          cpf: '88800000126',
          nome: 'Emissor Sem MFA',
          email: 'emissor.sem_mfa@teste.com',
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.emissor.cpf).toBe('88800000126');
  });

  it('deve retornar 400 se CPF estiver faltando', async () => {
    (sessionLib.requireRole as jest.Mock).mockResolvedValue(mockAdminSession);

    const request = new NextRequest(
      'http://localhost:3000/api/admin/emissores/create',
      {
        method: 'POST',
        body: JSON.stringify({
          nome: 'Emissor Sem CPF',
          email: 'emissor@teste.com',
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('CPF, nome e email são obrigatórios');
  });

  it('deve retornar 400 se CPF for inválido', async () => {
    (sessionLib.requireRole as jest.Mock).mockResolvedValue(mockAdminSession);

    const request = new NextRequest(
      'http://localhost:3000/api/admin/emissores/create',
      {
        method: 'POST',
        body: JSON.stringify({
          cpf: '12345678901', // CPF inválido
          nome: 'Emissor CPF Inválido',
          email: 'emissor@teste.com',
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('CPF inválido');
  });

  it('deve retornar 400 se email for inválido', async () => {
    (sessionLib.requireRole as jest.Mock).mockResolvedValue(mockAdminSession);

    const request = new NextRequest(
      'http://localhost:3000/api/admin/emissores/create',
      {
        method: 'POST',
        body: JSON.stringify({
          cpf: '88800000126',
          nome: 'Emissor Email Inválido',
          email: 'email-invalido', // Email sem @
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Email inválido');
  });

  it('deve retornar 403 se usuário não for admin', async () => {
    (sessionLib.requireRole as jest.Mock).mockRejectedValue(
      new Error('Sem permissão')
    );

    const request = new NextRequest(
      'http://localhost:3000/api/admin/emissores/create',
      {
        method: 'POST',
        body: JSON.stringify({
          cpf: '88800000207',
          nome: 'Emissor Não Autorizado',
          email: 'emissor@teste.com',
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain('Acesso negado');
  });

  it('deve retornar 409 se CPF pertence a gestor', async () => {
    (sessionLib.requireRole as jest.Mock).mockResolvedValue(mockAdminSession);

    // Criar tomador do tipo 'entidade' e registrar senha (gestor)
    const tomador = await query(
      `INSERT INTO tomadors (tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular, status, ativa)
       VALUES ('entidade', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'aprovado', true) RETURNING id`,
      [
        'Entidade Teste',
        '11111111111111',
        'contato@entidade.tst',
        '0000000000',
        'Rua Teste, 1',
        'Cidade',
        'SP',
        '00000-000',
        'Resp Teste',
        '00000000000',
        'resp@teste.com',
        '11999999999',
      ]
    );

    await query(
      'INSERT INTO entidades_senhas (tomador_id, cpf, senha_hash) VALUES ($1, $2, $3)',
      [tomador.rows[0].id, '88800000888', 'hash']
    );

    const request = new NextRequest(
      'http://localhost:3000/api/admin/emissores/create',
      {
        method: 'POST',
        body: JSON.stringify({
          cpf: '88800000888',
          nome: 'Emissor Conflito Entidade',
          email: 'emissor.conflict@teste.com',
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toContain('gestor de entidade');

    // Cleanup
    await query('DELETE FROM entidades_senhas WHERE cpf = $1', ['88800000888']);
    await query('DELETE FROM tomadors WHERE cnpj = $1', ['11111111111111']);
  });

  it('deve retornar 409 se CPF pertence a gestor RH', async () => {
    (sessionLib.requireRole as jest.Mock).mockResolvedValue(mockAdminSession);

    // Garantir que não exista um registro prévio com esse CPF
    await query('DELETE FROM funcionarios WHERE cpf = $1', ['88800002021']);

    await query(
      `INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, usuario_tipo, clinica_id, ativo)
       VALUES ($1, $2, $3, $4, 'rh', 'rh', NULL, true)`,
      ['88800002021', 'RH Teste', 'rh@teste.com', 'hash']
    );

    const request = new NextRequest(
      'http://localhost:3000/api/admin/emissores/create',
      {
        method: 'POST',
        body: JSON.stringify({
          cpf: '88800002021',
          nome: 'Emissor Conflito RH',
          email: 'emissor.conflictrh@teste.com',
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toContain('gestor RH');

    // Cleanup
    await query(
      "DELETE FROM funcionarios WHERE cpf = $1 AND usuario_tipo = 'rh'",
      ['88800002021']
    );
  });

  it('deve retornar 409 se CPF já existir', async () => {
    (sessionLib.requireRole as jest.Mock).mockResolvedValue(mockAdminSession);

    // Criar primeiro emissor
    await query(
      `INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, usuario_tipo, clinica_id, ativo)
       VALUES ($1, $2, $3, $4, 'emissor', 'emissor', NULL, true)`,
      ['88800000398', 'Emissor Original', 'original@teste.com', 'hash123']
    );

    // Tentar criar com mesmo CPF
    const request = new NextRequest(
      'http://localhost:3000/api/admin/emissores/create',
      {
        method: 'POST',
        body: JSON.stringify({
          cpf: '88800000398',
          nome: 'Emissor Duplicado',
          email: 'duplicado@teste.com',
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toContain('CPF já cadastrado');
  });

  it('deve aceitar senha customizada', async () => {
    (sessionLib.requireRole as jest.Mock).mockResolvedValue(mockAdminSession);

    const senhaCustomizada = 'SenhaSegura@123';

    const request = new NextRequest(
      'http://localhost:3000/api/admin/emissores/create',
      {
        method: 'POST',
        body: JSON.stringify({
          cpf: '88800000479',
          nome: 'Emissor Senha Custom',
          email: 'emissor.custom@teste.com',
          senha: senhaCustomizada,
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.senha_temporaria).toBe(senhaCustomizada);
  });

  it('deve validar comprimento do nome', async () => {
    (sessionLib.requireRole as jest.Mock).mockResolvedValue(mockAdminSession);

    const request = new NextRequest(
      'http://localhost:3000/api/admin/emissores/create',
      {
        method: 'POST',
        body: JSON.stringify({
          cpf: '88800000550',
          nome: 'AB', // Muito curto (menos de 3 caracteres)
          email: 'emissor@teste.com',
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Dados inválidos');
  });

  it('deve remover espaços em branco dos dados', async () => {
    (sessionLib.requireRole as jest.Mock).mockResolvedValue(mockAdminSession);

    const request = new NextRequest(
      'http://localhost:3000/api/admin/emissores/create',
      {
        method: 'POST',
        body: JSON.stringify({
          cpf: '  88800000630  ',
          nome: '  Emissor Com Espaços  ',
          email: '  emissor@teste.com  ',
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.emissor.cpf).toBe('88800000630'); // Sem espaços
  });

  it('deve registrar auditoria após criação', async () => {
    (sessionLib.requireRole as jest.Mock).mockResolvedValue(mockAdminSession);

    const { logAudit } = await import('@/lib/audit');

    const request = new NextRequest(
      'http://localhost:3000/api/admin/emissores/create',
      {
        method: 'POST',
        body: JSON.stringify({
          cpf: '88800000711',
          nome: 'Emissor Auditoria',
          email: 'emissor.audit@teste.com',
        }),
      }
    );

    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(logAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        resource: 'funcionarios',
        action: 'INSERT',
        resourceId: '88800000711',
      }),
      expect.objectContaining({ cpf: mockAdminSession.cpf })
    );
  });
});
