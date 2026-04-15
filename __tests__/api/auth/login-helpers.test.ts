/**
 * @file __tests__/api/auth/login-helpers.test.ts
 * Testes: helpers de login — handleRepresentanteLogin e validarSenhaFuncionario
 */

import { NextResponse } from 'next/server';

jest.mock('@/lib/db');
jest.mock('bcryptjs');
jest.mock('@/lib/session');
jest.mock('@/lib/auth/password-generator');
jest.mock('@/lib/auditoria/auditoria', () => ({
  registrarAuditoria: jest.fn().mockResolvedValue(undefined),
}));

import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { createSession } from '@/lib/session';
import { gerarSenhaDeNascimento } from '@/lib/auth/password-generator';
import {
  handleRepresentanteLogin,
  validarSenhaFuncionario,
} from '@/app/api/auth/login/helpers';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockCompare = bcrypt.compare as jest.MockedFunction<
  typeof bcrypt.compare
>;
const mockCreateSession = createSession as jest.MockedFunction<
  typeof createSession
>;
const mockGerarSenha = gerarSenhaDeNascimento as jest.MockedFunction<
  typeof gerarSenhaDeNascimento
>;

const contexto = { ip: '127.0.0.1', userAgent: 'test' };

// ── handleRepresentanteLogin ───────────────────────────────────────────────────

describe('handleRepresentanteLogin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar 401 se representante não encontrado em nenhuma tabela', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await handleRepresentanteLogin(
      '99999999999',
      'senha',
      contexto
    );
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('CPF ou senha inválidos');
  });

  it('deve retornar 403 se representante estiver desativado', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          nome: 'Rep',
          cpf: '12345678901',
          cpf_responsavel_pj: null,
          status: 'desativado',
          tipo_pessoa: 'pf',
          senha_repres: null,
          senha_hash: null,
        },
      ],
      rowCount: 1,
    });

    const res = await handleRepresentanteLogin(
      '12345678901',
      'senha',
      contexto
    );
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toMatch(/desativada|rejeitada/i);
  });

  it('deve retornar 403 se representante estiver rejeitado', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          nome: 'Rep',
          cpf: '12345678901',
          cpf_responsavel_pj: null,
          status: 'rejeitado',
          tipo_pessoa: 'pf',
          senha_repres: null,
          senha_hash: null,
        },
      ],
      rowCount: 1,
    });

    const res = await handleRepresentanteLogin(
      '12345678901',
      'senha',
      contexto
    );
    const data = await res.json();

    expect(res.status).toBe(403);
  });

  it('deve retornar 403 se representante estiver com acesso inativo (ativo=false)', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          nome: 'Rep Inativo',
          cpf: '12345678901',
          cpf_responsavel_pj: null,
          status: 'ativo',
          ativo: false,
          tipo_pessoa: 'pf',
          senha_repres: '$2a$10$hash',
          senha_hash: null,
        },
      ],
      rowCount: 1,
    });

    const res = await handleRepresentanteLogin(
      '12345678901',
      'senha',
      contexto
    );
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toMatch(/inativo/i);
  });

  it('deve retornar 403 se representante estiver aguardando_senha', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          nome: 'Rep',
          cpf: '12345678901',
          cpf_responsavel_pj: null,
          status: 'aguardando_senha',
          tipo_pessoa: 'pf',
          senha_repres: null,
          senha_hash: null,
        },
      ],
      rowCount: 1,
    });

    const res = await handleRepresentanteLogin(
      '12345678901',
      'senha',
      contexto
    );
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toMatch(/senha|convite/i);
  });

  it('deve retornar 403 se representante estiver expirado', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          nome: 'Rep',
          cpf: '12345678901',
          cpf_responsavel_pj: null,
          status: 'expirado',
          tipo_pessoa: 'pf',
          senha_repres: null,
          senha_hash: null,
        },
      ],
      rowCount: 1,
    });

    const res = await handleRepresentanteLogin(
      '12345678901',
      'senha',
      contexto
    );
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toMatch(/expirou/i);
  });

  it('deve retornar 400 se senha não for fornecida para representante ativo', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          nome: 'Rep',
          cpf: '12345678901',
          cpf_responsavel_pj: null,
          status: 'ativo',
          tipo_pessoa: 'pf',
          senha_repres: '$2a$10$hash',
          senha_hash: null,
        },
      ],
      rowCount: 1,
    });

    const res = await handleRepresentanteLogin(
      '12345678901',
      undefined,
      contexto
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/senha/i);
  });

  it('deve retornar 500 se representante sem senha_repres e sem senha_hash', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            nome: 'Rep',
            cpf: '12345678901',
            cpf_responsavel_pj: null,
            status: 'ativo',
            tipo_pessoa: 'pf',
            senha_repres: null,
            senha_hash: null,
          },
        ],
        rowCount: 1,
      })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await handleRepresentanteLogin(
      '12345678901',
      'senha',
      contexto
    );
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toMatch(/configura/i);
  });

  it('deve retornar 401 se senha de representante for inválida (via senha_repres)', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            nome: 'Rep',
            cpf: '12345678901',
            cpf_responsavel_pj: null,
            status: 'ativo',
            tipo_pessoa: 'pf',
            senha_repres: '$2a$10$hash',
            senha_hash: null,
          },
        ],
        rowCount: 1,
      })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    mockCompare.mockResolvedValue(false as never);

    const res = await handleRepresentanteLogin(
      '12345678901',
      'senhaErrada',
      contexto
    );
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('CPF ou senha inválidos');
  });

  it('deve retornar 200 e criar sessão se senha via senha_repres for válida', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            id: 5,
            nome: 'Rep Valido',
            cpf: '12345678901',
            cpf_responsavel_pj: null,
            status: 'ativo',
            tipo_pessoa: 'pf',
            senha_repres: '$2a$10$hash',
            senha_hash: null,
          },
        ],
        rowCount: 1,
      })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [{ id: 77 }], rowCount: 1 });

    mockCompare.mockResolvedValue(true as never);
    mockCreateSession.mockResolvedValue(undefined as never);

    const res = await handleRepresentanteLogin(
      '12345678901',
      'senhaCorreta',
      contexto
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.perfil).toBe('representante');
    expect(data.redirectTo).toBe('/representante/dashboard');
    expect(mockCreateSession).toHaveBeenCalledWith(
      expect.objectContaining({ perfil: 'representante', representante_id: 5 })
    );
  });

  it('deve usar senha_hash como fallback quando senha_repres não está definida', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            id: 7,
            nome: 'Rep Hash',
            cpf: '12345678901',
            cpf_responsavel_pj: null,
            status: 'ativo',
            tipo_pessoa: 'pf',
            senha_repres: null,
            senha_hash: '$2a$10$legacyhash',
          },
        ],
        rowCount: 1,
      })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [{ id: 78 }], rowCount: 1 });

    mockCompare.mockResolvedValue(true as never);
    mockCreateSession.mockResolvedValue(undefined as never);

    const res = await handleRepresentanteLogin(
      '12345678901',
      'senha',
      contexto
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('deve forçar troca de senha no próximo login quando primeira_senha_alterada=false mesmo usando hash legado', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            id: 8,
            nome: 'Rep Resetado',
            cpf: '12345678901',
            cpf_responsavel_pj: null,
            status: 'ativo',
            ativo: true,
            tipo_pessoa: 'pf',
            senha_repres: null,
            senha_hash: '$2a$10$legacyhash',
          },
        ],
        rowCount: 1,
      })
      .mockResolvedValueOnce({
        rows: [{ senha_hash: null, primeira_senha_alterada: false }],
        rowCount: 1,
      })
      .mockResolvedValueOnce({
        rows: [{ id: 99 }],
        rowCount: 1,
      });

    mockCompare.mockResolvedValue(true as never);
    mockCreateSession.mockResolvedValue(undefined as never);

    const res = await handleRepresentanteLogin(
      '12345678901',
      'senha',
      contexto
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.precisaTrocarSenha).toBe(true);
  });
});

