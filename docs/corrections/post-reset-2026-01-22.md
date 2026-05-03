# Relatório de Correções Necessárias Pós-Reset do Banco

**Data:** 2026-01-22  
**Status:** 🔴 CRÍTICO - Sistema com estrutura incompatível

## Problemas Identificados

### 1. Tabela `tomadores` - Coluna faltando

- ❌ **Coluna `data_primeiro_pagamento`** não existe
- Esta coluna é referenciada no código mas não está no schema

### 2. Tabela `empresas_clientes` - Estrutura incompatível

- ❌ **Coluna `tomador_id`** não existe
- ✅ Existe **`clinica_id`** ao invés
- **Impacto:** Sistema espera relacionamento direto tomador→empresa, mas schema usa clínica como intermediária

### 3. Tabela `contratacao_personalizada`

- ✅ Criada com sucesso via migration 051
- ✅ Índices corretos

### 4. Tabela `planos`

- ✅ Corrigida - planos fixos 1, 2, 3 criados
- ✅ Plano padrão ID 4 existe

### 5. Tabela `entidades_senhas`

- ✅ Estrutura correta
- ✅ Coluna `primeira_senha_alterada` existe (não `primeiro_acesso`)
- ✅ Requer `tomador_id` (FK)

## Fluxo Real vs Esperado

### Fluxo Esperado pelo Código

```
tomador → Empresas Clientes → Funcionários → Avaliações
```

### Fluxo Real do Banco

```
tomador → Clínica → Empresas Clientes → Funcionários → Avaliações
```

## Correções Necessárias

### Opção 1: Adicionar coluna `data_primeiro_pagamento`

```sql
ALTER TABLE tomadores
ADD COLUMN data_primeiro_pagamento TIMESTAMP;
```

### Opção 2: Criar tabela `clinicas` para cada tomador

Para cada tomador tipo "entidade", criar uma clínica correspondente:

```sql
-- Para tomadores existentes sem clínica
INSERT INTO clinicas (
    nome, cnpj, email, telefone, cidade, estado,
    tomador_id, ativa, criado_em
)
SELECT
    c.nome,
    c.cnpj,
    c.email,
    c.telefone,
    c.cidade,
    c.estado,
    c.id,
    c.ativa,
    c.criado_em
FROM tomadores c
WHERE c.tipo = 'entidade'
AND NOT EXISTS (
    SELECT 1 FROM clinicas cl WHERE cl.tomador_id = c.id
);
```

### Opção 3: Adicionar compatibilidade em `empresas_clientes`

```sql
-- Adicionar coluna legado
ALTER TABLE empresas_clientes
ADD COLUMN tomador_id INTEGER REFERENCES tomadores(id);

-- Criar índice
CREATE INDEX idx_empresas_tomador
ON empresas_clientes(tomador_id);

-- Permitir empresas sem clínica mas com tomador direto
ALTER TABLE empresas_clientes
ALTER COLUMN clinica_id DROP NOT NULL;
```

## Decisão Recomendada

**Opção 2 + 1** é a mais segura:

1. Criar clínicas automáticas para tomadores tipo "entidade"
2. Adicionar `data_primeiro_pagamento` em tomadores
3. Manter a estrutura atual que usa clínicas como intermediárias

## Script de Correção Proposto

Ver: `database/fixes/fix-post-reset-complete.sql`

## Impacto no Código

Arquivos que precisam ser revisados:

- `scripts/tests/test-flow-simple.ps1` - Ajustar para criar clínica antes de empresa
- Todas as APIs que criam `empresas_clientes` diretamente
- Fluxo de cadastro de entidades

## Próximos Passos

1. ✅ Executar migration para adicionar `data_primeiro_pagamento`
2. ✅ Criar clínicas para tomadores existentes
3. ⏳ Testar fluxo completo novamente
4. ⏳ Atualizar testes automatizados
5. ⏳ Documentar nova arquitetura

---

**Observação:** O banco foi resetado recentemente e o schema atual reflete uma arquitetura mais madura (com clínicas intermediárias) que o código de testes não acompanhou.
