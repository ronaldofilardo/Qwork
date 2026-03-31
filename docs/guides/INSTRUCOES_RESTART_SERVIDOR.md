# 🚨 PROBLEMA IDENTIFICADO: Servidor Usando Código Antigo

## Diagnóstico

O webhook está sendo **recebido e processado**, mas o **servidor Next.js ainda está usando código antigo**.

### Evidências:

1. ✅ Webhook é recebido (200 OK)
2. ✅ Processa em ~200-500ms
3. ❌ Lote NÃO é atualizado
4. ❌ Evento `PAYMENT_CONFIRMED` NÃO aparece em `webhook_logs`
5. ❌ Logs novos (com emojis detalhados) NÃO aparecem no console

### Causa Raiz:

O Next.js está usando **código em cache** ou o servidor não reiniciou corretamente após as alterações no arquivo `lib/asaas/webhook-handler.ts`.

---

## ✅ SOLUÇÃO

### Passo 1: Parar TODOS os processos Node.js

```powershell
# Execute no PowerShell:
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
Write-Host "✅ Processos Node.js finalizados" -ForegroundColor Green
```

### Passo 2: Limpar cache do Next.js

```powershell
# Execute no PowerShell:
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "✅ Cache do Next.js limpo" -ForegroundColor Green
```

### Passo 3: Reiniciar servidor de desenvolvimento

```powershell
# Execute no PowerShell:
npm run dev
```

**Aguarde até ver:**

```
✓ Ready in ...ms
○ Local: http://localhost:3000
```

### Passo 4: Testar novamente

Após o servidor inicializar completamente (aguarde ~15-30 segundos), execute:

```powershell
.\test-webhook-debug.ps1
```

---

## 📋 Checklist de Verificação

Após reiniciar o servidor, você DEVE ver nos logs do Next.js:

### ✅ Logs que DEVEM aparecer (código NOVO):

```
[Asaas Webhook] 📨 ========== WEBHOOK RECEBIDO ==========
[Asaas Webhook] 🕒 Timestamp: ...
[Asaas Webhook] 📍 IP: ::1
[Asaas Webhook] 🔑 Event: PAYMENT_CONFIRMED
[Asaas Webhook] 💳 Payment ID: pay_dkiqwxyrnt9jf4q3
[Asaas Webhook] 📊 Status: CONFIRMED
[Asaas Webhook] 🏷️  External Ref: lote_24_pagamento_34
[Asaas Webhook] 💰 Valor: 45
[Asaas Webhook] ================================================
[Asaas Webhook] 🚀 INICIANDO activateSubscription: ...
[Asaas Webhook] ✅ Transação iniciada (BEGIN)
[Asaas Webhook] 🔍 Executando query: SELECT id FROM lotes_avaliacao WHERE id = 24 AND status_pagamento = 'aguardando_pagamento'
[Asaas Webhook] 📊 Resultado da query: 1 linha(s) encontrada(s)
[Asaas Webhook] ✅ Lote encontrado: 24
[Asaas Webhook] 🔄 Atualizando lote 24...
[Asaas Webhook] 📝 Executando UPDATE lotes_avaliacao SET status_pagamento='pago', pago_em=NOW() WHERE id=24
[Asaas Webhook] ✅ Lote atualizado com sucesso: {
  lote_id: 24,
  novo_status_pagamento: 'pago',
  pago_em: '2026-02-17T...',
  pagamento_metodo: 'credit_card'
}
[Asaas Webhook] ✅ PAGAMENTO CONFIRMADO
```

### ❌ Se aparecer isso (código ANTIGO):

```
[Asaas Webhook] Recebido de ::1: {
  event: 'PAYMENT_CONFIRMED',
  ...
}
```

**→ Servidor AINDA está com código antigo! Repita o Passo 1.**

---

## 🔧 Troubleshooting

### Problema: "Servidor não inicia"

**Solução:**

```powershell
# Verificar se porta 3000 está ocupada:
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

# Se estiver, matar processo:
Get-NetTCPConnection -LocalPort 3000 | Select-Object -ExpandProperty OwningProcess | ForEach-Object {Stop-Process -Id $_ -Force}
```

### Problema: "Erro de compilação TypeScript"

Os arquivos foram modificados corretamente. Se houver erro de compilação:

1. Verifique se o arquivo [lib/asaas/webhook-handler.ts](lib/asaas/webhook-handler.ts) tem estas linhas:
   - Linha ~171: `async function activateSubscription(asaasPaymentId: string, paymentData: AsaasWebhookPayload['payment'], event: AsaasWebhookEvent)`
   - Linha ~458: `await activateSubscription(payment.id, payment, event);`
   - Linha ~470: `await activateSubscription(payment.id, payment, event);`

2. Se alguma estiver faltando, o arquivo não foi editado corretamente.

### Problema: "Lote ainda não atualiza após restart"

Se após reiniciar o servidor corretamente e ver os logs novos, o lote ainda não atualizar:

1. Verifique se há **erro** nos logs do webhook (stack trace)
2. Procure por palavras como:
   - `error: coluna`
   - `ROLLBACK`
   - `Erro ao processar pagamento`

3. Se houver erro de **coluna inexistente**, consulte o banco:
   ```sql
   \d tomadores  -- Ver colunas da tabela tomadores
   \d contratos  -- Ver colunas da tabela contratos
   ```

---

## ✅ Teste Final

Após seguir TODOS os passos acima:

```powershell
# 1. Resetar lote:
psql -U postgres -d nr-bps_db -c "UPDATE lotes_avaliacao SET status_pagamento='aguardando_pagamento', pago_em=NULL, pagamento_metodo=NULL WHERE id=24;"

# 2. Executar teste:
.\test-webhook-debug.ps1

# 3. Resultado esperado:
# ✅ SUCESSO! Lote 24 foi atualizado:
#    - status_pagamento: pago
#    - pago_em: 2026-02-17 ...
#    - pagamento_metodo: credit_card
```

---

**Status:** ⏳ Aguardando reinício do servidor com código atualizado
