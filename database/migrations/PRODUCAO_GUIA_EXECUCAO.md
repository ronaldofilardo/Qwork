# 🚀 GUIA DE SINCRONIZAÇÃO DO BANCO DE PRODUÇÃO

**Data:** 12/02/2026  
**Objetivo:** Aplicar funcionalidade de confirmação de identidade em produção  
**Banco de Produção:** neondb (Neon.tech - São Paulo)

---

## 📋 PRÉ-REQUISITOS

### 1. Backup de Segurança

```bash
# Conectar ao banco de produção
psql 'postgresql://neondb_owner:REDACTED@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

# Fazer backup da estrutura das tabelas relacionadas
pg_dump -h ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech \
  -U neondb_owner \
  -d neondb \
  --schema-only \
  -t avaliacoes \
  -t funcionarios \
  -f backup_schema_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Verificar Estado Atual

```sql
-- Verificar se a tabela já existe
SELECT EXISTS (
  SELECT FROM pg_tables
  WHERE schemaname = 'public'
  AND tablename = 'confirmacao_identidade'
) as tabela_existe;

-- Deve retornar: false (não existe)
```

### 3. Verificar Tabelas de Dependência

```sql
-- Verificar se as tabelas necessárias existem
SELECT
  'avaliacoes' as tabela,
  COUNT(*) as registros
FROM avaliacoes
UNION ALL
SELECT
  'funcionarios',
  COUNT(*)
FROM funcionarios;

-- Ambas devem existir e ter registros
```

---

## 🎯 EXECUÇÃO DA MIGRAÇÃO

### Passo 1: Conectar ao Banco de Produção

```bash
psql 'postgresql://neondb_owner:REDACTED@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
```

### Passo 2: Executar o Script de Migração

```bash
# Opção A: Executar direto do arquivo
\i database/migrations/PRODUCAO_sync_confirmacao_identidade.sql

# Opção B: Copiar e colar o conteúdo no psql
# (Abrir o arquivo e colar no terminal psql)
```

### Passo 3: Verificar Logs e Mensagens

Você deve ver:

- ✅ `✓ Validação concluída com sucesso`
- ✅ `✓ Tabela confirmacao_identidade criada`
- ✅ `✓ RLS habilitado`
- ✅ `✓ 5 políticas RLS criadas`
- ✅ `MIGRAÇÃO CONCLUÍDA COM SUCESSO!`

---

## ✅ VALIDAÇÃO PÓS-MIGRAÇÃO

### 1. Verificar Estrutura da Tabela

```sql
\d confirmacao_identidade

-- Deve mostrar:
-- - Colunas: id, avaliacao_id, funcionario_cpf, nome_confirmado, etc.
-- - Constraints: PK, FKs, CHECK
-- - Índices: 3 índices criados
```

### 2. Verificar RLS

```sql
-- Listar políticas RLS
SELECT policyname, cmd, roles::text
FROM pg_policies
WHERE tablename = 'confirmacao_identidade'
ORDER BY policyname;

-- Deve retornar 5 políticas:
-- 1. funcionario_view_own_confirmations
-- 2. rh_view_clinic_confirmations
-- 3. gestor_view_entity_confirmations
-- 4. admin_emissor_full_access
-- 5. system_insert_confirmations
```

### 3. Verificar Índices

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'confirmacao_identidade'
ORDER BY indexname;

-- Deve retornar 4 índices:
-- 1. confirmacao_identidade_pkey (PRIMARY KEY)
-- 2. idx_confirmacao_avaliacao_id
-- 3. idx_confirmacao_data
-- 4. idx_confirmacao_funcionario_cpf
```

### 4. Teste de Inserção (Opcional)

```sql
-- Teste rápido (ROLLBACK no final para não poluir)
BEGIN;

-- Pegar um CPF de teste
SELECT cpf FROM funcionarios LIMIT 1;

-- Inserir teste (substitua '12345678901' pelo CPF encontrado)
INSERT INTO confirmacao_identidade (
  funcionario_cpf,
  nome_confirmado,
  cpf_confirmado,
  data_nascimento,
  ip_address,
  user_agent
) VALUES (
  '12345678901',
  'Teste Migração',
  '12345678901',
  '1990-01-01',
  '127.0.0.1',
  'Test-Agent/1.0'
);

-- Verificar inserção
SELECT * FROM confirmacao_identidade;

-- DESFAZER o teste
ROLLBACK;
```

