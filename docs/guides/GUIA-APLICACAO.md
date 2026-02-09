# 🚀 Guia Rápido de Aplicação - Plano de Correção

**ATENÇÃO:** Este guia deve ser seguido na ordem exata para garantir implementação segura.

---

## ⏱️ Tempo Estimado

- **Desenvolvimento/Staging:** 15-20 minutos
- **Produção:** 30-45 minutos (incluindo validações extras)

---

## 📋 Pré-requisitos

- [ ] PostgreSQL instalado e acessível
- [ ] Backup do banco de dados realizado
- [ ] Acesso ao servidor/ambiente
- [ ] Node.js e pnpm instalados
- [ ] Código atualizado com todos os arquivos novos

---

## 🔧 Passo a Passo

### 1. Backup (OBRIGATÓRIO)

```bash
# Fazer backup completo do banco
pg_dump -U postgres -h localhost -d nr-bps_db > backup-antes-correcoes-$(date +%Y%m%d-%H%M%S).sql

# Verificar que backup foi criado
ls -lh backup-*.sql
```

### 2. Verificar Estado Atual

```sql
-- Conectar ao banco
psql -U postgres -h localhost -d nr-bps_db

-- Verificar inconsistências ANTES das correções
SELECT
  COUNT(*) as total_tomadores,
  COUNT(*) FILTER (WHERE ativa = true AND pagamento_confirmado = false) as ativos_sem_pagamento,
  COUNT(*) FILTER (WHERE status = 'aguardando_pagamento') as aguardando_pagamento
FROM tomadores;

-- Anotar os números para comparação posterior
-- Sair do psql
\q
```

### 3. Aplicar Migrations

```bash
# Opção A: Via PowerShell (Recomendado para Windows)
.\scripts\powershell\aplicar-migrations-ativacao.ps1

# Opção B: Via pnpm
pnpm migrate:all

# Opção C: Manual
psql -U postgres -h localhost -d nr-bps_db -f database/migrations/migration-004-constraints-ativacao.sql
psql -U postgres -h localhost -d nr-bps_db -f database/migrations/migration-005-tokens-retomada.sql
```

**Saída esperada:**

```
✅ Migration 004 aplicada com sucesso
✅ Migration 005 aplicada com sucesso
✅ TODAS AS MIGRATIONS APLICADAS COM SUCESSO
```

### 4. Verificar Integridade Pós-Migration

```sql
-- Reconectar ao banco
psql -U postgres -h localhost -d nr-bps_db

-- DEVE retornar 0 linhas (todas inconsistências foram corrigidas)
SELECT * FROM vw_tomadores_inconsistentes;

-- Verificar constraints instaladas
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname LIKE 'chk_ativa%' OR conname LIKE 'chk_contrato%';

-- Verificar tabelas criadas
SELECT tablename FROM pg_tables
WHERE tablename IN ('alertas_integridade', 'tokens_retomada_pagamento');

-- Verificar alertas criados durante correção
SELECT tipo, severidade, COUNT(*) as total
FROM alertas_integridade
GROUP BY tipo, severidade
ORDER BY severidade DESC, total DESC;
```

### 5. Instalar Dependências (se necessário)

```bash
# Se houver novos pacotes
pnpm install
```

### 6. Executar Testes

```bash
# Executar testes E2E do fluxo de pagamento
pnpm test __tests__/e2e/fluxo-pagamento-completo.test.ts

# Se estiver em ambiente de teste, executar suite completa
pnpm test
```

**Resultado esperado:**

```
✅ Todos os testes passaram
```

### 7. Testar Endpoint de Reenvio de Link

```bash
# Criar um tomador de teste (se ainda não existir)
# Depois testar endpoint via cURL ou Postman

curl -X POST http://localhost:3000/api/admin/gerar-link-plano-fixo \
  -H "Content-Type: application/json" \
  -H "Cookie: session=SEU_SESSION_TOKEN" \
  -d '{"tomador_id": 123}'
```

**Resposta esperada:**

```json
{
  "success": true,
  "data": {
    "token": "...",
    "payment_link": "http://localhost:3000/pagamento/simulador?contratacao_id=123&retry=true",
    "expires_at": "2025-12-27T10:00:00Z"
  }
}
```

### 8. Testar Fluxo Completo

1. **Acessar link gerado** no navegador (modo anônimo)
2. **Verificar que dados são carregados** automaticamente
3. **Simular pagamento** (ou usar modo de teste)
4. **Verificar que tomador é ativado** após pagamento

### 9. Configurar Reconciliação Diária

