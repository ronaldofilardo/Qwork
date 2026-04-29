import { GET, PATCH } from '@/app/api/admin/financeiro/sociedade/route';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

jest.mock('@/lib/db');
jest.mock('@/lib/session');

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;

describe('/api/admin/financeiro/sociedade', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue({
      cpf: '00000000000',
      nome: 'Admin Teste',
      perfil: 'admin',
      mfaVerified: true,
    } as Awaited<ReturnType<typeof requireRole>>);
  });

  it('deve retornar fallback com Ronaldo e Antonio quando estruturas opcionais do banco não existirem', async () => {
    mockQuery.mockRejectedValue(new Error('relação não existe'));

    const request = new Request(
      'http://localhost:3000/api/admin/financeiro/sociedade?dias=30'
    );

    const response = await GET(request as never);
    const data = (await response.json()) as {
      success: boolean;
      persistenciaDisponivel: boolean;
      qwork: { id: string; nome: string };
      beneficiarios: Array<{ id: string; nome: string }>;
      eventosRecentes: unknown[];
    };

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.persistenciaDisponivel).toBe(false);
    expect(data.qwork).toEqual(
      expect.objectContaining({ id: 'qwork', nome: 'QWork' })
    );
    expect(data.beneficiarios).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'ronaldo', nome: 'Ronaldo' }),
        expect.objectContaining({ id: 'antonio', nome: 'Antonio' }),
      ])
    );
    expect(data.beneficiarios).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'qwork' })])
    );
    expect(data.eventosRecentes).toEqual([]);
  });

  it('deve auditar lote pago usando lotes_avaliacao como fonte de dados', async () => {
    mockQuery.mockImplementation(async (sql: string) => {
      const queryText = String(sql);

      if (queryText.includes('to_regclass')) {
        return { rows: [{ exists: true }], rowCount: 1 } as never;
      }

      if (queryText.includes('FROM lotes_avaliacao la')) {
        return {
          rows: [
            {
              id: 8,
              asaas_payment_id: 'pay_8',
              valor: '48.00',
              asaas_net_value: '45.00',
              numero_parcelas: 3,
              detalhes_parcelas: null,
              status: 'pago',
              metodo: 'credit_card',
              criado_em: '2026-04-01T10:00:00.000Z',
              data_pagamento: '2026-04-10T12:00:00.000Z',
              tomador_nome: 'Clínica 1604',
              representante_nome: 'Rep 115',
              representante_id: 5,
              valor_representante: '4.80',
              valor_comercial: '0.00',
              tipo_cobranca: 'laudo',
            },
          ],
          rowCount: 1,
        } as never;
      }

      if (queryText.includes('FROM usuarios')) {
        return { rows: [{ total: '1' }], rowCount: 1 } as never;
      }

      if (queryText.includes('FROM representantes')) {
        return {
          rows: [{ com_wallet: '1', sem_wallet: '0' }],
          rowCount: 1,
        } as never;
      }

      if (queryText.includes('FROM beneficiarios_sociedade')) {
        return { rows: [], rowCount: 0 } as never;
      }

      return { rows: [], rowCount: 0 } as never;
    });

    const request = new Request(
      'http://localhost:3000/api/admin/financeiro/sociedade?dias=30'
    );

    const response = await GET(request as never);
    const data = (await response.json()) as {
      eventosRecentes: Array<{
        tomador: string;
        valorBruto: number;
        loteId: number;
        representanteId: number | null;
      }>;
      resumo: { mes: { entradaBruta: number; totalEventos: number } };
    };

    expect(response.status).toBe(200);
    expect(data.eventosRecentes).toHaveLength(1);
    expect(data.eventosRecentes[0].tomador).toContain('Clínica 1604');
    expect(data.eventosRecentes[0].valorBruto).toBe(48);
    expect(data.eventosRecentes[0].loteId).toBe(8);
    expect(data.eventosRecentes[0].representanteId).toBe(5);
    expect(data.resumo.mes.entradaBruta).toBe(48);
    expect(data.resumo.mes.totalEventos).toBe(1);
  });

  it('deve auditar lote pago SEM representante usando pagamentos.valor como valor_laudo', async () => {
    mockQuery.mockImplementation(async (sql: string) => {
      const queryText = String(sql);

      if (queryText.includes('to_regclass')) {
        return { rows: [{ exists: true }], rowCount: 1 } as never;
      }

      if (queryText.includes('FROM lotes_avaliacao la')) {
        return {
          rows: [
            {
              id: 13,
              asaas_payment_id: 'pay_abc123',
              valor: '24.00',
              asaas_net_value: '23.04',
              numero_parcelas: 1,
              detalhes_parcelas: null,
              status: 'pago',
              metodo: 'pix',
              criado_em: '2026-04-21T10:00:00.000Z',
              data_pagamento: '2026-04-21T14:00:00.000Z',
              tomador_nome: 'Clínica pre staging',
              representante_nome: null,
              representante_id: null,
              valor_representante: '0.00',
              valor_comercial: '0.00',
              tipo_cobranca: 'laudo',
            },
          ],
          rowCount: 1,
        } as never;
      }

      if (queryText.includes('FROM representantes')) {
        return {
          rows: [{ com_wallet: '1', sem_wallet: '0' }],
          rowCount: 1,
        } as never;
      }

      if (queryText.includes('FROM beneficiarios_sociedade')) {
        return { rows: [], rowCount: 0 } as never;
      }

      return { rows: [], rowCount: 0 } as never;
    });

    const request = new Request(
      'http://localhost:3000/api/admin/financeiro/sociedade?dias=30'
    );

    const response = await GET(request as never);
    const data = (await response.json()) as {
      eventosRecentes: Array<{
        tomador: string;
        valorBruto: number;
        valorRepresentante: number;
        valorSocioRonaldo: number;
        valorSocioAntonio: number;
        representanteNome: string | null;
        loteId: number;
        representanteId: number | null;
      }>;
    };

    expect(response.status).toBe(200);
    expect(data.eventosRecentes).toHaveLength(1);
    const evento = data.eventosRecentes[0];
    expect(evento.tomador).toBe('Clínica pre staging');
    expect(evento.valorBruto).toBe(24);
    // sem representante → rep = 0
    expect(evento.valorRepresentante).toBe(0);
    expect(evento.representanteNome).toBeNull();
    expect(evento.loteId).toBe(13);
    expect(evento.representanteId).toBeNull();
    // sócios devem receber valores não-nulos (distribuição da margem)
    expect(evento.valorSocioRonaldo).toBeGreaterThan(0);
    expect(evento.valorSocioAntonio).toBeGreaterThan(0);
  });

  it('deve auditar pagamento de taxa de manutenção (tipo_cobranca=manutencao) sem rep/comercial', async () => {
    mockQuery.mockImplementation(async (sql: string) => {
      const queryText = String(sql);

      if (queryText.includes("tipo_cobranca = 'manutencao'")) {
        return {
          rows: [
            {
              id: 59,
              asaas_payment_id: 'pay_mnt_001',
              valor: '250.00',
              asaas_net_value: '244.95',
              numero_parcelas: 1,
              detalhes_parcelas: null,
              status: 'pago',
              metodo: 'boleto',
              criado_em: '2026-04-20T10:00:00.000Z',
              data_pagamento: '2026-04-20T14:00:00.000Z',
              tomador_nome: 'Entidade Teste',
              representante_nome: null,
              representante_id: null,
              valor_representante: '0.00',
              valor_comercial: '0.00',
              tipo_cobranca: 'manutencao',
            },
          ],
          rowCount: 1,
        } as never;
      }

      if (queryText.includes('FROM lotes_avaliacao la')) {
        return { rows: [], rowCount: 0 } as never;
      }

      if (queryText.includes('FROM beneficiarios_sociedade')) {
        return { rows: [], rowCount: 0 } as never;
      }

      return { rows: [], rowCount: 0 } as never;
    });

    const request = new Request(
      'http://localhost:3000/api/admin/financeiro/sociedade?dias=30'
    );

    const response = await GET(request as never);
    const data = (await response.json()) as {
      eventosRecentes: Array<{
        tomador: string;
        valorBruto: number;
        tipoCobranca: string;
        valorRepresentante: number;
        valorSocioRonaldo: number;
        valorSocioAntonio: number;
      }>;
    };

    expect(response.status).toBe(200);
    expect(data.eventosRecentes).toHaveLength(1);
    const evento = data.eventosRecentes[0];
    expect(evento.tipoCobranca).toBe('manutencao');
    expect(evento.valorBruto).toBe(250);
    expect(evento.valorRepresentante).toBe(0);
    // sócios devem receber o restante após impostos + fees
    expect(evento.valorSocioRonaldo).toBeGreaterThan(0);
    expect(evento.valorSocioAntonio).toBeGreaterThan(0);
    // sem representante, tudo vai para impostos + sócios
    const total =
      evento.valorRepresentante +
      (data.eventosRecentes[0].valorSocioRonaldo ?? 0) +
      (data.eventosRecentes[0].valorSocioAntonio ?? 0);
    expect(total).toBeGreaterThan(0);
  });

  it('deve salvar beneficiário societário quando a persistência estiver disponível', async () => {
    mockQuery.mockResolvedValue({ rows: [], rowCount: 1 } as never);

    const request = new Request(
      'http://localhost:3000/api/admin/financeiro/sociedade',
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beneficiarioId: 'qwork',
          nome: 'QWork',
          nomeEmpresarial: 'QWork Plataforma',
          documentoFiscal: '00.000.000/0001-00',
          walletId: 'wallet-qwork-123',
          percentualParticipacao: 0,
          ativo: true,
          observacoes:
            'Wallet institucional da plataforma para recolhimento de impostos e operação do split.',
        }),
      }
    );

    const response = await PATCH(request as never);
    const data = (await response.json()) as {
      success: boolean;
      persisted: boolean;
      beneficiario: { walletId: string; beneficiarioId: string };
    };

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.persisted).toBe(true);
    expect(data.beneficiario.beneficiarioId).toBe('qwork');
    expect(data.beneficiario.walletId).toBe('wallet-qwork-123');
    expect(mockQuery).toHaveBeenCalled();
  });
});
