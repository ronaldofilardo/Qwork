# Correção dos Erros de Liberação de Lote

## Problema Identificado

Os erros ocorreram porque:

1. O código estava usando `tomador_id` que não existe na tabela `funcionarios`
2. A função `calcular_elegibilidade_lote()` no banco de dados estava tentando acessar a coluna `empresa_id` direto da tabela `funcionarios`, mas essa coluna foi removida pela **Migration 605**

## Arquitetura Atualizada (Migration 605)

A partir da Migration 605, as colunas de FK diretas (`clinica_id`, `empresa_id`, `contratante_id`) foram **removidas** da tabela `funcionarios`. O sistema agora usa **tabelas intermediárias**:

- `funcionarios_entidades` - vincula funcionários a entidades
- `funcionarios_clinicas` - vincula funcionários a empresas (e transitivamente a clínicas)

## Correções Implementadas

### 1. Arquivo: `/app/api/entidade/liberar-lote/route.ts`

**Antes:**

```typescript
// ❌ Usava tomador_id (não existe) e empresa_id direto
const empresasRes = await queryAsGestorEntidade(
  `SELECT DISTINCT empresa_id FROM funcionarios WHERE tomador_id = $1...`
);
```

**Depois:**

```typescript
// ✅ Usa tabelas intermediárias conforme arquitetura segregada
const empresasRes = await queryAsGestorEntidade(
  `SELECT DISTINCT fc.empresa_id 
   FROM funcionarios_clinicas fc
   INNER JOIN empresas_clientes ec ON ec.id = fc.empresa_id
   WHERE ec.entidade_id = $1 AND fc.ativo = true`
);
```

### 2. Função SQL: `calcular_elegibilidade_lote()`

Criada **Migration 606** que atualiza as funções:

- `calcular_elegibilidade_lote()` - agora usa `INNER JOIN funcionarios_clinicas`
- `calcular_elegibilidade_lote_contratante()` - agora usa `INNER JOIN funcionarios_entidades`

**Localização:** `database/migrations/606_fix_calcular_elegibilidade_lote_func.sql`

## Como Aplicar a Correção

### Passo 1: Aplicar a Migration no Banco

Execute o arquivo SQL no banco de dados:

```bash
# Local (development)
psql $DATABASE_URL -f database/migrations/606_fix_calcular_elegibilidade_lote_func.sql

# Ou usando pnpm
pnpm db:migrate
```

### Passo 2: Verificar Aplicação

Verifique se as funções foram atualizadas:

```sql
-- Ver definição da função
\df+ calcular_elegibilidade_lote

-- Testar a função
SELECT * FROM calcular_elegibilidade_lote(9, 1);
```

### Passo 3: Testar os Endpoints

1. **Liberação de lote para clínica (RH):**

   ```bash
   curl -X POST http://localhost:3000/api/rh/liberar-lote \
     -H "Content-Type: application/json" \
     -d '{"empresaId": 9}'
   ```

2. **Liberação de lote para entidade:**
   ```bash
   curl -X POST http://localhost:3000/api/entidade/liberar-lote \
     -H "Content-Type: application/json"
   ```

## Verificação de Dados

Se ainda houver erros sobre "funcionários sem vínculo", verifique se os dados foram migrados corretamente:

```sql
-- Ver funcionários sem vínculo nas tabelas intermediárias
SELECT f.id, f.cpf, f.nome, f.perfil
FROM funcionarios f
WHERE f.perfil = 'funcionario'
  AND f.id NOT IN (
      SELECT funcionario_id FROM funcionarios_entidades WHERE ativo = true
      UNION
      SELECT funcionario_id FROM funcionarios_clinicas WHERE ativo = true
  );

-- Ver empresas e suas entidades
SELECT
    ec.id as empresa_id,
    ec.nome as empresa_nome,
    ec.entidade_id,
    e.nome as entidade_nome,
    COUNT(fc.funcionario_id) as total_funcionarios
FROM empresas_clientes ec
LEFT JOIN entidades e ON e.id = ec.entidade_id
LEFT JOIN funcionarios_clinicas fc ON fc.empresa_id = ec.id AND fc.ativo = true
GROUP BY ec.id, ec.nome, ec.entidade_id, e.nome;
```

## Próximos Passos

Se houver dados órfãos (funcionários sem vínculo), será necessário criar uma migration adicional para migrá-los. Entre em contato se precisar de ajuda com essa migração.
