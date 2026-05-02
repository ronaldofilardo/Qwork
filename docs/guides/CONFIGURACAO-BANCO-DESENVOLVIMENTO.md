# ⚙️ Configuração de Banco de Dados - Desenvolvimento

> **Fonte de verdade**: [DATABASE-POLICY.md](../policies/DATABASE-POLICY.md)

## 🎯 Configuração Atual

### Ambientes e Bancos

| Ambiente            | Comando     | Banco                               | Host             |
| ------------------- | ----------- | ----------------------------------- | ---------------- |
| **Desenvolvimento** | `pnpm dev`  | PostgreSQL Local (`nr-bps_db`)      | `localhost:5432` |
| **Testes**          | `pnpm test` | PostgreSQL Local (`nr-bps_db_test`) | `localhost:5432` |
| **Staging**         | Vercel      | Neon Cloud (`neondb_staging`)       | `neon.tech`      |
| **Produção**        | Vercel      | Neon Cloud (`neondb`)               | `neon.tech`      |

### Regras Obrigatórias

- **DEV e TEST**: SEMPRE PostgreSQL local — NUNCA Neon
- **STAGING e PROD**: SEMPRE Neon Cloud — NUNCA local
- **ALLOW_PROD_DB_LOCAL**: NUNCA definir como `true` em `.env.local`
- **NODE_ENV=production**: NUNCA definir em `.env.local` (causa 405 em routes PATCH)

---

## 🔧 Variáveis de Ambiente (.env.local)

```env
# Desenvolvimento — banco local
LOCAL_DATABASE_URL=postgresql://postgres:<local_password>@localhost:5432/nr-bps_db
DATABASE_URL=postgresql://postgres:<local_password>@localhost:5432/nr-bps_db
```

### Testes (.env.test)

```env
TEST_DATABASE_URL=postgresql://postgres:<local_password>@localhost:5432/nr-bps_db_test
```

---

## 🚀 Como Desenvolver

1. **Certifique-se que PostgreSQL local está rodando** na porta 5432

2. **Banco `nr-bps_db` existe**:

   ```bash
   createdb -U postgres nr-bps_db
   psql -U postgres -d nr-bps_db -f database/schema-complete.sql
   ```

3. **Iniciar servidor**:

   ```bash
   pnpm dev
   ```

4. **O sistema conectará ao banco local** via `LOCAL_DATABASE_URL`

---

## 🔒 Proteções em Runtime

- `lib/db.ts` valida `NODE_ENV` e detecta banco por conexão
- `__tests__/config/jest.setup.js` remove `DATABASE_URL` de produção em testes
- Scripts em `scripts/checks/` validam isolamento de ambientes

---

## ⚠️ Histórico

> Em Janeiro 2026, o desenvolvimento local temporariamente usou Neon Cloud direto
> com `ALLOW_PROD_DB_LOCAL=true`. Essa prática foi descontinuada por risco de
> corrupção de dados de produção. A policy oficial agora exige banco local para DEV.

