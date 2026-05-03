/**
 * @file __tests__/api/contratos/aceitar-contrato.test.ts
 * Testes: POST /api/contratos - acao=aceitar
 */

import { POST } from '@/app/api/contratos/route';
import { query } from '@/lib/db';
import { criarContaResponsavel } from '@/lib/db/user-creation';
import { autoConvertirLeadPorCnpj } from '@/lib/db/comissionamento';
import { notificarAceiteContrato } from '@/lib/email';
import bcrypt from 'bcryptjs';

jest.mock('@/lib/db');
jest.mock('@/lib/db/user-creation');
jest.mock('@/lib/db/comissionamento');
jest.mock('@/lib/email');
jest.mock('@/lib/session');
jest.mock('bcryptjs');

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockCriarContaResponsavel = criarContaResponsavel as jest.MockedFunction<typeof criarContaResponsavel>;
const mockAutoConvertirLead = autoConvertirLeadPorCnpj as jest.MockedFunction<typeof autoConvertirLeadPorCnpj>;
const mockNotificarAceiteContrato = notificarAceiteContrato as jest.MockedFunction<typeof notificarAceiteContrato>;
const mockBcryptHash = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;

function setupQueryMocks(responses: object[]) {
  responses.forEach((r) => mockQuery.mockResolvedValueOnce(r as never));
}

function makeRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/contratos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const TOMADOR_ENTIDADE = {
  id: 10,
  cnpj: '12345678000199',
  nome: 'Entidade Teste',
  responsavel_cpf: '12345678901',
  responsavel_nome: 'Responsavel Teste',
  responsavel_email: 'resp@teste.com',
  tipo: 'entidade',
  ativa: false,
};

const TOMADOR_CLINICA = {
  id: 20,
  cnpj: '98765432000110',
  nome: 'Clinica Teste',
  responsavel_cpf: '09876543210',
  responsavel_nome: 'Responsavel Clinica',
  responsavel_email: 'clinica@teste.com',
  tipo: 'clinica',
  ativa: false,
};

