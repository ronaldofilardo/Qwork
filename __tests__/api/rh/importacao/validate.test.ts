/**
 * @file __tests__/api/rh/importacao/validate.test.ts
 * Testes: POST /api/rh/importacao/validate
 *
 * Cobre:
 *  - Autenticação obrigatória (requireClinica)
 *  - Validação de arquivo e mapeamento ausentes
 *  - Mapeamento JSON inválido
 *  - Consulta de CPFs existentes no banco
 *  - Retorno correto de resumo e erros
 *  - temNivelCargoDirecto + qtdSemNivelNaPlanilha (bug fix 15/04/2026)
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

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('@/lib/cpf-utils', () => ({
  limparCPF: jest.fn((cpf: string) => cpf.replace(/\D/g, '')),
}));

jest.mock('@/lib/validators', () => ({
  normalizeCNPJ: jest.fn((v: string) => v),
}));

jest.mock('@/lib/xlsxParser', () => ({
  parseDateCell: jest.fn((v: string) => v),
}));

const { requireClinica } = require('@/lib/session');
const { parseSpreadsheetAllRows } = require('@/lib/importacao/dynamic-parser');
const { validarDadosImportacao } = require('@/lib/importacao/data-validator');
const { query } = require('@/lib/db');

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

function makeXlsxFile(): File {
  const buf = Buffer.from('PK fake content');
  const file = new File([buf], 'dados.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  // Polyfill arrayBuffer: jsdom pode não implementar File/Blob.arrayBuffer()
  Object.defineProperty(file, 'arrayBuffer', {
    configurable: true,
    value: () =>
      Promise.resolve(
        buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
      ),
  });
  return file;
}

const MOCK_MAPEAMENTO = [
  { indice: 0, nomeOriginal: 'CPF', campoQWork: 'cpf' },
  { indice: 1, nomeOriginal: 'NOME', campoQWork: 'nome' },
];

const MOCK_MAPEAMENTO_COM_NIVEL = [
  { indice: 0, nomeOriginal: 'CPF', campoQWork: 'cpf' },
  { indice: 1, nomeOriginal: 'NOME', campoQWork: 'nome' },
  { indice: 2, nomeOriginal: 'nivel_cargo', campoQWork: 'nivel_cargo' },
];

describe('POST /api/rh/importacao/validate', () => {
  let POST: (req: Request) => Promise<Response>;

  beforeAll(async () => {
    const mod = await import('@/app/api/rh/importacao/validate/route');
    POST = mod.POST;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    requireClinica.mockResolvedValue({
      clinica_id: 10,
      cpf: '52998224725',
      perfil: 'rh',
    });

    parseSpreadsheetAllRows.mockReturnValue({
      success: true,
      data: [
        { cpf: '52998224725', nome: 'João Silva', funcao: 'Analista' },
        { cpf: '11122233344', nome: 'Maria Santos', funcao: 'Analista' },
      ],
    });

    validarDadosImportacao.mockReturnValue({
      valido: true,
      resumo: {
        totalLinhas: 2,
        linhasValidas: 2,
        linhasComErros: 0,
        cpfsUnicos: 2,
        linhasComAvisos: 0,
      },
      erros: [],
      avisos: [],
    });

    // Default: nenhum funcionário existe no banco
    query.mockResolvedValue({ rows: [] });
  });

  it('retorna 400 quando Content-Type não é multipart/form-data', async () => {
    const res = await POST(makeNonMultipartRequest());
    expect(res.status).toBe(400);
  });

  it('retorna 400 quando arquivo não enviado', async () => {
    const res = await POST(makeRequest(undefined, MOCK_MAPEAMENTO));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toContain('Arquivo não enviado');
  });

  it('retorna 400 quando mapeamento não enviado', async () => {
    const res = await POST(makeRequest(makeXlsxFile()));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toContain('Mapeamento de colunas não enviado');
  });

  it('retorna 400 quando mapeamento é JSON inválido', async () => {
    const res = await POST(
      makeRequest(makeXlsxFile(), undefined, '{invalid json}')
    );
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toContain('nválido');
  });

  it('retorna 401/403 quando não autenticado', async () => {
    requireClinica.mockRejectedValue(new Error('Não autenticado'));
    const res = await POST(makeRequest(makeXlsxFile(), MOCK_MAPEAMENTO));
    expect([401, 403]).toContain(res.status);
  });

  it('retorna 400 quando parser falha', async () => {
    parseSpreadsheetAllRows.mockReturnValue({
      success: false,
      error: 'Arquivo corrompido',
    });
    const res = await POST(makeRequest(makeXlsxFile(), MOCK_MAPEAMENTO));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toContain('Arquivo corrompido');
  });

  it('retorna 200 com resumo correto para dados válidos sem funcionários existentes', async () => {
    const res = await POST(makeRequest(makeXlsxFile(), MOCK_MAPEAMENTO));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.valido).toBe(true);
    expect(body.data.resumo.totalLinhas).toBe(2);
    expect(body.data.resumo.funcionariosNovos).toBe(2);
    expect(body.data.resumo.funcionariosExistentes).toBe(0);
    expect(body.data.erros).toHaveLength(0);
  });

  it('retorna funcoesNivelInfo e funcoesUnicas na resposta', async () => {
    const res = await POST(makeRequest(makeXlsxFile(), MOCK_MAPEAMENTO));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(body.data.funcoesNivelInfo)).toBe(true);
    expect(Array.isArray(body.data.funcoesUnicas)).toBe(true);
  });

  it('identifica funcionários existentes por CPF no banco da clínica', async () => {
    // Simular que 1 CPF já existe no banco
    query.mockResolvedValueOnce({
      rows: [
        {
          cpf: '52998224725',
          nome: 'João Silva',
          funcao: 'Analista',
          nivel_cargo: 'operacional',
        },
      ],
    });

    // Segunda query (vínculos clínica)
    query.mockResolvedValueOnce({
      rows: [
        {
          funcionario_id: 1,
          empresa_id: 5,
          ativo: true,
          data_desvinculo: null,
          cpf: '52998224725',
          empresa_nome: 'Empresa X',
        },
      ],
    });

    const res = await POST(makeRequest(makeXlsxFile(), MOCK_MAPEAMENTO));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.resumo.funcionariosExistentes).toBe(1);
    expect(body.data.resumo.funcionariosNovos).toBe(1);
  });

  // ------------------------------------------------------------------
  // temNivelCargoDirecto + qtdSemNivelNaPlanilha (bug fix 15/04/2026)
  // ------------------------------------------------------------------

  it('temNivelCargoDirecto=true quando mapeamento inclui coluna nivel_cargo', async () => {
    parseSpreadsheetAllRows.mockReturnValue({
      success: true,
      data: [
        {
          cpf: '52998224725',
          nome: 'João',
          funcao: 'Analista',
          nivel_cargo: 'gestao',
        },
        {
          cpf: '11122233344',
          nome: 'Maria',
          funcao: 'Analista',
          nivel_cargo: 'operacional',
        },
      ],
    });

    const res = await POST(
      makeRequest(makeXlsxFile(), MOCK_MAPEAMENTO_COM_NIVEL)
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.temNivelCargoDirecto).toBe(true);
  });

  it('temNivelCargoDirecto=false quando mapeamento NÃO inclui coluna nivel_cargo', async () => {
    const res = await POST(makeRequest(makeXlsxFile(), MOCK_MAPEAMENTO));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.temNivelCargoDirecto).toBe(false);
  });

  it('qtdSemNivelNaPlanilha=0 para funções onde todos têm nivel_cargo válido na planilha', async () => {
    parseSpreadsheetAllRows.mockReturnValue({
      success: true,
      data: [
        {
          cpf: '52998224725',
          nome: 'João',
          funcao: 'Analista',
          nivel_cargo: 'gestao',
        },
        {
          cpf: '11122233344',
          nome: 'Maria',
          funcao: 'Analista',
          nivel_cargo: 'operacional',
        },
      ],
    });

    const res = await POST(
      makeRequest(makeXlsxFile(), MOCK_MAPEAMENTO_COM_NIVEL)
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    const analista = body.data.funcoesNivelInfo.find(
      (f: { funcao: string }) => f.funcao === 'Analista'
    );
    expect(analista).toBeDefined();
    expect(analista.qtdSemNivelNaPlanilha).toBe(0);
  });

  it('qtdSemNivelNaPlanilha>0 para funções com novos funcionários sem nivel_cargo na planilha', async () => {
    parseSpreadsheetAllRows.mockReturnValue({
      success: true,
      data: [
        {
          cpf: '52998224725',
          nome: 'João',
          funcao: 'Analista',
          nivel_cargo: 'gestao',
        },
        {
          cpf: '11122233344',
          nome: 'Maria',
          funcao: 'Assistente',
          nivel_cargo: 'operacional',
        },
        {
          cpf: '33344455566',
          nome: 'Pedro',
          funcao: 'Estagiário',
          nivel_cargo: '',
        },
        {
          cpf: '44455566677',
          nome: 'Ana',
          funcao: 'Desenvolvedor',
          nivel_cargo: '',
        },
      ],
    });

    validarDadosImportacao.mockReturnValue({
      valido: true,
      resumo: {
        totalLinhas: 4,
        linhasValidas: 4,
        linhasComErros: 0,
        cpfsUnicos: 4,
        linhasComAvisos: 0,
      },
      erros: [],
      avisos: [],
    });

    const res = await POST(
      makeRequest(makeXlsxFile(), MOCK_MAPEAMENTO_COM_NIVEL)
    );
    const body = await res.json();

    expect(res.status).toBe(200);

    const analista = body.data.funcoesNivelInfo.find(
      (f: { funcao: string }) => f.funcao === 'Analista'
    );
    const estagiario = body.data.funcoesNivelInfo.find(
      (f: { funcao: string }) => f.funcao === 'Estagiário'
    );
    const desenvolvedor = body.data.funcoesNivelInfo.find(
      (f: { funcao: string }) => f.funcao === 'Desenvolvedor'
    );

    expect(analista?.qtdSemNivelNaPlanilha).toBe(0);
    expect(estagiario?.qtdSemNivelNaPlanilha).toBe(1);
    expect(desenvolvedor?.qtdSemNivelNaPlanilha).toBe(1);
  });

  it('qtdSemNivelNaPlanilha=0 para todos quando temNivelCargoDirecto=false', async () => {
    parseSpreadsheetAllRows.mockReturnValue({
      success: true,
      data: [
        { cpf: '52998224725', nome: 'João', funcao: 'Analista' },
        { cpf: '11122233344', nome: 'Maria', funcao: 'Analista' },
      ],
    });

    const res = await POST(makeRequest(makeXlsxFile(), MOCK_MAPEAMENTO));
    const body = await res.json();

    expect(res.status).toBe(200);
    for (const f of body.data.funcoesNivelInfo as Array<{
      funcao: string;
      qtdSemNivelNaPlanilha: number;
    }>) {
      expect(f.qtdSemNivelNaPlanilha).toBe(0);
    }
  });

  it('ordenação: funções com qtdSemNivelNaPlanilha>0 vêm antes das sem pendência', async () => {
    parseSpreadsheetAllRows.mockReturnValue({
      success: true,
      data: [
        {
          cpf: '52998224725',
          nome: 'João',
          funcao: 'Zelador',
          nivel_cargo: 'gestao',
        },
        {
          cpf: '11122233344',
          nome: 'Maria',
          funcao: 'Analista',
          nivel_cargo: '',
        },
      ],
    });

    validarDadosImportacao.mockReturnValue({
      valido: true,
      resumo: {
        totalLinhas: 2,
        linhasValidas: 2,
        linhasComErros: 0,
        cpfsUnicos: 2,
        linhasComAvisos: 0,
      },
      erros: [],
      avisos: [],
    });

    const res = await POST(
      makeRequest(makeXlsxFile(), MOCK_MAPEAMENTO_COM_NIVEL)
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    const info = body.data.funcoesNivelInfo as Array<{
      funcao: string;
      qtdSemNivelNaPlanilha: number;
    }>;
    const idxAnalista = info.findIndex((f) => f.funcao === 'Analista');
    const idxZelador = info.findIndex((f) => f.funcao === 'Zelador');
    expect(idxAnalista).toBeLessThan(idxZelador);
  });
});
