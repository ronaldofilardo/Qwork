# 🔐 Guia de Integração Asaas Payment Gateway - QWork

**Data:** 14 de fevereiro de 2026  
**Versão:** 1.0  
**Autor:** Sistema de Desenvolvimento QWork

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Configuração Inicial](#configuração-inicial)
4. [Executar Migração do Banco](#executar-migração-do-banco)
5. [Configurar Webhooks](#configurar-webhooks)
6. [Testar a Integração](#testar-a-integração)
7. [Deploy em Produção](#deploy-em-produção)
8. [Troubleshooting](#troubleshooting)
9. [API Reference](#api-reference)

---

## 🎯 Visão Geral

A integração com Asaas Payment Gateway permite que o QWork processe pagamentos reais via:

- **PIX**: Pagamento instantâneo com QR Code
- **Boleto Bancário**: Pagamento tradicional com vencimento em 3 dias
- **Cartão de Crédito**: Pagamento via checkout Asaas (parcelamento disponível)

### Arquitetura

```
┌─────────────┐      ┌───────────────┐      ┌──────────────┐
│   Frontend  │─────▶│  API Handler  │─────▶│  Asaas API   │
│  (Checkout) │      │  (Next.js)    │      │              │
└─────────────┘      └───────────────┘      └──────────────┘
                            │                       │
                            │                       │
                            ▼                       │
                     ┌──────────────┐              │
                     │  PostgreSQL  │◀─────────────┘
                     │  (Pagamentos)│   (Webhook)
                     └──────────────┘
```

### Fluxo de Dados

1. **Criar Pagamento**: Frontend → API Handler → Asaas → Banco
2. **Receber Pagamento**: Cliente paga → Asaas envia Webhook → API atualiza banco
3. **Liberar Acesso**: Webhook handler ativa tomador automaticamente

---

## 🔧 Pré-requisitos

### 1. Conta no Asaas

- Crie uma conta em [sandbox.asaas.com](https://sandbox.asaas.com) (testes)
- Produção: [asaas.com](https://www.asaas.com)

### 2. Dependências

Já instaladas no projeto:

- `pg` (PostgreSQL client)
- `next` (framework)
- `react-hot-toast` (notificações)

### 3. Variáveis de Ambiente

Configure no arquivo `.env.local`:

```env
# ASAAS PAYMENT GATEWAY
ASAAS_API_KEY=sua_api_key_sandbox_aqui
ASAAS_API_URL=https://api-sandbox.asaas.com/v3
ASAAS_WEBHOOK_SECRET=dev_webhook_secret_change_in_production
NEXT_PUBLIC_APP_URL=http://localhost:3000

# DATABASE (certifique-se de que está configurado)
DATABASE_URL=postgresql://user:pass@host:5432/qwork
```

---

## ⚙️ Configuração Inicial

### Passo 1: Obter API Key do Asaas

1. Acesse seu painel Asaas: [sandbox.asaas.com](https://sandbox.asaas.com)
2. Vá em **Configurações** → **Integrações** → **API**
3. Clique em **"Gerar API Key"**
4. **Importante**: Copie e guarde a chave com segurança!

### Passo 2: Configurar Variáveis no Projeto

Edite o arquivo `.env.local` na raiz do projeto:

```bash
# Cole sua API Key aqui
ASAAS_API_KEY=paste_your_key_here

# Para sandbox (testes), use:
ASAAS_API_URL=https://api-sandbox.asaas.com/v3

# Gere um secret aleatório (exemplo):
ASAAS_WEBHOOK_SECRET=$(openssl rand -base64 32)

# URL do seu projeto (será usada para webhooks)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Dica**: Use um gerador de senhas forte para o `ASAAS_WEBHOOK_SECRET`.

### Passo 3: Verificar Configuração

Teste se as variáveis estão carregadas:

```bash
npm run dev
# ou
pnpm dev
```

Acesse: `http://localhost:3000/api/webhooks/asaas`

Você deve ver:

```json
{
  "service": "Asaas Webhook Handler",
  "status": "online",
  "webhookSecretConfigured": true
}
```

---

## 🗄️ Executar Migração do Banco

### Aplicar Migration

A migration adiciona campos necessários na tabela `pagamentos` e cria a tabela `webhook_logs`.

**SQL Migration**:

```bash
psql -U postgres -d qwork -f database/migrations/2026-02-14_add_asaas_payment_gateway_fields.sql
```

Ou execute diretamente no seu client PostgreSQL (pgAdmin, DBeaver, etc.):

```sql
-- Veja o arquivo completo em:
-- database/migrations/2026-02-14_add_asaas_payment_gateway_fields.sql
```

### Verificar Migração

```sql
-- Verificar novas colunas em pagamentos
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'pagamentos'
  AND column_name LIKE 'asaas%';

-- Verificar tabela webhook_logs
SELECT * FROM webhook_logs LIMIT 1;
```

**Resultado esperado**:

- 8 colunas `asaas_*` na tabela `pagamentos`
- Tabela `webhook_logs` existente com 7 colunas

---

## 🔔 Configurar Webhooks

Webhooks permitem que o Asaas notifique seu sistema quando um pagamento é confirmado.

### Desenvolvimento (localhost)

Para testar webhooks localmente, você precisa expor seu `localhost` publicamente.

#### Opção 1: ngrok (Recomendado)

```bash
# Instalar ngrok
npm install -g ngrok

# Expor porta 3000
ngrok http 3000
```

Copie a URL gerada (ex: `https://abc123.ngrok.io`)

#### Opção 2: localtunnel

```bash
# Usar sem instalar
npx localtunnel --port 3000
```

### Configurar no Painel Asaas

1. Acesse **Configurações** → **Integrações** → **Webhooks**
2. Clique em **"Adicionar Webhook"**
3. Configure:
   - **URL**: `https://abc123.ngrok.io/api/webhooks/asaas`
     (substitua pela URL do ngrok)
   - **Eventos**: Selecione:
     - ✅ `PAYMENT_CREATED`
     - ✅ `PAYMENT_CONFIRMED`
     - ✅ `PAYMENT_RECEIVED` ⭐ (MAIS IMPORTANTE)
     - ✅ `PAYMENT_OVERDUE`
     - ✅ `PAYMENT_REFUNDED`
   - **Token de Autenticação**: Use o mesmo valor de `ASAAS_WEBHOOK_SECRET`

4. Salve

### Testar Webhook

Crie um pagamento de teste no Asaas e simule o recebimento. Verifique os logs:

```bash
# No terminal onde Next.js está rodando
# Você deve ver logs como:
[Asaas Webhook] Evento recebido: PAYMENT_RECEIVED
[Asaas Webhook] 🎉 ASSINATURA ATIVADA: pag_123
```

---

## 🧪 Testar a Integração

### Teste 1: Criar Pagamento PIX

```bash
curl -X POST http://localhost:3000/api/pagamento/iniciar \
  -H "Content-Type: application/json" \
  -d '{
    "acao": "iniciar",
    "entidade_id": 1,
    "plano_id": 1,
    "numero_funcionarios": 10,
    "valor": 100.00,
    "metodo": "PIX"
  }'
```

**Resposta esperada**:

```json
{
  "success": true,
  "message": "Pagamento iniciado com sucesso no Asaas",
  "pixQrCode": {
    "payload": "00020126580014br.gov.bcb.pix..."
    "encodedImage": "iVBORw0KGgoAAAANSUhEU..."
  }
}
```

### Teste 2: Verificar no Painel Asaas

1. Acesse o painel Asaas
2. Vá em **Cobranças**
3. Você deve ver sua cobrança criada com status **"Pendente"**

### Teste 3: Simular Pagamento (Sandbox)

No painel Asaas:

1. Clique na cobrança
2. Use o botão **"Simular Pagamento"**
3. Confirme

**Resultado**: O webhook será acionado e você verá nos logs que o pagamento foi confirmado.

### Teste 4: Verificar no Banco

```sql
-- Verificar pagamento criado
SELECT id, status, asaas_payment_id, asaas_pix_qrcode
FROM pagamentos
ORDER BY criado_em DESC
LIMIT 1;

-- Verificar webhook recebido
SELECT * FROM webhook_logs ORDER BY processed_at DESC LIMIT 1;

-- Verificar tomador ativado
SELECT id, nome, pagamento_confirmado, ativa
FROM tomadores
WHERE id = 1;
```

---

## 🚀 Deploy em Produção

### 1. Criar Conta de Produção no Asaas

- Acesse [asaas.com](https://www.asaas.com) e crie uma conta empresarial
- Complete o cadastro e validação de documentos

### 2. Atualizar Variáveis de Ambiente

No Vercel/Netlify/seu provedor:

```env
# ATENÇÃO: Use API Key de PRODUÇÃO
ASAAS_API_KEY=seu_api_key_producao_aqui

# URL de PRODUÇÃO
ASAAS_API_URL=https://api.asaas.com/v3

# Secret forte e único
ASAAS_WEBHOOK_SECRET=gere_um_novo_secret_forte

# URL pública do seu app
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
```

### 3. Configurar Webhook em Produção

No painel Asaas (produção):

- **URL**: `https://seu-dominio.com/api/webhooks/asaas`
- **Token**: Mesmo valor de `ASAAS_WEBHOOK_SECRET`

### 4. Testar em Produção

Crie um pagamento de teste com valor mínimo (ex: R$ 1,00) e pague via PIX para verificar o fluxo completo.

### 5. Monitoramento

Adicione logs para monitorar em produção:

```typescript
// Em produção, envie logs para serviço externo
if (process.env.NODE_ENV === 'production') {
  // Exemplo: Sentry, Datadog, CloudWatch
  console.error('[CRITICAL] Erro no webhook:', error);
}
```

---

## 🔍 Troubleshooting

### Problema: "ASAAS_API_KEY não configurada"

**Solução**:

- Verifique que o arquivo `.env.local` existe na raiz do projeto
- Reinicie o servidor Next.js após editar `.env.local`
- Certifique-se que a variável não tem espaços: `ASAAS_API_KEY=valor`

### Problema: Webhook não está sendo recebido

**Diagnóstico**:

1. Verifique se o ngrok está rodando:

   ```bash
   curl https://abc123.ngrok.io/api/webhooks/asaas
   ```

2. Verifique logs do Asaas:
   - Painel Asaas → Webhooks → Ver Logs
   - Procure por erros HTTP (401, 404, 500)

3. Verifique o secret:
   ```bash
   echo $ASAAS_WEBHOOK_SECRET
   # Deve coincidir com o configurado no Asaas
   ```

**Solução**:

- Use um túnel estável (ngrok pago ou localtunnel)
- Verifique firewall/antivírus que podem bloquear conexões

### Problema: QR Code PIX não está sendo gerado

**Causa comum**: A API Asaas pode demorar alguns segundos para gerar o QR Code.

**Solução**:

```typescript
// Adicionar retry no handler
try {
  pixQrCode = await asaasClient.getPixQrCode(paymentResponse.id);
} catch (error) {
  // Retry após 2 segundos
  await new Promise((resolve) => setTimeout(resolve, 2000));
  pixQrCode = await asaasClient.getPixQrCode(paymentResponse.id);
}
```

### Problema: Pagamento não ativa o tomador

**Diagnóstico**:

```sql
-- Verificar se webhook foi processado
SELECT * FROM webhook_logs
WHERE payment_id = 'pay_xxxxx';

-- Verificar status do pagamento
SELECT status, data_confirmacao, plataforma_id
FROM pagamentos
WHERE id = <pagamento_id>;

-- Verificar tomador
SELECT pagamento_confirmado, ativa, status
FROM tomadores
WHERE id = <tomador_id>;
```

**Solução**:

- Verifique que o evento `PAYMENT_RECEIVED` foi recebido (não apenas `PAYMENT_CONFIRMED`)
- Reprocesse manualmente se necessário:

```sql
-- Manual: ativar tomador
UPDATE tomadores
SET pagamento_confirmado = true,
    ativa = true,
    status = 'pago',
    data_liberacao_login = NOW()
WHERE id = <tomador_id>;
```

---

## 📚 API Reference

### POST `/api/pagamento/iniciar`

Criar novo pagamento no Asaas.

**Request**:

```json
{
  "acao": "iniciar",
  "entidade_id": 1,
  "plano_id": 1,
  "numero_funcionarios": 10,
  "valor": 100.0,
  "metodo": "PIX" // ou "BOLETO", "CREDIT_CARD"
}
```

**Response**:

```json
{
  "success": true,
  "pagamento": {
    "id": 123,
    "asaas_payment_id": "pay_xxxxx",
    "asaas_pix_qrcode": "00020126...",
    "asaas_boleto_url": "https://...",
    "status": "processando"
  },
  "pixQrCode": {
    "payload": "00020126...",
    "encodedImage": "iVBORw0KGgo..."
  }
}
```

### POST `/api/webhooks/asaas`

Endpoint para receber notificações do Asaas (não chamar manualmente).

**Headers requeridos**:

```
asaas-access-token: <ASAAS_WEBHOOK_SECRET>
Content-Type: application/json
```

**Payload** (enviado pelo Asaas):

```json
{
  "event": "PAYMENT_RECEIVED",
  "payment": {
    "id": "pay_xxxxx",
    "customer": "cus_xxxxx",
    "status": "RECEIVED",
    "value": 100.0,
    "netValue": 98.5,
    "externalReference": "pag_123_1234567890"
  }
}
```

### GET `/api/pagamento/status?pagamento_id=123`

Consultar status de um pagamento.

**Response**:

```json
{
  "success": true,
  "pagamento": {
    "id": 123,
    "status": "pago",
    "valor": 100.0,
    "asaas_payment_id": "pay_xxxxx",
    "data_confirmacao": "2026-02-14T10:30:00Z"
  }
}
```

---

## 📞 Suporte

### Documentação Asaas

- [Docs Oficiais](https://docs.asaas.com)
- [API Reference](https://asaasv3.docs.apiary.io)

### Estrutura do Código

```
lib/asaas/
├── client.ts           # Cliente HTTP Asaas
├── types.ts            # Tipos TypeScript
├── mappers.ts          # Conversores de dados
└── webhook-handler.ts  # Processador de webhooks

app/api/
├── pagamento/
│   ├── iniciar/route.ts
│   ├── handlers.ts     # Lógica de negócio
│   └── schemas.ts      # Validações Zod
└── webhooks/
    └── asaas/route.ts  # Endpoint de webhook

components/
└── CheckoutAsaas.tsx   # Componente de checkout

database/migrations/
└── 2026-02-14_add_asaas_payment_gateway_fields.sql
```

---

## ✅ Checklist de Deploy

- [ ] Conta Asaas de produção criada e validada
- [ ] API Key de produção gerada
- [ ] Variáveis de ambiente configuradas no servidor
- [ ] Migration do banco executada
- [ ] Webhook configurado com URL de produção
- [ ] Teste de pagamento PIX realizado com sucesso
- [ ] Teste de pagamento Boleto realizado com sucesso
- [ ] Teste de ativação automática do tomador confirmado
- [ ] Monitoramento de logs configurado
- [ ] Backup do banco de dados realizado

---

**Última atualização:** 14 de fevereiro de 2026
