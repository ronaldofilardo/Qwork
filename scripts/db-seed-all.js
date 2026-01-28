#!/usr/bin/env node
import { execSync } from 'child_process';
import { readdirSync } from 'fs';
import path from 'path';

const seedsDir = path.resolve(
  new URL(import.meta.url).pathname,
  '../database/seeds'
);
const files = readdirSync(seedsDir).filter((f) => f.endsWith('.sql'));

if (files.length === 0) {
  console.log('No seed files found in', seedsDir);
  process.exit(0);
}

console.log('Applying seeds to nr-bps_db (local)...');
for (const file of files) {
  const filePath = path.join(seedsDir, file);
  console.log('Applying seed:', filePath);
  try {
    execSync(
      `psql -U postgres -h localhost -p 5432 -d nr-bps_db -f "${filePath}"`,
      { stdio: 'inherit' }
    );
  } catch (err) {
    const msg =
      err && typeof err === 'object' && 'message' in err
        ? err.message
        : String(err);
    console.error('Seed failed for', filePath, msg);
    process.exit(1);
  }
}

console.log('All seeds applied successfully.');
