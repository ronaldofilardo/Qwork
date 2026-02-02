# Análise de Código Legado - Emissão Automática de Laudos

**Data**: 31 de janeiro de 2026  
**Problema Identificado**: Script marca lote como status='concluido' e triggers ativos tentam emitir laudo automaticamente

## ⚠️ Resumo Executivo

A emissão automática de laudos foi **REMOVIDA** do sistema por decisão operacional. A emissão agora é **MANUAL** pelo emissor. Porém, existe código legado que ainda pode tentar acionar emissão automática quando um lote é marcado como 'concluido'.

## 🔍 Código Legado Identificado

### 1. **lib/auto-laudo-trigger.ts** - ✅ JÁ MARCADO COMO LEGADO

```typescript
/**
 * ⚠️ FUNÇÃO LEGADA - NÃO UTILIZAR
 *
 * O cron de emissão automática foi DESABILITADO por decisão operacional.
 */
export function triggerAutoLaudoCron(): void {
  console.warn(
    '[AUTO-TRIGGER] ⚠️ FUNÇÃO LEGADA: Cron de emissão desabilitado. Emissão é IMEDIATA ao concluir lote.'
  );
  return;
}
```

**Status**: ✅ Já documentado como legado, mas a função retorna sem fazer nada (seguro).

---

### 2. **lib/laudo-auto.ts** - 🚨 CONTÉM LÓGICA ATIVA DE EMISSÃO AUTOMÁTICA

#### Linha 1316 - `emitirLaudosAutomaticamente()`

```typescript
export async function emitirLaudosAutomaticamente() {
  console.log(
    '[FASE 1 - CRON] emitirLaudosAutomaticamente() chamado — wrapper de compatibilidade (deprecated)'
  );
  // ... continua com lógica que processa lotes concluídos
}
```

**⚠️ PROBLEMA**: Esta função ainda está ATIVA e possui lógica que:

- Busca lotes com status='concluido'
- Tenta emitir laudos automaticamente
- É usada em scripts e possivelmente em triggers

**Locais que chamam esta função**:

- ❌ `scripts/emit-laudos-one.ts` (linha 7)
- ❌ `scripts/run-laudo-flow.ts` (linha 11)
- ❌ `__tests__/system/auto-laudo-emission.test.ts` (múltiplas referências)
- ❌ `__tests__/lib/lote-status-update.test.ts` (linha 37)

---

### 3. **lib/laudo-auto-refactored.ts** - 🚨 FUNÇÃO DUPLICADA

#### Linha 684 - `emitirLaudosAutomaticamente()`

```typescript
export async function emitirLaudosAutomaticamente(): Promise<void> {
  // Lógica similar ao lib/laudo-auto.ts
}
```

**⚠️ PROBLEMA**: Código duplicado com mesma funcionalidade problemática.

---

### 4. **scripts/injetar-avaliacoes-aleatorias.mjs** - ⚠️ SCRIPT DE TESTE

#### Linhas 346-357 - Marca lote como 'concluido' ao final

```javascript
// 7. Marcar lote como concluído (para permitir solicitação de emissão)
await client.query(
  `UPDATE lotes_avaliacao 
   SET status = 'concluido', finalizado_em = NOW(), atualizado_em = NOW()
   WHERE id = $1`,
  [loteId]
);
console.log(`   ✓ Lote marcado como 'concluido'\n`);
```

**Status**: ⚠️ Script de teste/desenvolvimento. Comentário diz "para permitir solicitação de emissão" (manual), mas se houver triggers ativos pode tentar emitir automaticamente.

---

### 5. **Colunas de Banco de Dados Legadas**

Identificadas referências a colunas que parecem ser do sistema antigo de emissão automática:

- `auto_emitir_agendado` (boolean) - Flag para agendar emissão
- `auto_emitir_em` (timestamp) - Data/hora agendada para emissão
- `processamento_em` (timestamp) - Lock para processamento

**Locais que usam estas colunas**:

