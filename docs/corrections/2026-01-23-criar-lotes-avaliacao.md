# Correção: Erros ao criar lotes de avaliação

**Data:** 23/01/2026  
**Status:** ✅ Corrigido

## Problema 1: Função obter_proximo_numero_ordem não existe (RH - empresa)

### Sintoma

```
error: função obter_proximo_numero_ordem(unknown) não existe
code: '42883'
hint: Nenhuma função corresponde com o nome e os tipos de argumentos informados
```

### Causa Raiz

A migration 016 (sistema de índice de avaliação) **não havia sido aplicada** ao banco de desenvolvimento.  
A rota `/api/rh/liberar-lote` tentava chamar:

```sql
SELECT obter_proximo_numero_ordem($1) as numero_ordem
```

Mas a função não existia no banco.

### Solução Aplicada

Aplicadas migrations do sistema de índice ao banco de desenvolvimento:

```powershell
# Migration 016 - estrutura base
psql -U postgres -d nr-bps_db -f "database\migration-016-indice-avaliacao.sql"

# Migration 015 - funções de elegibilidade
psql -U postgres -d nr-bps_db -f "database\migrations\015_include_boundary_in_calcular_elegibilidade.sql"
```

Resultado:

- ✅ Função `obter_proximo_numero_ordem(INTEGER)` criada
- ✅ Função `calcular_elegibilidade_lote(INTEGER, INTEGER)` criada
- ✅ Função `calcular_elegibilidade_lote_tomador(INTEGER, INTEGER)` criada
- ✅ Coluna `lotes_avaliacao.numero_ordem` criada
- ✅ Coluna `funcionarios.indice_avaliacao` criada
- ✅ Coluna `funcionarios.data_ultimo_lote` criada
- ✅ Índices de performance criados

---

## Problema 2: Coluna numero_ordem não existe (Entidade)

### Sintoma

```
error: coluna "numero_ordem" não existe
code: '42703'
position: '21'
```

### Causa Raiz

Mesmo problema: migration 016 não aplicada.  
A rota `/api/entidade/liberar-lote` tentava acessar `numero_ordem` em duas queries:

1. `SELECT obter_proximo_numero_ordem($1)` - para lotes de empresas filhas
2. `SELECT COALESCE(MAX(numero_ordem), 0) + 1` - para lotes diretos da entidade

Ambas falhavam porque a coluna não existia.

### Solução Aplicada

Mesma solução do Problema 1: aplicação das migrations 016 e 015.

---

## Problema 3: Funções de elegibilidade não existem

### Sintoma

```
error: função calcular_elegibilidade_lote(unknown, unknown) não existe
error: função calcular_elegibilidade_lote_tomador(integer, integer) não existe
```

### Causa Raiz

As funções de elegibilidade fazem parte do sistema de índice mas estavam em arquivo separado (`functions-016-indice-avaliacao.sql`) com problemas de encoding UTF-8.

### Solução Aplicada

Aplicada migration 015 que contém versão limpa das funções:

```powershell
psql -U postgres -d nr-bps_db -f "database\migrations\015_include_boundary_in_calcular_elegibilidade.sql"
```

---

## Problema 4: `liberado_por` NOT NULL causava falha ao criar lotes por entidade

### Sintoma

```
error: o valor nulo na coluna "liberado_por" da relação "lotes_avaliacao" viola a restrição de não-nulo
code: '23502'
```

### Causa Raiz

Os gestores de entidade nem sempre existem como registros em `funcionarios` (fluxo normal não cria). O código da rota permitia `liberado_por = NULL` quando o gestor não era funcionário, mas a coluna `lotes_avaliacao.liberado_por` estava definida como `NOT NULL` no schema, causando violação de constraint.

### Solução Aplicada

Aplicada migration que torna `liberado_por` nullable para permitir que gestores externos (não-funcionários) iniciem ciclos:

```powershell
psql -U postgres -d nr-bps_db -f "database/migrations/204_allow_liberado_por_nullable.sql"
```

Resultado:

- ✅ Coluna `lotes_avaliacao.liberado_por` alterada para aceitar NULL

---

## Arquivos Alterados

- ✅ [database/migrations/075_apply_indice_avaliacao.sql](c:/apps/QWork/database/migrations/075_apply_indice_avaliacao.sql) - Migration documentada
- ✅ Banco de dados: migrations 016, 015 e 204 aplicadas com sucesso

---

## Verificação

