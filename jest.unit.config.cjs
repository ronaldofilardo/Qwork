const base = require('./jest.config.cjs');

module.exports = (async () => {
  const cfg = await base;
  // Remove global setup/teardown for lightweight unit tests
  cfg.globalSetup = undefined;
  cfg.globalTeardown = undefined;
  cfg.setupFiles = cfg.setupFiles || [];
  cfg.setupFilesAfterEnv = cfg.setupFilesAfterEnv || [];
  // Run only unit tests in __tests__/lib folder by default
  cfg.testMatch = ['**/__tests__/lib/**/*.(test|spec).(js|jsx|ts|tsx)'];
  return cfg;
})();
