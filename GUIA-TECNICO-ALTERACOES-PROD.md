# 🔄 GUIDE TÉCNICO: APLICAR CADA ALTERAÇÃO EM PRODUÇÃO

## Passo a Passo Detalhado com Diffs

**Data:** 16 de fevereiro de 2026  
**Versão Dev Base:** main branch (14-16 fev)  
**Ambiente Alvo:** PRODUÇÃO

---

## 📌 RESUMO EXECUTIVO - ARQUIVOS A ALTERAR

| #   | Arquivo                                           | Tipo   | Ação      | Linhas  | Severidade |
| --- | ------------------------------------------------- | ------ | --------- | ------- | ---------- |
| 1   | `lib/laudo-auto.ts`                               | Código | Modificar | 167-189 | 🔴 CRÍTICA |
| 2   | `app/api/emissor/laudos/[loteId]/pdf/route.ts`    | Código | Modificar | 273-284 | 🟡 MÉDIA   |
| 3   | `app/api/emissor/laudos/[loteId]/upload/route.ts` | Código | Modificar | 268-291 | 🔴 CRÍTICA |
| 4   | `lib/asaas/client.ts`                             | Novo   | Criar     | N/A     | 🟢 NOVO    |
| 5   | `lib/asaas/types.ts`                              | Novo   | Criar     | N/A     | 🟢 NOVO    |
| 6   | `lib/asaas/mappers.ts`                            | Novo   | Criar     | N/A     | 🟢 NOVO    |
| 7   | `lib/asaas/webhook-handler.ts`                    | Novo   | Criar     | N/A     | 🟢 NOVO    |
| 8   | `lib/asaas/README.md`                             | Novo   | Criar     | N/A     | 🟢 NOVO    |
| 9   | `app/api/pagamento/asaas/criar/route.ts`          | Novo   | Criar     | N/A     | 🟢 NOVO    |
| 10  | `app/api/pagamento/asaas/webhooks/route.ts`       | Novo   | Criar     | N/A     | 🟢 NOVO    |
| 11  | `components/CheckoutAsaas.tsx`                    | Novo   | Criar     | N/A     | 🟢 NOVO    |
| 12  | `lib/auth/date-validator.ts`                      | Novo   | Criar     | N/A     | 🟢 NOVO    |
| 13  | `lib/auth/password-generator-corrigido.ts`        | Novo   | Criar     | N/A     | 🟢 NOVO    |
| 14  | `database/migrations/165_fix_...sql`              | Novo   | Executar  | N/A     | 🔴 CRÍTICA |

---

# ✏️ ALTERAÇÃO 1: lib/laudo-auto.ts

## Localização

`lib/laudo-auto.ts` → linhas ~167-189 na função `gerarLaudoCompletoEmitirPDF()`

## Problema

PDF é gerado localmente mas `status` permanece `'rascunho'` no banco.  
Isso faz o card aparecer na aba errada.

## Código ANTES (DEV)

```typescript
// Linhas ~167-189
async function gerarLaudoCompletoEmitirPDF(loteId: string) {
  // ... código anterior ...

  // Salvar hash do PDF
  await db.query(
    `UPDATE laudos
     SET hash_pdf = $1,
         atualizado_em = NOW()
     WHERE id = $2 AND status = 'rascunho'`,
    [hashPdf, laudoId]
  );

  logger.info(`Laudo ${laudoId} emitido - PDF gerado localmente`);
  return { success: true, laudo: { id: laudoId } };
}
```

## Código DEPOIS (PROD)

```typescript
// Linhas ~167-189
async function gerarLaudoCompletoEmitirPDF(loteId: string) {
  // ... código anterior ...

  // Salvar hash do PDF E marcar como 'emitido'
  await db.query(
    `UPDATE laudos
     SET hash_pdf = $1,
         status = 'emitido',        // ← ADICIONAR
         emitido_em = NOW(),         // ← ADICIONAR
         atualizado_em = NOW()
     WHERE id = $2 AND status = 'rascunho'`,
    [hashPdf, laudoId]
  );

  logger.info(
    `Laudo ${laudoId} emitido! PDF gerado localmente e marcado como 'emitido'`
  );
  return { success: true, laudo: { id: laudoId } };
}
```

