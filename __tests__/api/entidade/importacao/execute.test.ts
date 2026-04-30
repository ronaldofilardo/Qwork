/**
 * @file __tests__/api/entidade/importacao/execute.test.ts
 * Testes: POST /api/entidade/importacao/execute
 *
 * Cobre:
 *  - Autenticação obrigatória (requireEntity)
 *  - Validação de arquivo e mapeamento ausentes
 *  - Execução com 0 linhas válidas (retorna 400)
 *  - Criação de novo funcionário vinculado à entidade (sem empresa)
 *  - Atualização de funcionário existente
 *  - Vínculo com entidade via funcionarios_entidades
 *  - Inativação de vínculo por data_demissao
 *  - Erros parciais não interrompem o lote inteiro (SAVEPOINT)
 */

jest.mock('@/lib/session', () => ({
  requireEntity: jest.fn(),
}));

jest.mock('@/lib/importacao/dynamic-parser', () => ({
  parseSpreadsheetAllRows: jest.fn(),
}));

jest.mock('@/lib/importacao/data-validator', () => ({
  validarDadosImportacao: jest.fn(),
}));

jest.mock('@/lib/db-transaction', () => ({
  withTransactionAsGestor: jest.fn(async (fn: (client: unknown) => Promise<unknown>) => {
    const { mockClient } = require('./execute.test');
    return fn(mockClient);
  }),
}));

jest.mock('@/lib/cpf-utils', () => ({
  limparCPF: jest.fn((cpf: string) => cpf.replace(/\D/g, '')),
}));

jest.mock('@/lib/xlsxParser', () => ({
  parseDateCell: jest.fn((v: string) => v || null),
}));

jest.mock('@/lib/auth/password-generator', () => ({
  gerarSenhaDeNascimento: jest.fn(() => '12345678'),
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(() => Promise.resolve('$2a$10$mockhashedpassword')),
}));

const { requireEntity } = require('@/lib/session');
const { parseSpreadsheetAllRows } = require('@/lib/importacao/dynamic-parser');
const { validarDadosImportacao } = require('@/lib/importacao/data-validator');

// Mock client de transação com comportamento configurável
export const mockClient = {
  query: jest.fn(),
};

