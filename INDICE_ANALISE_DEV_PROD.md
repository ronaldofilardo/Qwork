# Índice: Análise DEV vs PROD e Prevenção de Divergências

**Data de Criação:** 10 de fevereiro de 2026  
**Objetivo:** Centralizar documentação de análise e scripts de verificação

---

## 📚 Documentos Criados

### 1. RESUMO_EXECUTIVO_DEV_PROD.md
**Propósito:** Visão geral executiva da análise  
**Conteúdo:**
- Estado atual de DEV (validado)
- Checklist de verificação para PROD
- Plano de ação passo a passo
- Comandos rápidos

**Quando usar:** Ponto de partida para entender o problema e próximos passos

---

### 2. ANALISE_DEV_PROD_DIFERENCAS.md
**Propósito:** Análise técnica detalhada  
**Conteúdo:**
- Estado completo do ambiente DEV
- Verificações necessárias em PROD
- Checklist de verificação manual
- Cenários e ações recomendadas
- Riscos e considerações

**Quando usar:** Investigação técnica profunda e troubleshooting

---

### 3. GUIA_VERIFICACAO_LOGS.md
**Propósito:** Como analisar logs de aplicação e banco  
**Conteúdo:**
- Verificação de logs Vercel
- Verificação de logs Neon
- Análise de erros específicos
- Monitoramento contínuo

**Quando usar:** Investigar erros em produção ou monitorar sistema

---

### 4. APLICAR_MIGRATION_1004_PRODUCAO.sql
**Propósito:** Instruções para aplicar Migration 1004 em PROD  
**Conteúdo:**
- SQL completo da migration
- Instruções passo a passo para Neon Console
- Query de verificação
- Resultados esperados

**Quando usar:** Quando verificação confirmar que PROD precisa da migration

---

## 🛠️ Scripts Criados

### 1. scripts/check-prod-status.cjs
**Propósito:** Verificação rápida e focada de PROD  
**O que verifica:**
- Se Migration 1004 foi aplicada
- DEFAULT da coluna laudos.status
- Constraints ativas
- Laudos recentes e inconsistentes

**Uso:**
```bash
node scripts/check-prod-status.cjs "postgresql://[PROD_URL]"
```

**Tempo de execução:** ~1 minuto  
**Output:** Relatório estruturado com status e recomendações

---

### 2. scripts/analyze-dev-prod-diff.cjs
**Propósito:** Comparação completa de estrutura DEV vs PROD  
**O que compara:**
- Triggers (quantidade e definições)
- Funções custom
- Defaults de colunas
- Constraints
- Estado dos dados (lotes e laudos)
- Jobs e processos externos

**Uso:**
```bash
$env:DATABASE_URL = "postgresql://[PROD_URL]"
node scripts/analyze-dev-prod-diff.cjs
```

**Tempo de execução:** ~2 minutos  
**Output:** Comparação lado a lado DEV vs PROD

---

### 3. scripts/check-audit-logs.cjs
**Propósito:** Análise de eventos de auditoria  
**O que verifica:**
- Tabelas de auditoria existentes
- Solicitações de emissão
- Jobs de PDF
- Jobs de geração de laudo
- Fila de emissão
- Mudanças recentes em lotes e laudos

**Uso:**
```bash
node scripts/check-audit-logs.cjs "postgresql://[DATABASE_URL]"
```

**Tempo de execução:** ~1 minuto  
**Output:** Histórico de eventos e estado de filas

---

## 🎯 Fluxo de Trabalho Recomendado

### Fase 1: Diagnóstico (5-10 min)
```
1. Ler RESUMO_EXECUTIVO_DEV_PROD.md
   ↓
2. Copiar DATABASE_URL de .env.production.local
   ↓
3. Executar check-prod-status.cjs
   ↓
4. Analisar output e identificar problemas
```

### Fase 2: Investigação Detalhada (se necessário)
```
1. Executar analyze-dev-prod-diff.cjs
   ↓
2. Consultar ANALISE_DEV_PROD_DIFERENCAS.md
   ↓
3. Executar check-audit-logs.cjs
   ↓
4. Verificar GUIA_VERIFICACAO_LOGS.md
   ↓
5. Analisar logs Vercel e Neon
```

