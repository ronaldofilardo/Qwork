# Correção: Erro ao Liberar Lote - "Laudo não pode ser marcado como emitido sem hash_pdf"

## 📋 Resumo

**Erro**: Ao tentar liberar um lote (RH ou Entidade), o sistema retorna:
```
Laudo 1002 não pode ser marcado como emitido sem hash_pdf (violação de imutabilidade)
```

**Causa**: A trigger `fn_reservar_id_laudo_on_lote_insert()` cria automaticamente um laudo ao liberar lote, mas não especificava `status='rascunho'`, fazendo o banco usar o DEFAULT `status='emitido'`, que exige `hash_pdf`.

**Solução**: Migration 1004 corrige a função para explicitamente usar `status='rascunho'`.

---

## 🔍 Análise Detalhada

### Stack Trace do Erro
```
PL/pgSQL function fn_validar_laudo_emitido() line 5 at RAISE
SQL statement "INSERT INTO laudos (id, lote_id)
               VALUES (NEW.id, NEW.id)
               ON CONFLICT (id) DO NOTHING"
PL/pgSQL function fn_reservar_id_laudo_on_lote_insert() line 4 at SQL statement
```

### Fluxo do Problema

1. **Usuário libera lote** → `INSERT INTO lotes_avaliacao` 
2. **Trigger dispara** → `trg_reservar_id_laudo_on_lote_insert`
3. **Função executa** → `fn_reservar_id_laudo_on_lote_insert()`
   ```sql
   -- Migration 1003 (versão com bug)
   INSERT INTO laudos (id, lote_id)
   VALUES (NEW.id, NEW.id)
   -- ❌ Não especifica status, usa DEFAULT 'emitido'
   ```
4. **Trigger de validação** → `fn_validar_laudo_emitido()` (BEFORE INSERT)
   ```sql
   -- Valida: se status='emitido' ENTÃO deve ter hash_pdf
   IF NEW.status = 'emitido' AND NEW.hash_pdf IS NULL THEN
     RAISE EXCEPTION 'Laudo % não pode ser marcado como emitido sem hash_pdf';
   END IF;
   ```
5. **Erro disparado** → Sistema falha ao criar lote

### Tabela `laudos` - Estrutura Relevante
```sql
CREATE TABLE laudos (
  id integer NOT NULL,
  lote_id integer NOT NULL,
  status varchar(20) DEFAULT 'emitido',  -- ❌ DEFAULT problemático
  hash_pdf varchar(64),                  -- NULL ao criar
  emissor_cpf char(11),                  -- NULL ao criar
  emitido_em timestamp,                  -- NULL ao criar
  
  -- Constraint que valida imutabilidade
  CONSTRAINT chk_laudos_hash_when_emitido CHECK (
    (status = 'emitido' AND hash_pdf IS NOT NULL AND hash_pdf <> '') 
    OR status <> 'emitido'
  )
);
```

### Constraint vs Trigger

| Componente | O que Valida | Quando Dispara |
|------------|--------------|----------------|
| **Constraint** `chk_laudos_hash_when_emitido` | Hash presente se status='emitido' | INSERT/UPDATE (após trigger) |
| **Trigger** `fn_validar_laudo_emitido` | Hash + emissor + data se status='emitido' | BEFORE INSERT/UPDATE |

A trigger dispara **antes** da constraint, então o erro vem da trigger.

---

## ✅ Solução Implementada

### Migration 1004

**Arquivo**: `database/migrations/1004_fix_fn_reservar_laudo_status_rascunho.sql`

```sql
CREATE OR REPLACE FUNCTION fn_reservar_id_laudo_on_lote_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- ✅ Especifica explicitamente status='rascunho'
  INSERT INTO laudos (id, lote_id, status)
  VALUES (NEW.id, NEW.id, 'rascunho')
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Benefícios**:
- ✅ `status='rascunho'` não exige `hash_pdf`
- ✅ Trigger de validação permite criação
- ✅ Laudo criado em estado intermediário seguro
- ✅ Emissão posterior adiciona hash/data

---

## 🚀 Como Aplicar em Produção

### Opção 1: Via Script Node.js

```bash
# 1. Obter DATABASE_URL do painel Vercel
# Settings → Environment Variables → DATABASE_URL

# 2. Executar script (na raiz do projeto)
DATABASE_URL="postgresql://user:pass@host.neon.tech/db?sslmode=require" \
  node scripts/apply-migration-1004.cjs
