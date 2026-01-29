#!/usr/bin/env node
/*
  scripts/delete-avaliacoes.ts

  Usage (recommended):
    CONFIRM_DELETE=1 node ./scripts/delete-avaliacoes.ts --batch 10000 --bypass-triggers --bypass-rls

  Safety rules:
  - Requires DATABASE_URL in env or --db connection string
  - Will refuse to run against a DB that looks like "production" unless CONFIRM_DELETE=1 or --force is passed
  - By default runs in iterative batches and commits after each batch
  - Supports --dry-run to show what would happen without deleting
  - Supports --bypass-triggers (sets session_replication_role = replica) and --bypass-rls (attempts ALTER TABLE ... DISABLE ROW LEVEL SECURITY)

  IMPORTANT: you confirmed you already took a backup. This script is destructive. Use with care.
*/

import { Client } from 'pg';
import parse from 'pg-connection-string';

function help() {
  console.log(`
Usage:
  DATABASE_URL=... CONFIRM_DELETE=1 node ./scripts/delete-avaliacoes.ts [options]

Options:
  --db <conn>            Database connection string (alternatively use DATABASE_URL)
  --batch <n>            Batch size (default 5000)
  --dry-run              Do not delete, only show counts
  --bypass-triggers      Disable user triggers during the operation (uses session_replication_role = replica)
  --bypass-rls           Attempt to DISABLE ROW LEVEL SECURITY on public.avaliacoes (requires owner/superuser)
  --force                Allow running against databases that do not look like test/dev
  --help                 Show this help
`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const out: any = {
    batch: 5000,
    dryRun: false,
    bypassTriggers: false,
    bypassRLS: false,
    force: false,
  };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--help') {
      out.help = true;
    } else if (a === '--batch') {
      out.batch = Number(args[++i] || 5000);
    } else if (a === '--dry-run') {
      out.dryRun = true;
    } else if (a === '--bypass-triggers') {
      out.bypassTriggers = true;
    } else if (a === '--bypass-rls') {
      out.bypassRLS = true;
    } else if (a === '--db') {
      out.db = args[++i];
    } else if (a === '--force') {
      out.force = true;
    }
  }
  return out;
}

(async () => {
  const args = parseArgs();
  if (args.help) {
    help();
    process.exit(0);
  }

  const conn = args.db || process.env.DATABASE_URL;
  if (!conn) {
    console.error(
      'ERROR: database connection string not provided. set DATABASE_URL or use --db'
    );
    process.exit(1);
  }

  // Validate target DB: refuse unless CONFIRM_DELETE=1 or --force
  const confirm = Boolean(process.env.CONFIRM_DELETE) || args.force;
  const force = args.force;

  const connObj = parse.parse(conn);
  const dbName = connObj.database || '';
  const host = connObj.host || '';

  const looksSafe =
    dbName.includes('_test') ||
    dbName.toLowerCase().includes('test') ||
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.includes('dev') ||
    host.includes('local');

  if (!looksSafe && !confirm) {
    console.error(`
ERROR: Target database (${host}/${dbName}) does not look like a test/dev DB.
If you really want to proceed, set environment variable CONFIRM_DELETE=1 or pass --force.
`);
    process.exit(1);
  }

  console.log(
    `Connecting to ${host}/${dbName} (dryRun=${args.dryRun}, batch=${args.batch})`
  );

  const client = new Client({ connectionString: conn });
  await client.connect();

  // Check that table exists
  const tblRes = await client.query(
    `SELECT to_regclass('public.avaliacoes') as r`
  );
  if (!tblRes.rows[0].r) {
    console.error(
      'ERROR: table public.avaliacoes not found in target database. Aborting.'
    );
    await client.end();
    process.exit(1);
  }

  // Check for RLS policies
  const polRes = await client.query(
    `SELECT count(*)::int as c FROM pg_policy WHERE polrelid = 'public.avaliacoes'::regclass`
  );
  const policyCount = Number(polRes.rows[0].c);
  if (policyCount > 0) {
    console.log(
      `NOTICE: found ${policyCount} RLS policy(ies) on public.avaliacoes.`
    );
    if (!args.bypassRLS) {
      console.log(
        'If you need to ignore RLS, pass --bypass-rls and ensure the connected role has permission to ALTER TABLE.'
      );
    }
  }

  let rlsDisabled = false;
  if (args.bypassRLS) {
    try {
      console.log(
        'Attempting to DISABLE ROW LEVEL SECURITY on public.avaliacoes...'
      );
      await client.query(
        'ALTER TABLE public.avaliacoes DISABLE ROW LEVEL SECURITY'
      );
      rlsDisabled = true;
      console.log('RLS disabled on public.avaliacoes');
    } catch (err: any) {
      console.error(
        'Could not disable RLS (need table owner or superuser). Error:',
        err.message
      );
      console.error(
        'Aborting because --bypass-rls was requested but we could not disable RLS. If you want to continue without disabling RLS, re-run without --bypass-rls or use a role with sufficient privileges.'
      );
      await client.end();
      process.exit(1);
    }
  }

  let originalReplicationRoleSet = false;
  if (args.bypassTriggers) {
    try {
      console.log(
        'Setting session_replication_role = replica (disables user triggers for this session)...'
      );
      await client.query("SET session_replication_role = 'replica'");
      originalReplicationRoleSet = true;
    } catch (err: any) {
      console.error(
        'Could not set session_replication_role. Error:',
        err.message
      );
      console.error('Aborting.');
      if (rlsDisabled)
        await client.query(
          'ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY'
        );
      await client.end();
      process.exit(1);
    }
  }

  try {
    let totalDeleted = 0;
    if (args.dryRun) {
      const countRes = await client.query(
        'SELECT count(*)::int as c FROM public.avaliacoes'
      );
      console.log(
        `DRY-RUN: would delete ${countRes.rows[0].c} rows from public.avaliacoes`
      );
    } else {
      while (true) {
        // Delete in small transactions to reduce lock time
        await client.query('BEGIN');
        const del = await client.query(
          `WITH to_delete AS (SELECT ctid FROM public.avaliacoes LIMIT $1) DELETE FROM public.avaliacoes WHERE ctid IN (SELECT ctid FROM to_delete) RETURNING 1`,
          [args.batch]
        );
        await client.query('COMMIT');
        const deleted = del.rowCount;
        totalDeleted += deleted;
        console.log(`Deleted ${deleted} rows (total ${totalDeleted})`);
        if (deleted === 0) break;
        // small pause to let DB breathe
        await new Promise((r) => setTimeout(r, 100));
      }
      console.log(
        `DONE: total deleted ${totalDeleted} rows from public.avaliacoes`
      );
    }

    // If you need to delete related data (e.g., resultados/attachments referencing avaliacao), run appropriate queries here or extend the script.
  } catch (err: any) {
    console.error('Error during deletion:', err.message);
    console.error('Attempting to restore session state...');
  } finally {
    if (originalReplicationRoleSet) {
      try {
        await client.query("SET session_replication_role = 'origin'");
      } catch (e) {
        /* noop */
      }
    }
    if (rlsDisabled) {
      try {
        await client.query(
          'ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY'
        );
      } catch (e) {
        console.error('Could not re-enable RLS:', e.message);
      }
    }
    await client.end();
  }

  process.exit(0);
})();
