/**
 * Script para aplicar migration 1022 (novos perfis: suporte, comercial, vendedor)
 * nos bancos DEV (nr-bps_db) e TEST (nr-bps_db_test) — NUNCA em produção.
 *
 * Uso:
 *   node scripts/apply-migration-1022.cjs dev    → nr-bps_db
 *   node scripts/apply-migration-1022.cjs test   → nr-bps_db_test
 *   node scripts/apply-migration-1022.cjs all    → ambos
 */

const { Pool } = require('pg');

const DEV_URL = 'postgresql://postgres:123456@localhost:5432/nr-bps_db';
const TEST_URL = 'postgresql://postgres:123456@localhost:5432/nr-bps_db_test';

async function applyTo(label, connectionString) {
  console.log(`\n🔧 Aplicando migration 1022 em [${label}]...`);

  // FASE 1: Expandir ENUMs — deve correr fora de transação e em conexão separada
  // PostgreSQL não permite usar valores recém-adicionados na mesma transação.
  const pool1 = new Pool({ connectionString });
  try {
    console.log('  [1/3] Expandindo ENUMs...');

    // perfil_usuario_enum
    await pool1.query(
      `ALTER TYPE perfil_usuario_enum ADD VALUE IF NOT EXISTS 'suporte'`
    );
    await pool1.query(
      `ALTER TYPE perfil_usuario_enum ADD VALUE IF NOT EXISTS 'comercial'`
    );
    await pool1.query(
      `ALTER TYPE perfil_usuario_enum ADD VALUE IF NOT EXISTS 'vendedor'`
    );

    // usuario_tipo_enum (se existir)
    const tipoRes = await pool1.query(
      `SELECT 1 FROM pg_type WHERE typname = 'usuario_tipo_enum'`
    );
    if (tipoRes.rowCount > 0) {
      for (const val of ['suporte', 'comercial', 'vendedor']) {
        const exists = await pool1.query(
          `SELECT 1 FROM pg_enum e
           JOIN pg_type t ON e.enumtypid = t.oid
           WHERE t.typname = 'usuario_tipo_enum' AND e.enumlabel = $1`,
          [val]
        );
        if (exists.rowCount === 0) {
          await pool1.query(`ALTER TYPE usuario_tipo_enum ADD VALUE '${val}'`);
        }
      }
    }

    console.log('  ✓ ENUMs expandidos');
  } catch (error) {
    console.error(`❌ Erro [FASE 1] em [${label}]: ${error.message}`);
    await pool1.end();
    throw error;
  }
  await pool1.end();

  // FASE 2: CHECK constraint — nova conexão para ver os novos valores ENUM
  const pool2 = new Pool({ connectionString });
  try {
    console.log('  [2/3] Atualizando CHECK constraint...');
    await pool2.query(`
      ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_tipo_check;

      ALTER TABLE usuarios ADD CONSTRAINT usuarios_tipo_check CHECK (
        (tipo_usuario IN ('admin', 'emissor') AND clinica_id IS NULL AND entidade_id IS NULL)
        OR (tipo_usuario = 'rh' AND clinica_id IS NOT NULL AND entidade_id IS NULL)
        OR (tipo_usuario = 'gestor' AND entidade_id IS NOT NULL AND clinica_id IS NULL)
        OR (tipo_usuario = 'suporte' AND clinica_id IS NULL AND entidade_id IS NULL)
        OR (tipo_usuario = 'comercial' AND clinica_id IS NULL AND entidade_id IS NULL)
        OR (tipo_usuario = 'vendedor' AND clinica_id IS NULL AND entidade_id IS NULL)
      );
    `);
    console.log('  ✓ CHECK constraint atualizada');
  } catch (error) {
    console.error(`❌ Erro [FASE 2] em [${label}]: ${error.message}`);
    await pool2.end();
    throw error;
  }
  await pool2.end();

  // FASE 3: RLS policies — nova conexão
  const pool3 = new Pool({ connectionString });
  try {
    console.log('  [3/3] Atualizando RLS policies...');
    await pool3.query(`
      DROP POLICY IF EXISTS rep_sees_own ON public.representantes;
      CREATE POLICY rep_sees_own ON public.representantes FOR SELECT
        USING (
          id = public.current_representante_id()
          OR public.current_user_perfil() IN ('admin', 'comercial', 'suporte')
        );

      DROP POLICY IF EXISTS rep_update_own ON public.representantes;
      CREATE POLICY rep_update_own ON public.representantes FOR UPDATE
        USING (
          id = public.current_representante_id()
          OR public.current_user_perfil() IN ('admin', 'comercial')
        )
        WITH CHECK (
          id = public.current_representante_id()
          OR public.current_user_perfil() IN ('admin', 'comercial')
        );

      DROP POLICY IF EXISTS leads_rep_own ON public.leads_representante;
      CREATE POLICY leads_rep_own ON public.leads_representante FOR ALL
        USING (
          representante_id = public.current_representante_id()
          OR public.current_user_perfil() IN ('admin', 'comercial')
        )
        WITH CHECK (
          representante_id = public.current_representante_id()
          OR public.current_user_perfil() IN ('admin', 'comercial')
        );

      DROP POLICY IF EXISTS vinculos_rep_own ON public.vinculos_comissao;
      CREATE POLICY vinculos_rep_own ON public.vinculos_comissao FOR ALL
        USING (
          representante_id = public.current_representante_id()
          OR public.current_user_perfil() IN ('admin', 'comercial', 'suporte')
        )
        WITH CHECK (
          representante_id = public.current_representante_id()
          OR public.current_user_perfil() IN ('admin', 'comercial')
        );

      DROP POLICY IF EXISTS comissoes_rep_own ON public.comissoes_laudo;
      CREATE POLICY comissoes_rep_own ON public.comissoes_laudo FOR ALL
        USING (
          representante_id = public.current_representante_id()
          OR public.current_user_perfil() IN ('admin', 'comercial', 'suporte')
        )
        WITH CHECK (
          representante_id = public.current_representante_id()
          OR public.current_user_perfil() IN ('admin', 'comercial', 'suporte')
        );
    `);
    console.log('  ✓ RLS policies atualizadas');
  } catch (error) {
    // RLS pode falhar se tabelas não existirem neste ambiente — não é bloqueante
    console.warn(`  ⚠️  Aviso [FASE 3] em [${label}]: ${error.message}`);
    console.warn(
      '  (RLS policies podem não existir neste ambiente — continuando)'
    );
  }
  await pool3.end();

  console.log(`✅ Migration 1022 aplicada com sucesso em [${label}]`);
}

async function main() {
  const target = process.argv[2] || 'all';

  if (!['dev', 'test', 'all'].includes(target)) {
    console.error('Uso: node scripts/apply-migration-1022.cjs [dev|test|all]');
    process.exit(1);
  }

  // Garantia: nunca conecta em Neon/produção
  const url = process.env.DATABASE_URL || '';
  if (url.includes('neon.tech') || url.includes('neondb')) {
    console.error(
      '🚫 BLOQUEADO: DATABASE_URL aponta para Neon. Este script é apenas para bancos locais.'
    );
    process.exit(1);
  }

  try {
    if (target === 'dev' || target === 'all') {
      await applyTo('DEV → nr-bps_db', DEV_URL);
    }
    if (target === 'test' || target === 'all') {
      await applyTo('TEST → nr-bps_db_test', TEST_URL);
    }
    console.log('\n🎉 Concluído!');
  } catch {
    process.exit(1);
  }
}

main();