---

## 🔄 ROLLBACK (em caso de erro)

Se algo der errado, execute:

```sql
BEGIN;

-- Remover políticas RLS
DROP POLICY IF EXISTS funcionario_view_own_confirmations ON confirmacao_identidade;
DROP POLICY IF EXISTS rh_view_clinic_confirmations ON confirmacao_identidade;
DROP POLICY IF EXISTS gestor_view_entity_confirmations ON confirmacao_identidade;
DROP POLICY IF EXISTS admin_emissor_full_access ON confirmacao_identidade;
DROP POLICY IF EXISTS system_insert_confirmations ON confirmacao_identidade;

-- Remover tabela
DROP TABLE IF EXISTS confirmacao_identidade CASCADE;

COMMIT;

-- Verificar remoção
SELECT EXISTS (
  SELECT FROM pg_tables
  WHERE schemaname = 'public'
  AND tablename = 'confirmacao_identidade'
) as tabela_ainda_existe;

-- Deve retornar: false
```

---

## 📝 HISTÓRICO DE MIGRAÇÕES

### Contexto do Desenvolvimento (DEV)

1. **Migração 1012** (inicial)
   - Criou tabela `confirmacao_identidade`
   - ❌ Incluía trigger de auditoria com problemas
2. **Migração 1013** (correção)
   - Tornou `avaliacao_id` NULLABLE
   - Permite confirmações no contexto de login (sem avaliação)
3. **Migração 1014** (correção)
   - Removeu trigger problemático de auditoria

### Migração Consolidada para PROD

- **PRODUCAO_sync_confirmacao_identidade.sql**
  - Cria tabela já com correções aplicadas
  - `avaliacao_id` já é NULLABLE
  - SEM trigger problemático
  - Equivalente a executar 1012 + 1013 + 1014 de forma consolidada

---

## 🎯 PRÓXIMOS PASSOS APÓS MIGRAÇÃO

### 1. Deploy do Código

Fazer deploy da aplicação que usa a tabela `confirmacao_identidade`:

- ✅ Endpoints de API para registro de confirmação
- ✅ Componentes frontend de confirmação de identidade
- ✅ Validações de aceite de termos

### 2. Monitoramento

```sql
-- Monitorar inserções
SELECT
  DATE(confirmado_em) as data,
  COUNT(*) as total_confirmacoes
FROM confirmacao_identidade
GROUP BY DATE(confirmado_em)
ORDER BY data DESC;

-- Verificar confirmações recentes
SELECT
  id,
  funcionario_cpf,
  avaliacao_id,
  confirmado_em,
  ip_address
FROM confirmacao_identidade
ORDER BY confirmado_em DESC
LIMIT 10;
```

### 3. Alertas

Configurar alertas para:

- ❌ Tentativas de confirmação com CPF inválido
- ❌ Múltiplas confirmações do mesmo funcionário em curto período
- ❌ Confirmações de IPs suspeitos

---

## 📞 SUPORTE

### Em caso de problemas:

1. **NÃO ENTRE EM PÂNICO** - A migração é transacional
2. Execute o ROLLBACK descrito acima
3. Salve os logs de erro
4. Documente o erro encontrado

### Logs Importantes:

```sql
-- Ver últimas queries executadas
SELECT query, state, wait_event_type
FROM pg_stat_activity
WHERE datname = 'neondb'
AND state != 'idle'
ORDER BY query_start DESC;
```

---

## ✅ CHECKLIST FINAL

Antes de considerar a migração completa:

- [ ] Backup realizado
- [ ] Tabelas de dependência verificadas
- [ ] Script executado sem erros
- [ ] Mensagens de sucesso visualizadas
- [ ] 5 políticas RLS criadas
- [ ] 4 índices criados
- [ ] Teste de inserção realizado (opcional)
- [ ] Deploy do código planejado
- [ ] Monitoramento configurado

---

**Data de Execução:** **_/_**/**\_\_**  
**Executado por:** ********\_********  
**Status:** [ ] Sucesso [ ] Falha [ ] Rollback  
**Observações:**

---

---

---
