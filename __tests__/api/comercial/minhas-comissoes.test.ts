/**
 * @fileoverview Testes da API GET /api/comercial/minhas-comissoes
 * @description Comissoes do comercial foram removidas do sistema (migration 1233).
 * A rota retorna estrutura vazia para compatibilidade com frontend legado.
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/comercial/minhas-comissoes/route';
import { requireRole } from '@/lib/session';

jest.mock('@/lib/session');

const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;

const comercialSession = {
  cpf: '22222222222',
  nome: 'Comercial Dev',
  perfil: 'comercial',
};

function makeRequest(url = 'http://localhost/api/comercial/minhas-comissoes') {
  return new NextRequest(url);
}

describe('GET /api/comercial/minhas-comissoes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue(comercialSession as any);
  });

  it('deve retornar 200 com lista vazia (comissoes removidas do sistema)', async () => {
    const res = await GET(makeRequest());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.comissoes).toHaveLength(0);
    expect(data.total).toBe(0);
  });

  it('deve retornar resumo com zeros (sem comissoes comercial)', async () => {
    const res = await GET(makeRequest());
    const data = await res.json();

    expect(data.resumo.total_laudos).toBe('0');
    expect(data.resumo.total_recebido).toBe('0');
    expect(data.resumo.valor_pendente).toBe('0');
    expect(data.resumo.valor_liberado).toBe('0');
  });

  it('deve retornar paginacao padrao', async () => {
    const res = await GET(makeRequest());
    const data = await res.json();

    expect(data.page).toBe(1);
    expect(data.limit).toBe(30);
  });

  it('deve retornar 403 quando usuario nao e comercial', async () => {
    mockRequireRole.mockRejectedValueOnce(new Error('Sem permissão'));

    const res = await GET(makeRequest());
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe('Acesso negado');
  });
});
