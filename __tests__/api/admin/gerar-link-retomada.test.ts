/**
 * @file __tests__/api/admin/gerar-link-retomada.test.ts
 * Testes: POST /api/admin/gerar-link-retomada
 */

import { POST } from '@/app/api/admin/gerar-link-retomada/route';
import { requireAuth, requireRole } from '@/lib/auth';
import { query } from '@/lib/db';
import { getBaseUrl } from '@/lib/utils/get-base-url';
import { NextRequest } from 'next/server';

jest.mock('@/lib/auth');
jest.mock('@/lib/db');
jest.mock('@/lib/utils/get-base-url');

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;
const mockQuery = query as jest.MockedFunction<typeof query>;
const mockGetBaseUrl = getBaseUrl as jest.MockedFunction<typeof getBaseUrl>;

function makeReq(body: Record<string, unknown>): NextRequest {
  return { json: jest.fn().mockResolvedValue(body) } as unknown as NextRequest;
}

const adminSession = { cpf: '000', perfil: 'admin' as const, nome: 'Admin' };

describe('POST /api/admin/gerar-link-retomada', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockReturnValue(adminSession as any);
    mockRequireRole.mockReturnValue(undefined);
    mockGetBaseUrl.mockReturnValue('https://qwork.app');
  });

  it('400 se tomador_id ou contrato_id ausente', async () => {
    const res = await POST(makeReq({ tomador_id: 1 }));
    expect(res.status).toBe(400);
  });

  it('404 se tomador/contrato não encontrado', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    const res = await POST(makeReq({ tomador_id: 1, contrato_id: 2 }));
    expect(res.status).toBe(404);
  });

  it('400 se pagamento já confirmado', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          tomador_id: 1,
          tomador_status: 'pago',
          tomador_nome: 'X',
          tomador_email: 'x@x',
          numero_contrato: 'C1',
          valor_total: 1000,
        },
      ],
      rowCount: 1,
    } as any);
    const res = await POST(makeReq({ tomador_id: 1, contrato_id: 2 }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('confirmado');
  });

  it('200 gera link com sucesso', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            tomador_id: 1,
            tomador_status: 'aguardando_pagamento',
            tomador_nome: 'Empresa X',
            tomador_email: 'x@x.com',
            numero_contrato: 'C-001',
            valor_total: 5000,
          },
        ],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({ rowCount: 1 } as any); // INSERT logs_admin

    const res = await POST(makeReq({ tomador_id: 1, contrato_id: 2 }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.link_retomada).toContain('pagamento/simulador');
    expect(json.dados_tomador.nome).toBe('Empresa X');
  });

  it('500 se requireAuth lança erro', async () => {
    mockRequireAuth.mockImplementation(() => {
      throw new Error('Autenticação requerida');
    });
    const res = await POST(makeReq({ tomador_id: 1, contrato_id: 2 }));
    expect(res.status).toBe(500);
  });
});
