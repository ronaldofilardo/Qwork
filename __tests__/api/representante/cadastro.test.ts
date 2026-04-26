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
  cpf: '12345678909',
  aceite_termos: true,
  aceite_disclaimer_nv: true,
};

const basePJ = {
  nome: 'Empresa LTDA',
  email: 'empresa@test.dev',
  tipo_pessoa: 'pj',
  cnpj: '12345678000190',
  cpf_responsavel_pj: '12345678909',
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
    expect((await res.json()).error).toMatch(/Apenas representantes PJ|CNPJ/i);
  });

  it('deve exigir aceite_termos', async () => {
    const res = await POST(makeReq({ ...basePJ, aceite_termos: false }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/termos/i);
  });

  it('deve exigir aceite_disclaimer_nv', async () => {
    const res = await POST(makeReq({ ...basePJ, aceite_disclaimer_nv: false }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/disclaimer/i);
  });

  it('deve rejeitar cadastro PF com 400', async () => {
    const res = await POST(makeReq({ ...basePF }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/Apenas representantes PJ|CNPJ/i);
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
    // checkCpfUnicoSistema: 5 queries em Promise.all (todas sem conflito)
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // rep cpf
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // rep cpf_responsavel_pj
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // lead cpf
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // lead cpf_responsavel
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // usuario
    // email check → retorna que já existe
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 55 }], rowCount: 1 } as any);

    const res = await POST(makeReq(basePJ));
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/e-mail/i);
  });

  // --- Cadastro PJ com sucesso ---
  it('deve cadastrar PJ com status ativo e retornar 201', async () => {
    // checkCpfUnicoSistema: 5 queries em Promise.all (todas sem conflito)
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // rep cpf
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // rep cpf_responsavel_pj
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // lead cpf
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // lead cpf_responsavel
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // usuario
    // email check
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    // gestor_comercial
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    // INSERT RETURNING
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 10,
          nome: 'Empresa LTDA',
          email: 'empresa@test.dev',
          status: 'ativo',
          tipo_pessoa: 'pj',
          criado_em: '2026-01-01',
        },
      ],
      rowCount: 1,
    } as any);

    const res = await POST(makeReq(basePJ));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.representante.id).toBe(10);
    expect(data.representante.status).toBe('ativo');
  });

  // --- Cadastro PJ sem conflito ---
  it('deve cadastrar PJ com status ativo quando não há conflito PF', async () => {
    // checkCpfUnicoSistema: 5 queries em Promise.all (todas sem conflito)
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // rep cpf
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // rep cpf_responsavel_pj
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // lead cpf
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // lead cpf_responsavel
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // usuario
    // email check
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    // gestor_comercial
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    // INSERT RETURNING
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 11,
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
    // 5 cpfUnico + email check + gestor + INSERT = 8 chamadas
    expect(mockQuery).toHaveBeenCalledTimes(8);
  });

  // --- Unique constraint exception ---
  it('deve retornar 409 para violação de unique constraint', async () => {
    // checkCpfUnicoSistema: 5 queries em Promise.all (todas sem conflito)
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // rep cpf
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // rep cpf_responsavel_pj
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // lead cpf
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // lead cpf_responsavel
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // usuario
    // email check
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    // gestor_comercial
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    // INSERT → lança unique violation
    mockQuery.mockRejectedValueOnce(
      new Error('duplicate key value violates unique constraint')
    );

    const res = await POST(makeReq(basePJ));
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/já cadastrado/i);
  });
});
