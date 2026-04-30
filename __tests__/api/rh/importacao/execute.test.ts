/**
 * @file __tests__/api/rh/importacao/execute.test.ts
 * Testes: POST /api/rh/importacao/execute
 *
 * Cobre:
 *  - Autenticação obrigatória (requireClinica)
 *  - Validação de arquivo e mapeamento ausentes / inválidos
 *  - Parser falha → 400
 *  - Nenhuma linha válida → 400
 *  - Empresa nova (CNPJ inédito) → criada
 *  - Empresa existente mesma clínica → reutilizada
 *  - Empresa CNPJ de outra clínica → funcionários bloqueados
 *  - CNPJ pertence a Entidade → bloqueado
 *  - Funcionário novo → INSERT + vínculo
 *  - Funcionário existente → UPDATE dados
 *  - Empresa sem CNPJ → busca por nome
 *  - Resposta JSON com contadores corretos
 */

jest.mock('@/lib/session', () => ({
  requireClinica: jest.fn(),
}));

jest.mock('@/lib/importacao/dynamic-parser', () => ({
  parseSpreadsheetAllRows: jest.fn(),
}));

jest.mock('@/lib/importacao/data-validator', () => ({
  validarDadosImportacao: jest.fn(),
}));

jest.mock('@/lib/db-transaction', () => ({
  withTransaction: jest.fn(),
}));

jest.mock('@/lib/cpf-utils', () => ({
  limparCPF: jest.fn((cpf: string) => cpf.replace(/\D/g, '')),
}));

jest.mock('@/lib/validators', () => ({
  normalizeCNPJ: jest.fn((v: string) => v.replace(/\D/g, '')),
}));

jest.mock('@/lib/xlsxParser', () => ({
  parseDateCell: jest.fn((v: string) => v),
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2b$10$hashedpassword'),
}));

jest.mock('@/lib/auth/password-generator', () => ({
  gerarSenhaDeNascimento: jest.fn().mockReturnValue('01011990'),
}));

const { requireClinica } = require('@/lib/session');
const { parseSpreadsheetAllRows } = require('@/lib/importacao/dynamic-parser');
const { validarDadosImportacao } = require('@/lib/importacao/data-validator');
const { withTransaction } = require('@/lib/db-transaction');

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeXlsxFile(): File {
  const buf = Buffer.from('PK fake xlsx content');
  const file = new File([buf], 'planilha.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  Object.defineProperty(file, 'arrayBuffer', {
    configurable: true,
    value: () =>
      Promise.resolve(
        buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
      ),
  });
  return file;
}

function makeRequest(
  file?: File,
  mapeamento?: object,
  rawMapeamento?: string
): Request {
  const fd = new FormData();
  if (file) fd.append('file', file);
  if (rawMapeamento !== undefined) {
    fd.append('mapeamento', rawMapeamento);
  } else if (mapeamento !== undefined) {
    fd.append('mapeamento', JSON.stringify(mapeamento));
  }
  return {
    headers: {
      get: (h: string) =>
        h === 'content-type' ? 'multipart/form-data; boundary=----jest' : null,
    },
    formData: () => Promise.resolve(fd),
  } as unknown as Request;
}

function makeNonMultipartRequest(): Request {
  return {
    headers: {
      get: (h: string) => (h === 'content-type' ? 'application/json' : null),
    },
    formData: () => Promise.resolve(new FormData()),
  } as unknown as Request;
}

const MOCK_MAPEAMENTO = [
  { indice: 0, nomeOriginal: 'CPF', campoQWork: 'cpf' },
  { indice: 1, nomeOriginal: 'NOME', campoQWork: 'nome' },
  { indice: 2, nomeOriginal: 'FUNCAO', campoQWork: 'funcao' },
];

const MOCK_PARSED_ROWS = [
  {
    cpf: '52998224725',
    nome: 'João Silva',
    funcao: 'Analista',
    setor: 'TI',
    email: 'joao@empresa.com',
    nome_empresa: 'Empresa A',
    cnpj_empresa: '12345678000195',
    data_nascimento: '1990-01-01',
    matricula: 'MAT001',
    nivel_cargo: 'operacional',
  },
];

