/**
 * Testes para APIs de contagem do dashboard da clínica
 * - /api/admin/empresas/[id]/funcionarios/count
 * - /api/admin/empresas/[id]/avaliacoes/pendentes/count
 */

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('@/lib/session', () => ({
  requireRole: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';
import { GET as getFuncionariosCount } from '@/app/api/admin/empresas/[id]/funcionarios/count/route';
import { GET as getAvaliacoesPendentesCount } from '@/app/api/admin/empresas/[id]/avaliacoes/pendentes/count/route';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;

describe('/api/admin/empresas/[id]/funcionarios/count', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET - Contar funcionários ativos', () => {
    it('deve retornar contagem correta de funcionários ativos para RH', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '00000000000',
        nome: 'RH Teste',
        perfil: 'rh',
        clinica_id: 1,
      });

      mockQuery
        .mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 }) // empresa check
        .mockResolvedValueOnce({ rows: [{ count: 25 }], rowCount: 1 }); // count result

      const request = new NextRequest(
        'http://localhost:3000/api/admin/empresas/1/funcionarios/count'
      );
      const response = await getFuncionariosCount(request, {
        params: { id: '1' },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.count).toBe(25);
    });

    it('deve retornar erro para empresa não encontrada', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '00000000000',
        nome: 'RH Teste',
        perfil: 'rh',
      });

      mockQuery.mockClear();
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // empresa not found

      const request = new NextRequest(
        'http://localhost:3000/api/admin/empresas/999/funcionarios/count'
      );
      const response = await getFuncionariosCount(request, {
        params: { id: '999' },
      });

      // Como empresa não existe, deve retornar 404
      expect(response.status).toBe(404);
    });

    it('deve retornar erro para acesso negado (RH sem permissão)', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '00000000000',
        nome: 'RH Teste',
        perfil: 'rh',
        clinica_id: 3,
      });

      mockQuery.mockResolvedValueOnce({
        rows: [{ clinica_id: 1 }],
        rowCount: 1,
      }); // empresa belongs to clinica 1

      const request = new NextRequest(
        'http://localhost:3000/api/admin/empresas/1/funcionarios/count'
      );
      const response = await getFuncionariosCount(request, {
        params: { id: '1' },
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Acesso negado');
    });

    it('deve retornar 403 se for admin (sem acesso operacional)', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '00000000000',
        nome: 'Admin Teste',
        perfil: 'admin',
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/empresas/1/funcionarios/count'
      );
      const response = await getFuncionariosCount(request, {
        params: { id: '1' },
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Acesso negado');
    });
  });
});

describe('/api/admin/empresas/[id]/avaliacoes/pendentes/count', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET - Contar avaliações pendentes', () => {
    it('deve retornar contagem correta de avaliações pendentes para RH', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '00000000000',
        nome: 'RH Teste',
        perfil: 'rh',
        clinica_id: 1,
      });

      mockQuery.mockReset();
      mockQuery
        .mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 }) // empresa check
        .mockResolvedValueOnce({ rows: [{ count: 6 }], rowCount: 1 }); // count result

      const request = new NextRequest(
        'http://localhost:3000/api/admin/empresas/1/avaliacoes/pendentes/count'
      );
      const response = await getAvaliacoesPendentesCount(request, {
        params: { id: '1' },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.count).toBe(6);
    });

    it('deve retornar 403 se for admin (sem acesso operacional)', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '00000000000',
        nome: 'Admin Teste',
        perfil: 'admin',
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/empresas/1/avaliacoes/pendentes/count'
      );
      const response = await getAvaliacoesPendentesCount(request, {
        params: { id: '1' },
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Acesso negado');
    });

    it('deve excluir avaliações concluídas e inativadas da contagem', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '00000000000',
        nome: 'RH Teste',
        perfil: 'rh',
      });

      mockQuery
        .mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [{ count: 3 }], rowCount: 1 });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/empresas/1/avaliacoes/pendentes/count'
      );
      const response = await getAvaliacoesPendentesCount(request, {
        params: { id: '1' },
      });

      expect(response.status).toBe(200);

      // Verifica que a query exclui concluídas e inativadas
      const queryCall = mockQuery.mock.calls[1];
      expect(queryCall[0]).toContain(
        "a.status NOT IN ('concluido', 'inativada')"
      );
    });

    it('deve incluir apenas funcionários ativos', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '00000000000',
        nome: 'RH Teste',
        perfil: 'rh',
      });

      mockQuery
        .mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [{ count: 2 }], rowCount: 1 });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/empresas/1/avaliacoes/pendentes/count'
      );
      const response = await getAvaliacoesPendentesCount(request, {
        params: { id: '1' },
      });

      expect(response.status).toBe(200);

      // Verifica que a query inclui apenas funcionários ativos
      const queryCall = mockQuery.mock.calls[1];
      expect(queryCall[0]).toContain('f.ativo = true');
    });
  });
});

