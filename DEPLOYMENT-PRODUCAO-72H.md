# 🚀 PLANO DE DEPLOYMENT PARA PRODUÇÃO
## Todas as Alterações das Últimas 72 Horas

**Data:** 16 de fevereiro de 2026  
**Ambiente:** PRODUÇÃO  
**Windows Server/Cloud Production**

---

## 📋 ÍNDICE RÁPIDO

1. **Pré-requisitos** - Validações iniciais
2. **Fase 1: Banco de Dados** - Migrações SQL
3. **Fase 2: Variáveis de Ambiente** - Configuração Asaas
4. **Fase 3: Deploy de Código** - Build e push
5. **Fase 4: Sincronização de Dados** - Dados históricos
6. **Fase 5: Testes em Produção** - Validações críticas
7. **Rollback Procedures** - Plano de contingência

---

# ✅ FASE 0: PRÉ-REQUISITOS E VALIDAÇÕES

## 0.1 Checklist Pré-Deployment

```
Itens Essenciais:
☐ Banco de dados PostgreSQL/Neon acessível (acesso root/admin)  
☐ Credenciais Asaas obtidas (API Key + Webhook Secret)
☐ Servidor de produção com acesso SSH/RDP
☐ Git branch 'main' atualizado com todas as correções
☐ Build local testado (npm run build sem erros)
☐ Backup completo do banco de dados antes de iniciar
☐ Acesso a NextJS env files em produção
☐ Verificação de espaço em disco (mínimo 5GB livre)
```

## 0.2 Credenciais Asaas a Obter

```
CRÍTICO - Estas informações são essenciais:

1. Asaas API Key
   - Login em https://app.asaas.com
   - Seção: Configurações → Desenvolvedores → API
   - Copiar: Chave da API

2. Webhook Secret (para validação de assinatura)
   - Seção: Configurações → Webhooks
   - Copiar: Chave de validação

3. Customer ID (para PIX)
   - Obter via API: GET /v3/customers/me
   - Ou em: Configurações → Dados da Conta

4. Ambiente Asaas
   - PRODUÇÃO: https://api.asaas.com
   - SANDBOX: https://sandbox.asaas.com
   - Para PROD, usar apenas "api.asaas.com"
```

## 0.3 Backup Banco de Dados (MUITO IMPORTAN
TE)

```bash
# Neon (PostgreSQL Cloud)
# Se usando Neon:
pg_dump "postgresql://user:password@ep-*.neon.tech/database?sslmode=require" \
  > backup-prod-2026-02-16.sql

# Ou via interface Neon:
# 1. Neon Dashboard → Project → Branch → Databases
# 2. Click em "..." → Export
# 3. Salvar arquivo em local seguro

# Se self-hosted PostgreSQL:
pg_dump -U postgres -d qwork_prod > backup-prod-2026-02-16.sql
```

---

# 🗄️ FASE 1: MIGRAÇÕES DE BANCO DE DADOS

## ORDEM CRÍTICA DE EXECUÇÃO:
**1️⃣ SEMPRE executar Migração 165 ANTES das outras**

### 1.1 Migração 165 - Corrigir Trigger Q37

**Arquivo Original Dev:** `database/migrations/165_fix_atualizar_ultima_avaliacao_trigger.sql`

**Script para Produção:**

```sql
-- =====================================================
-- MIGRAÇÃO 165: Fix trigger atualizar_ultima_avaliacao
-- Data: 2026-02-16
-- Descrição: Remove colunas inexistentes (codigo, ultimo_lote_codigo)
-- =====================================================

-- Step 1: Verificar estado atual da trigger
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'atualizar_ultima_avaliacao_funcionario'
AND routine_type = 'FUNCTION';

-- Step 2: Drop da trigger existente (evita conflito de recriação)
DROP TRIGGER IF EXISTS trigger_atualizar_ultima_avaliacao 
ON lotes_avaliacao CASCADE;

-- Step 3: Drop da função antiga
DROP FUNCTION IF EXISTS atualizar_ultima_avaliacao_funcionario() CASCADE;

-- Step 4: Recriar função CORRIGIDA (sem referencias a colunas inexistentes)
CREATE OR REPLACE FUNCTION atualizar_ultima_avaliacao_funcionario()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE funcionarios
  SET 
    ultima_avaliacao_id = NEW.id,
    ultima_avaliacao_data = NEW.criado_em,
    ultima_avaliacao_score = NEW.score,
    atualizado_em = NOW()
  WHERE id = NEW.funcionario_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Recriar trigger com a função corrigida
CREATE TRIGGER trigger_atualizar_ultima_avaliacao
AFTER INSERT OR UPDATE ON lotes_avaliacao
FOR EACH ROW
EXECUTE FUNCTION atualizar_ultima_avaliacao_funcionario();

-- Step 6: Validação
SELECT COUNT(*) as trigger_count FROM information_schema.triggers 
WHERE trigger_name = 'trigger_atualizar_ultima_avaliacao';
-- Esperado: 1 row

COMMIT;
```

