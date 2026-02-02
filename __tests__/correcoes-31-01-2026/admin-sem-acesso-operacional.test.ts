/**
 * Testes de validação das correções de acesso admin
 * Data: 31/01/2026
 *
 * Valida que admin NÃO tem acesso operacional após as correções:
 * 1. Rota /api/admin/laudos removida
 * 2. Rota /api/rh/account-info não permite admin (verificação estática)
 * 3. Políticas RLS bloqueiam admin (via SQL queries)
 * 4. RBAC admin tem apenas permissões administrativas (via SQL queries)
 *
 * @jest-environment node
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Usar conexão direta ao banco de teste para evitar middleware
const testPool = new Pool({
  connectionString:
    'postgresql://postgres:123456@localhost:5432/nr-bps_db_test',
  max: 5,
});

describe('🔒 Validação: Admin SEM Acesso Operacional', () => {
  afterAll(async () => {
    await testPool.end();
  });

  describe('1. Rota /api/admin/laudos - DEVE NÃO EXISTIR', () => {
    it('❌ Arquivo de rota /api/admin/laudos/regenerar-hashes deve NÃO existir', () => {
      const routePath = path.join(
        process.cwd(),
        'app',
        'api',
        'admin',
        'laudos',
        'regenerar-hashes',
        'route.ts'
      );

      expect(fs.existsSync(routePath)).toBe(false);
    });

    it('❌ Diretório /app/api/admin/laudos deve NÃO existir', () => {
      const dirPath = path.join(process.cwd(), 'app', 'api', 'admin', 'laudos');
      expect(fs.existsSync(dirPath)).toBe(false);
    });
  });

  describe('2. Rota /api/rh/account-info - NÃO DEVE PERMITIR ADMIN', () => {
    it('✅ requireRole deve aceitar apenas RH (verificação no código)', () => {
      const routePath = path.join(
        process.cwd(),
        'app',
        'api',
        'rh',
        'account-info',
        'route.ts'
      );

      const routeContent = fs.readFileSync(routePath, 'utf-8');

      // Verificar que requireRole não inclui 'admin'
      expect(routeContent).toContain("requireRole(['rh'])");
      expect(routeContent).not.toContain("requireRole(['rh', 'admin'])");
    });
  });

  describe('3. Políticas RLS - Admin BLOQUEADO em Operacionais', () => {
    it('✅ Deve existir avaliacoes_block_admin RESTRICTIVE', async () => {
      const result = await testPool.query(`
        SELECT policyname, permissive, cmd
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'avaliacoes' 
        AND policyname = 'avaliacoes_block_admin'
      `);

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].permissive).toBe('RESTRICTIVE');
      expect(result.rows[0].cmd).toBe('ALL');
    });

    it('✅ Deve existir empresas_block_admin RESTRICTIVE', async () => {
      const result = await testPool.query(`
        SELECT policyname, permissive, cmd
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'empresas_clientes' 
        AND policyname = 'empresas_block_admin'
      `);

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].permissive).toBe('RESTRICTIVE');
    });

    it('✅ Deve existir lotes_block_admin RESTRICTIVE', async () => {
      const result = await testPool.query(`
        SELECT policyname, permissive, cmd
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'lotes_avaliacao' 
        AND policyname = 'lotes_block_admin'
      `);

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].permissive).toBe('RESTRICTIVE');
    });

    it('✅ Deve existir laudos_block_admin RESTRICTIVE', async () => {
      const result = await testPool.query(`
        SELECT policyname, permissive, cmd
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'laudos' 
        AND policyname = 'laudos_block_admin'
      `);

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].permissive).toBe('RESTRICTIVE');
    });

    it('✅ Deve existir funcionarios_block_admin RESTRICTIVE', async () => {
      const result = await testPool.query(`
        SELECT policyname, permissive, cmd
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'funcionarios' 
        AND policyname = 'funcionarios_block_admin'
      `);

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].permissive).toBe('RESTRICTIVE');
    });

    it('✅ Deve existir respostas_block_admin RESTRICTIVE', async () => {
      const result = await testPool.query(`
        SELECT policyname, permissive, cmd
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'respostas' 
        AND policyname = 'respostas_block_admin'
      `);

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].permissive).toBe('RESTRICTIVE');
    });

    it('✅ Deve existir resultados_block_admin RESTRICTIVE', async () => {
      const result = await testPool.query(`
        SELECT policyname, permissive, cmd
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'resultados' 
        AND policyname = 'resultados_block_admin'
      `);

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].permissive).toBe('RESTRICTIVE');
    });

    it('❌ NÃO deve existir admin_all_avaliacoes (removida)', async () => {
      const result = await testPool.query(`
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND policyname = 'admin_all_avaliacoes'
      `);

      expect(result.rows.length).toBe(0);
    });

    it('❌ NÃO deve existir admin_all_empresas (removida)', async () => {
      const result = await testPool.query(`
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND policyname = 'admin_all_empresas'
      `);

      expect(result.rows.length).toBe(0);
    });

    it('❌ NÃO deve existir admin_all_lotes (removida)', async () => {
      const result = await testPool.query(`
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND policyname = 'admin_all_lotes'
      `);

      expect(result.rows.length).toBe(0);
    });

    it('❌ NÃO deve existir admin_all_laudos (removida)', async () => {
      const result = await testPool.query(`
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND policyname = 'admin_all_laudos'
      `);

      expect(result.rows.length).toBe(0);
    });

    it('❌ NÃO deve existir policy_lotes_admin (removida)', async () => {
      const result = await testPool.query(`
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND policyname = 'policy_lotes_admin'
      `);

      expect(result.rows.length).toBe(0);
    });

    it('❌ NÃO deve existir policy_laudos_admin (removida)', async () => {
      const result = await testPool.query(`
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND policyname = 'policy_laudos_admin'
      `);

      expect(result.rows.length).toBe(0);
    });

    it('❌ NÃO deve existir fila_emissao_admin_view (removida)', async () => {
      const result = await testPool.query(`
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND policyname = 'fila_emissao_admin_view'
      `);

      expect(result.rows.length).toBe(0);
    });

    it('❌ NÃO deve existir empresas_admin_select (removida)', async () => {
      const result = await testPool.query(`
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND policyname = 'empresas_admin_select'
      `);

      expect(result.rows.length).toBe(0);
    });

    it('❌ NÃO deve existir empresas_admin_insert (removida)', async () => {
      const result = await testPool.query(`
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND policyname = 'empresas_admin_insert'
      `);

      expect(result.rows.length).toBe(0);
    });

    it('❌ NÃO deve existir empresas_admin_update (removida)', async () => {
      const result = await testPool.query(`
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND policyname = 'empresas_admin_update'
      `);

      expect(result.rows.length).toBe(0);
    });

    it('❌ NÃO deve existir empresas_admin_delete (removida)', async () => {
      const result = await testPool.query(`
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND policyname = 'empresas_admin_delete'
      `);

      expect(result.rows.length).toBe(0);
    });
  });

  describe('4. RBAC - Admin com Apenas Permissões Administrativas', () => {
    it('✅ Admin deve ter permissões (validar quantidade)', async () => {
      const result = await testPool.query(`
        SELECT COUNT(*) as count
        FROM role_permissions rp
        JOIN roles r ON r.id = rp.role_id
        WHERE r.name = 'admin'
      `);

      // Admin deve ter permissões administrativas (número varia por ambiente)
      const permCount = parseInt(result.rows[0].count);
      expect(permCount).toBeGreaterThan(0);

      // Log para referência
      console.log(`Admin tem ${permCount} permissões no ambiente de teste`);
    });

    it('✅ Admin NÃO deve ter permissões operacionais', async () => {
      const result = await testPool.query(`
        SELECT p.name, p.resource
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        JOIN roles r ON r.id = rp.role_id
        WHERE r.name = 'admin'
        AND p.resource IN ('avaliacoes', 'empresas', 'lotes', 'laudos', 'funcionarios', 'respostas', 'resultados')
      `);

      // Admin não deve ter NENHUMA permissão em recursos operacionais
      expect(result.rows.length).toBe(0);
    });

    it('✅ Admin NÃO deve ter permissões em recursos operacionais', async () => {
      const result = await testPool.query(`
        SELECT DISTINCT p.resource
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        JOIN roles r ON r.id = rp.role_id
        WHERE r.name = 'admin'
        ORDER BY p.resource
      `);

      // Recursos PROIBIDOS para admin (operacionais)
      const forbiddenResources = [
        'avaliacoes',
        'empresas',
        'empresas_clientes',
        'lotes',
        'lotes_avaliacao',
        'laudos',
        'funcionarios',
        'respostas',
        'resultados',
      ];

      result.rows.forEach((row) => {
        expect(forbiddenResources).not.toContain(row.resource);
      });
    });
  });

  describe('5. Validação de Funções Helper', () => {
    it('✅ Função current_user_perfil() deve existir', async () => {
      const result = await testPool.query(`
        SELECT proname 
        FROM pg_proc 
        WHERE proname = 'current_user_perfil'
      `);

      expect(result.rows.length).toBeGreaterThanOrEqual(1);
    });

    it('✅ Função current_user_cpf() deve existir', async () => {
      const result = await testPool.query(`
        SELECT proname 
        FROM pg_proc 
        WHERE proname = 'current_user_cpf'
      `);

      expect(result.rows.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('6. Validação de Correções Legadas', () => {
    it('✅ avaliacao_resets_insert_policy NÃO deve mencionar admin', async () => {
      const result = await testPool.query(`
        SELECT qual, with_check
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'avaliacao_resets'
        AND policyname = 'avaliacao_resets_insert_policy'
      `);

      // Política deve existir mas SEM mencionar admin
      expect(result.rows.length).toBe(1);

      const policy = result.rows[0];
      const combined = `${policy.qual || ''} ${policy.with_check || ''}`;
      expect(combined).not.toContain("'admin'");
      expect(combined.toLowerCase()).not.toContain('admin');
    });

    it('✅ avaliacoes_own_update NÃO deve mencionar admin', async () => {
      const result = await testPool.query(`
        SELECT qual, with_check
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'avaliacoes'
        AND policyname = 'avaliacoes_own_update'
      `);

      // Política deve existir mas SEM mencionar admin
      expect(result.rows.length).toBe(1);

      const policy = result.rows[0];
      const combined = `${policy.qual || ''} ${policy.with_check || ''}`;
      expect(combined).not.toContain("'admin'");
      expect(combined.toLowerCase()).not.toContain('admin');
    });

    it('❌ Nenhuma política PERMISSIVE deve dar acesso operacional a admin', async () => {
      const result = await testPool.query(`
        SELECT tablename, policyname, permissive, cmd, qual, with_check
        FROM pg_policies 
        WHERE schemaname = 'public'
        AND tablename IN ('avaliacoes', 'empresas_clientes', 'lotes_avaliacao', 'laudos', 'respostas', 'resultados', 'avaliacao_resets')
        AND permissive = 'PERMISSIVE'
        AND policyname NOT LIKE '%block_admin%'
        AND policyname NOT LIKE '%restricted%'
      `);

      // Verificar que nenhuma política PERMISSIVE menciona admin
      result.rows.forEach((row) => {
        const combined = `${row.qual || ''} ${row.with_check || ''}`;
        expect(combined).not.toContain("'admin'");
      });
    });
  });
});
