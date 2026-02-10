/**
 * @fileoverview Testes para API de cobrança administrativa - fallback de valores
 * @description Valida que a API GET /api/admin/cobranca retorna corretamente
 * o valor_pago do pagamento registrado quando cp.valor_pago é nulo
 */

import type { Response } from '@/types/api';
import type { CobrancaData } from '@/types/cobranca';
import { query } from '@/lib/db';
import { createTesttomador } from '../helpers/test-data-factory';

// Mockar requireRole para testes (autorizar como admin)
jest.mock('@/lib/session', () => ({
  requireRole: jest.fn(() =>
    Promise.resolve({ cpf: '00000000000', perfil: 'admin' })
  ) as jest.MockedFunction<() => Promise<{ cpf: string; perfil: string }>>,
}));

/**
 * @test Suite de testes para GET /api/admin/cobranca
 * @description Verifica o comportamento de fallback quando cp.valor_pago é nulo
 */
describe('GET /api/admin/cobranca - fallback to pagamento.valor', () => {
  let tomadorId: number;
  let pagamentoId: number;
  const cnpj = `${Date.now().toString().slice(-11)}`;

  beforeAll(async () => {
    // Limpar dados de testes anteriores com este CNPJ
    await query(
      'DELETE FROM pagamentos WHERE clinica_id IN (SELECT id FROM clinicas WHERE cnpj = $1)',
      [cnpj]
    );
    await query('DELETE FROM clinicas WHERE cnpj = $1', [cnpj]);

    tomadorId = await createTesttomador({
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
      `INSERT INTO pagamentos (clinica_id, valor, numero_parcelas, detalhes_parcelas, status, data_pagamento)
       VALUES ($1, $2, $3, $4, 'pago', NOW())
       RETURNING id`,
      [tomadorId, '1800.00', 5, JSON.stringify(detalhes)]
    ).then((r) => r.rows[0].id);
  });

  afterAll(async () => {
    // Cleanup - remover dados de teste
    await query('DELETE FROM pagamentos WHERE id = $1', [pagamentoId]);
    await query('DELETE FROM clinicas WHERE id = $1', [tomadorId]);
  });

  /**
   * @test Valida fallback de valor_pago quando cp.valor_pago é nulo
   * @description Quando cp.valor_pago é nulo, a API deve retornar o valor
   * do registro pagamentos.valor (1800.00 no teste)
   */
  it('retorna valor_pago igual ao pagamento registrado quando cp.valor_pago é nulo', async () => {
    // Arrange - Importar rota
    const { GET } = await import('@/app/api/admin/cobranca/route');

    // Act - Chamar API
    const resp = await GET(
      new Request(`http://localhost/api/admin/cobranca?cnpj=${cnpj}`)
    );
    const data: Response<{ contratos: CobrancaData[] }> = await resp.json();

    // Assert - Validar resposta
    expect(data.success).toBe(true, 'API deve retornar success=true');
    const found = data.contratos.find(
      (c: CobrancaData) => c.cnpj.replace(/\D/g, '') === cnpj
    );
    expect(found).toBeDefined();
    expect(Number(found?.valor_pago)).toBeCloseTo(
      1800,
      2,
      'Valor deve ser o do pagamento (1800.00)'
    );
  });
});
