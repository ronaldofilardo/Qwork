# Armazenamento de Laudos (PDF)

Visão geral

- A partir de 2026-01-06 a aplicação **não persiste** o binário do PDF (`arquivo_pdf`) no banco de dados.
- Os PDFs gerados pelos emissores são armazenados **localmente** em: `storage/laudos/laudo-<laudoId>.pdf`.
- Metadados do laudo (hash SHA-256, timestamp e nome do arquivo) são gravados em `storage/laudos/laudo-<laudoId>.json`.

Motivação

- Reduzir o tamanho do banco e manter o banco sem campos binários pesados.
- Facilitar a integração com storage externo (S3, GCS) no futuro sem bloquear o fluxo atual.

Formato dos metadados (exemplo `laudo-123.json`)

{
  "arquivo": "laudo-123.pdf",
  "hash": "<sha256-hex>",
  "criadoEm": "2026-01-06T19:00:00.000Z"
}

Comportamento atual (Resumo técnico)

- Geração (FASE 1)
  - A função de emissão gera o PDF (Puppeteer) e o grava em `storage/laudos/laudo-<id>.pdf`.
  - Calcula o hash SHA-256 do PDF e escreve `laudo-<id>.json` com metadados.
  - Atualiza `laudos` no banco apenas com metadados (status, timestamps), **sem** gravar o binário.

- Envio (FASE 2)
  - A rotina de envio lê o PDF de `storage/laudos` e calcula/verifica o hash antes de marcar como `enviado`.
  - Se o arquivo local estiver ausente ou corrompido, a rotina registra erro e notifica administradores.

Backfill e migração

- Há um script de backfill em `scripts/backfill/laudos-backfill.ts` que:
  - Localiza laudos com `arquivo_pdf`/`hash_pdf` no DB,
  - Exporta o PDF para `storage/laudos` e grava `laudo-<id>.json` com hash (recalcula se necessário),
  - Pode opcionalmente (com `--apply`) limpar os campos binários do DB após export.

- Após validação do backfill, existe uma migration SQL em `database/migrations/070_remove_laudo_binary_columns.sql` para remover permanentemente as colunas binárias do schema.

Testes e QA

- Os testes unitários e de integração foram atualizados para:
  - Não depender de `arquivo_pdf`/`hash_pdf` no DB;
  - Validar leitura do arquivo em `storage/laudos` e verificação de hash via `laudo-<id>.json`.

Próximos passos / Integração futura

- Implementar integração com storage de objetos (S3/GCS) e adicionar configuração para alternar entre `local` e `remote`.
- Implementar políticas de retenção e backup dos arquivos no storage escolhido.
- Opcional: adicionar verificação periódica de integridade (cron job) para comparar hash dos arquivos locais com metadados.

---

Se precisar que eu faça o backfill em um ambiente de staging ou gere a migration removendo colunas, posso continuar com isso.