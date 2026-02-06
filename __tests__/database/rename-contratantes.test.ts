/**
 * Testes de validação para Migration 420
 * Garante que rename de contratantes → entidades foi feito corretamente
 */

import { query } from '@/lib/db';

describe('Migration 420: Rename contratantes → entidades', () => {
  beforeAll(async () => {
    // Definir contexto de sessão
    await query(
      "SELECT set_config('app.current_user_cpf', '00000000000', false)"
    );
    await query("SELECT set_config('app.current_user_perfil', 'admin', false)");
  });

  describe('Rename de Tabelas', () => {
    it('tabela "entidades" deve existir', async () => {
      const result = await query(`
        SELECT tablename
        FROM pg_tables
        WHERE tablename = 'entidades'
        AND schemaname = 'public'
      `);

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].tablename).toBe('entidades');
    });

    it('tabela "entidades_senhas" deve existir', async () => {
      const result = await query(`
        SELECT tablename
        FROM pg_tables
        WHERE tablename = 'entidades_senhas'
        AND schemaname = 'public'
      `);

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].tablename).toBe('entidades_senhas');
    });

    it('tabela "contratantes" NÃO deve existir', async () => {
      const result = await query(`
        SELECT tablename
        FROM pg_tables
        WHERE tablename = 'contratantes'
        AND schemaname = 'public'
      `);

      expect(result.rows.length).toBe(0);
    });

    it('tabela "entidades_senhas" NÃO deve existir', async () => {
      const result = await query(`
        SELECT tablename
        FROM pg_tables
        WHERE tablename = 'entidades_senhas'
        AND schemaname = 'public'
      `);

      expect(result.rows.length).toBe(0);
    });
  });

  describe('Rename de Colunas', () => {
    it('usuarios deve ter coluna "entidade_id" (não contratante_id)', async () => {
      const result = await query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'usuarios'
        AND column_name IN ('entidade_id', 'contratante_id')
      `);

      const columnNames = result.rows.map((r) => r.column_name);
      expect(columnNames).toContain('entidade_id');
      expect(columnNames).not.toContain('contratante_id');
    });

    it('clinicas deve ter coluna "entidade_id" (não contratante_id)', async () => {
      const result = await query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'clinicas'
        AND column_name IN ('entidade_id', 'contratante_id')
      `);

      const columnNames = result.rows.map((r) => r.column_name);
      expect(columnNames).toContain('entidade_id');
      expect(columnNames).not.toContain('contratante_id');
    });

    it('entidades_senhas deve ter coluna "entidade_id" (não contratante_id)', async () => {
      const result = await query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'entidades_senhas'
        AND column_name IN ('entidade_id', 'contratante_id')
      `);

      const columnNames = result.rows.map((r) => r.column_name);
      expect(columnNames).toContain('entidade_id');
      expect(columnNames).not.toContain('contratante_id');
    });
  });

  describe('Foreign Keys', () => {
    it('usuarios.entidade_id deve ter FK para entidades(id)', async () => {
      const result = await query(`
        SELECT
          tc.constraint_name,
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'usuarios'
        AND kcu.column_name = 'entidade_id'
      `);

      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows[0].foreign_table_name).toBe('entidades');
      expect(result.rows[0].foreign_column_name).toBe('id');
    });

    it('clinicas.entidade_id deve ter FK para entidades(id)', async () => {
      const result = await query(`
        SELECT
          tc.constraint_name,
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'clinicas'
        AND kcu.column_name = 'entidade_id'
      `);

      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows[0].foreign_table_name).toBe('entidades');
      expect(result.rows[0].foreign_column_name).toBe('id');
    });

    it('NÃO deve existir FKs referenciando "contratantes"', async () => {
      const result = await query(`
        SELECT
          tc.constraint_name,
          tc.table_name,
          ccu.table_name AS foreign_table_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'contratantes'
      `);

      expect(result.rows.length).toBe(0);
    });
  });

  describe('Sequences', () => {
    it('sequence "entidades_id_seq" deve existir', async () => {
      const result = await query(`
        SELECT sequencename
        FROM pg_sequences
        WHERE sequencename = 'entidades_id_seq'
      `);

      expect(result.rows.length).toBe(1);
    });

    it('sequence "entidades_senhas_id_seq" deve existir', async () => {
      const result = await query(`
        SELECT sequencename
        FROM pg_sequences
        WHERE sequencename = 'entidades_senhas_id_seq'
      `);

      expect(result.rows.length).toBe(1);
    });

    it('sequences antigas "contratantes_*" NÃO devem existir', async () => {
      const result = await query(`
        SELECT sequencename
        FROM pg_sequences
        WHERE sequencename LIKE 'contratantes_%'
      `);

      expect(result.rows.length).toBe(0);
    });
  });

  describe('Índices', () => {
    it('índices devem usar nomenclatura "entidade" (não "contratante")', async () => {
      const result = await query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename IN ('usuarios', 'clinicas', 'entidades_senhas')
        AND indexname LIKE '%contratante%'
      `);

      expect(result.rows.length).toBe(0);
    });

    it('deve ter índice em usuarios(entidade_id)', async () => {
      const result = await query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'usuarios'
        AND indexname LIKE '%entidade_id%'
      `);

      expect(result.rows.length).toBeGreaterThan(0);
    });

    it('deve ter índice em clinicas(entidade_id)', async () => {
      const result = await query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'clinicas'
        AND indexname LIKE '%entidade_id%'
      `);

      expect(result.rows.length).toBeGreaterThan(0);
    });
  });

  describe('Documentação e Comentários', () => {
    it('tabela entidades deve ter comentário explicativo', async () => {
      const result = await query(`
        SELECT
          pg_catalog.obj_description(c.oid, 'pg_class') AS description
        FROM pg_class c
        WHERE c.relname = 'entidades'
        AND c.relkind = 'r'
      `);

      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows[0].description).toBeTruthy();
      expect(result.rows[0].description).toMatch(
        /Migration 420|entidades|contratantes/i
      );
    });

    it('tabela entidades_senhas deve ter comentário explicativo', async () => {
      const result = await query(`
        SELECT
          pg_catalog.obj_description(c.oid, 'pg_class') AS description
        FROM pg_class c
        WHERE c.relname = 'entidades_senhas'
        AND c.relkind = 'r'
      `);

      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows[0].description).toBeTruthy();
      expect(result.rows[0].description).toMatch(
        /Migration 420|entidades_senhas|entidades_senhas/i
      );
    });
  });

  describe('Operações CRUD Básicas', () => {
    const testCpf = `99999${Date.now().toString().slice(-6)}`;
    let entidadeId: number;

    it('deve permitir INSERT em entidades', async () => {
      const result = await query(
        `
        INSERT INTO entidades (
          tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
          responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular,
          status, ativa, criado_em, atualizado_em
        )
        VALUES (
          'entidade', 'Entidade Teste', $1, 'test@test.com', '11999999999',
          'Rua Teste', 'São Paulo', 'SP', '01000000',
          'Responsável Teste', $2, 'resp@test.com', '11999999999',
          'ativo', true, NOW(), NOW()
        )
        RETURNING id
      `,
        [testCpf, testCpf]
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].id).toBeTruthy();
      entidadeId = result.rows[0].id;
    });

    it('deve permitir SELECT em entidades', async () => {
      const result = await query(
        `
        SELECT id, nome, tipo
        FROM entidades
        WHERE id = $1
      `,
        [entidadeId]
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].nome).toBe('Entidade Teste');
      expect(result.rows[0].tipo).toBe('entidade');
    });

    it('deve permitir INSERT em entidades_senhas', async () => {
      const result = await query(
        `
        INSERT INTO entidades_senhas (entidade_id, cpf, senha_hash, primeira_senha_alterada, criado_em, atualizado_em)
        VALUES ($1, $2, $3, false, NOW(), NOW())
        RETURNING id
      `,
        [entidadeId, testCpf, 'hash_test']
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].id).toBeTruthy();
    });

    afterAll(async () => {
      // Cleanup
      await query('DELETE FROM entidades_senhas WHERE entidade_id = $1', [
        entidadeId,
      ]);
      await query('DELETE FROM entidades WHERE id = $1', [entidadeId]);
    });
  });
});
