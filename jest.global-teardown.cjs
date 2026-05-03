/* Jest global teardown: tenta encerrar conexões do DB para permitir que o Jest finalize */
const { Client } = require('pg');

module.exports = async function globalTeardown() {
  // Intencionalmente NÃO executamos pg_terminate_backend aqui pois isso pode causar
  // erros não tratados em processos worker do Jest. Em vez disso:
  // - Garanta que seus testes fechem pools (usar lib/db.closePool() em globalTeardown/afterAll se necessário)
  // - Ou rode um passo no CI que finalize conexões explicitamente após a suite
  console.log(
    '[jest globalTeardown] noop - skipping aggressive termination to avoid unhandled errors'
  );
};
