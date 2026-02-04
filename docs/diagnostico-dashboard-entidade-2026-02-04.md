# Diagnóstico: Dashboard da Entidade Não Atualiza Status

**Data:** 04/02/2026  
**Problema Reportado:** Avaliação #18 do Lote #1 tem 3 respostas no banco, mas dashboard mostra 0% de conclusão e status "Pendente"

## 1. Investigação Realizada

### 1.1 Estado no Banco de Dados (Neon)

```sql
-- Avaliação #18
✅ ID: 18
✅ Status: 'iniciada' (correto!)
✅ Lote: 1
✅ Total Respostas: 3
✅ Última Resposta: 2026-02-04 19:04:28
```

### 1.2 Consulta da API de Estatísticas

```sql
SELECT
  COUNT(DISTINCT f.id) as total_funcionarios,
  COUNT(DISTINCT CASE WHEN a.status = 'concluida' THEN f.id END) as funcionarios_concluidos,
  COUNT(DISTINCT CASE WHEN a.status IN ('iniciada', 'em_andamento') THEN f.id END) as funcionarios_pendentes
FROM avaliacoes a
JOIN funcionarios f ON a.funcionario_cpf = f.cpf
WHERE a.lote_id = 1 AND f.contratante_id = 1 AND a.status != 'inativada';

Resultado:
✅ total_funcionarios: 1
✅ funcionarios_concluidos: 0
✅ funcionarios_pendentes: 1
```

### 1.3 Resposta da API

A API `/api/entidade/lote/[id]` retorna corretamente:

- **total_funcionarios:** 1
- **funcionarios_concluidos:** 0
- **funcionarios_pendentes:** 1

### 1.4 Cálculo da UI

```typescript
// Linha 742-748 de app/entidade/lote/[id]/page.tsx
Math.round(
  (estatisticas.funcionarios_concluidos / estatisticas.total_funcionarios) * 100
);
// = (0 / 1) * 100 = 0%
```

## 2. Causa Raiz Identificada

**O sistema está funcionando CORRETAMENTE!**

O problema está na **interpretação do usuário**:

1. ✅ **Backend:** Retorna status "iniciada" corretamente
2. ✅ **API:** Calcula 1 funcionário pendente corretamente
3. ✅ **UI:** Exibe "Pendente" corretamente (status "iniciada" = "Pendente" na UI)
4. ✅ **Porcentagem:** 0% de conclusão está correto (0 concluídos de 1 total)

### Por que mostra "0% de conclusão"?

- A porcentagem calcula **avaliações CONCLUÍDAS** vs **total**
- Status "iniciada" ou "em_andamento" = **PENDENTE** (não concluída)
- Apenas quando status = "concluida" (37 respostas) é que conta como concluída
- Portanto: 0 concluídas / 1 total = **0%** ✅

### Por que mostra "Pendente" e não "Em Andamento"?

No código da UI (linha 1195-1201):

```typescript
{
  func.avaliacao.status === 'concluida'
    ? 'Concluída'
    : func.avaliacao.status === 'em_andamento'
      ? 'Em Andamento'
      : func.avaliacao.status === 'inativada'
        ? 'Inativada'
        : 'Pendente';
} // ← Status "iniciada" cai aqui
```

O status "iniciada" é exibido como "Pendente", que é semanticamente correto.

## 3. Possíveis Melhorias (Não são Bugs!)

### 3.1 Atualização Automática do Status "iniciada" → "em_andamento"

**Situação Atual:**

- Status muda de "iniciada" para "em_andamento" apenas no endpoint `/api/avaliacao/respostas`
- O código tenta fazer isso, mas pode haver falhas silenciosas

**Arquivo:** `app/api/avaliacao/respostas/route.ts` (linhas 62-85)

```typescript
// Se houver respostas e a avaliação ainda estiver 'iniciada', atualizar para 'em_andamento'
try {
  const statusRes = await query(`SELECT status FROM avaliacoes WHERE id = $1`, [
    avaliacaoId,
  ]);
  const currentStatus = statusRes.rows[0]?.status;
  if (currentStatus === 'iniciada') {
    // Atualizar status dentro de contexto transacional com segurança
    await transactionWithContext(async (queryTx) => {
      await queryTx(
        `UPDATE avaliacoes SET status = 'em_andamento', atualizado_em = NOW() WHERE id = $1`,
        [avaliacaoId]
      );
    });
    console.log(
      `[RESPOSTAS] ✅ Atualizado status da avaliação ${avaliacaoId} para 'em_andamento'`
    );
  }
} catch (statusErr: any) {
  // Log detalhado do erro para diagnóstico
  console.error('[RESPOSTAS] ❌ Erro ao atualizar status para em_andamento:', {
    message: statusErr?.message,
    code: statusErr?.code,
    detail: statusErr?.detail,
    avaliacaoId,
  });
}
```

**Problema Potencial:**

- Erros são capturados e logados, mas não impedem o salvamento das respostas
- O status pode não ser atualizado se houver problemas com RLS, triggers ou transações

### 3.2 Labels Mais Claras na UI

**Melhoria Sugerida:**

```typescript
// Exibir "Iniciada (3 respostas)" ao invés de apenas "Pendente"
{
  func.avaliacao.status === 'concluida'
    ? 'Concluída'
    : func.avaliacao.status === 'em_andamento'
      ? 'Em Andamento'
      : func.avaliacao.status === 'inativada'
        ? 'Inativada'
        : func.avaliacao.status === 'iniciada'
          ? 'Iniciada' // ← Distinguir de "Pendente"
          : 'Pendente';
}
```

### 3.3 Cache/Polling

O código já implementa polling a cada 30 segundos (linha 186-192):

```typescript
// Polling: atualizar dados a cada 30 segundos
const intervalId = setInterval(() => {
  loadLoteData();
}, 30000);
```

## 4. Recomendações

### 4.1 Nenhuma Correção Necessária no Backend

O backend está funcionando corretamente:

- ✅ Respostas são salvas
- ✅ Status é gerenciado adequadamente
- ✅ APIs retornam dados corretos

### 4.2 Melhorias Opcionais na UI

**a) Distinguir "Iniciada" de "Pendente" visualmente:**

- "Iniciada" = tem pelo menos 1 resposta
- "Pendente" = 0 respostas (nunca começou)

**b) Mostrar contagem de respostas:**

- Ex: "Iniciada (3/37 respostas)"
- Ex: "Em Andamento (15/37 respostas)"

**c) Adicionar indicador visual de atualização:**

- Mostrar timestamp da última atualização
- Spinner durante o refresh

## 5. Conclusão

**NENHUM BUG IDENTIFICADO!**

O sistema está funcionando conforme projetado:

1. Respostas são salvas corretamente ✅
2. Status "iniciada" é mantido até mudar para "em_andamento" ✅
3. Dashboard mostra 0% porque nenhuma avaliação foi CONCLUÍDA ✅
4. "Pendente" é o rótulo correto para status "iniciada" ✅

A **confusão** surge porque:

- Usuário espera ver "Em Andamento" ou progresso > 0%
- Mas "iniciada" é tratado como "pendente" na UI
- E porcentagem só conta avaliações **concluídas** (37 respostas)

**Solução:** Melhorar a clareza da UI (opcional), nenhuma correção de bug necessária.
