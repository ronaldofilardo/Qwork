/* Jest global teardown: tenta encerrar conexões do DB para permitir que o Jest finalize */
const { Client } = require('pg');

module.exports = async function globalTeardown() {
  console.log('[jest globalTeardown] Cleanup started');

  // If we started a Docker container for tests, stop and remove it
  try {
    const infoPath = require('path').resolve(
      __dirname,
      '.test_container_info.json'
    );
    const fs = require('fs');
    if (fs.existsSync(infoPath)) {
      const info = JSON.parse(fs.readFileSync(infoPath, 'utf-8'));
      const containerId = info.containerId;
      if (containerId) {
        console.log(
          '[jest globalTeardown] Stopping test container:',
          containerId
        );
        try {
          const { execSync } = require('child_process');
          execSync(`docker stop ${containerId}`);
          execSync(`docker rm ${containerId}`);
          console.log(
            '[jest globalTeardown] Test container stopped and removed'
          );
        } catch (dockerErr) {
          console.warn(
            '[jest globalTeardown] Falha ao parar/remover container Docker:',
            dockerErr.message || dockerErr
          );
        }
      }
      // remove the info file
      try {
        fs.unlinkSync(infoPath);
      } catch (e) {}
    }
  } catch (err) {
    console.warn(
      '[jest globalTeardown] Erro durante cleanup de container:',
      err.message || err
    );
  }

  console.log(
    '[jest globalTeardown] noop - skipping aggressive termination to avoid unhandled errors'
  );
};
