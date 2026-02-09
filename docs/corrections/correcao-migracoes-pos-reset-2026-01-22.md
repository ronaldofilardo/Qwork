# Correção de Migrações Pós-Reset do Banco de Dados

**Data:** 22 de Janeiro de 2026  
**Banco:** nr-bps_db  
**Script:** [database/fixes/fix-missing-migrations-post-reset.sql](../../database/fixes/fix-missing-migrations-post-reset.sql)

## Problema

Após reset completo do banco de dados, várias tabelas e colunas críticas estavam faltando, causando erros 500 nas APIs:

### Erros Identificados

1. ❌ **Coluna `hash_pdf` ausente** em `lotes_avaliacao` e `laudos`
   - Erro: `coluna l.hash_pdf não existe`
   - Afetava: `/api/entidade/lotes`

2. ❌ **Tabela `planos` não existia**
   - Erro: `relação "planos" não existe`
   - Afetava: `/api/planos`

3. ❌ **Tabela `entidades_senhas` não existia**
   - Erro: `relação "entidades_senhas" não existe`
   - Afetava: `/api/auth/login`

4. ❌ **Tabelas `mfa_codes` e `contratos_planos` ausentes**
   - Sistema de MFA e contratos não funcional

5. ⚠️ **tomador tipo 'entidade' não encontrado**
   - Erro: `tomador 1 não encontrado ou não é entidade`
   - Afetava: Todas as rotas `/api/entidade/*`

## Solução Aplicada

### Script de Correção

Criado: `database/fixes/fix-missing-migrations-post-reset.sql`

### Correções Implementadas

#### 1. Coluna `hash_pdf`

```sql
ALTER TABLE lotes_avaliacao ADD COLUMN hash_pdf VARCHAR(64);
ALTER TABLE laudos ADD COLUMN hash_pdf VARCHAR(64);
```

#### 2. Tabela `entidades_senhas`

```sql
CREATE TABLE entidades_senhas (
    id SERIAL PRIMARY KEY,
    tomador_id INTEGER NOT NULL,
    cpf VARCHAR(11) NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL,
    primeira_senha_alterada BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. Sistema de Planos

```sql
CREATE TYPE tipo_plano AS ENUM ('personalizado', 'fixo');

CREATE TABLE planos (
    id SERIAL PRIMARY KEY,
    tipo tipo_plano NOT NULL,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    valor_por_funcionario DECIMAL(10,2),
    preco DECIMAL(10,2),
    limite_funcionarios INTEGER,
    ativo BOOLEAN DEFAULT TRUE
);

CREATE TABLE contratos_planos (
    id SERIAL PRIMARY KEY,
    plano_id INTEGER REFERENCES planos(id),
    clinica_id INTEGER REFERENCES clinicas(id),
    tomador_id INTEGER REFERENCES tomadores(id),
    tipo_tomador VARCHAR(20) NOT NULL,
    valor_personalizado_por_funcionario DECIMAL(10,2),
    inicio_vigencia DATE NOT NULL,
    fim_vigencia DATE,
    ativo BOOLEAN DEFAULT TRUE
);
```

#### 4. Tabela MFA

```sql
CREATE TABLE mfa_codes (
    id SERIAL PRIMARY KEY,
    cpf VARCHAR(11) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 5. Dados Iniciais

**Planos padrão:**

- Plano Fixo Básico: R$ 1.224,00 (até 50 funcionários)
- Plano Fixo Premium: R$ 3.999,99 (até 200 funcionários)

**tomador entidade para testes:**

- ID: 1
- Tipo: entidade
- CPF: 00000000000
- Senha: 123456 (hash bcrypt)

## Resultado

### ✅ Tabelas Criadas/Corrigidas

- ✓ `lotes_avaliacao.hash_pdf`
- ✓ `laudos.hash_pdf`
- ✓ `entidades_senhas`
- ✓ `planos`
- ✓ `contratos_planos`
- ✓ `mfa_codes`

### ✅ Dados Inseridos

- ✓ 2 planos cadastrados
- ✓ 1 tomador tipo entidade
- ✓ 1 senha de tomador

## Como Aplicar (Se Necessário no Futuro)

```powershell
# Aplicar correções
$env:PGPASSWORD='123456'
psql -U postgres -d nr-bps_db -f "C:\apps\QWork\database\fixes\fix-missing-migrations-post-reset.sql"
```

## Validação

```sql
-- Verificar tabelas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('planos', 'contratos_planos', 'entidades_senhas', 'mfa_codes');

-- Verificar colunas hash_pdf
SELECT table_name, column_name
FROM information_schema.columns
WHERE column_name = 'hash_pdf';

-- Verificar dados
SELECT COUNT(*) FROM planos;
SELECT COUNT(*) FROM tomadores WHERE tipo = 'entidade';
SELECT COUNT(*) FROM entidades_senhas;
```

## Lições Aprendidas

1. **Schema Completo:** O arquivo `database/schema-complete.sql` deve ser a fonte única da verdade para a estrutura do banco

2. **Migrações Sequenciais:** Organizar migrações em `database/migrations/` com numeração sequencial

3. **Validação Pós-Reset:** Sempre validar estrutura completa após reset do banco

4. **Dados de Teste:** Incluir dados mínimos necessários para testes (entidades, planos, senhas)

## Referências

- Script aplicado: [database/fixes/fix-missing-migrations-post-reset.sql](../../database/fixes/fix-missing-migrations-post-reset.sql)
- Schema completo: [database/schema-complete.sql](../../database/schema-complete.sql)
- Migrações: [database/migrations/](../../database/migrations/)

## Status Final

🟢 **RESOLVIDO** - Todas as migrações foram aplicadas com sucesso. O servidor pode ser reiniciado sem erros.
