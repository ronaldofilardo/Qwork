#!/usr/bin/env node
// Listener simples que aguarda NOTIFY 'refresh_mv_admin' e executa REFRESH MATERIALIZED VIEW CONCURRENTLY
// Uso: DATABASE_URL ou LOCAL_DATABASE_URL no ambiente. Rodar como serviço (systemd/docker) para persistência.

const { Client } = require('pg');

const CHANNEL = 'refresh_mv_admin';
const VIEW_NAME = 'mv_admin_contratante_dashboard';
const DEBOUNCE_MS = 5000; // aguarda N ms antes de executar o refresh (agrupa notificações)

// Conexão para LISTEN (não usar a mesma para executar refresh porque LISTEN ocupa a conexão)
const listenerConnString =
  process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL;
if (!listenerConnString) {
  console.error('ERRO: defina DATABASE_URL ou LOCAL_DATABASE_URL no ambiente');
  process.exit(1);
}

const listenClient = new Client({ connectionString: listenerConnString });
let refreshTimer = null;
let refreshing = false;

async function scheduleRefresh(payload) {
  if (refreshing) {
    console.log('Refresh já em andamento, ignorando agendamento adicional');
    return;
  }

  if (refreshTimer) clearTimeout(refreshTimer);
  refreshTimer = setTimeout(async () => {
    refreshTimer = null;
    await doRefresh();
  }, DEBOUNCE_MS);

  console.log('Refresh agendado em', DEBOUNCE_MS, 'ms; payload=', payload);
}

async function doRefresh() {
  console.log(
    new Date().toISOString(),
    'Iniciando REFRESH MATERIALIZED VIEW',
    VIEW_NAME
  );
  refreshing = true;
  const execClient = new Client({ connectionString: listenerConnString });
  try {
    await execClient.connect();
    // Executa com CONCURRENTLY para evitar locks, se possível
    await execClient.query(
      `REFRESH MATERIALIZED VIEW CONCURRENTLY ${VIEW_NAME};`
    );
    console.log(new Date().toISOString(), 'Refresh concluído com sucesso');
  } catch (err) {
    console.error(
      'Erro ao executar refresh:',
      err && err.message ? err.message : err
    );
    // Em caso de erro (por exemplo, view sem index para CONCURRENTLY), tentar sem CONCURRENTLY
    try {
      console.log('Tentando REFRESH sem CONCURRENTLY...');
      await execClient.query(`REFRESH MATERIALIZED VIEW ${VIEW_NAME};`);
      console.log('Refresh (sem CONCURRENTLY) concluído');
    } catch (err2) {
      console.error(
        'Falha ao tentar refresh sem CONCURRENTLY:',
        err2 && err2.message ? err2.message : err2
      );
    }
  } finally {
    refreshing = false;
    try {
      await execClient.end();
    } catch (e) {}
  }
}

async function start() {
  listenClient.on('notification', async (msg) => {
    try {
      console.log(
        new Date().toISOString(),
        'Notificação recebida:',
        msg.channel,
        msg.payload
      );
      await scheduleRefresh(msg.payload);
    } catch (err) {
      console.error('Erro no handler de notificação:', err);
    }
  });

  listenClient.on('error', (err) => {
    console.error('Listener connection error:', err);
  });

  try {
    await listenClient.connect();
    await listenClient.query(`LISTEN ${CHANNEL}`);
    console.log('Listening on channel', CHANNEL);
  } catch (err) {
    console.error(
      'Erro ao conectar/listen:',
      err && err.message ? err.message : err
    );
    process.exit(1);
  }

  // Graceful shutdown
  const shutdown = async () => {
    console.log('Shutdown requested');
    try {
      if (refreshTimer) clearTimeout(refreshTimer);
    } catch (e) {}
    try {
      await listenClient.end();
    } catch (e) {}
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((err) => {
  console.error('Erro fatal no listener:', err);
  process.exit(1);
});
