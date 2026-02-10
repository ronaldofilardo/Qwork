# Guia: Verificação de Logs de Aplicação

**Objetivo:** Identificar erros relacionados ao problema de laudo em logs de produção

---

## 🔍 Logs do Vercel (Produção)

### Acessar Dashboard

1. Ir para: https://vercel.com/dashboard
2. Selecionar projeto QWork
3. Clicar em "Logs" ou "Runtime Logs"

### Buscar Padrões de Erro

#### Padrões Relacionados ao Problema

Buscar por estas strings nos logs:

```
"Laudo não pode ser marcado como emitido sem hash_pdf"
"chk_laudos_hash_when_emitido"
"fn_reservar_id_laudo_on_lote_insert"
"violates check constraint"
"laudo" AND "emitido"
"status" AND "rascunho"
```

#### Endpoints Críticos

Monitorar logs destes endpoints:

```
POST /api/lotes/criar
POST /api/lotes/[id]/liberar
POST /api/lotes/[id]/emitir
POST /api/rh/avaliacoes/[loteId]/liberar
POST /api/entidade/avaliacoes/[loteId]/liberar
```

### Filtros Recomendados

**Por Severidade:**

- ❌ Error
- ⚠️ Warning

**Por Período:**

- Últimas 24 horas - se problema for recente
- Últimos 7 dias - para histórico completo
- Data específica - se souber quando começou

**Por Função:**

- Filtrar por função específica se deployment tem múltiplas functions
- Ex: `api/lotes/...`, `api/rh/...`

---

## 📊 Vercel CLI (Análise Local)

### Instalar Vercel CLI (se não tiver)

```bash
npm i -g vercel
```

### Login na Vercel

```bash
vercel login
```

### Listar Deployments

```bash
# Ver últimos deployments
vercel ls

# Ver logs de um deployment específico
vercel logs [deployment-url]
```

### Buscar Erros Específicos

```bash
# Logs recentes com filtro
vercel logs --follow | grep -i "laudo"
vercel logs --follow | grep -i "emitido"
vercel logs --follow | grep -i "constraint"
```

---

## 🗄️ Logs do Banco (Neon)

### Acessar Neon Console

1. Ir para: https://console.neon.tech
2. Selecionar projeto
3. Clicar em "Monitoring" ou "Logs"

### Queries para Análise

#### Queries Lentas ou com Erro

```sql
-- No Neon Monitoring, buscar por:
- Queries com erro relacionado a "laudos"
- Queries com violation de constraint
- Queries usando fn_reservar_id_laudo_on_lote_insert
```

#### Análise de Performance

```sql
-- Queries mais executadas
-- Queries mais lentas
-- Queries com mais erros
```

---

## 📝 Logs Locais (DEV)

### Logs do Next.js

```bash
# Servidor de desenvolvimento
pnpm dev

# Verificar console para erros relacionados a:
- Database connection errors
- PgError: constraint violation
- Transaction errors
```

### Logs do PostgreSQL Local

```powershell
# Windows - Ver logs do PostgreSQL
Get-Content "C:\Program Files\PostgreSQL\[versão]\data\log\*.log" -Tail 50

# Ou usar pgAdmin para ver logs
```

---

## 🔍 Análise de Erros Específicos

### Erro: "Laudo não pode ser marcado como emitido sem hash_pdf"

**O que buscar nos logs:**

1. **Stack trace completo**

```
at fn_validar_laudo_emitido()
at INSERT INTO laudos
at trg_reservar_id_laudo_on_lote_insert
```

2. **Payload da requisição**

```json
{
  "lote_id": 123,
  "tipo": "completo",
  "contratante_id": 456
}
```

3. **Estado do laudo no momento do erro**

```sql
-- Query que estava sendo executada
INSERT INTO laudos (id, lote_id) VALUES (...)
-- vs
-- Query correta após Migration 1004
INSERT INTO laudos (id, lote_id, status) VALUES (..., 'rascunho')
```

### Erro: "SECURITY: app.current_user_cpf not set"

**Indica problema de transação/contexto:**

```javascript
// Problema: Uso de neon() HTTP API em transação
await neon(url)`SET LOCAL app.current_user_cpf = '123'`;
await neon(url)`INSERT INTO laudos ...`; // Contexto perdido!

// Solução: Pool com conexão persistente
const pool = getNeonPool();
const client = await pool.connect();
await client.query(`SET LOCAL app.current_user_cpf = '123'`);
await client.query(`INSERT INTO laudos ...`); // Contexto mantido
```

