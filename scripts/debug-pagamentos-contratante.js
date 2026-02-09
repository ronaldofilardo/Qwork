import { query } from '../lib/db.js';

(async () => {
  try {
    const r = await query(
      `SELECT id, tomador_id, valor, status, data_pagamento, numero_parcelas FROM pagamentos WHERE tomador_id = $1 ORDER BY data_pagamento DESC NULLS LAST, criado_em DESC LIMIT 10`,
      [56]
    );
    console.log('pagamentos:', JSON.stringify(r.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
})();
