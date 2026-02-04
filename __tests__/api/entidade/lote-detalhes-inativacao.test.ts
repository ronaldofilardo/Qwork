import { GET } from '@/app/api/entidade/lote/[id]/route';
import { query } from '@/lib/db';
import { getSession } from '@/lib/session';

jest.mock('@/lib/db');
jest.mock('@/lib/session');

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;

describe('GET /api/entidade/lote/[id] - Exibição de dados de inativação', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar motivo_inativacao e inativada_em quando avaliação está inativada', async () => {
    // Mock sessão válida
    mockGetSession.mockReturnValue({
      cpf: '12345678900',
      perfil: 'gestor_entidade',
      contratante_id: 10,
    } as any);

    // Mock dados do lote
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          titulo: 'Lote Teste',
          tipo: 'completo',
          status: 'concluido',
          criado_em: '2026-01-05T10:00:00',
          liberado_em: '2026-01-05T10:00:00',
        },
      ],
      rowCount: 1,
    } as any);

    // Mock estatísticas
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          total_funcionarios: 2,
          funcionarios_concluidos: 0,
          funcionarios_pendentes: 2,
        },
      ],
      rowCount: 1,
    } as any);

    // Mock funcionários com avaliação inativada
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          cpf: '11122233344',
          nome: 'João Silva',
          setor: 'TI',
          funcao: 'Analista',
          nivel_cargo: 'operacional',
          avaliacao_id: 100,
          avaliacao_status: 'inativada',
          avaliacao_data_inicio: '2026-01-05T08:00:00',
          avaliacao_data_conclusao: null,
          motivo_inativacao: 'Funcionário solicitou cancelamento',
          inativada_em: '2026-01-05T14:30:00',
        },
        {
          cpf: '55566677788',
          nome: 'Maria Santos',
          setor: 'RH',
          funcao: 'Gerente',
          nivel_cargo: 'gestao',
          avaliacao_id: 101,
          avaliacao_status: 'concluida',
          avaliacao_data_inicio: '2026-01-05T08:00:00',
          avaliacao_data_conclusao: '2026-01-05T15:00:00',
          motivo_inativacao: null,
          inativada_em: null,
        },
      ],
      rowCount: 2,
    } as any);

    // Mock médias de grupos para avaliação inativada (não deve retornar nada)
    mockQuery.mockResolvedValueOnce({
      rows: [],
      rowCount: 0,
    } as any);

    // Mock médias de grupos para avaliação concluída
    mockQuery.mockResolvedValueOnce({
      rows: [
        { grupo: 1, media: 65.5 },
        { grupo: 2, media: 70.0 },
      ],
      rowCount: 2,
    } as any);

    const req = new Request('http://localhost/api/entidade/lote/1');
    const res = await GET(req, { params: { id: '1' } });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.funcionarios).toHaveLength(2);

    // Verificar funcionário com avaliação inativada
    const funcInativado = data.funcionarios.find(
      (f: any) => f.cpf === '11122233344'
    );
    expect(funcInativado).toBeDefined();
    expect(funcInativado.avaliacao.status).toBe('inativada');
    expect(funcInativado.avaliacao.motivo_inativacao).toBe(
      'Funcionário solicitou cancelamento'
    );
    expect(funcInativado.avaliacao.inativada_em).toBe('2026-01-05T14:30:00');

    // Verificar funcionário com avaliação concluída
    const funcConcluido = data.funcionarios.find(
      (f: any) => f.cpf === '55566677788'
    );
    expect(funcConcluido).toBeDefined();
    expect(funcConcluido.avaliacao.status).toBe('concluida');
    expect(funcConcluido.avaliacao.motivo_inativacao).toBeNull();
    expect(funcConcluido.avaliacao.inativada_em).toBeNull();
  });
});