```bash
# Linux/Mac - Adicionar ao crontab
crontab -e

# Adicionar esta linha:
0 3 * * * cd /caminho/para/qwork && pnpm reconciliar:contratos >> /var/log/qwork-reconciliacao.log 2>&1

# Windows - Usar Task Scheduler
# Criar tarefa que executa diariamente às 3h:
# Ação: powershell.exe
# Argumentos: -Command "cd C:\apps\QWork; pnpm reconciliar:contratos"
```

### 10. Validação Final

```sql
-- Verificar que sistema está íntegro
SELECT
  'tomadores ativos válidos' as metrica,
  COUNT(*) as total
FROM tomadores
WHERE ativa = true AND pagamento_confirmado = true

UNION ALL

SELECT
  'Inconsistências restantes' as metrica,
  COUNT(*) as total
FROM vw_tomadores_inconsistentes

UNION ALL

SELECT
  'Tokens ativos' as metrica,
  COUNT(*) as total
FROM tokens_retomada_pagamento
WHERE expiracao > NOW() AND usado = false;
```

**Resultado esperado:**

- tomadores ativos válidos: N (qualquer número >= 0)
- **Inconsistências restantes: 0** ⬅️ CRÍTICO
- Tokens ativos: N (qualquer número >= 0)

---

## ✅ Checklist de Validação

Antes de considerar deploy completo, verificar:

### Banco de Dados

- [ ] Backup realizado e validado
- [ ] Migration 004 aplicada com sucesso
- [ ] Migration 005 aplicada com sucesso
- [ ] Constraint `chk_ativa_exige_pagamento` existe
- [ ] Tabela `alertas_integridade` existe e populada (se houve correções)
- [ ] Tabela `tokens_retomada_pagamento` existe
- [ ] View `vw_tomadores_inconsistentes` retorna 0 linhas
- [ ] Funções criadas existem (fn_validar_token_pagamento, etc)

### Código

- [ ] Todos os arquivos novos criados
- [ ] Todos os arquivos modificados atualizados
- [ ] Build do projeto passa sem erros
- [ ] ESLint passa sem erros críticos
- [ ] TypeScript compila sem erros

### Testes

- [ ] Testes E2E passam
- [ ] Testes unitários passam
- [ ] Teste manual do fluxo de reenvio funciona
- [ ] Teste manual do simulador com token funciona

### Infraestrutura

- [ ] Cron de reconciliação configurado
- [ ] Logs de reconciliação sendo escritos corretamente
- [ ] Alertas de integridade sendo criados (se aplicável)

### Documentação

- [ ] Equipe informada sobre mudanças
- [ ] Documentação lida e compreendida
- [ ] Procedimentos de rollback conhecidos

---

## 🚨 Em Caso de Problema

### Constraint Bloqueando Código Legítimo

Se algum código legítimo for bloqueado pela constraint:

1. **NÃO remover a constraint**
2. Verificar se é caso de uso válido
3. Se sim, usar função `ativartomador()` com justificativa
4. Se não, corrigir o código

### Rollback Necessário

```sql
-- Migration 004
ALTER TABLE tomadores DROP CONSTRAINT IF EXISTS chk_ativa_exige_pagamento;
ALTER TABLE tomadores DROP CONSTRAINT IF EXISTS chk_contrato_exige_pagamento;
DROP TABLE IF EXISTS alertas_integridade CASCADE;

-- Migration 005
DROP TABLE IF EXISTS tokens_retomada_pagamento CASCADE;
```

Depois restaurar backup:

```bash
psql -U postgres -h localhost -d nr-bps_db < backup-antes-correcoes-XXXXXXXX.sql
```

### Performance Degradada

Se sistema ficar lento após migrations:

```sql
-- Reindexar tabelas
REINDEX TABLE tomadores;
REINDEX TABLE tokens_retomada_pagamento;

-- Atualizar estatísticas
ANALYZE tomadores;
ANALYZE tokens_retomada_pagamento;
```

---

## 📞 Suporte

- **Documentação Completa:** `IMPLEMENTACAO-COMPLETA.md`
- **Fluxo de Pagamento:** `docs/fluxo-pagamento.md`
- **Migrations:** `database/migrations/README.md`
- **Logs:** Console do servidor + arquivo de log

---

## 🎯 Critério de Sucesso

**Deploy só deve ser considerado completo quando:**

```sql
SELECT COUNT(*) FROM vw_tomadores_inconsistentes;
-- RETORNAR: 0
```

Se retornar > 0, executar:

```sql
SELECT fn_corrigir_inconsistencias_tomadores();
```

---

**Boa sorte! 🚀**
