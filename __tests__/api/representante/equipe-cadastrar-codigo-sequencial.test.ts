/**
 * @file __tests__/api/representante/equipe-cadastrar-codigo-sequencial.test.ts
 *
 * Testes para POST /api/representante/equipe/cadastrar — geração de código sequencial
 * Verifica que o código do vendedor é gerado via nextval('seq_vendedor_codigo')
 */

import { query } from '@/lib/db';

jest.mock('@/lib/db', () => ({ query: jest.fn() }));
jest.mock('@/lib/session-representante', () => ({
  requireRepresentante: jest.fn().mockReturnValue({
    representante_id: 7,
    nome: 'Rep Teste',
    cpf: '99988877766',
    status: 'ativo',
  }),
  repAuthErrorResponse: jest.fn((err: Error) => {
    if (err.message === 'REP_NAO_AUTENTICADO')
      return { status: 401, body: { error: 'Não autenticado.' } };
    return { status: 500, body: { error: 'Erro interno.' } };
  }),
}));
jest.mock('@/lib/vendedores/gerar-convite', () => ({
  gerarTokenConviteVendedor: jest.fn().mockResolvedValue({
    link: 'http://localhost/convite-v/abc',
    expira_em: '2026-12-31',
  }),
  logEmailConviteVendedor: jest.fn(),
}));
jest.mock('@/lib/storage/representante-storage', () => ({
  uploadDocumentoVendedor: jest.fn().mockResolvedValue({
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
}));

const mockQuery = query as jest.MockedFunction<typeof query>;

function makeFakeRequest(fields: Record<string, string>): any {
  const fakeFile = new File(['content'], 'cpf.pdf', {
    type: 'application/pdf',
  });
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    fd.append(k, v);
  }
  fd.append('documento_cpf', fakeFile);
  return { formData: () => Promise.resolve(fd) };
}

describe('POST /api/representante/equipe/cadastrar — código sequencial', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // OBSOLETO: seq_vendedor_codigo foi removida na migration 1227
  it.skip('usa nextval(seq_vendedor_codigo) para gerar código do vendedor', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ tipo_pessoa: 'pf', cpf: '99988877766', cnpj: null }],
        rowCount: 1,
      } as any) // rep data
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // cpf check
      .mockResolvedValueOnce({ rows: [{ id: 50 }], rowCount: 1 } as any) // INSERT usuario
      .mockResolvedValueOnce({
        rows: [{ codigo: '101' }],
        rowCount: 1,
      } as any) // nextval
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any) // INSERT perfil
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any) // UPDATE doc_cad_path
      .mockResolvedValueOnce({ rows: [{ id: 20 }], rowCount: 1 } as any); // INSERT hierarquia

    const { POST } =
      await import('@/app/api/representante/equipe/cadastrar/route');

    const req = makeFakeRequest({
      nome: 'Novo Vendedor',
      cpf: '11122233344',
      tipo_pessoa: 'pf',
    });

    const res = await POST(req);
    const data = await res.json();

    // Verificar que nextval foi chamado com seq_vendedor_codigo
    const seqCall = mockQuery.mock.calls.find(
      ([sql]) => typeof sql === 'string' && sql.includes('seq_vendedor_codigo')
    );
    expect(seqCall).toBeDefined();
    expect(seqCall[0]).toMatch(/nextval/i);

    if (res.status === 201) {
      expect(data.codigo).toBe('101');
    }
  });
});
