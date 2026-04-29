/**
 * @file __tests__/api/comercial/representantes-codigo-sequencial.test.ts
 *
 * Testes para POST /api/comercial/representantes — criação de lead PJ pendente de verificação.
 * O comercial cria um lead PJ com status='pendente_verificacao'. O lead aparece na fila de
 * Candidatos para o comercial aprovar. Só após aprovação + conversão o representante é criado
 * e o link de convite é gerado.
 * Retorna: { lead_id, nome }
 *
 * A rota é PJ-only (exige cnpj, razao_social, cartao_cnpj).
 * Duplicatas são verificadas via checkEmailDuplicate + checkCnpjDuplicate (Promise.all internamente).
 */

jest.mock('@/lib/db', () => ({ query: jest.fn() }));
jest.mock('@/lib/session', () => ({
  requireRole: jest.fn().mockResolvedValue({
    cpf: '00011122233',
    nome: 'Comercial',
    perfil: 'comercial',
  }),
}));
jest.mock('@/lib/storage/representante-storage', () => ({
  uploadDocumentoRepresentante: jest.fn().mockResolvedValue({
    path: '/tmp/doc.pdf',
    arquivo_remoto: { key: 'remote/doc.pdf', url: 'https://cdn/doc.pdf' },
  }),
}));
jest.mock('@/app/api/public/representantes/cadastro/helpers', () => ({
  validarArquivo: jest.fn().mockResolvedValue({
    valid: true,
    buffer: Buffer.from('fake'),
    contentType: 'application/pdf',
  }),
  validarCPF: jest.fn().mockReturnValue(true),
  validarCNPJ: jest.fn().mockReturnValue(true),
  validarEmail: jest.fn().mockReturnValue(true),
  sanitizarString: jest.fn((s: string) => s?.trim() ?? ''),
  limparNumeros: jest.fn((s: string) => s?.replace(/\D/g, '') ?? ''),
}));

import { query } from '@/lib/db';

const mockQuery = query as jest.MockedFunction<typeof query>;

/** Cria request fake com campos PJ obrigatórios preenchidos por padrão. */
function makeFakeRequest(fields: Record<string, string>): any {
  const fakeFile = new File(['content'], 'doc.pdf', {
    type: 'application/pdf',
  });
  const defaults: Record<string, string> = {
    cnpj: '11222333000181',
    razao_social: 'Empresa Teste Ltda',
  };
  const fd = new FormData();
  for (const [k, v] of Object.entries({ ...defaults, ...fields })) {
    fd.append(k, v);
  }
  fd.append('documento_identificacao', fakeFile);
  fd.append('cartao_cnpj', fakeFile);
  return {
    formData: () => Promise.resolve(fd),
    headers: { get: () => null },
  };
}