## Como Aplicar em PROD

```bash
# Opção 1: Via SCP/SFTP
# Copiar arquivo local para produção
scp lib/laudo-auto.ts usuario@prod-server:/opt/qwork/lib/

# Opção 2: Via Git
cd /opt/qwork
git pull origin main  # Se toda a branch foi sincronizada

# Opção 3: Manual - Editar arquivo em PROD
ssh usuario@prod-server
nano /opt/qwork/lib/laudo-auto.ts
# Fazer as alterações manualmente (linhas 167-189)
# Salvar (Ctrl+X, Y, Enter)

# Após qualquer opção:
npm run build
pm2 restart qwork-prod
```

## Validação

```sql
-- Testar após deploy
-- Gerar um laudo novo
-- Verificar resultado:

SELECT id, status, hash_pdf, emitido_em
FROM laudos
WHERE id = 'laudo_id_teste'
ORDER BY atualizado_em DESC
LIMIT 1;

-- Esperado:
-- id: laudo_id_teste
-- status: 'emitido'        ← DEVE SER 'emitido'
-- hash_pdf: <UUID>
-- emitido_em: 2026-02-16T14:30:00Z  ← NÃO pode ser NULL
```

---

# ✏️ ALTERAÇÃO 2: app/api/emissor/laudos/[loteId]/pdf/route.ts

## Localização

`app/api/emissor/laudos/[loteId]/pdf/route.ts` → linhas ~273-284

## Problema

Query impede UPDATE de hash quando laudo já tem `status='emitido'`.

## Código ANTES

```typescript
// Linhas ~273-284
const result = await db.query(
  `UPDATE laudos
   SET hash_pdf = $1,
       arquivo_remoto_provider = $3,
       arquivo_remoto_url = $4
   WHERE id = $2
     AND (hash_pdf IS NULL OR hash_pdf = '')
     AND status IN ('rascunho', 'aprovado')`, // ← FALTA 'emitido'
  [hashPdf, laudoId, provider, url]
);
```

## Código DEPOIS

```typescript
// Linhas ~273-284
const result = await db.query(
  `UPDATE laudos
   SET hash_pdf = $1,
       arquivo_remoto_provider = $3,
       arquivo_remoto_url = $4
   WHERE id = $2
     AND (hash_pdf IS NULL OR hash_pdf = '')
     AND status IN ('rascunho', 'aprovado', 'emitido')`, // ← ADICIONAR 'emitido'
  [hashPdf, laudoId, provider, url]
);
```

## Como Aplicar

```bash
# Opção 1: Sed (automatizado)
sed -i "s/status IN ('rascunho', 'aprovado')/status IN ('rascunho', 'aprovado', 'emitido')/g" \
  /opt/qwork/app/api/emissor/laudos/[loteId]/pdf/route.ts

# Opção 2: Manual
# Usar editor (nano, vim) e procurar por "status IN" na linha ~273
# Adicionar 'emitido' ao final da lista

npm run build
pm2 restart qwork-prod
```

---

# ✏️ ALTERAÇÃO 3: app/api/emissor/laudos/[loteId]/upload/route.ts

## Localização

`app/api/emissor/laudos/[loteId]/upload/route.ts` → linhas ~268-291

## Problema (3A)

Condição `WHERE status = 'rascunho'` bloqueia UPDATE se laudo já foi marcado emitido.

## Problema (3B)

`emitido_em = NOW()` sempre sobrescreve o valor original.

## Código ANTES (CRÍTICO!)

