/**
 * @fileoverview Testes para API de importação de funcionários via XLSX
 * @description Valida validações de data_nascimento e processamento de arquivos XLSX
 */

import type { Response } from '@/types/api';
import { POST } from '@/app/api/entidade/funcionarios/import/route';
import { NextResponse } from 'next/server';

jest.mock('@/lib/xlsxParser', () => {
  const actual = jest.requireActual('@/lib/xlsxParser');
  return {
    ...actual,
    parseXlsxBufferToRows: jest.fn() as jest.MockedFunction<
      typeof import('@/lib/xlsxParser').parseXlsxBufferToRows
    >,
    // Legados (ainda exportados)
    validarCPFsUnicos: jest.fn(() => ({
      valido: true,
      duplicados: [],
    })) as jest.MockedFunction<
      typeof import('@/lib/xlsxParser').validarCPFsUnicos
    >,
    validarEmailsUnicos: jest.fn(() => ({
      valido: true,
      duplicados: [],
    })) as jest.MockedFunction<
      typeof import('@/lib/xlsxParser').validarEmailsUnicos
    >,
    // Novas funções — retornam válido por padrão
    validarCPFsUnicosDetalhado: jest.fn(() => ({ valido: true, details: [] })),
    validarEmailsUnicosDetalhado: jest.fn(() => ({ valido: true, details: [] })),
    validarMatriculasUnicasDetalhado: jest.fn(() => ({ valido: true, details: [] })),
    validarLinhaFuncionario: jest.fn(() => ({
      valido: true,
      erros: [],
    })) as jest.MockedFunction<
      typeof import('@/lib/xlsxParser').validarLinhaFuncionario
    >,
  };
});

jest.mock('@/lib/session', () => ({
  requireEntity: jest.fn(() => ({
    entidade_id: 1,
    cpf: '12345678909',
  })) as jest.MockedFunction<
    () => Promise<{ entidade_id: number; cpf: string }>
  >,
}));

jest.mock('@/lib/db', () => ({
  query: jest.fn(() => ({ rows: [] })) as jest.MockedFunction<
    typeof import('@/lib/db').query
  >,
}));

jest.mock('@/lib/db-gestor', () => ({
  queryAsGestorEntidade: jest.fn(() => ({ rows: [] })) as jest.MockedFunction<
    typeof import('@/lib/db-gestor').queryAsGestorEntidade
  >,
}));

// withTransactionAsGestor: passa client com query = queryAsGestorEntidade
jest.mock('@/lib/db-transaction', () => ({
  withTransactionAsGestor: jest.fn(async (fn: (client: any) => Promise<any>) => {
    const { queryAsGestorEntidade } = require('@/lib/db-gestor');
    return fn({ query: queryAsGestorEntidade });
  }),
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(() => Promise.resolve('$2a$10$mockedhashvalue')),
}));

const { parseXlsxBufferToRows } = require('@/lib/xlsxParser');
const { queryAsGestorEntidade } = require('@/lib/db-gestor');

function makeRequestWithFile() {
  const file = new File(['dummy'], 'teste.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  return new Request('http://localhost/api/entidade/funcionarios/import', {
    method: 'POST',
    body: new FormData(),
  });
}

/**
 * @test Suite de testes para rota de importação de funcionários
 * @description Testa validações de formato de data e parsing de XLSX
 */
