import { POST } from '@/app/api/avaliacoes/inativar/route';
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

describe('/api/avaliacoes/inativar (entidade contexto)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve inativar avaliação de funcionário vinculado à contratante sem violar constraint de clinica', async () => {
    // Mock auth como gestor_entidade
    mockRequireAuth.mockResolvedValue({
      cpf: '87545772920',
      perfil: 'gestor_entidade',
    } as any);

    // Mock seleção da avaliação
    const avaliacaoRow = {
      id: 999,
      funcionario_cpf: '55544433322',
      lote_id: 888,
      status: 'iniciada',
      funcionario_nome: 'Teste Contratante',
      lote_codigo: 'ENT-001',
      lote_ordem: 2,
    };

    // seq: fetch avaliacaoResult -> validar consecutividade -> select status again -> update avaliacoes -> insert audit
    mockQuery.mockResolvedValueOnce({
      rows: [avaliacaoRow],
      rowCount: 1,
    } as any); // select avaliacao

    // verificar_inativacao_consecutiva -> allowed
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          permitido: true,
          motivo: 'OK',
          total_inativacoes_consecutivas: 0,
          ultima_inativacao_lote: null,
        },
      ],
      rowCount: 1,
    } as any);

    // final status check
    mockQuery.mockResolvedValueOnce({
      rows: [{ status: 'iniciada' }],
      rowCount: 1,
    } as any);

    // update avaliacoes -> returns rowCount 1
    mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any);

    // insert audit_logs
    mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any);

    const req = new Request('http://localhost/api/avaliacoes/inativar', {
      method: 'POST',
      body: JSON.stringify({
        avaliacao_id: 999,
        motivo: 'Justificativa adequada para testar',
        forcar: false,
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);

    // Ensure update was attempted with correct status
    const updateCall = mockQuery.mock.calls.find(
      (call) =>
        typeof call[0] === 'string' && call[0].includes('UPDATE avaliacoes')
    );
    expect(updateCall).toBeTruthy();

    // Verificar que o UPDATE contém status = 'inativada'
    expect(updateCall[0]).toContain("status = 'inativada'");
    expect(updateCall[0]).toContain('motivo_inativacao = $2');
    expect(updateCall[0]).toContain('inativada_em = NOW()');
  });

  it('deve bloquear inativação sem forçar quando existe 1 inativação anterior (2ª inativação)', async () => {
    mockRequireAuth.mockResolvedValue({
      cpf: '87545772920',
      perfil: 'gestor_entidade',
    } as any);

    const avaliacaoRow = {
      id: 1010,
      funcionario_cpf: '55544433355',
      lote_id: 900,
      status: 'em_andamento',
      funcionario_nome: 'Teste Bloqueio',
      lote_codigo: 'ENT-900',
      lote_ordem: 5,
    };

    mockQuery.mockResolvedValueOnce({
      rows: [avaliacaoRow],
      rowCount: 1,
    } as any);
    // verificar_inativacao_consecutiva -> not allowed (já tem 1 inativação anterior)
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          permitido: false,
          motivo: 'Tem 1 inativacao',
          total_inativacoes_consecutivas: 1,
        },
      ],
      rowCount: 1,
    } as any);

    const req = new Request('http://localhost/api/avaliacoes/inativar', {
      method: 'POST',
      body: JSON.stringify({
        avaliacao_id: 1010,
        motivo: 'Justificativa curta',
        forcar: false,
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Inativação bloqueada');
    expect(data.pode_forcar).toBe(true);
  });

  it('deve permitir inativação forçada quando forcar=true e motivo extenso', async () => {
    mockRequireAuth.mockResolvedValue({
      cpf: '87545772920',
      perfil: 'gestor_entidade',
    } as any);

    const avaliacaoRow = {
      id: 1011,
      funcionario_cpf: '55544433356',
      lote_id: 901,
      status: 'em_andamento',
      funcionario_nome: 'Teste Forcar',
      lote_codigo: 'ENT-901',
      lote_ordem: 6,
    };

    mockQuery.mockResolvedValueOnce({
      rows: [avaliacaoRow],
      rowCount: 1,
    } as any);
    // verificar_inativacao_consecutiva -> not allowed
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          permitido: false,
          motivo: 'Tem 1 inativacao',
          total_inativacoes_consecutivas: 1,
        },
      ],
      rowCount: 1,
    } as any);

    // final status check
    mockQuery.mockResolvedValueOnce({
      rows: [{ status: 'em_andamento' }],
      rowCount: 1,
    } as any);

    // update avaliacoes -> returns rowCount 1
    mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any);

    // insert audit_logs
    mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any);

    const longReason = 'X'.repeat(60);

    const req = new Request('http://localhost/api/avaliacoes/inativar', {
      method: 'POST',
      body: JSON.stringify({
        avaliacao_id: 1011,
        motivo: longReason,
        forcar: true,
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.forcado).toBe(true);
    expect(data.success).toBe(true);
  });

  it('deve retornar 400 com mensagem amigável quando houver violação de constraint (23514)', async () => {
    mockRequireAuth.mockResolvedValue({
      cpf: '87545772920',
      perfil: 'gestor_entidade',
    } as any);

    const avaliacaoRow = {
      id: 1000,
      funcionario_cpf: '55544433323',
      lote_id: 889,
      status: 'iniciada',
      funcionario_nome: 'Teste Contratante 2',
      lote_codigo: 'ENT-002',
      lote_ordem: 3,
    };

    mockQuery.mockResolvedValueOnce({
      rows: [avaliacaoRow],
      rowCount: 1,
    } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [{ permitido: true }],
      rowCount: 1,
    } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [{ status: 'iniciada' }],
      rowCount: 1,
    } as any);

    // Simular erro do PG com code 23514 (check constraint)
    const err: any = new Error('violação de constraint');
    err.code = '23514';
    mockQuery.mockRejectedValueOnce(err);

    const req = new Request('http://localhost/api/avaliacoes/inativar', {
      method: 'POST',
      body: JSON.stringify({
        avaliacao_id: 1000,
        motivo: 'Detalhada justificativa para forçar',
        forcar: false,
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain(
      'Falha ao inativar avaliação por violação de integridade'
    );
  });
});
