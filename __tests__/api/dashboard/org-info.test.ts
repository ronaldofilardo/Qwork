/**
 * @file __tests__/api/dashboard/org-info.test.ts
 * Testes: GET /api/dashboard/org-info
 *
 * Correção principal: prioridade de clínica sobre entidade.
 * Quando funcionário possui vínculo ativo em ambas as tabelas
 * (funcionarios_clinicas + funcionarios_entidades), a clínica/empresa
 * deve ter prioridade (onde trabalha diretamente).
 */

import { NextResponse } from 'next/server';

// ---- Mocks ----

const mockGetSession = jest.fn();
jest.mock('@/lib/session', () => ({
  getSession: () => mockGetSession(),
}));

const mockQuery = jest.fn();
jest.mock('@/lib/db', () => ({
  query: (...args: unknown[]) => mockQuery(...args),
}));

// Suprimir console.log/error nos testes
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

// ---- Import do handler (após mocks) ----
import { GET } from '@/app/api/dashboard/org-info/route';

describe('GET /api/dashboard/org-info', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ====================================================================
  // AUTH: 401, 403
  // ====================================================================

  describe('Autenticação e Autorização', () => {
    it('deve retornar 401 quando não há sessão', async () => {
      mockGetSession.mockReturnValue(null);

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toMatch(/não autenticado/i);
    });

    it('deve retornar 403 quando perfil não é funcionario', async () => {
      mockGetSession.mockReturnValue({
        cpf: '11111111111',
        nome: 'Admin',
        perfil: 'admin',
      });

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toMatch(/acesso negado/i);
    });

    it('deve retornar 403 para perfil rh', async () => {
      mockGetSession.mockReturnValue({
        cpf: '11111111111',
        nome: 'RH User',
        perfil: 'rh',
        clinica_id: 1,
      });

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(403);
    });
  });

  // ====================================================================
  // PRIORIDADE: clínica > entidade (FIX PRINCIPAL)
  // ====================================================================

  describe('Prioridade clínica sobre entidade (fix principal)', () => {
    const sessionFuncionario = {
      cpf: '74376205028',
      nome: 'Sandra Costa',
      perfil: 'funcionario',
    };

    it('deve retornar clínica quando funcionário tem vínculo em AMBAS as tabelas', async () => {
      // Arrange
      mockGetSession.mockReturnValue(sessionFuncionario);

      // Clínica query retorna dados (primeira query agora)
      mockQuery.mockResolvedValueOnce({
        rows: [{ nome: 'ABC Empresa', logo_url: 'data:image/png;base64,abc' }],
        rowCount: 1,
      });

      // Act
      const res = await GET();
      const body = await res.json();

      // Assert
      expect(res.status).toBe(200);
      expect(body.nome).toBe('ABC Empresa');
      expect(body.logo_url).toBe('data:image/png;base64,abc');
      expect(body.tipo).toBe('clinica');

      // Deve ter chamado APENAS a query de clínica (não precisa consultar entidade)
      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockQuery.mock.calls[0][0]).toContain('funcionarios_clinicas');
    });

    it('deve retornar entidade quando funcionário NÃO tem vínculo de clínica', async () => {
      // Arrange
      mockGetSession.mockReturnValue({
        cpf: '14072801046',
        nome: 'Rafael Nunes',
        perfil: 'funcionario',
      });

      // Clínica query retorna vazio
      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        // Entidade query retorna dados
        .mockResolvedValueOnce({
          rows: [
            { nome: 'Entidade XPTO', logo_url: 'data:image/png;base64,ent' },
          ],
          rowCount: 1,
        });

      // Act
      const res = await GET();
      const body = await res.json();

      // Assert
      expect(res.status).toBe(200);
      expect(body.nome).toBe('Entidade XPTO');
      expect(body.logo_url).toBe('data:image/png;base64,ent');
      expect(body.tipo).toBe('entidade');
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it('deve verificar que a PRIMEIRA query consulta funcionarios_clinicas (não entidades)', async () => {
      // Arrange — garante que a ordem de queries está correta
      mockGetSession.mockReturnValue(sessionFuncionario);
      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      // Act
      await GET();

      // Assert — primeira query deve ser clínica
      expect(mockQuery.mock.calls[0][0]).toContain('funcionarios_clinicas');
      // Segunda query deve ser entidade
      expect(mockQuery.mock.calls[1][0]).toContain('funcionarios_entidades');
    });
  });

  // ====================================================================
  // RESPOSTAS: clínica, entidade, fallback
  // ====================================================================

  describe('Cenários de resposta', () => {
    const sessionFunc = {
      cpf: '12345678901',
      nome: 'Teste',
      perfil: 'funcionario',
    };

    it('deve retornar logo_url null quando clínica não tem logo', async () => {
      mockGetSession.mockReturnValue(sessionFunc);
      mockQuery.mockResolvedValueOnce({
        rows: [{ nome: 'Clinica Sem Logo', logo_url: null }],
        rowCount: 1,
      });

      const res = await GET();
      const body = await res.json();

      expect(body.logo_url).toBeNull();
      expect(body.nome).toBe('Clinica Sem Logo');
      expect(body.tipo).toBe('clinica');
    });

    it('deve retornar logo_url null quando entidade não tem logo', async () => {
      mockGetSession.mockReturnValue(sessionFunc);
      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // clínica vazia
        .mockResolvedValueOnce({
          rows: [{ nome: 'Entidade Sem Logo', logo_url: null }],
          rowCount: 1,
        });

      const res = await GET();
      const body = await res.json();

      expect(body.logo_url).toBeNull();
      expect(body.nome).toBe('Entidade Sem Logo');
      expect(body.tipo).toBe('entidade');
    });

    it('deve retornar fallback QWork quando sem nenhum vínculo', async () => {
      mockGetSession.mockReturnValue(sessionFunc);
      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const res = await GET();
      const body = await res.json();

      expect(body.nome).toBe('QWork');
      expect(body.logo_url).toBeNull();
      expect(body.tipo).toBe('clinica');
    });

    it('deve usar session.entidade_id como fallback terciário', async () => {
      mockGetSession.mockReturnValue({
        ...sessionFunc,
        entidade_id: 5,
      });

      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // clínica
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // entidade por CPF
        .mockResolvedValueOnce({
          // entidade por session.entidade_id
          rows: [{ nome: 'Entidade Via Session', logo_url: null }],
          rowCount: 1,
        });

      const res = await GET();
      const body = await res.json();

      expect(body.nome).toBe('Entidade Via Session');
      expect(body.tipo).toBe('entidade');
    });

    it('deve usar session.clinica_id como fallback terciário', async () => {
      mockGetSession.mockReturnValue({
        ...sessionFunc,
        clinica_id: 10,
      });

      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // clínica por CPF
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // entidade por CPF
        .mockResolvedValueOnce({
          // clínica por session.clinica_id
          rows: [
            {
              nome: 'Clinica Via Session',
              logo_url: 'data:image/png;base64,x',
            },
          ],
          rowCount: 1,
        });

      const res = await GET();
      const body = await res.json();

      expect(body.nome).toBe('Clinica Via Session');
      expect(body.tipo).toBe('clinica');
      expect(body.logo_url).toBe('data:image/png;base64,x');
    });
  });

  // ====================================================================
  // CPF HANDLING
  // ====================================================================

  describe('Tratamento de CPF', () => {
    it('deve passar CPF trimado para a query', async () => {
      mockGetSession.mockReturnValue({
        cpf: '  12345678901  ',
        nome: 'Teste',
        perfil: 'funcionario',
      });
      mockQuery.mockResolvedValueOnce({
        rows: [{ nome: 'Org', logo_url: null }],
        rowCount: 1,
      });

      await GET();

      expect(mockQuery.mock.calls[0][1]).toEqual(['12345678901']);
    });
  });

  // ====================================================================
  // ERRO: 500
  // ====================================================================

  describe('Tratamento de erros', () => {
    it('deve retornar 500 quando query lança exceção', async () => {
      mockGetSession.mockReturnValue({
        cpf: '12345678901',
        nome: 'Teste',
        perfil: 'funcionario',
      });
      mockQuery.mockRejectedValueOnce(new Error('Connection lost'));

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBeDefined();
    });
  });
});
