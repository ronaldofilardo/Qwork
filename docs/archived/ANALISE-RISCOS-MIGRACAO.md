# ⚠️ Análise de Riscos - Migração Fases 1 e 2

**Data:** 29 de janeiro de 2026  
**Migrations:** 200 e 201  
**Nível de Risco Geral:** 🟡 **MÉDIO**

---

## 🔍 Cenários de Risco Identificados

### 1. ⚠️ RISCO MÉDIO - Mapeamento Ambíguo de Tipos

**Migration Afetada:** 200 (Fase 1)

**Código da Migration:**

```sql
UPDATE funcionarios SET usuario_tipo =
  CASE perfil
    WHEN 'funcionario' THEN
      CASE
        WHEN contratante_id IS NOT NULL AND (empresa_id IS NULL AND clinica_id IS NULL)
          THEN 'funcionario_entidade'::usuario_tipo_enum
        ELSE 'funcionario_clinica'::usuario_tipo_enum
      END
    ...
  END
WHERE usuario_tipo IS NULL;
```

**Problema:**
Funcionários com dados **inconsistentes** podem ser mapeados incorretamente:

| Situação   | contratante_id | empresa_id | clinica_id | Mapeado Como            | Correto?        |
| ---------- | -------------- | ---------- | ---------- | ----------------------- | --------------- |
| Caso 1     | NULL           | 5          | 2          | funcionario_clinica     | ✅ Correto      |
| Caso 2     | 10             | NULL       | NULL       | funcionario_entidade    | ✅ Correto      |
| **Caso 3** | **10**         | **5**      | **2**      | **funcionario_clinica** | ❌ **AMBÍGUO**  |
| **Caso 4** | **10**         | **NULL**   | **2**      | **funcionario_clinica** | ❌ **AMBÍGUO**  |
| Caso 5     | NULL           | NULL       | NULL       | funcionario_clinica     | ❌ **INVÁLIDO** |

**Impacto:**

- Funcionários podem ficar visíveis para gestor errado
- Dados não serão **perdidos**, mas podem ficar **inacessíveis** temporariamente

**Mitigação:**

```sql
-- EXECUTAR ANTES da Migration 200 para identificar casos ambíguos
SELECT
  cpf, nome, perfil,
  contratante_id, empresa_id, clinica_id,
  CASE
    WHEN contratante_id IS NOT NULL AND (empresa_id IS NOT NULL OR clinica_id IS NOT NULL)
      THEN 'AMBIGUO - tem contratante_id E (empresa/clinica)'
    WHEN contratante_id IS NULL AND empresa_id IS NULL AND clinica_id IS NULL
      THEN 'INVALIDO - sem nenhum vinculo'
    ELSE 'OK'
  END as status
FROM funcionarios
WHERE perfil = 'funcionario'
  AND (
    -- Ambíguos
    (contratante_id IS NOT NULL AND (empresa_id IS NOT NULL OR clinica_id IS NOT NULL))
    OR
    -- Inválidos
    (contratante_id IS NULL AND empresa_id IS NULL AND clinica_id IS NULL)
  );
```

**Solução:**

```sql
-- Limpar dados ambíguos ANTES da migration
-- Opção 1: Priorizar contratante_id (funcionário de entidade)
UPDATE funcionarios
SET empresa_id = NULL, clinica_id = NULL
WHERE perfil = 'funcionario'
  AND contratante_id IS NOT NULL
  AND (empresa_id IS NOT NULL OR clinica_id IS NOT NULL);

-- Opção 2: Priorizar clinica_id (funcionário de clínica)
UPDATE funcionarios
SET contratante_id = NULL
WHERE perfil = 'funcionario'
  AND clinica_id IS NOT NULL
  AND contratante_id IS NOT NULL;

-- Corrigir funcionários sem vínculo (atribuir a clínica padrão)
UPDATE funcionarios f
SET clinica_id = (SELECT id FROM clinicas LIMIT 1)
WHERE perfil = 'funcionario'
  AND contratante_id IS NULL
  AND empresa_id IS NULL
  AND clinica_id IS NULL;
```

---

### 2. 🔴 RISCO ALTO - Gestores de Entidade Duplicados

**Migration Afetada:** 200 (Fase 1)

**Problema:**
Alguns gestores de entidade podem estar **duplicados**:

- Em `funcionarios` com `perfil='gestor'`
- Em `entidades_senhas`

**Verificação:**

```sql
-- Identificar gestores duplicados
SELECT
  f.cpf,
  f.nome,
  f.perfil,
  f.contratante_id as func_contratante_id,
  cs.contratante_id as senha_contratante_id,
  CASE
    WHEN f.contratante_id = cs.contratante_id THEN 'MESMO CONTRATANTE'
    ELSE 'CONTRATANTES DIFERENTES!'
  END as status
FROM funcionarios f
INNER JOIN entidades_senhas cs ON cs.cpf = f.cpf
WHERE f.perfil = 'gestor';
```

