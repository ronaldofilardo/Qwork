/**
 * Testes de regressão: validação de data_nascimento na importação em massa (Entidade)
 *
 * Cobre dois cenários:
 * 1. Funcionário existente no banco com data_nascimento diferente da planilha → erro bloqueante
 * 2. Funcionário existente no banco SEM data_nascimento (null) + planilha com data → NÃO bloqueia
 * 3. Funcionário novo (CPF ausente no banco) sem data_nascimento → erro já coberto pelo data-validator
 * 4. Datas iguais banco ↔ planilha → nenhum erro de data_nascimento
 */
import { POST as validatePost } from '@/app/api/entidade/importacao/validate/route';
import { query as mockQueryFn } from '@/lib/db';

const CPF_EXISTENTE = '11111111111';
const CPF_NOVO = '99999999901';
const DATA_BANCO = '1988-03-12';
const DATA_PLANILHA_IGUAL = '12/03/1988';  // mesma data, formato BR
const DATA_PLANILHA_DIFERENTE = '01/01/2001';

// ── Mocks ──────────────────────────────────────────────────────────────────

jest.mock('@/lib/session', () => ({
  requireEntity: jest.fn(async () => ({
    entidade_id: 10,
    cpf: '22222222222', // CPF do gestor (diferente dos funcionários)
    usuario_id: 'user-gestor',
  })),
}));

jest.mock('@/lib/importacao/dynamic-parser', () => ({
  parseSpreadsheetAllRows: jest.fn(),
}));

jest.mock('@/lib/importacao/data-validator', () => ({
  validarDadosImportacao: jest.fn((rows) => ({
    valido: true,
    resumo: {
      totalLinhas: rows.length,
      linhasValidas: rows.length,
      linhasComErros: 0,
      cpfsUnicos: rows.length,
      cpfsDuplicadosNoArquivo: 0,
      linhasComDemissao: 0,
    },
    erros: [],
    avisos: [],
  })),
}));

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('@/lib/xlsxParser', () => ({
  parseDateCell: jest.fn((v: string) => {
    if (!v) return null;
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v);
    if (match) return `${match[3]}-${match[2]}-${match[1]}`;
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    return null;
  }),
}));

// ── Helper ─────────────────────────────────────────────────────────────────

function makeMockRequest(
  fields: Record<string, string>,
  fileContent = 'xlsx'
): Request {
  const file = new File([fileContent], 'test.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  if (typeof (file as { arrayBuffer?: unknown }).arrayBuffer !== 'function') {
    (file as Record<string, unknown>).arrayBuffer = async () =>
      Buffer.from(fileContent).buffer;
  }
  const fd = new FormData();
  fd.append('file', file);
  for (const [key, val] of Object.entries(fields)) {
    fd.append(key, val);
  }
  return {
    headers: {
      get: (name: string) =>
        name.toLowerCase() === 'content-type'
          ? 'multipart/form-data; boundary=testboundary'
          : null,
    },
    formData: jest.fn().mockResolvedValue(fd),
  } as unknown as Request;
}

const MAPEAMENTO = JSON.stringify([
  { indice: 0, nomeOriginal: 'CPF', campoQWork: 'cpf' },
  { indice: 1, nomeOriginal: 'Nome', campoQWork: 'nome' },
  { indice: 2, nomeOriginal: 'Nascimento', campoQWork: 'data_nascimento' },
]);

function setupDbMock(dataNascimento: string | null = DATA_BANCO) {
  const queryMock = mockQueryFn as jest.Mock;
  queryMock.mockImplementation(async (sql: string) => {
    if (sql.includes('FROM funcionarios WHERE cpf = ANY')) {
      return {
        rows: [
          {
            id: 7,
            cpf: CPF_EXISTENTE,
            nome: 'Beltrana Existente',
            funcao: 'Analista',
            data_nascimento: dataNascimento,
          },
        ],
      };
    }
    if (sql.includes('funcionarios_entidades')) return { rows: [] };
    return { rows: [] };
  });
}

// ── Testes ──────────────────────────────────────────────────────────────────