```sql
-- Verificar funções criadas
\df obter_proximo_numero_ordem
-- Resultado: obter_proximo_numero_ordem | integer | p_empresa_id integer

\df calcular_elegibilidade_lote*
-- Resultado:
--   calcular_elegibilidade_lote(integer, integer)
--   calcular_elegibilidade_lote_tomador(integer, integer)

-- Verificar coluna criada
\d lotes_avaliacao
-- Resultado: numero_ordem | integer | not null | default 1

-- Testar queries
SELECT obter_proximo_numero_ordem(5);
-- Resultado: próximo número sequencial para empresa 5

SELECT * FROM calcular_elegibilidade_lote(5, 1);
-- Resultado: funcionários elegíveis para empresa 5, lote 1

SELECT * FROM calcular_elegibilidade_lote_tomador(9, 1);
-- Resultado: funcionários elegíveis para tomador 9, lote 1
```

---

## Problema 5: `vw_funcionarios_por_lote` ausente causava erros 42P01

### Sintoma

```
error: relação "vw_funcionarios_por_lote" não existe
code: '42P01'
```

### Causa Raiz

A view `vw_funcionarios_por_lote` faz parte das views de auditoria/refatoração (migration `007e_views.sql`). A tentativa de aplicar essa migration falhou no ambiente de desenvolvimento porque uma tabela auxiliar `fila_emissao` não existia, interrompendo a transação e impedindo a criação das views.

### Solução Aplicada

- Apliquei a migration `007_add_inativacao_fields.sql` para garantir que as colunas referenciadas na view (`inativada_em`, `motivo_inativacao`) existam.
- Criei **manual e diretamente** a view `vw_funcionarios_por_lote` (CREATE OR REPLACE VIEW ...) baseada na definição esperada pelo código.

Resultado:

- ✅ View `vw_funcionarios_por_lote` criada com sucesso
- ✅ Rota `/api/rh/lotes/[id]/funcionarios` executa sem erro de relação inexistente
- ✅ Migration `076_safe_recreate_views.sql` aplicada: recriou views essenciais com `CREATE OR REPLACE VIEW` e **ajustada** para não referenciar `arquivo_pdf` (usa `hash_pdf` / tamanho fixo), garantindo idempotência e compatibilidade com o schema atual

---

## Contexto: Sistema de Índice de Avaliação

A migration 016 implementa o **Sistema de Índice de Avaliação**, que garante:

1. **Rastreabilidade**: Cada lote tem um `numero_ordem` sequencial por empresa
2. **Histórico**: Funcionários têm `indice_avaliacao` (quantas avaliações completaram)
3. **Compliance**: Campo `data_ultimo_lote` rastreia prazo de 1 ano entre avaliações

### Funcionalidades implementadas:

- Função `obter_proximo_numero_ordem(empresa_id)`: retorna próximo número sequencial
- Função `calcular_elegibilidade_lote(empresa_id, numero_lote)`: identifica quem precisa fazer avaliação (empresas)
- Função `calcular_elegibilidade_lote_tomador(tomador_id, numero_lote)`: identifica quem precisa fazer avaliação (entidades)
- Índices de performance para queries de elegibilidade

### Critérios de elegibilidade:

1. **Funcionário novo**: `indice_avaliacao = 0` (nunca avaliado)
2. **Índice atrasado**: `indice_avaliacao <= numero_lote_atual - 1` (perdeu lote anterior)
3. **Mais de 1 ano**: `data_ultimo_lote < NOW() - INTERVAL '1 year'` (compliance)

---

## Prevenção Futura

1. **Sempre executar migrations em ordem** antes de testes em dev
2. **Verificar dependências de schema** antes de deploy de novas features
3. **Script de setup** deve aplicar todas as migrations automaticamente
4. **CI/CD** deve validar que migrations foram aplicadas em dev/test antes de prod

---

## Testes Recomendados

Após a correção, testar:

1. **Criar lote via RH (empresa):**

```bash
POST /api/rh/liberar-lote
Body: { "empresaId": 5, "tipo": "completo", "titulo": "Lote Teste" }
```

2. **Criar lote via Entidade (múltiplas empresas):**

```bash
POST /api/entidade/liberar-lote
Body: {
  "tipo": "completo",
  "titulo": "Lote Multi-Empresa",
  "empresaIds": [5, 6]
}
```

3. **Criar lote direto da entidade (sem empresa):**

```bash
POST /api/entidade/liberar-lote
Body: {
  "tipo": "completo",
  "titulo": "Lote Entidade Direta",
  "criarLoteEntidade": true
}
```

Todos devem retornar `numero_ordem` correto e criar lotes com sucesso.
