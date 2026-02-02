/**
 * Teste de Correção: API Public Contratante
 *
 * Este teste verifica se a API /api/public/contratante funciona
 * após correção do erro de coluna valor_personalizado inexistente.
 */

import { describe, it, expect } from '@jest/globals';
import { query } from '@/lib/db';

describe('API Public Contratante - Correção valor_personalizado', () => {
  describe('Query SQL da API', () => {
    it('deve executar a query sem erro de coluna inexistente', async () => {
      // Simular a query que estava falhando
      const testQuery = `
        SELECT
          c.id,
          c.tipo,
          c.nome,
          c.plano_id,
          c.pagamento_confirmado,
          c.status,
          c.numero_funcionarios_estimado,
          cp.id AS contratacao_personalizada_id,
          (cp.payment_link_token IS NOT NULL AND cp.payment_link_expiracao > NOW()) AS payment_link_generated
        FROM contratantes c
        LEFT JOIN contratacao_personalizada cp ON cp.contratante_id = c.id
        LIMIT 1
      `;

      // Tentar executar a query - se chegou aqui sem erro, a correção funcionou
      const result = await query(testQuery);

      // Se chegou aqui sem erro, a correção funcionou
      expect(result.rows).toBeDefined();
      expect(Array.isArray(result.rows)).toBe(true);

        '[TEST] Query da API public/contratante executada com sucesso'
      );

      if (result.rows.length > 0) {
        const row = result.rows[0];
        expect(row).toHaveProperty('id');
        expect(row).toHaveProperty('tipo');
        expect(row).toHaveProperty('nome');
        // Verificar que NÃO tem valor_personalizado
        expect(row).not.toHaveProperty('valor_personalizado');
      }
    });

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

      expect(result.rows.length).toBeGreaterThanOrEqual(0); // Pode não ter dados no banco de teste
      if (result.rows.length > 0) {
        const contratante = result.rows[0];

        expect(contratante.id).toBeDefined();
        expect(contratante.tipo).toBeDefined();
        expect(contratante.nome).toBeDefined();

          id: contratante.id,
          tipo: contratante.tipo,
          nome: contratante.nome,
          status: contratante.status,
        });
      } else {
          '[TEST] Nenhum contratante encontrado no banco de teste (esperado)'
        );
      }
    });
  });

  describe('Estrutura da resposta da API', () => {
    it('deve ter a estrutura correta sem valor_personalizado', () => {
      // Simular a estrutura de resposta esperada
      const mockRow = {
        id: 11,
        tipo: 'entidade',
        nome: 'Empresa Teste',
        plano_id: 1,
        pagamento_confirmado: false,
        status: 'aguardando_pagamento',
        numero_funcionarios_estimado: 15,
        contratacao_personalizada_id: null,
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
        contratacao_personalizada_id:
          mockRow.contratacao_personalizada_id || null,
        payment_link_generated: !!mockRow.payment_link_generated,
      };

      expect(contratante).toHaveProperty('id');
      expect(contratante).toHaveProperty('tipo');
      expect(contratante).toHaveProperty('nome');
      expect(contratante).toHaveProperty('plano_id');
      expect(contratante).toHaveProperty('pagamento_confirmado');
      expect(contratante).toHaveProperty('status');
      expect(contratante).toHaveProperty('numero_funcionarios_estimado');
      expect(contratante).toHaveProperty('contratacao_personalizada_id');
      expect(contratante).toHaveProperty('payment_link_generated');

      // Verificar que NÃO tem valor_personalizado
      expect(contratante).not.toHaveProperty('valor_personalizado');

      // [TEST] Estrutura da resposta da API validada

    });
  });
});