// ── validarSenhaFuncionario ────────────────────────────────────────────────────

describe('validarSenhaFuncionario', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar 500 se senhaHash for null', async () => {
    const res = await validarSenhaFuncionario(
      null,
      '1990-05-10',
      undefined,
      '11111111111',
      1,
      'funcionario',
      contexto
    );

    expect(res).not.toBeNull();
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toMatch(/configura/i);
  });

  it('deve retornar null (válido) se data_nascimento gerar hash correto', async () => {
    mockGerarSenha.mockReturnValue('19900510');
    mockCompare.mockResolvedValue(true as never);

    const res = await validarSenhaFuncionario(
      '$2a$10$validHash',
      '1990-05-10',
      undefined,
      '11111111111',
      1,
      'funcionario',
      contexto
    );

    expect(res).toBeNull();
  });

  it('deve retornar 401 se data_nascimento gerar hash incorreto', async () => {
    mockGerarSenha.mockReturnValue('19900510');
    mockCompare.mockResolvedValue(false as never);

    const res = await validarSenhaFuncionario(
      '$2a$10$validHash',
      '1990-05-10',
      undefined,
      '11111111111',
      1,
      'funcionario',
      contexto
    );

    expect(res).not.toBeNull();
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toMatch(/data de nascimento/i);
  });

  it('deve usar fallback de senha normal se data_nascimento lançar erro e senha fornecida for válida', async () => {
    mockGerarSenha.mockImplementation(() => {
      throw new Error('formato inválido');
    });
    // Fallback: compare retorna true para senha normal
    mockCompare.mockResolvedValue(true as never);

    const res = await validarSenhaFuncionario(
      '$2a$10$validHash',
      'data-invalida',
      'senhaCorreta',
      '11111111111',
      1,
      'funcionario',
      contexto
    );

    expect(res).toBeNull(); // válido via fallback
  });

  it('deve retornar 401 se data_nascimento lançar erro e senha normal for inválida no fallback', async () => {
    mockGerarSenha.mockImplementation(() => {
      throw new Error('formato inválido');
    });
    mockCompare.mockResolvedValue(false as never);

    const res = await validarSenhaFuncionario(
      '$2a$10$validHash',
      'data-invalida',
      'senhaErrada',
      '11111111111',
      1,
      'funcionario',
      contexto
    );

    expect(res).not.toBeNull();
    expect(res.status).toBe(401);
  });
});
