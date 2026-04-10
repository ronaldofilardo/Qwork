/**
 * @fileoverview Testes GET /api/admin/manutencao/aguardando-quitacao
 * @description Retorna pagamentos de taxa de manutenção pendentes
 */

jest.mock('@/lib/session', () => ({
  getSession: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

import { GET } from '@/app/api/admin/manutencao/aguardando-quitacao/route';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;
const mockQuery = query as jest.MockedFunction<typeof query>;

describe('GET /api/admin/manutencao/aguardando-quitacao', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar 401 sem sessão', async () => {
    mockGetSession.mockReturnValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('deve retornar 403 para perfil rh', async () => {
    mockGetSession.mockReturnValue({ cpf: '000', nome: 'RH', perfil: 'rh' } as any);
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it('deve retornar lista vazia para admin sem pagamentos pendentes', async () => {
    mockGetSession.mockReturnValue({ cpf: '000', nome: 'Admin', perfil: 'admin' } as any);
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.pagamentos).toHaveLength(0);
    expect(body.total).toBe(0);
  });

  it('deve retornar pagamentos de entidade com campos corretos', async () => {
    mockGetSession.mockReturnValue({ cpf: '000', nome: 'Admin', perfil: 'admin' } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          pagamento_id: 10,
          entidade_id: 5,
          empresa_id: null,
          valor: '250.00',
          status: 'pendente',
          criado_em: '2026-04-01T00:00:00Z',
          link_pagamento_token: null,
          link_disponibilizado_em: null,
          nome: 'Entidade Teste',
          cnpj: '12345678000100',
          entidade_id_check: 5,
          clinica_nome: null,
          tipo: 'entidade',
        },
      ],
      rowCount: 1,
    } as any);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    const item = body.pagamentos[0];
    expect(item.pagamento_id).toBe(10);
    expect(item.tipo).toBe('entidade');
    expect(item.valor).toBe(250);
    expect(item.link_pagamento_token).toBeNull();
    expect(item.link_disponibilizado_em).toBeNull();
  });

  it('deve retornar pagamentos de empresa_clinica com link_pagamento_token preenchido', async () => {
    mockGetSession.mockReturnValue({ cpf: '000', nome: 'Suporte', perfil: 'suporte' } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          pagamento_id: 20,
          entidade_id: null,
          empresa_id: 7,
          valor: '250.00',
          status: 'aguardando_pagamento',
          criado_em: '2026-04-02T00:00:00Z',
          link_pagamento_token: 'tok-abc-123',
          link_disponibilizado_em: '2026-04-03T10:00:00Z',
          nome: 'Empresa XYZ',
          cnpj: '98765432000100',
          entidade_id_check: null,
          clinica_nome: 'Clinica Master',
          tipo: 'empresa_clinica',
        },
      ],
      rowCount: 1,
    } as any);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    const item = body.pagamentos[0];
    expect(item.tipo).toBe('empresa_clinica');
    expect(item.link_pagamento_token).toBe('tok-abc-123');
    expect(item.clinica_nome).toBe('Clinica Master');
    expect(item.link_disponibilizado_em).toBe('2026-04-03T10:00:00Z');
  });
});
