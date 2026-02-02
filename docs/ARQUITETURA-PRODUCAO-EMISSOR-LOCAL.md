# 🏗️ ARQUITETURA DE PRODUÇÃO - EMISSOR LOCAL

## 📌 Decisão Arquitetural (02/02/2026)

Devido a limitações de timeout/memória da Vercel para geração de laudos em PDF, adotou-se a seguinte estratégia:

### ✅ **ARQUITETURA HÍBRIDA**

```
┌─────────────────────────────────────────────────────┐
│                 PRODUÇÃO ONLINE                      │
│              (Vercel + Neon Cloud)                   │
├─────────────────────────────────────────────────────┤
│ - RH/Entidade: Criar lotes, solicitar emissão       │
│ - Visualização/Download: Laudos já emitidos          │
│ - Banco de dados: Neon Cloud (PostgreSQL)           │
│ - Storage: Backblaze B2 (laudos em PDF)             │
└─────────────────────────────────────────────────────┘
                         ▲
                         │ DATABASE_URL (Neon)
                         │ BACKBLAZE credentials
                         ▼
┌─────────────────────────────────────────────────────┐
│           EMISSOR LOCAL (Desenvolvimento)            │
│                                                      │
├─────────────────────────────────────────────────────┤
│ - Conectado ao Neon (DATABASE_URL produção)         │
│ - Gera laudos via Puppeteer local                   │
│ - Upload para Backblaze (mesmas credenciais)        │
│ - Processa geração de recibos (se necessário)       │
└─────────────────────────────────────────────────────┘
```

---

## 🔄 FLUXO COMPLETO DE EMISSÃO

### 1️⃣ **RH/Entidade (Online - Vercel)**
```
1. Criar lote de avaliação
2. Psicólogo completa avaliações
3. Quando todas finalizadas → status: 'concluido'
4. RH/Entidade: "Solicitar Emissão"
   → POST /api/lotes/[loteId]/solicitar-emissao
   → Insere em fila_emissao com tipo_solicitante='rh'
```

### 2️⃣ **Emissor (Local - Conectado ao Neon)**
```
1. Abre dashboard local: http://localhost:3000/emissor
   → Conectado ao Neon via DATABASE_URL
2. Vê lotes pendentes de emissão
3. Clica "Gerar Laudo"
   → POST http://localhost:3000/api/emissor/laudos/[loteId]
   → Gera PDF via Puppeteer local (Chrome instalado)
   → Hash SHA256 do PDF
4. Upload automático para Backblaze
   → URL: https://s3.us-east-005.backblazeb2.com/laudos-qwork/...
5. Salva no Neon:
   → laudos.url = URL do Backblaze
   → laudos.hash_pdf = hash SHA256
   → laudos.status = 'emitido'
   → lotes_avaliacao.status = 'emitido'
```

### 3️⃣ **Usuários (Online - Vercel)**
```
1. RH/Entidade/Psicólogo: Visualizar/baixar laudo
   → GET /api/laudos/[id]/download
   → Redireciona para URL do Backblaze
   → Download direto do bucket
```

---

## 🔧 CONFIGURAÇÃO NECESSÁRIA (EMISSOR LOCAL)

### Arquivo `.env.local` do Emissor

```env
# ⚠️ BANCO DE DADOS: PRODUÇÃO (NEON CLOUD)
DATABASE_URL=postgresql://neondb_owner:***@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb

# ⚠️ BACKBLAZE: MESMAS CREDENCIAIS DA PRODUÇÃO
BACKBLAZE_KEY_ID=005abc...
BACKBLAZE_APPLICATION_KEY=K005xyz...
BACKBLAZE_BUCKET=laudos-qwork
BACKBLAZE_ENDPOINT=https://s3.us-east-005.backblazeb2.com
BACKBLAZE_REGION=us-east-005

# NextAuth (pode usar secret de dev)
NEXTAUTH_SECRET=dev-secret-local-emissor
NEXTAUTH_URL=http://localhost:3000

# Ambiente
NODE_ENV=development
```

### Executar Localmente

```powershell
# 1. Configurar .env.local com DATABASE_URL do Neon
# 2. Instalar dependências
pnpm install

# 3. Rodar em modo desenvolvimento
pnpm dev

# 4. Acessar dashboard do emissor
# http://localhost:3000/emissor
```

---

## 🚫 CRON JOBS NA VERCEL

### ✅ **DESABILITADOS COMPLETAMENTE**

**Motivo:**
- Geração de laudos é LOCAL (emissor)
- Geração de recibos pode rodar localmente também
- Recálculos automáticos são via **TRIGGER DO BANCO** (não cron)

**vercel.json NÃO tem seção `crons`** (confirmado ✅)

**Dashboard Vercel → Settings → Cron Jobs:**
- ✅ Verificar se está vazio (sem cron configurado)
- ✅ Se houver, deletar todos

---

## ⚡ RECÁLCULOS AUTOMÁTICOS (VIA TRIGGER)

### 🗄️ **Trigger do PostgreSQL (Neon)**