### Fase 3: Correção (caso Migration 1004 não aplicada)
```
1. Abrir APLICAR_MIGRATION_1004_PRODUCAO.sql
   ↓
2. Copiar SQL da migration
   ↓
3. Acessar console.neon.tech
   ↓
4. Executar no SQL Editor
   ↓
5. Executar query de verificação
```

### Fase 4: Validação
```
1. Executar check-prod-status.cjs novamente
   ↓
2. Criar lote de teste em PROD
   ↓
3. Verificar laudo criado com status='rascunho'
   ↓
4. Monitorar logs Vercel por 24h
```

---

## 🔍 Comparativo: O Que Cada Script Verifica

| Aspecto | check-prod-status.cjs | analyze-dev-prod-diff.cjs | check-audit-logs.cjs |
|---------|----------------------|---------------------------|---------------------|
| **Migration 1004** | ✅ Sim | ✅ Sim (função) | ❌ Não |
| **Triggers** | ❌ Não | ✅ Sim (lista completa) | ❌ Não |
| **Funções** | ✅ Sim (1 função crítica) | ✅ Sim (todas) | ❌ Não |
| **Defaults** | ✅ Sim (laudos.status) | ✅ Sim (todas colunas) | ❌ Não |
| **Constraints** | ✅ Sim (laudos) | ✅ Sim (todas tabelas) | ❌ Não |
| **Laudos Recentes** | ✅ Sim | ✅ Sim | ❌ Não |
| **Laudos Inconsistentes** | ✅ Sim | ❌ Não | ❌ Não |
| **Audit Logs** | ❌ Não | ❌ Não | ✅ Sim |
| **Jobs/Filas** | ❌ Não | ✅ Sim (básico) | ✅ Sim (detalhado) |
| **Comparação DEV/PROD** | ❌ Não | ✅ Sim | ❌ Não |
| **Tempo** | ~1 min | ~2 min | ~1 min |
| **Uso Principal** | Verificação inicial | Análise completa | Investigação de eventos |

---

## ⚡ Comandos de Emergência

### Se PROD estiver com erro ativo:
```powershell
# 1. Verificação imediata
$prodUrl = "postgresql://[copiar do .env.production.local]"
node scripts\check-prod-status.cjs $prodUrl

# 2. Se confirmar que precisa Migration 1004, aplicar:
# - Abrir APLICAR_MIGRATION_1004_PRODUCAO.sql
# - Copiar SQL
# - Executar em console.neon.tech

# 3. Verificar logs Vercel
vercel logs --follow | Select-String "laudo|emitido"

# 4. Validar correção
node scripts\check-prod-status.cjs $prodUrl
```

### Se houver laudos inconsistentes:
```sql
-- Executar no Neon Console
UPDATE laudos 
SET status = 'rascunho'
WHERE status = 'emitido'
  AND hash_pdf IS NULL;
```

---

## 📊 Métricas de Estado Saudável

### Ambiente DEV (Atual)
- ✅ Triggers: 54
- ✅ Funções custom: 12
- ✅ Migration 1004: Aplicada
- ✅ Laudos inconsistentes: 0
- ✅ Audit logs: Funcionando (118+ eventos)
- ✅ Lotes recentes: Funcionando normalmente

### Ambiente PROD (Esperado)
- ⏳ Triggers: Deve ter ~54 (verificar)
- ⏳ Funções custom: Deve ter ~12 (verificar)
- ⏳ Migration 1004: Verificar se aplicada
- ⏳ Laudos inconsistentes: Deve ter 0
- ⏳ Audit logs: Verificar se ativados
- ⏳ Lotes recentes: Verificar estado

---

## 🚨 Alertas e Sinais de Problema

### Sinais de que PROD precisa Migration 1004:
- ❌ Erro: "Laudo não pode ser marcado como emitido sem hash_pdf"
- ❌ Função não contém `status='rascunho'`
- ❌ Laudos com status='emitido' e hash_pdf=NULL

### Sinais de que PROD está divergente de DEV:
- ⚠️ Diferença no número de triggers
- ⚠️ Funções com definições diferentes
- ⚠️ Constraints ausentes ou diferentes
- ⚠️ Defaults de colunas diferentes

### Sinais de outros problemas:
- 🔴 "SECURITY: app.current_user_cpf not set" → Problema de transação
- 🔴 Connection timeout → Problema de pool/conexão
- 🔴 Jobs empilhados → Problema de processamento assíncrono

---

## 📁 Estrutura de Arquivos

