/**
 * @file __tests__/api/entidade/importacao/validate.test.ts
 * Testes: POST /api/entidade/importacao/validate
 *
 * Cobre:
 *  - Autenticação obrigatória
 *  - Validação de arquivo e mapeamento ausentes
 *  - Mapeamento JSON inválido
 *  - Validação CNPJ ignorada (ignorarCnpj: true)
 *  - Consulta de CPFs existentes no banco
 *  - Retorno correto de resumo e erros
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

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('@/lib/cpf-utils', () => ({
  limparCPF: jest.fn((cpf: string) => cpf.replace(/\D/g, '')),
}));

jest.mock('@/lib/xlsxParser', () => ({
  parseDateCell: jest.fn((v: string) => v),
}));

const { requireEntity } = require('@/lib/session');
const { parseSpreadsheetAllRows } = require('@/lib/importacao/dynamic-parser');
const { validarDadosImportacao } = require('@/lib/importacao/data-validator');
const { query } = require('@/lib/db');

/**
 * Cria um objeto mock que satisfaz o contrato da API route:
 *  - request.headers.get('content-type') → multipart/form-data (padrão)
 *  - request.formData() → FormData controlada
 *
 * Abordagem necessária porque em jest+jsdom, new Request(url, { body: fd })
 * (com jsdom FormData + node-fetch v2 Request) NÃO propaga Content-Type.
 */
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

/** Cria request com Content-Type explícito diferente de multipart (para testar rejeição). */
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

describe('POST /api/entidade/importacao/validate', () => {
  let POST: (req: Request) => Promise<Response>;

  beforeAll(async () => {
    const mod = await import('@/app/api/entidade/importacao/validate/route');
    POST = mod.POST;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    requireEntity.mockResolvedValue({
      entidade_id: 42,
      cpf: '52998224725',
      perfil: 'gestor',
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
    requireEntity.mockRejectedValue(new Error('Não autenticado'));

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

  it('valida dados com ignorarCnpj=true (campo CNPJ não é bloqueante)', async () => {
    const res = await POST(makeRequest(makeXlsxFile(), MOCK_MAPEAMENTO));

    expect(res.status).toBe(200);

    // Verificar que validarDadosImportacao foi chamado com ignorarCnpj: true
    expect(validarDadosImportacao).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({ ignorarCnpj: true })
    );
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

  it('identifica funcionários existentes por CPF no banco da entidade', async () => {
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

    // Segunda query (vínculos entidade) — vínculo ativo
    query.mockResolvedValueOnce({
      rows: [
        {
          funcionario_id: 1,
          ativo: true,
          data_desvinculo: null,
          cpf: '52998224725',
        },
      ],
    });

    const res = await POST(makeRequest(makeXlsxFile(), MOCK_MAPEAMENTO));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.resumo.funcionariosExistentes).toBe(1);
    expect(body.data.resumo.funcionariosNovos).toBe(1);
  });

  it('retorna funcoesNivelInfo para classificação de nível de cargo', async () => {
    const res = await POST(makeRequest(makeXlsxFile(), MOCK_MAPEAMENTO));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(body.data.funcoesNivelInfo)).toBe(true);
    expect(Array.isArray(body.data.funcoesUnicas)).toBe(true);
  });

  // ------------------------------------------------------------------
  // temNivelCargoDirecto + qtdSemNivelNaPlanilha (bug fix 15/04/2026)
  // ------------------------------------------------------------------

  const MOCK_MAPEAMENTO_COM_NIVEL = [
    { indice: 0, nomeOriginal: 'CPF', campoQWork: 'cpf' },
    { indice: 1, nomeOriginal: 'NOME', campoQWork: 'nome' },
    { indice: 2, nomeOriginal: 'nivel_cargo', campoQWork: 'nivel_cargo' },
  ];

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
    // Estagiário (cpf 33344455566) e Desenvolvedor (44455566677) não têm nivel_cargo
    // Analista (52998224725) e Assistente (11122233344) têm nivel_cargo válido
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

    // Analista tem nivel válido na planilha → qtdSemNivelNaPlanilha=0
    expect(analista?.qtdSemNivelNaPlanilha).toBe(0);
    // Estagiário e Desenvolvedor não têm → qtdSemNivelNaPlanilha=1 cada
    expect(estagiario?.qtdSemNivelNaPlanilha).toBe(1);
    expect(desenvolvedor?.qtdSemNivelNaPlanilha).toBe(1);
  });

  it('qtdSemNivelNaPlanilha=0 para todos quando temNivelCargoDirecto=false', async () => {
    // sem mapeamento de nivel_cargo → temNivelCargoDirecto=false
    // mesmo que as linhas não tenham nivel_cargo, não deve rastrear
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
    // Analista (sem nível) deve vir antes de Zelador (com nível)
    const idxAnalista = info.findIndex((f) => f.funcao === 'Analista');
    const idxZelador = info.findIndex((f) => f.funcao === 'Zelador');
    expect(idxAnalista).toBeLessThan(idxZelador);
  });
});