```sql
-- Migration 150: fn_recalcular_status_lote_on_avaliacao_update
CREATE OR REPLACE FUNCTION fn_recalcular_status_lote_on_avaliacao_update()
RETURNS trigger AS $$
BEGIN
  -- Quando avaliação muda de status, recalcula status do lote
  -- Marca lote como 'concluido' quando todas finalizadas
  -- NÃO insere mais em fila_emissao automaticamente
  UPDATE lotes_avaliacao SET status = 'concluido' WHERE ...
END;
$$ LANGUAGE plpgsql;

-- Trigger dispara em cada UPDATE de avaliacoes
CREATE TRIGGER trg_recalcular_status_lote
AFTER UPDATE OF status ON avaliacoes
FOR EACH ROW EXECUTE FUNCTION fn_recalcular_status_lote_on_avaliacao_update();
```

### 📋 **Função do Código (`lib/lotes.ts`)**

```typescript
// Chamada pelas APIs quando necessário (não é cron)
export async function recalcularStatusLotePorId(loteId: number) {
  // Lógica de recálculo
  // 1. Conta avaliações concluídas/inativadas
  // 2. Se todas finalizadas → status 'concluido'
  // 3. Cria notificação para RH/Entidade
  // 4. NÃO emite laudo automaticamente
}
```

**Usado em:**
- `POST /api/rh/lotes/[id]/avaliacoes/[avaliacaoId]/inativar`
- `POST /api/entidade/lote/[id]/avaliacoes/[avaliacaoId]/inativar`
- Outras operações que alteram status de avaliações

---

## ✅ VANTAGENS DA ARQUITETURA HÍBRIDA

1. **Performance:** Puppeteer local sem timeout Vercel
2. **Custo:** Não paga por serverless functions pesadas
3. **Controle:** Emissor supervisiona geração (pode corrigir erros)
4. **Segurança:** Dados no Neon (centralizados)
5. **Disponibilidade:** Laudos no Backblaze (acesso online 24/7)

---

## ⚠️ LIMITAÇÕES E CUIDADOS

### 🔴 **Emissor DEVE ter acesso local:**
- Máquina com Chrome/Chromium instalado
- Conexão estável com Neon Cloud
- Credenciais Backblaze configuradas
- `pnpm dev` rodando

### 🟡 **Se emissor estiver offline:**
- RH/Entidade pode solicitar emissão (vai para fila)
- Emissão só será processada quando emissor abrir dashboard local
- Usuários NÃO conseguem visualizar laudos não emitidos

### 🟢 **Fallback Futuro (Opcional):**
```typescript
// Pode-se implementar:
// - Queue Redis/BullMQ para processar laudos em batch
// - Service worker local que monitora fila_emissao
// - Sistema de retry automático se upload falhar
```

---

## 📊 MONITORAMENTO

### Verificar Fila de Emissão (Neon)

```sql
-- Ver laudos pendentes
SELECT le.id, le.lote_id, la.codigo, le.tipo_solicitante, le.created_at
FROM fila_emissao le
JOIN lotes_avaliacao la ON la.id = le.lote_id
WHERE le.processado = false
ORDER BY le.created_at;

-- Ver laudos emitidos hoje
SELECT l.id, l.lote_id, la.codigo, l.emitido_em, l.emissor_cpf
FROM laudos l
JOIN lotes_avaliacao la ON la.id = l.lote_id
WHERE l.emitido_em::date = CURRENT_DATE
ORDER BY l.emitido_em DESC;
```

### Logs do Emissor Local

```powershell
# Ver logs em tempo real
pnpm dev | Select-String "LAUDO|UPLOAD|BACKBLAZE"
```

---

## 🔄 MIGRAÇÃO PARA SERVERLESS (FUTURO)

Se no futuro a Vercel aumentar limites ou você migrar para AWS Lambda:

1. **Configurar Puppeteer serverless:**
   ```typescript
   executablePath: await chromium.executablePath
   ```

2. **Aumentar timeout Vercel:**
   ```json
   // vercel.json
   "functions": {
     "app/api/emissor/laudos/**/*.ts": {
       "memory": 3008,
       "maxDuration": 300 // 5 minutos (Pro plan)
     }
   }
   ```

3. **Processar via cron:**
   ```json
   "crons": [{
     "path": "/api/jobs/process-laudos",
     "schedule": "*/5 * * * *"
   }]
   ```

---

## 📝 CHECKLIST DE VERIFICAÇÃO

### ✅ Emissor Local Funcionando

- [ ] `.env.local` com DATABASE_URL do Neon
- [ ] Credenciais Backblaze configuradas
- [ ] `pnpm dev` rodando sem erros
- [ ] Dashboard `/emissor` carrega lotes pendentes
- [ ] Geração de laudo funciona
- [ ] Upload para Backblaze sucesso
- [ ] URL salva no banco Neon
- [ ] Download online funciona (Vercel → Backblaze)

### ✅ Produção Online (Vercel)

- [ ] Nenhum cron job configurado
- [ ] RH/Entidade consegue solicitar emissão
- [ ] Visualização/download de laudos emitidos funciona
- [ ] Triggers de recálculo automático funcionam
- [ ] Notificações criadas quando lote finaliza

---

**Última atualização:** 02/02/2026  
**Autor:** Sistema Qwork  
**Ambiente:** Produção híbrida (Vercel + Local Emissor)