**Validação Pós-Migração 165:**

```sql
-- Testar inserção na tabela lotes_avaliacao
-- (isso vai dispara a trigger)
INSERT INTO lotes_avaliacao (funcionario_id, score, criado_em)
VALUES (1, 85, NOW())
RETURNING *;

-- Verificar que funcionarios foi atualizado
SELECT ultima_avaliacao_id, ultima_avaliacao_data, ultima_avaliacao_score
FROM funcionarios
WHERE id = 1;
-- Deve ter valores preenchidos
```

---

### 1.2 Sincronização de Laudos - Verificação Crítica

**ANTES de executar qualquer outra migração, executar:**

```sql
-- =====================================================
-- VERIFICAÇÃO PRÉ-PRODUÇÃO: Estado atual dos laudos
-- =====================================================

-- Verificação 1: Laudos com PDF gerado mas status errado
SELECT 
  id,
  lote_id,
  status,
  hash_pdf IS NOT NULL as tem_pdf,
  arquivo_remoto_url IS NOT NULL as tem_bucket,
  emitido_em,
  atualizado_em
FROM laudos
WHERE hash_pdf IS NOT NULL 
  AND status = 'rascunho'  -- ← PROBLEMA: PDF existe mas está rascunho
ORDER BY atualizado_em DESC;

-- Verificação 2: Laudos no bucket mas sem metadados
SELECT 
  id,
  lote_id,
  status,
  arquivo_remoto_provider,
  arquivo_remoto_url IS NOT NULL as tem_url,
  emitido_em
FROM laudos
WHERE arquivo_remoto_url IS NOT NULL
  AND status != 'enviado'  -- ← Deveria ser 'enviado'
ORDER BY atualizado_em DESC;

-- Verificação 3: Contar problemas
SELECT 
  COUNT(CASE WHEN hash_pdf IS NOT NULL AND status = 'rascunho' THEN 1 END) as laudos_pdf_mas_rascunho,
  COUNT(CASE WHEN arquivo_remoto_url IS NOT NULL AND status != 'enviado' THEN 1 END) as laudos_bucket_status_errado
FROM laudos;
```

**Se encontrar problemas:**

```sql
-- =====================================================
-- SYNC DE EMERGÊNCIA: Corrigir laudos problemáticos
-- =====================================================

-- Caso 1: PDF gerado localmente mas status='rascunho'
UPDATE laudos
SET 
  status = 'emitido',
  emitido_em = COALESCE(emitido_em, NOW()),
  atualizado_em = NOW()
WHERE 
  hash_pdf IS NOT NULL 
  AND status = 'rascunho'
  AND arquivo_remoto_url IS NULL;  -- Segurança: só se ainda não foi enviado

-- Verificar quantos foram corrigidos
SELECT COUNT(*) FROM laudos 
WHERE hash_pdf IS NOT NULL AND status = 'emitido';
```

---

### 1.3 Criar Table para Asaas (novo)

**Este script cria a estrutura para pagamentos Asaas:**

