# Correção: Pre-commit travando em PRs grandes (2026-01-22)

Resumo:

- Implementado `scripts/lint-staged-chunked.mjs` para dividir a execução do eslint em chunks e evitar OOM/SIGKILL em PRs grandes;
- Introduzido `eslint_d` (daemon) para reduzir custo de startup do ESLint nos hooks;
- Atualizado `lint-staged` para usar o script chunked e desabilitada execução concorrente (`concurrent: false`);
- Adicionados scripts `lint:staged:chunked` e `lint:staged:daemon` para uso local;
- Documentado o fluxo em `docs/contributing/linting.md` e referenciado em `docs/policies/CONVENCOES.md`.

Como validar localmente:

1. Instale dependências: `pnpm install`
2. Reinicie o daemon (opcional): `pnpm run eslint:d:restart`
3. Rodar lint chunked localmente: `pnpm run lint:staged:chunked` (ou `pnpm run lint:staged:daemon` para usar `eslint_d`)

Notas:

- Este PR melhora a confiabilidade do workflow local; o CI continuará a executar lint completo e barrará merges quando houver erros.
