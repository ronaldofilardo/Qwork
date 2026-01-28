import pg from "pg";

const client = new pg.Client({
  host: "localhost",
  port: 5432,
  database: "nr-bps_db",
  user: "postgres",
  password: "123456",
});

(async () => {
  try {
    await client.connect();
    const res = await client.query(`
      SELECT pg_get_functiondef((SELECT oid FROM pg_proc WHERE proname = 'detectar_anomalias_indice'))
    `);
    console.log(res.rows[0].pg_get_functiondef);
  } catch (error) {
    console.error(error);
  } finally {
    await client.end();
  }
})();