```sql
-- =====================================================
-- Nova tabela: asaas_pagamentos
-- Data: 2026-02-16
-- =====================================================

-- Verificar se table já existe
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'asaas_pagamentos'
) as tabela_existe;

-- Se não existe, criar:
CREATE TABLE IF NOT EXISTS asaas_pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referência ao sistema
  pagamento_id UUID NOT NULL,
  CONSTRAINT fk_pagamento FOREIGN KEY (pagamento_id) 
    REFERENCES pagamentos(id) ON DELETE CASCADE,
  
  -- IDs Asaas
  asaas_subscription_id VARCHAR(255) UNIQUE,  -- Para PIX recorrente
  asaas_customer_id VARCHAR(255),              -- Cliente na Asaas
  asaas_invoice_id VARCHAR(255) UNIQUE,        -- Fatura/boleto
  
  -- Status
  asaas_status VARCHAR(50),  -- PENDING, CONFIRMED, RECEIVED, OVERDUE, CANCELLED
  
  -- Valores
  valor_original DECIMAL(10,2),
  taxa_asaas DECIMAL(10,2),
  valor_liquido DECIMAL(10,2),
  
  -- Informações PIX
  pix_qr_code TEXT,
  pix_copy_paste TEXT,
  pix_expiration TIMESTAMP,
  
  -- Informações Boleto
  boleto_numero VARCHAR(47),
  boleto_link_pdf VARCHAR(500),
  boleto_vencimento DATE,
  
  -- Metadados
  metadados JSONB,  -- Guardar respostas Asaas completas
  
  -- Auditoria
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_pagamento_id (pagamento_id),
  INDEX idx_asaas_customer_id (asaas_customer_id),
  INDEX idx_asaas_invoice_id (asaas_invoice_id),
  INDEX idx_asaas_status (asaas_status)
);

-- Criar índice para backup/busca rápida
CREATE INDEX idx_asaas_pagamentos_created 
ON asaas_pagamentos(criado_em DESC);

-- Adicionar coluna na tabela pagamentos se precisar rastrear origem
ALTER TABLE pagamentos 
ADD COLUMN IF NOT EXISTS origem_pagamento VARCHAR(50) DEFAULT 'asaas'
  CONSTRAINT ck_origem CHECK (origem_pagamento IN ('asaas', 'manual', 'webhook'));

COMMIT;
```

**Validação:**

```sql
-- Verificar estrutura da table
\d asaas_pagamentos

-- Testar inserção de dummy
INSERT INTO asaas_pagamentos (
  pagamento_id, 
  asaas_status, 
  valor_original, 
  criado_em
) VALUES (
  (SELECT id FROM pagamentos LIMIT 1),
  'PENDING',
  1000.00,
  NOW()
)
RETURNING *;
```

---

# 🔐 FASE 2: VARIÁVEIS DE AMBIENTE

## 2.1 Arquivo `.env.production` ou `.env.local`

**Adicionar as seguintes variáveis:**

```bash
# =====================================================
# ASAAS PAYMENT GATEWAY
# =====================================================

# Credencial Principal
ASAAS_API_KEY=your_production_api_key_here
ASAAS_WEBHOOK_SECRET=your_webhook_secret_here

# URLs
ASAAS_API_URL=https://api.asaas.com  # NÃO use sandbox em PROD!
ASAAS_CUSTOMER_ID=cus_123456789      # Seu ID de cliente Asaas

# Validação de Webhook (produção)
ASAAS_WEBHOOK_VALIDATION_ENABLED=true

# =====================================================
# CONFIGURAÇÕES DE PAGAMENTO
# =====================================================

# Default payment provider
NEXT_PUBLIC_PAYMENT_PROVIDER=asaas

# Métodos habilitados
ASAAS_PIX_ENABLED=true
ASAAS_BOLETO_ENABLED=true
ASAAS_CARTAO_ENABLED=true

# Daysz for boleto expiration
ASAAS_BOLETO_EXPIRATION_DAYS=3

# Retry configurations
ASAAS_RETRY_ATTEMPTS=3
ASAAS_RETRY_DELAY_MS=5000

# =====================================================
# LOGGING & MONITORING
# =====================================================

# Debug mode (false em PROD)
ASAAS_DEBUG_MODE=false

# Log level
ASAAS_LOG_LEVEL=info
```

**IMPORTANTE:** Nunca commitar credenciais no Git!

---

# 💾 FASE 3: DEPLOY DE CÓDIGO

## 3.1 Lista Completa de Arquivos a Deploiar

### 📁 Arquivos MODIFICADOS (aplicar patches)

```
1. lib/laudo-auto.ts
   - Linhas 167-189: Adicionar UPDATE com status='emitido' + emitido_em

2. app/api/emissor/laudos/[loteId]/pdf/route.ts  
   - Linhas 273-284: Adicionar 'emitido' ao WHERE IN clause

3. app/api/emissor/laudos/[loteId]/upload/route.ts
   - Linhas 268-291: Remover WHERE status='rascunho' + COALESCE emitido_em

4. lib/auth/password-generator-corrigido.ts
   - Integrar validação de data de nascimento com isDataValida()
```