```

**Output esperado**:
```
🔌 Conectando ao banco de produção...
✅ Conectado ao banco de produção
📄 Lendo migration 1004...
🚀 Aplicando migration...
✅ Migration 1004 aplicada com sucesso!
🔍 Verificando função atualizada...
✅ Função encontrada e atualizada
✅ Função agora especifica status='rascunho'
👋 Conexão fechada
```

### Opção 2: Via Neon Console

1. Acessar [Neon Console](https://console.neon.tech/)
2. Selecionar projeto → SQL Editor
3. Copiar conteúdo de `database/migrations/1004_fix_fn_reservar_laudo_status_rascunho.sql`
4. Executar SQL
5. Verificar:
   ```sql
   SELECT pg_get_functiondef(oid) as definition
   FROM pg_proc
   WHERE proname = 'fn_reservar_id_laudo_on_lote_insert';
   ```

### Opção 3: Via psql

```bash
# 1. Conectar ao banco
psql "postgresql://user:pass@host.neon.tech/db?sslmode=require"

# 2. Executar migration
\i database/migrations/1004_fix_fn_reservar_laudo_status_rascunho.sql

# 3. Verificar
\df fn_reservar_id_laudo_on_lote_insert
```

---

## 🧪 Teste Pós-Aplicação

### 1. Verificar Função Atualizada

```sql
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'fn_reservar_id_laudo_on_lote_insert';
```

**Deve conter**:
```sql
INSERT INTO laudos (id, lote_id, status)
VALUES (NEW.id, NEW.id, 'rascunho')  -- ✅ status explícito
```

### 2. Testar Liberação de Lote

1. Acessar sistema como RH/Gestor
2. Tentar liberar lote para empresa/entidade
3. **Esperado**: Lote criado com sucesso
4. Verificar:
   ```sql
   SELECT l.id, l.lote_id, l.status, l.hash_pdf, l.criado_em
   FROM laudos l
   ORDER BY l.id DESC LIMIT 5;
   ```
   
**Output esperado**:
```
 id  | lote_id |  status  | hash_pdf | criado_em
-----+---------+----------+----------+------------------------
1003 | 1003    | rascunho | NULL     | 2026-02-10 14:30:00
1002 | 1002    | rascunho | NULL     | 2026-02-10 14:25:00
```

---

## 📝 Histórico de Migrations Relacionadas

| Migration | Data | O que Fez | Problema |
|-----------|------|-----------|----------|
| **086** | 2026-01-28 | Tentou inserir status='rascunho' com emissor_cpf | Colunas podem não existir |
| **1003** | 2026-02-04 | Simplificou para `(id, lote_id)` apenas | ❌ Deixou status usar DEFAULT 'emitido' |
| **1004** | 2026-02-10 | Especifica `status='rascunho'` explicitamente | ✅ Corrige o problema |

---

## 🛡️ Prevenção de Problemas Futuros

### Recomendação 1: Alterar DEFAULT do Status

**Problema**: DEFAULT status='emitido' é perigoso para criação automática

**Sugestão**:
```sql
ALTER TABLE laudos 
  ALTER COLUMN status SET DEFAULT 'rascunho';
```

**Benefícios**:
- ✅ Cria laudos em estado seguro por padrão
- ✅ Exige transição explícita para 'emitido'
- ✅ Reduz risco de violações

### Recomendação 2: Revisar Outras Triggers

Verificar se outras triggers criam registros com DEFAULT perigoso:
```sql
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND action_statement LIKE '%INSERT%'
ORDER BY event_object_table;
```

---

## 📊 Impacto

- **Afeta**: Liberação de lotes (RH e Entidades)
- **Urgência**: 🔴 Alta - Impede criação de novos lotes
- **Risco da Correção**: 🟢 Baixo - Apenas ajusta status
- **Rollback**: Disponível no arquivo da migration

---

## 🔗 Referências

- **Migration**: `database/migrations/1004_fix_fn_reservar_laudo_status_rascunho.sql`
- **Script**: `scripts/apply-migration-1004.cjs`
- **Commit**: 528b17c
- **Funções Envolvidas**:
  - `fn_reservar_id_laudo_on_lote_insert()` - Cria laudo automaticamente
  - `fn_validar_laudo_emitido()` - Valida imutabilidade
- **Triggers**:
  - `trg_reservar_id_laudo_on_lote_insert` - AFTER INSERT em lotes_avaliacao
  - `trg_validar_laudo_emitido` - BEFORE INSERT/UPDATE em laudos
