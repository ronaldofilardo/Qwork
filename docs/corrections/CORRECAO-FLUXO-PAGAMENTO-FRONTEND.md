# 🚨 CORREÇÃO URGENTE - Fluxo de Pagamento Incorreto

**Data:** 25/12/2025  
**Status:** 🔴 CRÍTICO - Sistema liberando acesso sem pagamento real  
**Prioridade:** IMEDIATA

---

## 🎯 Problema Identificado

O frontend está chamando `/api/pagamento/processar` **DIRETAMENTE** após a simulação, marcando o pagamento como confirmado **SEM PAGAMENTO REAL**.

### Logs do Erro

```
[DEBUG] Query local (19ms): UPDATE tomadores
         SET status = 'aprovado',
             ativa = true,
             pagamento_confirmado = true
             ...
```

**Resultado:** Empresa liberada sem pagamento real ❌

---

## ✅ Fluxo Correto

### Desenvolvimento (Simulação)

```
1. Frontend → POST /api/pagamento/simulador
   └─ Retorna: valor_total, detalhes_parcelas

2. Frontend exibe dados e botão "Confirmar"

3. Frontend → POST /api/pagamento/iniciar
   ├─ Cria pagamento com status='pendente'
   ├─ Retorna: pagamento_id
   └─ Não libera acesso

4. Frontend → POST /api/pagamento/confirmar (SIMULAÇÃO DEV)
   ├─ Chama internamente /api/pagamento/processar
   ├─ Marca pagamento como 'pago'
   ├─ Atualiza status para 'aprovado'
   ├─ Libera acesso (ativa=true, pagamento_confirmado=true)
   └─ Cria recibo
```

### Produção (Gateway Real)

```
1. Frontend → POST /api/pagamento/simulador
   └─ Retorna: valor_total, detalhes_parcelas

2. Frontend → POST /api/pagamento/iniciar
   ├─ Cria pagamento com status='pendente'
   ├─ Integra com Mercado Pago/PagSeguro
   └─ Retorna: payment_url, qr_code (PIX), etc

3. Usuário paga via gateway externo

4. Gateway → POST /api/webhooks/mercadopago (callback)
   ├─ Valida assinatura do webhook
   ├─ Verifica status do pagamento no gateway
   ├─ Chama /api/pagamento/processar
   └─ Libera acesso apenas se pagamento confirmado
```

---

## 🔒 Correções Aplicadas

### 1. `/api/pagamento/processar` - Validação de Segurança

Adicionado:

- ✅ Requer `pagamento_id` obrigatório
- ✅ Valida que pagamento existe e está pendente
- ✅ Bloqueia se já foi pago
- ✅ Documenta que não deve ser chamado diretamente

### 2. `/api/pagamento/iniciar` - Já Implementado

- ✅ Cria pagamento com `status='pendente'`
- ✅ NÃO marca como pago
- ✅ NÃO libera acesso

### 3. `/api/pagamento/confirmar` - Já Implementado

- ✅ Atualiza pagamento para `status='pago'`
- ✅ Chama `/api/pagamento/processar` internamente
- ✅ Cria recibo
- ✅ Libera acesso

---

## 🛠️ O Que o Frontend Deve Fazer

### ❌ ERRADO (Atual)

```typescript
// Após simulação, chama direto:
await fetch('/api/pagamento/processar', {
  method: 'POST',
  body: JSON.stringify({ ... })
});
// ❌ Libera acesso SEM pagamento real
```

### ✅ CORRETO (Novo)

