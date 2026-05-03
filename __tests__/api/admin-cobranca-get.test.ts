import { query } from '@/lib/db';
import { createTestContratante } from '../helpers/test-data-factory';

// Mockar requireRole para testes (autorizar como admin)
jest.mock('@/lib/session', () => ({
  requireRole: jest.fn(() =>
    Promise.resolve({ cpf: '00000000000', perfil: 'admin' })
  ),
}));

describe('GET /api/admin/cobranca - fallback to pagamento.valor', () => {
  let contratanteId: number;
  let pagamentoId: number;
  const cnpj = '99999999000101';

  beforeAll(async () => {
    contratanteId = await createTestContratante({
      tipo: 'clinica',
      cnpj,
      nome: 'Teste Cobrança Fallback',
      email: `cobranca-get-${Date.now()}@example.com`,
    });

    const detalhes = [
      {
        numero: 1,
        valor: 360,
        data_vencimento: '2025-12-30',
        pago: true,
        data_pagamento: '2026-01-01',
      },
      { numero: 2, valor: 360, data_vencimento: '2026-01-30', pago: false },
      { numero: 3, valor: 360, data_vencimento: '2026-02-27', pago: false },
      { numero: 4, valor: 360, data_vencimento: '2026-03-30', pago: false },
      { numero: 5, valor: 360, data_vencimento: '2026-04-29', pago: false },
    ];

    pagamentoId = await query(
      `INSERT INTO pagamentos (contratante_id, valor, numero_parcelas, detalhes_parcelas, status, data_pagamento)
       VALUES ($1, $2, $3, $4, 'pago', NOW())
       RETURNING id`,
      [contratanteId, '1800.00', 5, JSON.stringify(detalhes)]
    ).then((r) => r.rows[0].id);
  });

  afterAll(async () => {
    await query('DELETE FROM pagamentos WHERE id = $1', [pagamentoId]);
    await query('DELETE FROM contratantes WHERE id = $1', [contratanteId]);
  });

  it('retorna valor_pago igual ao pagamento registrado quando cp.valor_pago é nulo', async () => {
    const { GET } = await import('@/app/api/admin/cobranca/route');

    const resp = await GET(
      new Request(`http://localhost/api/admin/cobranca?cnpj=${cnpj}`)
    );
    const data = await resp.json();
    console.log('Cobranca API response:', data);

    expect(data.success).toBe(true);
    const found = data.contratos.find(
      (c: any) => c.cnpj.replace(/\D/g, '') === cnpj
    );
    expect(found).toBeDefined();
    // O valor deve ser o do pagamento (1800)
    expect(Number(found.valor_pago)).toBeCloseTo(1800);
  });
});
