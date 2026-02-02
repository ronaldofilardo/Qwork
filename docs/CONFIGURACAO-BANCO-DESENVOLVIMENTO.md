# ⚙️ Configuração de Banco de Dados - Desenvolvimento

## 🎯 Configuração Atual (Janeiro 2026)

### Desenvolvimento Local (`pnpm dev`)

**IMPORTANTE:** O desenvolvimento local agora roda **diretamente no banco Neon Cloud (produção)**.

```env
LOCAL_DATABASE_URL=postgresql://neondb_owner:REDACTED@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

#### ⚠️ Banco Local PostgreSQL (nr-bps_db) - NÃO USADO

O banco local `nr-bps_db` **não está sendo utilizado** temporariamente:

- ❌ `postgresql://postgres:123456@localhost:5432/nr-bps_db` - DESABILITADO
- ✅ Neon Cloud é usado para desenvolvimento

#### Motivos para usar Neon em desenvolvimento:

1. **Schema sincronizado** - Mesmas tabelas e estrutura da produção
2. **Nomes de tabelas legados** - `respostas` ao invés de `respostas_avaliacao`
3. **Testes com dados reais** - Facilita debugging de problemas em produção
4. **Sem necessidade de migrations locais** - Schema já está atualizado

---

## 📋 Ambientes e Bancos

| Ambiente            | Comando     | Banco Usado                       | URL                         |
| ------------------- | ----------- | --------------------------------- | --------------------------- |
| **Desenvolvimento** | `pnpm dev`  | Neon Cloud (neondb)               | `LOCAL_DATABASE_URL` → Neon |
| **Testes**          | `pnpm test` | PostgreSQL Local (nr-bps_db_test) | `TEST_DATABASE_URL`         |
| **Produção**        | Vercel      | Neon Cloud (neondb)               | `DATABASE_URL`              |

---

## 🔧 Variáveis de Ambiente (.env.local)

```env
# Desenvolvimento usa Neon Cloud
LOCAL_DATABASE_URL=postgresql://neondb_owner:***@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# DATABASE_URL (mesmo valor)
DATABASE_URL=postgresql://neondb_owner:***@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Permite usar DATABASE_URL em desenvolvimento
ALLOW_PROD_DB_LOCAL=true
```

---

## 🗄️ Diferenças de Schema

### Neon Cloud (Produção/Desenvolvimento)

- Tabela: `respostas` ← nome legado
- Constraint: `respostas_avaliacao_id_grupo_item_key`
- Sem tabela `notificacoes` (legado)

### PostgreSQL Local (Testes)

- Tabela: `respostas_avaliacao` ← nome novo
- Constraint: `respostas_avaliacao_avaliacao_id_grupo_item_key`
- Com tabela `notificacoes`

---

## 🚀 Como Desenvolver

1. **Iniciar servidor de desenvolvimento:**

   ```bash
   pnpm dev
   ```

2. **O sistema conectará automaticamente ao Neon Cloud**
   - Logs mostrarão: `⚠️ ALLOW_PROD_DB_LOCAL=true: usando DATABASE_URL...`

3. **Ao salvar respostas de avaliação:**
   - Vão para tabela `respostas` no Neon
   - Sistema detecta 37 respostas e marca como concluída automaticamente
   - Lote é recalculado e notificações são criadas

---

## 🔄 Para Voltar a Usar Banco Local (Futuro)

Quando quiser voltar a usar `nr-bps_db` local:

1. Atualizar `.env.local`:

   ```env
   LOCAL_DATABASE_URL=postgresql://postgres:123456@localhost:5432/nr-bps_db
   ALLOW_PROD_DB_LOCAL=false
   ```

2. Rodar migrations locais:

   ```bash
   psql -U postgres -d nr-bps_db -f database/schema-complete.sql
   ```

3. Reiniciar servidor:
   ```bash
   pnpm dev
   ```

---

## ⚠️ Cuidados ao Desenvolver no Neon

- 🚨 **Você está trabalhando com dados de produção**
- ✅ Sempre teste funcionalidades críticas em ambiente de teste primeiro
- ✅ Evite operações massivas de UPDATE/DELETE
- ✅ Use transações para mudanças que afetem múltiplos registros
- ✅ Faça backup antes de scripts SQL complexos

---

## 📝 Atualizações de Código

### APIs Atualizadas para Neon

Todas as APIs foram atualizadas para usar nomes de tabela corretos:

- ✅ [app/api/avaliacao/save/route.ts](../app/api/avaliacao/save/route.ts) - Conclusão automática
- ✅ [app/api/avaliacao/respostas/route.ts](../app/api/avaliacao/respostas/route.ts) - Salvar respostas
- ✅ [lib/lotes.ts](../lib/lotes.ts) - Recalcular status

### Scripts SQL para Neon

- [scripts/fix-avaliacoes-completas-neon.sql](../scripts/fix-avaliacoes-completas-neon.sql) - Correção histórica
- Usa tabela `respostas` (não `respostas_avaliacao`)
- Sem dependência de tabela `notificacoes`
