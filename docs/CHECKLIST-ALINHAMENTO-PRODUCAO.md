# ✅ CHECKLIST FINAL - ALINHAMENTO PRODUÇÃO ↔ LOCAL

**Data:** 02/02/2026  
**Objetivo:** Garantir que versão online (Vercel + Neon) opere o mais próximo possível da versão local

---

## 🗄️ 1. DATABASE SCHEMA & MIGRATIONS

### ✅ **Ações Executadas**

- [x] Identificadas 302 migrations em `database/migrations/`
- [x] Migrations críticas identificadas: 150, 151, 208
- [x] Sistema de migration sequencial confirmado

### ⚠️ **Ações Pendentes**

#### 1.1. Verificar Aplicação das Migrations no Neon

**Executar no Neon via psql:**

```bash
# Conectar ao Neon
psql $DATABASE_URL

# Verificar migrations aplicadas
SELECT migration_name, applied_at
FROM _prisma_migrations
ORDER BY migration_name DESC
LIMIT 50;

# Verificar migrations críticas (remoção de automação)
SELECT * FROM _prisma_migrations
WHERE migration_name LIKE '%150_remove%'
   OR migration_name LIKE '%151_remove%';
```

**Resultado esperado:**

```
✅ 150_remove_auto_emission_trigger.sql - APLICADA
✅ 151_remove_auto_laudo_creation_trigger.sql - APLICADA
```

#### 1.2. Comparar Schemas (Local vs Neon)

**Criar script:** `scripts/compare-schemas.ps1`

```powershell
# Gerar schema local
Write-Host "Gerando schema local..." -ForegroundColor Cyan
pg_dump -s -U postgres -d nr-bps_db > schema-local.sql

# Gerar schema Neon
Write-Host "Gerando schema Neon..." -ForegroundColor Cyan
$neonUrl = $env:DATABASE_URL
pg_dump -s $neonUrl > schema-neon.sql

# Comparar
Write-Host "Comparando schemas..." -ForegroundColor Yellow
Compare-Object (Get-Content schema-local.sql) (Get-Content schema-neon.sql) `
    -IncludeEqual:$false | Out-File schema-diff.txt

Write-Host "Diferenças salvas em schema-diff.txt" -ForegroundColor Green
```

**Executar:**

```powershell
.\scripts\compare-schemas.ps1
```

**Analisar `schema-diff.txt`:**

- ✅ Sem diferenças = schemas idênticos
- ⚠️ Com diferenças = identificar e corrigir

#### 1.3. Verificar Remoção de Triggers Automáticos

**Executar no Neon:**

```sql
-- Verificar se trigger de emissão automática foi removido
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_name = 'fn_recalcular_status_lote_on_avaliacao_update';

-- Verificar se função de criação automática de laudos foi removida
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'fn_reservar_id_laudo_on_lote_insert';

-- Se retornar resultado, migration 151 NÃO foi aplicada!
```

**Resultado esperado:**

```
✅ fn_recalcular_status_lote_on_avaliacao_update - NÃO deve inserir em fila_emissao
❌ fn_reservar_id_laudo_on_lote_insert - NÃO deve existir (removida)
```

#### 1.4. Aplicar Migrations Faltantes (se necessário)

**Se migrations 150/151 não foram aplicadas:**

```bash
# Conectar ao Neon
psql $DATABASE_URL

# Executar migrations manualmente
\i database/migrations/150_remove_auto_emission_trigger.sql
\i database/migrations/151_remove_auto_laudo_creation_trigger.sql

