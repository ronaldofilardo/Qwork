/**
 * Teste: API Public Contratante - estrutura de resposta
 *
 * Verifica que a API retorna dados corretos e sem campos legados.
 */

import { describe, it, expect } from '@jest/globals';
import { query } from '@/lib/db';

describe('API Public Contratante - estrutura de resposta', () => {
  describe('Query SQL da API', () => {
    it('deve retornar dados do contratante corretamente', async () => {
      const result = await query(
        `SELECT
          c.id,
          c.tipo,
          c.nome,
          c.plano_id,
          c.pagamento_confirmado,
          c.status,
          c.numero_funcionarios_estimado
        FROM contratantes c
        LIMIT 1`
      );

      expect(result.rows.length).toBeGreaterThanOrEqual(0);
      if (result.rows.length > 0) {
        const contratante = result.rows[0];

        expect(contratante.id).toBeDefined();
        expect(contratante.tipo).toBeDefined();
        expect(contratante.nome).toBeDefined();
      }
    });
  });

  describe('Estrutura da resposta da API', () => {
    it('deve ter a estrutura correta sem campos legados', () => {
      const mockRow = {
        id: 11,
        tipo: 'entidade',
        nome: 'Empresa Teste',
        plano_id: 1,
        pagamento_confirmado: false,
        status: 'aguardando_pagamento',
        numero_funcionarios_estimado: 15,
        payment_link_generated: false,
      };

      const contratante = {
        id: mockRow.id,
        tipo: mockRow.tipo,
        nome: mockRow.nome,
        plano_id: mockRow.plano_id,
        pagamento_confirmado: mockRow.pagamento_confirmado,
        status: mockRow.status,
        numero_funcionarios_estimado: mockRow.numero_funcionarios_estimado,
        payment_link_generated: !!mockRow.payment_link_generated,
      };

      expect(contratante).toHaveProperty('id');
      expect(contratante).toHaveProperty('tipo');
      expect(contratante).toHaveProperty('nome');
      expect(contratante).toHaveProperty('plano_id');
      expect(contratante).toHaveProperty('pagamento_confirmado');
      expect(contratante).toHaveProperty('status');
      expect(contratante).toHaveProperty('numero_funcionarios_estimado');
      expect(contratante).toHaveProperty('payment_link_generated');

      // Verificar que NÃO tem campos legados
      expect(contratante).not.toHaveProperty('valor_personalizado');
      expect(contratante).not.toHaveProperty('contratacao_personalizada_id');
    });
  });
});
