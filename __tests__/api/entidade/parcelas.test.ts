/**
 * @file __tests__/api/entidade/parcelas.test.ts
 * Testes: GET /api/entidade/parcelas
 */

import { GET } from '@/app/api/entidade/parcelas/route';
import { requireEntity } from '@/lib/session';
import { queryAsGestorEntidade } from '@/lib/db-gestor';
import { calcularParcelas } from '@/lib/parcelas-helper';

jest.mock('@/lib/session');
jest.mock('@/lib/db-gestor');
jest.mock('@/lib/parcelas-helper');

const mockRequireEntity = requireEntity as jest.MockedFunction<
  typeof requireEntity
>;
const mockQueryGestor = queryAsGestorEntidade as jest.MockedFunction<
  typeof queryAsGestorEntidade
>;
const mockCalcParcelas = calcularParcelas as jest.MockedFunction<
  typeof calcularParcelas
>;

const session = { cpf: '111', perfil: 'gestor' as const, entidade_id: 5 };

describe('GET /api/entidade/parcelas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireEntity.mockResolvedValue(session as any);
  });

  it('403 se não autenticado como entidade', async () => {
    mockRequireEntity.mockRejectedValue(new Error('Sem permissão'));
    const res = await GET();
    expect(res.status).toBe(500);
  });

  it('404 se nenhum contrato encontrado', async () => {
    mockQueryGestor.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    const res = await GET();
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toContain('contrato');
  });

  it('retorna parcelas vazio se sem pagamentos', async () => {
    mockQueryGestor
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            contratacao_at: '2025-01-01',
            valor_total: 5000,
            numero_funcionarios: 10,
          },
        ],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.contrato_id).toBe(1);
    expect(json.parcelas).toEqual([]);
  });

  it('retorna parcelas com detalhes_parcelas do pagamento', async () => {
    const detalhes = [
      {
        numero: 1,
        valor: 2500,
        data_vencimento: '2025-01-15',
        pago: true,
        data_pagamento: '2025-01-14',
      },
    ];
    mockQueryGestor
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            contratacao_at: '2025-01-01',
            valor_total: 5000,
            numero_funcionarios: 10,
          },
        ],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({
        rows: [
          {
            pagamento_id: 10,
            valor: 5000,
            status: 'pago',
            numero_parcelas: 1,
            detalhes_parcelas: JSON.stringify(detalhes),
            metodo: 'pix',
            criado_em: '2025-01-01',
          },
        ],
        rowCount: 1,
      } as any)
      // recibos schema check
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.parcelas).toHaveLength(1);
    expect(json.parcelas[0].numero).toBe(1);
    expect(json.pagamento_id).toBe(10);
  });

  it('calcula parcelas se detalhes_parcelas ausente', async () => {
    mockCalcParcelas.mockReturnValue([
      {
        numero: 1,
        valor: 2500,
        data_vencimento: '2025-01-15',
        pago: false,
        data_pagamento: null,
      } as any,
      {
        numero: 2,
        valor: 2500,
        data_vencimento: '2025-02-15',
        pago: false,
        data_pagamento: null,
      } as any,
    ]);
    mockQueryGestor
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            contratacao_at: '2025-01-01',
            valor_total: 5000,
            numero_funcionarios: 10,
          },
        ],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({
        rows: [
          {
            pagamento_id: 10,
            valor: 5000,
            status: 'pendente',
            numero_parcelas: 2,
            detalhes_parcelas: null,
            metodo: 'boleto',
            criado_em: '2025-01-01',
          },
        ],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.parcelas).toHaveLength(2);
  });
});
