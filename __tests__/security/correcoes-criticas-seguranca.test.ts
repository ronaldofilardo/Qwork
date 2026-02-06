/**
 * Testes de Segurança Crítica - Correções Implementadas
 * Data: 2026-01-30
 *
 * Validação das correções de segurança críticas implementadas:
 * 1. Remoção de placeholders de senha
 * 2. FORCE ROW LEVEL SECURITY
 * 3. Índices RLS para performance
 * 4. Policies considerando contratante_id
 * 5. Auditoria de mudanças em policies
 * 6. Validação obrigatória de sessão
 */

import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

// Tipos para resultados de queries
interface ContratanteSenha {
  cpf: string;
  senha_hash: string;
}

interface CountResult {
  total: string;
}

interface RLSInfo {
  tablename: string;
  relforcerowsecurity: boolean;
}

interface PolicyInfo {
  policyname: string;
  qual: string;
}

interface ColumnInfo {
  column_name: string;
}

interface EventTriggerInfo {
  evtname: string;
  evtevent: string;
}

interface FunctionInfo {
  proname: string;
  prosrc: string;
  prorettype: string;
}

interface ValidacaoResult {
  validar_sessao_rls: boolean;
}

interface SecurityCheckResult {
  categoria: string;
  item: string;
  status: string;
  detalhes: string;
}

