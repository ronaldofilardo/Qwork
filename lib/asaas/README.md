# Asaas Payment Gateway Integration

Cliente HTTP e utilitários para integração com Asaas Payment Gateway.

## 📁 Estrutura

```
lib/asaas/
├── client.ts           # Cliente HTTP principal (AsaasClient)
├── types.ts            # Interfaces TypeScript completas
├── mappers.ts          # Conversores e validadores
└── webhook-handler.ts  # Processador de webhooks
```

## 🚀 Uso Rápido

### Criar Cliente no Asaas

```typescript
import { asaasClient } from '@/lib/asaas/client';
import { formatCpfCnpj } from '@/lib/asaas/mappers';

const customer = await asaasClient.createCustomer({
  name: 'João Silva',
  email: 'joao@example.com',
  cpfCnpj: formatCpfCnpj('123.456.789-00'),
  phone: '11987654321',
  externalReference: 'tomador_123',
});

console.log('Cliente criado:', customer.id); // cus_xxxxx
```

### Criar Cobrança PIX

```typescript
import { calculateDueDate } from '@/lib/asaas/mappers';

const payment = await asaasClient.createPayment({
  customer: 'cus_xxxxx',
  billingType: 'PIX',
  value: 100.0,
  dueDate: calculateDueDate(3), // Vence em 3 dias
  description: 'Assinatura Plano QWork',
  externalReference: 'pag_123',
});

// Buscar QR Code PIX
const pixQrCode = await asaasClient.getPixQrCode(payment.id);
console.log('Código PIX:', pixQrCode.payload);
```

### Criar Cobrança via Boleto

```typescript
const payment = await asaasClient.createPayment({
  customer: 'cus_xxxxx',
  billingType: 'BOLETO',
  value: 250.0,
  dueDate: calculateDueDate(5),
  description: 'Pagamento via Boleto',
  fine: { value: 2, type: 'PERCENTAGE' }, // 2% multa
  interest: { value: 1, type: 'PERCENTAGE' }, // 1% juros ao mês
});

console.log('Boleto URL:', payment.bankSlipUrl);
```

### Criar Payment Link

```typescript
const link = await asaasClient.createPaymentLink({
  name: 'Plano Premium QWork',
  chargeType: 'DETACHED',
  value: 500.0,
  billingType: 'UNDEFINED', // Cliente escolhe a forma
  dueDateLimitDays: 7,
});

console.log('Link público:', link.url);
```

## 🔄 Mappers (Conversores)

### Mapear Método de Pagamento

```typescript
import { mapMetodoPagamentoToAsaasBillingType } from '@/lib/asaas/mappers';

const billingType = mapMetodoPagamentoToAsaasBillingType('pix');
// Retorna: 'PIX'

const billingType2 = mapMetodoPagamentoToAsaasBillingType('cartao');
// Retorna: 'CREDIT_CARD'
```

### Validar CPF/CNPJ

```typescript
import { isValidCpfCnpj, formatCpfCnpj } from '@/lib/asaas/mappers';

const valido = isValidCpfCnpj('123.456.789-00');
// Retorna: true ou false

const limpo = formatCpfCnpj('123.456.789-00');
// Retorna: '12345678900'
```

### Formatar Data

```typescript
import { formatDateToAsaas, calculateDueDate } from '@/lib/asaas/mappers';

const hoje = formatDateToAsaas(new Date());
// Retorna: '2026-02-14'

const vencimento = calculateDueDate(7);
// Retorna: '2026-02-21' (hoje + 7 dias)
```

### Gerar Referência Externa

```typescript
import { generateExternalReference } from '@/lib/asaas/mappers';

const ref = generateExternalReference('pag', 123);
// Retorna: 'pag_123_1708012800000'
```

## 🔔 Webhooks

### Validar Webhook

```typescript
import { validateWebhookSignature } from '@/lib/asaas/webhook-handler';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  if (!validateWebhookSignature(request)) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Processar webhook...
}
```

### Processar Evento

```typescript
import { handlePaymentWebhook } from '@/lib/asaas/webhook-handler';
import type { AsaasWebhookPayload } from '@/lib/asaas/types';

const payload: AsaasWebhookPayload = await request.json();

await handlePaymentWebhook(payload);
// Atualiza banco de dados automaticamente
```

## 🛠️ Tratamento de Erros

```typescript
import { AsaasApiError } from '@/lib/asaas/client';

try {
  const payment = await asaasClient.createPayment({...});
} catch (error) {
  if (error instanceof AsaasApiError) {
    console.error('Código:', error.statusCode);
    console.error('Mensagem:', error.message);
    console.error('Detalhes:', error.errors);
  }
}
```

## 📋 Tipos Principais

### AsaasCustomer

```typescript
interface AsaasCustomer {
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
  externalReference?: string;
  // ... outros campos opcionais
}
```

### AsaasPayment

```typescript
interface AsaasPayment {
  customer: string; // cus_xxxxx
  billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD';
  value: number;
  dueDate: string; // YYYY-MM-DD
  description?: string;
  externalReference?: string;
  fine?: { value: number; type: 'FIXED' | 'PERCENTAGE' };
  interest?: { value: number; type: 'PERCENTAGE' };
}
```

### AsaasWebhookPayload

```typescript
interface AsaasWebhookPayload {
  event: 'PAYMENT_RECEIVED' | 'PAYMENT_CONFIRMED' | ...;
  payment: {
    id: string;
    status: AsaasPaymentStatus;
    value: number;
    // ... outros campos
  };
}
```

## 🔐 Segurança

1. **API Key**: Nunca exponha `ASAAS_API_KEY` no frontend
2. **Webhook Secret**: Use `ASAAS_WEBHOOK_SECRET` forte e único
3. **Validação**: Sempre valide webhooks com `validateWebhookSignature()`
4. **HTTPS**: Em produção, sempre use HTTPS no webhook URL

## 📚 Referências

- [Documentação Asaas](https://docs.asaas.com)
- [API Reference](https://asaasv3.docs.apiary.io)
- [Guia Completo](../docs/ASAAS_SETUP_GUIDE.md)

## 🧪 Testes

```typescript
// Health check
const isOnline = await asaasClient.healthCheck();
console.log('Asaas online:', isOnline);

// Buscar informações da conta
const account = await asaasClient.getAccount();
console.log('Conta:', account);
```

## 💡 Dicas

1. **Sandbox primeiro**: Teste sempre no sandbox antes de produção
2. **Idempotência**: Webhooks podem ser enviados múltiplas vezes
3. **Timeout**: Responda webhooks em < 30 segundos
4. **Retry**: Implemente retry para chamadas que podem falhar

## ⚠️ Limitações

- Asaas não possui SDK oficial Node.js enterprise-grade
- Rate limits da API Asaas (consulte documentação oficial)
- PIX QR Code pode levar 1-2 segundos para gerar

## 🤝 Contribuindo

Para adicionar novos recursos:

1. Adicionar tipo em `types.ts`
2. Implementar método em `client.ts`
3. Adicionar mapper em `mappers.ts` se necessário
4. Documentar aqui

---

**Versão:** 1.0  
**Última atualização:** 14 de fevereiro de 2026