# Verificar aplicação
SELECT * FROM _prisma_migrations
WHERE migration_name LIKE '%150%' OR migration_name LIKE '%151%';
```

---

## 📄 2. GERAÇÃO DE RELATÓRIOS (PDF)

### ✅ **Análise Completa**

**Arquitetura IDÊNTICA local/produção:**

- `app/api/rh/relatorio-individual-pdf/route.ts`
- `app/api/rh/relatorio-lote-pdf/route.ts`
- `app/api/rh/relatorio-setor-pdf/route.ts`
- `lib/infrastructure/pdf/generators/pdf-generator.ts`

**Código Puppeteer:**

```typescript
// ✅ JÁ ESTÁ CORRETO
export async function getPuppeteerInstance() {
  if (isVercelProduction) {
    const chromium = await import('@sparticuz/chromium');
    const puppeteerCore = await import('puppeteer-core');

    // ✅ Detecta executablePath automaticamente
    const executablePath = await chromiumAny.executablePath?.();

    return puppeteerCore.default.launch({
      executablePath,
      args: chromiumAny.args,
      headless: true,
    });
  } else {
    // ✅ Local usa Chrome instalado
    const puppeteer = await import('puppeteer');
    return puppeteer.default;
  }
}
```

### ✅ **Configuração Vercel**

**`vercel.json`:**

```json
{
  "functions": {
    "app/api/**/*.ts": {
      "memory": 2048, // ✅ 2GB RAM
      "maxDuration": 60 // ✅ 60s timeout
    }
  }
}
```

**Status:** ✅ CORRETO (sem mudanças necessárias)

### ⚠️ **Teste em Produção**

**Executar:**

```bash
# Deploy para Vercel Preview
vercel deploy

# Testar geração de relatório
# 1. Acessar preview: https://qwork-xyz.vercel.app
# 2. Login como RH
# 3. Gerar relatório individual
# 4. Verificar logs: vercel logs
```

**Resultado esperado:**

```
✅ PDF gerado sem timeout
✅ Sem erros de executablePath
✅ Tamanho do PDF < 10MB
```

---

## 📤 3. UPLOAD BACKBLAZE & EMISSÃO DE LAUDOS

### ✅ **Estratégia Confirmada: EMISSOR LOCAL**

**Arquitetura:**

```
RH/Entidade (Online) → Solicita emissão → Neon (fila_emissao)
                                             ↓
Emissor (Local) → Gera laudo → Upload Backblaze → URL salva no Neon
                                                      ↓
Usuários (Online) → Download laudo ← Backblaze S3
```

### ✅ **Configuração Emissor Local**

**Arquivo `.env.local` (máquina do emissor):**

```env
# ⚠️ BANCO DE PRODUÇÃO
DATABASE_URL=postgresql://neondb_owner:***@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb

# ⚠️ BACKBLAZE (mesmas credenciais da produção)
BACKBLAZE_KEY_ID=005abc...
BACKBLAZE_APPLICATION_KEY=K005xyz...
BACKBLAZE_BUCKET=laudos-qwork
BACKBLAZE_ENDPOINT=https://s3.us-east-005.backblazeb2.com
BACKBLAZE_REGION=us-east-005

# NextAuth
NEXTAUTH_SECRET=dev-secret-local-emissor
NEXTAUTH_URL=http://localhost:3000

# Ambiente
NODE_ENV=development
```

### ⚠️ **Checklist Emissor Local**

**Pré-requisitos:**

- [ ] Máquina do emissor com Chrome/Chromium instalado
- [ ] Node.js 18+ instalado
- [ ] pnpm instalado
- [ ] Credenciais Backblaze configuradas
- [ ] Acesso ao Neon Cloud (DATABASE_URL)

**Configuração:**

```powershell
# 1. Clone do repositório (ou pull latest)
git pull origin main

# 2. Instalar dependências
pnpm install

# 3. Configurar .env.local (ver template acima)
code .env.local

# 4. Rodar em desenvolvimento
pnpm dev

# 5. Acessar dashboard emissor
# http://localhost:3000/emissor
```

**Teste de Emissão:**

- [ ] Dashboard carrega lotes pendentes
- [ ] Botão "Gerar Laudo" funciona
- [ ] PDF gerado com sucesso
- [ ] Upload para Backblaze com sucesso
- [ ] URL salva no banco Neon
- [ ] Status do lote muda para 'emitido'
- [ ] Download online funciona (Vercel → Backblaze)

### ⚠️ **Verificar Credenciais Backblaze**

**Ordem correta:**

```env
# ✅ CORRETO:
BACKBLAZE_KEY_ID=005abc123... (ID curto, começa com 005)
BACKBLAZE_APPLICATION_KEY=K005xyz789... (chave longa, 32+ chars)

