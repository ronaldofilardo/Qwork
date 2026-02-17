# 🧪 ROTEIRO DE TESTES MANUAIS: Asaas Payment Gateway

**Data:** 17/02/2026  
**Versão:** 1.0  
**Ambiente:** PRODUÇÃO (https://qwork-psi.vercel.app)  
**Testador:** ********\_\_\_********  
**Data do Teste:** **_/_**/**\_\_**

---

## 📋 INSTRUÇÕES GERAIS

### Antes de Começar

1. ✅ Acesse o painel Asaas Sandbox: https://sandbox.asaas.com/
2. ✅ Tenha acesso ao Neon Console (banco de dados)
3. ✅ Tenha acesso ao Vercel Dashboard (logs)
4. ✅ Prepare ferramentas: Postman/Insomnia ou curl
5. ✅ Anote todos os IDs gerados durante os testes

### Como Usar Este Roteiro

- Cada teste tem um **número de identificação**
- Marque ✅ quando **PASSAR** ou ❌ quando **FALHAR**
- Anote observações na coluna "Notas"
- Se um teste falhar, documente o erro completo

---

## 🔧 TESTE 1: VERIFICAÇÃO DE CONFIGURAÇÃO

### 1.1 Verificar Variáveis de Ambiente no Vercel

**Objetivo:** Confirmar que todas as variáveis Asaas estão configuradas

**Passos:**

1. Acesse: https://vercel.com/ronaldofilardo/qwork/settings/environment-variables
2. Verifique as seguintes variáveis:
   - `ASAAS_API_KEY`
   - `ASAAS_API_URL`
   - `ASAAS_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_BASE_URL`

**Resultado Esperado:**

- ✅ Todas as 4 variáveis existem
- ✅ Valores não estão vazios
- ✅ `NEXT_PUBLIC_BASE_URL` = https://qwork-psi.vercel.app

| Status                     | Notas |
| -------------------------- | ----- |
| [ ] ✅ PASS<br>[ ] ❌ FAIL |       |

---

### 1.2 Testar Endpoint de Webhook

**Objetivo:** Verificar que o webhook está online e configurado

**Comando:**

```powershell
Invoke-RestMethod -Uri "https://qwork-psi.vercel.app/api/webhooks/asaas" -Method POST -Body '{"test":"config"}' -ContentType "application/json"
```

**Resultado Esperado:**

```json
{
  "received": true,
  "webhookSecretConfigured": true,
  "receivedAt": "2026-02-17T..."
}
```

**Validações:**

- ✅ Status HTTP 200 ou 400
- ✅ `webhookSecretConfigured` = `true`
- ✅ `receivedAt` com timestamp atual

| Status                     | Notas |
| -------------------------- | ----- |
| [ ] ✅ PASS<br>[ ] ❌ FAIL |       |

---

### 1.3 Verificar Webhook no Painel Asaas

**Objetivo:** Confirmar que o webhook está cadastrado no Asaas

**Passos:**

1. Acesse: https://sandbox.asaas.com/
2. Login com suas credenciais
3. Menu: **Configurações** > **Integrações** > **Webhooks**
4. Procure pelo webhook: `https://qwork-psi.vercel.app/api/webhooks/asaas`

**Resultado Esperado:**

- ✅ Webhook listado
- ✅ Status: Ativo
- ✅ URL correta
- ✅ Eventos habilitados: PAYMENT_RECEIVED, PAYMENT_CONFIRMED, etc.

| Status                     | Notas |
| -------------------------- | ----- |
| [ ] ✅ PASS<br>[ ] ❌ FAIL |       |

---

## 💳 TESTE 2: CRIAÇÃO DE PAGAMENTO PIX

### 2.1 Criar Pagamento PIX via API

**Objetivo:** Criar um pagamento PIX e validar resposta

**Pré-requisito:** Ter um `tomador_id` válido no banco de dados

**Comando:**

```bash
curl -X POST https://qwork-psi.vercel.app/api/pagamento/asaas/criar \
  -H "Content-Type: application/json" \
  -d '{
    "tomador_id": 1,
    "valor_total": 50.00,
    "metodo": "PIX",
    "lote_id": null
  }'
```

**Resultado Esperado:**

```json
{
  "success": true,
  "payment_id": 123,
  "asaas_payment_id": "pay_xxxxxxxxxxxxxx",
  "asaas_pix_qrcode": "00020126...",
  "asaas_pix_qrcode_image": "data:image/png;base64,...",
  "asaas_payment_url": "https://...",
  "valor": 50.0
}
```

**Validações:**

- ✅ Status HTTP 200
- ✅ `success` = true
- ✅ `payment_id` (ID no banco local)
- ✅ `asaas_payment_id` (ID no Asaas, começa com "pay\_")
- ✅ `asaas_pix_qrcode` (string grande, código PIX)
- ✅ `asaas_pix_qrcode_image` (base64, começa com "data:image")

**ANOTE O asaas_payment_id:** **********\_\_**********

| Status                     | Notas |
| -------------------------- | ----- |
| [ ] ✅ PASS<br>[ ] ❌ FAIL |       |

---

### 2.2 Verificar Pagamento no Banco de Dados

**Objetivo:** Confirmar que os dados foram salvos corretamente

**Query SQL:**

```sql
SELECT
  id,
  valor,
  status,
  asaas_payment_id,
  asaas_customer_id,
  asaas_pix_qrcode,
  asaas_payment_url,
  created_at
FROM pagamentos
WHERE asaas_payment_id = 'pay_xxxxxxxxxxxxxx'; -- Use o ID anotado
```

**Resultado Esperado:**

- ✅ 1 linha retornada
- ✅ `asaas_payment_id` preenchido
- ✅ `asaas_customer_id` preenchido (começa com "cus\_")
- ✅ `asaas_pix_qrcode` preenchido (grande string)
- ✅ `asaas_payment_url` preenchido
- ✅ `status` = 'pendente' ou 'aguardando'

| Status                     | Notas |
| -------------------------- | ----- |
| [ ] ✅ PASS<br>[ ] ❌ FAIL |       |

---

### 2.3 Verificar Pagamento no Painel Asaas

**Objetivo:** Confirmar que o pagamento foi criado no Asaas

**Passos:**

1. Acesse: https://sandbox.asaas.com/
2. Menu: **Cobranças** > **Cobranças**
3. Procure pelo pagamento (use o valor R$ 50,00 ou ID)
4. Clique para ver detalhes

**Resultado Esperado:**

- ✅ Cobrança listada
- ✅ Valor: R$ 50,00
- ✅ Método: PIX
- ✅ Status: Pendente ou Aguardando Pagamento
- ✅ QR Code PIX disponível

| Status                     | Notas |
| -------------------------- | ----- |
| [ ] ✅ PASS<br>[ ] ❌ FAIL |       |

---

## 📥 TESTE 3: RECEBIMENTO DE WEBHOOK

### 3.1 Simular Pagamento no Asaas

**Objetivo:** Simular que o pagamento foi realizado

**Passos:**

1. No painel Asaas, na tela da cobrança criada
2. Clique em **Ações** > **Receber Pagamento** (ou similar)
3. Método: PIX
4. Valor: R$ 50,00
5. Confirme

**Resultado Esperado:**

- ✅ Status da cobrança muda para "Confirmado" ou "Pago"
- ✅ Asaas envia webhook para a aplicação

| Status                     | Notas |
| -------------------------- | ----- |
| [ ] ✅ PASS<br>[ ] ❌ FAIL |       |

---

### 3.2 Verificar Logs no Vercel

**Objetivo:** Confirmar que o webhook foi recebido

**Passos:**

1. Acesse: https://vercel.com/ronaldofilardo/qwork/logs
2. Filtre por função: `/api/webhooks/asaas`
3. Última chamada (deve ser recente, poucos segundos atrás)
4. Expanda para ver detalhes

**Resultado Esperado:**

- ✅ Log de POST encontrado
- ✅ Status: 200 OK
- ✅ Duração: < 1000ms
- ✅ Payload contém: `event: "PAYMENT_RECEIVED"` ou `"PAYMENT_CONFIRMED"`
- ✅ Payload contém: `payment: { id: "pay_..." }`

| Status                     | Notas |
| -------------------------- | ----- |
| [ ] ✅ PASS<br>[ ] ❌ FAIL |       |

---

### 3.3 Verificar Atualização no Banco

**Objetivo:** Confirmar que o status foi atualizado

**Query SQL:**

```sql
SELECT
  id,
  valor,
  status,
  asaas_payment_id,
  asaas_net_value,
  updated_at
FROM pagamentos
WHERE asaas_payment_id = 'pay_xxxxxxxxxxxxxx'; -- Use o ID anotado
```

**Resultado Esperado:**

- ✅ `status` = 'pago', 'confirmado' ou 'received'
- ✅ `asaas_net_value` preenchido (valor líquido após taxas)
- ✅ `updated_at` recente (poucos segundos atrás)

| Status                     | Notas |
| -------------------------- | ----- |
| [ ] ✅ PASS<br>[ ] ❌ FAIL |       |

---

### 3.4 Verificar Log de Webhook

**Objetivo:** Confirmar que o evento foi registrado

**Query SQL:**

```sql
SELECT
  id,
  payment_id,
  event,
  processed_at,
  processing_duration_ms,
  error_message
FROM webhook_logs
WHERE payment_id = 'pay_xxxxxxxxxxxxxx' -- Use o ID anotado
ORDER BY processed_at DESC
LIMIT 5;
```

**Resultado Esperado:**

- ✅ 1 ou mais linhas retornadas
- ✅ `event` = 'PAYMENT_RECEIVED' ou 'PAYMENT_CONFIRMED'
- ✅ `processed_at` recente
- ✅ `processing_duration_ms` < 1000
- ✅ `error_message` = NULL

| Status                     | Notas |
| -------------------------- | ----- |
| [ ] ✅ PASS<br>[ ] ❌ FAIL |       |

---

## 💰 TESTE 4: CRIAÇÃO DE PAGAMENTO BOLETO

### 4.1 Criar Pagamento BOLETO via API

**Objetivo:** Testar método de pagamento Boleto

**Comando:**

```bash
curl -X POST https://qwork-psi.vercel.app/api/pagamento/asaas/criar \
  -H "Content-Type: application/json" \
  -d '{
    "tomador_id": 1,
    "valor_total": 100.00,
    "metodo": "BOLETO",
    "lote_id": null
  }'
```

**Resultado Esperado:**

```json
{
  "success": true,
  "payment_id": 124,
  "asaas_payment_id": "pay_yyyyyyyyyyyyyy",
  "asaas_boleto_url": "https://...",
  "asaas_invoice_url": "https://...",
  "valor": 100.0
}
```

**Validações:**

- ✅ Status HTTP 200
- ✅ `asaas_boleto_url` preenchido (URL do boleto)
- ✅ `asaas_invoice_url` preenchido (URL da fatura)

**ANOTE O asaas_payment_id:** **********\_\_**********

| Status                     | Notas |
| -------------------------- | ----- |
| [ ] ✅ PASS<br>[ ] ❌ FAIL |       |

---

### 4.2 Verificar Boleto no Banco

**Query SQL:**

```sql
SELECT
  id,
  valor,
  status,
  asaas_payment_id,
  asaas_boleto_url,
  asaas_invoice_url,
  asaas_due_date
FROM pagamentos
WHERE asaas_payment_id = 'pay_yyyyyyyyyyyyyy'; -- Use o ID anotado
```

**Resultado Esperado:**

- ✅ `asaas_boleto_url` preenchido
- ✅ `asaas_invoice_url` preenchido
- ✅ `asaas_due_date` preenchido (data futura)

| Status                     | Notas |
| -------------------------- | ----- |
| [ ] ✅ PASS<br>[ ] ❌ FAIL |       |

---

### 4.3 Abrir Boleto

**Passos:**

1. Copie a URL de `asaas_boleto_url`
2. Cole no navegador
3. Deve abrir o boleto em PDF

**Resultado Esperado:**

- ✅ PDF do boleto carrega
- ✅ Valor: R$ 100,00
- ✅ Código de barras visível
- ✅ Data de vencimento visível

| Status                     | Notas |
| -------------------------- | ----- |
| [ ] ✅ PASS<br>[ ] ❌ FAIL |       |

---

## 💳 TESTE 5: CRIAÇÃO DE PAGAMENTO CARTÃO

### 5.1 Criar Pagamento CREDIT_CARD via API

**Objetivo:** Testar método de pagamento Cartão de Crédito

**Comando:**

```bash
curl -X POST https://qwork-psi.vercel.app/api/pagamento/asaas/criar \
  -H "Content-Type: application/json" \
  -d '{
    "tomador_id": 1,
    "valor_total": 75.00,
    "metodo": "CREDIT_CARD",
    "lote_id": null
  }'
```

**Resultado Esperado:**

```json
{
  "success": true,
  "payment_id": 125,
  "asaas_payment_id": "pay_zzzzzzzzzzzzz",
  "asaas_payment_url": "https://...",
  "valor": 75.0
}
```

**Validações:**

- ✅ Status HTTP 200
- ✅ `asaas_payment_url` preenchido (URL de checkout)

**ANOTE O asaas_payment_id:** **********\_\_**********

| Status                     | Notas |
| -------------------------- | ----- |
| [ ] ✅ PASS<br>[ ] ❌ FAIL |       |

---

### 5.2 Abrir Checkout de Cartão

**Passos:**

1. Copie a URL de `asaas_payment_url`
2. Cole no navegador
3. Deve abrir a página de checkout do Asaas

**Resultado Esperado:**

- ✅ Página de checkout carrega
- ✅ Valor: R$ 75,00
- ✅ Formulário para dados do cartão visível
- ✅ Logo do Asaas presente

| Status                     | Notas |
| -------------------------- | ----- |
| [ ] ✅ PASS<br>[ ] ❌ FAIL |       |

---

## 🛡️ TESTE 6: SEGURANÇA E VALIDAÇÃO

### 6.1 Testar Validação de Campos Obrigatórios

**Objetivo:** Confirmar que API valida campos obrigatórios

**Comando (sem tomador_id):**

```bash
curl -X POST https://qwork-psi.vercel.app/api/pagamento/asaas/criar \
  -H "Content-Type: application/json" \
  -d '{
    "valor_total": 50.00
  }'
```

**Resultado Esperado:**

- ✅ Status HTTP 400 (Bad Request)
- ✅ Mensagem de erro: "ID do tomador é obrigatório" ou similar

| Status                     | Notas |
| -------------------------- | ----- |
| [ ] ✅ PASS<br>[ ] ❌ FAIL |       |

---

### 6.2 Testar Validação de Valor

**Comando (valor zero):**

```bash
curl -X POST https://qwork-psi.vercel.app/api/pagamento/asaas/criar \
  -H "Content-Type: application/json" \
  -d '{
    "tomador_id": 1,
    "valor_total": 0
  }'
```

**Resultado Esperado:**

- ✅ Status HTTP 400
- ✅ Mensagem de erro: "Valor inválido" ou similar

| Status                     | Notas |
| -------------------------- | ----- |
| [ ] ✅ PASS<br>[ ] ❌ FAIL |       |

---

### 6.3 Testar Rate Limiting

**Objetivo:** Verificar proteção contra spam

**Script PowerShell:**

```powershell
for ($i=1; $i -le 110; $i++) {
    Write-Host "Request $i"
    Invoke-WebRequest -Uri "https://qwork-psi.vercel.app/api/webhooks/asaas" -Method POST -Body '{"test":"rate"}' -ContentType "application/json"
}
```

**Resultado Esperado:**

- ✅ Primeiras ~100 requisições: HTTP 200 ou 400
- ✅ Requisições após 100: HTTP 429 (Too Many Requests)

| Status                     | Notas |
| -------------------------- | ----- |
| [ ] ✅ PASS<br>[ ] ❌ FAIL |       |

---

### 6.4 Testar Webhook com Assinatura Inválida

**Objetivo:** Confirmar que webhook invalida assinaturas incorretas

**Comando:**

```bash
curl -X POST https://qwork-psi.vercel.app/api/webhooks/asaas \
  -H "Content-Type: application/json" \
  -H "asaas-access-token: token_invalido" \
  -d '{
    "event": "PAYMENT_RECEIVED",
    "payment": {"id": "pay_fake"}
  }'
```

**Resultado Esperado:**

- ✅ Status HTTP 401 (Unauthorized) ou 400 (Bad Request)
- ✅ Webhook rejeitado, não processado

| Status                     | Notas |
| -------------------------- | ----- |
| [ ] ✅ PASS<br>[ ] ❌ FAIL |       |

---

## ⚡ TESTE 7: PERFORMANCE

### 7.1 Medir Latência do Webhook

**Objetivo:** Verificar que webhook responde rápido

**Script PowerShell:**

```powershell
$times = @()
for ($i=1; $i -le 10; $i++) {
    $start = Get-Date
    Invoke-WebRequest -Uri "https://qwork-psi.vercel.app/api/webhooks/asaas" -Method POST -Body '{"test":"latency"}' -ContentType "application/json" -UseBasicParsing | Out-Null
    $end = Get-Date
    $duration = ($end - $start).TotalMilliseconds
    $times += $duration
    Write-Host "Request $i: $([math]::Round($duration, 0))ms"
}
$avg = ($times | Measure-Object -Average).Average
Write-Host "Average: $([math]::Round($avg, 0))ms"
```

**Resultado Esperado:**

- ✅ Latência média < 1000ms (idealmente < 500ms)
- ✅ Sem timeouts

**Latência média medida:** **\_\_\_\_** ms

| Status                     | Notas |
| -------------------------- | ----- |
| [ ] ✅ PASS<br>[ ] ❌ FAIL |       |

---

## 🔄 TESTE 8: IDEMPOTÊNCIA

### 8.1 Testar Webhook Duplicado

**Objetivo:** Verificar que o mesmo webhook não é processado 2x

**Passos:**

1. No painel Asaas, encontre um pagamento já confirmado
2. Anote o `payment_id`
3. Simule novamente "Receber Pagamento"
4. Verificar se webhook é rejeitado ou ignorado

**Resultado Esperado:**

- ✅ Webhook recebido
- ✅ Banco NÃO cria registro duplicado em `webhook_logs`
- ✅ Constraint UNIQUE impede duplicação

**Query SQL:**

```sql
SELECT COUNT(*) as total
FROM webhook_logs
WHERE payment_id = 'pay_xxxxxxxxxxxxxx' -- Use o ID
  AND event = 'PAYMENT_CONFIRMED';
```

**Resultado esperado:** `total` = 1 (não deve duplicar)

| Status                     | Notas |
| -------------------------- | ----- |
| [ ] ✅ PASS<br>[ ] ❌ FAIL |       |

---

## 📊 TESTE 9: DADOS E INTEGRIDADE

### 9.1 Verificar Todas as Colunas Asaas

**Query SQL:**

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'pagamentos'
  AND column_name LIKE 'asaas%'
ORDER BY column_name;
```

**Resultado Esperado (9 colunas):**

1. asaas_boleto_url
2. asaas_customer_id
3. asaas_due_date
4. asaas_invoice_url
5. asaas_net_value
6. asaas_payment_id
7. asaas_payment_url
8. asaas_pix_qrcode
9. asaas_pix_qrcode_image

| Status                     | Notas |
| -------------------------- | ----- |
| [ ] ✅ PASS<br>[ ] ❌ FAIL |       |

---

### 9.2 Verificar Tabela webhook_logs

**Query SQL:**

```sql
SELECT
  COUNT(*) as total_webhooks,
  COUNT(DISTINCT payment_id) as pagamentos_unicos,
  COUNT(DISTINCT event) as eventos_unicos,
  MAX(processed_at) as ultimo_webhook
FROM webhook_logs;
```

**Resultado Esperado:**

- ✅ `total_webhooks` > 0
- ✅ `ultimo_webhook` recente (durante este teste)

| Status                     | Notas |
| -------------------------- | ----- |
| [ ] ✅ PASS<br>[ ] ❌ FAIL |       |

---

## ✅ RESUMO DOS TESTES

### Contagem de Testes

| Categoria        | Total  | Passou     | Falhou     | Taxa        |
| ---------------- | ------ | ---------- | ---------- | ----------- |
| Configuração     | 3      | \_\_\_     | \_\_\_     | \_\_\_%     |
| Pagamento PIX    | 3      | \_\_\_     | \_\_\_     | \_\_\_%     |
| Webhook          | 4      | \_\_\_     | \_\_\_     | \_\_\_%     |
| Pagamento Boleto | 3      | \_\_\_     | \_\_\_     | \_\_\_%     |
| Pagamento Cartão | 2      | \_\_\_     | \_\_\_     | \_\_\_%     |
| Segurança        | 4      | \_\_\_     | \_\_\_     | \_\_\_%     |
| Performance      | 1      | \_\_\_     | \_\_\_     | \_\_\_%     |
| Idempotência     | 1      | \_\_\_     | \_\_\_     | \_\_\_%     |
| Integridade      | 2      | \_\_\_     | \_\_\_     | \_\_\_%     |
| **TOTAL**        | **23** | **\_\_\_** | **\_\_\_** | **\_\_\_%** |

---

## 🎯 CRITÉRIOS DE APROVAÇÃO

**Para APROVAR a implementação:**

- [ ] Taxa de sucesso ≥ 95% (no mínimo 22/23 testes)
- [ ] TODOS os testes de segurança passaram
- [ ] Pelo menos 1 pagamento PIX completo (criação → webhook → confirmação)
- [ ] Latência média < 1000ms
- [ ] Sem erros críticos nos logs

---

## 📋 ASSINATURA DO TESTADOR

**Testador:** ******************\_\_\_******************

**Data:** **_/_**/**\_\_**

**Resultado:** [ ] ✅ APROVADO [ ] ❌ REPROVADO

**Observações:**

---

---

---

---

---

## 📞 PROBLEMAS ENCONTRADOS

Se algum teste falhou, documente aqui:

| Teste | Descrição do Problema | Criticidade                                       | Ação Necessária |
| ----- | --------------------- | ------------------------------------------------- | --------------- |
|       |                       | [ ] Crítica<br>[ ] Alta<br>[ ] Média<br>[ ] Baixa |                 |
|       |                       | [ ] Crítica<br>[ ] Alta<br>[ ] Média<br>[ ] Baixa |                 |
|       |                       | [ ] Crítica<br>[ ] Alta<br>[ ] Média<br>[ ] Baixa |                 |

---

**Documento gerado em:** 17/02/2026  
**Versão do roteiro:** 1.0  
**Build testada:** v1.0.0-asaas-integration
