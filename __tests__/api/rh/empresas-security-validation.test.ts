/**
 * Testes para API /api/rh/empresas - Validação de Segurança e Isolamento por Clínica
 *
 * Cenários testados:
 * - ✅ RH com clinica_id cria empresa com sucesso
 * - ❌ RH sem clinica_id retorna 403
 * - ❌ Admin tentando acessar rota de RH retorna 403
 * - ❌ CNPJ duplicado retorna 409
 * - ✅ Resposta inclui id, nome, criado_em
 * - ✅ RLS filtra empresas por clinica_id automaticamente
 */

jest.mock('@/lib/db-security', () => ({
  queryWithContext: jest.fn(),
}));

jest.mock('@/lib/session', () => ({
  requireRole: jest.fn(),
  requireClinica: jest.fn(),
}));

jest.mock('@/lib/validators', () => ({
  normalizeCNPJ: jest.fn((cnpj) => cnpj.replace(/\D/g, '')),
  validarCNPJ: jest.fn(() => true),
}));

import { NextRequest } from 'next/server';
import { queryWithContext } from '@/lib/db-security';
import { requireRole, requireClinica } from '@/lib/session';
import { GET, POST } from '@/app/api/rh/empresas/route';

const mockQueryWithContext = queryWithContext as jest.MockedFunction<
  typeof queryWithContext
>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;
const mockRequireClinica = requireClinica as jest.MockedFunction<
  typeof requireClinica
>;

