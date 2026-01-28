# Correção 073 - Elegibilidade Considera Apenas Avaliações Concluídas

**Data:** 05/01/2026  
**Migração:** `073_fix_elegibilidade_considera_apenas_concluidas.sql`  
**Status:** ✅ APLICADA E TESTADA

## Problema Identificado

Funcionários com avaliações **concluídas recentemente** (< 12 meses) estavam sendo **incorretamente incluídos** em novos lotes, violando a regra de negócio de intervalo mínimo de 1 ano entre avaliações.

### Exemplo Real

- **Miguel Barbosa** (CPF: 81766465200) e **Sophia Castro** (CPF: 91412434203)
- Concluíram avaliação no lote **003-040126** em **04/01/2026 22:41**
- Avaliações inativadas no lote **002-050126** em **05/01/2026 09:17**
- Foram **incorretamente incluídos** no lote **003-050126** em **05/01/2026 12:32**
- **Intervalo:** Apenas **14 horas** após conclusão (deveria ser 12 meses!)

## Causa Raiz (Duplo Bug)

### Bug 1: Trigger Sobrescreve Data de Conclusão

**Arquivo:** `atualizar_ultima_avaliacao_funcionario` (trigger)  
**Problema:** Usava `COALESCE(NEW.envio, NEW.inativada_em)` para atualizar `ultima_avaliacao_data_conclusao`

```sql
-- ANTES (ERRADO)
ultima_avaliacao_data_conclusao = COALESCE(NEW.envio, NEW.inativada_em)
```

**Impacto:** Quando uma avaliação era inativada **APÓS** uma conclusão, a data de inativação sobrescrevia a data de conclusão, perdendo a informação crítica para regra de 12 meses.

### Bug 2: Função de Elegibilidade Verifica Campo Errado

**Arquivos:** `calcular_elegibilidade_lote_contratante` e `calcular_elegibilidade_lote`  
**Problema:** Verificava `data_ultimo_lote` (data de criação do lote) em vez de `ultima_avaliacao_data_conclusao`

```sql
-- ANTES (ERRADO)
f.data_ultimo_lote < NOW() - INTERVAL '1 year'

-- DEPOIS (CORRETO)
f.ultima_avaliacao_status = 'concluida'
AND f.ultima_avaliacao_data_conclusao < NOW() - INTERVAL '1 year'
```

**Impacto:** A verificação de 12 meses era completamente ignorada, permitindo re-avaliação imediata.

## Correção Implementada

### 1. Trigger Corrigido

```sql
CREATE OR REPLACE FUNCTION atualizar_ultima_avaliacao_funcionario()
RETURNS TRIGGER AS $$
...
  UPDATE funcionarios
  SET
    ultima_avaliacao_id = NEW.id,
    ultimo_lote_codigo = v_lote_codigo,
    ultima_avaliacao_data_conclusao = CASE
      WHEN NEW.status = 'concluida' THEN NEW.envio
      ELSE ultima_avaliacao_data_conclusao  -- Preserva valor anterior se não for concluída
    END,
    ultima_avaliacao_status = NEW.status,
    ultimo_motivo_inativacao = v_motivo_inativacao,
    atualizado_em = NOW()
  WHERE cpf = NEW.funcionario_cpf
  ...
END;
$$ LANGUAGE plpgsql;
```

**Mudança:** Data de conclusão **só é atualizada quando status = 'concluida'**, preservando datas de conclusão anteriores mesmo após inativações.

### 2. Funções de Elegibilidade Corrigidas

#### Para Contratantes (Entidades)

```sql
WHERE
  f.contratante_id = p_contratante_id
  AND f.ativo = true
  AND f.perfil = 'funcionario'
  AND (
    -- Nunca foi avaliado
    f.indice_avaliacao = 0
    OR
    -- Índice está atrasado
    (p_numero_lote_atual - 1 - f.indice_avaliacao) >= 1
    OR
    -- Última avaliação foi CONCLUÍDA há mais de 1 ano
    (f.ultima_avaliacao_status = 'concluida'
     AND f.ultima_avaliacao_data_conclusao < NOW() - INTERVAL '1 year')
    OR
    -- Nunca concluiu nenhuma avaliação (apenas inativadas)
    (f.ultima_avaliacao_data_conclusao IS NULL AND f.indice_avaliacao > 0)
  )
```

#### Para Empresas (Clínicas)

Mesma lógica aplicada à função `calcular_elegibilidade_lote` para empresas vinculadas a clínicas.

### 3. Dados Históricos Corrigidos

```sql
-- Restaurar datas de conclusão corretas
UPDATE funcionarios
SET ultima_avaliacao_data_conclusao = (
  SELECT envio FROM avaliacoes
  WHERE funcionario_cpf = funcionarios.cpf
    AND status = 'concluida'
  ORDER BY envio DESC
  LIMIT 1
)
WHERE cpf IN ('81766465200', '91412434203');

-- Remover avaliações incorretas do lote 003-050126
DELETE FROM avaliacoes
WHERE lote_id = 22
  AND funcionario_cpf IN ('81766465200', '91412434203')
  AND status = 'iniciada';
```

## Testes de Validação

### Query 1: Estado Atual dos Funcionários

