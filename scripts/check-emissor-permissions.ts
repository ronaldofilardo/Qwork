import { loadEnv } from './load-env';
loadEnv();

import { query } from '../lib/db';

async function checkPermissions() {
  try {
    const res = await query(`
      SELECT p.name, p.resource, p.action, p.description
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      JOIN roles r ON r.id = rp.role_id
      WHERE r.name = 'emissor'
      ORDER BY p.name
    `);

    console.log('Permissões associadas ao role "emissor":', res.rowCount);
    console.table(res.rows);
  } catch (err: any) {
    console.error('Erro ao consultar permissões:', err.message || err);
    process.exit(1);
  }
}

checkPermissions().catch((e) => {
  console.error(e);
  process.exit(1);
});