# ❌ INCORRETO (trocado):
BACKBLAZE_KEY_ID=K005xyz789... (chave longa)
BACKBLAZE_APPLICATION_KEY=005abc123... (ID curto)
```

**Verificar no código:**

```typescript
// lib/storage/backblaze-client.ts detecta automaticamente se trocado
if (looksLikeApplicationKey(keyId) && looksLikeKeyId(applicationKey)) {
  console.warn('[BACKBLAZE] Detected swapped credentials. Auto-correcting...');
  [keyId, applicationKey] = [applicationKey, keyId];
}
```

**Teste de Upload:**

```powershell
# Executar teste de upload
pnpm test __tests__/upload-laudo-manual.test.ts

# Resultado esperado:
# ✅ Upload Manual de Laudo - Validações PASSED
```

---

## ⏲️ 4. CRON JOBS NA VERCEL

### ✅ **DECISÃO: DESABILITAR COMPLETAMENTE**

**Motivos:**

1. ✅ Emissão de laudos é LOCAL (emissor)
2. ✅ Geração de recibos pode rodar localmente também
3. ✅ Recálculos automáticos são via **TRIGGER DO BANCO** (não cron)
4. ✅ Endpoint `/api/system/auto-laudo` retorna HTTP 410 (desabilitado)

### ✅ **Verificações Necessárias**

#### 4.1. Vercel Dashboard

**Acessar:**

1. https://vercel.com/ronaldofilardo/qwork
2. Settings → Cron Jobs
3. Verificar se há cron jobs configurados

**Ação:**

- ✅ Se vazio = OK
- ⚠️ Se houver crons = DELETAR TODOS

#### 4.2. Arquivo `vercel.json`

**Verificar:**

```json
{
  "functions": { ... },
  "buildCommand": "pnpm build:prod",
  "installCommand": "pnpm install --frozen-lockfile --prefer-offline"

  // ✅ NÃO deve conter seção "crons"
}
```

**Status:** ✅ VERIFICADO - Não há seção `crons` (correto)

#### 4.3. Código de Cron Desabilitado

**Arquivo:** `app/api/system/auto-laudo/route.ts`

```typescript
export async function GET(request: NextRequest) {
  logCronStart('inicio', { motivo: 'cron_desabilitado' });

  return NextResponse.json(
    { error: 'Cron de emissão desabilitado' },
    { status: 410 } // ✅ 410 Gone
  );
}
```

**Status:** ✅ CONFIRMADO - Endpoint retorna 410

### ✅ **Recálculos Automáticos (Via Trigger)**

**Trigger do PostgreSQL (Neon):**

```sql
-- Migration 150: fn_recalcular_status_lote_on_avaliacao_update
-- Dispara quando status de avaliação muda
-- Recalcula status do lote automaticamente
-- NÃO insere mais em fila_emissao (removido)

CREATE TRIGGER trg_recalcular_status_lote
AFTER UPDATE OF status ON avaliacoes
FOR EACH ROW EXECUTE FUNCTION fn_recalcular_status_lote_on_avaliacao_update();
```

**Função do Código:** `lib/lotes.ts`

```typescript
// Chamada pelas APIs quando necessário (não é cron)
export async function recalcularStatusLotePorId(loteId: number) {
  // Lógica de recálculo de status
  // Cria notificação para RH/Entidade
  // NÃO emite laudo automaticamente
}
```

**Status:** ✅ FUNCIONANDO VIA TRIGGER (não depende de cron)

---

## 🧪 5. TESTES EM PRODUÇÃO

### ⚠️ **Fluxo Completo End-to-End**

#### 5.1. Criar Lote de Teste (Online - Vercel)

**Executar:**

```
1. Login como RH: https://qwork.vercel.app/rh
2. Criar novo lote de avaliação
3. Adicionar 3 funcionários
4. Liberar lote para psicólogo
5. Psicólogo completa as 3 avaliações
6. Verificar status do lote: 'concluido'
```

**SQL para verificar:**

```sql
-- No Neon
SELECT la.id,  la.status,
       COUNT(a.id) as total_avaliacoes,
       COUNT(a.id) FILTER (WHERE a.status = 'concluido') as concluidas
FROM lotes_avaliacao la
LEFT JOIN avaliacoes a ON a.lote_id = la.id
WHERE la.id = 0 -- FIXME: substituir por ID correto
GROUP BY la.id;

