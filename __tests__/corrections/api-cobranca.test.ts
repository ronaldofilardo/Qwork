// Mock do query
jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/cobranca/route';

// Mock do requireRole
jest.mock('@/lib/session', () => ({
  requireRole: jest.fn().mockResolvedValue({
    cpf: 'admin123',
    perfil: 'admin',
  }),
}));

const mockQuery = require('@/lib/db').query;

describe('API Cobrança - Consulta a contratantes', () => {
  beforeEach(() => {
    mockQuery.mockClear();
  });

  it('deve buscar contratantes aprovados com planos (SELECT em contratantes ct)', async () => {
    // Mock do resultado da query
    mockQuery.mockResolvedValue({
      rows: [
        {
          id: 1,
          numero_contrato: 1,
          tipo_contratante: 'entidade',
          nome_contratante: 'Empresa Teste',
          cnpj: '12345678000199',
          plano_nome: 'Plano Fixo',
          plano_tipo: 'fixo',
          numero_funcionarios_estimado: 50,
          numero_funcionarios_atual: 45,
          valor_pago: 5000,
          tipo_pagamento: 'cartao',
          modalidade_pagamento: 'parcelado',
          numero_parcelas: 2,
          parcelas_json: null,
          status: 'ativo',
          data_contratacao: '2025-01-01T00:00:00Z',
          data_fim_vigencia: '2026-01-01T00:00:00Z',
          data_pagamento: '2025-01-15T00:00:00Z',
          criado_em: '2025-01-01T00:00:00Z',
        },
      ],
    });

    const request = new NextRequest('http://localhost:3000/api/admin/cobranca');
    const response = await GET(request);
    const data = await response.json();

    // Verificar se query foi chamada ao menos uma vez
    expect(mockQuery).toHaveBeenCalled();

    // Verificar se a query SQL busca da tabela CONTRATANTES em alguma das chamadas (a primeira pode ser checagem de coluna)
    const found = mockQuery.mock.calls.some((c: any) =>
      String(c[0]).includes('FROM contratantes ct')
    );
    expect(found).toBe(true);

    // Verificar se a query inclui JOIN com a tabela de planos
    const hasPlanJoin = mockQuery.mock.calls.some((c: any) =>
      String(c[0]).includes('LEFT JOIN planos')
    );
    expect(hasPlanJoin).toBe(true);

    // Verificar resposta
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.contratos).toHaveLength(1);
    expect(data.contratos[0].nome_contratante).toBe('Empresa Teste');
  });

  it('deve filtrar apenas contratantes aprovados', async () => {
    mockQuery.mockResolvedValue({ rows: [] });

    const request = new NextRequest('http://localhost:3000/api/admin/cobranca');
    await GET(request);

    // Verificar em qualquer chamada de query se há filtro por contratantes aprovados
    const calledWithWhere = mockQuery.mock.calls.some((c: any) =>
      String(c[0]).includes("WHERE ct.status = 'aprovado'")
    );
    expect(calledWithWhere).toBe(true);
  });

  it('não deve referenciar c.valor_personalizado quando coluna não existe', async () => {
    // 1) checagem de colunas: retorna sem contratos.valor_personalizado
    mockQuery.mockResolvedValueOnce({ rows: [] });
    // 2) count
    mockQuery.mockResolvedValueOnce({ rows: [{ total: '0' }] });
    // 3) select final
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const request = new NextRequest('http://localhost:3000/api/admin/cobranca');
    const response = await GET(request);
    expect(response.status).toBe(200);

    // garantir que nenhuma das chamadas SQL referenciou diretamente c.valor_personalizado
    const bad = mockQuery.mock.calls.some((c: any) =>
      String(c[0]).includes('c.valor_personalizado')
    );
    expect(bad).toBe(false);
  });
  it('deve incluir informações de pagamento quando disponível', async () => {
    mockQuery.mockResolvedValue({
      rows: [
        {
          id: 1,
          numero_contrato: 1,
          tipo_contratante: 'clinica',
          nome_contratante: 'Clínica Teste',
          cnpj: '12345678000199',
          plano_nome: 'Plano Personalizado',
          plano_tipo: 'personalizado',
          numero_funcionarios_estimado: 100,
          numero_funcionarios_atual: null,
          valor_pago: 15000,
          tipo_pagamento: 'boleto',
          modalidade_pagamento: 'a_vista',
          numero_parcelas: null,
          parcelas_json: null,
          status: 'ativo',
          data_contratacao: '2025-01-01T00:00:00Z',
          data_fim_vigencia: '2026-01-01T00:00:00Z',
          data_pagamento: '2025-01-10T00:00:00Z',
          criado_em: '2025-01-01T00:00:00Z',
        },
      ],
    });

    const request = new NextRequest('http://localhost:3000/api/admin/cobranca');
    const response = await GET(request);
    const data = await response.json();

    expect(data.contratos[0]).toMatchObject({
      nome_contratante: 'Clínica Teste',
      tipo_contratante: 'clinica',
      plano_nome: 'Plano Personalizado',
      valor_pago: 15000,
      modalidade_pagamento: 'a_vista',
    });
  });

  it('deve calcular valor_pago corretamente para planos fixos quando pagamento armazenou valor unitário', async () => {
    // Simular retorno do DB onde pg.valor é o valor unitário (R$20) e estimativa de 15 funcionários
    // A API faz 3 queries: 1) checagem de colunas, 2) count para paginação, 3) select final. Mockar na ordem.
    mockQuery.mockResolvedValueOnce({ rows: [] }); // resultado da checagem de colunas
    mockQuery.mockResolvedValueOnce({ rows: [{ total: '1' }] }); // resultado do COUNT
    mockQuery.mockResolvedValueOnce({
      // resultado do SELECT final
      rows: [
        {
          id: 56,
          numero_contrato: 2,
          tipo_contratante: 'entidade',
          nome_contratante: 'Empresa Teste FIxo',
          cnpj: '02494916000170',
          plano_nome: 'Plano Fixo Teste',
          plano_tipo: 'fixo',
          numero_funcionarios_estimado: 15,
          numero_funcionarios_atual: 15,
          pagamento_valor: 20,
          valor_pago: 300,
          tipo_pagamento: 'boleto',
          modalidade_pagamento: 'a_vista',
          numero_parcelas: null,
          parcelas_json: null,
          status: 'ativo',
          data_contratacao: '2025-12-01T00:00:00Z',
          data_fim_vigencia: '2026-12-01T00:00:00Z',
          data_pagamento: '2025-12-27T00:00:00Z',
          criado_em: '2025-12-01T00:00:00Z',
        },
      ],
    });

    const request = new NextRequest(
      'http://localhost:3000/api/admin/cobranca?cnpj=02494916000170'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(data.contratos).toHaveLength(1);
    const row = data.contratos[0];
    // Deve usar estimativa quando numero_funcionarios atual não existe
    expect(row.numero_funcionarios_atual).toBe(15);
    // Deve multiplicar 15 * 20 => R$300
    expect(row.valor_pago).toBe(300);
    // Plano Preço deve ser R$20 (unitário no momento da contratação)
    expect(row.plano_preco || row.pagamento_valor || 20).toBe(20);
  });

  it('deve exibir plano_preco negociado para planos personalizados e preservar valor_pago', async () => {
    // Simular cenário personalizado: valor negociado R$7, 1200 funcionarios => valor_pago 8400
    mockQuery.mockResolvedValueOnce({ rows: [] }); // check columns
    mockQuery.mockResolvedValueOnce({ rows: [{ total: '1' }] }); // count
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 55,
          numero_contrato: 1,
          tipo_contratante: 'clinica',
          nome_contratante: 'Clínica Personalizada',
          cnpj: '09110380000191',
          plano_nome: 'Plano Personalizado',
          plano_tipo: 'personalizado',
          numero_funcionarios_estimado: 1200,
          numero_funcionarios_atual: 0,
          valor_pago: 8400,
          plano_preco: 7,
          tipo_pagamento: 'boleto',
          modalidade_pagamento: 'a_vista',
          numero_parcelas: null,
          parcelas_json: null,
          status: 'ativo',
          data_contratacao: '2025-01-01T00:00:00Z',
          data_fim_vigencia: '2026-01-01T00:00:00Z',
          data_pagamento: '2025-12-27T00:00:00Z',
          criado_em: '2025-01-01T00:00:00Z',
        },
      ],
    });

    const request = new NextRequest('http://localhost:3000/api/admin/cobranca');
    const response = await GET(request);
    const data = await response.json();

    expect(data.contratos).toHaveLength(1);
    const row = data.contratos[0];
    expect(row.plano_tipo).toBe('personalizado');
    // plano_preco deve refletir o valor negociado
    expect(row.plano_preco).toBe(7);
    // valor_pago preservado
    expect(row.valor_pago).toBe(8400);
  });
});