describe('🔒 Segurança Crítica - Correções Implementadas', () => {
  describe('1. Proteção contra Placeholders de Senha', () => {
    it('deve rejeitar tentativa de inserir senha com placeholder', async () => {
      const cpfTeste = '12345678901';

      await expect(
        query(
          `INSERT INTO entidades_senhas (cpf, senha_hash) 
           VALUES ($1, $2)`,
          [cpfTeste, 'PLACEHOLDER_123456']
        )
      ).rejects.toThrow(/Placeholders de senha não são permitidos/);
    });

    it('deve rejeitar senha não hasheada (texto plano)', async () => {
      const cpfTeste = '12345678902';

      await expect(
        query(
          `INSERT INTO entidades_senhas (cpf, senha_hash) 
           VALUES ($1, $2)`,
          [cpfTeste, 'senha123'] // Muito curta para ser bcrypt
        )
      ).rejects.toThrow(/Senha deve ser hasheada com bcrypt/);
    });

    it('deve aceitar senha bcrypt válida', async () => {
      const cpfTeste = '12345678903';
      const senhaHash = await bcrypt.hash('senha123', 10);

      const result = await query<ContratanteSenha>(
        `INSERT INTO entidades_senhas (cpf, senha_hash) 
         VALUES ($1, $2) RETURNING cpf`,
        [cpfTeste, senhaHash]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]?.cpf).toBe(cpfTeste);

      // Cleanup
      await query('DELETE FROM entidades_senhas WHERE cpf = $1', [cpfTeste]);
    });

    it('deve detectar senhas placeholder existentes no banco', async () => {
      const result = await query<CountResult>(`
        SELECT COUNT(*) as total
        FROM entidades_senhas
        WHERE senha_hash LIKE 'PLACEHOLDER_%'
      `);

      expect(parseInt(result.rows[0]?.total || '0')).toBe(0);
    });
  });

  describe('2. FORCE ROW LEVEL SECURITY', () => {
    it('deve ter FORCE RLS ativado em tabelas sensíveis', async () => {
      const tabelasSensiveis = [
        'contratantes',
        'entidades_senhas',
        'funcionarios',
        'avaliacoes',
        'laudos',
        'lotes_avaliacao',
        'contratos',
        'recibos',
        'pagamentos',
      ];

      for (const tabela of tabelasSensiveis) {
        const result = await query<RLSInfo>(
          `
          SELECT relname as tablename, relforcerowsecurity
          FROM pg_class
          WHERE relname = $1
          AND relnamespace = 'public'::regnamespace
        `,
          [tabela]
        );

        expect(result.rows).toHaveLength(1);
        expect(result.rows[0]?.relforcerowsecurity).toBe(true);
      }
    });

    it('owner não deve conseguir bypassar RLS sem desabilitar', async () => {
      // Tentar query como owner sem contexto deve falhar em tabelas com FORCE RLS
      const result = await query<RLSInfo>(`
        SELECT tablename, relforcerowsecurity
        FROM pg_tables pt
        JOIN pg_class pc ON pc.relname = pt.tablename
        WHERE schemaname = 'public'
        AND tablename IN ('contratantes', 'funcionarios')
      `);

      result.rows.forEach((row: RLSInfo) => {
        expect(row.relforcerowsecurity).toBe(true);
      });
    });
  });

  describe('3. Índices para Performance RLS', () => {
    it('deve ter índices em colunas contratante_id', async () => {
      const result = await query<{ indexname: string; tablename: string }>(`
        SELECT indexname, tablename
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND indexname LIKE '%contratante_id%rls%'
        ORDER BY tablename
      `);

      // Deve ter pelo menos 5 índices em contratante_id
      expect(result.rows.length).toBeGreaterThanOrEqual(5);

      const tabelas = result.rows.map((r) => r.tablename);
      expect(tabelas).toContain('funcionarios');
      expect(tabelas).toContain('contratos');
      expect(tabelas).toContain('recibos');
    });

    it('deve ter índices em colunas clinica_id', async () => {
      const result = await query(`
        SELECT indexname, tablename
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND indexname LIKE '%clinica_id%rls%'
      `);

      expect(result.rows.length).toBeGreaterThanOrEqual(2);
    });

    it('deve ter índices em CPF para RLS', async () => {
      const result = await query(`
        SELECT indexname, tablename
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND indexname LIKE '%cpf%rls%'
      `);

      expect(result.rows.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('4. Policies RLS com contratante_id', () => {
    it('policy de funcionarios deve considerar contratante_id', async () => {
      const result = await query<PolicyInfo>(`
        SELECT policyname, qual
        FROM pg_policies
        WHERE tablename = 'funcionarios'
        AND policyname LIKE '%contratante%'
      `);

      expect(result.rows.length).toBeGreaterThan(0);

      const policy = result.rows[0];
      expect(policy?.qual).toMatch(/contratante_id/i);
    });

    it('policy de avaliacoes deve considerar contratante_id', async () => {
      const result = await query<PolicyInfo>(`
        SELECT policyname, qual
        FROM pg_policies
        WHERE tablename = 'avaliacoes'
        AND policyname LIKE '%contratante%'
      `);

      expect(result.rows.length).toBeGreaterThan(0);

      const policy = result.rows[0];
      expect(policy?.qual).toMatch(/contratante_id/i);
    });

    it('policy de lotes deve isolar por contratante', async () => {
      const result = await query<PolicyInfo>(`
        SELECT policyname, qual
        FROM pg_policies
        WHERE tablename = 'lotes_avaliacao'
        AND policyname = 'policy_lotes_entidade'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]?.qual).toMatch(/contratante_id/i);
    });
  });

  describe('5. Auditoria de Policies RLS', () => {
    it('deve ter tabela de auditoria de policies', async () => {
      const result = await query<ColumnInfo>(`
        SELECT table_name, column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'rls_policy_audit'
        ORDER BY ordinal_position
      `);

      expect(result.rows.length).toBeGreaterThan(0);

      const colunas = result.rows.map((r) => r.column_name);
      expect(colunas).toContain('id');
      expect(colunas).toContain('event_time');
      expect(colunas).toContain('table_name');
      expect(colunas).toContain('policy_name');
      expect(colunas).toContain('operation');
    });

    it('deve ter event trigger para auditoria de policies', async () => {
      const result = await query<EventTriggerInfo>(`
        SELECT evtname, evtevent
        FROM pg_event_trigger
        WHERE evtname = 'trg_audit_policy_ddl'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]?.evtevent).toBe('ddl_command_end');
    });

    it('deve ter função de auditoria de policies', async () => {
      const result = await query<FunctionInfo>(`
        SELECT proname, prosrc
        FROM pg_proc
        WHERE proname = 'audit_rls_policy_change'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]?.prosrc).toMatch(/rls_policy_audit/);
    });
  });

  describe('6. Validação Obrigatória de Sessão', () => {
    it('deve ter função validar_sessao_rls()', async () => {
      const result = await query<FunctionInfo>(`
        SELECT proname, pronargs, prorettype::regtype as prorettype
        FROM pg_proc
        WHERE proname = 'validar_sessao_rls'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]?.prorettype).toBe('boolean');
    });

    it('validação deve rejeitar sessão sem perfil', async () => {
      // Limpar contexto
      await query("SELECT set_config('app.current_perfil', '', false)");
      await query(
        "SELECT set_config('app.current_user_cpf', '12345678901', false)"
      );

      await expect(query('SELECT validar_sessao_rls()')).rejects.toThrow(
        /Perfil de usuário não definido/
      );
    });

    it('validação deve rejeitar sessão sem CPF', async () => {
      await query("SELECT set_config('app.current_perfil', 'admin', false)");
      await query("SELECT set_config('app.current_user_cpf', '', false)");

      await expect(query('SELECT validar_sessao_rls()')).rejects.toThrow(
        /CPF de usuário não definido/
      );
    });

    it('validação deve rejeitar CPF inválido', async () => {
      await query("SELECT set_config('app.current_perfil', 'admin', false)");
      await query("SELECT set_config('app.current_user_cpf', '123', false)");

      await expect(query('SELECT validar_sessao_rls()')).rejects.toThrow(
        /CPF inválido/
      );
    });

    it('validação deve aceitar sessão válida', async () => {
      await query("SELECT set_config('app.current_perfil', 'admin', false)");
      await query(
        "SELECT set_config('app.current_user_cpf', '00000000000', false)"
      );

      const result = await query<ValidacaoResult>(
        'SELECT validar_sessao_rls()'
      );
      expect(result.rows[0]?.validar_sessao_rls).toBe(true);
    });
  });

  describe('7. Função de Verificação de Segurança', () => {
    it('deve ter função verificar_seguranca_rls()', async () => {
      const result = await query(`
        SELECT proname
        FROM pg_proc
        WHERE proname = 'verificar_seguranca_rls'
      `);

      expect(result.rows).toHaveLength(1);
    });

    it('verificação deve retornar status de segurança', async () => {
      const result = await query('SELECT * FROM verificar_seguranca_rls()');

      expect(result.rows.length).toBeGreaterThan(0);

      result.rows.forEach((row) => {
        expect(row).toHaveProperty('categoria');
        expect(row).toHaveProperty('item');
        expect(row).toHaveProperty('status');
        expect(row).toHaveProperty('detalhes');
      });
    });

    it('verificação não deve encontrar problemas críticos', async () => {
      const result = await query<SecurityCheckResult>(
        'SELECT * FROM verificar_seguranca_rls()'
      );

      const problemasCriticos = result.rows.filter(
        (row: SecurityCheckResult) => row.status === '✗ CRÍTICO'
      );

      expect(problemasCriticos).toHaveLength(0);
    });
  });

  describe('8. Integração - Validação Completa', () => {
    it('deve executar relatório completo sem erros', async () => {
      const result = await query<SecurityCheckResult>(
        'SELECT * FROM verificar_seguranca_rls()'
      );

      // \n📊 Relatório de Segurança:

      result.rows.forEach((row: SecurityCheckResult) => {});

      expect(result.rows.length).toBeGreaterThan(0);
    });
  });
});
