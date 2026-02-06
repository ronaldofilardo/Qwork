/**
 * Teste: Forçar troca de senha no primeiro login
 *
 * Nova Arquitetura:
 * - Gestores: senha em `entidades_senhas` (entidade_id + cpf)
 * - RH: senha em `clinicas_senhas` (clinica_id + cpf)
 * - Ambas tabelas devem ter coluna `primeira_senha_alterada BOOLEAN DEFAULT false`
 */

import { query } from '@/lib/db';

describe('Forçar troca de senha no primeiro login (Nova Arquitetura)', () => {
  describe('Tabela entidades_senhas (Gestores)', () => {
    it('deve ter coluna primeira_senha_alterada com default false', async () => {
      const result = await query(`
        SELECT column_name, column_default, is_nullable, data_type
        FROM information_schema.columns
        WHERE table_name = 'entidades_senhas'
        AND column_name = 'primeira_senha_alterada'
      `);

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].data_type).toBe('boolean');
      expect(result.rows[0].column_default).toContain('false');
    });

    it('deve permitir consultar flag de primeira senha', async () => {
      const result = await query(`
        SELECT primeira_senha_alterada
        FROM entidades_senhas
        LIMIT 1
      `);

      // Não precisa ter registros, só garantir que a coluna existe
      expect(result.rows).toBeDefined();
    });
  });

  describe('Tabela clinicas_senhas (RH)', () => {
    it('deve ter coluna primeira_senha_alterada com default false', async () => {
      const result = await query(`
        SELECT column_name, column_default, is_nullable, data_type
        FROM information_schema.columns
        WHERE table_name = 'clinicas_senhas'
        AND column_name = 'primeira_senha_alterada'
      `);

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].data_type).toBe('boolean');
      expect(result.rows[0].column_default).toContain('false');
    });

    it('deve permitir consultar flag de primeira senha', async () => {
      const result = await query(`
        SELECT primeira_senha_alterada
        FROM clinicas_senhas
        LIMIT 1
      `);

      // Não precisa ter registros, só garantir que a coluna existe
      expect(result.rows).toBeDefined();
    });
  });

  describe('Comportamento Esperado (Especificação)', () => {
    it.skip('login de gestor deve redirecionar para /trocar-senha quando primeira_senha_alterada=false', () => {
      /**
       * Especificação (a ser implementada):
       * - Quando registro em entidades_senhas tiver `primeira_senha_alterada = false`,
       *   API de login deve retornar `redirectTo: '/trocar-senha'` ao invés de '/entidade'
       * - Após troca bem sucedida, flag deve ser atualizada para true
       */
    });

    it.skip('login de RH deve redirecionar para /trocar-senha quando primeira_senha_alterada=false', () => {
      /**
       * Especificação (a ser implementada):
       * - Quando registro em clinicas_senhas tiver `primeira_senha_alterada = false`,
       *   API de login deve retornar `redirectTo: '/trocar-senha'` ao invés de '/rh'
       * - Após troca bem sucedida, flag deve ser atualizada para true
       */
    });
  });
});