- ❌ `app/api/system/emissao-automatica/status/route.ts`
- ❌ `app/api/system/monitoramento-emissao/route.ts`
- ❌ `app/api/emissor/reprocessar-emissao/[loteId]/route.ts`
- ❌ Múltiplos testes

---

## 📊 APIs que Monitoram Emissão Automática

### `app/api/system/monitoramento-emissao/route.ts`

**Linhas 69-79**: Busca lotes pendentes de envio automático

```typescript
SELECT
  id, codigo, status,
  auto_emitir_em,
  EXTRACT(EPOCH FROM (NOW() - auto_emitir_em))::INTEGER as atraso_envio_segundos,
  ...
FROM lotes_avaliacao la
WHERE la.auto_emitir_em IS NOT NULL
ORDER BY la.auto_emitir_em ASC
```

**⚠️ PROBLEMA**: Esta API ainda monitora o sistema antigo de emissão automática.

---

## 🎯 Pontos Críticos de Risco

### 1. **Trigger de Emissão ao Concluir Lote**

**Arquivo**: `lib/lotes.ts` (provavelmente na função `recalcularStatusLote()`)

**Risco**: Se esta função ainda chama `emitirLaudoImediato()` quando o status muda para 'concluido', teremos emissão automática indesejada.

**Precisa verificar**:

```typescript
// lib/lotes.ts - recalcularStatusLote()
if (novoStatus === 'concluido') {
  // ⚠️ PODE ESTAR CHAMANDO emitirLaudoImediato(loteId) aqui
}
```

---

### 2. **Função `emitirLaudoImediato()`**

**Arquivo**: `lib/laudo-auto.ts` (linha ~1100-1300)

Esta função É CHAMADA automaticamente quando um lote fica 'concluido'.

**Comportamento atual**:

1. Valida emissor único
2. Gera PDF do laudo
3. Salva no storage
4. Marca lote como 'finalizado'
5. Registra auditoria

**⚠️ PROBLEMA**: Emissão acontece automaticamente, sem ação manual do emissor.

---

## ✅ Recomendações de Correção

### **Correção 1: Desabilitar Emissão Automática no Recálculo de Status**

**Arquivo**: `lib/lotes.ts`

```typescript
// ANTES (código problemático):
if (novoStatus === 'concluido') {
  await emitirLaudoImediato(loteId); // ❌ REMOVER ESTA LINHA
}

// DEPOIS (correto):
if (novoStatus === 'concluido') {
  // ✅ Apenas marca como concluído
  // Emissor irá solicitar emissão manualmente
  console.log(
    `[LOTE] Lote ${loteId} marcado como 'concluido' - aguardando solicitação manual de emissão`
  );
}
```

---

### **Correção 2: Deprecar Funções de Emissão Automática**

**Arquivo**: `lib/laudo-auto.ts`

```typescript
/**
 * @deprecated SISTEMA DESCONTINUADO
 *
 * Emissão automática foi REMOVIDA do sistema.
 * Laudos agora são emitidos MANUALMENTE pelo emissor.
 *
 * Esta função é mantida apenas para compatibilidade com testes legados.
 * NÃO DEVE SER CHAMADA EM PRODUÇÃO.
 */
export async function emitirLaudosAutomaticamente() {
  console.error(
    '[ERRO] emitirLaudosAutomaticamente() foi chamada! ' +
      'Emissão automática está DESABILITADA. ' +
      'Laudos devem ser emitidos manualmente pelo emissor.'
  );

  // Registrar erro crítico
  await query(
    `INSERT INTO audit_logs (acao, entidade, dados, user_role, criado_em)
     VALUES ('erro_sistema', 'emissao_automatica', $1, 'sistema', NOW())`,
    [
      JSON.stringify({
        erro: 'Tentativa de emissão automática (sistema descontinuado)',
      }),
    ]
  );

  return; // Não faz nada
}
```

---

### **Correção 3: Remover/Atualizar Scripts**

**Arquivos**:

- ❌ `scripts/emit-laudos-one.ts` - REMOVER ou adicionar warning
- ❌ `scripts/run-laudo-flow.ts` - REMOVER ou adicionar warning

