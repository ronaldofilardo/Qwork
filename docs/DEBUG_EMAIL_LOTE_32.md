# Debug: Sistema de Email - Lote #32

**Data**: 03/05/2026  
**Problema**: Lote ID=32 entrou em estado `pago` mas email não foi enviado para ronaldofilardo@gmail.com

---

## 🔍 Root Cause: Hardcoding de SMTP_HOST

### Problema Identificado

Em `lib/email.ts`, a função `createTransporter()` tinha:

```typescript
// ❌ ANTES (hardcoded)
host: 'smtp.office365.com',
port: 587,
```

Mas **não estava lendo** as variáveis de ambiente:

- `SMTP_HOST` (não configurado em `.env.local`)
- `SMTP_PORT` (não configurado em `.env.local`)

### Conflito entre Ambientes

| Ambiente           | SMTP_HOST                | SMTP_PORT  | Status |
| ------------------ | ------------------------ | ---------- | ------ |
| `.env.local` (DEV) | ❌ Faltava               | ❌ Faltava | BUGADO |
| `.env.staging`     | ✅ smtp-mail.outlook.com | ✅ 587     | OK     |
| `.env.production`  | ❌ Faltava               | ❌ Faltava | BUGADO |

---

## ✅ Correções Aplicadas

### 1. **Refatorar `lib/email.ts`**

```typescript
// ✅ DEPOIS
const SMTP_HOST = process.env.SMTP_HOST ?? 'smtp.office365.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT ?? '587', 10);

function createTransporter() {
  return nodemailer.createTransport({
    host: SMTP_HOST, // Lê do .env
    port: SMTP_PORT, // Lê do .env
    secure: SMTP_PORT === 465, // TLS se porta 465, STARTTLS se 587
    auth: {
      user: SMTP_FROM,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}
```

### 2. **Adicionar variáveis faltantes**

**`.env.local`**:

```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=contato@qwork.app.br
SMTP_PASSWORD=5978rdF*
SMTP_FROM=contato@qwork.app.br
NOTIFY_EMAIL=ronaldofilardo@gmail.com
```

**`.env.production`**: Mesmo

### 3. **Adicionar logging robusto**

- ✅ `notificarLoteLiberado()`: Log de sucesso + erro com detalhes de SMTP
- ✅ `dispararEmailLotePago()`: Log de entrada + consulta DB + erro
- ✅ `webhook-handler.ts`: Log de início/sucesso/falha ao disparar email

---

## 🧪 Como Testar

### Em DEV (localhost)

```bash
# Terminal 1: Inicie o servidor
pnpm dev

# Terminal 2: Teste o email
curl "http://localhost:3000/api/debug/test-email?loteId=32"
```

**Saída esperada**:

```json
{
  "success": true,
  "message": "Email enviado com sucesso para lote #32",
  "debug": {
    "SMTP_HOST": "smtp.office365.com",
    "SMTP_PORT": "587",
    "SMTP_USER": "contato@qwork.app.br",
    "NOTIFY_EMAIL": "ronaldofilardo@gmail.com",
    "NODE_ENV": "development"
  }
}
```

**Se falhar**, verifique:

1. ✅ SMTP_PASSWORD está correto? (não expirou?)
2. ✅ Firewall local bloqueia SMTP porta 587?
3. ✅ As credenciais funcionam em outro cliente (Outlook, Thunderbird)?

### Em Vercel (STAGING/PROD)

1. Acesse: https://vercel.com/ronaldofilardos-projects/qwork/settings/environment-variables
2. Verifique se existem:
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASSWORD`
   - `NOTIFY_EMAIL`

   Se faltarem, adicione:

   ```
   SMTP_HOST = smtp.office365.com
   SMTP_PORT = 587
   ```

---

## 🐛 Possíveis Próximas Causas (se ainda não funcionar)

1. **Credenciais SMTP expiradas**: A senha `5978rdF*` pode ter expirado
   - **Solução**: Gerar nova App Password no Microsoft 365

2. **Firewall corporativo bloqueia SMTP**: Alguns firewalls bloqueiam porta 587
   - **Solução**: Testar de outro IP ou rede

3. **Limite de taxa (rate limit) do servidor SMTP**: Muitos emails em pouco tempo
   - **Solução**: Implementar fila (Bull, RabbitMQ) para envios assincronos

4. **Email rejeitado por SPF/DKIM**: Configuração de DNS incompleta
   - **Solução**: Verificar registros SPF e DKIM do domínio qwork.app.br

---

## 📋 Arquivos Modificados

```
lib/email.ts
├─ createTransporter() — Refatorado para ler SMTP_HOST/PORT
├─ notificarLoteLiberado() — Adicionado try/catch + logging
└─ dispararEmailLotePago() — Adicionado logging detalhado

lib/asaas/webhook-handler.ts
└─ activateSubscription() — Melhorado logging do email

.env.local
├─ +SMTP_HOST
└─ +SMTP_PORT

.env.production
├─ +SMTP_HOST
└─ +SMTP_PORT

app/api/debug/test-email/route.ts (novo)
└─ Rota para testar envio de email em DEV
```

---

## ⚠️ Limpeza Necessária

- [ ] **Remover `/api/debug/test-email/route.ts` antes de deploy para produção**
  - Rota de debug pode ser risco de segurança

---

## 📝 Registro de Testes

```
Data/Hora: 03/05/2026 14:30
Lote ID: 32
Ação: Marcado como pago via webhook Asaas
Email: ronaldofilardo@gmail.com
Status: ❓ Pendente (execute teste acima)
```
