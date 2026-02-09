import { GET as gerarReciboGET } from '@/app/api/recibo/gerar/route';
import { NextRequest } from 'next/server';
import { query } from '@/lib/db';

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

describe('GET /api/recibo/gerar', () => {
  beforeEach(() => jest.resetAllMocks());

  it('deve retornar valor_parcela calculado para recibo de parcela', async () => {
    const mockRecibo = {
      id: 8,
      numero_recibo: 'REC-20251231-0001',
      vigencia_inicio: '2025-12-27',
      vigencia_fim: '2026-12-26',
      numero_funcionarios_cobertos: 15,
      valor_total_anual: '300.00',
      valor_por_funcionario: '20.00',
      forma_pagamento: 'parcelado',
      numero_parcelas: 3,
      parcela_numero: 1,
      tipo_recibo: 'parcela',
      descricao_pagamento:
        'Recibo de quitação da 1ª parcela no valor de R$ 100,00 (via cartao)',
      criado_em: '2025-12-31T11:36:34.003Z',
      tomador_nome: 'RELEGERE',
      tomador_cnpj: '02494916000170',
      pagamento_metodo: 'cartao',
      data_pagamento: '2025-12-27T12:58:11.202Z',
      pagamento_status: 'pago',
      // valor_parcela intentionally omitted to test computed behavior
    } as any;

    // First call tries numeric parse (returns none), second call uses numero_recibo
    (query as jest.Mock)
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [mockRecibo] });

    const url = new URL(
      'http://localhost/api/recibo/gerar?id=REC-20251231-0001'
    );
    const request = new NextRequest(url);

    const response = await gerarReciboGET(request as any);
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.recibo).toBeDefined();
    // valor_parcela deve estar presente e igual a 100 (300 / 3)
    expect(body.recibo.valor_parcela).toBeCloseTo(100);
  });
});