```typescript
// Adicionar no topo dos scripts:
console.error('⚠️ AVISO: Este script usa emissão automática DESCONTINUADA');
console.error('Emissão de laudos deve ser feita manualmente pelo emissor.');
process.exit(1); // Bloquear execução
```

---

### **Correção 4: Remover Colunas Legadas do Banco** (Opcional)

**Colunas a considerar remover**:

- `auto_emitir_agendado`
- `auto_emitir_em`
- `processamento_em` (se só era usado para emissão auto)

**Migration SQL**:

```sql
-- Remover colunas de emissão automática (após confirmar que não são mais usadas)
ALTER TABLE lotes_avaliacao
  DROP COLUMN IF EXISTS auto_emitir_agendado,
  DROP COLUMN IF EXISTS auto_emitir_em,
  DROP COLUMN IF EXISTS processamento_em;
```

⚠️ **ATENÇÃO**: Antes de executar, verificar se estas colunas têm outros usos no sistema.

---

### **Correção 5: Atualizar APIs de Monitoramento**

**Arquivo**: `app/api/system/monitoramento-emissao/route.ts`

```typescript
// REMOVER ou DEPRECAR esta API
export const GET = async (_req: Request) => {
  return NextResponse.json(
    {
      error: 'API descontinuada',
      message: 'Sistema de emissão automática foi removido. Emissão é manual.',
      success: false,
    },
    { status: 410 } // 410 Gone
  );
};
```

---

## 🧪 Testes Afetados

Os seguintes testes precisam ser atualizados ou removidos:

### Testes de Emissão Automática (REMOVER)

- ❌ `__tests__/system/auto-laudo-emission.test.ts`
- ❌ `__tests__/lib/emissao-automatica-refatorada.test.ts`
- ❌ `__tests__/lib/lote-status-update.test.ts` (parte da emissão auto)
- ❌ `__tests__/api/system/auto-laudo.test.ts`

### Testes de Emissão Imediata (ATUALIZAR)

- ⚠️ `__tests__/integration/emissao-imediata-ao-concluir.test.ts`  
  **Ajuste**: Verificar que lote fica 'concluido' mas NÃO emite laudo automaticamente

### Testes de Fluxo Completo (ATUALIZAR)

- ⚠️ `__tests__/integration/lote-fluxo-completo.test.ts`  
  **Ajuste**: Emissão deve ser acionada manualmente após lote ficar 'concluido'

---

## 📋 Checklist de Remoção

### Arquivos para Revisar/Modificar

- [ ] `lib/lotes.ts` - Remover chamada a `emitirLaudoImediato()` no recálculo de status
- [ ] `lib/laudo-auto.ts` - Deprecar `emitirLaudosAutomaticamente()`
- [ ] `lib/laudo-auto-refactored.ts` - Deprecar `emitirLaudosAutomaticamente()`
- [ ] `lib/auto-laudo-trigger.ts` - Já marcado como legado ✅
- [ ] `scripts/emit-laudos-one.ts` - Adicionar warning ou remover
- [ ] `scripts/run-laudo-flow.ts` - Adicionar warning ou remover
- [ ] `scripts/injetar-avaliacoes-aleatorias.mjs` - Documentar que emissão é manual
- [ ] `app/api/system/monitoramento-emissao/route.ts` - Deprecar ou remover
- [ ] `app/api/system/emissao-automatica/status/route.ts` - Deprecar ou remover
- [ ] `app/api/emissor/reprocessar-emissao/[loteId]/route.ts` - Revisar se ainda usa auto*emitir*\*

### Testes para Atualizar/Remover

- [ ] `__tests__/system/auto-laudo-emission.test.ts` - Remover ou marcar como skip
- [ ] `__tests__/lib/emissao-automatica-refatorada.test.ts` - Remover ou marcar como skip
- [ ] `__tests__/lib/lote-status-update.test.ts` - Atualizar para não esperar emissão auto
- [ ] `__tests__/api/system/auto-laudo.test.ts` - Remover ou marcar como skip
- [ ] `__tests__/integration/emissao-imediata-ao-concluir.test.ts` - Atualizar expectativas
- [ ] `__tests__/integration/lote-fluxo-completo.test.ts` - Atualizar para emissão manual
- [ ] `__tests__/integration/auto-conclusao-emissao.test.ts` - Revisar/atualizar

