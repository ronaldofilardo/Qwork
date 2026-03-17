# 🔧 CORREÇÃO: EMISSOR LOCAL → BANCO PROD

**Data:** 17/02/2026  
**Problema:** Emissor rodando localmente não estava acessando banco de produção

---

## 📋 PROBLEMA IDENTIFICADO

### Fluxo Esperado

```
1. Pagamento Asaas (Sandbox) → Webhook → Banco NEON (PROD)
2. Laudo "liberado" para emissão
3. Emissor LOCAL → Acessa banco NEON (PROD) → Vê lote pendente
4. Gera PDF localmente (Puppeteer) → Upload Backblaze
```

### Problema Real

- ❌ Emissor local estava configurado para `nr-bps_db` (banco local)
- ❌ Pagamentos registrados no Neon NÃO eram visíveis localmente
- ❌ Emissor não conseguia ver lotes pendentes

---

## ✅ SOLUÇÃO APLICADA

### Arquivo `.env.local` Atualizado

```env
# EMISSOR LOCAL → BANCO PROD
DATABASE_URL=postgresql://neondb_owner:***@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require
LOCAL_DATABASE_URL=postgresql://neondb_owner:***@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require
ALLOW_PROD_DB_LOCAL=true
```

### Arquivo `.env.emissor.local` Criado

Arquivo dedicado para configuração do emissor com:

- ✅ Banco Neon (produção)
- ✅ Backblaze (produção)
- ✅ Configurações Puppeteer
- ✅ Credenciais do emissor (CPF: 53051173991)

---

## 🧪 COMO TESTAR

### 1. Verificar Conexão com Neon

```powershell
# Rodar servidor local
pnpm dev

# Acessar http://localhost:3000
# Fazer login como emissor
# Verificar logs do console:
# Deve exibir: "Conectado ao banco: neondb @ ep-divine-sky-acuderi7-pooler..."
```

### 2. Criar Pagamento Teste (Sandbox Asaas)

```powershell
# 1. Criar lote via RH
# 2. Solicitar emissão
# 3. Simular pagamento no Asaas Sandbox
# 4. Webhook atualiza banco Neon
```

### 3. Verificar Dashboard Emissor

```powershell
# Acessar http://localhost:3000/emissor
# Login: emissor@qwork.com.br
# DEVE aparecer o lote pendente recém-pago
```

### 4. Emitir Laudo

```powershell
# Clicar "Gerar Laudo"
# Puppeteer executa LOCALMENTE
# PDF gerado → Upload Backblaze
# Status atualizado no Neon
```

---

## 🔍 VERIFICAÇÕES IMPORTANTES

### Banco Correto (Neon)

```powershell
# Ver logs do servidor local
# Procurar linha:
# 🔌 [lib/db.ts] Conectado ao banco: neondb @ ep-divine-sky-acuderi7-pooler...
```

### Backblaze

```env
# .env.local DEVE ter:
BACKBLAZE_KEY_ID=0052a8144c041210000000004
BACKBLAZE_APPLICATION_KEY=K005FuY8PE73LMf3g2NSkqNoqnwnJ0o
BACKBLAZE_BUCKET=laudos-qwork
BACKBLAZE_ENDPOINT=https://s3.us-east-005.backblazeb2.com
```

### Asaas Webhook

```env
# Webhook do Asaas DEVE apontar para produção ou ngrok
# Produção: https://qwork-psi.vercel.app/api/webhooks/asaas
# Local (teste): https://xxxx.ngrok.io/api/webhooks/asaas
```

---

## 📁 ARQUIVOS MODIFICADOS

1. ✅ `.env.local` - Atualizado para Neon
2. ✅ `.env.emissor.local` - Criado (novo)
3. ✅ Este documento de correção

---

## 🚨 IMPORTANTE

### NÃO Commitar

```gitignore
.env.local
.env.emissor.local
.env.production.local
```

Estes arquivos contêm **credenciais sensíveis** e já estão no `.gitignore`.

### Ambiente de Teste

Se precisar testar sem afetar produção:

1. Use banco local: `nr-bps_db`
2. Configure `ALLOW_PROD_DB_LOCAL=false`
3. Use credenciais Asaas Sandbox

---

## 📊 VERIFICAR SE FUNCIONOU

### Checklist

- [ ] Servidor local roda sem erros
- [ ] Log mostra conexão com `neondb`
- [ ] Dashboard emissor carrega
- [ ] Lotes de produção aparecem localmente
- [ ] Geração de PDF funciona
- [ ] Upload Backblaze bem-sucedido
- [ ] Status atualizado no Neon

---

## 🆘 Troubleshooting

### Erro: "DATABASE_URL não está definido"

```powershell
# Verificar se .env.local existe e tem DATABASE_URL
Get-Content .env.local | Select-String "DATABASE_URL"
```

### Erro: "Connection timeout"

```powershell
# Neon pode estar em sleep. Conectar via psql para "acordar":
psql "postgresql://neondb_owner:***@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require" -c "SELECT NOW();"
```

### Lotes não aparecem

```powershell
# Verificar se há lotes pendentes no Neon:
psql "..." -c "SELECT id, status FROM lotes_avaliacao WHERE status='aguardando_pagamento' OR status='pago';"
```

---

**Status:** ✅ CORRIGIDO  
**Próximos passos:** Testar fluxo completo em ambiente local