### 📁 Arquivos NOVOS (criar)

```
ASAAS Gateway:
✓ lib/asaas/client.ts                    (123 linhas)
✓ lib/asaas/types.ts                     (87 linhas)
✓ lib/asaas/mappers.ts                   (156 linhas)
✓ lib/asaas/webhook-handler.ts           (234 linhas)
✓ lib/asaas/README.md                    (42 linhas)

API Routes:
✓ app/api/pagamento/asaas/criar/route.ts         (89 linhas)
✓ app/api/pagamento/asaas/webhooks/route.ts      (145 linhas)

Componentes:
✓ components/CheckoutAsaas.tsx           (267 linhas)

Validação:
✓ lib/auth/date-validator.ts             (78 linhas)
```

## 3.2 Estratégia de Deploy

**OPÇÃO A: Git Pull (RECOMENDADO)**

```bash
# Em servidor PROD:
cd /opt/qwork  # ou seu caminho de produção

# 1. Stash de qualquer mudança local
git stash

# 2. Pull da branch main com todas as correções
git pull origin main

# 3. Instalar dependências (se houver novas)
npm install
# ou
pnpm install

# 4. Build Next.js
npm run build
# Verificar se build termina sem erros!

# 5. Reiniciar servidor Next.js
# Se usando PM2:
pm2 restart qwork-prod

# If usando systemd:
systemctl restart qwork-prod
```

**OPÇÃO B: Deploy Manual (se arquivo por arquivo)**

```bash
# Copiar arquivos modificados
cp lib/laudo-auto.ts /opt/qwork/lib/laudo-auto.ts
cp app/api/emissor/laudos/[loteId]/pdf/route.ts /opt/qwork/app/api/emissor/laudos/[loteId]/pdf/route.ts
cp app/api/emissor/laudos/[loteId]/upload/route.ts /opt/qwork/app/api/emissor/laudos/[loteId]/upload/route.ts
cp lib/auth/password-generator-corrigido.ts /opt/qwork/lib/auth/password-generator-corrigido.ts

# Copiar novos arquivos
cp lib/asaas/*.ts /opt/qwork/lib/asaas/
cp app/api/pagamento/asaas/**/*.ts /opt/qwork/app/api/pagamento/asaas/
cp components/CheckoutAsaas.tsx /opt/qwork/components/
cp lib/auth/date-validator.ts /opt/qwork/lib/auth/

# Build
npm run build

# Restart
pm2 restart qwork-prod
```

---

# 🔄 FASE 4: SINCRONIZAÇÃO DE DADOS HISTÓRICOS

## 4.1 Auditar Dados Históricos

**Antes de qualquer sincronização, executar:**

```sql
-- =====================================================
-- AUDITORIA: Estado dos laudos em PROD
-- =====================================================

-- Total de laudos
SELECT 
  COUNT(*) as total_laudos,
  COUNT(CASE WHEN status = 'rascunho' THEN 1 END) as rascunho,
  COUNT(CASE WHEN status = 'emitido' THEN 1 END) as emitido,
  COUNT(CASE WHEN status = 'enviado' THEN 1 END) as enviado,
  COUNT(CASE WHEN hash_pdf IS NOT NULL THEN 1 END) as com_pdf_hash,
  COUNT(CASE WHEN arquivo_remoto_url IS NOT NULL THEN 1 END) as com_bucket_url
FROM laudos;

-- Laudos "órfãos" - PDF local mas sem status emitido
SELECT id, lote_id, status, hash_pdf, arquivo_remoto_url
FROM laudos
WHERE hash_pdf IS NOT NULL 
  AND status = 'rascunho'
  AND arquivo_remoto_url IS NULL
LIMIT 100;

-- Se houver muitos (>0), corrigir:
UPDATE laudos
SET status = 'emitido', emitido_em = NOW(), atualizado_em = NOW()
WHERE hash_pdf IS NOT NULL 
  AND status = 'rascunho'
  AND arquivo_remoto_url IS NULL;

-- Log de quantos foram corrigidos
SELECT COUNT(*) FROM laudos 
WHERE status = 'emitido' AND arquivo_remoto_url IS NULL;
```

