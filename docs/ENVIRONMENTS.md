# Matriz de Ambientes — QWork

> **Status**: Vigente — atualizar ao adicionar variáveis ou mudar política de banco.  
> **Última revisão**: 28/03/2026

---

## Visão Geral

O projeto opera com **4 ambientes** diferenciados por duas variáveis em conjunto:

| Ambiente    | `NODE_ENV`    | `APP_ENV`                  | Banco de Dados   | Host           | URL Pública            |
| ----------- | ------------- | -------------------------- | ---------------- | -------------- | ---------------------- |
| **DEV**     | `development` | `development` (ou ausente) | `nr-bps_db`      | localhost:5432 | `localhost:3000`       |
| **TEST**    | `test`        | `test` (ou ausente)        | `nr-bps_db_test` | localhost:5432 | —                      |
| **STAGING** | `production`  | `staging`                  | `neondb_staging` | Neon Cloud     | `staging.qwork.app.br` |
| **PROD**    | `production`  | `production`               | `neondb`         | Neon Cloud     | `qwork.app.br`         |

> **Por que NODE_ENV=production para staging?**  
> Next.js usa `NODE_ENV=production` para otimizar o build (tree-shaking, minificação,
> desabilitação de React DevTools). Compartilhar `NODE_ENV=production` entre staging e
> produção garante que o artefato de staging seja idêntico ao de produção.  
> `APP_ENV` é o diferenciador de comportamento de negócio.

---

## Regras de Isolamento (Guards)

### Guard Bidirecional Staging ↔ Production (`lib/db/connection.ts`)

```
APP_ENV=staging  + DATABASE_URL sem "neondb_staging" → ERRO CRÍTICO (throw)
APP_ENV=production + DATABASE_URL com "neondb_staging" → ERRO CRÍTICO (throw)
```

Isso garante que **nunca** há contaminação cruzada entre os bancos de staging e produção.

### Guard Test → Neon (`lib/db/connection.ts`)

```
NODE_ENV=test + DATABASE_URL contendo "neon.tech" → ERRO CRÍTICO (throw)
```

### Guard Test → DEV (`lib/db/query.ts`)

```
NODE_ENV=test + banco "nr-bps_db" (sem _test) → ERRO CRÍTICO (throw)
NODE_ENV=development + banco "nr-bps_db_test" → ERRO CRÍTICO (throw)
```

---

## Variáveis Obrigatórias por Ambiente

### DEV (`.env.local`)

| Variável               | Obrigatória | Exemplo                                                 | Observação                                                |
| ---------------------- | ----------- | ------------------------------------------------------- | --------------------------------------------------------- |
| `NODE_ENV`             | ✅          | `development`                                           | Definida em `.env` base                                   |
| `LOCAL_DATABASE_URL`   | ✅          | `postgresql://postgres:123456@localhost:5432/nr-bps_db` | Banco local DEV                                           |
| `SESSION_SECRET`       | ✅          | string aleatória                                        | Segredo de sessão local                                   |
| `ASAAS_API_KEY`        | ✅          | `$aact_hmlg_...`                                        | Sandbox Asaas                                             |
| `ASAAS_API_URL`        | ✅          | `https://api-sandbox.asaas.com/v3`                      | Sempre sandbox em DEV                                     |
| `ASAAS_WEBHOOK_SECRET` | ✅          | string                                                  | Token webhook DEV (ngrok)                                 |
| `NEXT_PUBLIC_APP_URL`  | ✅          | `http://localhost:3000`                                 | URL local                                                 |
| `APP_ENV`              | ❌          | ausente                                                 | Não definir — será `undefined` (tratado como development) |

### TEST (`.env.test`)

| Variável            | Obrigatória | Exemplo                                                      | Observação                             |
| ------------------- | ----------- | ------------------------------------------------------------ | -------------------------------------- |
| `NODE_ENV`          | ✅          | `test`                                                       | Obrigatório para Jest                  |
| `TEST_DATABASE_URL` | ✅          | `postgresql://postgres:123456@localhost:5432/nr-bps_db_test` | Banco local TEST — DEVE conter `_test` |
| `APP_ENV`           | ❌          | ausente                                                      | Não é necessário em testes             |

> **PROIBIDO em `.env.test`**: `DATABASE_URL` apontando para Neon, `LOCAL_DATABASE_URL` para `nr-bps_db`.

### STAGING (`.env.staging` / Vercel Preview)

| Variável               | Obrigatória | Exemplo                               | Observação                                   |
| ---------------------- | ----------- | ------------------------------------- | -------------------------------------------- |
| `NODE_ENV`             | ✅          | `production`                          | Necessário para build Next.js otimizado      |
| `APP_ENV`              | ✅          | `staging`                             | **CRÍTICO** — diferenciador de comportamento |
| `DATABASE_URL`         | ✅          | `postgresql://...@.../neondb_staging` | **DEVE** conter `neondb_staging`             |
| `ASAAS_API_KEY`        | ✅          | `$aact_hmlg_...`                      | Sempre sandbox em staging                    |
| `ASAAS_API_URL`        | ✅          | `https://api-sandbox.asaas.com/v3`    | Sempre sandbox                               |
| `ASAAS_WEBHOOK_SECRET` | ✅          | string                                | Token webhook staging                        |
| `NEXT_PUBLIC_APP_URL`  | ✅          | `https://staging.qwork.app.br`        | URL pública do staging                       |
| `SMTP_FROM_NAME`       | ✅          | `QWork [STAGING]`                     | Identificador visual em e-mails              |

### PROD (`.env.production` / Vercel Production)

