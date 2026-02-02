# Correção: Remoção do Status 'liberada' de Avaliações

**Data**: 31 de janeiro de 2026  
**Tipo**: Correção de Inconsistência  
**Impacto**: Médio - Limpeza de código e queries

---

## 📋 Contexto

Foi identificada uma inconsistência entre o constraint do banco de dados e o código da aplicação relacionado ao status de avaliações.

### Situação Anterior

- **Constraint do banco** (`avaliacoes_status_check`): Permitia apenas `iniciada`, `em_andamento`, `concluida`, `inativada`
- **Código da aplicação**: Referenciava `liberada` em múltiplas queries e componentes
- **APIs de criação**: Já criavam avaliações com status `iniciada` (correto)

### Problema

O status `'liberada'` era mencionado em várias partes do código, mas:

1. ❌ **Não existia** no constraint do banco
2. ❌ **Nunca seria usado** pelas APIs de criação
3. ⚠️ Causava **confusão** para desenvolvedores
4. ⚠️ Queries incluíam verificações **desnecessárias**

---

## ✅ Solução Implementada

### 1. **APIs e Backend**

Removido `'liberada'` de todas as queries SQL:

- ✅ [lib/queries.ts](../lib/queries.ts) - Query `avaliacoes_pendentes`
- ✅ [lib/validacao-lote-laudo.ts](../lib/validacao-lote-laudo.ts) - Query `avaliacoes_ativas`
- ✅ [lib/lotes.ts](../lib/lotes.ts) - Query de estatísticas e comentário atualizado
- ✅ [app/api/avaliacao/finalizar/route.ts](../app/api/avaliacao/finalizar/route.ts)
- ✅ [app/api/avaliacao/save/route.ts](../app/api/avaliacao/save/route.ts)
- ✅ [app/api/avaliacao/status/route.ts](../app/api/avaliacao/status/route.ts) - Validação de status
- ✅ [app/api/avaliacao/respostas/route.ts](../app/api/avaliacao/respostas/route.ts)
- ✅ [app/api/avaliacao/respostas-all/route.ts](../app/api/avaliacao/respostas-all/route.ts)
- ✅ [app/api/admin/clinicas/[id]/empresas/route.ts](../app/api/admin/clinicas/[id]/empresas/route.ts)

### 2. **Frontend**

Removido referências a `'liberada'`:

- ✅ [app/dashboard/page.tsx](../app/dashboard/page.tsx) - Filtro de avaliações disponíveis
- ✅ [app/dashboard/page.tsx](../app/dashboard/page.tsx) - Lógica do botão "Iniciar" vs "Continuar"
- ✅ [app/avaliacao/page.tsx](../app/avaliacao/page.tsx) - Removida lógica de conversão automática

### 3. **Migrations**

- ✅ [database/migrations/080_add_liberada_status.sql](../database/migrations/080_add_liberada_status.sql.DESCONTINUADA) - Descontinuada
- ✅ [database/migrations/081_remove_liberada_status.sql](../database/migrations/081_remove_liberada_status.sql) - Nova migration documentando a mudança

---

## 🎯 Status Válidos de Avaliação

| Status         | Descrição                                          | Quando é usado                                          |
| -------------- | -------------------------------------------------- | ------------------------------------------------------- |
| `iniciada`     | Avaliação criada mas não iniciada pelo funcionário | Ao liberar lote (INSERT)                                |
| `em_andamento` | Funcionário está respondendo a avaliação           | Durante preenchimento                                   |
| `concluida`    | Avaliação finalizada                               | Ao enviar última resposta                               |
| `inativada`    | Avaliação cancelada/desativada                     | Quando funcionário é desativado ou avaliação é resetada |

### ❌ Status Removido

| Status     | Motivo da Remoção                                                                                                                             |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `liberada` | ❌ Nunca foi permitido pelo constraint `avaliacoes_status_check` <br> ❌ Não é usado pelas APIs de criação <br> ❌ Causava confusão no código |

---

## 🔍 Verificação de Impacto

### Queries que foram corrigidas:

**Antes:**

```sql
-- ❌ Incluía 'liberada' desnecessariamente
WHERE status IN ('liberada', 'iniciada', 'em_andamento')
```

**Depois:**

```sql
-- ✅ Apenas status válidos
WHERE status IN ('iniciada', 'em_andamento')
```

### Comportamento do Frontend:

**Antes:**

```tsx
// ❌ Verificava status que nunca existiria
const disponíveis = avaliacoes.filter(
  (a) => a.status === 'liberada' || a.status === 'em_andamento'
);

{
  a.status === 'liberada' ? 'Iniciar' : 'Continuar';
}
```

**Depois:**

```tsx
// ✅ Apenas status válidos
const disponíveis = avaliacoes.filter(
  (a) => a.status === 'iniciada' || a.status === 'em_andamento'
);

{
  a.status === 'iniciada' ? 'Iniciar' : 'Continuar';
}
```

---

## 📊 Testes Afetados

Os seguintes testes já validavam que 'liberada' não deve ser usado:

- ✅ [**tests**/api/avaliacoes-status-iniciada.test.ts](../__tests__/api/avaliacoes-status-iniciada.test.ts)

**Nenhum teste foi quebrado** pois as APIs de criação já usavam `'iniciada'` corretamente.

---

## 🚀 Benefícios da Mudança

1. ✅ **Código mais limpo**: Removidas verificações desnecessárias
2. ✅ **Menos confusão**: Desenvolvedores não verão referências a status inválido
3. ✅ **Consistência**: Código alinhado com constraint do banco
4. ✅ **Manutenibilidade**: Mais fácil entender o fluxo de status

---

## ⚠️ Ações de Acompanhamento (Opcional)

Se houver necessidade de limpar completamente o enum no banco:

```sql
-- Criar novo enum sem 'liberada'
CREATE TYPE status_avaliacao_new AS ENUM ('iniciada', 'em_andamento', 'concluida', 'inativada');

-- Converter coluna
ALTER TABLE avaliacoes ALTER COLUMN status TYPE status_avaliacao_new USING status::text::status_avaliacao_new;

-- Remover enum antigo
DROP TYPE status_avaliacao;

-- Renomear novo enum
ALTER TYPE status_avaliacao_new RENAME TO status_avaliacao;
```

⚠️ **Nota**: Não é necessário executar isso agora, pois o constraint já impede uso de 'liberada'.

---

## 📝 Conclusão

Todas as referências ao status `'liberada'` foram removidas do código, alinhando a aplicação com o constraint do banco de dados. O sistema continua funcionando normalmente, mas agora está mais consistente e fácil de manter.

**Status da correção**: ✅ Concluída  
**Arquivos modificados**: 11  
**Migrations criadas**: 1  
**Testes afetados**: 0 (já validavam o comportamento correto)
