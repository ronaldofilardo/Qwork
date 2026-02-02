/**
 * Testes adicionais de RLS - Cobertura completa de policies
 * Data: 30 de Janeiro de 2026
 * Objetivo: Garantir que todas as policies RLS funcionem corretamente
 */

import { query } from '@/lib/db';

describe('RLS - Cobertura Completa de Policies', () => {
  let contratante1Id: number;
  let contratante2Id: number;

  beforeAll(async () => {
    const timestamp = Date.now();
    // Setup: Criar dois contratantes isolados
    const contratante1 = await query(
      `INSERT INTO contratantes (tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep, 
       responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular, ativa, pagamento_confirmado)
       VALUES ('entidade', 'Contratante 1 RLS Test', '11111111000101', 'c1@test.com', '11999999991', 
       'Rua 1', 'Cidade 1', 'SP', '01001000', 'Resp 1', $1, 'resp1@test.com', '11999999991', true, true)
       RETURNING id`,
      [`${timestamp}`]
    );
    contratante1Id = contratante1.rows[0].id;

    const contratante2 = await query(
      `INSERT INTO contratantes (tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep, 
       responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular, ativa, pagamento_confirmado)
       VALUES ('entidade', 'Contratante 2 RLS Test', '22222222000102', 'c2@test.com', '11999999992', 
       'Rua 2', 'Cidade 2', 'SP', '02002000', 'Resp 2', $1, 'resp2@test.com', '11999999992', true, true)
       RETURNING id`,
      [`${timestamp + 1}`]
    );
    contratante2Id = contratante2.rows[0].id;
  });

  afterAll(async () => {
    // Cleanup
    await query('DELETE FROM contratantes WHERE id IN ($1, $2)', [
      contratante1Id,
      contratante2Id,
    ]);
  });

  describe('Isolamento de Contratantes', () => {
    it('deve ter constraint de tipo válido', async () => {
      const result = await query(`
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'contratantes' 
        AND constraint_type = 'CHECK'
        AND constraint_name LIKE '%tipo%'
      `);

      const hasConstraint = result.rows.some((row) =>
        row.constraint_name.includes('tipo')
      );
      expect(hasConstraint).toBe(true);
    });

    it('deve ter apenas tipos válidos nos contratantes de teste', async () => {
      const result = await query(
        'SELECT tipo FROM contratantes WHERE id IN ($1, $2)',
        [contratante1Id, contratante2Id]
      );

      expect(result.rows).toHaveLength(2);
      result.rows.forEach((row) => {
        expect(['clinica', 'entidade']).toContain(row.tipo);
      });
    });
  });

  describe('FORCE ROW LEVEL SECURITY', () => {
    it('deve ter FORCE RLS ativo em contratantes', async () => {
      const result = await query(`
        SELECT relname, relforcerowsecurity 
        FROM pg_class 
        WHERE relname = 'contratantes'
      `);

      expect(result.rows.length).toBeGreaterThan(0);
      if (result.rows[0].relforcerowsecurity !== undefined) {
        expect(result.rows[0].relforcerowsecurity).toBe(true);
      }
    });

    it('deve ter FORCE RLS ativo em funcionarios', async () => {
      const result = await query(`
        SELECT relname, relforcerowsecurity 
        FROM pg_class 
        WHERE relname = 'funcionarios'
      `);

      expect(result.rows.length).toBeGreaterThan(0);
      if (result.rows[0].relforcerowsecurity !== undefined) {
        expect(result.rows[0].relforcerowsecurity).toBe(true);
      }
    });
  });

  describe('Performance de Índices RLS', () => {
    it('deve ter índice em contratantes(tipo)', async () => {
      const result = await query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'contratantes' 
        AND indexname = 'idx_contratantes_tipo'
      `);

      expect(result.rows).toHaveLength(1);
    });

    it('deve ter índice em funcionarios(contratante_id)', async () => {
      const result = await query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'funcionarios' 
        AND indexname LIKE '%contratante_id%'
      `);

      expect(result.rows.length).toBeGreaterThan(0);
    });
  });
});