| Variável               | Obrigatória | Exemplo                       | Observação                            |
| ---------------------- | ----------- | ----------------------------- | ------------------------------------- |
| `NODE_ENV`             | ✅          | `production`                  |                                       |
| `APP_ENV`              | ✅          | `production`                  | **CRÍTICO** — ativa supressão de logs |
| `DATABASE_URL`         | ✅          | `postgresql://...@.../neondb` | **NÃO DEVE** conter `neondb_staging`  |
| `ASAAS_WEBHOOK_SECRET` | ✅          | string forte                  | Token webhook produção                |
| `NEXT_PUBLIC_APP_URL`  | ✅          | `https://qwork.app.br`        | URL pública de produção               |
| `AUTHORIZED_ADMIN_IPS` | ✅ em prod  | `IP1,IP2,IP3`                 | IPs autorizados a rotas /admin        |

---

## Feature Flags por Ambiente

| Flag / Comportamento                  | DEV      | TEST     | STAGING          | PROD                |
| ------------------------------------- | -------- | -------- | ---------------- | ------------------- |
| Logs `console.log/info/debug`         | ✅ ON    | ✅ ON    | ✅ ON            | ❌ OFF (suprimidos) |
| Header `X-Environment: staging`       | —        | —        | ✅ ON            | —                   |
| Header `X-Robots-Tag: noindex`        | —        | —        | ✅ ON            | —                   |
| Mock session (`x-mock-session`)       | ✅       | ✅       | ❌               | ❌                  |
| Rate limiting                         | DEV-off  | TEST-off | ✅ ON            | ✅ ON               |
| MFA obrigatório (`/admin/financeiro`) | ✅       | ✅       | ✅               | ✅                  |
| IP whitelist `/api/admin`             | Opcional | —        | ✅               | ✅                  |
| Sentry error reporting                | —        | —        | ✅ (recomendado) | ✅                  |
| Analytics                             | ❌       | ❌       | ❌ (recomendado) | ✅                  |

---

## Arquivos de Configuração

```
.env                  → Base para DEV (commitado, sem segredos)
.env.local            → Override DEV (NÃO commitado — .gitignore)
.env.development      → Overrides opcionais DEV
.env.test             → Configuração para Jest/Vitest (commitado)
.env.staging          → Template STAGING (commitado — sem segredos reais)
.env.production       → Template PROD (commitado — DATABASE_URL é placeholder)
.env.production.local → Override PROD local (NÃO commitado)
.env.emissor.local    → Modo Emissor: DEV com acesso a Neon (NÃO commitado)
.env.emissor.sample   → Template do modo emissor
.env.example          → Template para novos desenvolvedores
```

> **Regra de ouro**: arquivos `*.local` NUNCA são commitados. Arquivos sem `.local`
> que contenham dados reais (senhas, tokens, URLs com credenciais) NUNCA devem
> ser commitados. A presença no `.gitignore` não é suficiente — revisar manualmente.

---

## Flags Exportadas por `lib/db/connection.ts`

```typescript
import {
  environment, // 'development' | 'test' | 'production'
  APP_ENV, // 'development' | 'test' | 'staging' | 'production' | undefined
  isDevelopment, // true em DEV
  isTest, // true em TEST
  isProduction, // true em STAGING e PROD (NODE_ENV=production)
  isStaging, // true apenas em STAGING (APP_ENV=staging)
  isLiveProduction, // true apenas em PROD real (isProduction && !isStaging)
  DEBUG_DB, // true em TEST ou se DEBUG_DB=1
} from '@/lib/db/connection';
```

### Usar as flags corretamente

```typescript
// ✅ Para suprimir comportamento em produção real (não staging)
if (isLiveProduction) {
  /* analytics, supressão de logs */
}

// ✅ Para qualquer lógica "ambiente Neon" (staging ou prod)
if (isProduction) {
  /* usa Neon pooler, serverless drivers */
}

// ✅ Para identificar staging especificamente
if (isStaging) {
  /* banner visual, logs verbosos, dados sintéticos */
}

// ❌ Errado — quebra staging
if (process.env.NODE_ENV === 'production') {
  /* isto inclui staging! */
}
```

---

## Procedimento: Adicionar Nova Variável de Ambiente

1. **Definir** em todos os arquivos relevantes (`env.example`, `.env.staging` template, `.env.production` template)
2. **Validar** com Zod em `lib/config/env.ts` (ou arquivo similar)
3. **Documentar** nesta tabela
4. **Testar** que a ausência da variável em produção lança erro claro (fail-fast)
5. **Configurar** no painel Vercel para Production e Preview (staging)

---

## Configuração Neon Cloud

| Banco            | Branch Neon          | Projeto | Auto-suspend                   |
| ---------------- | -------------------- | ------- | ------------------------------ |
| `neondb`         | `main`               | qwork   | 60 min                         |
| `neondb_staging` | `staging` (ou `dev`) | qwork   | **5 min** (economizar compute) |

> Configurar auto-suspend de 5 minutos no `neondb_staging` para evitar cobranças
> de compute quando o staging estiver inativo.

---

## Referências

- [DATABASE-POLICY.md](./DATABASE-POLICY.md) — Política completa de bancos
- [security/GUIA-COMPLETO-RLS-RBAC.md](./security/GUIA-COMPLETO-RLS-RBAC.md) — RLS e RBAC
- `lib/db/connection.ts` — Implementação dos guards
- `instrumentation.ts` — Supressão de logs por APP_ENV
- `middleware.ts` — Headers de ambiente (X-Environment, X-Robots-Tag)
