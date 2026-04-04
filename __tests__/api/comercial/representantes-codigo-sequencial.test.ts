/**
 * @file __tests__/api/comercial/representantes-codigo-sequencial.test.ts
 *
 * Testes para POST /api/comercial/representantes — geração de código sequencial
 * Verifica que o código do representante é gerado via nextval('seq_representante_codigo')
 */

import { query } from '@/lib/db';

jest.mock('@/lib/db', () => ({ query: jest.fn() }));
jest.mock('@/lib/session', () => ({
  requireRole: jest.fn().mockResolvedValue({
    cpf: '00011122233',
    nome: 'Comercial',
    perfil: 'comercial',
  }),
}));
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2b$12$hashedvalue'),
}));
jest.mock('@/lib/storage/representante-storage', () => ({
  uploadDocumentoRepresentante: jest.fn().mockResolvedValue({
    path: '/tmp/doc.pdf',
    arquivo_remoto: { key: 'remote/doc.pdf' },
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
  return { formData: () => Promise.resolve(fd) };
}

describe('POST /api/comercial/representantes — código sequencial', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function setupSuccessMocks() {
    mockQuery
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // CPF check
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // email check
      .mockResolvedValueOnce({ rows: [{ codigo: '100' }], rowCount: 1 } as any) // nextval
      .mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 } as any) // INSERT representante
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any) // INSERT senhas
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any); // UPDATE doc_path
  }

  it('usa nextval(seq_representante_codigo) para gerar código', async () => {
    setupSuccessMocks();

    const { POST } = await import('@/app/api/comercial/representantes/route');

    const req = makeFakeRequest({
      nome: 'Novo Representante',
      tipo_pessoa: 'pf',
      email: 'novo@test.com',
      cpf: '12345678901',
    });

    const res = await POST(req);
    const data = await res.json();

    // Verificar que nextval foi chamado
    const seqCall = mockQuery.mock.calls.find(
      ([sql]) =>
        typeof sql === 'string' && sql.includes('seq_representante_codigo')
    );
    expect(seqCall).toBeDefined();
    expect(seqCall[0]).toMatch(/nextval/i);

    if (res.status === 201) {
      expect(data.codigo).toBe('100');
    }
  });

  it('retorna senha_temporaria no formato CPF[0..5]+Qw+CPF[-2..] e NÃO retorna convite_url', async () => {
    setupSuccessMocks();

    const { POST } = await import('@/app/api/comercial/representantes/route');

    const req = makeFakeRequest({
      nome: 'Rep Senha Temp',
      tipo_pessoa: 'pf',
      email: 'senhatemp@test.com',
      cpf: '12345678901',
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await res.json();

    expect(data).toHaveProperty('senha_temporaria');
    expect(data.senha_temporaria).toMatch(/^\d{6}Qw\d{2}$/);
    expect(data).not.toHaveProperty('convite_url');
  });

  it('insere representante com status apto (não aguardando_senha)', async () => {
    setupSuccessMocks();

    const { POST } = await import('@/app/api/comercial/representantes/route');

    const req = makeFakeRequest({
      nome: 'Rep Apto',
      tipo_pessoa: 'pf',
      email: 'apto@test.com',
      cpf: '12345678901',
    });

    await POST(req);

    const insertRepCall = mockQuery.mock.calls.find(
      ([sql]) =>
        typeof sql === 'string' &&
        sql.includes('INSERT INTO public.representantes')
    );
    expect(insertRepCall).toBeDefined();
    expect(insertRepCall![0]).toMatch(/'apto'/);
    expect(insertRepCall![0]).not.toMatch(/'aguardando_senha'/);
  });

  it('insere representantes_senhas com primeira_senha_alterada = FALSE', async () => {
    setupSuccessMocks();

    const { POST } = await import('@/app/api/comercial/representantes/route');

    const req = makeFakeRequest({
      nome: 'Rep Senha Hash',
      tipo_pessoa: 'pf',
      email: 'senhahash@test.com',
      cpf: '12345678901',
    });

    await POST(req);

    const senhasInsertCall = mockQuery.mock.calls.find(
      ([sql]) =>
        typeof sql === 'string' &&
        sql.includes('representantes_senhas') &&
        sql.includes('INSERT')
    );
    expect(senhasInsertCall).toBeDefined();
    expect(senhasInsertCall![0]).toMatch(/primeira_senha_alterada/i);
    expect(senhasInsertCall![0]).toMatch(/FALSE/i);
  });
});
