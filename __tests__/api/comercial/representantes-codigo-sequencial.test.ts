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
jest.mock('@/lib/representantes/gerar-convite', () => ({
  gerarTokenConvite: jest
    .fn()
    .mockResolvedValue({
      link: 'http://localhost/convite/abc',
      expira_em: '2026-12-31',
    }),
  logEmailConvite: jest.fn(),
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

  it('usa nextval(seq_representante_codigo) para gerar código', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // CPF check
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // email check
      .mockResolvedValueOnce({ rows: [{ codigo: '100' }], rowCount: 1 } as any) // nextval
      .mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 } as any) // INSERT representante
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any) // INSERT senhas
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any); // UPDATE doc_path

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
});
