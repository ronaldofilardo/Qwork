/**
 * @fileoverview Testes da API admin de emissores
 * @description Testa CRUD de emissores: criação, listagem, edição e auditoria
 * @test API admin de gerenciamento de emissores
 */

import type { QueryResult } from '@/lib/db';
import { POST, GET } from '@/app/api/admin/emissores/route';
import { PATCH } from '@/app/api/admin/emissores/[cpf]/route';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';
import { logAudit } from '@/lib/audit';
import bcrypt from 'bcryptjs';

// Mocks
jest.mock('@/lib/db');
jest.mock('@/lib/session');
jest.mock('@/lib/audit');
jest.mock('bcryptjs');

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;
const mockLogAudit = logAudit as jest.MockedFunction<typeof logAudit>;

/**
 * Interface para sessão de admin
 */
interface AdminSession {
  cpf: string;
  nome: string;
  perfil: 'admin';
}

/**
 * Interface para emissor retornado pela API
 */
interface MockEmissor {
  cpf: string;
  nome: string;
  email: string;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
  total_laudos_emitidos?: number;
}

describe('/api/admin/emissores', () => {
  const adminSession: AdminSession = {
    cpf: 'admin123',
    nome: 'Admin',
    perfil: 'admin',
  };

  beforeEach(() => {
    // Arrange: Limpar todos os mocks antes de cada teste
    jest.clearAllMocks();
  });

  describe('GET', () => {
    /**
     * @test Verifica listagem de emissores para admin
     * @expected Admin deve receber lista completa de emissores com estatísticas
     */
    it('deve retornar lista de emissores para admin', async () => {
      // Arrange: Mock de sessão admin e dados de emissor
      mockRequireRole.mockResolvedValue(adminSession);

      const mockEmissores: MockEmissor[] = [
        {
          cpf: '12345678909',
          nome: 'Emissor Teste',
          email: 'emissor@teste.com',
          ativo: true,
          criado_em: '2024-01-01T00:00:00.000Z',
          atualizado_em: '2024-01-01T00:00:00.000Z',
          total_laudos_emitidos: 5,
        },
      ];

      mockQuery.mockResolvedValue({
        rows: mockEmissores,
        rowCount: 1,
      } as QueryResult<MockEmissor>);

      // Act: Chamar endpoint GET
      const response = await GET();
      const data = await response.json();

      // Assert: Verificar resposta bem-sucedida
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.emissores).toHaveLength(1);
      expect(data.emissores[0].nome).toBe('Emissor Teste');
      expect(data.emissores[0]).not.toHaveProperty('clinica_id');

      // Assert: Query deve receber contexto RLS
      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        [],
        expect.objectContaining({ perfil: 'admin' })
      );
    });

    /**
     * @test Verifica rejeição de acesso para não-admin
     * @expected Deve retornar 403 quando usuário não é admin
     */
    it('deve retornar 403 se não for admin', async () => {
      // Arrange: Mock de rejeição de autenticação
      mockRequireRole.mockRejectedValue(new Error('Sem permissão'));

      // Act: Tentar acessar endpoint protegido
      const response = await GET();
      const data = await response.json();

      // Assert: Verificar erro 403
      expect(response.status).toBe(403);
      expect(data.error).toBe('Acesso negado');
    });
  });

  describe('POST', () => {
    /**
     * Interface para payload de criação de emissor
     */
    interface NovoEmissorPayload {
      cpf: string;
      nome: string;
      email: string;
      senha: string;
    }

    const validEmissor: NovoEmissorPayload = {
      cpf: '12345678909',
      nome: 'Novo Emissor',
      email: 'novo@emissor.com',
      senha: '123456',
    };

    /**
     * @test Verifica criação de emissor com sucesso
     * @expected Admin deve conseguir criar emissor com senha hasheada
     */
    it('deve criar emissor com sucesso', async () => {
      // Arrange: Mock de sessão e bcrypt
      mockRequireRole.mockResolvedValue(adminSession);

      const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
      mockBcrypt.hash.mockResolvedValue('hashedPassword' as never);

      // Arrange: Mock de verificação (CPF não existe)
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      } as QueryResult<MockEmissor>);

      // Arrange: Mock de INSERT retornando novo emissor
      const novoEmissor: MockEmissor = {
        cpf: '12345678909',
        nome: 'Novo Emissor',
        email: 'novo@emissor.com',
        ativo: true,
        criado_em: '2024-01-01T00:00:00.000Z',
        atualizado_em: '2024-01-01T00:00:00.000Z',
      };

      mockQuery.mockResolvedValueOnce({
        rows: [novoEmissor],
        rowCount: 1,
      } as QueryResult<MockEmissor>);

      // Act: Criar novo emissor
      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify(validEmissor),
      });
      const response = await POST(request);
      const data = await response.json();

      // Assert: Verificar criação bem-sucedida
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.emissor.nome).toBe('Novo Emissor');

      // Assert: Verificar hash da senha
      expect(mockBcrypt.hash).toHaveBeenCalledWith('123456', 10);

      // Assert: Verificar log de auditoria
      expect(mockLogAudit).toHaveBeenCalledWith(
        'criar_emissor',
        'admin123',
        expect.objectContaining({
          emissor_cpf: '12345678909',
        })
      );
    });

    /**
     * @test Verifica erro ao tentar criar emissor duplicado
     * @expected Deve retornar 400 quando CPF já existe
     */
    it('deve retornar erro se emissor já existe', async () => {
      // Arrange: Mock de sessão
      mockRequireRole.mockResolvedValue(adminSession);

      // Arrange: Mock de verificação (CPF já existe)
      mockQuery.mockResolvedValueOnce({
        rows: [{ cpf: '12345678909', nome: 'Existente' }],
        rowCount: 1,
      } as QueryResult<Partial<MockEmissor>>);

      // Act: Tentar criar emissor duplicado
      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify(validEmissor),
      });
      const response = await POST(request);
      const data = await response.json();

      // Assert: Verificar erro 400
      expect(response.status).toBe(400);
      expect(data.error).toContain('já cadastrado');
    });
  });

  describe('PATCH /[cpf]', () => {
    /**
     * @test Verifica edição de emissor existente
     * @expected Admin deve conseguir atualizar dados do emissor
     */
    it('deve editar emissor existente', async () => {
      // Arrange: Mock de sessão
      mockRequireRole.mockResolvedValue(adminSession);

      // Arrange: Mock de UPDATE retornando emissor atualizado
      const emissorAtualizado: MockEmissor = {
        cpf: '12345678909',
        nome: 'Emissor Atualizado',
        email: 'atualizado@teste.com',
        ativo: true,
        criado_em: '2024-01-01T00:00:00.000Z',
        atualizado_em: '2024-01-02T00:00:00.000Z',
      };

      mockQuery.mockResolvedValue({
        rows: [emissorAtualizado],
        rowCount: 1,
      } as QueryResult<MockEmissor>);

      // Act: Editar emissor
      const request = new Request('http://localhost', {
        method: 'PATCH',
        body: JSON.stringify({
          nome: 'Emissor Atualizado',
          email: 'atualizado@teste.com',
        }),
      });
      const response = await PATCH(request, {
        params: { cpf: '12345678909' },
      });
      const data = await response.json();

      // Assert: Verificar atualização bem-sucedida
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.emissor.nome).toBe('Emissor Atualizado');

      // Assert: Verificar log de auditoria
      expect(mockLogAudit).toHaveBeenCalledWith(
        'editar_emissor',
        'admin123',
        expect.objectContaining({
          emissor_cpf: '12345678909',
        })
      );
    });

    /**
     * @test Verifica erro ao editar emissor inexistente
     * @expected Deve retornar 404 quando emissor não é encontrado
     */
    it('deve retornar 404 se emissor não existe', async () => {
      // Arrange: Mock de sessão
      mockRequireRole.mockResolvedValue(adminSession);

      // Arrange: Mock de UPDATE sem resultado
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as QueryResult<MockEmissor>);

      // Act: Tentar editar emissor inexistente
      const request = new Request('http://localhost', {
        method: 'PATCH',
        body: JSON.stringify({ nome: 'Teste' }),
      });
      const response = await PATCH(request, {
        params: { cpf: '99999999999' },
      });
      const data = await response.json();

      // Assert: Verificar erro 404
      expect(response.status).toBe(404);
      expect(data.error).toContain('não encontrado');
    });
  });
});
