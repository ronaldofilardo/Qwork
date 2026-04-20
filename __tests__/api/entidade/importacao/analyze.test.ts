/**
 * @file __tests__/api/entidade/importacao/analyze.test.ts
 * Testes: POST /api/entidade/importacao/analyze
 *
 * Cobre:
 *  - Autenticação obrigatória
 *  - Validação de Content-Type
 *  - Validação de arquivo (ausente, tamanho, extensão)
 *  - Retorno correto com campos sem cnpj_empresa/nome_empresa
 */

jest.mock('@/lib/session', () => ({
  requireEntity: jest.fn(),
}));

jest.mock('@/lib/importacao/dynamic-parser', () => ({
  parseSpreadsheetHeaders: jest.fn(),
}));

jest.mock('@/lib/importacao/column-matcher', () => ({
  sugerirMapeamento: jest.fn(),
  getCamposQWorkEntidade: jest.fn(),
  getCamposObrigatoriosEntidade: jest.fn(),
}));

const { requireEntity } = require('@/lib/session');
const { parseSpreadsheetHeaders } = require('@/lib/importacao/dynamic-parser');
const {
  sugerirMapeamento,
  getCamposQWorkEntidade,
  getCamposObrigatoriosEntidade,
} = require('@/lib/importacao/column-matcher');

function makeMultipartRequest(
  file?: File,
  overrideContentType?: string
): Request {
  if (overrideContentType) {
    // Simula requisição inválida com content-type errado
    return new Request('http://localhost/api/entidade/importacao/analyze', {
      method: 'POST',
      body: 'invalid',
      headers: { 'content-type': overrideContentType },
    });
  }

  const fd = new FormData();
  if (file) fd.append('file', file);

  const req = new Request('http://localhost/api/entidade/importacao/analyze', {
    method: 'POST',
    body: fd,
  });

  // Em jsdom, Request.formData() não parseia o body corretamente —
  // sobrescreve o método para retornar o FormData já criado.
  Object.defineProperty(req, 'formData', {
    value: () => Promise.resolve(fd),
    writable: true,
  });

  return req;
}

function makeXlsxFile(name = 'test.xlsx'): File {
  const file = new File(['PK fake xlsx content'], name, {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  // Em jsdom, File.prototype.arrayBuffer não existe. Adiciona na instância
  // (parseSpreadsheetHeaders é mockado, então o conteúdo do buffer não importa).
  Object.defineProperty(file, 'arrayBuffer', {
    value: () => Promise.resolve(new ArrayBuffer(8)),
    writable: true,
    configurable: true,
  });
  return file;
}

describe('POST /api/entidade/importacao/analyze', () => {
  let POST: (req: Request) => Promise<Response>;

  beforeAll(async () => {
    const mod = await import('@/app/api/entidade/importacao/analyze/route');
    POST = mod.POST;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Default: autenticado como gestor de entidade
    requireEntity.mockResolvedValue({
      entidade_id: 42,
      cpf: '52998224725',
      perfil: 'gestor',
    });

    // Default: parser retorna sucesso
    parseSpreadsheetHeaders.mockReturnValue({
      success: true,
      totalLinhas: 10,
      colunas: [
        { indice: 0, nomeOriginal: 'CPF', exemploDados: ['123'] },
        { indice: 1, nomeOriginal: 'NOME', exemploDados: ['João'] },
      ],
    });

    sugerirMapeamento.mockReturnValue([
      {
        indice: 0,
        nomeOriginal: 'CPF',
        sugestaoQWork: 'cpf',
        confianca: 1.0,
        exemploDados: ['123'],
      },
      {
        indice: 1,
        nomeOriginal: 'NOME',
        sugestaoQWork: 'nome',
        confianca: 1.0,
        exemploDados: ['João'],
      },
    ]);

    getCamposQWorkEntidade.mockReturnValue([
      { campo: 'cpf', label: 'CPF', obrigatorio: true },
      { campo: 'nome', label: 'Nome', obrigatorio: true },
      { campo: 'funcao', label: 'Função', obrigatorio: false },
    ]);

    getCamposObrigatoriosEntidade.mockReturnValue(['cpf', 'nome']);
  });

  it('retorna 400 quando Content-Type não é multipart/form-data', async () => {
    const req = makeMultipartRequest(undefined, 'application/json');
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('multipart/form-data');
  });

  it('retorna 400 quando arquivo não é enviado', async () => {
    const req = makeMultipartRequest(); // sem arquivo

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Arquivo não enviado');
  });

  it('retorna 400 para extensão inválida (.txt)', async () => {
    const file = new File(['content'], 'dados.txt', { type: 'text/plain' });
    const req = makeMultipartRequest(file);

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/xlsx|xls|csv/i);
  });

  it('retorna 400 quando arquivo excede 10 MB', async () => {
    // Criar arquivo simulado maior que 10 MB
    const bigContent = 'x'.repeat(11 * 1024 * 1024);
    const file = new File([bigContent], 'grande.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const req = makeMultipartRequest(file);

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/10 MB/i);
  });

  it('retorna 401/403 quando não autenticado', async () => {
    requireEntity.mockRejectedValue(new Error('Não autenticado'));

    const req = makeMultipartRequest(makeXlsxFile());
    const res = await POST(req);

    expect([401, 403]).toContain(res.status);
  });

  it('retorna 400 quando parser falha', async () => {
    parseSpreadsheetHeaders.mockReturnValue({
      success: false,
      error: 'Formato inválido',
    });

    const req = makeMultipartRequest(makeXlsxFile());
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Formato inválido');
  });

  it('retorna 200 com campos sem cnpj_empresa e nome_empresa', async () => {
    const req = makeMultipartRequest(makeXlsxFile());
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data.totalLinhas).toBe(10);
    expect(body.data.colunasDetectadas).toHaveLength(2);
    expect(body.data.camposQWork).toBeDefined();

    // Garantir que cnpj_empresa e nome_empresa não estão nos campos
    const campos = body.data.camposQWork.map((c: { campo: string }) => c.campo);
    expect(campos).not.toContain('cnpj_empresa');
    expect(campos).not.toContain('nome_empresa');
  });

  it('retorna camposObrigatoriosFaltando quando campo obrigatório não tem sugestão', async () => {
    // Apenas nome tem sugestão, cpf falta
    sugerirMapeamento.mockReturnValue([
      {
        indice: 1,
        nomeOriginal: 'NOME',
        sugestaoQWork: 'nome',
        confianca: 1.0,
        exemploDados: ['João'],
      },
    ]);

    const req = makeMultipartRequest(makeXlsxFile());
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.camposObrigatoriosFaltando).toContain('cpf');
    expect(body.data.camposObrigatoriosFaltando).not.toContain('nome');
  });
});
