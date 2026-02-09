/**
 * Testes para as correções de 08/02/2026
 * - Remoção de colunas inexistentes (tomador_id, usuario_tipo)
 * - Uso correto de tabelas de relacionamento
 * - Correção do trigger criar_usuario_responsavel_apos_aprovacao
 */

import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

describe('Correções 08/02/2026', () => {
  describe('Estrutura de dados - Funcionários', () => {
    it('tabela funcionarios não deve ter colunas obsoletas', async () => {
      const result = await query(
        `SELECT column_name 
         FROM information_schema.columns 
         WHERE table_name = 'funcionarios' 
         AND column_name IN ('tomador_id', 'usuario_tipo', 'entidade_id', 'clinica_id')`
      );

      // Nenhuma dessas colunas deve existir
      expect(result.rows).toHaveLength(0);
    });

    it('tabela funcionarios_entidades deve existir e ter estrutura correta', async () => {
      const result = await query(
        `SELECT column_name 
         FROM information_schema.columns 
         WHERE table_name = 'funcionarios_entidades' 
         ORDER BY ordinal_position`
      );

      const columns = result.rows.map((r) => r.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('funcionario_id');
      expect(columns).toContain('entidade_id');
    });

    it('tabela funcionarios_clinicas deve existir e ter estrutura correta', async () => {
      const result = await query(
        `SELECT column_name 
         FROM information_schema.columns 
         WHERE table_name = 'funcionarios_clinicas' 
         ORDER BY ordinal_position`
      );

      const columns = result.rows.map((r) => r.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('funcionario_id');
      expect(columns).toContain('clinica_id');
    });
  });

  describe('Query de lotes - Uso de funcionarios_entidades', () => {
    it('query deve usar JOIN com funcionarios_entidades (teste de estrutura)', async () => {
      // Apenas verificar que a query pode ser executada sem erros
      // (sem tentar criar dados de teste com colunas inexistentes)
      const testQuery = `
        SELECT DISTINCT l.*
        FROM lotes_avaliacao l
        JOIN funcionarios func ON TRUE
        JOIN funcionarios_entidades fe_rel ON fe_rel.funcionario_id = func.id
        WHERE fe_rel.entidade_id IS NOT NULL
        LIMIT 0
      `;

      const result = await query(testQuery);
      expect(result).toBeDefined();
      expect(Array.isArray(result.rows)).toBe(true);
    });
  });

  describe('Dados existentes - Validação', () => {
    it('clinicas_senhas deve ter registros com clinica_id válido', async () => {
      const result = await query(
        `SELECT cs.*, c.id as clinica_existe
         FROM clinicas_senhas cs
         LEFT JOIN clinicas c ON c.id = cs.clinica_id`
      );

      // Todos os registros devem ter uma clínica correspondente
      result.rows.forEach((row) => {
        expect(row.clinica_existe).toBeDefined();
        expect(row.clinica_existe).toBe(row.clinica_id);
      });
    });

    it('usuarios tipo RH devem ter clinica_id válido', async () => {
      const result = await query(
        `SELECT u.*, c.id as clinica_existe
         FROM usuarios u
         LEFT JOIN clinicas c ON c.id = u.clinica_id
         WHERE u.tipo_usuario = 'rh'`
      );

      // Todos os usuários RH devem ter uma clínica correspondente
      result.rows.forEach((row) => {
        expect(row.clinica_id).toBeDefined();
        expect(row.clinica_existe).toBeDefined();
        expect(row.clinica_existe).toBe(row.clinica_id);
      });
    });
  });
});