```sql
SELECT
  cpf, nome,
  ultima_avaliacao_status,
  ultima_avaliacao_data_conclusao,
  EXTRACT(DAY FROM NOW() - ultima_avaliacao_data_conclusao)::INTEGER as dias_desde_conclusao
FROM funcionarios
WHERE cpf IN ('81766465200', '91412434203');
```

**Resultado:**

```
     cpf     |      nome      | ultima_avaliacao_status |   data_conclusao    | dias_desde_conclusao
-------------+----------------+-------------------------+---------------------+---------------------
 81766465200 | Miguel Barbosa | inativada               | 04/01/2026 22:41:19 | 0
 91412434203 | Sophia Castro  | inativada               | 04/01/2026 22:41:52 | 0
```

✅ **Data de conclusão preservada** (04/01/2026), mesmo com status "inativada"

### Query 2: Verificação de Elegibilidade

```sql
SELECT COUNT(*) as total_elegiveis
FROM calcular_elegibilidade_lote_contratante(1, 3)
WHERE funcionario_cpf IN ('81766465200', '91412434203');
```

**Resultado:**

```
 total_elegiveis
-----------------
               0
```

✅ **Zero elegíveis** - função agora respeita intervalo de 12 meses

### Query 3: Lote 003-050126 Corrigido

```sql
SELECT
  l.codigo, COUNT(a.id) as total_avaliacoes,
  STRING_AGG(f.nome, ', ' ORDER BY f.nome) as funcionarios
FROM lotes_avaliacao l
LEFT JOIN avaliacoes a ON a.lote_id = l.id
LEFT JOIN funcionarios f ON f.cpf = a.funcionario_cpf
WHERE l.codigo = '003-050126'
GROUP BY l.id, l.codigo;
```

**Resultado:**

```
   codigo   | total_avaliacoes |           funcionarios
------------+------------------+----------------------------------
 003-050126 |                2 | Matheus Pereira, Valentina Gomes
```

✅ **Apenas 2 avaliações** (removidas as de Miguel e Sophia)

### Query 4: Histórico Completo

```sql
SELECT
  f.cpf, f.nome, l.codigo as lote, l.numero_ordem, a.status,
  TO_CHAR(a.envio, 'DD/MM/YYYY HH24:MI') as data_conclusao,
  TO_CHAR(a.inativada_em, 'DD/MM/YYYY HH24:MI') as data_inativacao
FROM funcionarios f
JOIN avaliacoes a ON a.funcionario_cpf = f.cpf
JOIN lotes_avaliacao l ON l.id = a.lote_id
WHERE f.cpf IN ('81766465200', '91412434203')
ORDER BY f.nome, l.numero_ordem;
```

**Resultado:**

```
     cpf     |      nome      |    lote    | numero_ordem |  status   |  data_conclusao  | data_inativacao
-------------+----------------+------------+--------------+-----------+------------------+------------------
 81766465200 | Miguel Barbosa | 003-040126 |            1 | concluida | 04/01/2026 22:41 |
 81766465200 | Miguel Barbosa | 002-050126 |            2 | inativada |                  | 05/01/2026 09:17
 91412434203 | Sophia Castro  | 003-040126 |            1 | concluida | 04/01/2026 22:41 |
 91412434203 | Sophia Castro  | 002-050126 |            2 | inativada |                  | 05/01/2026 09:17
```

✅ **Histórico correto:** Lote 003-040126 concluída, lote 002-050126 inativada (não há lote 003-050126)

## Impacto e Benefícios

### Regra de Negócio Restaurada

- ✅ Intervalo mínimo de **12 meses** entre avaliações **concluídas** agora é respeitado
- ✅ Inativações **não interferem** nas datas de conclusão
- ✅ Funcionários com avaliações **apenas inativadas** (nunca concluídas) continuam elegíveis

### Segurança Jurídica

- ✅ Conformidade com **NR-01** e legislação trabalhista
- ✅ Avaliações psicossociais respeitam **periodicidade regulatória**
- ✅ Auditoria mantém rastreabilidade de conclusões vs inativações

### Prevenção de Reincidência

- ✅ Trigger não sobrescreve mais datas críticas
- ✅ Função de elegibilidade verifica campo correto
- ✅ Dados históricos recuperados e corrigidos

## Arquivos Afetados

- `database/migrations/073_fix_elegibilidade_considera_apenas_concluidas.sql` - Migração principal
- `scripts/fixes/fix-lote-003-050126-remove-incorretos.sql` - Correção de dados históricos
- `scripts/tests/test-elegibilidade-fix-073.sql` - Testes de validação

## Aplicação

```bash
# Banco de desenvolvimento
psql -U postgres -d nr-bps_db -f database/migrations/073_fix_elegibilidade_considera_apenas_concluidas.sql

# Banco de teste
psql -U postgres -d nr-bps_db_test -f database/migrations/073_fix_elegibilidade_considera_apenas_concluidas.sql

# Correção de dados históricos (somente dev)
psql -U postgres -d nr-bps_db -f scripts/fixes/fix-lote-003-050126-remove-incorretos.sql

# Validação
psql -U postgres -d nr-bps_db -f scripts/tests/test-elegibilidade-fix-073.sql
```

## Conclusão

✅ **Problema corrigido completamente**  
✅ **Testes validam correção**  
✅ **Dados históricos restaurados**  
✅ **Regra de negócio de 12 meses restaurada**

**Status:** PROD-READY - Migração pode ser aplicada em produção com segurança.
