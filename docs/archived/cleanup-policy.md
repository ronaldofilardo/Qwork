# Política de Higienização da Raiz do Repositório

Resumo das ações automáticas executadas:

- Arquivos de backup (ex: `backup_nr-bps_db.dump`) movidos para `storage/backups/`.
- Logs de build movidos para `logs/build/`.
- Saídas de testes movidas para `logs/tests/`.
- Scripts utilitários e ferramentas movidos para `scripts/tools/`.
- Scripts temporários SQL movidos para `scripts/fixes/`.
- Arquivos de cookies e arquivos sensíveis movidos para `storage/backups/secure/` e adicionados ao `.gitignore`.

Recomendações:

- Evitar comitar arquivos sensíveis; se já existirem no histórico, considerar política de remoção (BFG/git filter-repo).
- Usar `pnpm run clean:root -- --dry-run` para revisar o que seria movido antes de executar de fato.
- Colocar processos de CI para verificar a raiz do repo e bloquear commits que adicionem arquivos temporários/sensíveis.
