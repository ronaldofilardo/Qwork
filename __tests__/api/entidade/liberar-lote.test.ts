import { POST } from '@/app/api/entidade/liberar-lote/route';
import * as sessionMod from '@/lib/session';
import { query } from '@/lib/db';

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('@/lib/session', () => ({
  requireEntity: jest.fn(),
}));

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireEntity = sessionMod.requireEntity as jest.MockedFunction<
  typeof sessionMod.requireEntity
>;

describe('/api/entidade/liberar-lote', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve criar lote para funcionários vinculados diretamente à entidade', async () => {
    // Mock session
    mockRequireEntity.mockResolvedValue({
      cpf: '999',
      perfil: 'gestor_entidade',
      contratante_id: 123,
    } as any);

    // 1) gestorCheck -> não existe (simular gestor externo)
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    // 2) empresasRes -> empty
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    // 3) hasEntidadeFuncsRes -> exists
    mockQuery.mockResolvedValueOnce({ rows: [{ 1: 1 }], rowCount: 1 } as any);
    // 4) contratanteRes -> retorna nome
    mockQuery.mockResolvedValueOnce({
      rows: [{ nome: 'Entidade Teste' }],
      rowCount: 1,
    } as any);
    // 4) numeroOrdemResult for empresa_id IS NULL
    mockQuery.mockResolvedValueOnce({
      rows: [{ numero_ordem: 5 }],
      rowCount: 1,
    } as any);
    // 5) elegibilidadeResult -> retorna lista de funcionarios elegiveis
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          funcionario_cpf: '11122233344',
          funcionario_nome: 'Fulano',
          motivo_inclusao: 'novo',
          indice_atual: 0,
          dias_sem_avaliacao: null,
          prioridade: 'ALTA',
        },
      ],
      rowCount: 1,
    } as any);
    // 6) dataFiltro query (no filter) - but code won't call dataFiltro if not provided
    // 7) nivelFiltro (no tipo provided)
    // 8) gerar_codigo_lote
    mockQuery.mockResolvedValueOnce({
      rows: [{ codigo: 'ENT-001' }],
      rowCount: 1,
    } as any);
    // 9) insert lote result
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 777,
          liberado_em: new Date().toISOString(),
          numero_ordem: 5,
        },
      ],
      rowCount: 1,
    } as any);
    // 10+) inserts de avaliacoes (one per funcionario), we can return success
    mockQuery.mockResolvedValue({ rows: [], rowCount: 1 } as any);

    const response = await POST(
      new Request('http://localhost/api/entidade/liberar-lote', {
        method: 'POST',
        body: JSON.stringify({ tipo: 'completo' }),
      })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.resultados)).toBe(true);
    expect(data.resultados.length).toBeGreaterThanOrEqual(1);
    expect(data.resultados[0].created).toBe(true);
    expect(data.resultados[0].empresaId).toBeNull();
    expect(data.resultados[0].avaliacoesCriadas).toBeGreaterThanOrEqual(0);

    // Deve registrar auditoria para o lote criado (inserção de audit_logs)
    const calledWithAudit = mockQuery.mock.calls.some(
      (call) =>
        typeof call[0] === 'string' &&
        call[0].includes('INSERT INTO audit_logs')
    );
    expect(calledWithAudit).toBe(true);

    // Se o gestor não é um funcionário, não devemos ter tentado inserir em `funcionarios`
    const attemptedFuncionarioInsert = mockQuery.mock.calls.some(
      (call) =>
        typeof call[0] === 'string' &&
        call[0].includes('INSERT INTO funcionarios')
    );
    expect(attemptedFuncionarioInsert).toBe(false);

    // Verificar que o INSERT no lote foi feito com liberado_por = NULL (parâmetro 9 na query de lote de entidade)
    const loteInsertCall = mockQuery.mock.calls.find(
      (call) =>
        typeof call[0] === 'string' &&
        call[0].includes('INSERT INTO lotes_avaliacao')
    );
    expect(loteInsertCall).toBeDefined();
    const loteParams = loteInsertCall[1] as any[];
    // Para lotes de entidade o nono parâmetro (index 8) é `liberado_por` na nossa query
    expect(loteParams[8]).toBeNull();
  });

  it('retorna erro quando não há funcionários elegíveis para nenhuma empresa', async () => {
    mockRequireEntity.mockResolvedValue({
      cpf: '999',
      perfil: 'gestor_entidade',
      contratante_id: 123,
    } as any);

    // 1) gestorCheck -> assume gestor is registrado (existente)
    mockQuery.mockResolvedValueOnce({ rows: [{ 1: 1 }], rowCount: 1 } as any);
    // 2) empresasRes -> one company
    mockQuery.mockResolvedValueOnce({
      rows: [{ empresa_id: 10 }],
      rowCount: 1,
    } as any);
    // 3) hasEntidadeFuncsRes -> none
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    // 3) empresaCheck -> returns company
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 10, nome: 'Empresa X', clinica_id: 5 }],
      rowCount: 1,
    } as any);

    // 4) numeroOrdemResult
    mockQuery.mockResolvedValueOnce({
      rows: [{ numero_ordem: 7 }],
      rowCount: 1,
    } as any);

    // 5) calcular_elegibilidade_lote -> returns empty list
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const response = await POST(
      new Request('http://localhost/api/entidade/liberar-lote', {
        method: 'POST',
        body: JSON.stringify({ tipo: 'completo' }),
      })
    );

    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Nenhum funcionário elegível encontrado');
    expect(data.detalhes).toMatch(/Empresa X/);
    expect(Array.isArray(data.resultados)).toBe(true);
  });
});
