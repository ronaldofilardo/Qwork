import { POST } from '@/app/api/entidade/liberar-lote/route';
import * as sessionMod from '@/lib/session';
import * as dbGestorMod from '@/lib/db-gestor';

jest.mock('@/lib/db-gestor', () => ({
  queryAsGestorEntidade: jest.fn(),
}));

jest.mock('@/lib/session', () => ({
  requireEntity: jest.fn(),
  getSession: jest.fn(),
}));

const mockQueryAsGestorEntidade =
  dbGestorMod.queryAsGestorEntidade as jest.MockedFunction<
    typeof dbGestorMod.queryAsGestorEntidade
  >;
const mockRequireEntity = sessionMod.requireEntity as jest.MockedFunction<
  typeof sessionMod.requireEntity
>;
const mockGetSession = sessionMod.getSession as jest.MockedFunction<
  typeof sessionMod.getSession
>;

describe('/api/entidade/liberar-lote', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock padrão de sessão para gestor de entidade
    mockGetSession.mockReturnValue({
      cpf: '87545772920',
      nome: 'Gestor Teste',
      perfil: 'gestor',
      entidade_id: 5,
      tomador_id: 5,
    } as any);
  });

  it('deve criar lote para funcionários vinculados diretamente à entidade', async () => {
    // Mock session
    mockRequireEntity.mockResolvedValue({
      cpf: '87545772920',
      perfil: 'gestor',
      entidade_id: 5,
    } as any);

    // 1) hasEntidadeFuncsRes -> exists
    mockQueryAsGestorEntidade.mockResolvedValueOnce({
      rows: [{ 1: 1 }],
      rowCount: 1,
    } as any);
    // 2) entidadeRes -> retorna nome da entidade
    mockQueryAsGestorEntidade.mockResolvedValueOnce({
      rows: [{ nome: 'Entidade Teste LTDA' }],
      rowCount: 1,
    } as any);
    // 3) numeroOrdemResult for lotes de entidade
    mockQueryAsGestorEntidade.mockResolvedValueOnce({
      rows: [{ numero_ordem: 1 }],
      rowCount: 1,
    } as any);
    // 4) calcular_elegibilidade_lote_tomador -> retorna lista de funcionarios elegiveis
    mockQueryAsGestorEntidade.mockResolvedValueOnce({
      rows: [
        {
          funcionario_cpf: '11122233344',
          funcionario_nome: 'Fulano da Silva',
          motivo_inclusao: 'Funcionario novo (nunca avaliado)',
          indice_atual: 0,
          dias_sem_avaliacao: null,
          prioridade: 'ALTA',
        },
        {
          funcionario_cpf: '22233344455',
          funcionario_nome: 'Ciclano Souza',
          motivo_inclusao: 'Funcionario novo (nunca avaliado)',
          indice_atual: 0,
          dias_sem_avaliacao: null,
          prioridade: 'ALTA',
        },
      ],
      rowCount: 2,
    } as any);
    // 5) insert lote result (entidade_id, não tomador_id)
    mockQueryAsGestorEntidade.mockResolvedValueOnce({
      rows: [
        {
          id: 100,
          liberado_em: new Date().toISOString(),
          numero_ordem: 1,
        },
      ],
      rowCount: 1,
    } as any);
    // 6+) inserts de avaliacoes (uma por funcionario) + audit_log
    mockQueryAsGestorEntidade.mockResolvedValue({
      rows: [],
      rowCount: 1,
    } as any);

    const response = await POST(
      new Request('http://localhost/api/entidade/liberar-lote', {
        method: 'POST',
        body: JSON.stringify({ tipo: 'completo' }),
      })
    );
    const data = await response.json();

    if (response.status !== 200) {
      console.log('❌ ERRO DE TESTE:', JSON.stringify(data, null, 2));
    }

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.resultados)).toBe(true);
    expect(data.resultados.length).toBe(1);
    expect(data.resultados[0].created).toBe(true);
    expect(data.resultados[0].empresaId).toBeNull();
    expect(data.resultados[0].loteId).toBe(100);
    expect(data.resultados[0].avaliacoesCriadas).toBeGreaterThanOrEqual(0);

    // Deve registrar auditoria para o lote criado (inserção de audit_logs)
    const calledWithAudit = mockQueryAsGestorEntidade.mock.calls.some(
      (call) =>
        typeof call[0] === 'string' &&
        call[0].includes('INSERT INTO audit_logs')
    );
    expect(calledWithAudit).toBe(true);

    // Verificar que o INSERT foi feito com entidade_id (não tomador_id)
    const loteInsertCall = mockQueryAsGestorEntidade.mock.calls.find(
      (call) =>
        typeof call[0] === 'string' &&
        call[0].includes('INSERT INTO lotes_avaliacao') &&
        call[0].includes('entidade_id')
    );
    expect(loteInsertCall).toBeDefined();
    const loteParams = loteInsertCall[1] as any[];
    // Primeiro parâmetro deve ser o entidade_id (5)
    expect(loteParams[0]).toBe(5);
  });

  it('retorna erro quando não há funcionários elegíveis para a entidade', async () => {
    mockRequireEntity.mockResolvedValue({
      cpf: '87545772920',
      perfil: 'gestor',
      entidade_id: 5,
    } as any);

    // 1) hasEntidadeFuncsRes -> existe funcionários vinculados
    mockQueryAsGestorEntidade.mockResolvedValueOnce({
      rows: [{ 1: 1 }],
      rowCount: 1,
    } as any);

    // 2) entidadeRes -> retorna nome da entidade
    mockQueryAsGestorEntidade.mockResolvedValueOnce({
      rows: [{ nome: 'Entidade Sem Elegíveis LTDA' }],
      rowCount: 1,
    } as any);

    // 3) numeroOrdemResult
    mockQueryAsGestorEntidade.mockResolvedValueOnce({
      rows: [{ numero_ordem: 1 }],
      rowCount: 1,
    } as any);

    // 4) calcular_elegibilidade_lote_tomador -> retorna lista vazia (nenhum elegível)
    mockQueryAsGestorEntidade.mockResolvedValueOnce({
      rows: [],
      rowCount: 0,
    } as any);

    const response = await POST(
      new Request('http://localhost/api/entidade/liberar-lote', {
        method: 'POST',
        body: JSON.stringify({ tipo: 'completo' }),
      })
    );

    const data = await response.json();

    if (response.status !== 400) {
      console.log(
        '❌ ERRO DE TESTE (esperava 400):',
        JSON.stringify(data, null, 2)
      );
    }

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Nenhum funcionário elegível encontrado');
    expect(data.detalhes).toMatch(
      /Não foram encontrados funcionários elegíveis/
    );
    expect(Array.isArray(data.resultados)).toBe(true);
    expect(data.resultados.length).toBe(1);
    expect(data.resultados[0].created).toBe(false);
  });
});
