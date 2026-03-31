/**
 * @file __tests__/api/entidade/pagamentos-laudos.test.ts
 * Testes: GET /api/entidade/pagamentos-laudos
 */

import { GET } from '@/app/api/entidade/pagamentos-laudos/route';
import { requireEntity } from '@/lib/session';
import { queryAsGestorEntidade } from '@/lib/db-gestor';

jest.mock('@/lib/session');
jest.mock('@/lib/db-gestor');

const mockRequireEntity = requireEntity as jest.MockedFunction<
  typeof requireEntity
>;
const mockQueryGestor = queryAsGestorEntidade as jest.MockedFunction<
  typeof queryAsGestorEntidade
>;

describe('GET /api/entidade/pagamentos-laudos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireEntity.mockResolvedValue({
      cpf: '111',
      perfil: 'gestor',
      entidade_id: 5,
    } as any);
  });

  it('retorna lista de pagamentos com laudos', async () => {
    mockQueryGestor.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          valor: '5000',
          metodo: 'pix',
          status: 'pago',
          numero_parcelas: 1,
          detalhes_parcelas: null,
          numero_funcionarios: 10,
          valor_por_funcionario: 500,
          recibo_numero: null,
          recibo_url: null,
          data_pagamento: '2025-01-15',
          data_confirmacao: '2025-01-15',
          criado_em: '2025-01-01',
          contrato_id: 10,
          lote_id: 20,
          lote_codigo: 'L001',
          lote_numero: 1,
          laudo_id: 30,
        },
      ],
      rowCount: 1,
    } as any);

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.pagamentos).toHaveLength(1);
    expect(json.pagamentos[0].id).toBe(1);
  });

  it('retorna vazio se sem pagamentos', async () => {
    mockQueryGestor.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.pagamentos).toEqual([]);
  });

  it('500 em caso de erro', async () => {
    mockRequireEntity.mockRejectedValue(new Error('fail'));
    const res = await GET();
    expect(res.status).toBe(500);
  });

  it('usa la.entidade_id (não la.contratante_id) na query SQL de lotes', async () => {
    // Valida fix crítico: SQL deve usar la.entidade_id após refactoring contratante→tomador
    mockRequireEntity.mockResolvedValueOnce({
      cpf: '111',
      perfil: 'gestor',
      entidade_id: 5,
    } as any);
    mockQueryGestor.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    await GET();

    const [sqlQuery] = mockQueryGestor.mock.calls[0];
    expect(String(sqlQuery)).toContain('la.entidade_id = p.entidade_id');
    expect(String(sqlQuery)).not.toContain('la.contratante_id');
  });
});