```typescript
// 1. Simulação
const simRes = await fetch('/api/pagamento/simulador', { ... });
const { valor_total, detalhes } = await simRes.json();

// 2. Exibir dados e aguardar confirmação do usuário
// ... interface com botão "Confirmar Pagamento"

// 3. Iniciar pagamento (cria registro pendente)
const iniciarRes = await fetch('/api/pagamento/iniciar', {
  method: 'POST',
  body: JSON.stringify({
    contrato_id,
    tomador_id,
    metodo_pagamento,
    numero_parcelas,
    valor_total,
    numero_funcionarios,
    valor_por_funcionario,
  })
});
const { pagamento_id } = await iniciarRes.json();

// 4. DESENVOLVIMENTO: Confirmar (simula gateway)
if (process.env.NODE_ENV === 'development') {
  const confirmRes = await fetch('/api/pagamento/confirmar', {
    method: 'POST',
    body: JSON.stringify({
      pagamento_id,
      metodo_pagamento,
      numero_parcelas,
    })
  });
  // ✅ Só agora libera acesso
}

// 4. PRODUÇÃO: Redirecionar para gateway
if (process.env.NODE_ENV === 'production') {
  // Integrar com Mercado Pago/PagSeguro
  window.location.href = payment_url;
  // Webhook confirmará depois
}
```

---

## 📁 Arquivos Modificados

- ✅ [`app/api/pagamento/processar/route.ts`](../../../app/api/pagamento/processar/route.ts) - Validações de segurança
- ℹ️ [`app/api/pagamento/iniciar/route.ts`](../../../app/api/pagamento/iniciar/route.ts) - Já correto
- ℹ️ [`app/api/pagamento/confirmar/route.ts`](../../../app/api/pagamento/confirmar/route.ts) - Já correto

---

## 🧪 Como Testar

### 1. Cadastro + Modelo de Pagamento

```bash
# Deve criar empresa com status='aguardando_pagamento'
# ativa=false, pagamento_confirmado=false
```

### 2. Simulação

```bash
POST /api/pagamento/simulador
# Deve apenas retornar valores, NÃO alterar banco
```

### 3. Iniciar Pagamento

```bash
POST /api/pagamento/iniciar
# Deve criar pagamento com status='pendente'
# NÃO deve liberar acesso
```

### 4. Confirmar Pagamento (Dev)

```bash
POST /api/pagamento/confirmar
# Deve:
# - Atualizar pagamento para 'pago'
# - Atualizar tomador: status='aprovado', ativa=true, pagamento_confirmado=true
# - Criar recibo
# - Liberar login
```

### 5. Tentar Login Antes de Confirmar

```bash
# Deve retornar 403 - PAGAMENTO_PENDENTE
```

### 6. Tentar Login Após Confirmar

```bash
# Deve permitir (200) e redirecionar para dashboard
```

---

## ⚠️ IMPORTANTE: Frontend Precisa Ser Atualizado

O código do frontend que chama `/api/pagamento/processar` diretamente **DEVE SER REMOVIDO** e substituído pelo fluxo correto acima.

**Arquivos frontend que podem precisar de correção:**

- Páginas de pagamento (Next.js `app/pagamento/`)
- Componentes de checkout
- Handlers de formulário de pagamento

---

## 🔐 Segurança Adicional (Implementar)

### Opção 1: Token de Webhook

```typescript
// Em produção, validar que requisição vem do gateway
const webhookSecret = process.env.WEBHOOK_SECRET;
const signature = request.headers.get('x-signature');
if (!validarSignature(body, signature, webhookSecret)) {
  return 403;
}
```

### Opção 2: IP Whitelist

```typescript
// Permitir apenas IPs do Mercado Pago/PagSeguro
const allowedIPs = ['IP1', 'IP2'];
const clientIP = request.headers.get('x-forwarded-for');
if (!allowedIPs.includes(clientIP)) {
  return 403;
}
```

---

## ✅ Checklist de Correção

- [x] Adicionar validação de `pagamento_id` em `/processar`
- [x] Verificar status do pagamento antes de processar
- [x] Documentar que `/processar` é rota interna
- [ ] **CRÍTICO:** Atualizar frontend para não chamar `/processar` diretamente
- [ ] Implementar validação de webhook (produção)
- [ ] Testar fluxo completo em development
- [ ] Testar tentativa de login sem pagamento (deve bloquear)
- [ ] Testar tentativa de chamar `/processar` diretamente (deve falhar)

---

**Correção aplicada por:** Copilot  
**Requer ação imediata em:** Frontend (fluxo de pagamento)  
**Arquivos frontend a corrigir:** [Listar aqui após identificar]