```typescript
// Linhas ~268-291
const updateResult = await db.query(
  `UPDATE laudos
   SET
     arquivo_remoto_provider = $1,
     arquivo_remoto_url = $2,
     arquivo_remoto_size = $3,
     arquivo_remoto_hash = $4,
     status = 'enviado',
     emitido_em = NOW(),              // ← PROBLEMA 3B: sobrescreve
     envio_data = NOW(),
     atualizado_em = NOW()
   WHERE id = $5
     AND status = 'rascunho'          // ← PROBLEMA 3A: muito restritivo!
   AND arquivo_remoto_url IS NULL`,
  [provider, url, size, hash, laudoId]
);
```

## Código DEPOIS (CORRETO)

```typescript
// Linhas ~268-291
const updateResult = await db.query(
  `UPDATE laudos
   SET
     arquivo_remoto_provider = $1,
     arquivo_remoto_url = $2,
     arquivo_remoto_size = $3,
     arquivo_remoto_hash = $4,
     status = 'enviado',
     emitido_em = COALESCE(emitido_em, NOW()), // ← FIX 3B: preserva original
     envio_data = NOW(),
     atualizado_em = NOW()
   WHERE id = $5                                 // ← FIX 3A: SEM verificação status
     AND arquivo_remoto_url IS NULL`,
  [provider, url, size, hash, laudoId]
);
```

## Como Aplicar

### Passo 1: Remover condição de status

```bash
# Verificar linha exata
grep -n "WHERE id.*AND status = 'rascunho'" /opt/qwork/app/api/emissor/laudos/[loteId]/upload/route.ts

# Editar manualmente:
ssh usuario@prod-server
nano /opt/qwork/app/api/emissor/laudos/[loteId]/upload/route.ts

# Procurar por: WHERE id = $5 AND status = 'rascunho'
# Mudar para:   WHERE id = $5
# (Remover "AND status = 'rascunho'")
```

### Passo 2: Adicionar COALESCE a emitido_em

```bash
# Na mesma linha do emitido_em:
# ANTES: emitido_em = NOW(),
# DEPOIS: emitido_em = COALESCE(emitido_em, NOW()),

# Verificar resultado:
grep "emitido_em =" /opt/qwork/app/api/emissor/laudos/[loteId]/upload/route.ts
# Deve mostrar: emitido_em = COALESCE(emitido_em, NOW()),
```

### Passo 3: Deploy

```bash
npm run build
pm2 restart qwork-prod
```

## Validação

```sql
-- Após deploy, testar upload
-- 1. Gerar laudo
-- 2. Upload ao bucket

SELECT
  id,
  status,
  emitido_em,
  arquivo_remoto_url,
  atualizado_em
FROM laudos
WHERE id = 'laudo_teste'
LIMIT 1;

-- Esperado:
-- status: 'enviado'     (mudou de 'emitido')
-- emitido_em: <data_original_não_alterada>
-- arquivo_remoto_url: 's3://...'
```

---

# 🟢 CRIAÇÃO 4-8: ASAAS Gateway (lib/asaas/\*)

## Localização

Criar pasta `lib/asaas/` com 5 arquivos novos

## Estrutura

```
lib/
├─ asaas/
│  ├─ client.ts           (cliente HTTP Asaas)
│  ├─ types.ts            (TypeScript interfaces)
│  ├─ mappers.ts          (conversão de dados)
│  ├─ webhook-handler.ts  (processar webhooks)
│  └─ README.md           (documentação)
```

## Passo a Passo

### Step 1: Criar diretório

```bash
mkdir -p /opt/qwork/lib/asaas
```

### Step 2: Copiar arquivos do DEV

```bash
# Do seu local com os arquivos DEV:
scp lib/asaas/* usuario@prod-server:/opt/qwork/lib/asaas/

# Ou via Git:
git pull origin main
```

### Step 3: Verificar estrutura

```bash
ssh usuario@prod-server
ls -la /opt/qwork/lib/asaas/

# Esperado listar:
# client.ts
# types.ts
# mappers.ts
# webhook-handler.ts
# README.md
```

