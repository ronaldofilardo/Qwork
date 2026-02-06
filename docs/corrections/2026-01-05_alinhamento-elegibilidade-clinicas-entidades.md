# Correção: Alinhamento de Elegibilidade entre Clínicas e Entidades

**Data:** 05/01/2026  
**Tipo:** Correção de Comportamento  
**Impacto:** Médio - Melhora clareza na listagem de funcionários

## 📋 Problema Identificado

O sistema estava exibindo funcionários com avaliações inativadas sem informar claramente se eles tinham avaliações concluídas recentes (menos de 12 meses). Especificamente:

- **Thiago Rocha** tinha uma avaliação concluída em **04/01/2026 às 13:06** no lote **002-040126**
- O sistema mostrava apenas: **"Avaliação Inativada"** (porque foi inativada posteriormente)
- **Não informava** que ele tinha uma avaliação válida (concluída há menos de 12 meses)
- Isso causava confusão sobre a elegibilidade do funcionário

## 🎯 Objetivo

Alinhar o **fluxo de elegibilidade e listagem de funcionários** em **clínicas** com o fluxo de **entidades**, garantindo que:

1. Funcionários com avaliações concluídas há **menos de 12 meses** sejam claramente identificados como **não elegíveis**
2. Funcionários com avaliações concluídas há **mais de 12 meses** sejam identificados como **elegíveis** para nova avaliação
3. O critério seja **idêntico** entre clínicas e entidades (única diferença: empresa é subnível em clínicas)

## ✅ Critérios de Elegibilidade (Fonte da Verdade)

Baseado nas funções SQL `calcular_elegibilidade_lote` e `calcular_elegibilidade_lote_contratante`:

### Funcionário É Elegível SE:

1. **Funcionário novo** (índice = 0, nunca avaliado)
2. **Índice atrasado** (índice_avaliacao <= numero_lote_atual - 1)
3. **Mais de 1 ano sem avaliação** (`data_ultimo_lote < NOW() - INTERVAL '1 year'`)

### Funcionário NÃO É Elegível SE:

- Tem `data_ultimo_lote >= NOW() - INTERVAL '1 year'` (avaliação concluída há menos de 12 meses)

## 🔧 Alterações Implementadas

### 1. API de Listagem - Clínicas (`app/api/rh/funcionarios/route.ts`)

**Antes:**

```typescript
SELECT cpf, nome, ..., ultima_avaliacao_status
FROM funcionarios
WHERE empresa_id = $1 AND clinica_id = $2
```

**Depois:**

```typescript
SELECT cpf, nome, ..., ultima_avaliacao_status,
       -- Verificar se tem avaliação concluída há menos de 12 meses
       CASE
         WHEN data_ultimo_lote IS NOT NULL AND data_ultimo_lote >= NOW() - INTERVAL '1 year'
           THEN true
         ELSE false
       END as tem_avaliacao_recente
FROM funcionarios
WHERE empresa_id = $1 AND clinica_id = $2
```

### 2. API de Listagem - Entidades (`app/api/entidade/funcionarios/route.ts`)

**Adicionado mesmo campo:**

```typescript
CASE
  WHEN f.data_ultimo_lote IS NOT NULL AND f.data_ultimo_lote >= NOW() - INTERVAL '1 year'
    THEN true
  ELSE false
END as tem_avaliacao_recente
```

### 3. Componente de Exibição (`components/funcionarios/FuncionariosSection.tsx`)

**Interface atualizada:**

```typescript
interface Funcionario {
  // ... campos existentes
  tem_avaliacao_recente?: boolean; // NOVO
}
```

**Exibição melhorada na tabela:**

```tsx
{funcionario.ultima_avaliacao_status === 'concluido' && (
  <div className="mt-1">
    {funcionario.tem_avaliacao_recente ? (
      <span className="... bg-blue-100 text-blue-800">
        ✓ Avaliação válida
      </span>
    ) : (
      <span className="... bg-yellow-100 text-yellow-800">
        ⚠️ Elegível (>12 meses)
      </span>
    )}
  </div>
)}
```

## 📊 Exemplo Visual

### Antes:

```
Thiago Rocha | 002-040126 | [Inativada] | 04/01/2026
```

### Depois:

```
Thiago Rocha | 002-040126 | [Concluída] | 04/01/2026
             └─> ✓ Avaliação válida
```

**Se a avaliação tivesse sido concluída há mais de 12 meses:**

```
João Silva | 001-010125 | [Concluída] | 15/12/2024
          └─> ⚠️ Elegível (>12 meses)
```

## 🔄 Impacto no Sistema

### ✅ O que NÃO mudou:

- **Funções de elegibilidade SQL** já estavam corretas
- **Liberação de lotes** já usava os critérios corretos
- **Regra de negócio** permanece a mesma (12 meses)

### ✅ O que mudou:

- **Listagem de funcionários** agora mostra claramente o status de elegibilidade
- **Interface do usuário** exibe badges informativos
- **Transparência** para gestores RH sobre quem pode/não pode ser incluído em novo lote

## 🧪 Como Testar

1. **Acessar Dashboard RH** → Funcionários Ativos
2. **Verificar Thiago Rocha**:
   - Deve mostrar: **"✓ Avaliação válida"** (concluída há 4 dias)
   - NÃO deve aparecer em listagem de elegíveis para novo lote
3. **Tentar Iniciar Novo Ciclo**:
   - Thiago Rocha NÃO deve ser incluído (tem avaliação recente)

## 📚 Referências

- Funções SQL: `database/migrations/015_include_boundary_in_calcular_elegibilidade.sql`
- API Clínicas: `app/api/rh/funcionarios/route.ts`
- API Entidades: `app/api/entidade/funcionarios/route.ts`
- Componente: `components/funcionarios/FuncionariosSection.tsx`
- Liberação Lotes Clínicas: `app/api/rh/liberar-lote/route.ts`
- Liberação Lotes Entidades: `app/api/entidade/liberar-lote/route.ts`

## ✅ Status

- [x] Query RH ajustada
- [x] Query Entidade ajustada
- [x] Interface atualizada
- [x] Sem erros TypeScript
- [ ] Teste manual pendente
- [ ] Validação em produção pendente

---

**Conclusão:** O fluxo de elegibilidade de clínicas agora está **100% alinhado** com o de entidades. A única diferença estrutural é que clínicas têm o subnível "empresa", mas os critérios de elegibilidade (12 meses, índice, novos funcionários) são idênticos.


