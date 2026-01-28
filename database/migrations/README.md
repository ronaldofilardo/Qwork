# Migrations de Ativação e Tokens - README

## 📋 Visão Geral

Este diretório contém as migrations críticas para implementação do sistema de ativação segura de contratantes e reenvio de links de pagamento.

## 🗂️ Arquivos

### migration-004-constraints-ativacao.sql

**Objetivo:** Adicionar constraints de integridade para prevenir ativação prematura de contratantes.

**O que faz:**

- Cria constraint `chk_ativa_exige_pagamento` que impede `ativa = true` sem `pagamento_confirmado = true`
- Cria constraint `chk_contrato_exige_pagamento` para contratos
- Adiciona tabela `alertas_integridade` para registrar violações
- Cria triggers para detectar tentativas de ativação inválida
- Implementa funções de correção automática de inconsistências
- Cria view `vw_contratantes_inconsistentes` para auditoria

**Impacto:**

- 🔒 **QUEBRA FUNCIONALIDADES EXISTENTES** que tentam ativar sem pagamento
- ✅ Previne bugs críticos de ativação prematura
- 📊 Adiciona rastreabilidade completa

### migration-005-tokens-retomada.sql

**Objetivo:** Criar infraestrutura para reenvio de links de pagamento com tokens seguros.

**O que faz:**

- Cria tabela `tokens_retomada_pagamento` com TTL de 48h
- Implementa função `fn_validar_token_pagamento()` para validação
- Implementa função `fn_marcar_token_usado()` para prevenir reutilização
- Implementa função `fn_limpar_tokens_expirados()` para limpeza automática
- Cria view `vw_tokens_auditoria` para monitoramento

**Impacto:**

- ✅ Adiciona nova funcionalidade sem quebrar código existente
- 🔐 Segurança: tokens únicos, expiráveis e de uso único

## 🚀 Como Aplicar

### Opção 1: PowerShell Script (Recomendado)

```powershell
.\scripts\powershell\aplicar-migrations-ativacao.ps1
```

### Opção 2: Via pnpm

```bash
# Aplicar ambas
pnpm migrate:all

# Ou individualmente
pnpm migrate:ativacao
pnpm migrate:tokens
```

### Opção 3: Manualmente com psql

```bash
# Migration 004
psql -U postgres -h localhost -p 5432 -d nr-bps_db \
  -f database/migrations/migration-004-constraints-ativacao.sql

# Migration 005
psql -U postgres -h localhost -p 5432 -d nr-bps_db \
  -f database/migrations/migration-005-tokens-retomada.sql
```

## ⚠️ Atenção

### Antes de Aplicar

1. **Fazer backup do banco de dados:**

   ```bash
   pg_dump -U postgres -h localhost -d nr-bps_db > backup-pre-migrations.sql
   ```

2. **Verificar inconsistências existentes:**

   ```sql
   SELECT id, nome, ativa, pagamento_confirmado, status
   FROM contratantes
   WHERE ativa = true AND pagamento_confirmado = false;
   ```

3. **Avisar equipe:** Migrations podem causar downtime se houver código dependente

### Durante a Aplicação

- Migration 004 vai **automaticamente corrigir** inconsistências existentes
- Contratantes ativos sem pagamento serão desativados e marcados como `inconsistente`
- Alertas de alta prioridade serão criados na tabela `alertas_integridade`

### Após Aplicar

1. **Verificar integridade:**

   ```sql
   SELECT * FROM vw_contratantes_inconsistentes;
   -- Deve retornar 0 linhas
   ```

2. **Revisar alertas:**

   ```sql
   SELECT * FROM alertas_integridade WHERE resolvido = false;
   ```

3. **Executar testes:**
   ```bash
   pnpm test __tests__/e2e/fluxo-pagamento-completo.test.ts
   ```

## 🔄 Rollback

Se necessário reverter:

### Migration 004

```sql
-- Remover constraints
ALTER TABLE contratantes DROP CONSTRAINT IF EXISTS chk_ativa_exige_pagamento;
ALTER TABLE contratantes DROP CONSTRAINT IF EXISTS chk_contrato_exige_pagamento;

-- Remover tabela de alertas (CUIDADO: perde histórico)
DROP TABLE IF EXISTS alertas_integridade CASCADE;

-- Remover triggers
DROP TRIGGER IF EXISTS trg_validar_ativacao_contratante ON contratantes;
DROP FUNCTION IF EXISTS fn_validar_ativacao_contratante();
```

### Migration 005

```sql
-- Remover tabela de tokens
DROP TABLE IF EXISTS tokens_retomada_pagamento CASCADE;

-- Remover funções
DROP FUNCTION IF EXISTS fn_validar_token_pagamento(VARCHAR);
DROP FUNCTION IF EXISTS fn_marcar_token_usado(VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS fn_limpar_tokens_expirados();
```

## 📊 Monitoramento

### Queries Úteis

**Verificar tokens ativos:**

```sql
SELECT * FROM vw_tokens_auditoria
WHERE status = 'valido'
ORDER BY gerado_em DESC;
```

**Verificar alertas não resolvidos:**

```sql
SELECT tipo, COUNT(*) as total
FROM alertas_integridade
WHERE resolvido = false
GROUP BY tipo
ORDER BY total DESC;
```

**Estatísticas de uso de tokens:**

```sql
SELECT
  tipo_plano,
  COUNT(*) as total_tokens,
  SUM(CASE WHEN usado THEN 1 ELSE 0 END) as tokens_usados,
  SUM(CASE WHEN expiracao < NOW() AND NOT usado THEN 1 ELSE 0 END) as tokens_expirados
FROM tokens_retomada_pagamento
GROUP BY tipo_plano;
```

## 🔧 Manutenção

### Limpeza de Tokens Expirados

Executar semanalmente:

```sql
SELECT fn_limpar_tokens_expirados();
```

Ou configurar cron:

```bash
# Executar todo domingo às 2h
0 2 * * 0 psql -U postgres -d nr-bps_db -c "SELECT fn_limpar_tokens_expirados();"
```

### Resolver Alertas

```sql
-- Marcar alerta como resolvido
UPDATE alertas_integridade
SET resolvido = true,
    resolvido_em = NOW(),
    resolvido_por = '12345678901' -- CPF do admin
WHERE id = X;
```

## 📞 Suporte

- **Documentação completa:** `docs/fluxo-pagamento.md`
- **Logs:** Console do servidor + `audit_logs` table
- **Reconciliação:** `pnpm reconciliar:contratos`

## ✅ Checklist de Validação

Após aplicar migrations, verificar:

- [ ] Constraint `chk_ativa_exige_pagamento` está ativa
- [ ] Tabela `alertas_integridade` existe e está populada (se houve correções)
- [ ] Tabela `tokens_retomada_pagamento` existe
- [ ] Funções de validação existem e funcionam
- [ ] View `vw_contratantes_inconsistentes` retorna 0 linhas
- [ ] Testes E2E passam
- [ ] Endpoint `/api/admin/gerar-link-plano-fixo` responde corretamente
- [ ] Endpoint `/api/pagamento/validar-token` responde corretamente
- [ ] Simulador aceita token e carrega dados corretamente

## 🎯 Objetivo Final

Garantir que **ZERO** contratantes estejam ativos sem pagamento confirmado:

```sql
SELECT COUNT(*) as inconsistencias
FROM contratantes
WHERE ativa = true AND pagamento_confirmado = false;
-- Resultado esperado: 0
```

Se este número for > 0, execute:

```sql
SELECT fn_corrigir_inconsistencias_contratantes();
```
