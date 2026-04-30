/**
 * Testes para validação de self-assignment na importação em massa (Entidade)
 * Valida que um gestor não pode se cadastrar como funcionário via planilha XLSX
 */
import { POST as validatePost } from '@/app/api/entidade/importacao/validate/route';
import { POST as executePost } from '@/app/api/entidade/importacao/execute/route';

// Dados padrão: primeiro CPF é o mesmo do gestor (self-assignment)
const DADOS_COM_SELF_ASSIGNMENT = [
  {
    cpf: '11111111111', // self-assignment
    nome: 'Carlos Silva',
    funcao: 'Gerente',
    setor: 'Administrativo',
  },
  {
    cpf: '22222222222',
    nome: 'Ana Costa',
    funcao: 'Recepcionista',
    setor: 'Atendimento',
  },
];

// Mock da sessão do usuário
jest.mock('@/lib/session', () => ({
  requireEntity: jest.fn(async () => ({
    entidade_id: 1,
    cpf: '11111111111', // Gestor responsável
    usuario_id: 'user-456',
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
  withTransactionAsGestor: jest.fn(async (cb) => {
    const mockClient = { query: jest.fn(async () => ({ rows: [] })) };
    return cb(mockClient);
  }),
}));

// Mock de bcryptjs
jest.mock('bcryptjs', () => ({ hash: jest.fn(async () => 'hash-fake') }));

// Mock de password-generator
jest.mock('@/lib/auth/password-generator', () => ({
  gerarSenhaDeNascimento: jest.fn(() => 'senha123'),
}));

// Mock de xlsxParser
jest.mock('@/lib/xlsxParser', () => ({
  parseDateCell: jest.fn(() => null),
}));

// --------------------------------------------------------------------------
// Helper: cria um mock de Request com Content-Type multipart/form-data
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

describe('Importação Entidade - Self-Assignment Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/entidade/importacao/validate - Self-Assignment Check', () => {
    it('deve detectar self-assignment (CPF do gestor na planilha) e retornar erro', async () => {
      const request = makeMockRequest({ mapeamento: MAPEAMENTO_BASICO });

      const response = await validatePost(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      const selfAssignmentError = data.data.erros.find(
        (e: { campo: string; valor: string }) =>
          e.campo === 'cpf' && e.valor === '11111111111'
      );
      expect(selfAssignmentError).toBeDefined();
      expect(selfAssignmentError?.mensagem).toContain(
        'Você não pode se cadastrar como funcionário da própria entidade'
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
      expect(selfAssignmentErrors[0].valor).toBe('11111111111');
    });

    it('deve usar mensagem específica para Entidade (não "clínica")', async () => {
      const request = makeMockRequest({ mapeamento: MAPEAMENTO_BASICO });

      const response = await validatePost(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      const selfAssignmentError = data.data.erros.find(
        (e: { campo: string; mensagem: string }) =>
          e.campo === 'cpf' &&
          e.mensagem.includes('Você não pode se cadastrar')
      );
      expect(selfAssignmentError?.mensagem).toContain('entidade');
      expect(selfAssignmentError?.mensagem).not.toContain('clínica');
    });

    it('deve incluir número de linha correto no erro (base 2)', async () => {
      const request = makeMockRequest({ mapeamento: MAPEAMENTO_BASICO });

      const response = await validatePost(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      const selfAssignmentError = data.data.erros.find(
        (e: { campo: string; valor: string }) =>
          e.campo === 'cpf' && e.valor === '11111111111'
      );
      expect(selfAssignmentError?.linha).toBe(2);
    });
  });

  describe('POST /api/entidade/importacao/execute - Self-Assignment Blocking', () => {
    it('deve retornar 400 quando todas as linhas têm self-assignment', async () => {
      const { parseSpreadsheetAllRows } = jest.requireMock(
        '@/lib/importacao/dynamic-parser'
      );
      parseSpreadsheetAllRows.mockReturnValueOnce({
        success: true,
        data: [
          {
            cpf: '11111111111', // self-assignment
            nome: 'Carlos Silva',
            funcao: 'Gerente',
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
      const { parseSpreadsheetAllRows } = jest.requireMock(
        '@/lib/importacao/dynamic-parser'
      );
      parseSpreadsheetAllRows.mockReturnValueOnce({
        success: true,
        data: DADOS_COM_SELF_ASSIGNMENT,
      });

      const { withTransactionAsGestor } = jest.requireMock('@/lib/db-transaction');

      const request = makeMockRequest({ mapeamento: MAPEAMENTO_BASICO });
      await executePost(request);

      // withTransactionAsGestor deve ter sido chamado: linha válida chegou à fase de execução
      expect(withTransactionAsGestor).toHaveBeenCalledTimes(1);
    });
  });
});
