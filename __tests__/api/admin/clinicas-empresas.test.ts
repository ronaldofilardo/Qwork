/**
 * @file __tests__/api/admin/clinicas-empresas.test.ts
 * Testes: GET /api/admin/clinicas/[id]/empresas
 *
 * Valida autorização de suporte, admin e comercial
 * Valida que comercial recebe dados limitados (sem contagens de avaliações)
 */

import { GET } from '@/app/api/admin/clinicas/[id]/empresas/route';
import { query } from '@/lib/db';
import { requireRole, getSession } from '@/lib/session';
import { NextRequest } from 'next/server';

jest.mock('@/lib/db');
jest.mock('@/lib/session');

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;
const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;

describe('GET /api/admin/clinicas/[id]/empresas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const makeRequest = (id: string = '1'): NextRequest => {
    return new NextRequest(
      new URL(`http://localhost:3000/api/admin/clinicas/${id}/empresas`)
    );
  };

  describe('Autorização', () => {
    it('✅ deve permitir admin listar empresas', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '11111111111',
        nome: 'Admin Teste',
        perfil: 'admin',
      });

      mockGetSession.mockReturnValue({
        cpf: '11111111111',
        nome: 'Admin Teste',
        perfil: 'admin',
      } as any);

      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, nome: 'Clínica Teste' }],
      } as any);

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            nome: 'Empresa A',
            cnpj: '12345678000100',
            email: 'a@test.com',
            telefone: '1133334444',
            cidade: 'São Paulo',
            estado: 'SP',
            ativa: true,
            criado_em: '2025-01-01',
            total_funcionarios: '5',
            total_avaliacoes: '10',
            avaliacoes_concluidas: '8',
            avaliacoes_liberadas: '2',
          },
        ],
      } as any);

      const response = await GET(makeRequest(), {
        params: { id: '1' },
      } as any);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.empresas[0]).toHaveProperty('total_funcionarios');
      expect(data.empresas[0]).toHaveProperty('total_avaliacoes');
      expect(mockRequireRole).toHaveBeenCalledWith(
        ['suporte', 'admin', 'comercial'],
        false
      );
    });

    it('✅ deve permitir suporte listar empresas', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '22222222222',
        nome: 'Suporte Teste',
        perfil: 'suporte',
      });

      mockGetSession.mockReturnValue({
        cpf: '22222222222',
        nome: 'Suporte Teste',
        perfil: 'suporte',
      } as any);

      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, nome: 'Clínica Teste' }],
      } as any);

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            nome: 'Empresa B',
            cnpj: '98765432000199',
            email: 'b@test.com',
            telefone: '1155556666',
            cidade: 'Rio de Janeiro',
            estado: 'RJ',
            ativa: true,
            criado_em: '2025-02-01',
            total_funcionarios: '15',
            total_avaliacoes: '30',
            avaliacoes_concluidas: '25',
            avaliacoes_liberadas: '5',
          },
        ],
      } as any);

      const response = await GET(makeRequest(), {
        params: { id: '1' },
      } as any);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.empresas[0]).toHaveProperty('total_funcionarios');
    });

    it('✅ deve permitir comercial listar empresas (dados limitados)', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '33333333333',
        nome: 'Comercial Teste',
        perfil: 'comercial',
      });

      mockGetSession.mockReturnValue({
        cpf: '33333333333',
        nome: 'Comercial Teste',
        perfil: 'comercial',
      } as any);

      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, nome: 'Clínica Teste' }],
      } as any);

      // Comercial recebe query simples sem JOINs
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            nome: 'Empresa C',
            cnpj: '11223344000155',
            email: 'c@test.com',
            telefone: '1177778888',
            cidade: 'Belo Horizonte',
            estado: 'MG',
            ativa: true,
            criado_em: '2025-03-01',
          },
        ],
      } as any);

      const response = await GET(makeRequest(), {
        params: { id: '1' },
      } as any);

      expect(response.status).toBe(200);
      const data = await response.json();

      // Verificar que comercial não recebeu contagens sensíveis
      expect(data.empresas[0]).not.toHaveProperty('total_funcionarios');
      expect(data.empresas[0]).not.toHaveProperty('total_avaliacoes');
      expect(data.empresas[0]).not.toHaveProperty('avaliacoes_concluidas');
      expect(data.empresas[0]).not.toHaveProperty('avaliacoes_liberadas');

      // Mas deve receber dados corporativos
      expect(data.empresas[0]).toHaveProperty('nome');
      expect(data.empresas[0]).toHaveProperty('cnpj');
      expect(data.empresas[0]).toHaveProperty('email');
    });

    it('❌ deve retornar 403 se não for autorizado', async () => {
      mockRequireRole.mockRejectedValue(new Error('Sem permissão'));

      const response = await GET(makeRequest(), {
        params: { id: '1' },
      } as any);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('Acesso negado');
    });
  });

  describe('Validação de Entrada', () => {
    it('❌ deve retornar 400 se clinicaId for inválido', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '11111111111',
        perfil: 'admin',
      });

      mockGetSession.mockReturnValue({
        cpf: '11111111111',
        perfil: 'admin',
      } as any);

      const response = await GET(makeRequest('abc'), {
        params: { id: 'abc' },
      } as any);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('ID da clínica inválido');
    });

    it('❌ deve retornar 404 se clínica não existir', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '11111111111',
        perfil: 'admin',
      });

      mockGetSession.mockReturnValue({
        cpf: '11111111111',
        perfil: 'admin',
      } as any);

      mockQuery.mockResolvedValueOnce({
        rows: [],
      } as any);

      const response = await GET(makeRequest('999'), {
        params: { id: '999' },
      } as any);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Clínica não encontrada');
    });

    it('❌ deve retornar 401 se sessão não existir', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '11111111111',
        perfil: 'admin',
      });

      mockGetSession.mockReturnValue(null);

      const response = await GET(makeRequest(), {
        params: { id: '1' },
      } as any);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Sessão não encontrada');
    });
  });

  describe('Dados Retornados', () => {
    it('✅ admin recebe todas as estatísticas', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '11111111111',
        perfil: 'admin',
      });

      mockGetSession.mockReturnValue({
        cpf: '11111111111',
        perfil: 'admin',
      } as any);

      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, nome: 'Clínica A' }],
      } as any);

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 100,
            nome: 'Empresa Full Stats',
            cnpj: '12345678000100',
            email: 'full@test.com',
            telefone: '1111111111',
            cidade: 'SP',
            estado: 'SP',
            ativa: true,
            criado_em: '2025-01-01',
            total_funcionarios: '20',
            total_avaliacoes: '50',
            avaliacoes_concluidas: '45',
            avaliacoes_liberadas: '5',
          },
        ],
      } as any);

      const response = await GET(makeRequest(), {
        params: { id: '1' },
      } as any);

      expect(response.status).toBe(200);
      const data = await response.json();
      const empresa = data.empresas[0];

      expect(empresa.id).toBe(100);
      expect(empresa.nome).toBe('Empresa Full Stats');
      expect(empresa.total_funcionarios).toBe(20);
      expect(empresa.total_avaliacoes).toBe(50);
      expect(empresa.avaliacoes_concluidas).toBe(45);
      expect(empresa.avaliacoes_liberadas).toBe(5);
    });

    it('✅ comercial recebe apenas dados corporativos', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '44444444444',
        perfil: 'comercial',
      });

      mockGetSession.mockReturnValue({
        cpf: '44444444444',
        perfil: 'comercial',
      } as any);

      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 2, nome: 'Clínica B' }],
      } as any);

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 200,
            nome: 'Empresa Limited Info',
            cnpj: '98765432000199',
            email: 'limited@test.com',
            telefone: '2222222222',
            cidade: 'RJ',
            estado: 'RJ',
            ativa: true,
            criado_em: '2025-02-01',
          },
        ],
      } as any);

      const response = await GET(makeRequest('2'), {
        params: { id: '2' },
      } as any);

      expect(response.status).toBe(200);
      const data = await response.json();
      const empresa = data.empresas[0];

      expect(empresa.id).toBe(200);
      expect(empresa.nome).toBe('Empresa Limited Info');
      expect(empresa.cnpj).toBe('98765432000199');
      expect(empresa.email).toBe('limited@test.com');

      // Garantir que contagens não foram incluídas
      expect(empresa.total_funcionarios).toBeUndefined();
      expect(empresa.total_avaliacoes).toBeUndefined();
      expect(empresa.avaliacoes_concluidas).toBeUndefined();
      expect(empresa.avaliacoes_liberadas).toBeUndefined();
    });
  });
});
