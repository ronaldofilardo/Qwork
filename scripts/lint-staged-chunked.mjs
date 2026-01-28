#!/usr/bin/env node
/*
  scripts/lint-staged-chunked.mjs

  Recebe argumentos: <command> <file1> <file2> ...
  Exemplo no lint-staged: "node scripts/lint-staged-chunked.mjs eslint_d --fix"

  O script divide a lista de arquivos em chunks (default 30) e executa o comando
  por chunk, evitando OOM ou processos muito longos em grandes PRs.
*/
import { spawnSync } from 'child_process';
import path from 'path';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error(
    'Usage: node scripts/lint-staged-chunked.mjs <cmd> <args...> <file...>'
  );
  process.exit(1);
}

// Encontrar separador entre comando+args e arquivos (arquivos normalmente começam com ./ ou sem prefixo)
// Estratégia simples: assumir que os últimos argumentos são arquivos; como lint-staged passa os arquivos por fim,
// vamos encontrar o primeiro argumento que corresponde a um arquivo (contendo a extensão). Se nenhum, assumimos os últimos args são os arquivos passados via stdin (não suportado aqui).

// Procurar primeiro token que contém a dot-extension (.
const fileStartIndex = args.findIndex((a) =>
  /\.(js|jsx|ts|tsx|json|md)$/.test(a)
);

let cmdAndArgs = [];
let files = [];
if (fileStartIndex === -1) {
  // fallback: se não detectamos arquivos, consideramos que todos os restantes args são arquivos
  // Ex: lint-staged chama: node scripts/lint-staged-chunked.mjs eslint_d --fix <file...>
  // Neste caso vamos ler arquivos da variável de ambiente LINT_STAGED_FILES (compatibilidade)
  const envList = process.env.LINT_STAGED_FILES;
  if (envList) {
    files = envList.split('\n').filter(Boolean);
    cmdAndArgs = args;
  } else {
    // Não há arquivos - nada a fazer
    process.exit(0);
  }
} else {
  cmdAndArgs = args.slice(0, fileStartIndex);
  files = args.slice(fileStartIndex);
}

if (files.length === 0) {
  process.exit(0);
}

const CHUNK_SIZE = parseInt(process.env.LINT_STAGED_CHUNK_SIZE || '30', 10);

function runChunk(chunk) {
  let fullCmd = cmdAndArgs.concat(chunk);

  // Add --max-warnings to allow warnings without failing the process
  if (fullCmd[0] === 'eslint' || fullCmd[0] === 'eslint_d') {
    if (!fullCmd.includes('--max-warnings')) {
      fullCmd.splice(1, 0, '--max-warnings', '1000');
    }
    // Use pnpm exec for eslint commands
    fullCmd = ['pnpm', 'exec', ...fullCmd];
  }

  console.log('> Executando:', fullCmd.join(' '));

  let proc = spawnSync(fullCmd[0], fullCmd.slice(1), {
    stdio: 'inherit',
    cwd: process.cwd(),
    shell: process.platform === 'win32',
  });

  if (proc.status !== 0) {
    // If the primary command is eslint_d and it failed (sometimes transient daemon start errors),
    // retry with the standard 'eslint' binary as a fallback to avoid blocking commits.
    if (cmdAndArgs[0] === 'eslint_d') {
      console.warn(
        `warning: '${cmdAndArgs.join(' ')}' failed; retrying this chunk with 'eslint' as fallback...`
      );
      const fallbackCmd = [
        'pnpm',
        'exec',
        'eslint',
        '--max-warnings',
        '1000',
        ...cmdAndArgs.slice(1),
        ...chunk,
      ];
      console.log('> Executando (fallback):', fallbackCmd.join(' '));
      proc = spawnSync(fallbackCmd[0], fallbackCmd.slice(1), {
        stdio: 'inherit',
        cwd: process.cwd(),
        shell: process.platform === 'win32',
      });
      if (proc.status !== 0) {
        process.exit(proc.status);
      }
      return;
    }

    process.exit(proc.status);
  }
}

for (let i = 0; i < files.length; i += CHUNK_SIZE) {
  const chunk = files.slice(i, i + CHUNK_SIZE);
  runChunk(chunk);
}

process.exit(0);
