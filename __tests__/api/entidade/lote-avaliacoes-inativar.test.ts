/**
 * Testes para API /api/entidade/lote/[id]/avaliacoes/[avaliacaoId]/inativar
 * - Inativar avaliação específica dentro de um lote de entidade
 * - Validações de permissão e estado
 */

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('@/lib/db-gestor', () => ({
  queryAsGestorEntidade: jest.fn(),
}));

jest.mock('@/lib/session', () => ({
  getSession: jest.fn(),
  requireRole: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { queryAsGestorEntidade } from '@/lib/db-gestor';
import { getSession, requireRole } from '@/lib/session';
import { POST } from '@/app/api/entidade/lote/[id]/avaliacoes/[avaliacaoId]/inativar/route';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockQueryAsGestorEntidade = queryAsGestorEntidade as jest.MockedFunction<
  typeof queryAsGestorEntidade
>;
const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;

describe('/api/entidade/lote/[id]/avaliacoes/[avaliacaoId]/inativar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST - Inativar avaliação', () => {
    it('deve inativar avaliação com sucesso para gestor de entidade', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '11111111111',
        nome: 'Gestor Teste',
        perfil: 'gestor',
        entidade_id: 10,
      } as any);

      mockQuery
        .mockResolvedValueOnce({
          rows: [{ id: 1, entidade_id: 10, status: 'ativo', emitido_em: null }],
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

      mockQueryAsGestorEntidade.mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
      }); // UPDATE avaliação

      const request = new NextRequest(
        'http://localhost:3000/api/entidade/lote/1/avaliacoes/1/inativar',
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

      // Verifica se UPDATE da avaliação foi chamado via queryAsGestorEntidade
      expect(mockQueryAsGestorEntidade).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE avaliacoes'),
        expect.any(Array)
      );
    });

    it('deve validar motivo obrigatório', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '11111111111',
        nome: 'Gestor Teste',
        perfil: 'gestor',
        entidade_id: 10,
      } as any);

      const request = new NextRequest(
        'http://localhost:3000/api/entidade/lote/1/avaliacoes/1/inativar',
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
      mockRequireRole.mockResolvedValue({
        cpf: '11111111111',
        nome: 'Gestor Teste',
        perfil: 'gestor',
        entidade_id: 10,
      } as any);

      mockQuery
        .mockResolvedValueOnce({
          rows: [{ id: 1, entidade_id: 10, status: 'ativo', emitido_em: null }],
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
        'http://localhost:3000/api/entidade/lote/1/avaliacoes/1/inativar',
        {
          method: 'POST',
          body: JSON.stringify({
            motivo: 'Motivo qualquer',
          }),
        }
      );

      const response = await POST(request, {
        params: { id: '1', avaliacaoId: '1' },
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Esta avaliação já está inativada');
    });

    it('deve rejeitar se emissão já foi solicitada', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '11111111111',
        nome: 'Gestor Teste',
        perfil: 'gestor',
        entidade_id: 10,
      } as any);

      mockQuery
        .mockResolvedValueOnce({
          rows: [{ id: 1, entidade_id: 10, status: 'ativo', emitido_em: null }],
          rowCount: 1,
        }) // lote check
        .mockResolvedValueOnce({
          rows: [{ count: '1' }],
          rowCount: 1,
        }); // emissão já solicitada

      const request = new NextRequest(
        'http://localhost:3000/api/entidade/lote/1/avaliacoes/1/inativar',
        {
          method: 'POST',
          body: JSON.stringify({
            motivo: 'Motivo qualquer',
          }),
        }
      );

      const response = await POST(request, {
        params: { id: '1', avaliacaoId: '1' },
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(
        'Não é possível inativar avaliações: emissão do laudo já foi solicitada (princípio da imutabilidade)'
      );
    });

    it('deve rejeitar se lote não pertence à entidade do gestor', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '11111111111',
        nome: 'Gestor Teste',
        perfil: 'gestor',
        entidade_id: 10,
      } as any);

      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      }); // lote não encontrado para esta entidade (JOIN filtra)

      const request = new NextRequest(
        'http://localhost:3000/api/entidade/lote/1/avaliacoes/1/inativar',
        {
          method: 'POST',
          body: JSON.stringify({
            motivo: 'Motivo qualquer',
          }),
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

    it('deve rejeitar quando lote não existe', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '11111111111',
        nome: 'Gestor Teste',
        perfil: 'gestor',
        entidade_id: 10,
      } as any);

      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      }); // lote não encontrado

      const request = new NextRequest(
        'http://localhost:3000/api/entidade/lote/999/avaliacoes/1/inativar',
        {
          method: 'POST',
          body: JSON.stringify({
            motivo: 'Motivo qualquer',
          }),
        }
      );

      const response = await POST(request, {
        params: { id: '999', avaliacaoId: '1' },
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe(
        'Lote não encontrado ou você não tem permissão para acessá-lo'
      );
    });

    it('deve rejeitar quando avaliação não existe', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '11111111111',
        nome: 'Gestor Teste',
        perfil: 'gestor',
        entidade_id: 10,
      } as any);

      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              id: 1,
              entidade_id: 10,
              clinica_id: null,
              status: 'ativo',
              emitido_em: null,
            },
          ],
          rowCount: 1,
        }) // lote check
        .mockResolvedValueOnce({
          rows: [{ count: '0' }],
          rowCount: 1,
        }) // emissão não solicitada
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
        }); // avaliação não encontrada

      const request = new NextRequest(
        'http://localhost:3000/api/entidade/lote/1/avaliacoes/999/inativar',
        {
          method: 'POST',
          body: JSON.stringify({
            motivo: 'Motivo qualquer',
          }),
        }
      );

      const response = await POST(request, {
        params: { id: '1', avaliacaoId: '999' },
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Avaliação não encontrada neste lote');
    });

    it('deve permitir inativar avaliação concluída se emissão não foi solicitada', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '11111111111',
        nome: 'Gestor Teste',
        perfil: 'gestor',
        entidade_id: 10,
      } as any);

      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              id: 1,
              entidade_id: 10,
              clinica_id: null,
              status: 'ativo',
              emitido_em: null,
            },
          ],
          rowCount: 1,
        }) // lote check
        .mockResolvedValueOnce({
          rows: [{ count: '0' }],
          rowCount: 1,
        }) // emissão não solicitada
        .mockResolvedValueOnce({
          rows: [
            {
              id: 2,
              status: 'concluido',
              funcionario_cpf: '98765432100',
              funcionario_nome: 'Maria Santos',
            },
          ],
          rowCount: 1,
        }) // avaliação concluída
        .mockResolvedValueOnce({
          rows: [
            {
              total_avaliacoes: '3',
              ativas: '2',
              concluidas: '2',
              inativadas: '1',
              liberadas: '3',
            },
          ],
          rowCount: 1,
        }) // stats
        .mockResolvedValueOnce({ rows: [{ status: 'ativo' }], rowCount: 1 }); // status lote

      mockQueryAsGestorEntidade.mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
      }); // UPDATE

      const request = new NextRequest(
        'http://localhost:3000/api/entidade/lote/1/avaliacoes/2/inativar',
        {
          method: 'POST',
          body: JSON.stringify({
            motivo: 'Dados informados incorretamente',
          }),
        }
      );

      const response = await POST(request, {
        params: { id: '1', avaliacaoId: '2' },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('Avaliação inativada com sucesso');
    });

    it('deve rejeitar inativação quando usuário não tem perfil gestor', async () => {
      mockRequireRole.mockRejectedValue(new Error('Sem permissão'));

      const request = new NextRequest(
        'http://localhost:3000/api/entidade/lote/1/avaliacoes/1/inativar',
        {
          method: 'POST',
          body: JSON.stringify({
            motivo: 'Motivo qualquer',
          }),
        }
      );

      const response = await POST(request, {
        params: { id: '1', avaliacaoId: '1' },
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('deve rejeitar quando sessão não existe', async () => {
      mockRequireRole.mockRejectedValue(new Error('Não autenticado'));

      const request = new NextRequest(
        'http://localhost:3000/api/entidade/lote/1/avaliacoes/1/inativar',
        {
          method: 'POST',
          body: JSON.stringify({
            motivo: 'Motivo qualquer',
          }),
        }
      );

      const response = await POST(request, {
        params: { id: '1', avaliacaoId: '1' },
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });
});
