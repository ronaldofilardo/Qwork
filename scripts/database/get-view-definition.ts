import { query } from '../lib/db';

async function getViewDef() {
  try {
    const result = await query(
      `SELECT column_name FROM information_schema.columns WHERE table_name='auditoria' ORDER BY ordinal_position`
    );
    console.log(result.rows.map((r) => r.column_name).join(', '));
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    process.exit(0);
  }
}

getViewDef();
