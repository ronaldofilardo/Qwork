/**
 * Testes de Refatoração de Gestores - Conversa 01/02/2026
 *
 * Valida as correções críticas implementadas:
 * 1. queryAsGestor configura variáveis de sessão para auditoria
 * 2. FK liberado_por referencia entidades_senhas (não funcionarios)
 * 3. Endpoints de gestores usam queryAsGestor (não query direto)
 * 4. Gestores NÃO estão em funcionarios
 */

import { query } from '@/lib/db';
import { queryAsGestor } from '@/lib/db-gestor';
import { getSession, setSession } from '@/lib/session';

// Mock do db.ts
jest.mock('@/lib/db', () => {
  const actualDb = jest.requireActual('@/lib/db');
  return {
    ...actualDb,
    query: jest.fn(actualDb.query),
  };
});

const mockQuery = query as jest.MockedFunction<typeof query>;

describe('Refatoração de Gestores - Correções Críticas', () => {
  const TEST_CPF_GESTOR = '87545772920';
  const TEST_tomador_ID = 2;

  beforeAll(async () => {
    // Garantir que gestor existe em entidades_senhas
    const gestorExists = await query(
      'SELECT cpf FROM entidades_senhas WHERE cpf = $1',
      [TEST_CPF_GESTOR]
    );

    if (gestorExists.rowCount === 0) {
      throw new Error(
        `Gestor ${TEST_CPF_GESTOR} não existe em entidades_senhas. Execute migrations antes dos testes.`
      );
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Limpar sessão após cada teste
    setSession(null);
  });

  describe('1. queryAsGestor - Configuração de Variáveis de Sessão', () => {
    it('deve configurar app.current_user_cpf antes da query', async () => {
      setSession({
        cpf: TEST_CPF_GESTOR,
        perfil: 'gestor',
        tomador_id: TEST_tomador_ID,
      });

      mockQuery.mockImplementation(async (sql: string) => {
        // Verificar se set_config foi chamado
        if (sql.includes('set_config')) {
          return { rows: [], rowCount: 0 } as any;
        }
        // Simular query real
        return { rows: [{ count: 1 }], rowCount: 1 } as any;
      });

      await queryAsGestor('SELECT COUNT(*) FROM tomadors WHERE id = $1', [
        TEST_tomador_ID,
      ]);

      // Verificar que set_config foi chamado para app.current_user_cpf
      const setConfigCalls = mockQuery.mock.calls.filter((call) =>
        call[0].includes('set_config')
      );

      expect(setConfigCalls.length).toBeGreaterThanOrEqual(2); // cpf + perfil

      const cpfSetConfig = setConfigCalls.find((call) =>
        call[1]?.includes('app.current_user_cpf')
      );
      expect(cpfSetConfig).toBeDefined();
      expect(cpfSetConfig[1]).toContain(TEST_CPF_GESTOR);
    });

    it('deve configurar app.current_user_perfil antes da query', async () => {
      setSession({
        cpf: TEST_CPF_GESTOR,
        perfil: 'gestor',
        tomador_id: TEST_tomador_ID,
      });

      mockQuery.mockImplementation(async (sql: string) => {
        if (sql.includes('set_config')) {
          return { rows: [], rowCount: 0 } as any;
        }
        return { rows: [], rowCount: 0 } as any;
      });

      await queryAsGestor('SELECT 1');

      const setConfigCalls = mockQuery.mock.calls.filter((call) =>
        call[0].includes('set_config')
      );

      const perfilSetConfig = setConfigCalls.find((call) =>
        call[1]?.includes('app.current_user_perfil')
      );
      expect(perfilSetConfig).toBeDefined();
      expect(perfilSetConfig[1]).toContain('gestor');
    });

    it('deve lançar erro se sessão não existir', async () => {
      setSession(null);

      await expect(queryAsGestor('SELECT 1')).rejects.toThrow(
        'queryAsGestor requer sessão autenticada'
      );
    });

    it('deve lançar erro se perfil não for gestor', async () => {
      setSession({
        cpf: '12345678901',
        perfil: 'funcionario',
        tomador_id: null,
      });

      await expect(queryAsGestor('SELECT 1')).rejects.toThrow(
        'queryAsGestor é exclusivo para gestores'
      );
    });
  });

  describe('2. FK liberado_por - Integridade Referencial', () => {
    it('FK lotes_avaliacao.liberado_por deve referenciar entidades_senhas(cpf)', async () => {
      const result = await query(`
        SELECT 
          tc.constraint_name,
          kcu.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = 'lotes_avaliacao'
          AND kcu.column_name = 'liberado_por'
      `);

      expect(result.rowCount).toBeGreaterThan(0);

      const fk = result.rows[0];
      expect(fk.foreign_table_name).toBe('entidades_senhas');
      expect(fk.foreign_column_name).toBe('cpf');
    });

    it('não deve existir FK de liberado_por para funcionarios', async () => {
      const result = await query(`
        SELECT 
          tc.constraint_name,
          ccu.table_name AS foreign_table_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = 'lotes_avaliacao'
          AND ccu.table_name = 'funcionarios'
          AND ccu.column_name = 'cpf'
      `);

      // Não deve existir FK para funcionarios
      const fkToFuncionarios = result.rows.filter((row) =>
        row.constraint_name.includes('liberado_por')
      );
      expect(fkToFuncionarios.length).toBe(0);
    });
  });

  describe('3. Validação de Dados - Gestor 87545772920', () => {
    it('gestor deve existir em entidades_senhas', async () => {
      const result = await query(
        'SELECT cpf, tomador_id FROM entidades_senhas WHERE cpf = $1',
        [TEST_CPF_GESTOR]
      );

      expect(result.rowCount).toBe(1);
      expect(result.rows[0].cpf).toBe(TEST_CPF_GESTOR);
      expect(result.rows[0].tomador_id).toBe(TEST_tomador_ID);
    });

    it('gestor NÃO deve existir em funcionarios', async () => {
      const result = await query(
        'SELECT cpf FROM funcionarios WHERE cpf = $1',
        [TEST_CPF_GESTOR]
      );

      expect(result.rowCount).toBe(0);
    });

    it('tomador do gestor deve estar ativo', async () => {
      const result = await query(
        'SELECT id, responsavel_cpf, status FROM tomadors WHERE responsavel_cpf = $1',
        [TEST_CPF_GESTOR]
      );

      expect(result.rowCount).toBe(1);
      expect(result.rows[0].id).toBe(TEST_tomador_ID);
      expect(result.rows[0].status).toBe('aprovado');
    });
  });

  describe('4. Endpoints de Entidade - Uso de queryAsGestorEntidade', () => {
    it('app/api/entidade/liberar-lote deve importar queryAsGestorEntidade', async () => {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(
        process.cwd(),
        'app/api/entidade/liberar-lote/route.ts'
      );
      const content = fs.readFileSync(filePath, 'utf8');

      expect(content).toContain("from '@/lib/db-gestor'");
      expect(content).toContain('queryAsGestorEntidade');
    });

    it('app/api/entidade/liberar-lote NÃO deve importar query direto de db', async () => {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(
        process.cwd(),
        'app/api/entidade/liberar-lote/route.ts'
      );
      const content = fs.readFileSync(filePath, 'utf8');

      // Não deve ter import { query } from '@/lib/db'
      const hasDirectQueryImport = content.match(
        /import\s*{\s*query\s*}\s*from\s*'@\/lib\/db'/
      );
      expect(hasDirectQueryImport).toBeNull();
    });

    it('app/api/entidade/liberar-lote deve usar queryAsGestorEntidade nas queries', async () => {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(
        process.cwd(),
        'app/api/entidade/liberar-lote/route.ts'
      );
      const content = fs.readFileSync(filePath, 'utf8');

      // Contar ocorrências de queryAsGestorEntidade
      const matches = content.match(/queryAsGestorEntidade\(/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThan(10); // Deve ter várias queries
    });
  });

  describe('5. Auditoria - Triggers com Variáveis de Sessão', () => {
    it('INSERT em lotes_avaliacao deve registrar auditoria com CPF correto', async () => {
      // Limpar audit_logs de testes anteriores
      await query(`DELETE FROM audit_logs WHERE resource = 'lotes_avaliacao'`);

      setSession({
        cpf: TEST_CPF_GESTOR,
        perfil: 'gestor',
        tomador_id: TEST_tomador_ID,
      });

      // Configurar variáveis de sessão manualmente (simular queryAsGestor)
      await query('SELECT set_config($1, $2, false)', [
        'app.current_user_cpf',
        TEST_CPF_GESTOR,
      ]);
      await query('SELECT set_config($1, $2, false)', [
        'app.current_user_perfil',
        'gestor',
      ]);

      // Gerar código único
      const codigo = `TEST-${Date.now()}`;

      // Inserir lote de teste
      const loteResult = await query(
        `INSERT INTO lotes_avaliacao 
         (codigo, tomador_id, titulo, descricao, tipo, status, liberado_por, numero_ordem)
         VALUES ($1, $2, $3, $4, $5, 'ativo', $6, $7) 
         RETURNING id`,
        [
          codigo,
          TEST_tomador_ID,
          'Lote Teste Auditoria',
          'Teste de auditoria com sessão',
          'completo',
          TEST_CPF_GESTOR,
          999,
        ]
      );

      const loteId = loteResult.rows[0].id;

      // Verificar se auditoria foi registrada
      const auditResult = await query(
        `SELECT user_cpf, user_perfil, action, resource, resource_id 
         FROM audit_logs 
         WHERE resource = 'lotes_avaliacao' 
           AND resource_id = $1`,
        [loteId.toString()]
      );

      expect(auditResult.rowCount).toBeGreaterThan(0);
      expect(auditResult.rows[0].user_cpf).toBe(TEST_CPF_GESTOR);
      expect(auditResult.rows[0].user_perfil).toBe('gestor');
      expect(auditResult.rows[0].action).toBe('INSERT');

      // Limpar dados de teste
      await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]);
    });
  });

  describe('6. Migration 302 - Lote ID Allocator', () => {
    it('lote_id_allocator deve ter registro inicial', async () => {
      const result = await query('SELECT last_id FROM lote_id_allocator');

      expect(result.rowCount).toBeGreaterThan(0);
      expect(typeof result.rows[0].last_id).toBe('number');
    });

    it('fn_next_lote_id deve retornar ID válido', async () => {
      const result = await query('SELECT fn_next_lote_id() as next_id');

      expect(result.rowCount).toBe(1);
      expect(result.rows[0].next_id).toBeGreaterThan(0);
    });
  });

  describe('7. Migration 304 - Validação de Integridade', () => {
    it('todos gestores em entidades_senhas devem ter tomador_id', async () => {
      const result = await query(
        'SELECT cpf FROM entidades_senhas WHERE tomador_id IS NULL'
      );

      expect(result.rowCount).toBe(0);
    });

    it('todos lotes devem ter liberado_por válido', async () => {
      const result = await query(`
        SELECT la.id, la.liberado_por
        FROM lotes_avaliacao la
        LEFT JOIN entidades_senhas cs ON la.liberado_por = cs.cpf
        WHERE cs.cpf IS NULL
      `);

      expect(result.rowCount).toBe(0);
    });

    it('índices de performance devem existir', async () => {
      const indexes = await query(`
        SELECT indexname
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND (indexname = 'idx_entidades_senhas_tomador_id'
            OR indexname = 'idx_lotes_avaliacao_liberado_por')
      `);

      expect(indexes.rowCount).toBe(2);
    });
  });
});