## 4.2 Sincronizar Senhas Comprom
etidas

**Se há senhas com datas inválidas:**

```sql
-- =====================================================
-- AUDITORIA: Senhas com datas inválidas
-- =====================================================

-- Buscar senhas que pareçam inválidas (31/02, 31/04, etc)
SELECT 
  id,
  login,
  data_nascimento,
  TO_DATE(data_nascimento, 'DD/MM/YYYY') as data_parsed,
  CASE 
    WHEN data_nascimento ~ '^(31)/(02|04|06|09|11)' THEN 'DATA_INVALIDA'
    WHEN data_nascimento ~ '^(29)/02/(1900|1904|1908|1912|1916|1920|1924|1928|1932|1936|1940|1944|1948|1952|1956|1960|1964|1968|1972|1976|1980|1984|1988|1992|1996|2004|2008|2012|2016|2020|2024)' 
      THEN 'DATA_VALIDA_BISSEXTO'
    ELSE 'DATA_APARENTEMENTE_VALIDA'
  END as validacao
FROM funcionarios
WHERE data_nascimento IS NOT NULL
ORDER BY data_nascimento DESC;

-- Se encontrar inválidas, requerer alteração:
-- Gerar nova senha válida e avisar ao funcionário
UPDATE funcionarios
SET 
  senha_temporaria = NULL,  -- Força reset de senha
  atualizado_em = NOW()
WHERE id IN (...)  -- IDs com datas inválidas

-- Enviar notificação para reset de senha
```

---

# ✅ FASE 5: TESTES EM PRODUÇÃO

## 5.1 Testes de Máquina de Estados (Crítico!)

**Executar após deploy:**

```bash
# 1. Teststar geração de PDF
curl -X POST http://prod.qwork.com/api/emissor/laudos/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"lote_id": 1}'

# Resposta esperada:
# {
#   "success": true,
#   "laudo": {
#     "id": "...",
#     "status": "emitido",  ← CRÍTICO: deve ser 'emitido'
#     "_emitido": true,     ← CRÍTICO: deve ser true
#     "hash_pdf": "...",
#     "emitido_em": "2026-02-16T14:30:00Z"
#   }
# }

# 2. Testar aba "Laudo Emitido"
curl http://prod.qwork.com/api/emissor/lotes \
  -H "Authorization: Bearer $TOKEN"

# Verificar campos:
# - GET /_emitido = true para laudos emitidos
# - GET /status = 'emitido' ou 'enviado'

# 3. Testar upload ao bucket
curl -X POST http://prod.qwork.com/api/emissor/laudos/1/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@laudo.pdf"

# Resposta esperada:
# {
#   "success": true,
#   "laudo": {
#     "status": "enviado",                    ← Status atualizado
#     "arquivo_remoto_url": "s3://...",     ← URL do bucket
#     "arquivo_remoto_provider": "s3",
#     "emitido_em": "2026-02-16T14:25:00Z"  ← Preservado, NÃO alterado
#   }
# }
```

## 5.2 Testes Asaas Payment

```bash
# 1. Testar criação de cobrança PIX
curl -X POST http://prod.qwork.com/api/pagamento/asaas/criar \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cliente_id": "123",
    "valor": 100.00,
    "tipo": "PIX"
  }'

# Resposta esperada:
# {
#   "success": true,
#   "pix": {
#     "qrCode": "00020126360014br.gov.bcb.pix...",
#     "copyPaste": "00020126360014broker.gov.bcb.pix...",
#     "expirationTime": 300  # segundos
#   }
# }

# 2. Testar webhook de confirmação
curl -X POST http://prod.qwork.com/api/pagamento/asaas/webhooks \
  -H "asaas-signature: ASAAS_SIGNATURE_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "payment.confirmed",
    "data": {
      "id": "pay_123...",
      "status": "RECEIVED"
    }
  }'
```

## 5.3 Testes de Validação de Data

```bash
# 1. Testar geração de senha COM data válida
curl -X POST http://prod.qwork.com/api/auth/gerar-senha \
  -H "Content-Type: application/json" \
  -d '{
    "funcionario_id": "123",
    "data_nascimento": "15/03/1990"  # ✅ Válida
  }'

# Deve retornar sucesso com senha gerada

# 2. Testar geração de senha COM data INVÁLIDA
curl -X POST http://prod.qwork.com/api/auth/gerar-senha \
  -H "Content-Type: application/json" \
  -d '{
    "funcionario_id": "123",
    "data_nascimento": "31/02/1990"  # ❌ INVÁLIDA
  }'

# Deve retornar erro: "Data de nascimento inválida"
```

