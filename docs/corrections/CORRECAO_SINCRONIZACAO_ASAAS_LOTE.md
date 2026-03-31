# Correção: Sincronização de Estados Asaas → Sistema

**Data:** 16/02/2026  
**Problema:** Sistema não atualiza `status_pagamento` do lote para 'pago' após confirmação de pagamento no Asaas

## 🔍 Causa Raiz

O webhook do Asaas busca lotes por `entidade_id` ou `clinica_id`, mas não havia vínculo direto entre:

- O `pagamento` criado na tabela `pagamentos`
- O `lote` específico na tabela `lotes_avaliacao`

Isso causava falhas quando:

- Múltiplos lotes existiam para a mesma entidade
- O relacionamento `entidade_id/clinica_id` não estava claro

## ✅ Solução Implementada

### 1. **Vínculo via `externalReference`**

**Antes:**

```typescript
externalReference: `pagamento_${pagamentoId}`; // ❌ Sem lote_id
```

**Depois:**

```typescript
externalReference: lote_id
  ? `lote_${lote_id}_pagamento_${pagamentoId}` // ✅ Com lote_id
  : `pagamento_${pagamentoId}`; // Fallback
```

### 2. **Extração de `lote_id` no Webhook Handler**

Novo helper:

```typescript
function extractLoteIdFromExternalReference(
  externalReference?: string
): number | null {
  if (!externalReference) return null;
  const match = externalReference.match(/^lote_(\d+)_pagamento_\d+$/);
  return match ? parseInt(match[1], 10) : null;
}
```

### 3. **Busca Direta do Lote + Fallback**

**Novo fluxo:**

1. Tenta extrair `lote_id` do `externalReference`
2. Se encontrado, atualiza o lote diretamente
3. Se não encontrado, usa lógica antiga (busca por `entidade_id/clinica_id`)

```typescript
if (loteId) {
  // ✅ Busca direta
  lotesResult = await client.query(
    `SELECT id FROM lotes_avaliacao
     WHERE id = $1 AND status_pagamento = 'aguardando_pagamento'`,
    [loteId]
  );
} else {
  // Fallback para lógica antiga
  lotesResult = await client.query(`SELECT id FROM lotes_avaliacao WHERE ...`, [
    entidade_id,
    clinica_id,
  ]);
}
```

## 📝 Arquivos Modificados

| Arquivo                                  | Mudança                                            |
| ---------------------------------------- | -------------------------------------------------- |
| `components/CheckoutAsaas.tsx`           | Adicionar prop `loteId`                            |
| `app/api/pagamento/asaas/criar/route.ts` | Aceitar `lote_id` e incluir no `externalReference` |
| `app/pagamento/emissao/[token]/page.tsx` | Passar `loteId` ao CheckoutAsaas                   |
| `lib/asaas/webhook-handler.ts`           | Extrair `lote_id` e buscar lote diretamente        |

## 🧪 Como Testar

### Teste Manual (Ambiente de Dev)

1. **Criar emissão:**

   ```bash
   # Admin define valor
   POST /api/admin/emissoes/22/definir-valor
   {
     "valor_por_funcionario": 22.55
   }

   # Admin gera link
   POST /api/admin/emissoes/22/gerar-link
   ```

2. **Acessar link de pagamento:**

   ```
   GET /pagamento/emissao/{token}
   ```

3. **Iniciar pagamento via Asaas:**
   - Isso criará cobrança com `externalReference: lote_22_pagamento_31`
   - Logs devem mostrar:
     ```
     [Asaas] Criando cobrança: { externalReference: 'lote_22_pagamento_31', ... }
     ```

4. **Simular webhook do Asaas:**

   ```bash
   curl -X POST http://localhost:3000/api/webhooks/asaas \
     -H "Content-Type: application/json" \
     -H "asaas-access-token: your_dev_token" \
     -d '{
       "event": "PAYMENT_CONFIRMED",
       "payment": {
         "id": "pay_test_123",
         "status": "CONFIRMED",
         "externalReference": "lote_22_pagamento_31",
         ...
       }
     }'
   ```

5. **Verificar logs:**

   ```
   [Asaas Webhook] 🎯 Detectado pagamento de emissão para Lote #22
   [Asaas Webhook] 🔍 Encontrados 1 lotes para atualizar: [ 22 ]
   [Asaas Webhook] ✅ Lote 22 atualizado para status_pagamento='pago'
   ```

