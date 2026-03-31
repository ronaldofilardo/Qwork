/**
 * @fileoverview Testes do PATCH /api/representante/equipe/leads/[id]
 *
 * CONTEXTO (30/03/2026): A UI do representante (equipe/leads/page.tsx) foi
 * atualizada para remover o campo "% Vendedor" do modal de comissão.
 * O front-end envia APENAS percentual_comissao_representante no PATCH.
 * O percVend é sempre lido do banco de dados pelo backend.
 * A API mantém suporte opcional a percentual_comissao_vendedor para
 * compatibilidade com chamadas diretas à rota.
 *
 * Cobre:
 * - Representante define só percRep — fluxo padrão atual da UI
 * - percVend mantido do DB quando não enviado pelo front (fluxo principal)
 * - API ainda aceita percVend explícito para backward-compatibility
 * - Validação de total > MAX_PERCENTUAL_COMISSAO
 * - requer_aprovacao_comercial = true quando valorQWork < custo
 * - requer_aprovacao_comercial = false quando valorQWork >= custo
 * - Lead não encontrado (404)
 * - Lead não pendente (409)
 * - ID inválido (400)
 * - Sem autenticação (401)
 */
jest.mock('@/lib/db');
jest.mock('@/lib/session-representante');

import { PATCH } from '@/app/api/representante/equipe/leads/[id]/route';
import { query } from '@/lib/db';
import {
  requireRepresentante,
  repAuthErrorResponse,
} from '@/lib/session-representante';
import { NextRequest } from 'next/server';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequire = requireRepresentante as jest.MockedFunction<
  typeof requireRepresentante
>;
const mockErrResp = repAuthErrorResponse as jest.MockedFunction<
  typeof repAuthErrorResponse
>;

const validSession = {
  representante_id: 1,
  nome: 'Rep Teste',
  email: 'rep@test.dev',
  codigo: 'AB12-CD34',
  status: 'apto',
  tipo_pessoa: 'pf' as const,
  criado_em_ms: Date.now(),
};

/** Lead pendente padrão com percVend=10% e valor=100, entidade */
const leadPendente = {
  id: 42,
  status: 'pendente',
  vendedor_id: 99,
  percentual_comissao_vendedor: '10',
  valor_negociado: '100',
  tipo_cliente: 'entidade',
};

/** Lead pendente de clinica com valor=7 para testes de custo */
const leadClinica = {
  id: 43,
  status: 'pendente',
  vendedor_id: 99,
  percentual_comissao_vendedor: '10',
  valor_negociado: '7',
  tipo_cliente: 'clinica',
};

