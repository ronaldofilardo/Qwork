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
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name = 'audit_logs'
    `);
    console.log("Tabela audit_logs existe:", res.rows.length > 0);
  } catch (error) {
    console.error(error);
  } finally {
    await client.end();
  }
})();