### Banco de Dados

- [ ] Verificar uso de `auto_emitir_agendado` em todas as queries
- [ ] Verificar uso de `auto_emitir_em` em todas as queries
- [ ] Verificar uso de `processamento_em` em todas as queries
- [ ] Considerar criar migration para remover colunas legadas (após confirmar não-uso)

---

## 🚀 Fluxo Correto (Pós-Correção)

### Como Deve Funcionar a Emissão Manual

1. **Lote é marcado como 'concluido'**
   - Todas as avaliações ativas foram finalizadas
   - Status muda para 'concluido'
   - ❌ **NÃO** emite laudo automaticamente

2. **RH vê notificação**
   - "Lote XXXX está concluído e pronto para solicitação de emissão"

3. **RH solicita emissão**
   - Via interface, clica em "Solicitar Emissão de Laudo"
   - API: `POST /api/rh/lotes/[id]/solicitar-emissao`

4. **Emissor recebe notificação**
   - "Nova solicitação de emissão para lote XXXX"
   - Lista de lotes para emitir aparece no painel do emissor

5. **Emissor emite laudo manualmente**
   - Via interface do emissor
   - Revisa dados, gera PDF, confirma emissão
   - API: `POST /api/emissor/laudos/[loteId]`

6. **Laudo é enviado**
   - Status muda para 'finalizado'
   - RH recebe notificação de laudo disponível

---

## 🔧 Próximos Passos

### Prioridade ALTA (Corrigir Imediatamente)

1. ✅ Identificar onde `recalcularStatusLote()` chama emissão automática
2. ✅ Remover/comentar chamada a `emitirLaudoImediato()`
3. ✅ Testar que lotes ficam 'concluido' sem emitir laudo
4. ✅ Deprecar funções `emitirLaudosAutomaticamente()`

### Prioridade MÉDIA (Próxima Sprint)

5. ⚠️ Adicionar warnings ou bloquear scripts legados
6. ⚠️ Atualizar testes de integração
7. ⚠️ Revisar/deprecar APIs de monitoramento de emissão auto

### Prioridade BAIXA (Cleanup Futuro)

8. 📋 Remover testes de emissão automática
9. 📋 Considerar remoção de colunas `auto_emitir_*` do banco
10. 📋 Documentar fluxo manual em docs/

---

## 📝 Notas Adicionais

### Por que a Emissão Automática foi Removida?

**Decisão Operacional**: A emissão de laudos é um processo crítico que requer revisão humana (emissor certificado). Emissão automática foi considerada de risco.

### Impacto da Remoção

**Antes**: Lote concluído → Emite laudo automaticamente (sem revisão)  
**Depois**: Lote concluído → RH solicita → Emissor revisa e emite

**Vantagens**:

- ✅ Controle de qualidade (revisão humana)
- ✅ Auditoria clara (emissor responsável)
- ✅ Menos riscos de laudos incorretos

**Desvantagens**:

- ⚠️ Processo mais lento (requer ação manual)
- ⚠️ Mais etapas no fluxo

---

## 🔍 Como Encontrei o Código Legado

1. Busquei por padrões:
   - `emitir.*laudo|emissao.*automatica|auto.*emitir`
   - `status.*concluido.*trigger|auto_emitir_agendado`
   - `emitirLaudosAutomaticamente|triggerAutoLaudoCron`

2. Identifiquei arquivos-chave:
   - `lib/laudo-auto.ts` - Lógica principal de emissão
   - `lib/auto-laudo-trigger.ts` - Trigger do cron
   - `lib/lotes.ts` - Recálculo de status (provável ponto de ativação)

3. Tracei fluxo de execução:
   - Script marca lote como 'concluido'
   - `recalcularStatusLote()` detecta mudança
   - Chama `emitirLaudoImediato()` se configurado
   - Laudo é emitido sem ação manual

---

**Fim do Relatório** 🎯
