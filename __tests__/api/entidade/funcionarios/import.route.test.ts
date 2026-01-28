import { POST } from '@/app/api/entidade/funcionarios/import/route';
import { NextResponse } from 'next/server';

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
  requireEntity: jest.fn(() => ({ contratante_id: 1, cpf: '12345678909' })),
}));

jest.mock('@/lib/db', () => ({ query: jest.fn(() => ({ rows: [] })) }));

const { parseXlsxBufferToRows } = require('@/lib/xlsxParser');
const { query } = require('@/lib/db');

function makeRequestWithFile() {
  const file = new File(['dummy'], 'teste.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  return new Request('http://localhost/api/entidade/funcionarios/import', {
    method: 'POST',
    body: new FormData(),
  });
}

describe('import route', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 when parsed rows have invalid date', async () => {
    // Mock parser to return a row with invalid data_nascimento
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

    // Construct a Request with a formData that returns our mock file
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
    // debug
    console.log('RESP JSON', json);
    expect(res.status).toBe(400);
    expect(json.details).toBeDefined();
    expect(json.details[0]).toMatch(/Data de nascimento inválida/);
  });

  it('returns 400 when data_nascimento has timezone-like prefix', async () => {
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
    expect(json.details).toBeDefined();
    expect(json.details[0]).toMatch(/Data de nascimento inválida/);
  });
});
