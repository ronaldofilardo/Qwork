const { Client } = require('pg');

const connectionString =
  process.env.TEST_DATABASE_URL ||
  'postgres://postgres:123456@localhost:5432/nr-bps_db_test';
const client = new Client({ connectionString });

async function seed() {
  await client.connect();
  try {
    await client.query('BEGIN');

    // Limpar associações antigas de permissões do admin
    await client.query(`
      DELETE FROM public.role_permissions
      WHERE role_id = (SELECT id FROM public.roles WHERE name = 'admin')
      AND permission_id IN (
        SELECT id FROM public.permissions 
        WHERE name IN ('manage:avaliacoes', 'manage:funcionarios', 'manage:empresas', 'manage:lotes', 'manage:laudos')
      );
    `);

    // Create roles
    await client.query(`
      INSERT INTO public.roles (name, display_name, description) VALUES
      ('funcionario', 'Funcionário', 'Usuário comum que responde avaliações') ON CONFLICT (name) DO NOTHING;
    `);

    await client.query(`
      INSERT INTO public.roles (name, display_name, description) VALUES
      ('rh', 'Gestor RH/Clínica', 'Gerencia funcionários e empresas de sua clínica') ON CONFLICT (name) DO NOTHING;
    `);

    await client.query(`
      INSERT INTO public.roles (name, display_name, description) VALUES
      ('emissor', 'Emissor de Laudos', 'Emite laudos e relatórios finais') ON CONFLICT (name) DO NOTHING;
    `);

    await client.query(`
      INSERT INTO public.roles (name, display_name, description) VALUES
      ('admin', 'Administrador', 'Administrador do sistema com acesso amplo') ON CONFLICT (name) DO NOTHING;
    `);

    // Create minimal set of permissions used by tests
    const permissions = [
      'read:avaliacoes:own',
      'write:avaliacoes:own',
      'read:funcionarios:own',
      'write:funcionarios:own',
      'read:avaliacoes:clinica',
      'read:funcionarios:clinica',
      'write:funcionarios:clinica',
      'read:empresas:clinica',
      'write:empresas:clinica',
      'read:lotes:clinica',
      'write:lotes:clinica',
      'read:laudos',
      'write:laudos',
      'manage:rh',
      'manage:clinicas',
      'manage:admins',
    ];

    for (const name of permissions) {
      await client.query(
        `INSERT INTO public.permissions (name, resource, action, description) VALUES ($1, 'test', 'test', 'seeded for tests') ON CONFLICT (name) DO NOTHING`,
        [name]
      );
    }

    // Associate permissions to roles
    const roleToPermissions = {
      funcionario: [
        'read:avaliacoes:own',
        'write:avaliacoes:own',
        'read:funcionarios:own',
        'write:funcionarios:own',
      ],
      rh: [
        'read:avaliacoes:clinica',
        'read:funcionarios:clinica',
        'write:funcionarios:clinica',
        'read:empresas:clinica',
        'write:empresas:clinica',
        'read:lotes:clinica',
        'write:lotes:clinica',
      ],
      emissor: ['read:laudos', 'write:laudos', 'read:lotes:clinica'],
      admin: ['manage:rh', 'manage:clinicas', 'manage:admins'],
    };

    for (const [role, perms] of Object.entries(roleToPermissions)) {
      for (const perm of perms) {
        await client.query(
          `INSERT INTO public.role_permissions (role_id, permission_id)
           SELECT r.id, p.id FROM public.roles r, public.permissions p
           WHERE r.name = $1 AND p.name = $2
           ON CONFLICT DO NOTHING`,
          [role, perm]
        );
      }
    }

    await client.query('COMMIT');
    console.log('RBAC seed applied to test database');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('RBAC seed failed', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