-- Resultado esperado:
-- status = 'concluido', total_avaliacoes = 3, concluidas = 3
```

#### 5.2. Solicitar Emissão (Online - Vercel)

**Executar:**

```
1. RH/Entidade: Clicar "Solicitar Emissão" no lote concluído
2. POST /api/lotes/[loteId]/solicitar-emissao
3. Verificar inserção em fila_emissao
```

**SQL para verificar:**

```sql
-- No Neon
SELECT * FROM fila_emissao
WHERE lote_id = (SELECT id FROM lotes_avaliacao WHERE codigo = 'LOTE-TESTE-PROD')
ORDER BY created_at DESC LIMIT 1;

-- Resultado esperado:
-- tipo_solicitante = 'rh', processado = false
```

#### 5.3. Gerar Laudo (Local - Emissor)

**Executar:**

```powershell
# 1. Abrir emissor local
pnpm dev

# 2. Acessar: http://localhost:3000/emissor
# 3. Ver lote "LOTE-TESTE-PROD" na fila
# 4. Clicar "Gerar Laudo"
# 5. Aguardar processamento
```

**Logs esperados:**

```
[LAUDO] Gerando PDF para lote 123...
[PUPPETEER] Lançando browser...
[PDF] PDF gerado com sucesso (123456 bytes)
[HASH] Hash SHA256: abc123...
[BACKBLAZE] Fazendo upload...
[BACKBLAZE] Upload concluído: https://s3.us-east-005...
[DB] URL salva no banco
[DB] Status do lote atualizado para 'emitido'
```

**SQL para verificar:**

```sql
-- No Neon
SELECT l.id, l.lote_id, l.url, l.hash_pdf, l.status, l.emitido_em,
       la.status as lote_status
FROM laudos l
JOIN lotes_avaliacao la ON la.id = l.lote_id
WHERE la.id = 0 -- FIXME: substituir por ID correto;

-- Resultado esperado:
-- url = https://s3.us-east-005.backblazeb2.com/...
-- hash_pdf = abc123...
-- status = 'emitido'
-- lote_status = 'emitido'
```

#### 5.4. Download Online (Vercel → Backblaze)

**Executar:**

```
1. Login como RH: https://qwork.vercel.app/rh
2. Acessar lote "LOTE-TESTE-PROD"
3. Clicar "Visualizar Laudo" ou "Baixar PDF"
4. GET /api/laudos/[id]/download
5. Verificar redirecionamento para Backblaze
6. Verificar download do PDF
```

**Resultado esperado:**

```
✅ Redirecionamento HTTP 302 para URL do Backblaze
✅ Download do PDF com sucesso
✅ Hash do PDF corresponde ao salvo no banco
```

---

## 🛡️ 6. SEGURANÇA E VARIÁVEIS DE AMBIENTE

### ⚠️ **Auditoria Completa**

#### 6.1. Vercel Dashboard - Environment Variables

**Acessar:**

```
https://vercel.com/ronaldofilardo/qwork/settings/environment-variables
```

**Verificar:**

```env
# Database
DATABASE_URL = postgresql://neondb_owner:***@neon.tech/neondb

# Backblaze
BACKBLAZE_KEY_ID = 005abc...
BACKBLAZE_APPLICATION_KEY = K005xyz...
BACKBLAZE_BUCKET = laudos-qwork
BACKBLAZE_ENDPOINT = https://s3.us-east-005.backblazeb2.com
BACKBLAZE_REGION = us-east-005

# NextAuth
NEXTAUTH_SECRET = *** (diferente do local)
NEXTAUTH_URL = https://qwork.vercel.app

# Outros
NODE_ENV = production
```

**Ações:**

- [ ] Confirmar DATABASE_URL do Neon está correta
- [ ] Verificar credenciais Backblaze (ordem correta)
- [ ] Confirmar NEXTAUTH_SECRET é forte (não use "dev-secret")
- [ ] NEXTAUTH_URL aponta para domínio correto

#### 6.2. Local - .env.local (Emissor)

**Verificar:**

```env
# ⚠️ MESMO DATABASE_URL DA PRODUÇÃO (NEON)
DATABASE_URL=postgresql://neondb_owner:***@neon.tech/neondb

# ⚠️ MESMAS CREDENCIAIS BACKBLAZE DA PRODUÇÃO
BACKBLAZE_KEY_ID=005abc...
BACKBLAZE_APPLICATION_KEY=K005xyz...

