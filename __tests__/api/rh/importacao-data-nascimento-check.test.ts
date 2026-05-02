/**
 * Testes de regressão: validação de data_nascimento na importação em massa (RH)
 *
 * Cobre dois cenários:
 * 1. Funcionário existente no banco com data_nascimento diferente da planilha → erro bloqueante
 * 2. Funcionário existente no banco SEM data_nascimento (null) + planilha com data → NÃO bloqueia
 * 3. Funcionário novo (CPF ausente no banco) sem data_nascimento → erro já coberto pelo data-validator
 * 4. Datas iguais banco ↔ planilha → nenhum erro de data_nascimento
 */
import { POST as validatePost } from '@/app/api/rh/importacao/validate/route';
import { query as mockQueryFn } from '@/lib/db';

const CPF_EXISTENTE = '12345678901';
const CPF_NOVO = '99999999901';
const DATA_BANCO = '1990-05-23';       // ISO armazenada no banco
const DATA_PLANILHA_IGUAL = '23/05/1990';  // mesma data, formato BR
const DATA_PLANILHA_DIFERENTE = '01/01/2001'; // data errada

// ── Mocks ──────────────────────────────────────────────────────────────────

jest.mock('@/lib/session', () => ({
  requireClinica: jest.fn(async () => ({
    clinica_id: 1,
    cpf: '11111111111', // CPF do RH (diferente dos funcionários)
    usuario_id: 'user-rh',
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

jest.mock('@/lib/validators', () => ({
  normalizeCNPJ: jest.fn((v: string) => v?.replace(/\D/g, '') ?? ''),
}));

jest.mock('@/lib/xlsxParser', () => ({
  parseDateCell: jest.fn((v: string) => {
    // Converte dd/mm/aaaa → YYYY-MM-DD (simplificado para testes)
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
  { indice: 3, nomeOriginal: 'Empresa', campoQWork: 'nome_empresa' },
  { indice: 4, nomeOriginal: 'CNPJ', campoQWork: 'cnpj_empresa' },
]);

/** Configura o mock do banco para simular um funcionário existente com ou sem data_nascimento */
function setupDbMock(dataNascimento: string | null = DATA_BANCO) {
  const queryMock = mockQueryFn as jest.Mock;
  queryMock.mockImplementation(async (sql: string) => {
    // SELECT de funcionários existentes
    if (sql.includes('FROM funcionarios WHERE cpf = ANY')) {
      return {
        rows: [
          {
            id: 42,
            cpf: CPF_EXISTENTE,
            nome: 'Fulano Existente',
            funcao: 'Médico',
            data_nascimento: dataNascimento,
          },
        ],
      };
    }
    // SELECT de vínculos
    if (sql.includes('funcionarios_clinicas')) {
      return { rows: [] };
    }
    return { rows: [] };
  });
}

// ── Testes ──────────────────────────────────────────────────────────────────

describe('Importação RH — Validação de data_nascimento', () => {
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
            nome: 'Fulano Existente',
            data_nascimento: DATA_PLANILHA_DIFERENTE,
            nome_empresa: 'Clínica A',
            cnpj_empresa: '12345678000191',
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
      expect(erroDob.mensagem).toContain('23/05/1990'); // data do banco formatada
      expect(erroDob.mensagem).toContain('01/01/2001'); // data da planilha formatada
      expect(erroDob.linha).toBe(2);
    });

    it('deve gerar erro por linha (múltiplos funcionários com divergência)', async () => {
      const CPF2 = '98765432100';
      const queryMock = mockQueryFn as jest.Mock;
      queryMock.mockImplementation(async (sql: string) => {
        if (sql.includes('FROM funcionarios WHERE cpf = ANY')) {
          return {
            rows: [
              {
                id: 1,
                cpf: CPF_EXISTENTE,
                nome: 'Fulano',
                funcao: 'Médico',
                data_nascimento: '1990-05-23',
              },
              {
                id: 2,
                cpf: CPF2,
                nome: 'Ciclana',
                funcao: 'Enfermeira',
                data_nascimento: '1985-10-15',
              },
            ],
          };
        }
        if (sql.includes('funcionarios_clinicas')) return { rows: [] };
        return { rows: [] };
      });

      parseSpreadsheetAllRows.mockReturnValue({
        success: true,
        data: [
          {
            cpf: CPF_EXISTENTE,
            data_nascimento: '01/01/2001', // diverge
            nome_empresa: 'Clínica A',
            cnpj_empresa: '12345678000191',
          },
          {
            cpf: CPF2,
            data_nascimento: '01/01/2001', // diverge
            nome_empresa: 'Clínica A',
            cnpj_empresa: '12345678000191',
          },
        ],
      });

      const response = await validatePost(
        makeMockRequest({ mapeamento: MAPEAMENTO })
      );
      const json = await response.json();

      const errosDob = json.data.erros.filter(
        (e: { campo: string }) => e.campo === 'data_nascimento'
      );
      expect(errosDob).toHaveLength(2);
      expect(errosDob[0].linha).toBe(2);
      expect(errosDob[1].linha).toBe(3);
    });

    it('NÃO deve gerar erro quando data_nascimento da planilha é igual ao banco', async () => {
      setupDbMock(DATA_BANCO);
      parseSpreadsheetAllRows.mockReturnValue({
        success: true,
        data: [
          {
            cpf: CPF_EXISTENTE,
            data_nascimento: DATA_PLANILHA_IGUAL, // 23/05/1990 == 1990-05-23
            nome_empresa: 'Clínica A',
            cnpj_empresa: '12345678000191',
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
      setupDbMock(null); // banco sem data_nascimento
      parseSpreadsheetAllRows.mockReturnValue({
        success: true,
        data: [
          {
            cpf: CPF_EXISTENTE,
            data_nascimento: DATA_PLANILHA_DIFERENTE,
            nome_empresa: 'Clínica A',
            cnpj_empresa: '12345678000191',
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
  });

  describe('Funcionário novo — data_nascimento ausente', () => {
    it('deve retornar erro (via data-validator) quando data_nascimento está ausente para novo funcionário', async () => {
      // CPF novo (não existe no banco)
      const queryMock = mockQueryFn as jest.Mock;
      queryMock.mockResolvedValue({ rows: [] });

      // data-validator mock retorna erro de data_nascimento ausente
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
      expect(json.data.valido).toBe(false);
    });
  });

  describe('Sem funcionários existentes no banco', () => {
    it('NÃO deve gerar erros de data_nascimento quando CPF não existe no banco', async () => {
      const queryMock = mockQueryFn as jest.Mock;
      queryMock.mockResolvedValue({ rows: [] }); // banco vazio

      parseSpreadsheetAllRows.mockReturnValue({
        success: true,
        data: [
          {
            cpf: CPF_NOVO,
            data_nascimento: DATA_PLANILHA_DIFERENTE,
            nome_empresa: 'Clínica A',
            cnpj_empresa: '12345678000191',
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
  });
});