## 5.4 Testes via UI (Manual)

```
1. Q37 - Avaliar Funcionário
   ☐ Entrar em Lote de Avaliação
   ☐ Preencher 37 questões (incluindo a Q37)
   ☐ Clicar "Salvar"
   → Esperado: Salva sem erro
   → Se erro: Trigger 165 não foi aplicada

2. Geração de Laudo
   ☐ Entrar em "Laudo para Emitir"
   ☐ Clicar "Iniciar Laudo"
   ☐ Preencher dados
   ☐ Clicar "Gerar PDF"
   → Card deve ir para aba "Laudo Emitido"
   → Botão "Enviar ao Bucket" deve aparecer

3. Upload ao Bucket  
   ☐ Clicar "Enviar ao Bucket"
   → Card muda para "Sincronizado"
   → Solicitante vê "Laudo Disponível"

4. Pagamento Asaas
   ☐ Se sistema tiver fluxo de pagamento
   ☐ Selecionar "Pagamento PIX"
   ☐ QR Code deve aparecer
   ☐ Tentar pagar (use sanbox Asaas se disponível)
```

---

# 📊 FASE 6: VERIFICAÇÃO DE SANIDADE

## 6.1 Health Check Pós-Deploy

```bash
# Executar após 5 minutos do restart do servidor

# 1. Verificar se aplicação está up
curl -I http://prod.qwork.com/
# Esperado: HTTP 200

# 2. Verificar logs para erros
# If PM2:
pm2 logs qwork-prod --lines 100 | grep -i error

# If systemd:
journalctl -u qwork-prod -n 100 | grep -i error

# 3. Verificar conexão com banco
curl -X POST http://prod.qwork.com/api/health/db \
  -H "Authorization: Bearer $ADMIN_TOKEN"
# Esperado: {"status": "healthy", "database": "connected"}

# 4. Verificar Asaas connectivity
curl -X POST http://prod.qwork.com/api/health/asaas \
  -H "Authorization: Bearer $ADMIN_TOKEN"
# Esperado: {"status": "healthy", "asaas": "connected", "api_key_valid": true}
```

## 6.2 Monitoramento (Primeiras 24h)

```
Métricas Críticas a Monitorar:

1. Error Rate
   - Esperado: < 0.1% de erros
   - Alerta se: > 1%
   - Log: Procurar por erros de "laudo", "pagamento", "asaas"

2. Performance
   - Tempo de resposta API /api/emissor/lotes: < 2s
   - Tempo de upload: < 30s
   - Build demorou: < 2 minutos

3. Banco de Dados
   - Conexões ativas: < 100
   - Queries lentas: nenhuma > 5s
   - Replicação (se aplicável):  0 segundos de lag

4. Asaas
   - Webhooks recebidos: verificar logs
   - Falhas de API: 0
   - Timeouts: 0

5. Funcionarios & Laudos
   - Laudos com status errado: 0
   - Hashes mismatch: 0
   - URLs quebradas de bucket: 0
```

---

# 🔄 ROLLBACK PROCEDURES

## ⚠️ PROCEDIMENTO DE EMERGÊNCIA (If something breaks badly)

### Caso 1: Banco de Dados Quebrou (Erro na Migração 165)

```sql
-- ROLLBACK - Restaurar versão anterior (SEM a trigger 165)

-- Step 1: Drop da trigger problemática
DROP TRIGGER IF EXISTS trigger_atualizar_ultima_avaliacao ON lotes_avaliacao;

-- Step 2: Drop da função problemática
DROP FUNCTION IF EXISTS atualizar_ultima_avaliacao_funcionario();

-- Step 3: Recriar versão original (simples)
CREATE OR REPLACE FUNCTION atualizar_ultima_avaliacao_funcionario()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE funcionarios
  SET ultima_avaliacao_id = NEW.id
  WHERE id = NEW.funcionario_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Recriar trigger
CREATE TRIGGER trigger_atualizar_ultima_avaliacao
AFTER INSERT ON lotes_avaliacao
FOR EACH ROW
EXECUTE FUNCTION atualizar_ultima_avaliacao_funcionario();

COMMIT;
```