describe('POST /api/comercial/representantes — criação de lead pendente verificação', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Mocks para fluxo PJ de sucesso:
   * checkEmailDuplicate usa Promise.all internamente (2 queries em paralelo):
   *   1. email em representantes (vazio)
   *   2. email em leads (vazio)
   * checkCnpjDuplicate usa Promise.all internamente (2 queries em paralelo):
   *   3. cnpj em representantes (vazio)
   *   4. cnpj em leads (vazio)
   * 5. INSERT lead → retorna id UUID
   */
  function setupSuccessMocks() {
    mockQuery
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // email — representantes
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // email — leads
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // cnpj — representantes
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // cnpj — leads
      .mockResolvedValueOnce({
        rows: [{ id: 'uuid-test-123' }],
        rowCount: 1,
      } as any); // INSERT lead
  }

  it('retorna 201 com lead_id e nome', async () => {
    setupSuccessMocks();

    const { POST } = await import('@/app/api/comercial/representantes/route');
    const req = makeFakeRequest({
      nome: 'Novo Representante',
      email: 'novo@test.com',
      cpf: '12345678901',
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const data = await res.json();
    expect(data).toHaveProperty('lead_id', 'uuid-test-123');
    expect(data).toHaveProperty('nome', 'Novo Representante');
  });

  it('não retorna convite_link nem codigo (apenas na conversão posterior)', async () => {
    setupSuccessMocks();

    const { POST } = await import('@/app/api/comercial/representantes/route');
    const req = makeFakeRequest({
      nome: 'Rep Sem Convite',
      email: 'semconvite@test.com',
      cpf: '12345678901',
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data).not.toHaveProperty('convite_link');
    expect(data).not.toHaveProperty('convite_url');
    expect(data).not.toHaveProperty('senha_temporaria');
    expect(data).not.toHaveProperty('codigo');
  });

  it('cria lead com status pendente_verificacao (não verificado)', async () => {
    setupSuccessMocks();

    const { POST } = await import('@/app/api/comercial/representantes/route');
    const req = makeFakeRequest({
      nome: 'Rep Pendente',
      email: 'pendente@test.com',
      cpf: '12345678901',
    });

    await POST(req);

    const insertLeadCall = mockQuery.mock.calls.find(
      ([sql]) =>
        typeof sql === 'string' &&
        sql.includes('INSERT INTO public.representantes_cadastro_leads')
    );
    expect(insertLeadCall).toBeDefined();
    expect(insertLeadCall![0]).toMatch(/pendente_verificacao/);
    expect(insertLeadCall![0]).not.toMatch(/'verificado'/);
  });

  it('não faz INSERT direto em representantes (delegado ao fluxo de aprovação)', async () => {
    setupSuccessMocks();

    const { POST } = await import('@/app/api/comercial/representantes/route');
    const req = makeFakeRequest({
      nome: 'Rep Sem Insert Direto',
      email: 'seminsert@test.com',
      cpf: '12345678901',
    });

    await POST(req);

    const insertRepDireto = mockQuery.mock.calls.find(
      ([sql]) =>
        typeof sql === 'string' &&
        /INSERT INTO public\.representantes\b/.test(sql) &&
        !sql.includes('_cadastro_leads')
    );
    expect(insertRepDireto).toBeUndefined();
  });

  it('não faz INSERT em representantes_senhas', async () => {
    setupSuccessMocks();

    const { POST } = await import('@/app/api/comercial/representantes/route');
    const req = makeFakeRequest({
      nome: 'Rep Sem Senhas',
      email: 'semsenhasinsert@test.com',
      cpf: '12345678901',
    });

    await POST(req);

    const senhasInsert = mockQuery.mock.calls.find(
      ([sql]) =>
        typeof sql === 'string' &&
        sql.includes('representantes_senhas') &&
        sql.includes('INSERT')
    );
    expect(senhasInsert).toBeUndefined();
  });

  it('retorna 409 quando CNPJ já existe em representantes', async () => {
    // email ok (2 queries via Promise.all), cnpj duplicado em representantes (1ª query retorna row)
    mockQuery
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // email — representantes
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // email — leads
      .mockResolvedValueOnce({ rows: [{ id: 10 }], rowCount: 1 } as any) // cnpj — representantes
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // cnpj — leads

    const { POST } = await import('@/app/api/comercial/representantes/route');
    const req = makeFakeRequest({
      nome: 'Rep CNPJ Dup',
      email: 'cnpjdup@test.com',
      cpf: '12345678901',
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toMatch(/CNPJ/i);
  });

  it('retorna 409 quando CNPJ já existe em lead ativo', async () => {
    // email ok (2 queries via Promise.all), cnpj em leads
    mockQuery
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // email — representantes
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // email — leads
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // cnpj — representantes
      .mockResolvedValueOnce({ rows: [{ id: 'lead-cnpj' }], rowCount: 1 } as any); // cnpj — leads

    const { POST } = await import('@/app/api/comercial/representantes/route');
    const req = makeFakeRequest({
      nome: 'Rep CNPJ Lead Dup',
      email: 'cnpjleaddup@test.com',
      cpf: '12345678901',
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toMatch(/CNPJ/i);
  });

  it('retorna 409 quando email já existe em representantes', async () => {
    // checkEmailDuplicate usa Promise.all (2 queries em paralelo) — 1ª retorna row
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 2 }], rowCount: 1 } as any) // email — representantes
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // email — leads

    const { POST } = await import('@/app/api/comercial/representantes/route');
    const req = makeFakeRequest({
      nome: 'Rep Email Dup',
      email: 'emaildup@test.com',
      cpf: '09876543210',
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toMatch(/e-?mail/i);
  });

  it('retorna 403 quando sem permissão', async () => {
    (
      jest.requireMock('@/lib/session').requireRole as jest.Mock
    ).mockRejectedValueOnce(new Error('Sem permissão'));

    const { POST } = await import('@/app/api/comercial/representantes/route');
    const req = makeFakeRequest({
      nome: 'Sem Perm',
      email: 'semperm@test.com',
      cpf: '11111111111',
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
  });
});