### Step 4: Import no código principal

Estes arquivos serão importados automaticamente quando você importar:

```typescript
// No seu código:
import { AsaasClient } from '@/lib/asaas/client';
import type { AsaasPayment } from '@/lib/asaas/types';
```

---

# 🟢 CRIAÇÃO 9-10: API Routes Asaas

## Localização

- `app/api/pagamento/asaas/criar/route.ts`
- `app/api/pagamento/asaas/webhooks/route.ts`

## Estrutura

```
app/
├─ api/
│  └─ pagamento/
│     └─ asaas/
│        ├─ criar/
│        │  └─ route.ts
│        └─ webhooks/
│           └─ route.ts
```

## Como Aplicar

```bash
# Criar estrutura de diretórios
mkdir -p /opt/qwork/app/api/pagamento/asaas/criar
mkdir -p /opt/qwork/app/api/pagamento/asaas/webhooks

# Copiar arquivos
scp app/api/pagamento/asaas/criar/route.ts \
  usuario@prod-server:/opt/qwork/app/api/pagamento/asaas/criar/

scp app/api/pagamento/asaas/webhooks/route.ts \
  usuario@prod-server:/opt/qwork/app/api/pagamento/asaas/webhooks/

# Verificar
ssh usuario@prod-server
ls -la /opt/qwork/app/api/pagamento/asaas/criar/route.ts
ls -la /opt/qwork/app/api/pagamento/asaas/webhooks/route.ts
```

## Funcionalidade POST /api/pagamento/asaas/criar

Este endpoint recebe:

```json
{
  "cliente_id": "123",
  "valor": 100.0,
  "tipo": "PIX", // ou "BOLETO" ou "CARTAO"
  "descricao": "Pagamento de serviço"
}
```

E retorna:

```json
{
  "success": true,
  "pix": {
    "qrCode": "00020126360014...",
    "copyPaste": "00020126360014..."
  }
}
```

## Funcionalidade POST /api/pagamento/asaas/webhooks

Recebe eventos do Asaas e atualiza status de pagamentos.

Asaas enviará:

```
POST /api/pagamento/asaas/webhooks
Header: asaas-signature: SIGNATURE_AQUI
Body: {
  "event": "payment.confirmed",
  "data": { "id": "...", "status": "RECEIVED" }
}
```

---

# 🟢 CRIAÇÃO 11: Componente CheckoutAsaas

## Localização

`components/CheckoutAsaas.tsx`

## Como Aplicar

```bash
# Copiar arquivo
scp components/CheckoutAsaas.tsx \
  usuario@prod-server:/opt/qwork/components/

# Verificar
ssh usuario@prod-server
ls -la /opt/qwork/components/CheckoutAsaas.tsx
```

## Uso em Página

```typescript
// Em qualquer página que needed pagamento:
import { CheckoutAsaas } from '@/components/CheckoutAsaas';

export default function PaymentPage() {
  return (
    <CheckoutAsaas
      clienteId="cliente_123"
      valor={100.00}
      onPaymentSuccess={(result) => {
        console.log('Pagamento criado:', result);
      }}
    />
  );
}
```

---

# 🟢 CRIAÇÃO 12: Validador de Datas

## Localização

`lib/auth/date-validator.ts`

## Como Aplicar

