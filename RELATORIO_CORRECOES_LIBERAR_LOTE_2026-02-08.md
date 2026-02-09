# Relatório de Correções - Liberar Lote (08/02/2026)

## Resumo Executivo

Foram corrigidos 3 erros críticos relacionados ao acesso de colunas removidas pela Migration 605:
1. **Entidade liberar-lote**: `coluna ec.entidade_id não existe`  
2. **Clínica liberar-lote**: `coluna f.empresa_id não existe` (SQL function)
3. **Notificações RH**: `referência à coluna clinica_id é ambígua`

## Problemas Identificados

### 1. Endpoint `/api/entidade/liberar-lote`
**Erro**: `coluna ec.entidade_id não existe`

**Causa**: A query tentava acessar `empresas_clientes.entidade_id`, mas essa coluna não existe. A relação correta é:
- `empresas_clientes.clinica_id` → `clinicas.id` → `clinicas.entidade_id`

**Solução**: Adicionado JOIN com tabela `clinicas`:
```sql
SELECT DISTINCT fc.empresa_id 
FROM funcionarios_clinicas fc
INNER JOIN empresas_clientes ec ON ec.id = fc.empresa_id
INNER JOIN clinicas c ON c.id = ec.clinica_id  -- NOVO JOIN
WHERE c.entidade_id = $1 AND fc.ativo = true
```

### 2. Função SQL `calcular_elegibilidade_lote()`
**Erro**: `coluna f.empresa_id não existe`

**Causa**: A função no banco ainda estava usando `f.empresa_id` direto, mas essa coluna foi removida pela Migration 605.

**Solução**: 
- Criada **Migration 607** com `DROP FUNCTION` + `CREATE FUNCTION` para forçar recriação
- Nova função usa `INNER JOIN funcionarios_clinicas fc ON fc.funcionario_id = f.id`
- Aplicada manualmente: funções dropadas e recriadas com sucesso

### 3. Endpoint `/api/rh/notificacoes`
**Erro**: `referência à coluna clinica_id é ambígua`

**Causa**: Subquery `(SELECT clinica_id FROM funcionarios WHERE cpf = $1)` tentava acessar coluna inexistente.

**Solução**: Substituída subquery por parâmetro direto da sessão:
```typescript
// ANTES
WHERE la.clinica_id = (SELECT clinica_id FROM funcionarios WHERE cpf = $1)
// query(..., [user.cpf])

// DEPOIS  
WHERE la.clinica_id = $2
// query(..., [user.cpf, user.clinica_id])
```

## Arquivos Modificados

### Código da Aplicação
1. **`app/api/entidade/liberar-lote/route.ts`** (Linha 60-70)
   - Adicionado JOIN com `clinicas`
   - Comentário explicativo sobre relação entidade→clinica→empresa

2. **`app/api/rh/notificacoes/route.ts`** (Linhas 35-95)
   - Substituída subquery por parâmetro `user.clinica_id`
   - Comentário explicando origem do clinica_id (sessão)

### Migrações de Banco
3. **`database/migrations/607_force_recreate_calcular_elegibilidade_func.sql`** (NOVA)
   - DROP + CREATE das funções:
     - `calcular_elegibilidade_lote(empresa_id, numero_lote)` → usa `funcionarios_clinicas`
     - `calcular_elegibilidade_lote_contratante(contratante_id, numero_lote)` → usa `funcionarios_entidades`
   - Aplicada manualmente em `nr-bps_db_test` em 08/02/2026

## Comandos Executados

