/**
 * @file __tests__/api/comercial/representantes-codigo-sequencial.test.ts
 *
 * Testes para POST /api/comercial/representantes — criação de lead pendente de verificação.
 * O comercial cria um lead com status='pendente_verificacao'. O lead aparece na fila de
 * Candidatos para o comercial aprovar. Só após aprovação + conversão o representante é criado
 * e o link de convite é gerado.
 * Retorna: { lead_id, nome }
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

function makeFakeRequest(fields: Record<string, string>): any {
  const fakeFile = new File(['content'], 'doc.pdf', {
    type: 'application/pdf',
  });
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    fd.append(k, v);
  }
  fd.append('documento_identificacao', fakeFile);
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
   * Mocks para fluxo PF de sucesso:
   * 1. CPF check — representantes (vazio)
   * 2. CPF check — leads (vazio)
   * 3. email check — representantes (vazio)
   * 4. email check — leads (vazio)
   * 5. INSERT lead → retorna id UUID
   */
  function setupSuccessMocks() {
    mockQuery
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // CPF — representantes
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // CPF — leads
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // email — representantes
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // email — leads
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
      tipo_pessoa: 'pf',
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
      tipo_pessoa: 'pf',
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
      tipo_pessoa: 'pf',
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
      tipo_pessoa: 'pf',
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
      tipo_pessoa: 'pf',
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

  it('retorna 409 quando CPF já existe em representantes', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const { POST } = await import('@/app/api/comercial/representantes/route');
    const req = makeFakeRequest({
      nome: 'Rep CPF Dup',
      tipo_pessoa: 'pf',
      email: 'cpfdup@test.com',
      cpf: '12345678901',
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toMatch(/CPF/i);
  });

  it('retorna 409 quando CPF já existe em leads ativos', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)
      .mockResolvedValueOnce({
        rows: [{ id: 'uuid-lead-dup' }],
        rowCount: 1,
      } as any);

    const { POST } = await import('@/app/api/comercial/representantes/route');
    const req = makeFakeRequest({
      nome: 'Rep Lead Dup',
      tipo_pessoa: 'pf',
      email: 'leadcpfdup@test.com',
      cpf: '12345678901',
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toMatch(/CPF/i);
  });

  it('retorna 409 quando email já existe em representantes', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)
      .mockResolvedValueOnce({ rows: [{ id: 2 }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const { POST } = await import('@/app/api/comercial/representantes/route');
    const req = makeFakeRequest({
      nome: 'Rep Email Dup',
      tipo_pessoa: 'pf',
      email: 'emaildup@test.com',
      cpf: '09876543210',
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toMatch(/email/i);
  });

  it('retorna 403 quando sem permissão', async () => {
    (
      jest.requireMock('@/lib/session').requireRole as jest.Mock
    ).mockRejectedValueOnce(new Error('Sem permissão'));

    const { POST } = await import('@/app/api/comercial/representantes/route');
    const req = makeFakeRequest({
      nome: 'Sem Perm',
      tipo_pessoa: 'pf',
      email: 'semperm@test.com',
      cpf: '11111111111',
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
  });
});
