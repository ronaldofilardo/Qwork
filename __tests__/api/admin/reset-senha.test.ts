/**
 * Testes de API para POST /api/admin/reset-senha
 *
 * Valida geração de token de reset de senha pelo admin.
 * Perfis suportados: suporte, comercial, rh, gestor, emissor (tabela usuarios)
 *                    + representante (tabela representantes)
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/admin/reset-senha/route';

jest.mock('@/lib/db');
jest.mock('@/lib/session');
jest.mock('@/lib/audit', () => ({
  logAudit: jest.fn().mockResolvedValue(undefined),
  extractRequestInfo: jest.fn(() => ({
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
  })),
}));
jest.mock('@/lib/reset-senha/gerar-token', () => ({
  PERFIS_RESET_USUARIOS: ['suporte', 'comercial', 'rh', 'gestor', 'emissor'],
  gerarTokenResetUsuario: jest.fn(),
  logEmailResetSenha: jest.fn(),
}));

import { query, transaction } from '@/lib/db';
import { requireRole } from '@/lib/session';
import { gerarTokenResetUsuario } from '@/lib/reset-senha/gerar-token';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockTransaction = transaction as jest.MockedFunction<typeof transaction>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;
const mockGerarTokenUsuario = gerarTokenResetUsuario as jest.MockedFunction<
  typeof gerarTokenResetUsuario
>;

const adminSession = {
  cpf: '00000000001',
  nome: 'Admin',
  perfil: 'admin' as const,
};

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/admin/reset-senha', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const tokenMock = 'a'.repeat(64);
const expiraMock = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
const linkMock = `http://localhost/resetar-senha?token=${tokenMock}`;

describe('POST /api/admin/reset-senha', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue(adminSession);
  });

  describe('Validações de entrada', () => {
    it('deve retornar 400 para body sem CPF', async () => {
      const res = await POST(makeRequest({}));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it('deve retornar 400 para CPF com menos de 11 dígitos', async () => {
      const res = await POST(makeRequest({ cpf: '1234567' }));
      expect(res.status).toBe(400);
    });

    it('deve formatar CPF com máscara (ex: 000.000.000-00)', async () => {
      // CPF formatado deve ser aceito e processado
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const res = await POST(makeRequest({ cpf: '000.000.000-00' }));
      // Usuário não encontrado → 404
      expect(res.status).toBe(404);
    });
  });

  describe('Autenticação', () => {
    it('deve retornar 4xx quando não autenticado como admin', async () => {
      mockRequireRole.mockRejectedValueOnce(new Error('Não autenticado'));

      const res = await POST(makeRequest({ cpf: '12345678909' }));
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(600);
    });
  });

  describe('Usuário da tabela usuarios', () => {
    it('deve gerar token para usuário com perfil suporte', async () => {
      const fakeCPF = '12345678909';
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            cpf: fakeCPF,
            nome: 'Suporte Teste',
            tipo_usuario: 'suporte',
            email: 'sup@test.com',
            ativo: true,
          },
        ],
        rowCount: 1,
      } as any);

      const tokenResult = {
        token: tokenMock,
        link: linkMock,
        expira_em: expiraMock,
        nome: 'Suporte Teste',
        perfil: 'suporte',
        tabela: 'usuarios' as const,
      };
      mockTransaction.mockResolvedValueOnce(tokenResult);

      const res = await POST(makeRequest({ cpf: fakeCPF }));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.link).toBe(linkMock);
      expect(data.nome).toBe('Suporte Teste');
      expect(data.perfil).toBe('suporte');
      expect(data.expira_em).toBeDefined();
    });

    it('deve funcionar para todos os perfis permitidos', async () => {
      const perfis = ['suporte', 'comercial', 'rh', 'gestor', 'emissor'];

      for (const perfil of perfis) {
        jest.clearAllMocks();
        mockRequireRole.mockResolvedValue(adminSession);
        mockQuery.mockResolvedValueOnce({
          rows: [
            {
              cpf: '12345678909',
              nome: `${perfil} Teste`,
              tipo_usuario: perfil,
              email: null,
              ativo: true,
            },
          ],
          rowCount: 1,
        } as any);
        mockTransaction.mockResolvedValueOnce({
          token: tokenMock,
          link: linkMock,
          expira_em: expiraMock,
          nome: `${perfil} Teste`,
          perfil,
          tabela: 'usuarios' as const,
        });

        const res = await POST(makeRequest({ cpf: '12345678909' }));
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.perfil).toBe(perfil);
      }
    });
  });

  describe('Representante', () => {
    it('deve bloquear reset por admin e orientar uso do suporte', async () => {
      const fakeCPF = '98765432100';
      // Tabela usuarios: sem resultado
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
      // Tabela representantes: encontrado
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
      } as any);

      const res = await POST(makeRequest({ cpf: fakeCPF }));
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toMatch(/suporte/i);
    });
  });

  describe('CPF não encontrado', () => {
    it('deve retornar 404 quando CPF não existe em nenhuma tabela', async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      const res = await POST(makeRequest({ cpf: '11111111111' }));
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });
  });
});