function makePatchReq(id: string, body: Record<string, unknown>) {
  return new NextRequest(
    `http://localhost/api/representante/equipe/leads/${id}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockRequire.mockReturnValue(validSession);
  mockErrResp.mockImplementation((e: Error) => {
    if (e.message === 'UNAUTHORIZED')
      return { status: 401, body: { error: 'Não autenticado' } };
    if (e.message === 'FORBIDDEN')
      return { status: 403, body: { error: 'Sem permissão' } };
    return { status: 500, body: { error: 'Erro interno' } };
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 1. Sucesso — percRep + percVend enviados juntos
// ─────────────────────────────────────────────────────────────────────────

describe('PATCH /api/representante/equipe/leads/[id] — sucesso com percVend (backward-compat: API ainda aceita campo opcional)', () => {
  test('deve salvar percRep e percVend e retornar 200', async () => {
    // Arrange
    mockQuery
      .mockResolvedValueOnce({ rows: [leadPendente], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any)
      .mockResolvedValueOnce({
        rows: [
          {
            ...leadPendente,
            percentual_comissao_representante: '15',
            percentual_comissao: '25',
            requer_aprovacao_comercial: false,
          },
        ],
        rowCount: 1,
      } as any);

    // Act
    const res = await PATCH(
      makePatchReq('42', {
        percentual_comissao_representante: 15,
        percentual_comissao_vendedor: 10,
      }),
      makeParams('42')
    );

    // Assert
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.requer_aprovacao_comercial).toBe(false);
  });

  test('UPDATE deve incluir percentual_comissao_vendedor no SQL', async () => {
    // Arrange
    mockQuery
      .mockResolvedValueOnce({ rows: [leadPendente], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [leadPendente], rowCount: 1 } as any);

    // Act
    await PATCH(
      makePatchReq('42', {
        percentual_comissao_representante: 15,
        percentual_comissao_vendedor: 8,
      }),
      makeParams('42')
    );

    // Assert: 2ª query é o UPDATE
    const updateSQL = mockQuery.mock.calls[1][0];
    expect(updateSQL).toMatch(/percentual_comissao_vendedor\s*=\s*\$3/i);
    expect(updateSQL).toMatch(/percentual_comissao\s*=\s*\$2.*\$3/i);
  });

  test('deve usar percVend enviado (sobrescreve valor do DB)', async () => {
    // lead no DB tem percVend=10, frontend envia percVend=5
    mockQuery
      .mockResolvedValueOnce({ rows: [leadPendente], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [leadPendente], rowCount: 1 } as any);

    await PATCH(
      makePatchReq('42', {
        percentual_comissao_representante: 20,
        percentual_comissao_vendedor: 5,
      }),
      makeParams('42')
    );

    const updateParams = mockQuery.mock.calls[1][1];
    // $3 = percVendedor = 5 (enviado), não 10 (DB)
    expect(updateParams[2]).toBe(5);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 2. Sucesso — apenas percRep (percVend mantido do DB)
// ─────────────────────────────────────────────────────────────────────────

describe('PATCH — percVend omitido: mantém valor do DB', () => {
  // FLUXO PRINCIPAL DA UI: a interface não envia mais percentual_comissao_vendedor desde 30/03/2026
  test('deve usar percVend do DB quando não enviado', async () => {
    // lead tem percVend=10 no DB
    mockQuery
      .mockResolvedValueOnce({ rows: [leadPendente], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [leadPendente], rowCount: 1 } as any);

    await PATCH(
      makePatchReq('42', { percentual_comissao_representante: 20 }),
      makeParams('42')
    );

    const updateParams = mockQuery.mock.calls[1][1];
    // $3 deve ser 10 (do DB)
    expect(updateParams[2]).toBe(10);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 3. requer_aprovacao_comercial
// ─────────────────────────────────────────────────────────────────────────

describe('PATCH — requer_aprovacao_comercial', () => {
  test('clínica R$7, rep 10% + vend 10% → QWork=5,60 ≥ 5 → não requer aprovação', async () => {
    // valorQWork = 7 - 0.70 - 0.70 = 5.60 ≥ 5 (custo clínica)
    mockQuery
      .mockResolvedValueOnce({ rows: [leadClinica], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [leadClinica], rowCount: 1 } as any);

    const res = await PATCH(
      makePatchReq('43', {
        percentual_comissao_representante: 10,
        percentual_comissao_vendedor: 10,
      }),
      makeParams('43')
    );
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.requer_aprovacao_comercial).toBe(false);
    expect(data.message).toMatch(/sucesso/i);
  });

  test('clínica R$7, rep 12% + vend 28% → QWork=4,20 < 5 → requer aprovação', async () => {
    // valorQWork = 7 - 0.84 - 1.96 = 4.20 < 5 (custo clínica)
    mockQuery
      .mockResolvedValueOnce({ rows: [leadClinica], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [leadClinica], rowCount: 1 } as any);

    const res = await PATCH(
      makePatchReq('43', {
        percentual_comissao_representante: 12,
        percentual_comissao_vendedor: 28,
      }),
      makeParams('43')
    );
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.requer_aprovacao_comercial).toBe(true);
    expect(data.message).toMatch(/aprovação comercial/i);
  });

  test('entidade R$100, rep 20% + vend 10% → QWork=70 ≥ 15 → não requer', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [leadPendente], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [leadPendente], rowCount: 1 } as any);

    const res = await PATCH(
      makePatchReq('42', {
        percentual_comissao_representante: 20,
        percentual_comissao_vendedor: 10,
      }),
      makeParams('42')
    );
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.requer_aprovacao_comercial).toBe(false);
  });

  test('entidade R$20, rep 20% + vend 20% → QWork=12 < 15 → requer', async () => {
    const leadBaixo = { ...leadPendente, valor_negociado: '20' };
    mockQuery
      .mockResolvedValueOnce({ rows: [leadBaixo], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [leadBaixo], rowCount: 1 } as any);

    const res = await PATCH(
      makePatchReq('42', {
        percentual_comissao_representante: 20,
        percentual_comissao_vendedor: 20,
      }),
      makeParams('42')
    );
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.requer_aprovacao_comercial).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 4. Validação: total > MAX_PERCENTUAL_COMISSAO
// ─────────────────────────────────────────────────────────────────────────

describe('PATCH — validação de total ≤ 40%', () => {
  test('rep 25% + vend 20% = 45% → 422', async () => {
    // Arrange: lead com percVend=20 no DB
    const leadComVend20 = {
      ...leadPendente,
      percentual_comissao_vendedor: '20',
    };
    mockQuery.mockResolvedValueOnce({
      rows: [leadComVend20],
      rowCount: 1,
    } as any);

    // Act: envia percVend=20 explicitamente
    const res = await PATCH(
      makePatchReq('42', {
        percentual_comissao_representante: 25,
        percentual_comissao_vendedor: 20,
      }),
      makeParams('42')
    );

    // Assert
    expect(res.status).toBe(422);
    const data = await res.json();
    expect(data.error).toMatch(/45/);
    expect(data.error).toMatch(/40/);
  });

  test('rep 30% + vend 11% = 41% → 422', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [leadPendente],
      rowCount: 1,
    } as any);

    const res = await PATCH(
      makePatchReq('42', {
        percentual_comissao_representante: 30,
        percentual_comissao_vendedor: 11,
      }),
      makeParams('42')
    );
    expect(res.status).toBe(422);
  });

  test('rep 20% + vend 20% = 40% → 200 (no limite)', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [leadPendente], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [leadPendente], rowCount: 1 } as any);

    const res = await PATCH(
      makePatchReq('42', {
        percentual_comissao_representante: 20,
        percentual_comissao_vendedor: 20,
      }),
      makeParams('42')
    );
    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 5. Erros de request
// ─────────────────────────────────────────────────────────────────────────

describe('PATCH — erros de request', () => {
  test('deve retornar 400 para ID não numérico', async () => {
    const res = await PATCH(
      makePatchReq('abc', { percentual_comissao_representante: 10 }),
      makeParams('abc')
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/inválido/i);
  });

  test('deve retornar 422 para body sem percentual_comissao_representante', async () => {
    const res = await PATCH(makePatchReq('42', {}), makeParams('42'));
    expect(res.status).toBe(422);
  });

  test('deve retornar 422 para percentual_comissao_representante negativo', async () => {
    const res = await PATCH(
      makePatchReq('42', { percentual_comissao_representante: -1 }),
      makeParams('42')
    );
    expect(res.status).toBe(422);
  });

  test('deve retornar 422 para percentual_comissao_representante > 40', async () => {
    const res = await PATCH(
      makePatchReq('42', { percentual_comissao_representante: 41 }),
      makeParams('42')
    );
    expect(res.status).toBe(422);
  });

  test('deve retornar 422 para percentual_comissao_vendedor negativo', async () => {
    const res = await PATCH(
      makePatchReq('42', {
        percentual_comissao_representante: 10,
        percentual_comissao_vendedor: -5,
      }),
      makeParams('42')
    );
    expect(res.status).toBe(422);
  });

  test('deve retornar 422 para percentual_comissao_vendedor > 40', async () => {
    const res = await PATCH(
      makePatchReq('42', {
        percentual_comissao_representante: 5,
        percentual_comissao_vendedor: 41,
      }),
      makeParams('42')
    );
    expect(res.status).toBe(422);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 6. Erros de estado do lead
// ─────────────────────────────────────────────────────────────────────────

describe('PATCH — erros de estado do lead', () => {
  test('deve retornar 404 quando lead não pertence ao representante', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const res = await PATCH(
      makePatchReq('42', { percentual_comissao_representante: 10 }),
      makeParams('42')
    );
    expect(res.status).toBe(404);
  });

  test('deve retornar 409 quando lead não está pendente', async () => {
    const leadConvertido = { ...leadPendente, status: 'convertido' };
    mockQuery.mockResolvedValueOnce({
      rows: [leadConvertido],
      rowCount: 1,
    } as any);

    const res = await PATCH(
      makePatchReq('42', { percentual_comissao_representante: 10 }),
      makeParams('42')
    );
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/convertido/i);
  });

  test('deve retornar 409 quando lead está rejeitado', async () => {
    const leadRejeitado = { ...leadPendente, status: 'rejeitado' };
    mockQuery.mockResolvedValueOnce({
      rows: [leadRejeitado],
      rowCount: 1,
    } as any);

    const res = await PATCH(
      makePatchReq('42', { percentual_comissao_representante: 10 }),
      makeParams('42')
    );
    expect(res.status).toBe(409);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 7. Autenticação
// ─────────────────────────────────────────────────────────────────────────

describe('PATCH — autenticação', () => {
  test('deve retornar 401 quando não autenticado', async () => {
    mockRequire.mockImplementation(() => {
      throw new Error('UNAUTHORIZED');
    });
    mockErrResp.mockReturnValue({
      status: 401,
      body: { error: 'Não autenticado' },
    });

    const res = await PATCH(
      makePatchReq('42', { percentual_comissao_representante: 10 }),
      makeParams('42')
    );
    expect(res.status).toBe(401);
  });
});