```bash
# Crear arquivo (se não existir)
touch /opt/qwork/lib/auth/date-validator.ts

# Copiar conteúdo via SCP
scp lib/auth/date-validator.ts \
  usuario@prod-server:/opt/qwork/lib/auth/

# Ou criar manualmente:
cat > /opt/qwork/lib/auth/date-validator.ts << 'EOF'
/**
 * Valida se uma data de nascimento é válida
 * Rejeita datas impossíveis como 31/02/1990
 */
export function isDataValida(dataNascimento: string): boolean {
  // Aceita formatos: DD/MM/YYYY, YYYY-MM-DD, DDMMYYYY
  let dia, mes, ano;

  if (dataNascimento.includes('/')) {
    const [d, m, y] = dataNascimento.split('/');
    dia = parseInt(d);
    mes = parseInt(m);
    ano = parseInt(y);
  } else if (dataNascimento.includes('-')) {
    const [y, m, d] = dataNascimento.split('-');
    ano = parseInt(y);
    mes = parseInt(m);
    dia = parseInt(d);
  } else if (dataNascimento.length === 8) {
    dia = parseInt(dataNascimento.substring(0, 2));
    mes = parseInt(dataNascimento.substring(2, 4));
    ano = parseInt(dataNascimento.substring(4, 8));
  } else {
    return false;
  }

  // Usar Date constructor do JavaScript para validar
  const date = new Date(ano, mes - 1, dia);
  const isValid =
    date.getFullYear() === ano &&
    date.getMonth() === mes - 1 &&
    date.getDate() === dia;

  return isValid;
}
EOF

chmod 644 /opt/qwork/lib/auth/date-validator.ts
```

## Teste

```typescript
// Testar após criar:
import { isDataValida } from '@/lib/auth/date-validator';

console.log(isDataValida('15/03/1990')); // true
console.log(isDataValida('31/02/1990')); // false
console.log(isDataValida('1990-03-15')); // true
```

---

# 🟢 CRIAÇÃO 13: Password Generator Corrigido

## Localização

`lib/auth/password-generator-corrigido.ts`

## Como Aplicar

```bash
# Copiar arquivo
scp lib/auth/password-generator-corrigido.ts \
  usuario@prod-server:/opt/qwork/lib/auth/

# Ou integrar na função existente:
# Se já tiver /lib/auth/password-generator.ts
# Adicione a validação:
```

## Mudança Necessária

Se já tiver `gerarSenhaDeNascimento()`, adicione validação:

```typescript
// ANTES:
export function gerarSenhaDeNascimento(dataNascimento: string): string {
  return dataNascimento.replace(/\D/g, ''); // apenas números
}

// DEPOIS:
import { isDataValida } from './date-validator';

export function gerarSenhaDeNascimento(dataNascimento: string): string {
  if (!isDataValida(dataNascimento)) {
    throw new Error('Data de nascimento inválida');
  }
  return dataNascimento.replace(/\D/g, ''); // apenas números
}
```

---

# 🗄️ CRIAÇÃO 14: Migração 165 SQL

**Já foi descrito em FASE 1 do documento anterior**

Resumo:

```sql
-- Executar ANTES de qualquer outro script
-- Arquivo: database/migrations/165_fix_atualizar_ultima_avaliacao_trigger.sql

DROP TRIGGER IF EXISTS trigger_atualizar_ultima_avaliacao ON lotes_avaliacao;
DROP FUNCTION IF EXISTS atualizar_ultima_avaliacao_funcionario();

CREATE FUNCTION atualizar_ultima_avaliacao_funcionario() RETURNS TRIGGER AS $$
BEGIN
  UPDATE funcionarios
  SET ultima_avaliacao_id = NEW.id
  WHERE id = NEW.funcionario_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_ultima_avaliacao
AFTER INSERT ON lotes_avaliacao
FOR EACH ROW EXECUTE FUNCTION atualizar_ultima_avaliacao_funcionario();
```

---

# 🎯 ORDEM RECOMENDADA DE EXECUÇÃO

## Na Sequência Correta:

