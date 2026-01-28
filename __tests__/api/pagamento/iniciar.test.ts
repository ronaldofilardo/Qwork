import '@testing-library/jest-dom';

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

import { POST } from '@/app/api/pagamento/iniciar/route';
import { query } from '@/lib/db';

const mockQuery = query as jest.MockedFunction<typeof query>;

describe('API /api/pagamento/iniciar - iniciar pagamento', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('deve retornar erro se contratante_id estiver faltando', async () => {
    const fakeRequest: any = {
      json: async () => ({ contrato_id: 1 }),
    };

    const resp: any = await POST(fakeRequest);
    expect(resp.status).toBe(400);

    const body = await resp.json();
    expect(body.error).toContain('ID do contratante é obrigatório');
  });

  it('deve retornar erro se contrato_id estiver faltando', async () => {
    // Mock - existe contratante, mas não existe contrato aceito associado
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          nome: 'Empresa Teste',
          plano_id: 1,
          status: 'aguardando_pagamento',
          valor_unitario: 50.0,
          plano_nome: 'Plano Fixo',
          numero_funcionarios: 10,
        },
      ],
      rowCount: 1,
    } as any);

    // Mock - busca pagamento existente (nenhum)
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    // Mock - busca contrato aceito (nenhum)
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const fakeRequest: any = {
      json: async () => ({ contratante_id: 1 }),
    };

    const resp: any = await POST(fakeRequest);
    expect(resp.status).toBe(400);

    const body = await resp.json();
    expect(body.error).toContain('Contrato deve ser aceito antes do pagamento');
  });

  it('deve retornar erro se contratante não for encontrado', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [],
      rowCount: 0,
    } as any);

    const fakeRequest: any = {
      json: async () => ({ contratante_id: 1, contrato_id: 1 }),
    };

    const resp: any = await POST(fakeRequest);
    expect(resp.status).toBe(404);

    const body = await resp.json();
    expect(body.error).toBe('Contratante não encontrado');
  });

  it('deve retornar erro se status do contratante não for aguardando_pagamento', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          nome: 'Empresa Teste',
          plano_id: 1,
          status: 'ativo',
          valor_unitario: 50.0,
          plano_nome: 'Plano Fixo',
          numero_funcionarios: 10,
          valor_total: 500.0,
        },
      ],
      rowCount: 1,
    } as any);

    const fakeRequest: any = {
      json: async () => ({ contratante_id: 1, contrato_id: 1 }),
    };

    const resp: any = await POST(fakeRequest);
    expect(resp.status).toBe(400);

    const body = await resp.json();
    expect(body.error).toBe('Status inválido para pagamento');
  });

  it('deve retornar pagamento existente se houver', async () => {
    // Mock - busca contratante
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          nome: 'Empresa Teste',
          plano_id: 1,
          status: 'aguardando_pagamento',
          valor_unitario: 50.0,
          plano_nome: 'Plano Fixo',
          numero_funcionarios: 10,
        },
      ],
      rowCount: 1,
    } as any);

    // Mock - busca pagamento existente
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 100,
          status: 'pendente',
        },
      ],
      rowCount: 1,
    } as any);

    const fakeRequest: any = {
      json: async () => ({ contratante_id: 1, contrato_id: 1 }),
    };

    const resp: any = await POST(fakeRequest);
    expect(resp.status).toBe(200);

    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(body.pagamento_existente).toBe(true);
    expect(body.pagamento_id).toBe(100);
    expect(body.status).toBe('pendente');
  });

  it('deve iniciar pagamento com sucesso', async () => {
    // Mock - busca contratante
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          nome: 'Empresa Teste',
          plano_id: 1,
          status: 'aguardando_pagamento',
          valor_unitario: 50.0,
          plano_nome: 'Plano Fixo',
          numero_funcionarios: 10,
          valor_total: 500.0, // Valor total já calculado
        },
      ],
      rowCount: 1,
    } as any);

    // Mock - busca pagamento existente (nenhum)
    mockQuery.mockResolvedValueOnce({
      rows: [],
      rowCount: 0,
    } as any);

    // Mock - validação do contrato específico (id=1) => aceito
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, aceito: true }],
      rowCount: 1,
    } as any);

    // Mock - insert pagamento
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 200 }],
      rowCount: 1,
    } as any);

    const fakeRequest: any = {
      json: async () => ({ contratante_id: 1, contrato_id: 1 }),
    };

    const resp: any = await POST(fakeRequest);
    expect(resp.status).toBe(200);

    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(body.pagamento_id).toBe(200);
    expect(body.valor).toBe(500.0); // valor_total do contrato
    expect(body.valor_plano).toBe(50.0); // preco (valor personalizado ou preço do plano)
    expect(body.numero_funcionarios).toBe(10);
    expect(body.plano_nome).toBe('Plano Fixo');
    expect(body.contratante_nome).toBe('Empresa Teste');
    expect(body.message).toBe('Pagamento iniciado com sucesso');

    // Verificar chamadas
    expect(mockQuery).toHaveBeenCalledTimes(4);
    // Primeira chamada: busca contratante (com JOIN contratos quando contrato_id fornecido)
    expect(mockQuery.mock.calls[0][0]).toContain('SELECT c.id');
    expect(mockQuery.mock.calls[0][1]).toEqual([1, 1]);
    // Segunda chamada: busca pagamento existente
    expect(mockQuery.mock.calls[1][0]).toContain(
      'SELECT id, status FROM pagamentos'
    );
    expect(mockQuery.mock.calls[1][1]).toEqual([1]);
    // Terceira chamada: validação de contrato
    expect(mockQuery.mock.calls[2][0]).toContain(
      'SELECT id, aceito FROM contratos'
    );
    expect(mockQuery.mock.calls[2][1]).toEqual([1, 1]);
    // Quarta chamada: insert pagamento (agora inclui contrato_id como segundo campo)
    expect(mockQuery.mock.calls[3][0]).toContain('INSERT INTO pagamentos');
    expect(mockQuery.mock.calls[3][1]).toEqual([
      1, // contratante_id
      1, // contrato_id
      500.0, // valor
      'pendente',
      'avista',
    ]);
  });

  it('deve usar valor_total vindo do contrato quando presente', async () => {
    // Mock - busca contratante (JOIN contratos retorna ctr.valor_total como contrato_valor_total)
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          nome: 'Empresa Teste',
          plano_id: 1,
          status: 'aguardando_pagamento',
          plano_nome: 'Plano Teste',
          numero_funcionarios: 10,
          contrato_id: 1,
          contrato_aceito: true,
          contrato_valor_total: 500.0, // valor vindo do contrato
        },
      ],
      rowCount: 1,
    } as any);

    // Mock - busca pagamento existente (nenhum)
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    // Mock - validação do contrato específico (id=1) => aceito
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, aceito: true }],
      rowCount: 1,
    } as any);

    // Mock - insert pagamento
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 201 }],
      rowCount: 1,
    } as any);

    const fakeRequest: any = {
      json: async () => ({ contratante_id: 1, contrato_id: 1 }),
    };

    const resp: any = await POST(fakeRequest);
    expect(resp.status).toBe(200);

    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(body.pagamento_id).toBe(201);
    expect(body.valor).toBe(500.0); // valor_total proveniente do contrato

    // Verificar que a query inicial incluiu a seleção do valor do contrato
    expect(mockQuery.mock.calls[0][0]).toContain('ctr.valor_total');
  });

  it('deve lidar com erro interno', async () => {
    mockQuery.mockRejectedValueOnce(new Error('Database error'));

    const fakeRequest: any = {
      json: async () => ({ contratante_id: 1, contrato_id: 1 }),
    };

    const resp: any = await POST(fakeRequest);
    expect(resp.status).toBe(500);

    const body = await resp.json();
    expect(body.error).toBe('Erro ao processar solicitação de pagamento');
  });

  // ========== TESTES PARA A CORREÇÃO: JOIN com contratos em vez de contratos_planos ==========

  it('deve usar JOIN com tabela contratos na query principal', async () => {
    // Mock - busca contratante (com JOIN contratos)
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          nome: 'Empresa Teste',
          plano_id: 1,
          status: 'aguardando_pagamento',
          valor_unitario: 50.0,
          plano_nome: 'Plano Fixo',
          numero_funcionarios: 1,
        },
      ],
      rowCount: 1,
    } as any);

    // Mock - busca pagamento existente (nenhum)
    mockQuery.mockResolvedValueOnce({
      rows: [],
      rowCount: 0,
    } as any);

    // Mock - validação do contrato específico (id=15) => aceito
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 15, aceito: true }],
      rowCount: 1,
    } as any);

    // Mock - insert pagamento
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 300 }],
      rowCount: 1,
    } as any);

    const fakeRequest: any = {
      json: async () => ({ contratante_id: 1, contrato_id: 15 }),
    };

    const resp: any = await POST(fakeRequest);
    expect(resp.status).toBe(200);

    // Verificar que a query contém JOIN com contratos, não contratos_planos
    expect(mockQuery.mock.calls[0][0]).toContain('JOIN contratos ctr');
    expect(mockQuery.mock.calls[0][0]).not.toContain('JOIN contratos_planos');
    expect(mockQuery.mock.calls[0][1]).toEqual([1, 15]); // contratante_id, contrato_id
  });

  it('deve falhar quando contrato específico não existe (mesmo com contratante válido)', async () => {
    // Mock - busca contratante retorna vazio (contrato não encontrado)
    mockQuery.mockResolvedValueOnce({
      rows: [],
      rowCount: 0,
    } as any);

    const fakeRequest: any = {
      json: async () => ({ contratante_id: 1, contrato_id: 999 }),
    };

    const resp: any = await POST(fakeRequest);
    expect(resp.status).toBe(404);

    const body = await resp.json();
    expect(body.error).toBe('Contratante não encontrado');
  });

  it('deve funcionar quando contratante e contrato existem e estão relacionados', async () => {
    // Mock - busca contratante e contrato relacionados
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          nome: 'Empresa Teste Ltda',
          plano_id: 2,
          status: 'aguardando_pagamento',
          valor_unitario: 100.0,
          plano_nome: 'Plano Fixo',
          numero_funcionarios: 1,
          valor_total: 100.0, // Valor total já calculado
        },
      ],
      rowCount: 1,
    } as any);

    // Mock - busca pagamento existente (nenhum)
    mockQuery.mockResolvedValueOnce({
      rows: [],
      rowCount: 0,
    } as any);

    // Mock - validação do contrato específico (id=15) => aceito
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 15, aceito: true }],
      rowCount: 1,
    } as any);

    // Mock - insert pagamento
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 400 }],
      rowCount: 1,
    } as any);

    const fakeRequest: any = {
      json: async () => ({ contratante_id: 1, contrato_id: 15 }),
    };

    const resp: any = await POST(fakeRequest);
    expect(resp.status).toBe(200);

    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(body.pagamento_id).toBe(400);
    expect(body.valor).toBe(100.0); // valor_total
    expect(body.plano_nome).toBe('Plano Fixo');
    expect(body.contratante_nome).toBe('Empresa Teste Ltda');
  });

  it('deve usar numero_funcionarios = 1 quando não especificado', async () => {
    // Mock - busca contratante sem numero_funcionarios especificado
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          nome: 'Empresa Teste',
          plano_id: 1,
          status: 'aguardando_pagamento',
          valor_unitario: 75.0,
          plano_nome: 'Plano Fixo',
          numero_funcionarios: 1, // Valor padrão usado na query corrigida
          valor_total: 75.0, // Valor total já calculado
        },
      ],
      rowCount: 1,
    } as any);

    // Mock - busca pagamento existente (nenhum)
    mockQuery.mockResolvedValueOnce({
      rows: [],
      rowCount: 0,
    } as any);

    // Mock - validação do contrato específico (id=15) => aceito
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 15, aceito: true }],
      rowCount: 1,
    } as any);

    // Mock - insert pagamento
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 500 }],
      rowCount: 1,
    } as any);

    const fakeRequest: any = {
      json: async () => ({ contratante_id: 1, contrato_id: 15 }),
    };

    const resp: any = await POST(fakeRequest);
    expect(resp.status).toBe(200);

    const body = await resp.json();
    expect(body.numero_funcionarios).toBe(1);
    expect(body.valor).toBe(75.0); // valor_total
  });

  it('deve validar que a query usa a estrutura correta após limpeza de dados', async () => {
    // Este teste garante que a correção funciona mesmo após limpeza de contratos_planos
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          nome: 'Contratante Após Limpeza',
          plano_id: 1,
          status: 'aguardando_pagamento',
          valor_unitario: 50.0,
          plano_nome: 'Plano Fixo',
          numero_funcionarios: 1,
        },
      ],
      rowCount: 1,
    } as any);

    mockQuery.mockResolvedValueOnce({
      rows: [],
      rowCount: 0,
    } as any);

    // Mock - validação do contrato específico (id=15) => aceito
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 15, aceito: true }],
      rowCount: 1,
    } as any);

    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 600 }],
      rowCount: 1,
    } as any);

    const fakeRequest: any = {
      json: async () => ({ contratante_id: 1, contrato_id: 15 }),
    };

    const resp: any = await POST(fakeRequest);
    expect(resp.status).toBe(200);

    // Verificar que não tenta usar contratos_planos (que pode estar vazio após limpeza)
    const querySQL = mockQuery.mock.calls[0][0];
    expect(querySQL).toContain('JOIN contratos ctr');
    expect(querySQL).toContain('ctr.contratante_id = c.id');
    expect(querySQL).toContain('ctr.id = $2');
    expect(querySQL).not.toContain('contratos_planos');
  });
});