**Impacto:**

- ❌ **PERDA DE ACESSO:** Gestor pode não conseguir logar se senha está em `entidades_senhas`
- ❌ **DADOS ÓRFÃOS:** Atualizações em `funcionarios` não refletem em `entidades_senhas`

**Solução:**

```sql
-- EXECUTAR ANTES da Migration 200
BEGIN;

-- 1. Identificar qual registro é o "principal"
CREATE TEMP TABLE gestores_para_manter AS
SELECT DISTINCT ON (cpf)
  cpf,
  COALESCE(f.contratante_id, cs.contratante_id) as contratante_id,
  COALESCE(f.senha_hash, cs.senha_hash) as senha_hash,
  f.id as funcionario_id
FROM funcionarios f
FULL OUTER JOIN entidades_senhas cs ON cs.cpf = f.cpf
WHERE f.perfil = 'gestor' OR cs.cpf IS NOT NULL
ORDER BY cpf, f.id NULLS LAST;

-- 2. Atualizar funcionarios com senha correta
UPDATE funcionarios f
SET
  senha_hash = g.senha_hash,
  contratante_id = g.contratante_id
FROM gestores_para_manter g
WHERE f.cpf = g.cpf
  AND f.perfil = 'gestor';

-- 3. Remover entradas de entidades_senhas para gestores que estão em funcionarios
DELETE FROM entidades_senhas cs
WHERE EXISTS (
  SELECT 1 FROM funcionarios f
  WHERE f.cpf = cs.cpf
  AND f.perfil = 'gestor'
);

COMMIT;
```

---

### 3. 🟡 RISCO MÉDIO - Constraint Viola Dados Existentes

**Migration Afetada:** 200 (Fase 1)

**Problema:**
Constraint `funcionarios_usuario_tipo_exclusivo` pode **REJEITAR** dados existentes:

```sql
ALTER TABLE funcionarios ADD CONSTRAINT funcionarios_usuario_tipo_exclusivo CHECK (
  (usuario_tipo = 'funcionario_clinica'
   AND empresa_id IS NOT NULL
   AND clinica_id IS NOT NULL
   AND contratante_id IS NULL)
  OR ...
);
```

**Impacto:**

- Migration **FALHA** se houver dados que violam a constraint
- Transação é revertida (ROLLBACK)
- **NENHUM dado é perdido**, mas migration não é aplicada

**Verificação:**

```sql
-- Simular constraint para verificar violações
SELECT
  cpf, nome, usuario_tipo,
  empresa_id, clinica_id, contratante_id,
  CASE
    WHEN usuario_tipo = 'funcionario_clinica'
      AND (empresa_id IS NULL OR clinica_id IS NULL OR contratante_id IS NOT NULL)
      THEN 'VIOLA: funcionario_clinica precisa empresa_id + clinica_id'

    WHEN usuario_tipo = 'funcionario_entidade'
      AND (contratante_id IS NULL OR empresa_id IS NOT NULL OR clinica_id IS NOT NULL)
      THEN 'VIOLA: funcionario_entidade precisa apenas contratante_id'

    WHEN usuario_tipo = 'rh'
      AND (clinica_id IS NULL OR contratante_id IS NOT NULL)
      THEN 'VIOLA: rh precisa apenas clinica_id'

    WHEN usuario_tipo = 'gestor'
      AND (contratante_id IS NULL OR clinica_id IS NOT NULL OR empresa_id IS NOT NULL)
      THEN 'VIOLA: gestor precisa apenas contratante_id'

    WHEN usuario_tipo IN ('admin', 'emissor')
      AND (clinica_id IS NOT NULL OR contratante_id IS NOT NULL OR empresa_id IS NOT NULL)
      THEN 'VIOLA: admin/emissor nao pode ter vinculos'

    ELSE 'OK'
  END as resultado
FROM funcionarios
WHERE usuario_tipo IS NOT NULL;
```

**Solução:**
Executar script de correção **ANTES** da migration:

```sql
-- Corrigir funcionarios_clinica
UPDATE funcionarios
SET contratante_id = NULL
WHERE usuario_tipo = 'funcionario_clinica'
  AND contratante_id IS NOT NULL;

-- Corrigir funcionarios_entidade
UPDATE funcionarios
SET empresa_id = NULL, clinica_id = NULL
WHERE usuario_tipo = 'funcionario_entidade'
  AND (empresa_id IS NOT NULL OR clinica_id IS NOT NULL);

-- Corrigir gestores_rh
UPDATE funcionarios
SET contratante_id = NULL, empresa_id = NULL
WHERE usuario_tipo = 'rh'
  AND (contratante_id IS NOT NULL OR empresa_id IS NOT NULL);

-- Corrigir gestores_entidade
UPDATE funcionarios
SET clinica_id = NULL, empresa_id = NULL
WHERE usuario_tipo = 'gestor'
  AND (clinica_id IS NOT NULL OR empresa_id IS NOT NULL);

-- Corrigir admin/emissor
UPDATE funcionarios
SET clinica_id = NULL, contratante_id = NULL, empresa_id = NULL
WHERE usuario_tipo IN ('admin', 'emissor')
  AND (clinica_id IS NOT NULL OR contratante_id IS NOT NULL OR empresa_id IS NOT NULL);
```

