# DATABASE-POLICY.md

> **Fonte de verdade**: [policies/DATABASE-POLICY.md](policies/DATABASE-POLICY.md)
>
> Este documento complementa a política principal com detalhes específicos do modo emissor.

## Ambientes e Bancos

| Ambiente | Banco            | Host           | Var de Conexão       |
| -------- | ---------------- | -------------- | -------------------- |
| DEV      | `nr-bps_db`      | localhost:5432 | `LOCAL_DATABASE_URL` |
| TEST     | `nr-bps_db_test` | localhost:5432 | `TEST_DATABASE_URL`  |
| STAGING  | `neondb_staging` | Neon Cloud     | `DATABASE_URL`       |
| PRODUÇÃO | `neondb`         | Neon Cloud     | `DATABASE_URL`       |

## Regras Obrigatórias

### DESENVOLVIMENTO

- DEV usa `LOCAL_DATABASE_URL` → `nr-bps_db` (localhost)
- **Exceção autorizada — Modo Emissor**: `ALLOW_PROD_DB_LOCAL=true` + `EMISSOR_CPF=53051173991`
  - Permite que o emissor acesse o banco de PRODUÇÃO (Neon) localmente, para emitir laudos via Puppeteer local
  - O guard em `lib/db.ts` bloqueia qualquer sessão cujo CPF ≠ `EMISSOR_CPF`
  - `ALLOW_PROD_DB_LOCAL=true` **NUNCA** deve estar ativo sem `EMISSOR_CPF`

### TESTES

- Testes usam **exclusivamente** `TEST_DATABASE_URL` → `nr-bps_db_test`
- `jest.setup.js` **remove** `DATABASE_URL`, `LOCAL_DATABASE_URL` e `ALLOW_PROD_DB_LOCAL` antes de cada teste
- Testes **NUNCA** devem acessar `nr-bps_db` (DEV) nem `neondb` (PROD)

### PRODUÇÃO / STAGING

- Conecta via `DATABASE_URL` (Neon Cloud)
- `LOCAL_DATABASE_URL` e `TEST_DATABASE_URL` são ignorados

## Guard de Segurança Runtime

Arquivo: `lib/db.ts` — função `query()`

```typescript
// Guard: bloqueia qualquer sessão cujo CPF não seja o do emissor autorizado
if (
  isDevelopment &&
  process.env.ALLOW_PROD_DB_LOCAL === 'true' &&
  process.env.EMISSOR_CPF &&
  session &&
  session.cpf !== process.env.EMISSOR_CPF
) {
  throw new Error(`🚨 ACESSO BLOQUEADO: CPF ${session.cpf} não autorizado`);
}
```

## Ciclo de Vida do Laudo (Estado Machine)

```
rascunho → emitido (PDF gerado com Puppeteer local) → enviado (arquivo no bucket Backblaze)
```

- `emitido`: `lib/laudo-auto.ts` gera PDF localmente, salva em `storage/laudos/`, calcula SHA-256
- `enviado`: `POST /api/emissor/laudos/[loteId]/upload` envia ao bucket, seta `status='enviado'` + `enviado_em=NOW()`

## Arquivos de Configuração

- `.env` — Base (commitado sem segredos, inclui `LOCAL_DATABASE_URL` e `DATABASE_URL`)
- `.env.local` — Sobreposição local (NÃO commitado, pode ter `ALLOW_PROD_DB_LOCAL=true` + `EMISSOR_CPF`)
- `.env.test` — Variáveis de teste (inclui `TEST_DATABASE_URL`)
- `.env.emissor.local` — Configuração específica do emissor (NÃO commitado)
