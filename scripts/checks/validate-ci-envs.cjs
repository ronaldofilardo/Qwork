#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const workflowsDir = path.join(__dirname, '..', '..', '.github', 'workflows');

if (!fs.existsSync(workflowsDir)) {
  console.log('No workflows directory found, skipping CI env validation.');
  process.exit(0);
}

const files = fs
  .readdirSync(workflowsDir)
  .filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'));
let hasError = false;

function checkLine(filename, line, lineno) {
  // Allow self-check lines in our validate workflow to avoid false-positives
  if (
    filename === 'validate-env-segregation.yml' &&
    (line.includes('Fail if .env.test') ||
      line.includes("grep -E '^\\s*DATABASE_URL") ||
      line.includes('ERROR: .env.test contains'))
  ) {
    return;
  }

  // Look for env assignments
  const matchTest = line.match(
    /TEST_DATABASE_URL\s*:\s*(?:['\"])?([^#\n'\"]+)(?:['\"])?/i
  );
  if (matchTest) {
    const val = matchTest[1].trim();
    if (val.includes('/nr-bps_db') && !val.includes('_test')) {
      console.error(
        `ERROR: ${filename}:${lineno} TEST_DATABASE_URL points to development DB (nr-bps_db) -> ${val}`
      );
      hasError = true;
    }
  }

  const matchDb = line.match(
    /DATABASE_URL\s*:\s*(?:['\"])?([^#\n'\"]+)(?:['\"])?/i
  );
  if (matchDb) {
    const val = matchDb[1].trim();
    if (val.includes('_test') && !val.includes('_test')) {
      // unreachable, but keep for parity
    }
    if (val.includes('/nr-bps_db_test') && filename.includes('dev')) {
      console.error(
        `ERROR: ${filename}:${lineno} DATABASE_URL points to test DB in a dev workflow -> ${val}`
      );
      hasError = true;
    }
  }

  const matchLocal = line.match(
    /LOCAL_DATABASE_URL\s*:\s*(?:['\"])?([^#\n'\"]+)(?:['\"])?/i
  );
  if (matchLocal) {
    const val = matchLocal[1].trim();
    if (val.includes('_test')) {
      console.error(
        `ERROR: ${filename}:${lineno} LOCAL_DATABASE_URL points to a test DB -> ${val}`
      );
      hasError = true;
    }
  }

  // Generic checks: avoid introducing test variables in general-purpose workflows
  const lower = line.toLowerCase();
  const fileLower = filename.toLowerCase();
  const isTestWorkflow =
    fileLower.includes('test') ||
    fileLower.includes('ci') ||
    fileLower.includes('e2e') ||
    fileLower.includes('integration') ||
    fileLower.includes('cypress');

  if (
    lower.includes('test_database_url') ||
    lower.includes('local_database_url') ||
    lower.includes('database_url')
  ) {
    // For test workflows (e.g., e2e, integration), explicit TEST_DATABASE_URL -> nr-bps_db_test is expected and allowed
    // But ensure nobody sets TEST_DATABASE_URL to the development DB (nr-bps_db)
    if (isTestWorkflow) {
      // already checked TEST_DATABASE_URL -> nr-bps_db above; nothing else to do here
      return;
    }

    // For non-test workflows, flag suspicious usages that reference test DBs or dev DBs incorrectly
    if (lower.includes('_test') || lower.includes('nr-bps_db')) {
      console.error(
        `ERROR: ${filename}:${lineno} suspicious DB env var in non-test workflow -> ${line.trim()}`
      );
      hasError = true;
    }
  }
}

// Additionally, check root .env.test file for dangerous DB variables
const envTestPath = path.join(__dirname, '..', '..', '.env.test');
if (fs.existsSync(envTestPath)) {
  const envContent = fs.readFileSync(envTestPath, 'utf8');
  const envLines = envContent.split(/\r?\n/);
  envLines.forEach((line, i) => {
    const trimmed = line.split('#')[0].trim();
    if (!trimmed) return;
    const m = trimmed.match(
      /^([A-Z0-9_]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(.*))$/i
    );
    if (!m) return;
    const key = m[1];
    const val = (m[2] || m[3] || m[4] || '').trim();

    if (
      ['DATABASE_URL', 'TEST_DATABASE_URL', 'LOCAL_DATABASE_URL'].includes(key)
    ) {
      if (val.includes('nr-bps_db') && !val.includes('_test')) {
        console.error(
          `ERROR: .env.test:${i + 1} ${key} points to development DB (nr-bps_db) -> ${val}`
        );
        hasError = true;
      }
    }
  });
}

files.forEach((file) => {
  const full = path.join(workflowsDir, file);
  const content = fs.readFileSync(full, 'utf8');
  const lines = content.split(/\r?\n/);
  lines.forEach((line, i) => checkLine(file, line, i + 1));
});

if (hasError) {
  console.error(
    '\nCI ENV VALIDATION FAILED: Fix the reported issues before merging.'
  );
  process.exit(2);
}

console.log(
  'CI ENV VALIDATION OK: No suspicious DB env variables found in workflows.'
);
process.exit(0);
