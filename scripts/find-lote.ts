import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { query } from '@/lib/db';

async function main() {
  const codigo = '007-260126';
  console.log('Procurando lotes com código like:', codigo);
  const res = await query(
    'SELECT id, codigo, titulo FROM lotes_avaliacao WHERE codigo ILIKE $1',
    [`%${codigo}%`]
  );
  console.log('Encontrados:', res.rowCount);
  for (const r of res.rows) console.log(r);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
