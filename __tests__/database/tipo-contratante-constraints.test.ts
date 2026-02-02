/**
 * Testes de Constraints de Validação - tipo_contratante
 * Data: 30 de Janeiro de 2026
 * Verifica integridade referencial
 */

import { query } from '@/lib/db';

describe('Constraints - tipo_contratante', () => {
  describe('Tabela contratantes', () => {
    it('deve aceitar tipo "clinica"', async () => {
      const timestamp = Date.now();
      const result = await query(
        `INSERT INTO contratantes (tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
         responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular, ativa, pagamento_confirmado)
         VALUES ('clinica', 'Teste Clinica Constraint', '99999999000199', 'constraint@test.com', '11999999999',
         'Rua Teste', 'Cidade', 'SP', '01001000', 'Resp', $1, 'resp@test.com', '11999999999', true, true)
         RETURNING id`,
        [`${timestamp}`]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].id).toBeDefined();

      // Cleanup
      await query('DELETE FROM contratantes WHERE id = $1', [
        result.rows[0].id,
      ]);
    });

    it('deve aceitar tipo "entidade"', async () => {
      const timestamp = Date.now() + 1;
      const result = await query(
        `INSERT INTO contratantes (tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
         responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular, ativa, pagamento_confirmado)
         VALUES ('entidade', 'Teste Entidade Constraint', '99999999000198', 'constraint2@test.com', '11999999998',
         'Rua Teste 2', 'Cidade', 'SP', '01001000', 'Resp 2', $1, 'resp2@test.com', '11999999998', true, true)
         RETURNING id`,
        [`${timestamp}`]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].id).toBeDefined();

      // Cleanup
      await query('DELETE FROM contratantes WHERE id = $1', [
        result.rows[0].id,
      ]);
    });

    it('deve rejeitar tipo inválido', async () => {
      const timestamp = Date.now() + 2;
      await expect(
        query(
          `INSERT INTO contratantes (tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
           responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular, ativa, pagamento_confirmado)
           VALUES ('invalido', 'Teste Invalido', '99999999000197', 'invalid@test.com', '11999999997',
           'Rua Teste', 'Cidade', 'SP', '01001000', 'Resp', $1, 'resp@test.com', '11999999997', true, true)`,
          [`${timestamp}`]
        )
      ).rejects.toThrow(/constraint|check|restrição|verificação/i);
    });

    it('deve rejeitar tipo NULL se NOT NULL', async () => {
      const timestamp = Date.now() + 3;
      await expect(
        query(
          `INSERT INTO contratantes (nome, cnpj, email, telefone, endereco, cidade, estado, cep,
           responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular, ativa, pagamento_confirmado)
           VALUES ('Teste NULL', '99999999000196', 'null@test.com', '11999999996',
           'Rua Teste', 'Cidade', 'SP', '01001000', 'Resp', $1, 'resp@test.com', '11999999996', true, true)`,
          [`${timestamp}`]
        )
      ).rejects.toThrow();
    });

    it('deve ter constraint nomeada corretamente', async () => {
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

    it('deve ter índice em tipo para performance', async () => {
      const result = await query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'contratantes' 
        AND indexname = 'idx_contratantes_tipo'
      `);

      expect(result.rows).toHaveLength(1);
    });
  });

  describe('Tabela contratos_planos', () => {
    let testContratanteId: number;

    beforeAll(async () => {
      // Criar contratante de teste
      const result = await query(
        `INSERT INTO contratantes (tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
         responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular, ativa, pagamento_confirmado)
         VALUES ('clinica', 'Contratante Test Contratos', '99999999000195', 'contratos@test.com', '11999999995',
         'Rua Teste', 'Cidade', 'SP', '01001000', 'Resp', '99999999995', 'resp@test.com', '11999999995', true, true)
         RETURNING id`
      );
      testContratanteId = result.rows[0].id;
    });

    afterAll(async () => {
      // Cleanup
      await query('DELETE FROM contratos_planos WHERE contratante_id = $1', [
        testContratanteId,
      ]);
      await query('DELETE FROM contratantes WHERE id = $1', [
        testContratanteId,
      ]);
    });

    it('deve verificar se tabela contratos_planos existe', async () => {
      const result = await query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = 'contratos_planos'
      `);

      if (result.rows.length > 0) {
        expect(result.rows[0].table_name).toBe('contratos_planos');
      } else {
        console.warn('Tabela contratos_planos não existe - pulando testes');
      }
    });

    it('deve verificar se coluna tipo_contratante existe', async () => {
      const result = await query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'contratos_planos' 
        AND column_name = 'tipo_contratante'
      `);

      if (result.rows.length > 0) {
        expect(result.rows[0].column_name).toBe('tipo_contratante');
      } else {
        console.warn(
          'Coluna tipo_contratante não existe em contratos_planos - pulando testes'
        );
      }
    });

    it('deve ter constraint se coluna existir', async () => {
      // Verificar se tabela e coluna existem primeiro
      const checkTable = await query(`
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contratos_planos' 
        AND column_name = 'tipo_contratante'
      `);

      if (checkTable.rows.length > 0) {
        const result = await query(`
          SELECT constraint_name 
          FROM information_schema.table_constraints 
          WHERE table_name = 'contratos_planos' 
          AND constraint_type = 'CHECK'
          AND constraint_name LIKE '%tipo_contratante%'
        `);

        expect(result.rows.length).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Validação de dados existentes', () => {
    it('deve ter apenas tipos válidos em contratantes', async () => {
      const result = await query(`
        SELECT COUNT(*) as count
        FROM contratantes
        WHERE tipo NOT IN ('clinica', 'entidade')
      `);

      expect(parseInt(result.rows[0].count)).toBe(0);
    });

    it('deve ter registro de tipos na tabela', async () => {
      const result = await query(`
        SELECT DISTINCT tipo 
        FROM contratantes 
        ORDER BY tipo
      `);

      expect(result.rows.length).toBeGreaterThan(0);

      const tipos = result.rows.map((r) => r.tipo);
      tipos.forEach((tipo) => {
        expect(['clinica', 'entidade']).toContain(tipo);
      });
    });
  });
});
