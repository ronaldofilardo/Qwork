# 🚀 Configuração Asaas Sandbox para Produção

**Data:** 17/02/2026  
**Problema:** Sandbox do Asaas está direcionado para `localhost:3000` em vez da URL de produção  
**URL de Produção:** `https://sistema.qwork.app.br`

---

## 📋 Checklist de Configuração

### 1️⃣ Configurar Variáveis de Ambiente no Vercel

Acesse: https://vercel.com/ronaldofilardos-projects/qwork/settings/environment-variables

Configure as seguintes variáveis:

```env
# URL da aplicação em produção
NEXT_PUBLIC_BASE_URL=https://sistema.qwork.app.br
NEXT_PUBLIC_APP_URL=https://sistema.qwork.app.br
NEXT_PUBLIC_URL=https://sistema.qwork.app.br

# Asaas Sandbox (manter configuração existente)
ASAAS_API_KEY=[sua chave sandbox existente]
ASAAS_API_URL=https://api-sandbox.asaas.com/v3
ASAAS_WEBHOOK_SECRET=[seu secret existente]
```

**IMPORTANTE:**

- Marque as variáveis para todos os ambientes: `Production`, `Preview`, `Development`
- Ou marque apenas `Production` se quiser manter localhost em desenvolvimento

---

### 2️⃣ Atualizar Webhook no Painel Asaas Sandbox

1. Acesse: https://sandbox.asaas.com
2. Vá em: **Configurações** → **Integrações** → **Webhooks**
3. Edite o webhook existente ou crie um novo com:

   **URL do Webhook:**

   ```
   https://sistema.qwork.app.br/api/webhooks/asaas
   ```

   **Token de Autenticação:**

   ```
   [use o mesmo valor de ASAAS_WEBHOOK_SECRET]
   ```

   **Eventos a Marcar:**
   - ✅ `PAYMENT_CREATED`
   - ✅ `PAYMENT_CONFIRMED`
   - ✅ `PAYMENT_RECEIVED` ⭐ (MAIS IMPORTANTE)
   - ✅ `PAYMENT_OVERDUE`
   - ✅ `PAYMENT_REFUNDED`

4. Clique em **Salvar**

---

### 3️⃣ Fazer Deploy das Mudanças

As variáveis de ambiente são aplicadas automaticamente, mas você pode forçar um redeploy:

```bash
# Opção 1: Via Vercel CLI (se instalado)
vercel --prod

# Opção 2: Via Git (recomendado)
git commit --allow-empty -m "chore: trigger redeploy for env vars"
git push origin main
```

Ou acesse o Vercel Dashboard e clique em **"Redeploy"** no último deployment.

---

### 4️⃣ Testar a Configuração

#### Teste 1: Health Check do Webhook

```bash
curl https://sistema.qwork.app.br/api/webhooks/asaas
```

**Resposta esperada:**

```json
{
  "service": "Asaas Webhook Handler",
  "status": "online",
  "timestamp": "2026-02-17T...",
  "env": "production",
  "webhookSecretConfigured": true
}
```

#### Teste 2: Criar Pagamento de Teste

```bash
# Criar um pagamento no sistema
# O pagamento será criado no Asaas com a URL correta
```

Verifique nos logs do Vercel:

```
[Asaas] ⚠️  IMPORTANTE: Webhook deve ser enviado para:
https://qwork-psi.vercel.app/api/webhooks/asaas
```

#### Teste 3: Simular Webhook do Asaas

No painel do Asaas Sandbox:

1. Crie um pagamento de teste (R$ 1,00)
2. Marque como "Pago" manualmente
3. Verifique se o webhook foi enviado (veja "Histórico de Webhooks")
4. Verifique os logs no Vercel

---

## 🔍 Verificar Logs no Vercel

```bash
# Via Vercel CLI
vercel logs --follow

# Ou acesse:
https://vercel.com/ronaldofilardos-projects/qwork/logs
```

Procure por:

```
[Asaas Webhook] Evento recebido: PAYMENT_RECEIVED
[Asaas Webhook] ✅ Webhook processado com sucesso
```

---

## ⚠️ Importante: Sandbox vs Produção

**Você está usando:** Asaas **SANDBOX** (ambiente de testes)

### Quando migrar para Asaas PRODUÇÃO?

Quando estiver pronto para receber pagamentos reais:

1. Criar conta em: https://www.asaas.com (não sandbox)
2. Validar documentos da empresa
3. Obter API Key de PRODUÇÃO
4. Atualizar variáveis no Vercel:
   ```env
   ASAAS_API_KEY=[chave de produção]
   ASAAS_API_URL=https://api.asaas.com/v3
   ```
5. Configurar webhook: `https://sistema.qwork.app.br/api/webhooks/asaas`

---

## 🐛 Troubleshooting

### Problema: Webhook ainda aponta para localhost

**Solução:**

- Verifique se as variáveis foram salvas no Vercel
- Faça um redeploy
- Limpe o cache: Settings → General → Clear Cache and Redeploy

### Problema: Webhook retorna 401 Unauthorized

**Solução:**

- Verifique se `ASAAS_WEBHOOK_SECRET` está configurado no Vercel
- Confirme que o Token no painel Asaas é o mesmo

### Problema: Logs não aparecem no Vercel

**Solução:**

- Use `console.log` em vez de apenas `console.error`
- Verifique a aba "Functions" nos logs do Vercel
- Adicione logs explícitos temporariamente

---

## ✅ Checklist Final

Antes de considerar concluído:

- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] URL do webhook atualizada no painel Asaas
- [ ] Health check retorna status "online"
- [ ] Teste de pagamento criado com sucesso
- [ ] Webhook recebido e processado corretamente
- [ ] Logs confirmam processamento em produção

---

## 📞 Próximos Passos

Após configurar o sandbox em produção:

1. **Monitorar** primeiros pagamentos reais no sandbox
2. **Validar** fluxo completo de pagamento → ativação
3. **Planejar** migração para Asaas PRODUÇÃO
4. **Documentar** processo de rollback se necessário

---

**Última atualização:** 17/02/2026  
**Status:** Aguardando configuração