# ⚠️ PODE SER DIFERENTE (local)
NEXTAUTH_SECRET=dev-secret-local
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=development
```

**Ações:**

- [ ] Confirmar DATABASE_URL é o MESMO da produção (Neon)
- [ ] Confirmar Backblaze é o MESMO da produção
- [ ] Verificar arquivo está no `.gitignore` (não comitar)

---

## 📋 7. CHECKLIST FINAL DE VALIDAÇÃO

### ✅ **Database & Migrations**

- [ ] Schemas comparados (local vs Neon)
- [ ] Migrations 150/151 aplicadas no Neon
- [ ] Trigger automático removido (verificado)
- [ ] Função de criação automática de laudos removida
- [ ] Recálculo automático via trigger funcionando

### ✅ **Geração de Relatórios**

- [ ] Puppeteer configurado corretamente (local/serverless)
- [ ] vercel.json com 2GB RAM, 60s timeout
- [ ] Teste de geração em Vercel Preview com sucesso
- [ ] Logs sem erros de executablePath

### ✅ **Upload Backblaze**

- [ ] Credenciais configuradas (local e Vercel)
- [ ] Ordem correta (KEY_ID vs APPLICATION_KEY)
- [ ] Teste de upload local com sucesso
- [ ] Download online funcionando (Vercel → Backblaze)

### ✅ **Cron Jobs**

- [ ] Vercel Dashboard sem cron jobs configurados
- [ ] vercel.json sem seção `crons`
- [ ] Endpoint auto-laudo retorna 410
- [ ] Recálculos via trigger funcionando

### ✅ **Emissor Local**

- [ ] .env.local configurado com DATABASE_URL do Neon
- [ ] pnpm dev rodando sem erros
- [ ] Dashboard /emissor carrega lotes pendentes
- [ ] Geração de laudo funciona
- [ ] Upload para Backblaze com sucesso
- [ ] URL salva no banco Neon

### ✅ **Testes End-to-End**

- [ ] Criar lote de teste online
- [ ] Concluir avaliações (status 'concluido')
- [ ] Solicitar emissão (vai para fila)
- [ ] Gerar laudo localmente (emissor)
- [ ] Verificar upload Backblaze
- [ ] Download online funciona
- [ ] Hash PDF corresponde

---

## 🎯 **STATUS GERAL**

### ✅ **Funcionando Corretamente**

- Código de geração de relatórios (Puppeteer)
- Código de upload Backblaze
- Endpoint cron desabilitado (HTTP 410)
- Configuração Vercel (memory/timeout)
- Arquitetura emissor local

### ⚠️ **Requer Verificação**

- Comparação schema local vs Neon
- Migrations 150/151 aplicadas no Neon
- Credenciais Backblaze (ordem correta)
- Vercel Dashboard (cron jobs deletados)

### 🔴 **Bloqueadores (se houver)**

- [ ] Nenhum bloqueador identificado até o momento

---

## 📞 **SUPORTE E TROUBLESHOOTING**

### Problema: Emissor local não conecta ao Neon

**Solução:**

```powershell
# Verificar DATABASE_URL
echo $env:DATABASE_URL

# Testar conexão
psql $env:DATABASE_URL -c "SELECT version();"
```

### Problema: Upload Backblaze falha (403 Forbidden)

**Solução:**

```powershell
# Verificar credenciais
echo $env:BACKBLAZE_KEY_ID
echo $env:BACKBLAZE_APPLICATION_KEY

# Testar autenticação
# Ver lib/storage/backblaze-client.ts (auto-swap detection)
```

### Problema: Puppeteer timeout no Vercel

**Solução:**

```json
// Aumentar timeout (se Pro plan)
"functions": {
  "app/api/emissor/**/*.ts": {
    "memory": 3008,
    "maxDuration": 300 // 5 minutos
  }
}
```

---

**Próximos Passos:**

1. [ ] Executar `scripts/compare-schemas.ps1`
2. [ ] Verificar migrations no Neon via psql
3. [ ] Auditar Vercel Dashboard (cron jobs)
4. [ ] Configurar emissor local (.env.local)
5. [ ] Executar teste end-to-end completo
6. [ ] Documentar quaisquer diferenças encontradas

**Última atualização:** 02/02/2026  
**Status:** ✅ Pronto para validação

