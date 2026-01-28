# Guia de Testes - Fluxo de Empresas Clientes

Este guia documenta todos os testes implementados para o fluxo de criação, atualização e exclusão de empresas clientes, incluindo validações de concorrência, auditoria e integridade de dados.

## 📋 Índice

1. [Preparação do Ambiente](#preparação-do-ambiente)
2. [Testes de Concorrência](#testes-de-concorrência)
3. [Testes de Auditoria](#testes-de-auditoria)
4. [Queries de Diagnóstico](#queries-de-diagnóstico)
5. [Solução de Problemas](#solução-de-problemas)

---

## 🔧 Preparação do Ambiente

### Pré-requisitos

- Node.js 18+
- PostgreSQL 17+ (local ou Neon)
- pnpm instalado
- Banco de dados de teste configurado

### Configuração Inicial

```bash
# 1. Instalar dependências
pnpm install

# 2. Configurar banco de dados de teste (Windows PowerShell como Admin)
.\scripts\powershell\setup-databases.ps1

# 3. Verificar variáveis de ambiente
# Certificar que existe .env.local com:
DATABASE_URL="postgresql://postgres:123456@localhost:5432/nr-bps_db_test"
SESSION_SECRET="seu-secret-aqui"
NODE_ENV="test"
```

### Aplicar Schema Atualizado

Antes de executar os testes, aplicar o schema com a constraint corrigida:

```bash
# Conectar ao banco de teste
psql -U postgres -d nr-bps_db_test

# Executar comandos SQL:
# 1. Remover constraint antiga
ALTER TABLE empresas_clientes DROP CONSTRAINT IF EXISTS empresas_clientes_cnpj_key;

# 2. Adicionar nova constraint (por clínica)
ALTER TABLE empresas_clientes
ADD CONSTRAINT empresas_clientes_cnpj_clinica_key
UNIQUE (clinica_id, cnpj);

# 3. Verificar constraint
\d empresas_clientes
```

---

## 🔀 Testes de Concorrência

### Descrição

Testes que validam o comportamento do sistema quando múltiplas requisições tentam criar empresas com o mesmo CNPJ simultaneamente.

**Arquivo:** `__tests__/concurrency/empresas-concurrency.test.ts`

### Casos de Teste

1. **Rejeitar criações simultâneas com mesmo CNPJ na mesma clínica**
   - ✅ Apenas 1 requisição deve ter sucesso (201)
   - ✅ 4 requisições devem retornar conflito (409)
   - ✅ Apenas 1 registro deve existir no banco

2. **Permitir mesmo CNPJ em clínicas diferentes**
   - ✅ Ambas criações devem ter sucesso
   - ✅ Cada clínica tem seu próprio registro

3. **Tratar race condition com normalização de CNPJ**
   - ✅ Variações de formatação (`12.345.678/0001-90`, `12345678000190`) são detectadas
   - ✅ Apenas 1 registro é criado

4. **Manter integridade sob carga**
   - ✅ 10 empresas diferentes criadas simultaneamente
   - ✅ Todas são salvas corretamente

### Executar Testes

```bash
# Executar apenas testes de concorrência
pnpm test __tests__/concurrency/empresas-concurrency.test.ts

# Com verbose (mais detalhes)
pnpm test __tests__/concurrency/empresas-concurrency.test.ts --verbose

# Com coverage
pnpm test __tests__/concurrency/empresas-concurrency.test.ts --coverage
```

### Tempo Esperado

- Duração total: ~30-45 segundos
- Cada teste individual: 5-10 segundos

### Resultados Esperados

```
PASS __tests__/concurrency/empresas-concurrency.test.ts
  Testes de Concorrência - Empresas Clientes
    ✓ Deve rejeitar criações simultâneas com mesmo CNPJ na mesma clínica (8523ms)
    ✓ Deve permitir mesmo CNPJ em clínicas diferentes simultaneamente (6234ms)
    ✓ Deve tratar race condition com normalização de CNPJ (4567ms)
    ✓ Deve manter integridade sob carga com transações (7890ms)

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
```

---

## 📝 Testes de Auditoria

### Descrição

Testes que verificam se as operações de CRUD são registradas corretamente na tabela `audit_logs` com contexto de usuário (user_cpf, user_perfil).

**Arquivo:** `__tests__/audit/empresas-audit.test.ts`

### Casos de Teste

1. **INSERT registra audit_log com user_cpf e user_perfil**
   - ✅ Log criado com operação INSERT
   - ✅ user_cpf e user_perfil preenchidos
   - ✅ new_data contém dados da empresa

2. **UPDATE registra old_data e new_data**
   - ✅ Log criado com operação UPDATE
   - ✅ old_data contém valores anteriores
   - ✅ new_data contém valores atualizados

3. **DELETE registra dados excluídos**
   - ✅ Log criado com operação DELETE
   - ✅ old_data contém dados antes da exclusão
   - ✅ new_data é null

4. **Operações sem queryWithContext NÃO registram user_cpf**
   - ✅ Logs criados sem contexto têm user_cpf vazio
   - ✅ Identifica endpoints que não usam queryWithContext

5. **Múltiplas operações geram múltiplos logs**
   - ✅ 3 INSERTs = 3 registros de auditoria
   - ✅ Cada log é independente

6. **Diferentes perfis são auditados corretamente**
   - ✅ Operação de RH tem user_perfil = 'rh'
   - ✅ Operação de Admin tem user_perfil = 'admin'

### Executar Testes

```bash
# Executar apenas testes de auditoria
pnpm test __tests__/audit/empresas-audit.test.ts

# Com verbose
pnpm test __tests__/audit/empresas-audit.test.ts --verbose

# Com watch mode (reexecuta ao salvar)
pnpm test __tests__/audit/empresas-audit.test.ts --watch
```

### Tempo Esperado

- Duração total: ~40-60 segundos
- Cada teste individual: 8-12 segundos (inclui timeouts para triggers assíncronos)

### Resultados Esperados

```
PASS __tests__/audit/empresas-audit.test.ts
  Testes de Auditoria - Empresas Clientes
    ✓ INSERT deve registrar audit_log com user_cpf e user_perfil (9234ms)
    ✓ UPDATE deve registrar audit_log com dados anteriores e novos (10123ms)
    ✓ DELETE deve registrar audit_log com dados excluídos (8567ms)
    ✓ Operações sem queryWithContext NÃO devem registrar user_cpf (7890ms)
    ✓ Múltiplas operações devem gerar múltiplos logs auditados (12345ms)
    ✓ Auditoria deve capturar contexto correto para diferentes perfis (9876ms)

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
```

---

## 🔍 Queries de Diagnóstico

### Descrição

Scripts SQL para verificar integridade de dados, duplicatas e cobertura de auditoria em produção ou desenvolvimento.

**Arquivo:** `scripts/diagnostics/check-empresas-integrity.sql`

### Como Executar

```bash
# Via psql (recomendado)
psql -U postgres -d nr-bps_db -f scripts/diagnostics/check-empresas-integrity.sql

# Ou executar queries individuais:
psql -U postgres -d nr-bps_db
\i scripts/diagnostics/check-empresas-integrity.sql
```

### Principais Queries

#### 1. Verificar Duplicatas de CNPJ

```sql
SELECT
    clinica_id,
    cnpj,
    COUNT(*) as quantidade,
    STRING_AGG(nome, ' | ') as nomes_empresas
FROM empresas_clientes
GROUP BY clinica_id, cnpj
HAVING COUNT(*) > 1;
```

**Resultado esperado:** Nenhuma linha (0 duplicatas)

#### 2. CNPJs Não Normalizados

```sql
SELECT
    id, nome, cnpj, LENGTH(cnpj) as tamanho
FROM empresas_clientes
WHERE cnpj !~ '^\d{14}$';
```

**Resultado esperado:** Nenhuma linha (todos normalizados)

#### 3. Operações Sem Auditoria

```sql
SELECT
    al.operation,
    COUNT(*) as sem_contexto
FROM audit_logs al
WHERE al.table_name = 'empresas_clientes'
  AND (al.user_cpf IS NULL OR al.user_cpf = '')
GROUP BY al.operation;
```

**Resultado esperado:** Nenhuma linha (todas auditadas)

#### 4. Taxa de Auditoria

```sql
SELECT
    ROUND(
        100.0 * COUNT(DISTINCT CASE WHEN al.id IS NOT NULL THEN ec.id END) /
        NULLIF(COUNT(DISTINCT ec.id), 0),
        2
    ) as percentual_auditado
FROM empresas_clientes ec
LEFT JOIN audit_logs al ON al.record_id = ec.id::text
    AND al.table_name = 'empresas_clientes';
```

**Resultado esperado:** 100.00%

### Executar Todas as Queries de Monitoramento

```bash
# Criar script de monitoramento
cat > check-empresas.sh << 'EOF'
#!/bin/bash
echo "=== VERIFICAÇÃO DE INTEGRIDADE ==="
psql -U postgres -d nr-bps_db -f scripts/diagnostics/check-empresas-integrity.sql
EOF

chmod +x check-empresas.sh
./check-empresas.sh
```

---

## 🧪 Executar Todos os Testes

### Suite Completa

```bash
# Executar TODOS os testes do projeto
pnpm test:all

# Apenas testes relacionados a empresas
pnpm test --testPathPattern="empresas"

# Com coverage detalhado
pnpm test --coverage --coverageDirectory=coverage/empresas
```

### Ordem Recomendada

1. **Testes unitários** (mais rápidos)
2. **Testes de concorrência** (médio)
3. **Testes de auditoria** (mais lentos devido a timeouts)

```bash
# Executar em ordem
pnpm test __tests__/concurrency/empresas-concurrency.test.ts && \
pnpm test __tests__/audit/empresas-audit.test.ts
```

---

## 🐛 Solução de Problemas

### Problema: Testes de Concorrência Falham

**Sintoma:** Mais de 1 requisição retorna 201 (sucesso)

**Solução:**

```sql
-- Verificar se constraint está correta
\d empresas_clientes

-- Deve mostrar:
-- "empresas_clientes_cnpj_clinica_key" UNIQUE (clinica_id, cnpj)

-- Se não estiver, aplicar:
ALTER TABLE empresas_clientes DROP CONSTRAINT IF EXISTS empresas_clientes_cnpj_key;
ALTER TABLE empresas_clientes ADD CONSTRAINT empresas_clientes_cnpj_clinica_key UNIQUE (clinica_id, cnpj);
```

### Problema: Testes de Auditoria Falham (user_cpf vazio)

**Sintoma:** `expect(log.user_cpf).toBe(testCPF)` falha

**Solução:**

1. Verificar se `queryWithContext` está sendo usado nos endpoints
2. Verificar se triggers de auditoria estão ativos:

```sql
-- Listar triggers na tabela
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgrelid = 'empresas_clientes'::regclass;

-- Se estiver desabilitado (tgenabled = 'D'), reabilitar:
ALTER TABLE empresas_clientes ENABLE TRIGGER audit_empresas_clientes;
```

### Problema: Queries de Diagnóstico Retornam Muitos Alertas

**Sintoma:** Duplicatas ou CNPJs não normalizados encontrados

**Solução de Correção (STAGING APENAS):**

```sql
-- 1. Backup primeiro!
CREATE TABLE empresas_clientes_backup AS SELECT * FROM empresas_clientes;

-- 2. Normalizar CNPJs
UPDATE empresas_clientes
SET cnpj = REGEXP_REPLACE(cnpj, '[^0-9]', '', 'g')
WHERE cnpj !~ '^\d{14}$';

-- 3. Remover duplicatas (mantém a mais antiga)
DELETE FROM empresas_clientes
WHERE id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (
            PARTITION BY clinica_id, cnpj
            ORDER BY criado_em ASC
        ) as rn
        FROM empresas_clientes
    ) sub
    WHERE rn > 1
);

-- 4. Verificar resultado
SELECT COUNT(*) FROM empresas_clientes;
```

### Problema: Servidor de Testes Não Inicia

**Sintoma:** `ECONNREFUSED` em testes que fazem fetch

**Solução:**

```bash
# 1. Verificar se porta 3000 está disponível
netstat -ano | findstr :3000

# 2. Matar processo se necessário (substituir {PID})
taskkill /PID {PID} /F

# 3. Iniciar servidor em modo de teste
NODE_ENV=test pnpm dev

# 4. Em outro terminal, executar testes
pnpm test
```

---

## 📊 Métricas de Sucesso

### Cobertura de Testes

**Meta:** >80% de cobertura nos módulos críticos

```bash
pnpm test --coverage
```

**Arquivos Críticos:**

- `app/api/rh/empresas/route.ts` - ✅ >90%
- `app/api/admin/empresas/route.ts` - ✅ >90%
- `lib/validators.ts` - ✅ 100%
- `lib/db-security.ts` - ✅ >85%

### Performance

| Teste                              | Tempo Esperado | Timeout |
| ---------------------------------- | -------------- | ------- |
| Concorrência - Rejeitar duplicatas | <10s           | 30s     |
| Auditoria - INSERT                 | <10s           | 10s     |
| Auditoria - UPDATE                 | <12s           | 10s     |
| Queries diagnóstico                | <5s            | -       |

### Integridade

- ✅ 0 duplicatas de CNPJ por clínica
- ✅ 100% CNPJs normalizados (14 dígitos)
- ✅ 100% operações auditadas com user_cpf
- ✅ 0 violações de FK (clinica_id válidos)

---

## 🚀 Deploy e Monitoramento

### Antes do Deploy

```bash
# 1. Executar todos os testes
pnpm test:all

# 2. Verificar queries de diagnóstico em staging
psql -U postgres -d nr-bps_db_staging -f scripts/diagnostics/check-empresas-integrity.sql

# 3. Validar schema
psql -U postgres -d nr-bps_db_staging -c "\d empresas_clientes"
```

### Após Deploy

```bash
# 1. Monitorar logs de auditoria (primeiras 24h)
psql -U postgres -d nr-bps_db_prod << 'SQL'
SELECT
    al.operation,
    COUNT(*) as quantidade,
    COUNT(DISTINCT al.user_cpf) as usuarios
FROM audit_logs al
WHERE al.table_name = 'empresas_clientes'
  AND al.created_at >= NOW() - INTERVAL '24 hours'
GROUP BY al.operation;
SQL

# 2. Verificar taxa de erro (deve ser 0)
# No Vercel Logs ou equivalente, buscar por:
# - "Database error:" com code 23505
# - "CNPJ já cadastrado"
```

---

## 📞 Suporte

**Problemas com testes?**

1. Verificar [Solução de Problemas](#solução-de-problemas)
2. Consultar logs: `pnpm test --verbose`
3. Executar queries de diagnóstico
4. Verificar estado do banco de teste

**Dúvidas sobre implementação?**

- Ver código-fonte dos testes
- Consultar [Copilot Instructions](../copilot-instructions.md)
- Revisar commits da implementação
