/**
 * Testes para PATCH /api/admin/clinicas/[id] e /api/admin/entidades/[id]
 *
 * Cobre:
 * - Autorização (apenas admin)
 * - Reativação simples (sem trocar gestor)
 * - Reativação com troca de gestor (validação CPF, email, campos obrigatórios)
 * - Geração de senha provisória (últimos 6 dígitos do CNPJ)
 * - Desativação do gestor anterior
 * - Criação do novo usuário
 * - Registro de auditoria com tipos corretos
 */

import { NextRequest } from 'next/server';
import { PATCH as patchClinica } from '@/app/api/admin/clinicas/[id]/route';
import { PATCH as patchEntidade } from '@/app/api/admin/entidades/[id]/route';
import * as db from '@/lib/db';
import * as session from '@/lib/session';
import bcrypt from 'bcryptjs';
import * as auditoria from '@/lib/auditoria/auditoria';

jest.mock('@/lib/db', () => ({ query: jest.fn() }));
jest.mock('bcryptjs', () => ({ hash: jest.fn(), compare: jest.fn() }));
jest.mock('@/lib/session', () => ({ requireRole: jest.fn() }));
jest.mock('@/lib/auditoria/auditoria', () => ({
  registrarAuditoria: jest.fn(),
  extrairContextoRequisicao: jest.fn(() => ({
    ipAddress: '127.0.0.1',
    userAgent: 'jest',
  })),
}));

const mockQuery = db.query as jest.MockedFunction<typeof db.query>;
const mockRequireRole = session.requireRole as jest.MockedFunction<
  typeof session.requireRole
>;
const mockBcryptHash = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;
const mockRegistrarAuditoria =
  auditoria.registrarAuditoria as jest.MockedFunction<
    typeof auditoria.registrarAuditoria
  >;

