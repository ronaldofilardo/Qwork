#!/usr/bin/env node
/**
 * Script: Migrar roles, permissions e usuários DEV → STAGING
 * Uso: node scripts/migrate-roles-to-staging.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

const log = {
  info: (msg) => console.log(`${colors.yellow}ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.error(`${colors.red}✗ ${msg}${colors.reset}`),
};

async function main() {
  log.info('Iniciando migração de perfis DEV → STAGING...\n');

  // ────────────────────────────────────────────────────────────────
  // 1. Conectar a STAGING
  // ────────────────────────────────────────────────────────────────
  const stagingClient = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await stagingClient.connect();
    log.success('Conectado a STAGING (Neon)');
  } catch (err) {
    log.error(`Erro ao conectar a STAGING: ${err.message}`);
    process.exit(1);
  }

  try {
    // ────────────────────────────────────────────────────────────────
    // 2. Inserir ROLES
    // ────────────────────────────────────────────────────────────────
    log.info('Inserindo roles...');
    
    const rolesInsert = `
      INSERT INTO roles (name, display_name, description, hierarchy_level, active)
      VALUES
        ('admin', 'Administrador', 'Administrador do sistema', 100, true),
        ('suporte', 'Suporte', 'Suporte - gestão financeira', 50, true),
        ('comercial', 'Comercial', 'Comercial - gestão de representantes', 50, true)
      ON CONFLICT (name) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        hierarchy_level = EXCLUDED.hierarchy_level,
        active = EXCLUDED.active;
    `;
    
    await stagingClient.query(rolesInsert);
    log.success('Roles inseridas (admin, suporte, comercial)');

    // ────────────────────────────────────────────────────────────────
    // 3. Inserir PERMISSIONS
    // ────────────────────────────────────────────────────────────────
    log.info('Inserindo permissions...');

    const permissionsInsert = `
      INSERT INTO permissions (name, resource, action, description)
      VALUES
        ('clinicas:manage', 'clinicas', 'manage', 'Gerenciar clínicas'),
        ('clinicas:read', 'clinicas', 'read', 'Visualizar clínicas'),
        ('entidades:manage', 'entidades', 'manage', 'Gerenciar entidades'),
        ('entidades:read', 'entidades', 'read', 'Visualizar entidades'),
        ('pagamentos:manage', 'pagamentos', 'manage', 'Gerenciar pagamentos'),
        ('comissoes:manage', 'comissoes', 'manage', 'Gerenciar comissões'),
        ('representantes:manage', 'representantes', 'manage', 'Gerenciar representantes'),
        ('leads:manage', 'leads', 'manage', 'Gerenciar leads')
      ON CONFLICT (name) DO UPDATE SET
        resource = EXCLUDED.resource,
        action = EXCLUDED.action;
    `;

    await stagingClient.query(permissionsInsert);
    log.success('Permissions inseridas (8 permissões)');

    // ────────────────────────────────────────────────────────────────
    // 4. Mapear ROLE_PERMISSIONS
    // ────────────────────────────────────────────────────────────────
    log.info('Mapeando role_permissions...');

    const rolePermissionsInsert = `
      -- Admin
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id FROM roles r, permissions p
      WHERE r.name = 'admin' AND p.name IN ('clinicas:manage', 'clinicas:read', 'entidades:manage', 'entidades:read')
      ON CONFLICT (role_id, permission_id) DO NOTHING;

      -- Suporte
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id FROM roles r, permissions p
      WHERE r.name = 'suporte' AND p.name IN ('pagamentos:manage', 'comissoes:manage')
      ON CONFLICT (role_id, permission_id) DO NOTHING;

      -- Comercial
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id FROM roles r, permissions p
      WHERE r.name = 'comercial' AND p.name IN ('representantes:manage', 'leads:manage')
      ON CONFLICT (role_id, permission_id) DO NOTHING;
    `;

    await stagingClient.query(rolePermissionsInsert);
    log.success('Role permissions mapeadas');

    // ────────────────────────────────────────────────────────────────
    // 5. Inserir USUÁRIOS
    // ────────────────────────────────────────────────────────────────
    log.info('Inserindo usuários (admin, suporte, comercial)...');

    const usuariosInsert = `
      INSERT INTO usuarios (cpf, nome, email, tipo_usuario, ativo)
      VALUES
        ('11111111111', 'Admin Staging', 'admin@staging.local', 'admin', true),
        ('22222222222', 'Suporte Staging', 'suporte@staging.local', 'suporte', true),
        ('33333333333', 'Comercial Staging', 'comercial@staging.local', 'comercial', true)
      ON CONFLICT (cpf) DO UPDATE SET
        nome = EXCLUDED.nome,
        email = EXCLUDED.email,
        tipo_usuario = EXCLUDED.tipo_usuario,
        ativo = EXCLUDED.ativo;
    `;

    await stagingClient.query(usuariosInsert);
    log.success('Usuários inseridos (admin, suporte, comercial)');

    // ────────────────────────────────────────────────────────────────
    // 6. VALIDAÇÃO
    // ────────────────────────────────────────────────────────────────
    log.info('Validando dados em STAGING...\n');

    const validation = await stagingClient.query(`
      SELECT 
        (SELECT COUNT(*) FROM roles WHERE name IN ('admin', 'suporte', 'comercial')) as roles_count,
        (SELECT COUNT(*) FROM permissions) as permissions_count,
        (SELECT COUNT(*) FROM role_permissions) as role_perms_count,
        (SELECT COUNT(*) FROM usuarios WHERE tipo_usuario IN ('admin', 'suporte', 'comercial')) as users_count;
    `);

    const stats = validation.rows[0];
    console.log(`${colors.green}Estatísticas:${colors.reset}`);
    console.log(`  • Roles: ${stats.roles_count}`);
    console.log(`  • Permissions: ${stats.permissions_count}`);
    console.log(`  • Role Permissions: ${stats.role_perms_count}`);
    console.log(`  • Usuários (admin/suporte/comercial): ${stats.users_count}\n`);

    log.success('✅ Migração concluída com sucesso!');
    console.log(`${colors.green}
  Usuários criados:
  • CPF: 11111111111 (admin)
  • CPF: 22222222222 (suporte)
  • CPF: 33333333333 (comercial)
${colors.reset}`);
  } catch (err) {
    log.error(`Erro durante migração: ${err.message}`);
    console.error(err);
    process.exit(1);
  } finally {
    await stagingClient.end();
  }
}

main();
