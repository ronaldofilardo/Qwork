# 🗑️ Remoção de Sistema de Emissão Automática

**Data:** 31 de janeiro de 2026  
**Status:** ✅ Pronto para executar

---

## 📋 O QUE SERÁ REMOVIDO?

Esta remoção elimina **PERMANENTEMENTE** todo o sistema de emissão automática de laudos, incluindo:

### Colunas do Banco de Dados

- ✅ `auto_emitir_em` - Timestamp de agendamento
- ✅ `auto_emitir_agendado` - Flag de agendamento
- ✅ `processamento_em` - Lock de processamento
- ✅ `cancelado_automaticamente` - Flag de cancelamento automático
- ✅ `motivo_cancelamento` - Motivo do cancelamento

### Triggers e Funções

- ✅ `trg_verificar_cancelamento_automatico` - Trigger de cancelamento
- ✅ `verificar_cancelamento_automatico_lote()` - Função do trigger

### Índices

- ✅ `idx_lotes_auto_emitir`
- ✅ `idx_lotes_auto_emitir_agendado`
- ✅ `idx_lotes_processamento_em`

---

## ⚠️ ATENÇÃO

- Esta operação é **IRREVERSÍVEL**
- Backup será criado automaticamente
- Testes legados vão **FALHAR** após a remoção
- Sistema passa a ser **100% MANUAL**

---

## 🚀 COMO EXECUTAR

### Opção 1: Script PowerShell (Recomendado)

```powershell
# Desenvolvimento (com backup automático)
.\scripts\remover-emissao-automatica.ps1 -Environment dev

# Produção (com backup automático)
.\scripts\remover-emissao-automatica.ps1 -Environment prod

# Sem backup (NÃO recomendado)
.\scripts\remover-emissao-automatica.ps1 -Environment dev -SkipBackup
```

### Opção 2: SQL Direto

```powershell
# Desenvolvimento
$env:PGPASSWORD='123456'
psql -U postgres -d nr-bps_db_test -f "database\migrations\130_remove_auto_emission_columns.sql"

# Produção (ATENÇÃO!)
$env:PGPASSWORD='sua_senha'
psql -U postgres -d nr-bps_db -f "database\migrations\130_remove_auto_emission_columns.sql"
```

---

## ✅ VALIDAÇÃO

Após executar, verificar:

```sql
-- 1. Colunas removidas
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'lotes_avaliacao'
AND column_name IN (
    'auto_emitir_em',
    'auto_emitir_agendado',
    'processamento_em',
    'cancelado_automaticamente',
    'motivo_cancelamento'
);
-- Deve retornar: 0 linhas

-- 2. Triggers removidos
SELECT tgname
FROM pg_trigger
WHERE tgname = 'trg_verificar_cancelamento_automatico';
-- Deve retornar: 0 linhas

-- 3. Funções removidas
SELECT proname
FROM pg_proc
WHERE proname = 'verificar_cancelamento_automatico_lote';
-- Deve retornar: 0 linhas
```

---

## 📝 PRÓXIMOS PASSOS

1. **Executar a remoção** (script PowerShell ou SQL direto)
2. **Validar** usando queries acima
3. **Atualizar testes** - Ver `TESTES-LEGADOS-EMISSAO-AUTOMATICA.md`
4. **Testar sistema** - Verificar que emissão manual funciona
5. **Commit e deploy**

---

## 📁 ARQUIVOS RELACIONADOS

### Criados nesta remoção:

- `database/migrations/130_remove_auto_emission_columns.sql` - Migration
- `scripts/remover-emissao-automatica.ps1` - Script PowerShell
- `scripts/setup/remover-colunas-emissao-automatica.sql` - Wrapper SQL
- `__tests__/correcoes-31-01-2026/TESTES-LEGADOS-EMISSAO-AUTOMATICA.md` - Testes afetados
- `__tests__/correcoes-31-01-2026/REMOCAO-DEFINITIVA-EMISSAO-AUTOMATICA.md` - Documentação completa

### Modificados:

- `__tests__/emissor/emissao-emergencial.integration.test.ts` - Removido import
- `lib/laudo-auto.ts` - Funções documentadas como removidas

---

## 🔄 FLUXO ATUAL (PÓS-REMOÇÃO)

```
┌──────────────┐
│  RH/Entidade │
└──────┬───────┘
       │ 1. Solicita emissão
       │ POST /api/lotes/[id]/solicitar-emissao
       ▼
┌──────────────┐
│     API      │ 2. Valida e registra
└──────┬───────┘
       │ 3. Cria notificação
       ▼
┌──────────────┐
│   Emissor    │ 4. Vê no dashboard
└──────┬───────┘
       │ 5. Clica "Gerar Laudo"
       │ POST /api/emissor/laudos/[id]
       ▼
┌──────────────┐
│     API      │ 6. Gera PDF
└──────┬───────┘    (gerarLaudoCompletoEmitirPDF)
       │ 7. Salva no banco
       │    status='enviado'
       │    lote status='finalizado'
       ▼
┌──────────────┐
│    Laudo     │ ✅ Emitido
└──────────────┘
```

**100% Manual | 100% Controlado pelo Emissor | 100% Auditado**

---

## 🆘 SUPORTE

### Erro: Colunas ainda existem

```sql
-- Ver quais colunas ainda estão presentes
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'lotes_avaliacao';
```

### Reverter Mudanças

```powershell
# Se algo der errado, restaurar do backup
$BackupFile = "caminho/para/backup_antes_remocao_XXXXXX.sql"
psql -U postgres -d nr-bps_db < $BackupFile
```

### Testes Falhando

Ver lista completa de testes afetados em:
`__tests__/correcoes-31-01-2026/TESTES-LEGADOS-EMISSAO-AUTOMATICA.md`

---

## ✅ CONCLUSÃO

Após executar esta remoção:

- ✅ Sistema 100% manual
- ✅ Sem colunas legadas
- ✅ Sem triggers automáticos
- ✅ Código mais limpo
- ✅ Fluxo mais previsível

**Pronto para executar!** 🚀
