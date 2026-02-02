# ⚠️ ENDPOINT OBSOLETO - NÃO UTILIZAR

## `/api/avaliacao/finalizar`

Este endpoint foi **DESATIVADO** e substituído por lógica automática.

### ❌ Problema Anterior

- Funcionários precisavam "finalizar manualmente" após a 37ª resposta
- Gerava inconsistências: avaliações completas não marcadas como concluídas
- Lotes não recalculavam status automaticamente

### ✅ Nova Implementação (Automática)

As avaliações agora são **concluídas automaticamente** quando atingem 37 respostas nos endpoints:

1. **`/api/avaliacao/save`** (usado em `app/avaliacao/grupo/[id]/page.tsx`)
2. **`/api/avaliacao/respostas`** (usado em `app/avaliacao/page.tsx`)

### 🔄 Comportamento Atual

Quando a 37ª resposta é salva:

1. ✅ Calcula resultados automaticamente
2. ✅ Marca avaliação como `status='concluida'`
3. ✅ Define timestamp `envio=NOW()`
4. ✅ Atualiza índice do funcionário
5. ✅ Recalcula status do lote
6. ✅ Cria notificação para RH/Entidade
7. ✅ Retorna `completed: true` para frontend redirecionar

### 📅 Data de Desativação

31 de janeiro de 2026

### 🗑️ Remoção Futura

Este endpoint será **removido completamente** em próxima versão após validação em produção.
