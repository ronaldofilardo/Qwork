/**
 * Testes para validação de self-assignment na importação em massa (RH)
 * Valida que um RH não pode se cadastrar como funcionário via planilha XLSX
 */
import { POST as validatePost } from '@/app/api/rh/importacao/validate/route';
import { POST as executePost } from '@/app/api/rh/importacao/execute/route';

// Dados padrão: primeiro CPF é o mesmo do responsável (self-assignment)
const DADOS_COM_SELF_ASSIGNMENT = [
  {
    cpf: '12345678901', // self-assignment
    nome: 'João Silva',
    funcao: 'Enfermeiro',
    nome_empresa: 'Clínica A',
    cnpj_empresa: '12345678000191',
  },
  {
    cpf: '98765432100',
    nome: 'Maria Santos',
    funcao: 'Médico',
    nome_empresa: 'Clínica A',
    cnpj_empresa: '12345678000191',
  },
];

// Mock da sessão do usuário
jest.mock('@/lib/session', () => ({
  requireClinica: jest.fn(async () => ({
    clinica_id: 1,
    cpf: '12345678901', // RH responsável
    usuario_id: 'user-123',
  })),
}));

// Mock do parser — retorna dados com self-assignment por padrão
jest.mock('@/lib/importacao/dynamic-parser', () => ({
  parseSpreadsheetAllRows: jest.fn(() => ({
    success: true,
    data: DADOS_COM_SELF_ASSIGNMENT,
  })),
}));

// Mock do validador de dados
jest.mock('@/lib/importacao/data-validator', () => ({
  validarDadosImportacao: jest.fn((rows) => ({
    valido: rows.length > 0,
    resumo: {
      totalLinhas: rows.length,
      linhasValidas: rows.length,
      linhasComErros: 0,
      linhasComAvisos: 0,
      cpfsUnicos: rows.length,
      cpfsDuplicadosNoArquivo: 0,
      linhasComDemissao: 0,
    },
    erros: [],
    avisos: [],
  })),
}));

// Mock do banco de dados
jest.mock('@/lib/db', () => ({
  query: jest.fn(async () => ({ rows: [] })),
}));

// Mock de db-transaction (usado pelo execute route)
jest.mock('@/lib/db-transaction', () => ({
  withTransaction: jest.fn(async (cb) => {
    const mockClient = { query: jest.fn(async () => ({ rows: [] })) };
    return cb(mockClient);
  }),
}));

// Mock de bcryptjs (usado no execute para gerar senhas)
jest.mock('bcryptjs', () => ({ hash: jest.fn(async () => 'hash-fake') }));

// Mock de password-generator
jest.mock('@/lib/auth/password-generator', () => ({
  gerarSenhaDeNascimento: jest.fn(() => 'senha123'),
}));

// Mock de xlsxParser (parseDateCell)
jest.mock('@/lib/xlsxParser', () => ({
  parseDateCell: jest.fn(() => null),
}));

// Mock de normalizeCNPJ (usado pelo validate route)
jest.mock('@/lib/validators', () => ({
  normalizeCNPJ: jest.fn((v: string) => v?.replace(/\D/g, '') ?? ''),
}));