---

## 📈 Monitoramento Contínuo

### Configurar Alertas no Vercel

1. **Acessar Integrations → Notifications**
2. **Configurar Webhook ou Email para:**
   - Deployment fails
   - High error rate
   - Function errors

### Configurar Alertas no Neon

1. **Acessar Settings → Integrations**
2. **Configurar para:**
   - Query errors
   - Connection issues
   - High latency

---

## 🛠️ Ferramentas Úteis

### 1. Vercel Dashboard

- **URL:** https://vercel.com/dashboard
- **Uso:** Runtime logs, deployment history
- **Vantagens:** Interface visual, filtros avançados

### 2. Vercel CLI

- **Instalação:** `npm i -g vercel`
- **Uso:** `vercel logs --follow`
- **Vantagens:** Acesso local, grep/filter no terminal

### 3. Neon Console

- **URL:** https://console.neon.tech
- **Uso:** Query logs, monitoring
- **Vantagens:** Logs específicos de DB

### 4. PostgreSQL Log Analysis

- **Ferramenta:** pgBadger
- **URL:** https://github.com/darold/pgbadger
- **Uso:** Análise detalhada de logs PostgreSQL

---

## 📊 Exemplo de Análise Completa

### Cenário: Usuário reporta erro ao liberar lote

#### Passo 1: Verificar Logs Vercel

```bash
vercel logs --follow | grep -i "laudo"
```

**Output esperado:**

```
[Error] POST /api/lotes/123/liberar
Error: Laudo não pode ser marcado como emitido sem hash_pdf
  at fn_validar_laudo_emitido
  at trg_reservar_id_laudo_on_lote_insert
```

#### Passo 2: Verificar Estado do Lote

```sql
-- No Neon SQL Editor
SELECT
  l.id, l.status, l.tipo,
  ld.id as laudo_id, ld.status as laudo_status, ld.hash_pdf
FROM lotes_avaliacao l
LEFT JOIN laudos ld ON ld.lote_id = l.id
WHERE l.id = 123;
```

#### Passo 3: Verificar Função do Trigger

```sql
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'fn_reservar_id_laudo_on_lote_insert';
```

**Buscar:**

- ✅ Contém: `status='rascunho'` → Migration 1004 aplicada
- ❌ Não contém status → Migration 1004 NÃO aplicada

#### Passo 4: Verificar Audit Logs

```sql
SELECT * FROM audit_logs
WHERE resource = 'lotes_avaliacao'
  AND resource_id = '123'
ORDER BY created_at DESC
LIMIT 10;
```

#### Passo 5: Decisão

**SE função não tem status='rascunho':**
→ Aplicar Migration 1004

**SE função tem status='rascunho' mas erro persiste:**
→ Verificar se há laudos órfãos ou inconsistentes
→ Verificar se trigger está ativo

---

## 🎯 Checklist de Investigação

Ao investigar erro relacionado a laudos:

- [ ] Verificar logs Vercel (últimas 24h)
- [ ] Verificar logs Neon (queries com erro)
- [ ] Verificar stack trace completo
- [ ] Verificar payload da requisição
- [ ] Verificar estado do lote no banco
- [ ] Verificar estado do laudo no banco
- [ ] Verificar função do trigger
- [ ] Verificar DEFAULT da coluna status
- [ ] Verificar audit logs
- [ ] Verificar se Migration 1004 aplicada
- [ ] Testar reprodução em DEV

---

## 📞 Comandos Rápidos

### Vercel Logs

```bash
# Logs em tempo real
vercel logs --follow

# Logs de deployment específico
vercel logs https://qwork-abc123.vercel.app

# Logs com filtro
vercel logs --follow | grep -E "laudo|emitido|constraint"
```

### Neon Logs (via CLI se disponível)

```bash
# Consultar via psql
psql $DATABASE_URL -c "SELECT * FROM pg_stat_statements WHERE query LIKE '%laudos%' LIMIT 10"
```

### Logs Locais

```powershell
# PowerShell - Monitorar logs
Get-Content "logs\*.log" -Wait -Tail 50

# Buscar padrão específico
Select-String -Path "logs\*.log" -Pattern "laudo|emitido" | Select-Object -Last 20
```

---

**Última Atualização:** 10/02/2026  
**Próxima Ação:** Verificar logs Vercel e Neon após executar check-prod-status.cjs
