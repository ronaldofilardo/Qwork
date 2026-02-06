import { GET } from '@/app/api/entidade/account-info/route';
import '@testing-library/jest-dom';

jest.mock('@/lib/session', () => ({
  getSession: jest
    .fn()
    .mockReturnValue({ perfil: 'gestor', contratante_id: 99 }),
}));

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

import { query } from '@/lib/db';

describe('Entidade account-info plano fields', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns contrato enriched with plan/payment details', async () => {
    // Mock sequence: entidadeQuery, contratoQuery, pagamentosQuery
    (query as jest.Mock)
      // information_schema check (planos)
      .mockResolvedValueOnce({
        rows: [
          { column_name: 'preco' },
          { column_name: 'valor_por_funcionario' },
        ],
        rowCount: 2,
      })
      .mockResolvedValueOnce({
        // entidadeQuery
        rows: [
          {
            id: 99,
            nome: 'Entidade X',
            cnpj: '00',
            email: 'x@e',
            telefone: '1',
            endereco: 'r',
            cidade: 'C',
            estado: 'S',
            criado_em: new Date(),
          },
        ],
        rowCount: 1,
      })
      .mockResolvedValueOnce({
        // contratoQuery -> return empty to force fallback
        rows: [],
        rowCount: 0,
      })
      .mockResolvedValueOnce({
        // information_schema check (planos) for contratos_planos fallback
        rows: [
          { column_name: 'preco' },
          { column_name: 'valor_por_funcionario' },
        ],
        rowCount: 2,
      })
      .mockResolvedValueOnce({
        // contratos_planos fallback
        rows: [
          {
            id: 2,
            plano_id: 2,
            plano_nome: 'Plano Fixo',
            plano_tipo: 'fixo',
            plano_preco: '20.00',
            plano_valor_por_funcionario: null,
            plano_valor_base: null,
            plano_valor_fixo_anual: null,
            valor_total: '300.00',
            numero_funcionarios: 15,
            criado_em: new Date(),
          },
        ],
        rowCount: 1,
      })
      .mockResolvedValueOnce({
        // pagamentosQuery
        rows: [
          {
            id: 321,
            valor: '300.00',
            status: 'pago',
            numero_parcelas: 3,
            metodo: 'cartao',
            data_pagamento: new Date().toISOString(),
            plataforma_nome: 'cartao',
            detalhes_parcelas: null,
            criado_em: new Date(),
          },
        ],
        rowCount: 1,
      })
      .mockResolvedValueOnce({
        // information_schema check (recibos)
        rows: [{ column_name: 'criado_em' }],
        rowCount: 1,
      })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // possible recibo lookup returns empty

    const resp = await GET();
    const data = await resp.json();

    expect(data).toBeDefined();
    expect(data.contrato).toBeDefined();
    expect(data.contrato.plano_nome).toBe('Plano Fixo');
    expect(data.contrato.valor_total).toBe(300);
    expect(data.contrato.numero_funcionarios).toBe(15);

    expect(Array.isArray(data.pagamentos)).toBe(true);
    expect(data.pagamentos[0].metodo).toBe('cartao');

    // Resumo financeiro calculado
    expect(data.contrato.pagamento_resumo).toBeDefined();
    expect(typeof data.contrato.pagamento_resumo.totalPago).toBe('number');
    expect(data.contrato.pagamento_resumo.percentual).toBeDefined();
  });

  it('marca contrato como em_aberto quando apenas primeira parcela paga (parcelado)', async () => {
    (query as jest.Mock)
      // information_schema check (planos)
      .mockResolvedValueOnce({ rows: [{ column_name: 'preco' }], rowCount: 1 })
      .mockResolvedValueOnce({
        // entidadeQuery
        rows: [
          {
            id: 88,
            nome: 'Entidade Parcela',
            cnpj: '00',
            email: 'p@e',
            telefone: null,
            endereco: null,
            cidade: null,
            estado: null,
            criado_em: new Date(),
          },
        ],
        rowCount: 1,
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 77,
            plano_id: 1,
            plano_nome: 'Fixo',
            plano_tipo: 'fixo',
            valor_total: '2000.00',
            numero_funcionarios: 10,
            criado_em: new Date(),
          },
        ],
        rowCount: 1,
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 200,
            valor: '2000.00',
            status: 'pago',
            numero_parcelas: 4,
            metodo: 'cartao',
            data_pagamento: new Date().toISOString(),
            plataforma_nome: 'cartao',
            detalhes_parcelas: JSON.stringify([
              {
                numero: 1,
                valor: 500.0,
                data_vencimento: '2026-01-18',
                pago: true,
                data_pagamento: new Date().toISOString(),
              },
              {
                numero: 2,
                valor: 500.0,
                data_vencimento: '2026-02-18',
                pago: false,
                data_pagamento: null,
              },
              {
                numero: 3,
                valor: 500.0,
                data_vencimento: '2026-03-18',
                pago: false,
                data_pagamento: null,
              },
              {
                numero: 4,
                valor: 500.0,
                data_vencimento: '2026-04-18',
                pago: false,
                data_pagamento: null,
              },
            ]),
            criado_em: new Date(),
          },
        ],
        rowCount: 1,
      })
      .mockResolvedValueOnce({
        rows: [{ column_name: 'criado_em' }],
        rowCount: 1,
      })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const resp = await GET();
    const data = await resp.json();

    expect(data.contrato.pagamento_resumo).toBeDefined();
    expect(data.contrato.pagamento_resumo.totalPago).toBe(500);
    expect(data.contrato.pagamento_resumo.restante).toBe(1500);
    expect(data.contrato.pagamento_status).toBe('em_aberto');
  });

  it('returns contrato from contratos_planos when contratos is absent', async () => {
    (query as jest.Mock)
      // plan cols
      .mockResolvedValueOnce({ rows: [{ column_name: 'preco' }], rowCount: 1 })
      // entidade
      .mockResolvedValueOnce({
        rows: [
          {
            id: 100,
            nome: 'Y',
            cnpj: '00',
            email: 'y@e',
            criado_em: new Date(),
          },
        ],
        rowCount: 1,
      })
      // contratoQuery -> empty
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({
        // information_schema check (planos) for contratos_planos fallback
        rows: [{ column_name: 'preco' }],
        rowCount: 1,
      })
      // contratos_planos -> has entry
      .mockResolvedValueOnce({
        rows: [
          {
            id: 5,
            plano_id: 9,
            plano_nome: 'Especial',
            plano_tipo: 'personalizado',
            plano_preco: '50.00',
            valor_total: '450.00',
            numero_funcionarios: 9,
            criado_em: new Date(),
          },
        ],
        rowCount: 1,
      })
      // pagamentos -> empty
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      // recibos schema
      .mockResolvedValueOnce({
        rows: [{ column_name: 'criado_em' }],
        rowCount: 1,
      });

    const resp = await GET();
    const data = await resp.json();

    expect(data).toBeDefined();
    expect(data.contrato).toBeDefined();
    expect(data.contrato.plano_nome).toBe('Especial');
    expect(data.contrato.valor_total).toBe(450);
    expect(data.contrato.numero_funcionarios).toBe(9);
  });
});