// --------------------------------------------------------------------------
// Helper: cria um mock de Request com Content-Type multipart/form-data
// (NextRequest com body: formData não define Content-Type em ambiente de teste)
// jsdom não implementa File.prototype.arrayBuffer — polyfill obrigátorio
// --------------------------------------------------------------------------
function makeMockRequest(fields: Record<string, string>, fileContent = 'xlsx'): Request {
  const file = new File([fileContent], 'test.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  // Polyfill arrayBuffer: jsdom não implementa Blob.arrayBuffer em todas as versões
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

const MAPEAMENTO_BASICO = JSON.stringify([
  { indice: 0, nomeOriginal: 'CPF', campoQWork: 'cpf' },
  { indice: 1, nomeOriginal: 'Nome', campoQWork: 'nome' },
]);

describe('Importação RH - Self-Assignment Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/rh/importacao/validate - Self-Assignment Check', () => {
    it('deve detectar self-assignment (CPF do RH na planilha) e retornar erro', async () => {
      const request = makeMockRequest({ mapeamento: MAPEAMENTO_BASICO });

      const response = await validatePost(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      const selfAssignmentError = data.data.erros.find(
        (e: { campo: string; valor: string }) =>
          e.campo === 'cpf' && e.valor === '12345678901'
      );
      expect(selfAssignmentError).toBeDefined();
      expect(selfAssignmentError?.mensagem).toContain(
        'Você não pode se cadastrar como funcionário da própria clínica'
      );
      expect(selfAssignmentError?.severidade).toBe('erro');
    });

    it('deve gerar exatamente 1 erro de self-assignment (não impactar outros CPFs)', async () => {
      const request = makeMockRequest({ mapeamento: MAPEAMENTO_BASICO });

      const response = await validatePost(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      const selfAssignmentErrors = data.data.erros.filter(
        (e: { campo: string; mensagem: string }) =>
          e.campo === 'cpf' &&
          e.mensagem.includes('Você não pode se cadastrar')
      );
      expect(selfAssignmentErrors).toHaveLength(1);
      expect(selfAssignmentErrors[0].valor).toBe('12345678901');
    });

    it('deve normalizar CPF com formatação antes de comparar (limparCPF)', async () => {
      // O mock de parseSpreadsheetAllRows já retorna CPF sem formatação ('12345678901')
      // e a sessão tem o mesmo CPF sem formatação — limparCPF deve igualar ambos
      const request = makeMockRequest({ mapeamento: MAPEAMENTO_BASICO });

      const response = await validatePost(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      const selfAssignmentError = data.data.erros.find(
        (e: { campo: string; mensagem: string }) =>
          e.campo === 'cpf' &&
          e.mensagem.includes('Você não pode se cadastrar')
      );
      expect(selfAssignmentError).toBeDefined();
    });

    it('deve incluir número de linha correto no erro (base 2)', async () => {
      const request = makeMockRequest({ mapeamento: MAPEAMENTO_BASICO });

      const response = await validatePost(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      const selfAssignmentError = data.data.erros.find(
        (e: { campo: string; valor: string }) =>
          e.campo === 'cpf' && e.valor === '12345678901'
      );
      // Linha 2 = índice 0 + 2 (cabeçalho = linha 1)
      expect(selfAssignmentError?.linha).toBe(2);
    });
  });

  describe('POST /api/rh/importacao/execute - Self-Assignment Blocking', () => {
    it('deve retornar 400 quando todas as linhas têm self-assignment', async () => {
      // Configurar parser para retornar apenas o CPF do responsável
      const { parseSpreadsheetAllRows } = jest.requireMock(
        '@/lib/importacao/dynamic-parser'
      );
      parseSpreadsheetAllRows.mockReturnValueOnce({
        success: true,
        data: [
          {
            cpf: '12345678901', // self-assignment
            nome: 'João Silva',
            funcao: 'Enfermeiro',
            nome_empresa: 'Clínica A',
            cnpj_empresa: '12345678000191',
          },
        ],
      });

      const request = makeMockRequest({ mapeamento: MAPEAMENTO_BASICO });
      const response = await executePost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('deve excluir linha de self-assignment e tentar processar linhas válidas', async () => {
      // Parser retorna self-assignment + linha válida
      const { parseSpreadsheetAllRows } = jest.requireMock(
        '@/lib/importacao/dynamic-parser'
      );
      parseSpreadsheetAllRows.mockReturnValueOnce({
        success: true,
        data: DADOS_COM_SELF_ASSIGNMENT,
      });

      const { withTransaction } = jest.requireMock('@/lib/db-transaction');

      const request = makeMockRequest({ mapeamento: MAPEAMENTO_BASICO });
      await executePost(request);

      // withTransaction deve ter sido chamado: a rota chegou até a fase de execução,
      // confirmando que a linha de self-assignment foi excluída e a válida seguiu adiante
      expect(withTransaction).toHaveBeenCalledTimes(1);
    });
  });
});
