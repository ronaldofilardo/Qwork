import { query } from '../lib/db';

(async function () {
  try {
    const res = await query('SELECT now() as now, version() as ver');
    console.log('OK, connected: ', JSON.stringify(res.rows[0]));
  } catch (err) {
    console.error('CONN ERR:', err);
  }
})();
