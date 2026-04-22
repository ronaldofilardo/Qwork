/**
 * @file __tests__/api/representante/equipe-cadastrar-codigo-sequencial.test.ts
 *
 * Testes para POST /api/representante/equipe/cadastrar
 * Migration 1227: o campo `codigo` foi removido de vendedores_perfil.
 * A rota agora retorna { vendedor_id, vinculo_id, convite_url } e insere
 * automaticamente em hierarquia_comercial vinculando ao representante logado.
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
  gerarTokenConviteVendedor: jest
    .fn()
    .mockResolvedValue({
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

describe('POST /api/representante/equipe/cadastrar — Migration 1227', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('NÃO chama seq_vendedor_codigo (removido na Migration 1227)', async () => {
    // Arrange: mocks na ordem correta do fluxo atual (sem nextval)
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ tipo_pessoa: 'pf', cpf: '99988877766', cnpj: null }],
        rowCount: 1,
      } as any) // rep data
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // cpf check
      .mockResolvedValueOnce({ rows: [{ id: 50 }], rowCount: 1 } as any) // INSERT usuarios
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any) // INSERT vendedores_perfil
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any) // UPDATE doc_cad_path
      .mockResolvedValueOnce({ rows: [{ id: 20 }], rowCount: 1 } as any); // INSERT hierarquia_comercial

    const { POST } = await import('@/app/api/representante/equipe/cadastrar/route');
    const req = makeFakeRequest({
      nome: 'Novo Vendedor',
      cpf: '11122233344',
      tipo_pessoa: 'pf',
    });

    // Act
    const res = await POST(req);

    // Assert: seq_vendedor_codigo NÃO deve ter sido chamado
    const seqCall = mockQuery.mock.calls.find(
      ([sql]) => typeof sql === 'string' && /seq_vendedor_codigo/.test(sql)
    );
    expect(seqCall).toBeUndefined();
  });

  it('cria vendedor e insere automaticamente em hierarquia_comercial', async () => {
    // Arrange
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ tipo_pessoa: 'pf', cpf: '99988877766', cnpj: null }],
        rowCount: 1,
      } as any) // rep data
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // cpf check
      .mockResolvedValueOnce({ rows: [{ id: 50 }], rowCount: 1 } as any) // INSERT usuarios
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any) // INSERT vendedores_perfil
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any) // UPDATE doc_cad_path
      .mockResolvedValueOnce({ rows: [{ id: 20 }], rowCount: 1 } as any); // INSERT hierarquia_comercial

    const { POST } = await import('@/app/api/representante/equipe/cadastrar/route');
    const req = makeFakeRequest({
      nome: 'Novo Vendedor',
      cpf: '11122233344',
      tipo_pessoa: 'pf',
    });

    // Act
    const res = await POST(req);
    const data = await res.json();

    // Assert: deve retornar 201 com vendedor_id e convite_url
    expect(res.status).toBe(201);
    expect(data.vendedor_id).toBe(50);
    expect(data.vinculo_id).toBe(20);
    expect(data.convite_url).toBe('http://localhost/convite-v/abc');
    // Não deve retornar campo codigo (removido na Migration 1227)
    expect(data.codigo).toBeUndefined();
  });

  it('insere em hierarquia_comercial com representante_id da sessão', async () => {
    // Arrange
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ tipo_pessoa: 'pf', cpf: '99988877766', cnpj: null }],
        rowCount: 1,
      } as any) // rep data
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // cpf check
      .mockResolvedValueOnce({ rows: [{ id: 55 }], rowCount: 1 } as any) // INSERT usuarios
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any) // INSERT vendedores_perfil
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any) // UPDATE doc_cad_path
      .mockResolvedValueOnce({ rows: [{ id: 30 }], rowCount: 1 } as any); // INSERT hierarquia_comercial

    const { POST } = await import('@/app/api/representante/equipe/cadastrar/route');
    const req = makeFakeRequest({
      nome: 'Vendedor B',
      cpf: '22233344455',
      tipo_pessoa: 'pf',
    });

    // Act
    await POST(req);

    // Assert: INSERT hierarquia_comercial com vendedor_id=55 e representante_id=7
    const hierCall = mockQuery.mock.calls.find(
      ([sql]) =>
        typeof sql === 'string' &&
        /hierarquia_comercial/.test(sql) &&
        /INSERT/.test(sql)
    );
    expect(hierCall).toBeDefined();
    const [, params] = hierCall!;
    expect(params).toContain(55); // vendedor_id
    expect(params).toContain(7);  // representante_id da sessão
  });

  it('retorna 409 quando CPF já existe', async () => {
    // Arrange
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ tipo_pessoa: 'pf', cpf: '99988877766', cnpj: null }],
        rowCount: 1,
      } as any) // rep data
      .mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 } as any); // cpf check — já existe

    const { POST } = await import('@/app/api/representante/equipe/cadastrar/route');
    const req = makeFakeRequest({
      nome: 'Duplicado',
      cpf: '11122233344',
      tipo_pessoa: 'pf',
    });

    // Act
    const res = await POST(req);

    // Assert
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toMatch(/CPF/i);
  });
});

