import { POST } from '@/app/api/rh/funcionarios/import/route';

jest.mock('@/lib/xlsxParser', () => {
  const actual = jest.requireActual('@/lib/xlsxParser');
  return {
    ...actual,
    parseXlsxBufferToRows: jest.fn(),
    validarCPFsUnicos: jest.fn(() => ({ valido: true, duplicados: [] })),
    validarEmailsUnicos: jest.fn(() => ({ valido: true, duplicados: [] })),
    validarLinhaFuncionario: jest.fn(() => ({ valido: true, erros: [] })),
  };
});

jest.mock('@/lib/session', () => ({
  requireClinica: jest.fn(() => ({ clinica_id: 1, cpf: '12345678909' })),
}));

jest.mock('@/lib/db', () => ({
  query: jest.fn(() => ({ rows: [] })),
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(() => Promise.resolve('$2a$10$mockedhashvalue')),
}));

const { parseXlsxBufferToRows } = require('@/lib/xlsxParser');
const { query } = require('@/lib/db');

function makeRequestWithFile(empresaId?: string) {
  const file = new File(['dummy'], 'teste.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const fd = new FormData();
  fd.append('file', file);

  const url = empresaId
    ? `http://localhost/api/rh/funcionarios/import?empresa_id=${empresaId}`
    : 'http://localhost/api/rh/funcionarios/import';

  return new Request(url, {
    method: 'POST',
    body: fd,
  });
}

describe('import route - clínica', () => {
  beforeEach(() => {
    // Limpar apenas os calls, mas manter os mocks configurados
    query.mockClear();
  });

  it('returns 400 when empresa_id is missing', async () => {
    const req = makeRequestWithFile();
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('empresa_id é obrigatório');
  });

  it('returns 400 when empresa_id is invalid', async () => {
    const req = makeRequestWithFile('abc');
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('empresa_id inválido');
  });

  it('returns 404 when empresa not found', async () => {
    query.mockResolvedValueOnce({ rows: [] }); // empresa não encontrada

    const req = makeRequestWithFile('999');
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toBe('Empresa não encontrada');
  });

  it('returns 403 when empresa belongs to different clinica', async () => {
    query.mockResolvedValueOnce({
      rows: [{ id: 1, clinica_id: 999 }], // clínica diferente
    });

    const req = makeRequestWithFile('1');
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error).toBe('Acesso negado à empresa de outra clínica');
  });

  it('validates empresa isolation before processing file', async () => {
    // Simular empresa que pertence à mesma clínica
    query.mockResolvedValueOnce({
      rows: [{ id: 1, clinica_id: 1 }], // mesma clínica do mock
    });

    // Mock file vazio (vai falhar no parsing)
    parseXlsxBufferToRows.mockReturnValue({
      success: false,
      error: 'Arquivo vazio',
    });

    // Criar request com mock de arquivo
    const fakeFile = {
      arrayBuffer: async () => new ArrayBuffer(8),
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      name: 'teste.xlsx',
    };

    const req = {
      url: 'http://localhost/api/rh/funcionarios/import?empresa_id=1',
      formData: async () => ({ get: () => fakeFile }),
    } as unknown as Request;

    const res = await POST(req);
    const json = await res.json();

    // O importante aqui é que passou pela validação de empresa
    // e chegou no parsing do arquivo
    expect(query).toHaveBeenCalledWith(
      'SELECT id, clinica_id FROM empresas_clientes WHERE id = $1',
      [1]
    );
    expect(res.status).toBe(400);
    expect(json.error).toContain('Arquivo');
  });

  it('inserts funcionarios with correct empresa_id and clinica_id', async () => {
    // Setup: empresa válida
    query.mockResolvedValueOnce({
      rows: [{ id: 1, clinica_id: 1 }],
    });

    // Setup: parsing bem-sucedido
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
          matricula: 'MAT001',
        },
      ],
    });

    // Setup: CPF não existe
    query.mockResolvedValueOnce({ rows: [] });

    // Setup: Matrícula não existe
    query.mockResolvedValueOnce({ rows: [] });

    // Setup: BEGIN
    query.mockResolvedValueOnce({ rows: [] });

    // Setup: INSERT funcionarios RETURNING id
    query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

    // Setup: INSERT funcionarios_clinicas
    query.mockResolvedValueOnce({ rows: [] });

    // Setup: COMMIT
    query.mockResolvedValueOnce({ rows: [] });

    // Criar request com mock de arquivo
    const fakeFile = {
      arrayBuffer: async () => new ArrayBuffer(8),
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      name: 'teste.xlsx',
    };

    const req = {
      url: 'http://localhost/api/rh/funcionarios/import?empresa_id=1',
      formData: async () => ({ get: () => fakeFile }),
    } as unknown as Request;

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.created).toBe(1);

    // Verificar que o INSERT foi chamado com empresa_id, clinica_id e perfil corretos
    const insertFuncCalls = query.mock.calls.filter(
      (call) =>
        call[0].includes('INSERT INTO funcionarios') &&
        !call[0].includes('funcionarios_clinicas')
    );
    expect(insertFuncCalls.length).toBeGreaterThanOrEqual(1);

    // Pegar o último INSERT do teste atual
    const lastInsert = insertFuncCalls[insertFuncCalls.length - 1];

    // Verificar que o INSERT usa perfil='funcionario' (não usuario_tipo)
    expect(lastInsert[0]).toContain('perfil');
    expect(lastInsert[0]).toContain("'funcionario'");

    const insertParams = lastInsert[1];
    // Verificar que inclui matricula (clinica_id vai para funcionarios_clinicas, não aqui)
    expect(insertParams).toContain('MAT001'); // matricula

    // Verificar que criou entrada em funcionarios_clinicas
    const insertRelCalls = query.mock.calls.filter((call) =>
      call[0].includes('INSERT INTO funcionarios_clinicas')
    );
    expect(insertRelCalls.length).toBeGreaterThanOrEqual(1);

    // Verificar que clinica_id está em funcionarios_clinicas, não em funcionarios
    const funcClinicasParams = insertRelCalls[0][1];
    expect(funcClinicasParams).toContain(1); // clinica_id aqui
    expect(funcClinicasParams).toContain(1); // empresa_id aqui

    // Verificar que session foi passado
    expect(insertFuncCalls[0][2]).toBeDefined();
  });

  it('returns 400 when matriculas are duplicated in file', async () => {
    const {
      validarCPFsUnicos,
      validarEmailsUnicos,
    } = require('@/lib/xlsxParser');

    query.mockResolvedValueOnce({
      rows: [{ id: 1, clinica_id: 1 }],
    });

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
      url: 'http://localhost/api/rh/funcionarios/import?empresa_id=1',
      formData: async () => ({ get: () => fakeFile }),
    } as unknown as Request;

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain('Matrículas duplicadas no arquivo');
    expect(json.error).toContain('MAT001');
  });

  it('returns 409 when matricula already exists in database', async () => {
    query.mockResolvedValueOnce({
      rows: [{ id: 1, clinica_id: 1 }],
    });

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
    query.mockResolvedValueOnce({ rows: [] });

    // Setup: Matrícula já existe
    query.mockResolvedValueOnce({ rows: [{ matricula: 'MAT999' }] });

    const fakeFile = {
      arrayBuffer: async () => new ArrayBuffer(8),
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      name: 'teste.xlsx',
    };

    const req = {
      url: 'http://localhost/api/rh/funcionarios/import?empresa_id=1',
      formData: async () => ({ get: () => fakeFile }),
    } as unknown as Request;

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.error).toContain('Matrículas já existentes no sistema');
    expect(json.error).toContain('MAT999');
  });
});
