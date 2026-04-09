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

function makeRequest(file?: File, mapeamento?: object): Request {
  const fd = new FormData();
  if (file) fd.append('file', file);
  if (mapeamento !== undefined)
    fd.append('mapeamento', JSON.stringify(mapeamento));

  return new Request('http://localhost/api/entidade/importacao/validate', {
    method: 'POST',
    body: fd,
  });
}

function makeXlsxFile(): File {
  return new File(['PK fake content'], 'dados.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

const MOCK_MAPEAMENTO = [
  { indice: 0, nomeOriginal: 'CPF', campoQWork: 'cpf' },
  { indice: 1, nomeOriginal: 'NOME', campoQWork: 'nome' },
];

describe('POST /api/entidade/importacao/validate', () => {
  let POST: (req: Request) => Promise<Response>;

  beforeAll(async () => {
    const mod = await import(
      '@/app/api/entidade/importacao/validate/route'
    );
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
    const req = new Request(
      'http://localhost/api/entidade/importacao/validate',
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
    const req = new Request(
      'http://localhost/api/entidade/importacao/validate',
      { method: 'POST', body: fd }
    );
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Arquivo não enviado');
  });

  it('retorna 400 quando mapeamento não enviado', async () => {
    const fd = new FormData();
    fd.append('file', makeXlsxFile());
    const req = new Request(
      'http://localhost/api/entidade/importacao/validate',
      { method: 'POST', body: fd }
    );
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Mapeamento de colunas não enviado');
  });

  it('retorna 400 quando mapeamento é JSON inválido', async () => {
    const fd = new FormData();
    fd.append('file', makeXlsxFile());
    fd.append('mapeamento', '{invalid json}');
    const req = new Request(
      'http://localhost/api/entidade/importacao/validate',
      { method: 'POST', body: fd }
    );
    const res = await POST(req);
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
});
