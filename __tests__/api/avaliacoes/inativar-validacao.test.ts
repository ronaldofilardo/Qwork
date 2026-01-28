import { GET } from '@/app/api/avaliacoes/inativar/route';
import { query } from '@/lib/db';
import * as sessionMod from '@/lib/session';

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('@/lib/session', () => ({
  requireAuth: jest.fn(),
}));

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireAuth = sessionMod.requireAuth as jest.MockedFunction<
  typeof sessionMod.requireAuth
>;

describe('/api/avaliacoes/inativar GET - validações de consecutividade', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve permitir inativação para funcionário recém-importado (sem avaliações anteriores)', async () => {
    mockRequireAuth.mockResolvedValue({ cpf: '123', perfil: 'rh' } as any);

    // select avaliacao -> retorna funcionario sem avaliações anteriores (indice_avaliacao null)
    const avaliacaoRow = {
      id: 1,
      funcionario_cpf: '11122233344',
      lote_id: 10,
      status: 'em_andamento',
      funcionario_nome: 'Recem Importado',
      indice_avaliacao: null,
      lote_codigo: 'L-010',
      lote_ordem: 5,
    } as any;

    mockQuery.mockResolvedValueOnce({
      rows: [avaliacaoRow],
      rowCount: 1,
    } as any);

    // verificar_inativacao_consecutiva -> permitir (primeira avaliação)
    mockQuery.mockResolvedValueOnce({
      rows: [
        { permitido: true, motivo: 'OK', total_inativacoes_consecutivas: 0 },
      ],
      rowCount: 1,
    } as any);

    const req = new Request(
      'http://localhost/api/avaliacoes/inativar?avaliacao_id=1'
    );
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.permitido).toBe(true);
    expect(data.total_inativacoes_consecutivas).toBe(0);
  });

  it('deve sinalizar como restrição quando já existe 1 inativação anterior (2ª inativação)', async () => {
    mockRequireAuth.mockResolvedValue({ cpf: '123', perfil: 'rh' } as any);

    const avaliacaoRow = {
      id: 2,
      funcionario_cpf: '55566677788',
      lote_id: 20,
      status: 'em_andamento',
      funcionario_nome: 'Com 1 inativacao',
      indice_avaliacao: 15,
      lote_codigo: 'L-020',
      lote_ordem: 10,
    } as any;

    mockQuery.mockResolvedValueOnce({
      rows: [avaliacaoRow],
      rowCount: 1,
    } as any);

    // verificar_inativacao_consecutiva -> retornar permitido = false, total_inativacoes_consecutivas = 1
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          permitido: false,
          motivo: 'Tem 1 inativacao',
          total_inativacoes_consecutivas: 1,
          ultima_inativacao_lote: 'L-019',
        },
      ],
      rowCount: 1,
    } as any);

    // Para cálculo de prioridade: retornar max_ordem
    mockQuery.mockResolvedValueOnce({
      rows: [{ max_ordem: 12 }],
      rowCount: 1,
    } as any);

    const req = new Request(
      'http://localhost/api/avaliacoes/inativar?avaliacao_id=2'
    );
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.permitido).toBe(false);
    expect(data.total_inativacoes_consecutivas).toBe(1);
    expect(data.pode_forcar).toBe(true);
    expect(data.aviso).not.toBeNull();
  });
});