```
1. ✅ Fazer backup do banco
   └─→ pg_dump ... > backup-2026-02-16.sql

2. ✅ Executar Migração 165 (SQL)
   └─→ CRÍTICA: Deve ser PRIMEIRA!

3. ✅ Sincronizar laudos (SQL)
   └─→ Criar table asaas_pagamentos
   └─→ Corrigir laudos órf~aos

4. ✅ Actualizar Variáveis de Ambiente
   └─→ .env adicionar credenciais Asaas

5. ✅ Deploy de código
   └─→ Copiar arquivos modificados (1-3)
   └─→ Copiar arquivos novos (4-13)
   └─→ npm install (se deps novas)
   └─→ npm run build
   └─→ Verificar 0 erros

6. ✅ Restart do servidor
   └─→ pm2 restart qwork-prod

7. ✅ Testes imediatos (5-10 minutos)
   └─→ Health check
   └─→ Testar geração PDF
   └─→ Testar Upload
   └─→ Testar Asaas

8. ⚠️ Monitorar (24h)
   └─→ Logs de erro
   └─→ Performance
   └─→ Usuários funcionários
```

---

# 📋 CHECKLIST FINAL - ARQUIVOS EM PROD

```
ARQUIVOS MODIFICADOS:
☐ lib/laudo-auto.ts
  └─ Status: 'emitido' + emitido_em adicionados (linhas 167-189)

☐ app/api/emissor/laudos/[loteId]/pdf/route.ts
  └─ 'emitido' adicionado ao WHERE IN (linhas 273-284)

☐ app/api/emissor/laudos/[loteId]/upload/route.ts
  └─ Removido WHERE status='rascunho' (linhas 268-291)
  └─ COALESCE adicionado a emitido_em

ARQUIVOS NOVOS - ASAAS:
☐ lib/asaas/client.ts
☐ lib/asaas/types.ts
☐ lib/asaas/mappers.ts
☐ lib/asaas/webhook-handler.ts
☐ lib/asaas/README.md

ARQUIVOS NOVOS - API:
☐ app/api/pagamento/asaas/criar/route.ts
☐ app/api/pagamento/asaas/webhooks/route.ts

ARQUIVOS NOVOS - FRONTEND:
☐ components/CheckoutAsaas.tsx

ARQUIVOS NOVOS - VALIDAÇÃO:
☐ lib/auth/date-validator.ts
☐ lib/auth/password-generator-corrigido.ts

MIGRAÇÕES SQL:
☐ Migração 165 executada (trigger Q37)
☐ Table asaas_pagamentos criada
☐ Laudos sincronizados (se problemas)

CONFIGURAÇÃO:
☐ .env.production atualizado com ASAAS_*
☐ Build sem erros (npm run build)
☐ Restart realizado

VALIDAÇÃO PÓS-DEPLOY:
☐ Health check OK
☐ Laudo gerado: status='emitido' ✓
☐ Upload ao bucket: emitido_em preservado ✓
☐ Asaas: API conectada ✓
☐ Q37: Salva sem erro ✓
☐ Senhas: Rejeita datas inválidas ✓
```

---

## 🚨 ERROS COMUNS E SOLUÇÕES

| Erro                                    | Causa                                   | Solução                                               |
| --------------------------------------- | --------------------------------------- | ----------------------------------------------------- |
| "Update laudos SET hash_pdf..." falseia | Migração 165 não foi executada          | Executar SQL da migração 165                          |
| Q37 não salva                           | Função trigger corrompida               | Re-criar trigger com código correto                   |
| Upload falha                            | WHERE status='rascunho' ainda no código | Remover condição de status                            |
| Asaas 401 Unauthorized                  | API Key inválida no .env                | Verificar ASAAS_API_KEY em produção                   |
| Build falha com "Cannot find module"    | Novos arquivos não copiados             | SCP dos arquivos novos (lib/asaas, app/api/pagamento) |
| Card aparece em aba errada              | Laudo não tem status='emitido'          | Executar script de sync de laudos                     |
| emitido_em muda após upload             | Falta COALESCE na query                 | Adicionar COALESCE(emitido_em, NOW())                 |

---

**Documento Criado:** 16 de fevereiro de 2026  
**Próx Passo:** Exectar em sequência: Migração 165 → Deploy código → Testes
