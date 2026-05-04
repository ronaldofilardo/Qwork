import { query } from '@/lib/db/query';

describe('lib/db/query - Query Execution', () => {
  describe('Basic Query Operations', () => {
    it('deve executar query simples SELECT com sucesso', async () => {
      const result = await query('SELECT 1 as value');
      expect(result.rows).toBeDefined();
      expect(result.rows[0].value).toBe(1);
    });

    it('deve executar query com parâmetros interpolados', async () => {
      const result = await query(
        'SELECT $1::integer as num',
        [42]
      );
      expect(result.rows[0].num).toBe(42);
    });

    it('deve retornar rowCount correto', async () => {
      const result = await query('SELECT 1 as value');
      expect(result.rowCount).toBe(1);
    });
  });

  describe('Query with Session Parameter', () => {
    it('deve aceitar session como terceiro parâmetro', async () => {
      const session = {
        cpf: '53051173991',
        nome: 'TEST EMISSOR',
        perfil: 'emissor' as const,
      };

      const result = await query(
        'SELECT COUNT(*) as cnt FROM lotes_avaliacao',
        [],
        session
      );

      expect(result.rows).toBeDefined();
      expect(result.rowCount).toBeGreaterThan(0);
    });

    it('deve retornar dados válidos para query com session admin', async () => {
      const session = {
        cpf: '53051173991',
        nome: 'TEST ADMIN',
        perfil: 'admin' as const,
      };

      const result = await query(
        'SELECT 1 as check',
        [],
        session
      );

      expect(result.rows[0].check).toBe(1);
    });

    it('deve suportar session com todas as propriedades requeridas', async () => {
      const session = {
        cpf: '53051173991',
        nome: 'TEST USER',
        perfil: 'emissor' as const,
        clinica_id: null,
        entidade_id: 123,
      };

      const result = await query(
        'SELECT 2 as value',
        [],
        session
      );

      expect(result.rows[0].value).toBe(2);
    });
  });

  describe('Complex Queries', () => {
    it('deve executar query com múltiplas linhas', async () => {
      const result = await query(`
        SELECT 1 as id UNION ALL
        SELECT 2 as id UNION ALL
        SELECT 3 as id
      `);

      expect(result.rows).toBeDefined();
      expect(result.rows.length).toBe(3);
      expect(result.rowCount).toBe(3);
    });

    it('deve executar query que retorna múltiplas colunas', async () => {
      const result = await query(`
        SELECT 
          'test' as name,
          42 as value,
          true as active
        LIMIT 1
      `);

      expect(result.rows[0]).toHaveProperty('name');
      expect(result.rows[0]).toHaveProperty('value');
      expect(result.rows[0]).toHaveProperty('active');
    });
  });

  describe('lib/db Re-export Validation', () => {
    it('query função deve estar acessível via lib/db', async () => {
      // Valida que a re-exportação funcionou
      const dbModule = require('@/lib/db');
      
      expect(dbModule.query).toBeDefined();
      expect(typeof dbModule.query).toBe('function');
    });

    it('query re-exportada deve ser a mesma de lib/db/query', async () => {
      const dbModule = require('@/lib/db');
      const queryFromDb = dbModule.query;
      
      // Validar que ambas funcionam igualmente
      const result = await queryFromDb('SELECT 99 as test');
      expect(result.rows[0].test).toBe(99);
    });
  });
});