6. **Consultar status do lote:**

   ```sql
   SELECT id, status_pagamento, pago_em, pagamento_metodo
   FROM lotes_avaliacao
   WHERE id = 22;

   -- Resultado esperado:
   -- status_pagamento: 'pago'
   -- pago_em: 2026-02-17 01:00:00
   -- pagamento_metodo: 'pix'
   ```

### Teste Automatizado

```bash
npm test asaas-webhook-lote-sync
```

## 🚀 Fluxo Corrigido (End-to-End)

```mermaid
sequenceDiagram
    participant Admin
    participant API
    participant Asaas
    participant Webhook
    participant DB

    Admin->>API: POST /admin/emissoes/22/definir-valor
    API->>DB: UPDATE lotes_avaliacao SET valor_por_funcionario=22.55

    Admin->>API: POST /admin/emissoes/22/gerar-link
    API->>DB: UPDATE SET link_pagamento_token, status_pagamento='aguardando_pagamento'

    Note over Cliente: Acessa link de pagamento
    Cliente->>API: POST /pagamento/asaas/criar { lote_id: 22 }
    API->>Asaas: createPayment({ externalReference: 'lote_22_pagamento_31' })
    Asaas-->>API: payment { id: 'pay_xyz' }
    API->>DB: UPDATE pagamentos SET asaas_payment_id='pay_xyz'

    Note over Cliente: Paga via PIX no Asaas
    Asaas->>Webhook: POST /webhooks/asaas { PAYMENT_CONFIRMED }
    Webhook->>Webhook: extractLoteIdFromExternalReference() → 22
    Webhook->>DB: UPDATE pagamentos SET status='pago'
    Webhook->>DB: UPDATE lotes_avaliacao SET status_pagamento='pago' WHERE id=22
    Webhook-->>Asaas: 200 OK

    Note over DB: ✅ Lote 22 agora está PAGO
```

## 🔄 Compatibilidade com Código Antigo

A solução **NÃO quebra** pagamentos antigos pois:

1. Se `externalReference` não contém `lote_id`, usa fallback (busca por `entidade_id/clinica_id`)
2. Se `lote_id` não for passado à API, gera `externalReference` no formato antigo
3. Todos os logs existentes continuam funcionando

## ⚠️ Logs Importantes

### Logs de Sucesso

```
[Asaas Webhook] 🎯 Detectado pagamento de emissão para Lote #22
[Asaas Webhook] 🔍 Encontrados 1 lotes para atualizar: [ 22 ]
[Asaas Webhook] ✅ Lote 22 atualizado para status_pagamento='pago'
[Asaas Webhook] ✅ PAGAMENTO CONFIRMADO: { lotes: 1, ... }
```

### Logs de Alerta (requerem investigação)

```
[Asaas Webhook] ⚠️ Lote 22 não encontrado ou não está aguardando pagamento
[Asaas Webhook] ⚠️ ATENÇÃO: Nenhum lote encontrado para atualizar!
```

## 📋 Checklist de Deploy

- [ ] Rodar testes: `npm test asaas-webhook-lote-sync`
- [ ] Verificar que não há erros de TypeScript
- [ ] Deploy em staging
- [ ] Testar fluxo completo em staging:
  - [ ] Criar lote
  - [ ] Definir valor
  - [ ] Gerar link
  - [ ] Pagar (sandbox)
  - [ ] Verificar webhook recebido
  - [ ] Confirmar status='pago' no banco
- [ ] Deploy em produção
- [ ] Monitorar logs por 24h

## 🎯 Resultado Esperado

✅ Quando cliente paga no Asaas, o sistema AUTOMATICAMENTE:

1. Recebe webhook `PAYMENT_CONFIRMED` ou `PAYMENT_RECEIVED`
2. Extrai `lote_id` do `externalReference`
3. Atualiza `lotes_avaliacao.status_pagamento = 'pago'`
4. Atualiza `lotes_avaliacao.pago_em = NOW()`
5. Laudo fica disponível para emissão sem intervenção manual

---

**Autor:** GitHub Copilot  
**Testado em:** Local Development  
**Status:** ✅ Pronto para Deploy