### Caso 2: Código Quebrou (Laudo com status errado)

```bash
# Voltar para versão anterior no Git

git log --oneline | head -5
# Encontrar commit anterior ao deploy

git revert COMMIT_SHA  # ou
git reset --hard COMMIT_ANTERIOR

# Rebuild
npm run build

# Restart
pm2 restart qwork-prod
```

### Caso 3: Asaas Webhooks Falhando

```bash
# Desabilitar Asaas temporariamente

# Em .env
ASAAS_WEBHOOK_VALIDATION_ENABLED=false
NEXT_PUBLIC_PAYMENT_PROVIDER=manual

# Rebuild
npm run build
pm2 restart qwork-prod

# Chamar suporte Asaas para diagnosticar
# https://asaas.com/suporte
```

### Caso 4: Banco Completo Corrompido

```bash
# Última opção: Restaurar backup

# 1. Parar aplicação
pm2 stop qwork-prod

# 2. Restaurar backup (Neon ou PostgreSQL)
# Neon: Via dashboard → Branch → Restore to Point in Time
# PostgreSQL: psql -U postgres < backup-prod-2026-02-16.sql

# 3. Verificar integridade
SELECT COUNT(*) FROM laudos;
SELECT COUNT(*) FROM funcionarios;

# 4. Reiniciar
pm2 start qwork-prod
```

---

# 📋 CHECKLIST FINAL DE DEPLOYMENT

```
Pré-Deployment:
☐ Backup do banco executado e TESTADO
☐ Credenciais Asaas obtidas e validadas
☐ Todos os arquivos novos copiados para produção
☐ Variáveis de ambiente (.env) atualizadas
☐ Build local testado sem erros
☐ Git main branch sincronizado

Deploy:
☐ Parar tráfego (manutenção se necessário)
☐ Executar Migração 165 SQL
☐ Executar sync de laudos históricos
☐ Criar table asaas_pagamentos
☐ Git pull / push de código
☐ npm install
☐ npm run build (verificar 0 erros)
☐ Atualizar .env com credenciais Asaas
☐ Restart servidor Next.js (pm2 ou systemd)

Pós-Deploy (Primeiras 2 horas):
☐ Health check do servidor
☐ Verificar /api/health endpoint
☐ Testar geração de PDF → verificar status='emitido'
☐ Testar upload ao bucket
☐ Testar Asaas Payment Gateway
☐ Verificar logs de erro
☐ Monitorar CPU/Memória
☐ Monitorar conexões de banco

Stabilidade (24-48 horas):
☐ Nenhum erro de "laudo" nos logs
☐ Nenhum timeout de Asaas
☐ Usuários reportando sistema normal
☐ Backups automáticos rodando
☐ Replicação do banco sincronizada

Sucesso!
☑️ TODOS os itens checados
☑️ Sistema operacional
☑️ Pronto para comunicar aos usuários
```

---

# 📞 SUPORTE & CONTATOS

```
Se encontrar problemas durante o deployment:

1. Erro na Migração 165 (Q37)
   → Contato: Banco de dados admin
   → Rollback: Executar script ROLLBACK acima

2. Erro no Asaas Payment
   → Contato: Asaas Support (support@asaas.com)
   → Verificar: API Key, Webhook Secret, Customer ID
   → Teste: APIs de teste.asaas.com antes

3. Erro em Laudo/Card
   → Contato: Time de backend
   → Verificar: Script de sync de laudos deve ter rodado
   → Logs: Procurar por "laudo" ou "status='rascunho'"

4. Erro de Performance
   → Executar: SELECT COUNT(*) FROM laudos;
   → Analizar: Índices em `hash_pdf` e `arquivo_remoto_url`
   → Solução: Pode precisar de reindex após sync grandes

5. Banco Indisponível
   → Contato: Provider (Neon ou host PostgreSQL)
   → Última volta: Restore do backup
   → Verificar: Limites de conexão, espaço em disco
```

---

**Documento Criado:** 16 de fevereiro de 2026  
**Status:** 🔴 Aguardando aprovação para deployment  
**Próximo Passo:** Confirmar credenciais Asaas e executar Fase 1 (Migrações DB)