function makeClinicaRequest(
  id: string,
  body: Record<string, unknown>
): NextRequest {
  return new NextRequest(`http://localhost:3000/api/admin/clinicas/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function makeEntidadeRequest(
  id: string,
  body: Record<string, unknown>
): NextRequest {
  return new NextRequest(`http://localhost:3000/api/admin/entidades/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

const clinicaRow = {
  id: 1,
  cnpj: '12345678000195',
  responsavel_cpf: '12345678901',
  responsavel_nome: 'Gestor Anterior',
};

const entidadeRow = {
  id: 1,
  cnpj: '98765432000110',
  responsavel_cpf: '98765432109',
  responsavel_nome: 'Gestor Antigo',
};

// ── CLINICA ───────────────────────────────────────────────────────────────────

describe('PATCH /api/admin/clinicas/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue(undefined as any);
    mockRegistrarAuditoria.mockResolvedValue(undefined as any);
    (mockBcryptHash as any).mockResolvedValue('hash_gerado');
  });

  // ── Autorização ──────────────────────────────────────────────────────────

  describe('Autorização', () => {
    it('deve retornar 403 quando usuário não é admin', async () => {
      mockRequireRole.mockRejectedValue(new Error('Sem permissão'));

      const response = await patchClinica(
        makeClinicaRequest('1', { ativa: true }),
        { params: { id: '1' } }
      );

      expect(response.status).toBe(403);
    });
  });

  // ── Validações básicas ────────────────────────────────────────────────────

  describe('Validações de entrada', () => {
    it('deve retornar 400 para ID inválido', async () => {
      const response = await patchClinica(
        makeClinicaRequest('abc', { ativa: true }),
        { params: { id: 'abc' } }
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toMatch(/id da clínica/i);
    });

    it('deve retornar 400 quando ativa não é boolean', async () => {
      const response = await patchClinica(
        makeClinicaRequest('1', { ativa: 'sim' }),
        { params: { id: '1' } }
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toMatch(/boolean/i);
    });

    it('deve retornar 400 quando trocar_gestor está incompleto (sem email)', async () => {
      const response = await patchClinica(
        makeClinicaRequest('1', {
          ativa: true,
          trocar_gestor: { cpf: '12345678901', nome: 'Novo Gestor' },
        }),
        { params: { id: '1' } }
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toMatch(/obrigatóri/i);
    });

    it('deve retornar 400 quando CPF do novo gestor tem menos de 11 dígitos', async () => {
      const response = await patchClinica(
        makeClinicaRequest('1', {
          ativa: true,
          trocar_gestor: { cpf: '1234', nome: 'Novo', email: 'novo@email.com' },
        }),
        { params: { id: '1' } }
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toMatch(/cpf/i);
    });
  });

  // ── Toggle simples (sem trocar gestor) ───────────────────────────────────

  describe('Toggle simples', () => {
    it('deve desativar clínica sem trocar gestor', async () => {
      mockQuery.mockResolvedValue({
        rows: [
          { id: 1, nome: 'Clínica X', cnpj: '12345678000195', ativa: false },
        ],
        rowCount: 1,
      } as any);

      const response = await patchClinica(
        makeClinicaRequest('1', { ativa: false }),
        { params: { id: '1' } }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.ativa).toBe(false);
    });

    it('deve retornar 404 quando clínica não existe (toggle simples)', async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      const response = await patchClinica(
        makeClinicaRequest('999', { ativa: false }),
        { params: { id: '999' } }
      );

      expect(response.status).toBe(404);
    });
  });

  // ── Reativação com troca de gestor ───────────────────────────────────────

  describe('Reativação com trocar_gestor', () => {
    const novoGestor = {
      cpf: '55566677788',
      nome: 'Maria Nova',
      email: 'maria@clinica.com',
    };

    function setupMocksClinica() {
      mockQuery
        .mockResolvedValueOnce({ rows: [clinicaRow], rowCount: 1 } as any) // SELECT clinica
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any) // UPDATE clinica
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any) // UPDATE usuarios (desativar antigo)
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any) // DELETE clinicas_senhas antigo
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // SELECT usuario existente
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any) // INSERT usuario
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any); // INSERT clinicas_senhas
    }

    it('deve retornar 200 com novo_gestor e credenciais', async () => {
      setupMocksClinica();

      const response = await patchClinica(
        makeClinicaRequest('1', { ativa: true, trocar_gestor: novoGestor }),
        { params: { id: '1' } }
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.novo_gestor).toBeDefined();
      expect(data.novo_gestor.cpf).toBe('55566677788');
      expect(data.novo_gestor.nome).toBe('Maria Nova');
      expect(data.novo_gestor.email).toBe('maria@clinica.com');
      expect(data.novo_gestor.login).toBe('55566677788');
    });

    it('deve gerar senha = últimos 6 dígitos do CNPJ (000195)', async () => {
      setupMocksClinica();

      await patchClinica(
        makeClinicaRequest('1', { ativa: true, trocar_gestor: novoGestor }),
        { params: { id: '1' } }
      );

      // CNPJ: '12345678000195' → últimos 6 = '000195'
      expect(mockBcryptHash).toHaveBeenCalledWith('000195', 12);

      // Hash chamado com a senha correta
      const ultimaResponse = await patchClinica(
        makeClinicaRequest('1', { ativa: true, trocar_gestor: novoGestor }),
        { params: { id: '1' } }
      );
    });

    it('deve retornar senha_inicial correta na resposta', async () => {
      setupMocksClinica();

      const response = await patchClinica(
        makeClinicaRequest('1', { ativa: true, trocar_gestor: novoGestor }),
        { params: { id: '1' } }
      );
      const data = await response.json();

      expect(data.novo_gestor.senha).toBe('000195'); // Últimos 6 de '12345678000195'
    });

    it('deve retornar 404 quando clínica não existe', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const response = await patchClinica(
        makeClinicaRequest('999', { ativa: true, trocar_gestor: novoGestor }),
        { params: { id: '999' } }
      );

      expect(response.status).toBe(404);
    });

    it('deve registrar auditoria com entidade_tipo=tomador e operacao=trocar_gestor_reativacao', async () => {
      setupMocksClinica();

      await patchClinica(
        makeClinicaRequest('1', { ativa: true, trocar_gestor: novoGestor }),
        { params: { id: '1' } }
      );

      expect(mockRegistrarAuditoria).toHaveBeenCalledWith(
        expect.objectContaining({
          entidade_tipo: 'tomador',
          acao: 'atualizar',
          metadados: expect.objectContaining({
            operacao: 'trocar_gestor_reativacao',
            tipo_tomador: 'clinica',
          }),
        })
      );
    });

    it('deve inserir novo usuário com tipo_usuario=rh', async () => {
      setupMocksClinica();

      await patchClinica(
        makeClinicaRequest('1', { ativa: true, trocar_gestor: novoGestor }),
        { params: { id: '1' } }
      );

      const insertUsuarioCall = mockQuery.mock.calls.find(
        ([sql]) =>
          typeof sql === 'string' && sql.includes('INSERT INTO usuarios')
      );
      expect(insertUsuarioCall).toBeDefined();
      expect(insertUsuarioCall![0]).toMatch(/'rh'/);
    });

    it('deve inserir senha com primeira_senha_alterada=false', async () => {
      setupMocksClinica();

      await patchClinica(
        makeClinicaRequest('1', { ativa: true, trocar_gestor: novoGestor }),
        { params: { id: '1' } }
      );

      const insertSenhaCall = mockQuery.mock.calls.find(
        ([sql]) =>
          typeof sql === 'string' && sql.includes('INSERT INTO clinicas_senhas')
      );
      expect(insertSenhaCall).toBeDefined();
      // primeira_senha_alterada = false está hardcoded no SQL (não nos params)
      expect(insertSenhaCall![0]).toMatch(/primeira_senha_alterada/);
      expect(insertSenhaCall![0]).toMatch(/false/);
    });

    it('deve desativar usuário anterior quando CPF é diferente', async () => {
      setupMocksClinica();

      await patchClinica(
        makeClinicaRequest('1', { ativa: true, trocar_gestor: novoGestor }),
        { params: { id: '1' } }
      );

      const desativarCall = mockQuery.mock.calls.find(
        ([sql]) =>
          typeof sql === 'string' &&
          sql.includes('UPDATE usuarios SET ativo = false')
      );
      expect(desativarCall).toBeDefined();
    });
  });
});