---

### 4. 🟢 RISCO BAIXO - Políticas RLS Bloqueiam Acesso Temporário

**Migration Afetada:** 201 (Fase 2)

**Problema:**
Durante aplicação da migration 201, políticas RLS são **removidas e recriadas**:

- Janela de ~500ms onde **NÃO há políticas ativas**
- Queries podem falhar ou retornar vazio

**Impacto:**

- Usuários logados podem ver erro "Sem permissão"
- Duração: < 1 segundo
- **Nenhum dado é perdido**

**Mitigação:**

```sql
-- Opção 1: Desabilitar RLS temporariamente
ALTER TABLE funcionarios DISABLE ROW LEVEL SECURITY;
-- [aplicar migration 201]
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;

-- Opção 2: Aplicar em janela de manutenção
-- Agendar para horário de baixo uso (ex: 3h da manhã)
```

---

### 5. 🟡 RISCO MÉDIO - Tabela contratantes_funcionarios com Duplicatas

**Migration Afetada:** 201 (Fase 2)

**Código:**

```sql
-- Popular para funcionários de clínica via clinica→contratante
INSERT INTO contratantes_funcionarios (funcionario_id, contratante_id, tipo_contratante, vinculo_ativo)
SELECT
  f.id, c.id, c.tipo, f.ativo
FROM funcionarios f
JOIN clinicas cl ON cl.id = f.clinica_id
JOIN contratantes c ON c.id = cl.contratante_id
WHERE f.usuario_tipo = 'funcionario_clinica'
  AND NOT EXISTS (...);
```

**Problema:**
Se tabela `contratantes_funcionarios` já tiver dados, pode haver:

- Duplicatas se `NOT EXISTS` falhar
- Vínculos órfãos de dados antigos

**Verificação:**

```sql
-- Verificar duplicatas
SELECT
  funcionario_id, contratante_id, COUNT(*)
FROM contratantes_funcionarios
GROUP BY funcionario_id, contratante_id
HAVING COUNT(*) > 1;
```

**Solução:**

```sql
-- Limpar tabela ANTES da migration 201
TRUNCATE TABLE contratantes_funcionarios CASCADE;

-- OU adicionar constraint única
ALTER TABLE contratantes_funcionarios
  ADD CONSTRAINT uk_funcionario_contratante
  UNIQUE (funcionario_id, contratante_id);
```

---

### 6. 🟢 RISCO BAIXO - Coluna perfil Obsoleta

**Problema:**
Após migração, sistema terá **DUAS colunas**:

- `perfil` (antiga, tipo VARCHAR)
- `usuario_tipo` (nova, tipo ENUM)

**Impacto:**

- Código antigo pode continuar usando `perfil`
- Inconsistência se `perfil` for atualizado mas `usuario_tipo` não

**Solução:**
Remover coluna `perfil` em migration futura (após validação):

```sql
-- Migration 202 (Futura)
ALTER TABLE funcionarios DROP COLUMN perfil;
```

---

## 📊 Resumo de Riscos

| Risco                   | Severidade | Dados Perdidos?   | Mitigação                        |
| ----------------------- | ---------- | ----------------- | -------------------------------- |
| Mapeamento ambíguo      | 🟡 Médio   | ❌ Não            | Script de limpeza pré-migration  |
| Gestores duplicados     | 🔴 Alto    | ⚠️ Possível       | Consolidar antes da migration    |
| Constraint viola dados  | 🟡 Médio   | ❌ Não (ROLLBACK) | Script de correção pré-migration |
| RLS temporariamente off | 🟢 Baixo   | ❌ Não            | Aplicar em manutenção            |
| Duplicatas em tabela    | 🟡 Médio   | ❌ Não            | TRUNCATE ou UNIQUE constraint    |
| Coluna obsoleta         | 🟢 Baixo   | ❌ Não            | Remover em migration futura      |

---

## ✅ Checklist Pré-Migration

Execute estes scripts **ANTES** de aplicar as migrations:

### 1. Backup Obrigatório

```bash
pg_dump -U postgres -d seu_banco > backup_pre_migracao_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Script de Validação

```sql
-- Salvar como: scripts/pre-migration-validation.sql

\echo '=== VALIDAÇÃO PRÉ-MIGRAÇÃO ==='
\echo ''