function makeXlsxFile(): File {
  const buf = Buffer.from('PK fake xlsx content');
  const file = new File([buf], 'dados.xlsx', {
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

/**
 * Cria um objeto mock que satisfaz o contrato da API route.
 * Abordagem necessária porque em jest+jsdom, new Request(url, { body: fd })
 * NÃO propaga Content-Type automaticamente.
 */
function makeRequest(options?: {
  file?: File;
  mapeamento?: object;
  nivelCargoMap?: Record<string, string>;
}): Request {
  const fd = new FormData();
  const xlsxFile = options?.file ?? makeXlsxFile();
  fd.append('file', xlsxFile);
  if (options?.mapeamento !== undefined) {
    fd.append('mapeamento', JSON.stringify(options.mapeamento));
  }
  if (options?.nivelCargoMap) {
    fd.append('nivelCargoMap', JSON.stringify(options.nivelCargoMap));
  }
  return {
    headers: {
      get: (h: string) =>
        h === 'content-type' ? 'multipart/form-data; boundary=----jest' : null,
    },
    formData: () => Promise.resolve(fd),
  } as unknown as Request;
}

const MOCK_MAPEAMENTO = [
  { indice: 0, nomeOriginal: 'CPF', campoQWork: 'cpf' },
  { indice: 1, nomeOriginal: 'NOME', campoQWork: 'nome' },
  { indice: 2, nomeOriginal: 'FUNCAO', campoQWork: 'funcao' },
];

describe('POST /api/entidade/importacao/execute', () => {
  let POST: (req: Request) => Promise<Response>;

  beforeAll(async () => {
    const mod = await import(
      '@/app/api/entidade/importacao/execute/route'
    );
    POST = mod.POST;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    requireEntity.mockResolvedValue({
      entidade_id: 42,
      cpf: '99988877766',
      perfil: 'gestor',
    });

    parseSpreadsheetAllRows.mockReturnValue({
      success: true,
      data: [
        { cpf: '52998224725', nome: 'João Silva', funcao: 'Analista', data_nascimento: '1990-01-01' },
      ],
    });

    validarDadosImportacao.mockReturnValue({
      valido: true,
      resumo: { totalLinhas: 1, linhasValidas: 1, linhasComErros: 0, cpfsUnicos: 1 },
      erros: [],
      avisos: [],
    });

    // Configurar mock do client transacional
    mockClient.query.mockImplementation(async (sql: string) => {
      // SAVEPOINT operações
      if (typeof sql === 'string' && (sql.startsWith('SAVEPOINT') || sql.startsWith('RELEASE') || sql.startsWith('ROLLBACK'))) {
        return { rows: [] };
      }
      // SELECT de funcionário existente — retorna vazio (novo funcionário)
      if (typeof sql === 'string' && sql.includes('FROM funcionarios WHERE cpf')) {
        return { rows: [] };
      }
      // INSERT funcionario
      if (typeof sql === 'string' && sql.includes('INSERT INTO funcionarios')) {
        return { rows: [{ id: 99 }] };
      }
      // SELECT vínculo entidade — retorna vazio (novo vínculo)
      if (typeof sql === 'string' && sql.includes('FROM funcionarios_entidades')) {
        return { rows: [] };
      }
      // INSERT vínculo
      if (typeof sql === 'string' && sql.includes('INSERT INTO funcionarios_entidades')) {
        return { rows: [] };
      }
      return { rows: [] };
    });
  });

  it('retorna 400 quando Content-Type não é multipart/form-data', async () => {
    const req = new Request(
      'http://localhost/api/entidade/importacao/execute',
      {
        method: 'POST',
        body: 'invalid',
        headers: { 'content-type': 'application/json' },
      }
    );
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('retorna 400 quando arquivo não enviado', async () => {
    const fd = new FormData();
    fd.append('mapeamento', JSON.stringify(MOCK_MAPEAMENTO));
    const req = {
      headers: { get: (h: string) => h === 'content-type' ? 'multipart/form-data; boundary=----jest' : null },
      formData: () => Promise.resolve(fd),
    } as unknown as Request;
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Arquivo não enviado');
  });

  it('retorna 400 quando mapeamento não enviado', async () => {
    const fd = new FormData();
    fd.append('file', makeXlsxFile());
    const req = {
      headers: { get: (h: string) => h === 'content-type' ? 'multipart/form-data; boundary=----jest' : null },
      formData: () => Promise.resolve(fd),
    } as unknown as Request;
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Mapeamento de colunas não enviado');
  });

  it('retorna 400 quando nenhuma linha válida para importar', async () => {
    validarDadosImportacao.mockReturnValue({
      valido: false,
      resumo: { totalLinhas: 1, linhasValidas: 0, linhasComErros: 1, cpfsUnicos: 1 },
      erros: [{ linha: 2, campo: 'cpf', mensagem: 'CPF inválido', severidade: 'erro' }],
      avisos: [],
    });

    const res = await POST(makeRequest({ mapeamento: MOCK_MAPEAMENTO }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Nenhuma linha válida');
  });

  it('retorna 401/403 quando não autenticado', async () => {
    requireEntity.mockRejectedValue(new Error('Não autenticado'));

    const res = await POST(makeRequest({ mapeamento: MOCK_MAPEAMENTO }));
    expect([401, 403]).toContain(res.status);
  });

  it('cria funcionário novo com vínculo à entidade (sem empresa/CNPJ)', async () => {
    const res = await POST(makeRequest({ mapeamento: MOCK_MAPEAMENTO }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.resumo.funcionariosCriados).toBe(1);
    expect(body.data.resumo.vinculosCriados).toBe(1);
    expect(body.data.resumo.funcionariosAtualizados).toBe(0);

    // Verificar INSERT de vínculo foi feito em funcionarios_entidades (não em tabela de empresa)
    const insertVinculoCall = mockClient.query.mock.calls.find(
      (call: unknown[]) =>
        typeof call[0] === 'string' &&
        call[0].includes('funcionarios_entidades')
    );
    expect(insertVinculoCall).toBeDefined();

    // Verificar que NÃO foi feita nenhuma query à tabela de empresas
    const empresasCall = mockClient.query.mock.calls.find(
      (call: unknown[]) =>
        typeof call[0] === 'string' &&
        call[0].includes('empresas_clientes')
    );
    expect(empresasCall).toBeUndefined();
  });

  it('atualiza funcionário existente sem criar duplicata', async () => {
    // Simular funcionário já existente
    mockClient.query.mockImplementation(async (sql: string) => {
      if (typeof sql === 'string' && (sql.startsWith('SAVEPOINT') || sql.startsWith('RELEASE') || sql.startsWith('ROLLBACK'))) {
        return { rows: [] };
      }
      if (typeof sql === 'string' && sql.includes('FROM funcionarios WHERE cpf')) {
        return { rows: [{ id: 55, nivel_cargo: 'operacional', funcao: 'Analista' }] };
      }
      if (typeof sql === 'string' && sql.includes('FROM funcionarios_entidades')) {
        return { rows: [{ id: 1, ativo: true, data_desvinculo: null }] };
      }
      if (typeof sql === 'string' && sql.includes('UPDATE funcionarios')) {
        return { rows: [] };
      }
      return { rows: [] };
    });

    const res = await POST(makeRequest({ mapeamento: MOCK_MAPEAMENTO }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.resumo.funcionariosAtualizados).toBeLessThanOrEqual(1);
    expect(body.data.resumo.funcionariosCriados).toBe(0);
    expect(body.data.resumo.vinculosCriados).toBe(0);
  });

  it('inativa vínculo quando data_demissao está presente', async () => {
    parseSpreadsheetAllRows.mockReturnValue({
      success: true,
      data: [
        {
          cpf: '52998224725',
          nome: 'João Silva',
          funcao: 'Analista',
          data_demissao: '2026-03-31',
        },
      ],
    });

    mockClient.query.mockImplementation(async (sql: string) => {
      if (typeof sql === 'string' && (sql.startsWith('SAVEPOINT') || sql.startsWith('RELEASE') || sql.startsWith('ROLLBACK'))) {
        return { rows: [] };
      }
      if (typeof sql === 'string' && sql.includes('FROM funcionarios WHERE cpf')) {
        return { rows: [{ id: 55, nivel_cargo: null, funcao: 'Analista' }] };
      }
      if (typeof sql === 'string' && sql.includes('FROM funcionarios_entidades')) {
        return { rows: [{ id: 1, ativo: true, data_desvinculo: null }] };
      }
      if (typeof sql === 'string' && sql.includes('UPDATE funcionarios_entidades')) {
        return { rows: [] };
      }
      return { rows: [] };
    });

    const res = await POST(makeRequest({ mapeamento: MOCK_MAPEAMENTO }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.resumo.inativacoesRealizadas).toBe(1);
  });

  it('aplica nivel_cargo do mapa quando linha não tem nivel_cargo mapeado', async () => {
    const res = await POST(
      makeRequest({
        mapeamento: MOCK_MAPEAMENTO,
        nivelCargoMap: { Analista: 'operacional' },
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);

    // O INSERT de funcionários deve ter sido chamado com nivel_cargo
    const insertCall = mockClient.query.mock.calls.find(
      (call: unknown[]) =>
        typeof call[0] === 'string' &&
        call[0].includes('INSERT INTO funcionarios')
    );
    expect(insertCall).toBeDefined();
    if (insertCall) {
      const params = insertCall[1] as unknown[];
      expect(params).toContain('operacional');
    }
  });

  it('retorna erros parciais sem interromper o lote (SAVEPOINT)', async () => {
    parseSpreadsheetAllRows.mockReturnValue({
      success: true,
      data: [
        { cpf: '11111111111', nome: 'OK', funcao: 'Dev' },
        { cpf: '22222222222', nome: 'Falha', funcao: 'CEO' },
      ],
    });

    validarDadosImportacao.mockReturnValue({
      valido: true,
      resumo: { totalLinhas: 2, linhasValidas: 2, linhasComErros: 0, cpfsUnicos: 2 },
      erros: [],
      avisos: [],
    });

    let callCount = 0;
    mockClient.query.mockImplementation(async (sql: string) => {
      if (typeof sql === 'string' && (sql.startsWith('SAVEPOINT') || sql.startsWith('RELEASE') || sql.startsWith('ROLLBACK'))) {
        return { rows: [] };
      }
      if (typeof sql === 'string' && sql.includes('FROM funcionarios WHERE cpf')) {
        return { rows: [] };
      }
      if (typeof sql === 'string' && sql.includes('INSERT INTO funcionarios')) {
        callCount++;
        // Falha ao inserir o segundo funcionário
        if (callCount === 2) throw new Error('Constraint violation');
        return { rows: [{ id: callCount * 10 }] };
      }
      if (typeof sql === 'string' && sql.includes('FROM funcionarios_entidades')) {
        return { rows: [] };
      }
      return { rows: [] };
    });

    const res = await POST(makeRequest({ mapeamento: MOCK_MAPEAMENTO }));
    const body = await res.json();

    // Deve retornar 200 com sucesso parcial
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    // Primeiro funcionário criado com sucesso
    expect(body.data.resumo.funcionariosCriados).toBeGreaterThanOrEqual(1);
    // E erros reportados para o segundo
    expect(body.data.erros.length).toBeGreaterThan(0);
  });
});
