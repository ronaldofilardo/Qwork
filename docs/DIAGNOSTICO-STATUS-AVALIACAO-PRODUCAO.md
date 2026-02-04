# Diagnóstico: Status de Avaliação não Atualiza no Dashboard da Entidade (Produção)

**Data:** 04/02/2026  
**Problema Reportado:** Avaliação #17 do lote 21 aparece como concluída no sistema (comprovante mostra conclusão em 04/02/2026 às 15:41:28), mas o dashboard da entidade ainda mostra status "Pendente" com botões Inativar/Resetar visíveis.

**Ambiente:** Produção (Neon Database)  
**Funciona em:** Desenvolvimento Local (nr-bps_db)

---

## 🔍 Análise do Problema

### 1. Causas Possíveis Identificadas

#### A. Polling Ausente (✅ CORRIGIDO em commit f22aff1)

- **Problema:** Página da entidade não tinha atualização automática
- **Solução:** Adicionado polling de 30s (igual à página RH)
- **Status:** Implementado, mas não resolve problema em produção se dados do banco estiverem errados

#### B. Migrations Não Aplicadas no Neon (⚠️ PROVÁVEL CAUSA)

- **Migration 099:** Corrige função `prevent_mutation_during_emission()` que referenciava coluna `processamento_em` removida
- **Migration 130:** Remove definitivamente a coluna `processamento_em` de `lotes_avaliacao`
- **Impacto:** Se estas migrations não foram aplicadas no Neon, pode estar causando erro silencioso ao atualizar status

#### C. View Desatualizada (🔍 A VERIFICAR)

- `vw_funcionarios_por_lote` pode estar desatualizada no Neon
- API RH usa essa view; API entidade faz queries diretas
- Se view está correta, problema é na API ou no banco

#### D. Cache/Transaction Issues (🔍 A VERIFICAR)

- Possível isolamento de transação impedindo leitura de dados recém-commitados
- Cache no nível de aplicação (Vercel) ou banco (Neon)

---

## 📊 Scripts de Diagnóstico Criados

### 1. `scripts/diagnostico-status-avaliacao-neon.sql`

Executa 10 verificações críticas:

1. Status da avaliação #17 diretamente na tabela
2. Todas avaliações do lote 21
3. Dados da view `vw_funcionarios_por_lote`
4. Definição da view
5. Status do lote 21
6. Fila de emissão
7. Função `prevent_mutation_during_emission()`
8. Existência da coluna `processamento_em`
9. Estatísticas como a API calcula
10. Audit log da avaliação #17

**Como executar:**

```bash
psql 'postgresql://neondb_owner:npg_J2QYqn5oxCzp@ep-divine-sky-acuderi7.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require' -f scripts/diagnostico-status-avaliacao-neon.sql
```

### 2. `scripts/correcao-status-avaliacao-neon.sql`

Aplica correções necessárias:

- Atualiza função `prevent_mutation_during_emission()` (migration 099)
- Recria view `vw_funcionarios_por_lote`
- Executa verificações de validação

**Como executar:**

```bash
psql 'postgresql://neondb_owner:npg_J2QYqn5oxCzp@ep-divine-sky-acuderi7.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require' -f scripts/correcao-status-avaliacao-neon.sql
```

---

## 🔧 Plano de Ação

### Passo 1: Executar Diagnóstico

```bash
psql 'postgresql://neondb_owner:npg_J2QYqn5oxCzp@ep-divine-sky-acuderi7.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require' -f scripts/diagnostico-status-avaliacao-neon.sql > diagnostico-resultado.txt
```

**O que procurar no resultado:**

- ✅ Avaliação #17 tem `status = 'concluida'` e `envio IS NOT NULL`?
- ✅ View `vw_funcionarios_por_lote` mostra `status_avaliacao = 'concluida'` para avaliação #17?
- ❌ Coluna `processamento_em` existe? (deveria estar removida)
- ❌ Função `prevent_mutation_during_emission()` menciona `processamento_em`? (deveria ter sido atualizada)

### Passo 2: Aplicar Correções (se necessário)

Se o diagnóstico mostrar que:

- Coluna `processamento_em` ainda existe, OU
- Função `prevent_mutation_during_emission()` está desatualizada, OU
- View `vw_funcionarios_por_lote` não existe ou está desatualizada

Então execute:

```bash
psql 'postgresql://neondb_owner:npg_J2QYqn5oxCzp@ep-divine-sky-acuderi7.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require' -f scripts/correcao-status-avaliacao-neon.sql
```

### Passo 3: Forçar Atualização na Interface

Após aplicar correções:

1. Aguarde 30 segundos (polling automático) ou
2. Force refresh (Ctrl+F5) na página
3. Verifique se status atualizou

### Passo 4: Aplicar Migration 130 (se coluna processamento_em existe)

Se o diagnóstico mostrar que `processamento_em` ainda existe:

```bash
psql 'postgresql://neondb_owner:npg_J2QYqn5oxCzp@ep-divine-sky-acuderi7.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require' -f database/migrations/130_remove_auto_emission_columns.sql
```

---

## 🚨 Diferenças Críticas entre Ambientes

| Aspecto                       | Local (nr-bps_db)               | Produção (Neon)                |
| ----------------------------- | ------------------------------- | ------------------------------ |
| Polling na página entidade    | ❌ Não tinha (adicionado agora) | ❌ Não tinha (deploy pendente) |
| Migration 099 aplicada?       | ✅ Sim                          | ❓ A verificar                 |
| Migration 130 aplicada?       | ✅ Sim                          | ❓ A verificar                 |
| View vw_funcionarios_por_lote | ✅ Atualizada                   | ❓ A verificar                 |
| Coluna processamento_em       | ❌ Removida                     | ❓ A verificar                 |

---

## 📝 Queries Úteis para Debug Manual

### Verificar status da avaliação diretamente:

```sql
SELECT id, funcionario_cpf, status, envio, atualizado_em
FROM avaliacoes
WHERE id = 17;
```

### Simular query da API entidade:

```sql
SELECT
    f.cpf,
    f.nome,
    a.id as avaliacao_id,
    a.status as avaliacao_status,
    a.envio as avaliacao_data_conclusao
FROM funcionarios f
JOIN avaliacoes a ON a.funcionario_cpf = f.cpf
WHERE a.lote_id = 21 AND f.contratante_id = 2;
```

### Verificar se há erro na função prevent_mutation_during_emission:

```sql
SELECT pg_get_functiondef('prevent_mutation_during_emission'::regproc);
```

---

## ✅ Resolução Esperada

Após executar o diagnóstico e aplicar as correções necessárias:

1. **Se o banco já estava correto:** O polling de 30s (commit f22aff1) resolverá o problema quando fizer deploy
2. **Se migrations faltavam:** Após aplicar correções, o status será atualizado corretamente
3. **Se view estava desatualizada:** Recreação da view resolverá inconsistências

**Próximos passos após correção:**

- Monitorar por 24h para garantir que não há regressão
- Documentar qual migration exatamente estava faltando no Neon
- Criar processo de validação de migrations entre ambientes
- Considerar CI/CD que aplica migrations automaticamente em produção

---

## 📞 Suporte

Se após executar os scripts o problema persistir, coletar:

1. Resultado completo do `diagnostico-status-avaliacao-neon.sql`
2. Screenshot do dashboard mostrando o problema
3. Logs do servidor (Vercel) no momento da requisição
4. Response da API `/api/entidade/lote/21` via DevTools Network

**Última atualização:** 04/02/2026 00:30