describe('Importação Entidade — Validação de data_nascimento', () => {
  const { parseSpreadsheetAllRows } = jest.requireMock(
    '@/lib/importacao/dynamic-parser'
  ) as { parseSpreadsheetAllRows: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Funcionário existente — divergência de data_nascimento', () => {
    it('deve gerar erro quando data_nascimento da planilha difere do banco', async () => {
      setupDbMock(DATA_BANCO);
      parseSpreadsheetAllRows.mockReturnValue({
        success: true,
        data: [
          {
            cpf: CPF_EXISTENTE,
            nome: 'Beltrana Existente',
            data_nascimento: DATA_PLANILHA_DIFERENTE,
          },
        ],
      });

      const response = await validatePost(
        makeMockRequest({ mapeamento: MAPEAMENTO })
      );
      const json = await response.json();

      expect(json.success).toBe(true);
      const erroDob = json.data.erros.find(
        (e: { campo: string }) => e.campo === 'data_nascimento'
      );
      expect(erroDob).toBeDefined();
      expect(erroDob.severidade).toBe('erro');
      expect(erroDob.mensagem).toContain(CPF_EXISTENTE);
      expect(erroDob.mensagem).toContain('12/03/1988'); // banco formatado
      expect(erroDob.mensagem).toContain('01/01/2001'); // planilha formatada
      expect(erroDob.linha).toBe(2);
    });

    it('NÃO deve gerar erro quando data_nascimento da planilha é igual ao banco', async () => {
      setupDbMock(DATA_BANCO);
      parseSpreadsheetAllRows.mockReturnValue({
        success: true,
        data: [
          {
            cpf: CPF_EXISTENTE,
            data_nascimento: DATA_PLANILHA_IGUAL, // 12/03/1988 == 1988-03-12
          },
        ],
      });

      const response = await validatePost(
        makeMockRequest({ mapeamento: MAPEAMENTO })
      );
      const json = await response.json();

      const erroDob = json.data.erros.find(
        (e: { campo: string }) => e.campo === 'data_nascimento'
      );
      expect(erroDob).toBeUndefined();
    });

    it('NÃO deve gerar erro quando banco tem data_nascimento null (atualização legítima)', async () => {
      setupDbMock(null);
      parseSpreadsheetAllRows.mockReturnValue({
        success: true,
        data: [
          {
            cpf: CPF_EXISTENTE,
            data_nascimento: DATA_PLANILHA_DIFERENTE,
          },
        ],
      });

      const response = await validatePost(
        makeMockRequest({ mapeamento: MAPEAMENTO })
      );
      const json = await response.json();

      const erroDob = json.data.erros.find(
        (e: { campo: string }) => e.campo === 'data_nascimento'
      );
      expect(erroDob).toBeUndefined();
    });

    it('deve usar mensagem específica para Entidade (sem referência a empresa/CNPJ)', async () => {
      setupDbMock(DATA_BANCO);
      parseSpreadsheetAllRows.mockReturnValue({
        success: true,
        data: [
          {
            cpf: CPF_EXISTENTE,
            data_nascimento: DATA_PLANILHA_DIFERENTE,
          },
        ],
      });

      const response = await validatePost(
        makeMockRequest({ mapeamento: MAPEAMENTO })
      );
      const json = await response.json();

      const erroDob = json.data.erros.find(
        (e: { campo: string }) => e.campo === 'data_nascimento'
      );
      expect(erroDob).toBeDefined();
      // Mensagem deve mencionar CPF e diferença de datas
      expect(erroDob.mensagem).toContain('Banco:');
      expect(erroDob.mensagem).toContain('Planilha:');
    });
  });

  describe('Funcionário novo — data_nascimento ausente', () => {
    it('deve retornar erro (via data-validator) quando data_nascimento está ausente para novo funcionário', async () => {
      const queryMock = mockQueryFn as jest.Mock;
      queryMock.mockResolvedValue({ rows: [] });

      const { validarDadosImportacao } = jest.requireMock(
        '@/lib/importacao/data-validator'
      ) as { validarDadosImportacao: jest.Mock };
      validarDadosImportacao.mockReturnValueOnce({
        valido: false,
        resumo: {
          totalLinhas: 1,
          linhasValidas: 0,
          linhasComErros: 1,
          cpfsUnicos: 1,
          cpfsDuplicadosNoArquivo: 0,
          linhasComDemissao: 0,
        },
        erros: [
          {
            linha: 2,
            campo: 'data_nascimento',
            valor: '',
            mensagem: 'Data de nascimento é obrigatória',
            severidade: 'erro',
          },
        ],
        avisos: [],
      });

      parseSpreadsheetAllRows.mockReturnValue({
        success: true,
        data: [{ cpf: CPF_NOVO, nome: 'Novo Func', data_nascimento: '' }],
      });

      const response = await validatePost(
        makeMockRequest({ mapeamento: MAPEAMENTO })
      );
      const json = await response.json();

      const erroDob = json.data.erros.find(
        (e: { campo: string }) => e.campo === 'data_nascimento'
      );
      expect(erroDob).toBeDefined();
      expect(erroDob.severidade).toBe('erro');
    });
  });

  describe('Sem funcionários existentes no banco', () => {
    it('NÃO deve gerar erros de data_nascimento para funcionários novos com data válida', async () => {
      const queryMock = mockQueryFn as jest.Mock;
      queryMock.mockResolvedValue({ rows: [] });

      parseSpreadsheetAllRows.mockReturnValue({
        success: true,
        data: [{ cpf: CPF_NOVO, data_nascimento: DATA_PLANILHA_DIFERENTE }],
      });

      const response = await validatePost(
        makeMockRequest({ mapeamento: MAPEAMENTO })
      );
      const json = await response.json();

      const erroDob = json.data.erros.find(
        (e: { campo: string }) => e.campo === 'data_nascimento'
      );
      expect(erroDob).toBeUndefined();
    });
  });

  describe('Conversão de Date do PostgreSQL para ISO string (fix staging)', () => {
    it('deve converter data_nascimento quando vem como Date do driver PostgreSQL', async () => {
      const queryMock = mockQueryFn as jest.Mock;
      // Simular data_nascimento como Date object (como vem do driver pg em staging/prod)
      queryMock.mockImplementation(async (sql: string) => {
        if (sql.includes('FROM funcionarios WHERE cpf = ANY')) {
          return {
            rows: [
              {
                id: 7,
                cpf: CPF_EXISTENTE,
                nome: 'Beltrana Existente',
                funcao: 'Analista',
                // Simular Date object como retornado pelo driver PostgreSQL
                data_nascimento: new Date('1988-03-12T00:00:00Z'),
              },
            ],
          };
        }
        if (sql.includes('funcionarios_entidades')) return { rows: [] };
        return { rows: [] };
      });

      parseSpreadsheetAllRows.mockReturnValue({
        success: true,
        data: [
          {
            cpf: CPF_EXISTENTE,
            nome: 'Beltrana Existente',
            data_nascimento: DATA_PLANILHA_IGUAL, // 12/03/1988 == 1988-03-12
          },
        ],
      });

      const response = await validatePost(
        makeMockRequest({ mapeamento: MAPEAMENTO })
      );
      const json = await response.json();

      // Não deve gerar erro porque datas são iguais (1988-03-12)
      const erroDob = json.data.erros.find(
        (e: { campo: string }) => e.campo === 'data_nascimento'
      );
      expect(erroDob).toBeUndefined();
    });

    it('deve detectar divergência quando data_nascimento é Date e diferente da planilha', async () => {
      const queryMock = mockQueryFn as jest.Mock;
      queryMock.mockImplementation(async (sql: string) => {
        if (sql.includes('FROM funcionarios WHERE cpf = ANY')) {
          return {
            rows: [
              {
                id: 7,
                cpf: CPF_EXISTENTE,
                nome: 'Beltrana Existente',
                funcao: 'Analista',
                // Data como Date object
                data_nascimento: new Date('1988-03-12T00:00:00Z'),
              },
            ],
          };
        }
        if (sql.includes('funcionarios_entidades')) return { rows: [] };
        return { rows: [] };
      });

      parseSpreadsheetAllRows.mockReturnValue({
        success: true,
        data: [
          {
            cpf: CPF_EXISTENTE,
            data_nascimento: DATA_PLANILHA_DIFERENTE, // 01/01/2001
          },
        ],
      });

      const response = await validatePost(
        makeMockRequest({ mapeamento: MAPEAMENTO })
      );
      const json = await response.json();

      const erroDob = json.data.erros.find(
        (e: { campo: string }) => e.campo === 'data_nascimento'
      );
      expect(erroDob).toBeDefined();
      expect(erroDob.mensagem).toContain('12/03/1988'); // banco convertido e formatado
      expect(erroDob.mensagem).toContain('01/01/2001'); // planilha
    });
  });
});
