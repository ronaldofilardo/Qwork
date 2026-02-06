# Relatório de Correções Necessárias Pós-Reset do Banco

**Data:** 2026-01-22  
**Status:** 🔴 CRÍTICO - Sistema com estrutura incompatível

## Problemas Identificados

### 1. Tabela `contratantes` - Coluna faltando

- ❌ **Coluna `data_primeiro_pagamento`** não existe
- Esta coluna é referenciada no código mas não está no schema

### 2. Tabela `empresas_clientes` - Estrutura incompatível

- ❌ **Coluna `contratante_id`** não existe
- ✅ Existe **`clinica_id`** ao invés
- **Impacto:** Sistema espera relacionamento direto contratante→empresa, mas schema usa clínica como intermediária

### 3. Tabela `contratacao_personalizada`

- ✅ Criada com sucesso via migration 051
- ✅ Índices corretos

### 4. Tabela `planos`

- ✅ Corrigida - planos fixos 1, 2, 3 criados
- ✅ Plano personalizado ID 4 existe

### 5. Tabela `entidades_senhas`

- ✅ Estrutura correta
- ✅ Coluna `primeira_senha_alterada` existe (não `primeiro_acesso`)
- ✅ Requer `contratante_id` (FK)

## Fluxo Real vs Esperado

### Fluxo Esperado pelo Código

```
Contratante → Empresas Clientes → Funcionários → Avaliações
```

### Fluxo Real do Banco

```
Contratante → Clínica → Empresas Clientes → Funcionários → Avaliações
```

## Correções Necessárias

### Opção 1: Adicionar coluna `data_primeiro_pagamento`

```sql
ALTER TABLE contratantes
ADD COLUMN data_primeiro_pagamento TIMESTAMP;
```

### Opção 2: Criar tabela `clinicas` para cada contratante

Para cada contratante tipo "entidade", criar uma clínica correspondente:

```sql
-- Para contratantes existentes sem clínica
INSERT INTO clinicas (
    nome, cnpj, email, telefone, cidade, estado,
    contratante_id, ativa, criado_em
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
FROM contratantes c
WHERE c.tipo = 'entidade'
AND NOT EXISTS (
    SELECT 1 FROM clinicas cl WHERE cl.contratante_id = c.id
);
```

### Opção 3: Adicionar compatibilidade em `empresas_clientes`

```sql
-- Adicionar coluna legado
ALTER TABLE empresas_clientes
ADD COLUMN contratante_id INTEGER REFERENCES contratantes(id);

-- Criar índice
CREATE INDEX idx_empresas_contratante
ON empresas_clientes(contratante_id);

-- Permitir empresas sem clínica mas com contratante direto
ALTER TABLE empresas_clientes
ALTER COLUMN clinica_id DROP NOT NULL;
```

## Decisão Recomendada

**Opção 2 + 1** é a mais segura:

1. Criar clínicas automáticas para contratantes tipo "entidade"
2. Adicionar `data_primeiro_pagamento` em contratantes
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
2. ✅ Criar clínicas para contratantes existentes
3. ⏳ Testar fluxo completo novamente
4. ⏳ Atualizar testes automatizados
5. ⏳ Documentar nova arquitetura

---

**Observação:** O banco foi resetado recentemente e o schema atual reflete uma arquitetura mais madura (com clínicas intermediárias) que o código de testes não acompanhou.