```powershell
# 1. Dropar funções antigas
$env:PGPASSWORD = '123456'
echo "DROP FUNCTION IF EXISTS calcular_elegibilidade_lote(INTEGER, INTEGER) CASCADE; 
      DROP FUNCTION IF EXISTS calcular_elegibilidade_lote_contratante(INTEGER, INTEGER) CASCADE;" |
psql -U postgres -d nr-bps_db_test -h localhost

# 2. Criar novas funções
psql -U postgres -d nr-bps_db_test -h localhost -f database/migrations/607_force_recreate_calcular_elegibilidade_func.sql

# 3. Verificar criação
psql -U postgres -d nr-bps_db_test -h localhost -c "
  SELECT proname, pronargs FROM pg_proc WHERE proname LIKE 'calcular_elegibilidade%';
"

# 4. Testar execução
psql -U postgres -d nr-bps_db_test -h localhost -c "
  SELECT COUNT(*) FROM calcular_elegibilidade_lote(9, 1);
"
```

**Resultado**: ✅ 2 funções criadas com sucesso, executando sem erros

## Arquitetura Segregada

A Migration 605 implementou arquitetura segregada com tabelas intermediárias:

| Relacionamento | Tabela Intermediária | Colunas |
|---|---|---|
| Funcionário ↔ Empresa (via Clínica) | `funcionarios_clinicas` | `funcionario_id`, `empresa_id`, `ativo` |
| Funcionário ↔ Contratante (Entidade) | `funcionarios_entidades` | `funcionario_id`, `contratante_id`, `ativo` |

### Relações Importantes
- `empresas_clientes` tem `clinica_id` (NÃO tem `entidade_id`)
- `clinicas` tem `entidade_id`
- Para relacionar empresa→entidade: `empresas_clientes.clinica_id` → `clinicas.entidade_id`

## Status Final

✅ **Código da aplicação corrigido** em 2 arquivos  
✅ **Migration 607 criada e aplicada** no banco de teste  
✅ **Funções SQL recriadas** com DROP + CREATE forçado  
✅ **Testes básicos executados**: Funções executam sem erros  

### Próximos Passos
1. ⚠️ **Verificar dados nas tabelas intermediárias**:
   ```sql
   -- Quantos funcionarios estão vinculados à empresa 9?
   SELECT COUNT(*) FROM funcionarios_clinicas WHERE empresa_id = 9 AND ativo = true;
   
   -- Quais empresas têm funcionários vinculados?
   SELECT empresa_id, COUNT(*) FROM funcionarios_clinicas WHERE ativo = true GROUP BY empresa_id;
   ```

2. ⚠️ **Testar endpoints end-to-end**:
   - POST `/api/entidade/liberar-lote` (gestor de entidade)
   - POST `/api/rh/liberar-lote` (gestor RH de clínica)
   - GET `/api/rh/notificacoes` (gestor RH)

3. ⚠️ **Aplicar Migration 607 em produção** (quando validada em teste)

4. ⚠️ **Verificar se dados de funcionarios_clinicas estão populados**:
   - Se tabelas estão vazias, pode precisar de migration de dados
   - Migration deve popular funcionarios_clinicas/funcionarios_entidades a partir de registros legados

## Lições Aprendidas

1. **CREATE OR REPLACE não sobrescreveu funções**: PostgreSQL manteve versão antiga
   - Solução: Usar `DROP FUNCTION IF EXISTS ... CASCADE` antes de `CREATE FUNCTION`
   
2. **Migration 606 não foi efetiva**: Necessário forçar com DROP explícito
   - Migrations futuras de funções devem sempre usar DROP antes de CREATE

3. **Empresas relacionam com entidades via clinicas**: Não há coluna `entidade_id` direta em `empresas_clientes`
   - Sempre fazer JOIN `empresas_clientes → clinicas → entidades`

## Referências

- **Migration 605**: `605_remove_obsolete_fk_columns_from_funcionarios.sql` (removeu FK diretas)
- **Migration 606**: `606_fix_calcular_elegibilidade_lote_func_utf8.sql` (não efetiva)
- **Migration 607**: `607_force_recreate_calcular_elegibilidade_func.sql` (DROP + CREATE - EFETIVA)
- **Documentação anterior**: `CORRECAO_LIBERAR_LOTE.md`

---
**Data**: 08/02/2026  
**Banco**: nr-bps_db_test (localhost)  
**Status**: ✅ Correções aplicadas, aguardando testes end-to-end