describe('POST /api/contratos', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockBcryptHash.mockResolvedValue('$2b$10$hashedpassword' as never);
    mockCriarContaResponsavel.mockResolvedValue(undefined);
    mockAutoConvertirLead.mockResolvedValue(undefined);
    mockNotificarAceiteContrato.mockResolvedValue(undefined as never);
  });

  describe('acao=aceitar', () => {
    it('deve retornar 400 quando contrato_id esta ausente', async () => {
      const req = makeRequest({ acao: 'aceitar' });
      const res = await POST(req as never);
      const data = (await res.json()) as { error: string };
      expect(res.status).toBe(400);
      expect(data.error).toMatch(/contrato_id/i);
    });

    it('deve retornar 404 quando contrato nao existe', async () => {
      setupQueryMocks([{ rows: [], rowCount: 0 }]);
      const req = makeRequest({ acao: 'aceitar', contrato_id: 999 });
      const res = await POST(req as never);
      const data = (await res.json()) as { error: string };
      expect(res.status).toBe(404);
      expect(data.error).toBeDefined();
    });

    it('deve retornar 200 imediatamente quando contrato ja foi aceito', async () => {
      setupQueryMocks([
        { rows: [{ id: 1, tomador_id: 10, aceito: true, tipo_tomador: 'entidade' }], rowCount: 1 },
      ]);
      const req = makeRequest({ acao: 'aceitar', contrato_id: 1 });
      const res = await POST(req as never);
      const data = (await res.json()) as { success: boolean; message: string };
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('deve aceitar contrato de entidade e criar usuario gestor + conta responsavel', async () => {
      setupQueryMocks([
        { rows: [{ id: 1, tomador_id: 10, aceito: false, tipo_tomador: 'entidade' }], rowCount: 1 },
        { rows: [{ id: 1, tomador_id: 10, tipo_tomador: 'entidade' }], rowCount: 1 },
        { rows: [TOMADOR_ENTIDADE], rowCount: 1 },
        { rows: [], rowCount: 0 },
        { rows: [{ id: 55, ativo: true, primeira_senha_alterada: false }], rowCount: 1 },
        { rows: [], rowCount: 1 },
        { rows: [], rowCount: 1 },
      ]);

      const req = makeRequest({ acao: 'aceitar', contrato_id: 1 });
      const res = await POST(req as never);
      const data = (await res.json()) as { success: boolean; loginLiberadoImediatamente: boolean; credenciais: { login: string; senha: string } };

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.loginLiberadoImediatamente).toBe(true);
      expect(data.credenciais).toBeDefined();
      expect(data.credenciais.login).toBe(TOMADOR_ENTIDADE.responsavel_cpf);
      expect(mockCriarContaResponsavel).toHaveBeenCalledWith(expect.objectContaining({ id: 10 }));
      expect(mockNotificarAceiteContrato).toHaveBeenCalled();
    });

    it('deve aceitar contrato de clinica e criar usuario tipo rh', async () => {
      setupQueryMocks([
        { rows: [{ id: 2, tomador_id: 20, aceito: false, tipo_tomador: 'clinica' }], rowCount: 1 },
        { rows: [{ id: 2, tomador_id: 20, tipo_tomador: 'clinica' }], rowCount: 1 },
        { rows: [TOMADOR_CLINICA], rowCount: 1 },
        { rows: [], rowCount: 0 },
        { rows: [{ id: 66, ativo: true, primeira_senha_alterada: false }], rowCount: 1 },
        { rows: [], rowCount: 1 },
      ]);

      const req = makeRequest({ acao: 'aceitar', contrato_id: 2 });
      const res = await POST(req as never);
      const data = (await res.json()) as { success: boolean };

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockCriarContaResponsavel).toHaveBeenCalledWith(expect.objectContaining({ id: 20, tipo: 'clinica' }));
    });

    it('deve atualizar usuario existente (UPDATE, nao INSERT) quando CPF ja existe', async () => {
      setupQueryMocks([
        { rows: [{ id: 3, tomador_id: 10, aceito: false, tipo_tomador: 'entidade' }], rowCount: 1 },
        { rows: [{ id: 3, tomador_id: 10, tipo_tomador: 'entidade' }], rowCount: 1 },
        { rows: [TOMADOR_ENTIDADE], rowCount: 1 },
        { rows: [{ id: 55 }], rowCount: 1 },
        { rows: [{ id: 55, ativo: true, primeira_senha_alterada: false }], rowCount: 1 },
        { rows: [], rowCount: 1 },
        { rows: [], rowCount: 1 },
      ]);

      const req = makeRequest({ acao: 'aceitar', contrato_id: 3 });
      const res = await POST(req as never);

      expect(res.status).toBe(200);
      const updateCalls = mockQuery.mock.calls.filter((a) => String(a[0]).includes('UPDATE usuarios'));
      expect(updateCalls.length).toBeGreaterThanOrEqual(1);
      const insertCalls = mockQuery.mock.calls.filter((a) => String(a[0]).includes('INSERT INTO usuarios'));
      expect(insertCalls.length).toBe(0);
    });

    it('deve retornar 500 quando tomador nao existe na tabela', async () => {
      setupQueryMocks([
        { rows: [{ id: 5, tomador_id: 99, aceito: false, tipo_tomador: 'entidade' }], rowCount: 1 },
        { rows: [{ id: 5, tomador_id: 99, tipo_tomador: 'entidade' }], rowCount: 1 },
        { rows: [], rowCount: 0 },
        { rows: [], rowCount: 0 },
      ]);

      const req = makeRequest({ acao: 'aceitar', contrato_id: 5 });
      const res = await POST(req as never);
      const data = (await res.json()) as { success: boolean };

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('deve retornar 500 quando criarContaResponsavel falha', async () => {
      setupQueryMocks([
        { rows: [{ id: 6, tomador_id: 10, aceito: false, tipo_tomador: 'entidade' }], rowCount: 1 },
        { rows: [{ id: 6, tomador_id: 10, tipo_tomador: 'entidade' }], rowCount: 1 },
        { rows: [TOMADOR_ENTIDADE], rowCount: 1 },
        { rows: [], rowCount: 0 },
        { rows: [{ id: 55, ativo: true, primeira_senha_alterada: false }], rowCount: 1 },
        { rows: [], rowCount: 1 },
      ]);

      mockCriarContaResponsavel.mockRejectedValueOnce(new Error('DB failed'));

      const req = makeRequest({ acao: 'aceitar', contrato_id: 6 });
      const res = await POST(req as never);
      const data = (await res.json()) as { success: boolean };

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('acao=criar (removida)', () => {
    it('deve retornar 410 para acao=criar', async () => {
      const { getSession } = await import('@/lib/session');
      (getSession as jest.Mock).mockReturnValue({ cpf: '00000000000', perfil: 'admin' });

      const req = makeRequest({ acao: 'criar', tomador_id: 1 });
      const res = await POST(req as never);
      const data = (await res.json()) as { error: string };

      expect(res.status).toBe(410);
      expect(data.error).toBeDefined();
    });
  });

  describe('acao invalida', () => {
    it('deve retornar 400 para acao desconhecida com sessao valida', async () => {
      const { getSession } = await import('@/lib/session');
      (getSession as jest.Mock).mockReturnValue({ cpf: '00000000000', perfil: 'admin' });

      const req = makeRequest({ acao: 'deletar' });
      const res = await POST(req as never);
      const data = (await res.json()) as { error: string };

      expect(res.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('deve retornar 401 para acao desconhecida sem sessao', async () => {
      const { getSession } = await import('@/lib/session');
      (getSession as jest.Mock).mockReturnValue(null);

      const req = makeRequest({ acao: 'deletar' });
      const res = await POST(req as never);

      expect(res.status).toBe(401);
    });
  });
});
