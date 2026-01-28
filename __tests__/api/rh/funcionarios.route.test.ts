import { GET } from '@/app/api/rh/funcionarios/route';
import { query } from '@/lib/db';

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('@/lib/session', () => ({
  requireRHWithEmpresaAccess: jest.fn(),
}));

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRH = require('@/lib/session').requireRHWithEmpresaAccess as jest.MockedFunction<any>;

describe('/api/rh/funcionarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna lista de funcionários para empresa válida', async () => {
    mockRequireRH.mockResolvedValue({ clinica_id: 10 });

    const mockRows = [
      {
        cpf: '123',
        nome: 'João',
        setor: 'TI',
        funcao: 'Dev',
        matricula: 'M001',
        nivel_cargo: 'operacional',
        turno: 'Diurno',
        escala: '8h',
        ativo: true,
        criado_em: '2026-01-01',
        atualizado_em: '2026-01-02',
        indice_avaliacao: 1,
        data_ultimo_lote: null,
      },
    ];

    // Primeiro retorno: lista de funcionários
    mockQuery.mockResolvedValueOnce({ rows: mockRows, rowCount: 1 } as any);
    // Segundo retorno: avaliações (nenhuma)
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const request = new Request('http://localhost/api/rh/funcionarios?empresa_id=5');
    const res = await GET(request as any);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.funcionarios).toBeDefined();
    expect(Array.isArray(data.funcionarios)).toBe(true);
    expect(data.funcionarios[0].cpf).toBe('123');

    // Verificar que a query foi chamada com empresaId e clinicaId
    expect(mockQuery).toHaveBeenCalled();
    const calledSql = mockQuery.mock.calls[0][0] as string;
    // Deve usar alias 'f' na cláusula FROM
    expect(calledSql).toContain('FROM funcionarios f');
  });
});