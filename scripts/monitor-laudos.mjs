import fs from 'fs';
import path from 'path';
import { Client } from 'pg';

const LOG_DIR = path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'monitor-laudos.log');
const INTERVAL_MS = process.env.MONITOR_INTERVAL_MS
  ? Number(process.env.MONITOR_INTERVAL_MS)
  : 1000;
const LOTE_ID = process.env.LOTE_ID ? Number(process.env.LOTE_ID) : null;

if (!process.env.DATABASE_URL) {
  console.error(
    'Erro: variável DATABASE_URL não encontrada no ambiente. Exporte DATABASE_URL e reexecute.'
  );
  process.exit(1);
}

if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

function append(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(LOG_FILE, line);
}

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function poll() {
  try {
    const activityQ = `SELECT pid, usename, query, state, xact_start, query_start
      FROM pg_stat_activity
      WHERE query ILIKE '%laudos%' OR xact_start > now() - interval '2 minute'
      ORDER BY query_start DESC`;

    const locksQ = `SELECT l.mode, a.pid, a.usename, a.query, a.query_start
      FROM pg_locks l
      JOIN pg_stat_activity a ON l.pid = a.pid
      WHERE a.query ILIKE '%laudos%' OR l.relation = 'laudos'::regclass`;

    const recentLaudosQ = `SELECT id, lote_id, status, criado_em, emitido_em, emissor_cpf
      FROM laudos
      WHERE criado_em > now() - interval '5 minute'
      ORDER BY criado_em DESC`;

    const auditQ = `SELECT id, user_cpf, action, resource, resource_id, details, created_at FROM audit_logs
      WHERE action = 'liberar_lote' OR resource = 'lotes_avaliacao'
      ORDER BY id DESC LIMIT 20`;

    const results = await Promise.all([
      client.query(activityQ),
      client.query(locksQ),
      client.query(recentLaudosQ),
      client.query(auditQ),
    ]);

    const [activity, locks, laudos, audit] = results;

    append('--- SNAPSHOT START ---');
    append(`pg_stat_activity rows: ${activity.rowCount}`);
    for (const r of activity.rows) {
      append(
        `ACT: pid=${r.pid} user=${r.usename} start=${r.query_start} state=${r.state} query=${String(r.query).slice(0, 500)}`
      );
    }

    append(`pg_locks rows: ${locks.rowCount}`);
    for (const r of locks.rows) {
      append(
        `LOCK: mode=${r.mode} pid=${r.pid} user=${r.usename} start=${r.query_start} query=${String(r.query).slice(0, 300)}`
      );
    }

    append(`recent laudos rows: ${laudos.rowCount}`);
    for (const r of laudos.rows) {
      append(
        `LAUDO: id=${r.id} lote_id=${r.lote_id} status=${r.status} criado_em=${r.criado_em} emissor=${r.emissor_cpf}`
      );
    }

    append(`audit logs rows: ${audit.rowCount}`);
    for (const r of audit.rows) {
      append(
        `AUDIT: id=${r.id} user=${r.user_cpf} action=${r.action} resource=${r.resource} resource_id=${r.resource_id} created_at=${r.created_at}`
      );
    }

    if (LOTE_ID) {
      const loteQ = `SELECT id, codigo, clinica_id, empresa_id, liberado_em, numero_ordem FROM lotes_avaliacao WHERE id = $1`;
      const loteRes = await client.query(loteQ, [LOTE_ID]);
      append(`lote ${LOTE_ID} rows: ${loteRes.rowCount}`);
      for (const r of loteRes.rows) append(`LOTE: ${JSON.stringify(r)}`);

      const laudoByLoteQ = `SELECT id, status, criado_em, emitido_em, emissor_cpf FROM laudos WHERE id = $1 OR lote_id = $1`;
      const laudoByLote = await client.query(laudoByLoteQ, [LOTE_ID]);
      append(`laudos for lote ${LOTE_ID}: ${laudoByLote.rowCount}`);
      for (const r of laudoByLote.rows)
        append(`LAUDO-BY-LOTE: ${JSON.stringify(r)}`);
    }

    append('--- SNAPSHOT END ---\n');
  } catch (err) {
    append(`ERROR polling: ${err instanceof Error ? err.stack : String(err)}`);
  }
}

(async () => {
  try {
    await client.connect();
    append('Monitor iniciado');
    // Initial immediate poll
    await poll();
    // Poll repeatedly
    const id = setInterval(poll, INTERVAL_MS);

    process.on('SIGINT', async () => {
      append('SIGINT recebido: encerrando monitor');
      clearInterval(id);
      await client.end().catch(() => {});
      process.exit(0);
    });
  } catch (e) {
    append(
      `Erro inicializando monitor: ${e instanceof Error ? e.stack : String(e)}`
    );
    process.exit(1);
  }
})();
