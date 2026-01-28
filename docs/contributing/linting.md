# Linting & pre-commit (Rápido)

Este documento explica as mudanças no pre-commit e como trabalhar com PRs grandes sem travar o processo local.

## Por que mudou

Quando um PR altera dezenas ou centenas de arquivos, o pre-commit (lint-staged + eslint) pode consumir muita memória e tempo, às vezes resultando em processos finalizados (SIGKILL). Para evitar isso implementamos um script que executa o linter em **chunks** menores e passamos a usar `eslint_d` (daemon) para reduzir latência.

## O que foi adicionado

- `scripts/lint-staged-chunked.mjs` — divide a lista de arquivos em blocos (30 por padrão) e executa o linter por chunk.
- Uso de `eslint_d` (daemon) no fluxo de pre-commit para reduzir custos de inicialização.
- `package.json`:
  - `lint:staged:chunked` — utilitário local para rodar lint em staged files usando cache
  - `lint:staged:daemon` — reinicia `eslint_d` e roda o chunked script com `eslint_d` (argumento usado pelo pre-commit)
- Atualizamos `lint-staged` para executar o script chunked e desativamos execução concorrente (`concurrent: false`).

## Como usar localmente

- Para rodar o lint em arquivos staged (chunked + cache):

  pnpm run lint:staged:chunked

- Para usar o daemon (mais rápido) e rodar o fluxo usado no pre-commit:

  pnpm run lint:staged:daemon

- Se houver emergência (não recomendamos para merges finais), você pode ignorar o hook localmente e commitar com:

  git commit -m "WIP: ..." --no-verify

  Avise no PR e abra uma issue/tarefa para corrigir as violações de lint posteriormente.

## Configuração

- O tamanho do chunk pode ser alterado com a variável de ambiente `LINT_STAGED_CHUNK_SIZE` (p.ex. `export LINT_STAGED_CHUNK_SIZE=50`).

## CI

- A política é que o CI continue executando lint completo (sem chunk) e deverá barrar merges quando houver erros. O pre-commit local foi tornada menos propensa a travar o desenvolvedor, mas a qualidade permanece garantida pelo CI.