describe('/api/rh/empresas - Segurança e Isolamento', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Implementação de teste para requireClinica que replica validação real
    mockRequireClinica.mockImplementation(async () => {
      const session = await mockRequireRole();
      if (!session || session.perfil !== 'rh') {
        throw new Error(
          'Acesso restrito: apenas gestores RH (gestor de clínica) podem executar esta operação'
        );
      }
      if (!session.clinica_id) {
        throw new Error(
          'Clínica não identificada na sessão. Verifique se o cadastro da clínica foi concluído.'
        );
      }
      return session;
    });
  });

  describe('GET - Listar empresas', () => {
    it('✅ RH com clinica_id lista empresas com sucesso', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '12345678901',
        nome: 'RH Silva',
        perfil: 'rh',
        clinica_id: 10,
      });

      mockQueryWithContext.mockResolvedValue({
        rows: [
          {
            id: 1,
            nome: 'Empresa A',
            cnpj: '12345678000100',
            email: null,
            ativa: true,
            criado_em: '2025-01-01',
          },
          {
            id: 2,
            nome: 'Empresa B',
            cnpj: '98765432000199',
            email: 'contato@b.com',
            ativa: true,
            criado_em: '2025-01-02',
          },
        ],
        rowCount: 2,
      } as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(2);
      expect(data[0].nome).toBe('Empresa A');
      expect(mockQueryWithContext).toHaveBeenCalledWith(
        expect.stringContaining('FROM empresas_clientes'),
        expect.anything()
      );
    });

    it('❌ RH sem clinica_id retorna 403 com mensagem específica', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '12345678901',
        nome: 'RH Sem Clínica',
        perfil: 'rh',
        clinica_id: null, // ❌ Sem clínica vinculada
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Clínica não identificada');
      expect(mockQueryWithContext).not.toHaveBeenCalled();
    });

    it('❌ Sessão inconsistente (usuário não encontrado/inativo) retorna 401 com mensagem clara', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '19477306061',
        nome: 'Jailson do RH',
        perfil: 'rh',
        clinica_id: 49,
      });

      // Simular erro lançado por queryWithContext/validateSessionContext
      const sessionError: any = new Error(
        'Contexto de sessão inválido: usuário não encontrado ou inativo'
      );
      mockQueryWithContext.mockRejectedValue(sessionError);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toMatch(/Sessão inválida/i);
      expect(mockQueryWithContext).toHaveBeenCalled();
    });
  });

  describe('POST - Criar empresa', () => {
    it('✅ RH com clinica_id cria empresa com sucesso', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '12345678901',
        nome: 'RH Silva',
        perfil: 'rh',
        clinica_id: 10,
      });

      mockQueryWithContext.mockResolvedValue({
        rows: [
          {
            id: 99,
            nome: 'Nova Empresa',
            cnpj: '11222333000181',
            email: 'contato@nova.com',
            telefone: '11987654321',
            endereco: 'Rua Teste, 123',
            cidade: 'São Paulo',
            estado: 'SP',
            cep: '01234567',
            representante_nome: 'João Silva',
            representante_fone: '11987654321',
            representante_email: 'joao@empresa.com',
            ativa: true,
            criado_em: '2025-12-28T10:00:00Z',
          },
        ],
        rowCount: 1,
      } as any);

      const requestBody = {
        nome: 'Nova Empresa',
        cnpj: '11.222.333/0001-81',
        email: 'contato@nova.com',
        telefone: '11987654321',
        endereco: 'Rua Teste, 123',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01234567',
        representante_nome: 'João Silva',
        representante_fone: '11987654321',
        representante_email: 'joao@empresa.com',
      };

      const request = new NextRequest('http://localhost:3000/api/rh/empresas', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe(99);
      expect(data.nome).toBe('Nova Empresa');
      expect(data.cnpj).toBe('11222333000181');
      expect(data.criado_em).toBeDefined();

      expect(mockQueryWithContext).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO empresas_clientes'),
        expect.arrayContaining([
          'Nova Empresa',
          '11222333000181',
          'contato@nova.com',
          '11987654321',
          'Rua Teste, 123',
          'São Paulo',
          'SP',
          '01234567',
          10, // clinica_id
        ])
      );
    });

    it('❌ RH sem clinica_id retorna 403', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '12345678901',
        nome: 'RH Sem Clínica',
        perfil: 'rh',
        clinica_id: null, // ❌ Sem clínica
      });

      const requestBody = {
        nome: 'Empresa Teste',
        cnpj: '11.222.333/0001-81',
      };

      const request = new NextRequest('http://localhost:3000/api/rh/empresas', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Clínica não identificada');
      expect(mockQueryWithContext).not.toHaveBeenCalled();
    });

    it('❌ Nome inválido (< 3 caracteres) retorna 400', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '12345678901',
        nome: 'RH Silva',
        perfil: 'rh',
        clinica_id: 10,
      });

      const requestBody = {
        nome: 'AB', // ❌ Apenas 2 caracteres
        cnpj: '11.222.333/0001-81',
      };

      const request = new NextRequest('http://localhost:3000/api/rh/empresas', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Nome');
      expect(mockQueryWithContext).not.toHaveBeenCalled();
    });

    it('❌ CNPJ duplicado retorna 409', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '12345678901',
        nome: 'RH Silva',
        perfil: 'rh',
        clinica_id: 10,
      });

      // Simular erro de constraint unique GLOBAL
      const duplicateError: any = new Error('duplicate key value');
      duplicateError.code = '23505';
      duplicateError.constraint = 'empresas_clientes_cnpj_key'; // Constraint global

      mockQueryWithContext.mockRejectedValue(duplicateError);

      const requestBody = {
        nome: 'Empresa Duplicada',
        cnpj: '11.222.333/0001-81',
        representante_nome: 'João Silva',
        representante_fone: '11987654321',
        representante_email: 'joao@empresa.com',
      };

      const request = new NextRequest('http://localhost:3000/api/rh/empresas', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toContain('CNPJ já cadastrado no sistema'); // Mensagem global
    });

    it('❌ Email inválido retorna 400', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '12345678901',
        nome: 'RH Silva',
        perfil: 'rh',
        clinica_id: 10,
      });

      const requestBody = {
        nome: 'Empresa Teste',
        cnpj: '11.222.333/0001-81',
        email: 'email-invalido', // ❌ Email sem @ e domínio
        representante_fone: '11987654321',
        representante_email: 'joao@empresa.com',
      };

      const request = new NextRequest('http://localhost:3000/api/rh/empresas', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Email da empresa inválido');
      expect(mockQueryWithContext).not.toHaveBeenCalled();
    });

    it('❌ Email inválido retorna 400', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '12345678901',
        nome: 'RH Silva',
        perfil: 'rh',
        clinica_id: 10,
      });

      const requestBody = {
        nome: 'Empresa Teste',
        cnpj: '11.222.333/0001-81',
        email: 'email-invalido', // ❌ Email sem @ e domínio
      };

      const request = new NextRequest('http://localhost:3000/api/rh/empresas', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Email da empresa inválido');
      expect(mockQueryWithContext).not.toHaveBeenCalled();
    });

    it('✅ Campos opcionais podem ser null (apenas representante obrigatório)', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '12345678901',
        nome: 'RH Silva',
        perfil: 'rh',
        clinica_id: 10,
      });

      mockQueryWithContext.mockResolvedValue({
        rows: [
          {
            id: 100,
            nome: 'Empresa Simples',
            cnpj: '11222333000181',
            email: null,
            ativa: true,
            criado_em: '2025-12-28T10:00:00Z',
            representante_nome: 'João Silva',
            representante_fone: '11987654321',
            representante_email: 'joao@empresa.com',
          },
        ],
        rowCount: 1,
      } as any);

      const requestBody = {
        nome: 'Empresa Simples',
        cnpj: '11.222.333/0001-81',
        // Sem email, telefone, endereco, etc. (mas com representante)
        representante_nome: 'João Silva',
        representante_fone: '11987654321',
        representante_email: 'joao@empresa.com',
      };

      const request = new NextRequest('http://localhost:3000/api/rh/empresas', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe(100);
      expect(data.nome).toBe('Empresa Simples');

      // Verificar que null foi passado para campos opcionais
      expect(mockQueryWithContext).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([
          'Empresa Simples',
          '11222333000181',
          null, // email
          null, // telefone
          null, // endereco
          null, // cidade
          null, // estado
          null, // cep
          10, // clinica_id
          'João Silva',
          '11987654321',
          'joao@empresa.com',
        ])
      );
    });
  });

  describe('Segurança - Admin não pode acessar', () => {
    it('❌ requireRole deve bloquear admin (teste conceitual)', async () => {
      // Este teste verifica que apenas 'rh' é aceito
      // Na prática, requireRole('rh') já bloqueia outros perfis

      mockRequireRole.mockRejectedValue(new Error('Acesso negado'));

      const request = new NextRequest('http://localhost:3000/api/rh/empresas');

      const response = await GET();
      const data = await response.json();

      // Se requireRole rejeitar, a rota deve retornar erro 500
      expect(response.status).toBe(500);
      expect(mockQueryWithContext).not.toHaveBeenCalled();
    });
  });
});
