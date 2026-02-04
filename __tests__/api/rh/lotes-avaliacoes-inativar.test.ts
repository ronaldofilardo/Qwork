/**
 * Testes para API /api/rh/lotes/[id]/avaliacoes/[avaliacaoId]/inativar
 * - Inativar avaliação específica dentro de um lote
 * - Validações de permissão e estado
 */

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('@/lib/db-gestor', () => ({
  queryAsGestorRH: jest.fn(),
}));

jest.mock('@/lib/session', () => ({
  requireAuth: jest.fn(),
  requireRHWithEmpresaAccess: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { queryAsGestorRH } from '@/lib/db-gestor';
import { requireAuth, requireRHWithEmpresaAccess } from '@/lib/session';
import { POST } from '@/app/api/rh/lotes/[id]/avaliacoes/[avaliacaoId]/inativar/route';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockQueryAsGestorRH = queryAsGestorRH as jest.MockedFunction<
  typeof queryAsGestorRH
>;
const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
const mockRequireRHWithEmpresaAccess =
  requireRHWithEmpresaAccess as jest.MockedFunction<
    typeof requireRHWithEmpresaAccess
  >;

describe('/api/rh/lotes/[id]/avaliacoes/[avaliacaoId]/inativar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST - Inativar avaliação', () => {
    it('deve inativar avaliação com sucesso', async () => {
      mockRequireAuth.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh',
      });
      mockRequireRHWithEmpresaAccess.mockResolvedValue(undefined);

      mockQuery
        .mockResolvedValueOnce({
          rows: [{ id: 1, empresa_id: 1, status: 'ativo', emitido_em: null }],
          rowCount: 1,
        }) // lote check
        .mockResolvedValueOnce({
          rows: [{ count: '0' }],
          rowCount: 1,
        }) // emissão não solicitada
        .mockResolvedValueOnce({
          rows: [
            {
              id: 1,
              status: 'em_andamento',
              funcionario_cpf: '12345678901',
              funcionario_nome: 'João Silva',
            },
          ],
          rowCount: 1,
        }) // avaliação check
        .mockResolvedValueOnce({
          rows: [
            {
              total_avaliacoes: '5',
              ativas: '4',
              concluidas: '3',
              inativadas: '1',
              liberadas: '5',
            },
          ],
          rowCount: 1,
        }) // stats para recálculo
        .mockResolvedValueOnce({ rows: [{ status: 'ativo' }], rowCount: 1 }); // status atual do lote

      mockQueryAsGestorRH.mockResolvedValueOnce({ rows: [], rowCount: 1 }); // UPDATE avaliação

      const request = new NextRequest(
        'http://localhost:3000/api/rh/lotes/1/avaliacoes/1/inativar',
        {
          method: 'POST',
          body: JSON.stringify({
            motivo: 'Funcionário não consegue concluir a avaliação',
          }),
        }
      );

      const response = await POST(request, {
        params: { id: '1', avaliacaoId: '1' },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Avaliação inativada com sucesso');
      expect(data.avaliacao).toEqual({
        id: '1',
        funcionario_cpf: '12345678901',
        funcionario_nome: 'João Silva',
        status: 'inativada',
      });
      expect(data.lote_concluido).toBe(false);

      // Verifica se UPDATE da avaliação foi chamado via queryAsGestorRH
      expect(mockQueryAsGestorRH).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE avaliacoes'),
        expect.any(Array)
      );
    });

    it('deve validar motivo obrigatório', async () => {
      mockRequireAuth.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh',
      });

      const request = new NextRequest(
        'http://localhost:3000/api/rh/lotes/1/avaliacoes/1/inativar',
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      );

      const response = await POST(request, {
        params: { id: '1', avaliacaoId: '1' },
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Motivo é obrigatório');
    });

    it('deve rejeitar avaliação já inativada', async () => {
      mockRequireAuth.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh',
      });
      mockRequireRHWithEmpresaAccess.mockResolvedValue(undefined);

      mockQuery
        .mockResolvedValueOnce({
          rows: [{ id: 1, empresa_id: 1, status: 'ativo', emitido_em: null }],
          rowCount: 1,
        }) // lote check
        .mockResolvedValueOnce({
          rows: [{ count: '0' }],
          rowCount: 1,
        }) // emissão não solicitada
        .mockResolvedValueOnce({
          rows: [
            {
              id: 1,
              status: 'inativada',
              funcionario_cpf: '12345678901',
              funcionario_nome: 'João Silva',
            },
          ],
          rowCount: 1,
        }); // avaliação já inativada

      const request = new NextRequest(
        'http://localhost:3000/api/rh/lotes/1/avaliacoes/1/inativar',
        {
          method: 'POST',
          body: JSON.stringify({ motivo: 'Teste' }),
        }
      );

      const response = await POST(request, {
        params: { id: '1', avaliacaoId: '1' },
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Esta avaliação já está inativada');
    });

    it('deve permitir inativar avaliação concluída se emissão não foi solicitada', async () => {
      mockRequireAuth.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh',
      });
      mockRequireRHWithEmpresaAccess.mockResolvedValue(undefined);

      mockQuery
        .mockResolvedValueOnce({
          rows: [{ id: 1, empresa_id: 1, status: 'ativo', emitido_em: null }],
          rowCount: 1,
        }) // lote check
        .mockResolvedValueOnce({
          rows: [{ count: '0' }],
          rowCount: 1,
        }) // emissão não solicitada
        .mockResolvedValueOnce({
          rows: [
            {
              id: 1,
              status: 'concluida',
              funcionario_cpf: '12345678901',
              funcionario_nome: 'João Silva',
            },
          ],
          rowCount: 1,
        }) // avaliação concluída
        .mockResolvedValueOnce({
          rows: [
            {
              total_avaliacoes: '5',
              ativas: '4',
              concluidas: '3',
              inativadas: '1',
              liberadas: '5',
            },
          ],
          rowCount: 1,
        }) // stats para recálculo
        .mockResolvedValueOnce({ rows: [{ status: 'ativo' }], rowCount: 1 }); // status atual do lote

      mockQueryAsGestorRH.mockResolvedValueOnce({ rows: [], rowCount: 1 }); // UPDATE avaliação

      const request = new NextRequest(
        'http://localhost:3000/api/rh/lotes/1/avaliacoes/1/inativar',
        {
          method: 'POST',
          body: JSON.stringify({ motivo: 'Funcionário solicitou inativação' }),
        }
      );

      const response = await POST(request, {
        params: { id: '1', avaliacaoId: '1' },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Avaliação inativada com sucesso');
    });

    it('deve validar acesso apenas para perfil RH', async () => {
      mockRequireAuth.mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/rh/lotes/1/avaliacoes/1/inativar',
        {
          method: 'POST',
          body: JSON.stringify({ motivo: 'Teste' }),
        }
      );

      const response = await POST(request, {
        params: { id: '1', avaliacaoId: '1' },
      });

      expect(response.status).toBe(403);
      expect(mockRequireAuth).toHaveBeenCalled();
    });

    it('deve validar que lote pertence à clínica do RH', async () => {
      mockRequireAuth.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh',
      });
      mockRequireRHWithEmpresaAccess.mockResolvedValue(undefined);

      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // lote não encontrado

      const request = new NextRequest(
        'http://localhost:3000/api/rh/lotes/1/avaliacoes/1/inativar',
        {
          method: 'POST',
          body: JSON.stringify({ motivo: 'Teste' }),
        }
      );

      const response = await POST(request, {
        params: { id: '1', avaliacaoId: '1' },
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe(
        'Lote não encontrado ou você não tem permissão para acessá-lo'
      );
    });

    it('deve finalizar lote automaticamente quando for a última avaliação não concluída', async () => {
      mockRequireAuth.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh',
      });
      mockRequireRHWithEmpresaAccess.mockResolvedValue(undefined);

      mockQuery
        .mockResolvedValueOnce({
          rows: [{ id: 1, empresa_id: 1, status: 'ativo', emitido_em: null }],
          rowCount: 1,
        }) // lote check
        .mockResolvedValueOnce({ rows: [{ count: '0' }], rowCount: 1 }) // emissão não solicitada
        .mockResolvedValueOnce({
          rows: [
            {
              id: 1,
              status: 'em_andamento',
              funcionario_cpf: '12345678901',
              funcionario_nome: 'João Silva',
            },
          ],
          rowCount: 1,
        }) // avaliação check
        .mockResolvedValueOnce({
          rows: [
            {
              total_avaliacoes: '5',
              ativas: '0',
              concluidas: '4',
              inativadas: '1',
              liberadas: '5',
            },
          ],
          rowCount: 1,
        }) // stats para recálculo (concluídas + inativadas = liberadas)
        .mockResolvedValueOnce({ rows: [{ status: 'ativo' }], rowCount: 1 }) // status atual do lote
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // UPDATE lote para concluido

      mockQueryAsGestorRH.mockResolvedValueOnce({ rows: [], rowCount: 1 }); // UPDATE avaliação

      const request = new NextRequest(
        'http://localhost:3000/api/rh/lotes/1/avaliacoes/1/inativar',
        {
          method: 'POST',
          body: JSON.stringify({ motivo: 'Funcionário não consegue concluir' }),
        }
      );

      const response = await POST(request, {
        params: { id: '1', avaliacaoId: '1' },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe(
        'Avaliação inativada com sucesso. Como era a última avaliação não concluída, o lote foi automaticamente concluído e agendado para emissão!'
      );
      expect(data.lote_concluido).toBe(true);
      expect(data.avaliacao.status).toBe('inativada');

      // Verifica se pelo menos uma query de UPDATE do lote foi chamada
      const updateCalls = mockQuery.mock.calls.filter(
        (call) =>
          call[0] &&
          typeof call[0] === 'string' &&
          call[0].includes('UPDATE lotes_avaliacao')
      );
      expect(updateCalls.length).toBeGreaterThan(0);
    });

    it('deve validar que avaliação existe no lote', async () => {
      mockRequireAuth.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh',
      });
      mockRequireRHWithEmpresaAccess.mockResolvedValue(undefined);

      mockQuery
        .mockResolvedValueOnce({
          rows: [{ id: 1, empresa_id: 1, status: 'ativo', emitido_em: null }],
          rowCount: 1,
        }) // lote check
        .mockResolvedValueOnce({ rows: [{ count: '0' }], rowCount: 1 }) // emissão não solicitada
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // avaliação não encontrada

      const request = new NextRequest(
        'http://localhost:3000/api/rh/lotes/1/avaliacoes/1/inativar',
        {
          method: 'POST',
          body: JSON.stringify({ motivo: 'Teste' }),
        }
      );

      const response = await POST(request, {
        params: { id: '1', avaliacaoId: '1' },
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Avaliação não encontrada neste lote');
    });

    it('deve rejeitar inativação se lote já foi emitido', async () => {
      mockRequireAuth.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh',
      });
      mockRequireRHWithEmpresaAccess.mockResolvedValue(undefined);

      mockQuery
        .mockResolvedValueOnce({
          rows: [
            { id: 1, empresa_id: 1, status: 'ativo', emitido_em: new Date() },
          ],
          rowCount: 1,
        }) // lote check (já emitido)
        .mockResolvedValueOnce({
          rows: [{ count: '1' }],
          rowCount: 1,
        }); // emissão já solicitada

      const request = new NextRequest(
        'http://localhost:3000/api/rh/lotes/1/avaliacoes/1/inativar',
        {
          method: 'POST',
          body: JSON.stringify({ motivo: 'Teste' }),
        }
      );

      const response = await POST(request, {
        params: { id: '1', avaliacaoId: '1' },
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(
        'Não é possível inativar avaliações: emissão do laudo já foi solicitada ou laudo já foi emitido (princípio da imutabilidade)'
      );
    });
  });
});