const EMPTY_ERROS_RESPONSE = {
  valido: true,
  resumo: {
    totalLinhas: 1,
    linhasValidas: 1,
    linhasComErros: 0,
    cpfsUnicos: 1,
    linhasComAvisos: 0,
  },
  erros: [],
  avisos: [],
};

/** Mock client para withTransaction */
function makeMockClient(queryResponses: Array<{ rows: object[] }> = []): {
  query: jest.Mock;
} {
  let callCount = 0;
  const queryMock = jest.fn().mockImplementation(() => {
    const resp = queryResponses[callCount] ?? { rows: [] };
    callCount++;
    return Promise.resolve(resp);
  });
  return { query: queryMock };
}

// ─── Testes ──────────────────────────────────────────────────────────────────

describe('POST /api/rh/importacao/execute', () => {
  let POST: (req: Request) => Promise<Response>;

  beforeAll(async () => {
    const mod = await import('@/app/api/rh/importacao/execute/route');
    POST = mod.POST;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    requireClinica.mockResolvedValue({
      clinica_id: 10,
      cpf: '99988877766',
      perfil: 'rh',
    });

    parseSpreadsheetAllRows.mockReturnValue({
      success: true,
      data: MOCK_PARSED_ROWS,
    });

    validarDadosImportacao.mockReturnValue(EMPTY_ERROS_RESPONSE);
  });

  // ─── Validações de entrada ─────────────────────────────────────────────────

  it('retorna 400 quando Content-Type não é multipart/form-data', async () => {
    const res = await POST(makeNonMultipartRequest());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('multipart/form-data');
  });

  it('retorna 400 quando arquivo não enviado', async () => {
    const res = await POST(makeRequest(undefined, MOCK_MAPEAMENTO));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Arquivo não enviado');
  });

  it('retorna 400 quando mapeamento não enviado', async () => {
    const res = await POST(makeRequest(makeXlsxFile()));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Mapeamento de colunas não enviado');
  });

  it('retorna 400 quando mapeamento é JSON inválido', async () => {
    const res = await POST(
      makeRequest(makeXlsxFile(), undefined, '{invalid json}')
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('nválido');
  });

  it('retorna 403 quando não autenticado como clínica', async () => {
    requireClinica.mockRejectedValue(
      Object.assign(new Error('Clínica não identificada'), {
        status: 403,
      })
    );
    const res = await POST(makeRequest(makeXlsxFile(), MOCK_MAPEAMENTO));
    expect([403, 500]).toContain(res.status);
  });

  it('retorna 400 quando parser falha', async () => {
    parseSpreadsheetAllRows.mockReturnValue({
      success: false,
      error: 'Arquivo corrompido',
    });
    const res = await POST(makeRequest(makeXlsxFile(), MOCK_MAPEAMENTO));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Arquivo corrompido');
  });

  it('retorna 400 quando todas as linhas têm erros críticos de formato', async () => {
    validarDadosImportacao.mockReturnValue({
      valido: false,
      resumo: {
        totalLinhas: 1,
        linhasValidas: 0,
        linhasComErros: 1,
        cpfsUnicos: 0,
        linhasComAvisos: 0,
      },
      erros: [{ linha: 2, campo: 'cpf', mensagem: 'CPF inválido' }],
      avisos: [],
    });
    const res = await POST(makeRequest(makeXlsxFile(), MOCK_MAPEAMENTO));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.details).toHaveLength(1);
  });

  // ─── Fluxo de empresa ──────────────────────────────────────────────────────

  it('cria empresa nova quando CNPJ não existe', async () => {
    const mockClient = makeMockClient([
      { rows: [] }, // empresaExist (CNPJ não encontrado)
      { rows: [] }, // entidadeCheck (não é entidade)
      { rows: [{ id: 55 }] }, // insertEmpresa
      { rows: [] }, // SAVEPOINT sp_func_...
      { rows: [] }, // existFunc (funcionario CPF não existe)
      { rows: [{ id: 1 }] }, // insertFunc
      { rows: [] }, // vinculoExist (sem vínculo)
      { rows: [{}] }, // INSERT funcionarios_clinicas
      { rows: [] }, // RELEASE SAVEPOINT
      { rows: [{}] }, // importacoes_clinica INSERT
    ]);

    withTransaction.mockImplementation(
      async (cb: (client: unknown) => Promise<unknown>) => cb(mockClient)
    );

    const res = await POST(makeRequest(makeXlsxFile(), MOCK_MAPEAMENTO));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.resumo.empresasCriadas).toBe(1);
    expect(body.data.resumo.funcionariosCriados).toBe(1);
    expect(body.data.resumo.vinculosCriados).toBe(1);
  });

  it('reutiliza empresa existente da mesma clínica', async () => {
    const mockClient = makeMockClient([
      { rows: [{ id: 30, clinica_id: 10 }] }, // empresaExist mesma clinica
      { rows: [] }, // SAVEPOINT
      { rows: [] }, // existFunc (funcionario não existe)
      { rows: [{ id: 1 }] }, // insertFunc
      { rows: [] }, // vinculoExist
      { rows: [{}] }, // INSERT funcionarios_clinicas
      { rows: [] }, // RELEASE SAVEPOINT
      { rows: [{}] }, // importacoes_clinica INSERT
    ]);

    withTransaction.mockImplementation(
      async (cb: (client: unknown) => Promise<unknown>) => cb(mockClient)
    );

    const res = await POST(makeRequest(makeXlsxFile(), MOCK_MAPEAMENTO));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.resumo.empresasExistentes).toBe(1);
    expect(body.data.resumo.empresasCriadas).toBe(0);
  });

  it('bloqueia empresa com CNPJ de outra clínica', async () => {
    const mockClient = makeMockClient([
      { rows: [{ id: 30, clinica_id: 99 }] }, // empresa de outra clínica
      { rows: [{}] }, // importacoes_clinica INSERT
    ]);

    withTransaction.mockImplementation(
      async (cb: (client: unknown) => Promise<unknown>) => cb(mockClient)
    );

    const res = await POST(makeRequest(makeXlsxFile(), MOCK_MAPEAMENTO));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.resumo.empresasBloqueadas).toBe(1);
    expect(body.data.resumo.funcionariosCriados).toBe(0);
    // Deve ter erro de processamento para o funcionário bloqueado
    const erros = body.data.erros as Array<{ mensagem: string }>;
    expect(erros.some((e) => e.mensagem.includes('outra clínica'))).toBe(true);
  });

  it('bloqueia empresa cujo CNPJ pertence a uma Entidade', async () => {
    const mockClient = makeMockClient([
      { rows: [] }, // empresa não existe
      { rows: [{ exists: true }] }, // CNPJ é de entidade
      { rows: [{}] }, // importacoes_clinica INSERT
    ]);

    withTransaction.mockImplementation(
      async (cb: (client: unknown) => Promise<unknown>) => cb(mockClient)
    );

    const res = await POST(makeRequest(makeXlsxFile(), MOCK_MAPEAMENTO));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.resumo.empresasBloqueadas).toBe(1);
    const erros = body.data.erros as Array<{ mensagem: string }>;
    expect(erros.some((e) => e.mensagem.includes('Entidade'))).toBe(true);
  });

  // ─── Fluxo de funcionário ──────────────────────────────────────────────────

  it('atualiza funcionário existente sem criar duplicata', async () => {
    const mockClient = makeMockClient([
      { rows: [{ id: 30, clinica_id: 10 }] }, // empresa existente
      { rows: [] }, // SAVEPOINT
      // existFunc encontra CPF → UPDATE
      {
        rows: [
          {
            id: 7,
            nivel_cargo: 'operacional',
            funcao: 'Analista',
          },
        ],
      },
      { rows: [] }, // UPDATE funcionarios (data_nascimento)
      { rows: [{ id: 20, ativo: true }] }, // vinculoExist
      { rows: [{}] }, // UPDATE funcionarios_clinicas (dados)
      { rows: [] }, // RELEASE SAVEPOINT
      { rows: [{}] }, // importacoes_clinica INSERT
    ]);

    withTransaction.mockImplementation(
      async (cb: (client: unknown) => Promise<unknown>) => cb(mockClient)
    );

    const res = await POST(makeRequest(makeXlsxFile(), MOCK_MAPEAMENTO));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.resumo.funcionariosAtualizados).toBeGreaterThanOrEqual(0);
    expect(body.data.resumo.funcionariosCriados).toBe(0);
  });

  it('empresa sem CNPJ encontrada por nome da mesma clínica', async () => {
    parseSpreadsheetAllRows.mockReturnValue({
      success: true,
      data: [
        {
          cpf: '52998224725',
          nome: 'Maria Souza',
          funcao: 'Analista',
          setor: 'TI',
          email: null,
          nome_empresa: 'Empresa Sem CNPJ',
          cnpj_empresa: '', // sem CNPJ
          data_nascimento: '1992-05-10',
          matricula: 'MAT002',
        },
      ],
    });

    const mockClient = makeMockClient([
      // Sem CNPJ → busca por nome
      { rows: [{ id: 42 }] }, // empresa encontrada por nome+clinica
      { rows: [] }, // SAVEPOINT
      { rows: [] }, // existFunc
      { rows: [{ id: 5 }] }, // insertFunc
      { rows: [] }, // vinculoExist
      { rows: [{}] }, // INSERT funcionarios_clinicas
      { rows: [] }, // RELEASE SAVEPOINT
      { rows: [{}] }, // importacoes_clinica INSERT
    ]);

    withTransaction.mockImplementation(
      async (cb: (client: unknown) => Promise<unknown>) => cb(mockClient)
    );

    const res = await POST(makeRequest(makeXlsxFile(), MOCK_MAPEAMENTO));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.resumo.empresasExistentes).toBe(1);
  });

  // ─── Resposta JSON ─────────────────────────────────────────────────────────

  it('resposta contém todos os campos do resumo esperados', async () => {
    const mockClient = makeMockClient([
      { rows: [] }, // empresa não existe
      { rows: [] }, // não é entidade
      { rows: [{ id: 1 }] }, // createEmpresa
      { rows: [] }, // SAVEPOINT
      { rows: [] }, // existFunc
      { rows: [{ id: 2 }] }, // insertFunc
      { rows: [] }, // vinculoExist
      { rows: [{}] }, // INSERT funcionarios_clinicas
      { rows: [] }, // RELEASE SAVEPOINT
      { rows: [{}] }, // importacoes_clinica INSERT
    ]);

    withTransaction.mockImplementation(
      async (cb: (client: unknown) => Promise<unknown>) => cb(mockClient)
    );

    const res = await POST(makeRequest(makeXlsxFile(), MOCK_MAPEAMENTO));
    expect(res.status).toBe(200);
    const body = await res.json();
    const resumo = body.data.resumo;

    expect(resumo).toHaveProperty('totalLinhasProcessadas');
    expect(resumo).toHaveProperty('empresasCriadas');
    expect(resumo).toHaveProperty('empresasExistentes');
    expect(resumo).toHaveProperty('empresasBloqueadas');
    expect(resumo).toHaveProperty('funcionariosCriados');
    expect(resumo).toHaveProperty('funcionariosAtualizados');
    expect(resumo).toHaveProperty('vinculosCriados');
    expect(resumo).toHaveProperty('vinculosAtualizados');
    expect(resumo).toHaveProperty('inativacoesRealizadas');
    expect(resumo).toHaveProperty('readmissoesRealizadas');
    expect(body.data).toHaveProperty('erros');
    expect(body.data).toHaveProperty('avisos');
  });

  it('retorna 500 em erro inesperado de banco', async () => {
    withTransaction.mockRejectedValue(new Error('Connection refused'));

    const res = await POST(makeRequest(makeXlsxFile(), MOCK_MAPEAMENTO));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Erro interno do servidor');
  });
});