// ── ENTIDADE ──────────────────────────────────────────────────────────────────

describe('PATCH /api/admin/entidades/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue(undefined as any);
    mockRegistrarAuditoria.mockResolvedValue(undefined as any);
    (mockBcryptHash as any).mockResolvedValue('hash_gerado_entidade');
  });

  const novoGestorEntidade = {
    cpf: '44455566677',
    nome: 'Carlos Novo',
    email: 'carlos@entidade.com',
  };

  function setupMocksEntidade() {
    mockQuery
      .mockResolvedValueOnce({ rows: [entidadeRow], rowCount: 1 } as any) // SELECT entidade
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any) // UPDATE entidade
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any) // UPDATE usuarios (desativar)
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any) // DELETE entidades_senhas antigo
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // SELECT usuario existente
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any) // INSERT usuario
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any); // INSERT entidades_senhas
  }

  it('deve retornar 200 com novo_gestor e credenciais para entidade', async () => {
    setupMocksEntidade();

    const response = await patchEntidade(
      makeEntidadeRequest('1', {
        ativa: true,
        trocar_gestor: novoGestorEntidade,
      }),
      { params: { id: '1' } }
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.novo_gestor.cpf).toBe('44455566677');
    expect(data.novo_gestor.nome).toBe('Carlos Novo');
  });

  it('deve gerar senha = últimos 6 dígitos do CNPJ da entidade', async () => {
    setupMocksEntidade();

    await patchEntidade(
      makeEntidadeRequest('1', {
        ativa: true,
        trocar_gestor: novoGestorEntidade,
      }),
      { params: { id: '1' } }
    );

    // CNPJ: '98765432000110' → últimos 6 = '000110'
    expect(mockBcryptHash).toHaveBeenCalledWith('000110', 12);
  });

  it('deve inserir novo usuário com tipo_usuario=gestor para entidade', async () => {
    setupMocksEntidade();

    await patchEntidade(
      makeEntidadeRequest('1', {
        ativa: true,
        trocar_gestor: novoGestorEntidade,
      }),
      { params: { id: '1' } }
    );

    const insertUsuarioCall = mockQuery.mock.calls.find(
      ([sql]) => typeof sql === 'string' && sql.includes('INSERT INTO usuarios')
    );
    expect(insertUsuarioCall).toBeDefined();
    expect(insertUsuarioCall![0]).toMatch(/'gestor'/);
  });

  it('deve registrar auditoria com tipo_tomador=entidade', async () => {
    setupMocksEntidade();

    await patchEntidade(
      makeEntidadeRequest('1', {
        ativa: true,
        trocar_gestor: novoGestorEntidade,
      }),
      { params: { id: '1' } }
    );

    expect(mockRegistrarAuditoria).toHaveBeenCalledWith(
      expect.objectContaining({
        entidade_tipo: 'tomador',
        acao: 'atualizar',
        metadados: expect.objectContaining({
          operacao: 'trocar_gestor_reativacao',
          tipo_tomador: 'entidade',
        }),
      })
    );
  });

  it('deve retornar 403 quando usuário não é admin', async () => {
    mockRequireRole.mockRejectedValue(new Error('Sem permissão'));

    const response = await patchEntidade(
      makeEntidadeRequest('1', { ativa: true }),
      { params: { id: '1' } }
    );

    expect(response.status).toBe(403);
  });
});