```
c:\apps\QWork\
│
├── 📄 RESUMO_EXECUTIVO_DEV_PROD.md          # Este arquivo (índice)
├── 📄 ANALISE_DEV_PROD_DIFERENCAS.md        # Análise técnica detalhada
├── 📄 GUIA_VERIFICACAO_LOGS.md              # Guia de logs
├── 📄 APLICAR_MIGRATION_1004_PRODUCAO.sql   # Instruções de aplicação
│
├── database/migrations/
│   └── 1004_fix_fn_reservar_laudo_status_rascunho.sql
│
└── scripts/
    ├── check-prod-status.cjs              # Verificação rápida
    ├── analyze-dev-prod-diff.cjs          # Comparação completa
    └── check-audit-logs.cjs               # Análise de audit logs
```

---

## 🎓 Conceitos Importantes

### Migration 1004: O Problema e a Solução

**Problema Original:**
```sql
-- Trigger antigo (Migration 1003)
INSERT INTO laudos (id, lote_id)
VALUES (NEW.id, NEW.id);
-- Não especifica status, usa DEFAULT='emitido'
-- Causa erro pois 'emitido' requer hash_pdf
```

**Solução (Migration 1004):**
```sql
-- Trigger corrigido
INSERT INTO laudos (id, lote_id, status)
VALUES (NEW.id, NEW.id, 'rascunho');
-- Especifica explicitamente status='rascunho'
-- 'rascunho' permite hash_pdf=NULL
```

### Por que DEFAULT='emitido' é problemático?

1. **Constraint:** `chk_laudos_hash_when_emitido` exige hash_pdf NOT NULL quando status='emitido'
2. **Trigger:** Executa ANTES de hash_pdf ser gerado
3. **Resultado:** Violação de constraint se status usar DEFAULT='emitido'

### Fluxo Correto de Criação de Laudo:

```
1. Usuário cria lote
   ↓
2. Trigger: INSERT em lotes_avaliacao
   ↓
3. Trigger: trg_reservar_id_laudo_on_lote_insert
   ↓
4. Função: fn_reservar_id_laudo_on_lote_insert()
   ↓
5. INSERT INTO laudos (..., status='rascunho')  ← Migration 1004
   ↓
6. Laudo criado: { id, lote_id, status='rascunho', hash_pdf=NULL }
   ↓
7. ... processo de geração de PDF ...
   ↓
8. UPDATE laudos SET status='emitido', hash_pdf='...', emissor_cpf='...'
   ↓
9. Laudo emitido: { id, lote_id, status='emitido', hash_pdf='abc123' }
```

---

## ✅ Checklist Final

Antes de considerar DEV e PROD sincronizados:

### Estrutura do Banco
- [ ] Mesma quantidade de triggers
- [ ] Mesma quantidade de funções
- [ ] Funções com definições idênticas
- [ ] Constraints idênticas
- [ ] Defaults de colunas críticas idênticos

### Migration 1004
- [ ] Aplicada em DEV ✅
- [ ] Aplicada em PROD ⏳
- [ ] Função contém `status='rascunho'` em ambos

### Estado dos Dados
- [ ] Nenhum laudo inconsistente em DEV ✅
- [ ] Nenhum laudo inconsistente em PROD ⏳
- [ ] Lotes criando laudos corretamente

### Monitoramento
- [ ] Logs Vercel configurados
- [ ] Logs Neon monitorados
- [ ] Audit logs funcionando
- [ ] Alertas configurados

### Testes
- [ ] Criar lote em DEV funciona ✅
- [ ] Criar lote em PROD funciona ⏳
- [ ] Laudos transitam de rascunho → emitido corretamente

---

## 📞 Suporte e Referências

### Documentação Relacionada
- `BUILD_APPROVAL_RH_FIX.md` - Fix de aprovação RH
- `CORRECAO_LIBERAR_LOTE.md` - Correções de liberação
- `RELATORIO_SINCRONIZACAO_BANCOS_2026-02-09.md` - Sincronização anterior

### Recursos Externos
- Neon Console: https://console.neon.tech
- Vercel Dashboard: https://vercel.com/dashboard
- PostgreSQL Docs: https://www.postgresql.org/docs/

---

**Criado em:** 10/02/2026  
**Última Atualização:** 10/02/2026  
**Status:** DEV validado ✅ | PROD pendente verificação ⏳  
**Próxima Ação:** Executar `check-prod-status.cjs` com DATABASE_URL de PROD