-- 1. Funcionários ambíguos
\echo '1. Verificando funcionários com vínculos ambíguos...'
SELECT COUNT(*) as total_ambiguos
FROM funcionarios
WHERE perfil = 'funcionario'
  AND contratante_id IS NOT NULL
  AND (empresa_id IS NOT NULL OR clinica_id IS NOT NULL);

-- 2. Funcionários sem vínculo
\echo '2. Verificando funcionários sem vínculo...'
SELECT COUNT(*) as total_sem_vinculo
FROM funcionarios
WHERE perfil = 'funcionario'
  AND contratante_id IS NULL
  AND empresa_id IS NULL
  AND clinica_id IS NULL;

-- 3. Gestores duplicados
\echo '3. Verificando gestores duplicados...'
SELECT COUNT(*) as total_duplicados
FROM funcionarios f
INNER JOIN entidades_senhas cs ON cs.cpf = f.cpf
WHERE f.perfil = 'gestor';

-- 4. Entradas em contratantes_funcionarios
\echo '4. Verificando contratantes_funcionarios...'
SELECT COUNT(*) as total_vinculos FROM contratantes_funcionarios;

\echo ''
\echo '=== FIM DA VALIDAÇÃO ==='
```

### 3. Script de Correção

```sql
-- Salvar como: scripts/pre-migration-fixes.sql

BEGIN;

\echo '=== CORREÇÕES PRÉ-MIGRAÇÃO ==='

-- 1. Resolver ambiguidade priorizando contratante_id
UPDATE funcionarios
SET empresa_id = NULL, clinica_id = NULL
WHERE perfil = 'funcionario'
  AND contratante_id IS NOT NULL
  AND (empresa_id IS NOT NULL OR clinica_id IS NOT NULL);

-- 2. Atribuir clínica padrão para funcionários órfãos
UPDATE funcionarios f
SET clinica_id = (SELECT id FROM clinicas ORDER BY id LIMIT 1)
WHERE perfil = 'funcionario'
  AND contratante_id IS NULL
  AND empresa_id IS NULL
  AND clinica_id IS NULL;

-- 3. Consolidar gestores de entidade
DELETE FROM entidades_senhas cs
WHERE EXISTS (
  SELECT 1 FROM funcionarios f
  WHERE f.cpf = cs.cpf
  AND f.perfil = 'gestor'
);

-- 4. Limpar contratantes_funcionarios
TRUNCATE TABLE contratantes_funcionarios CASCADE;

COMMIT;

\echo '=== CORREÇÕES APLICADAS ==='
```

### 4. Executar Validação e Correção

```bash
# 1. Validar
psql -U postgres -d seu_banco -f scripts/pre-migration-validation.sql

# 2. Se houver problemas, corrigir
psql -U postgres -d seu_banco -f scripts/pre-migration-fixes.sql

# 3. Validar novamente
psql -U postgres -d seu_banco -f scripts/pre-migration-validation.sql

# 4. Aplicar migrations
.\scripts\apply-fase-1-2-migrations.ps1
```

---

## 🚨 Plano de Rollback

Se algo der errado **DURANTE** a aplicação:

```sql
-- 1. Restaurar do backup
psql -U postgres -d seu_banco < backup_pre_migracao_YYYYMMDD_HHMMSS.sql

-- 2. OU reverter manualmente (se backup não disponível)
BEGIN;

-- Reverter Migration 201
DROP TRIGGER IF EXISTS trg_sync_contratantes_funcionarios ON funcionarios;
DROP FUNCTION IF EXISTS sync_contratantes_funcionarios();
DROP FUNCTION IF EXISTS current_user_tipo();
-- [recriar políticas RLS antigas]

-- Reverter Migration 200
ALTER TABLE funcionarios DROP COLUMN IF EXISTS usuario_tipo;
DROP TYPE IF EXISTS usuario_tipo_enum CASCADE;
-- [recriar constraints antigas]

COMMIT;
```

---

## 📞 Suporte em Caso de Problemas

**Durante a migration:**

1. ❌ **NÃO INTERROMPA** a transação (pode corromper dados)
2. ✅ Aguarde erro ou conclusão
3. ✅ Se houver erro, o PostgreSQL faz ROLLBACK automático

**Após migration com problemas:**

1. Verificar logs: `C:\apps\QWork\logs\migration-*.log`
2. Executar script de validação pós-migration
3. Restaurar backup se necessário
4. Contatar equipe de desenvolvimento

---

**Conclusão:**

- ✅ **Nenhum dado será PERDIDO** se seguir checklist
- ⚠️ Dados podem ficar **inacessíveis temporariamente** se houver ambiguidade
- 🔒 Backup é **OBRIGATÓRIO** antes de aplicar

**Última atualização:** 29 de janeiro de 2026
