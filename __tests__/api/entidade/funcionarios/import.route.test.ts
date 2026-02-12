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

    // Mock: CPF não existe
    queryAsGestorEntidade.mockResolvedValueOnce({ rows: [] });
    // Mock: Matrícula não existe (nenhuma matrícula fornecida)
    queryAsGestorEntidade.mockResolvedValueOnce({ rows: [] });

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
    const json: Response<unknown> = await res.json();

    // Assert - Validar erro de validação
    expect(res.status).toBe(400, 'Status deve ser 400 para data inválida');
    expect(json.details).toBeDefined();
    expect(json.details[0]).toMatch(
      /Data de nascimento inválida/,
      'Mensagem deve indicar data inválida'
    );
  });

  /**
   * @test Valida rejeição de data_nascimento com prefixo de timezone
   * @description Deve retornar 400 quando data tem formato timezone inválido (+020011-02)
   */
  it('returns 400 when data_nascimento has timezone-like prefix', async () => {
    // Arrange - Mock parser para retornar linha com formato timezone inválido
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

    // Mock: CPF não existe
    queryAsGestorEntidade.mockResolvedValueOnce({ rows: [] });
    // Mock: Matrícula não existe
    queryAsGestorEntidade.mockResolvedValueOnce({ rows: [] });

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
    const json: Response<unknown> = await res.json();

    // Assert - Validar erro de validação
    expect(res.status).toBe(
      400,
      'Status deve ser 400 para data com timezone inválido'
    );
    expect(json.details).toBeDefined();
    expect(json.details[0]).toMatch(
      /Data de nascimento inválida/,
      'Mensagem deve indicar data inválida'
    );
  });

  /**
   * @test Valida rejeição de matrículas duplicadas no arquivo
   * @description Deve retornar 400 quando há matrículas duplicadas no mesmo arquivo
   */
  it('returns 400 when matriculas are duplicated in file', async () => {
    const {
      validarCPFsUnicos,
      validarEmailsUnicos,
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

    validarCPFsUnicos.mockReturnValue({ valido: true, duplicados: [] });
    validarEmailsUnicos.mockReturnValue({ valido: true, duplicados: [] });

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
    expect(json.error).toContain('MAT001');
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
    expect(json.error).toContain('MAT999');
  });

  /**
   * @test Valida que perfil é definido corretamente e cria relacionamento
   * @description Deve inserir com perfil='funcionario' e criar entrada em funcionarios_entidades
   */
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

    // Setup: BEGIN
    queryAsGestorEntidade.mockResolvedValueOnce({ rows: [] });

    // Setup: INSERT funcionarios RETURNING id
    queryAsGestorEntidade.mockResolvedValueOnce({ rows: [{ id: 1 }] });

    // Setup: INSERT funcionarios_entidades
    queryAsGestorEntidade.mockResolvedValueOnce({ rows: [] });

    // Setup: COMMIT
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

    // Verificar que tomador_id foi passado como parâmetro
    expect(lastInsert[1]).toBeDefined();
    expect(Array.isArray(lastInsert[1])).toBe(true);
    expect(lastInsert[1]).toContain(1); // entidade_id mockado
  });
});
