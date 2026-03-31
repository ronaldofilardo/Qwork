/**
 * @fileoverview Testes da API POST /api/representante/cadastro
 */
jest.mock('@/lib/db');

import { POST } from '@/app/api/representante/cadastro/route';
import { query } from '@/lib/db';
import { NextRequest } from 'next/server';

const mockQuery = query as jest.MockedFunction<typeof query>;

function makeReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/representante/cadastro', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

const basePF = {
  nome: 'Maria Santos',
  email: 'maria@test.dev',
  tipo_pessoa: 'pf',
  cpf: '12345678901',
  aceite_termos: true,
  aceite_disclaimer_nv: true,
};

const basePJ = {
  nome: 'Empresa LTDA',
  email: 'empresa@test.dev',
  tipo_pessoa: 'pj',
  cnpj: '12345678000190',
  cpf_responsavel_pj: '12345678901',
  aceite_termos: true,
  aceite_disclaimer_nv: true,
};

describe('POST /api/representante/cadastro', () => {
  beforeEach(() => jest.clearAllMocks());

  // --- Validações 400 ---
  it('deve exigir nome', async () => {
    const res = await POST(makeReq({ ...basePF, nome: '' }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/nome/i);
  });

  it('deve exigir email', async () => {
    const res = await POST(makeReq({ ...basePF, email: '' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/e-mail/i);
  });

  it('deve validar tipo_pessoa', async () => {
    const res = await POST(makeReq({ ...basePF, tipo_pessoa: 'xyz' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/tipo_pessoa/i);
  });

  it('deve exigir aceite_termos', async () => {
    const res = await POST(makeReq({ ...basePF, aceite_termos: false }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/termos/i);
  });

  it('deve exigir aceite_disclaimer_nv', async () => {
    const res = await POST(makeReq({ ...basePF, aceite_disclaimer_nv: false }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/disclaimer/i);
  });

  it('deve validar CPF com 11 dígitos para PF', async () => {
    const res = await POST(makeReq({ ...basePF, cpf: '123' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/cpf/i);
  });

  it('deve validar CNPJ com 14 dígitos para PJ', async () => {
    const res = await POST(makeReq({ ...basePJ, cnpj: '123' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/cnpj/i);
  });

  it('deve exigir CPF do responsável PJ', async () => {
    const res = await POST(makeReq({ ...basePJ, cpf_responsavel_pj: '' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/cpf.*responsável/i);
  });

  // --- Conflito de email 409 ---
  it('deve retornar 409 se email já existe', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 55 }], rowCount: 1 } as any);

    const res = await POST(makeReq(basePF));
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/e-mail/i);
  });

  // --- Cadastro PF com sucesso ---
  it('deve cadastrar PF com status ativo e retornar 201', async () => {
    // email check
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    // INSERT RETURNING
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 10,
          codigo: 'XX00-YY11',
          nome: 'Maria Santos',
          email: 'maria@test.dev',
          status: 'ativo',
          tipo_pessoa: 'pf',
          criado_em: '2026-01-01',
        },
      ],
      rowCount: 1,
    } as any);

    const res = await POST(makeReq(basePF));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.representante.codigo).toBe('XX00-YY11');
    expect(data.representante.status).toBe('ativo');
    expect(data.aviso).toBeNull();
  });

  // --- Cadastro PJ sem conflito ---
  it('deve cadastrar PJ com status ativo quando não há conflito PF', async () => {
    // email check
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    // PJ conflito check → nenhum
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    // INSERT RETURNING
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 11,
          codigo: 'PJ00-0001',
          nome: 'Empresa LTDA',
          email: 'empresa@test.dev',
          status: 'ativo',
          tipo_pessoa: 'pj',
          criado_em: '2026-02-01',
        },
      ],
      rowCount: 1,
    } as any);

    const res = await POST(makeReq(basePJ));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.representante.status).toBe('ativo');
    expect(data.aviso).toBeNull();
  });

  // --- Cadastro PJ com conflito PF/PJ ---
  it('deve cadastrar PJ com status apto_bloqueado quando há conflito PF', async () => {
    // email check ok
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    // conflito PF encontrado
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 99 }], rowCount: 1 } as any);
    // INSERT RETURNING — status apto_bloqueado
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 12,
          codigo: 'PJ00-0002',
          nome: 'Empresa LTDA',
          email: 'empresa@test.dev',
          status: 'apto_bloqueado',
          tipo_pessoa: 'pj',
          criado_em: '2026-02-01',
        },
      ],
      rowCount: 1,
    } as any);
    // Auditoria INSERT
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

    const res = await POST(makeReq(basePJ));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.representante.status).toBe('apto_bloqueado');
    expect(data.aviso).toMatch(/conflito/i);
    // Verifica que auditoria foi gravada (4 chamadas)
    expect(mockQuery).toHaveBeenCalledTimes(4);
  });

  // --- Unique constraint exception ---
  it('deve retornar 409 para violação de unique constraint', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    mockQuery.mockRejectedValueOnce(
      new Error('duplicate key value violates unique constraint')
    );

    const res = await POST(makeReq(basePF));
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/já cadastrado/i);
  });
});