describe('import route', () => {
  beforeEach(() => {
    // Limpar apenas os calls, mas manter os mocks configurados
    queryAsGestorEntidade.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * @test Valida rejeição de data_nascimento inválida
   * @description Deve retornar 400 quando data_nascimento não é uma data válida
   */
  it('returns 400 when parsed rows have invalid date', async () => {
    const { validarLinhaFuncionario } = require('@/lib/xlsxParser');

    // Arrange - Mock parser para retornar linha com data inválida
    parseXlsxBufferToRows.mockReturnValue({
      success: true,
      data: [
        {
          cpf: '12345678909',
          nome: 'João',
          data_nascimento: 'not-a-date',
          setor: 'TI',
          funcao: 'Dev',
          email: 'a@b.com',
        },
      ],
    });

    // validarLinhaFuncionario retorna erro de data para esta linha
    validarLinhaFuncionario.mockReturnValueOnce({
      valido: false,
      erros: ['Data de nascimento inválida. Use dd/mm/aaaa'],
    });

    const fakeFile = {
      arrayBuffer: async () => new ArrayBuffer(8),
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      name: 'teste.xlsx',
    };

    const req = {
      formData: async () => ({ get: () => fakeFile }),
    } as unknown as Request;

    // Act - Processar request
    const res = await POST(req);
    const json = await res.json();

    // Assert - Validação de linha falha antes das queries de DB
    expect(res.status).toBe(400);
    expect(json.details).toBeDefined();
    expect(json.details[0]).toMatch(/Data de nascimento inválida/);
  });

  /**
   * @test Valida rejeição de data_nascimento com prefixo de timezone
   * @description Deve retornar 400 quando data tem formato timezone inválido (+020011-02)
   */
  it('returns 400 when data_nascimento has timezone-like prefix', async () => {
    const { validarLinhaFuncionario } = require('@/lib/xlsxParser');

    // Arrange
    parseXlsxBufferToRows.mockReturnValue({
      success: true,
      data: [
        {
          cpf: '12345678909',
          nome: 'Ana',
          data_nascimento: '+020011-02',
          setor: 'TI',
          funcao: 'Dev',
          email: 'ana@x.com',
        },
      ],
    });

    validarLinhaFuncionario.mockReturnValueOnce({
      valido: false,
      erros: ['Data de nascimento inválida. Use dd/mm/aaaa'],
    });

    const fakeFile = {
      arrayBuffer: async () => new ArrayBuffer(8),
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      name: 'teste.xlsx',
    };

    const req = {
      formData: async () => ({ get: () => fakeFile }),
    } as unknown as Request;

    // Act
    const res = await POST(req);
    const json = await res.json();

    // Assert
    expect(res.status).toBe(400);
    expect(json.details).toBeDefined();
    expect(json.details[0]).toMatch(/Data de nascimento inválida/);
  });

  /**
   * @test Valida rejeição de matrículas duplicadas no arquivo
   * @description Deve retornar 400 quando há matrículas duplicadas no mesmo arquivo
   */
  it('returns 400 when matriculas are duplicated in file', async () => {
    const {
      validarCPFsUnicosDetalhado,
      validarEmailsUnicosDetalhado,
      validarMatriculasUnicasDetalhado,
    } = require('@/lib/xlsxParser');

    parseXlsxBufferToRows.mockReturnValue({
      success: true,
      data: [
        {
          cpf: '11111111111',
          nome: 'João',
          data_nascimento: '1990-01-15',
          setor: 'TI',
          funcao: 'Dev',
          email: 'joao@test.com',
          matricula: 'MAT001',
        },
        {
          cpf: '22222222222',
          nome: 'Maria',
          data_nascimento: '1992-03-20',
          setor: 'RH',
          funcao: 'Analista',
          email: 'maria@test.com',
          matricula: 'MAT001', // duplicada
        },
      ],
    });

    validarCPFsUnicosDetalhado.mockReturnValue({ valido: true, details: [] });
    validarEmailsUnicosDetalhado.mockReturnValue({ valido: true, details: [] });
    // Matrículas duplicadas — deve retornar 400 antes de qualquer query
    validarMatriculasUnicasDetalhado.mockReturnValueOnce({
      valido: false,
      details: ['Linha 2: Matrícula MAT001 duplicada no arquivo (também na linha 3)'],
    });

    const fakeFile = {
      arrayBuffer: async () => new ArrayBuffer(8),
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      name: 'teste.xlsx',
    };

    const req = {
      formData: async () => ({ get: () => fakeFile }),
    } as unknown as Request;

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain('Matrículas duplicadas no arquivo');
    expect(json.details[0]).toContain('MAT001');
  });

  /**
   * @test Valida rejeição de matrícula que já existe no banco
   * @description Deve retornar 409 quando matrícula já está cadastrada
   */
  it('returns 409 when matricula already exists in database', async () => {
    // Limpar mocks acumulados
    queryAsGestorEntidade.mockReset();

    parseXlsxBufferToRows.mockReturnValue({
      success: true,
      data: [
        {
          cpf: '12345678901',
          nome: 'João Silva',
          data_nascimento: '1990-01-15',
          setor: 'TI',
          funcao: 'Dev',
          email: 'joao@empresa.com',
          matricula: 'MAT999',
        },
      ],
    });

    // Setup: CPF não existe
    queryAsGestorEntidade.mockResolvedValueOnce({ rows: [] });

    // Setup: Matrícula já existe
    queryAsGestorEntidade.mockResolvedValueOnce({
      rows: [{ matricula: 'MAT999' }],
    });

    const fakeFile = {
      arrayBuffer: async () => new ArrayBuffer(8),
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      name: 'teste.xlsx',
    };

    const req = {
      formData: async () => ({ get: () => fakeFile }),
    } as unknown as Request;

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.error).toContain('Matrículas já existentes no sistema');
    expect(json.details[0]).toContain('MAT999');
  });

  it('inserts funcionarios with correct perfil and creates relationship', async () => {
    // Limpar todos os mocks anteriores
    queryAsGestorEntidade.mockReset();

    parseXlsxBufferToRows.mockReturnValue({
      success: true,
      data: [
        {
          cpf: '12345678901',
          nome: 'João Silva',
          data_nascimento: '1974-10-24',
          setor: 'TI',
          funcao: 'Dev',
          email: 'joao@empresa.com',
          matricula: 'MAT001',
        },
      ],
    });

    // Setup: CPF não existe
    queryAsGestorEntidade.mockResolvedValueOnce({ rows: [] });

    // Setup: Matrícula não existe
    queryAsGestorEntidade.mockResolvedValueOnce({ rows: [] });

    // Dentro da transação: INSERT funcionarios RETURNING id
    queryAsGestorEntidade.mockResolvedValueOnce({ rows: [{ id: 1 }] });

    // Dentro da transação: INSERT funcionarios_entidades
    queryAsGestorEntidade.mockResolvedValueOnce({ rows: [] });

    const fakeFile = {
      arrayBuffer: async () => new ArrayBuffer(8),
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      name: 'teste.xlsx',
    };

    const req = {
      formData: async () => ({ get: () => fakeFile }),
    } as unknown as Request;

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);

    // Verificar que o INSERT em funcionarios usa perfil (não usuario_tipo)
    const allCalls = queryAsGestorEntidade.mock.calls;
    const insertFuncCalls = allCalls.filter(
      (call) =>
        call[0].includes('INSERT INTO funcionarios') &&
        !call[0].includes('funcionarios_entidades')
    );

    // Deve ter pelo menos 1 INSERT de funcionarios
    expect(insertFuncCalls.length).toBeGreaterThanOrEqual(1);

    // Pegar o último INSERT (do teste atual)
    const lastInsert = insertFuncCalls[insertFuncCalls.length - 1];
    expect(lastInsert[0]).toContain('perfil');
    expect(lastInsert[0]).toContain("'funcionario'");

    // Verificar que criou entrada em funcionarios_entidades
    const insertRelCalls = allCalls.filter((call) =>
      call[0].includes('INSERT INTO funcionarios_entidades')
    );
    expect(insertRelCalls.length).toBeGreaterThanOrEqual(1);

    // Verificar que entidade_id foi passado no INSERT de funcionarios_entidades
    const insertEntCalls = allCalls.filter((call) =>
      call[0].includes('INSERT INTO funcionarios_entidades')
    );
    expect(insertEntCalls.length).toBeGreaterThanOrEqual(1);
    const entParams = insertEntCalls[insertEntCalls.length - 1][1];
    expect(entParams).toContain(1); // entidade_id mockado
  });

  it('vincula funcionario existente a nova entidade (multiplos empregos)', async () => {
    queryAsGestorEntidade.mockReset();

    parseXlsxBufferToRows.mockReturnValue({
      success: true,
      data: [
        {
          cpf: '74867746070',
          nome: 'Carlos Existente',
          data_nascimento: '1988-06-22',
          setor: 'TI',
          funcao: 'Dev',
          email: 'carlos@emp.com',
        },
      ],
    });

    // CPF já existe no banco com id=42
    queryAsGestorEntidade.mockResolvedValueOnce({ rows: [{ id: 42, cpf: '74867746070' }] });

    // (sem matrículas novas a verificar — toInsertNew está vazio)

    // Dentro da transação: CPF ainda não vinculado a esta entidade
    queryAsGestorEntidade.mockResolvedValueOnce({ rows: [] }); // SELECT 1 FROM funcionarios_entidades

    // INSERT funcionarios_entidades
    queryAsGestorEntidade.mockResolvedValueOnce({ rows: [] });

    const fakeFile = {
      arrayBuffer: async () => new ArrayBuffer(8),
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      name: 'teste.xlsx',
    };

    const req = {
      formData: async () => ({ get: () => fakeFile }),
    } as unknown as Request;

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.created).toBe(0);
    expect(json.linked).toBe(1);
    expect(json.warnings).toBeUndefined();
  });

  it('registra warning quando CPF já está vinculado a esta entidade', async () => {
    queryAsGestorEntidade.mockReset();

    parseXlsxBufferToRows.mockReturnValue({
      success: true,
      data: [
        {
          cpf: '74867746070',
          nome: 'Carlos Vinculado',
          data_nascimento: '1988-06-22',
          setor: 'TI',
          funcao: 'Dev',
          email: 'carlos@emp.com',
        },
      ],
    });

    // CPF existe no banco
    queryAsGestorEntidade.mockResolvedValueOnce({ rows: [{ id: 42, cpf: '74867746070' }] });

    // Dentro da transação: já está vinculado a esta entidade
    queryAsGestorEntidade.mockResolvedValueOnce({ rows: [{ id: 999 }] }); // SELECT 1 FROM funcionarios_entidades

    const fakeFile = {
      arrayBuffer: async () => new ArrayBuffer(8),
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      name: 'teste.xlsx',
    };

    const req = {
      formData: async () => ({ get: () => fakeFile }),
    } as unknown as Request;

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.created).toBe(0);
    expect(json.linked).toBe(0);
    expect(Array.isArray(json.warnings)).toBe(true);
    expect(json.warnings[0]).toContain('74867746070');
  });

  /**
   * @test Valida que contratante_id é passado corretamente (constraint funcionarios_clinica_check)
   * @description Deve passar contratante_id no INSERT para satisfazer a constraint que exige:
   *              clinica_id IS NOT NULL OR contratante_id IS NOT NULL OR perfil IN (...)
   */
  it('passes contratante_id in INSERT funcionarios to satisfy constraint', async () => {
    queryAsGestorEntidade.mockReset();

    parseXlsxBufferToRows.mockReturnValue({
      success: true,
      data: [
        {
          cpf: '88888888888',
          nome: 'Diego Test',
          data_nascimento: '1995-05-10',
          setor: 'TI',
          funcao: 'Dev',
          email: 'diego@entidade.com',
        },
      ],
    });

    // CPF não existe
    queryAsGestorEntidade.mockResolvedValueOnce({ rows: [] });

    // Nenhuma matrícula a verificar
    queryAsGestorEntidade.mockResolvedValueOnce({ rows: [] });

    // INSERT funcionarios RETURNING id
    queryAsGestorEntidade.mockResolvedValueOnce({ rows: [{ id: 55 }] });

    // INSERT funcionarios_entidades
    queryAsGestorEntidade.mockResolvedValueOnce({ rows: [] });

    const fakeFile = {
      arrayBuffer: async () => new ArrayBuffer(8),
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      name: 'teste.xlsx',
    };

    const req = {
      formData: async () => ({ get: () => fakeFile }),
    } as unknown as Request;

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);

    // Extrair chamadas de INSERT
    const allCalls = queryAsGestorEntidade.mock.calls;
    const insertFuncCalls = allCalls.filter(
      (call) =>
        call[0].includes('INSERT INTO funcionarios') &&
        !call[0].includes('funcionarios_entidades')
    );

    // Deve ter feito INSERT (e não apenas SELECTs)
    expect(insertFuncCalls.length).toBeGreaterThanOrEqual(1);

    // Buscar o INSERT específico
    const lastInsertCall = insertFuncCalls[insertFuncCalls.length - 1];
    const sqlQuery = lastInsertCall[0] as string;
    const params = lastInsertCall[1] as unknown[];

    // Validar que contratante_id está na query
    expect(sqlQuery).toContain('contratante_id');

    // Validar que entidade_id (1) foi passado como parâmetro
    // A posição depende da ordem das colunas no INSERT
    // mas sabemos que entidade_id deve estar nos parâmetros
    const mockEntidadeId = 1; // do mock requireEntity
    expect(params).toContain(mockEntidadeId);
  });
});
