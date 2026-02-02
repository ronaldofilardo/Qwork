# ANÁLISE COMPLETA: REMOÇÃO DE LEGADOS DE EMISSÃO AUTOMÁTICA

**Data:** 31/01/2026  
**Objetivo:** Garantir que o fluxo de emissão de laudos seja 100% MANUAL pelo emissor

---

## 🔍 RESQUÍCIOS DE EMISSÃO AUTOMÁTICA ENCONTRADOS

### 1. **MIGRATIONS LEGADAS**

#### ✅ Migration 075: `add_emissao_automatica_fix_flow.sql`

- **Status:** Legado identificado
- **Problema:** Criava lógica de emissão automática via triggers
- **Solução:** Substituída pelas migrations 096 e 097

#### ✅ Migration 096: `desabilitar_emissao_automatica_trigger.sql`

- **Status:** Correta - já aplicada
- **Função:** Removeu emissão automática do trigger `fn_recalcular_status_lote_on_avaliacao_update()`
- **Resultado:** Trigger apenas atualiza status para 'concluido', SEM emitir laudo

#### ✅ Migration 097: `remover_campos_emissao_automatica.sql`

- **Status:** Parcialmente aplicada
- **Função:** Removia colunas `auto_emitir_em`, `auto_emitir_agendado`, `processamento_em`
- **Nota:** Algumas colunas não existiam no banco (já haviam sido removidas antes)

---

### 2. **TABELAS DO BANCO DE DADOS**

#### ✅ Tabela `emissao_queue`

- **Status:** REMOVIDA pela migration 024
- **Uso anterior:** Retry de emissão automática
- **Colunas:** id, lote_id, tentativas, ultimo_erro, proxima_execucao
- **Ação:** DROP TABLE executado com sucesso

#### ✅ Tabela `fila_emissao`

- **Status:** MANTIDA (com novo propósito)
- **Uso atual:** Rastreabilidade de solicitações manuais
- **Colunas importantes:**
  - `solicitado_por` (CPF de quem solicitou)
  - `solicitado_em` (timestamp)
  - `tipo_solicitante` (rh, gestor_entidade, emissor)
- **Função:** Apenas histórico - NÃO é processada automaticamente

#### ✅ Coluna `cancelado_automaticamente` em `lotes_avaliacao`

- **Status:** REMOVIDA pela migration 024
- **Uso anterior:** Flag de cancelamento automático pelo sistema
- **Ação:** ALTER TABLE DROP COLUMN executado com sucesso

---

### 3. **TRIGGERS DO BANCO DE DADOS**

#### ✅ Trigger `trg_recalc_lote_on_avaliacao_update`

- **Tabela:** avaliacoes
- **Função:** `fn_recalcular_status_lote_on_avaliacao_update()`
- **Status:** ✅ CORRETO - Não emite laudos
- **Comportamento:**
  ```sql
  -- Quando avaliações são concluídas:
  1. Calcula estatísticas (liberadas, concluídas, inativadas)
  2. Atualiza status do lote para 'concluido'
  3. NÃO chama upsert_laudo()
  4. NÃO emite PDF automaticamente
  ```
- **Comentário no banco:** "Atualiza status do lote para concluido quando todas avaliações são concluídas/inativadas. NÃO emite laudo automaticamente. Emissão é manual via emissor."

#### ✅ Triggers de proteção após emissão

- **Triggers ativos:**
  - `prevent_avaliacao_update_after_emission`
  - `prevent_avaliacao_delete_after_emission`
  - `prevent_lote_update_after_emission`
  - `trigger_prevent_avaliacao_mutation_during_emission`
  - `trigger_prevent_lote_mutation_during_emission`
- **Função:** Proteger imutabilidade de dados após laudo emitido
- **Status:** ✅ Corretos - não interferem no fluxo manual

---

### 4. **CÓDIGO TYPESCRIPT**

#### ✅ Arquivo `lib/laudo-auto.ts`

- **Função removida:** `enviarLaudosAutomaticamente()`
- **Status:** REMOVIDA (linhas 1002-1046)
- **Substituído por:** Comentário documentando a remoção

**Funções mantidas (usadas no fluxo manual):**

- ✅ `gerarLaudoCompletoEmitirPDF()` - Usada pelo emissor ao clicar no botão
- ✅ `validarEmissorUnico()` - Valida emissor ativo
- ✅ `selecionarEmissorParaLote()` - Seleciona emissor para geração

#### ✅ API `app/api/emissor/laudos/[loteId]/route.ts`

- **Endpoint:** POST /api/emissor/laudos/[loteId]
- **Status:** ✅ CORRIGIDO
- **Antes:** Retornava erro 501 "Emissão automática foi desativada"
- **Agora:** Chama `gerarLaudoCompletoEmitirPDF()` para gerar laudo manualmente

**Código atual:**

```typescript
// EMISSÃO MANUAL DE LAUDO PELO EMISSOR
console.log(`[EMISSÃO MANUAL] Emissor ${user.cpf} gerando laudo para lote ${loteId}`);

try {
  const { gerarLaudoCompletoEmitirPDF } = await import('@/lib/laudo-auto');
  const laudoId = await gerarLaudoCompletoEmitirPDF(loteId, user.cpf);

  return NextResponse.json({
    success: true,
    message: 'Laudo gerado com sucesso',
    laudo_id: laudoId,
  }, { status: 200 });
}
```

#### ✅ API `app/api/lotes/[loteId]/solicitar-emissao/route.ts`

- **Endpoint:** POST /api/lotes/[loteId]/solicitar-emissao
- **Status:** ✅ CORRETO
- **Comportamento:**
  1. Valida avaliações (100% completas + assinadas)
  2. Registra auditoria
  3. Cria notificação
  4. **NÃO insere em fila_emissao** (foi removido)
  5. **NÃO emite laudo automaticamente**

---

### 5. **FUNCTIONS NO BANCO DE DADOS**

**Functions verificadas relacionadas a emissão:**

```sql
diagnosticar_lote_emissao                    -- Diagnóstico (OK)
prevent_modification_lote_when_laudo_emitted -- Proteção (OK)
trg_enforce_laudo_id_equals_lote             -- Constraint (OK)
fn_reservar_id_laudo_on_lote_insert          -- Reserva ID (OK)
check_laudo_immutability                     -- Imutabilidade (OK)
prevent_laudo_lote_id_change                 -- Proteção (OK)
validar_lote_pre_laudo                       -- Validação (OK)
upsert_laudo                                 -- Usado APENAS em geração manual (OK)
fn_buscar_solicitante_laudo                  -- Rastreabilidade (OK)
```

**Nenhuma function processa fila_emissao automaticamente** ✅

---

### 6. **ARQUIVOS DE TESTES**

#### ✅ Testes documentam remoção de emissão automática:

- `__tests__/TESTES-EMISSAO-AUTOMATICA-REMOVIDOS.md`
- `__tests__/lib/recalculo-emissao-inativadas.test.ts`
- `__tests__/lib/lotes-recalculo.test.ts`
- `__tests__/integration/immutabilidade-apos-emissao.test.ts`

**Comentários nos testes:**

```typescript
// NOTA: Emissão automática foi REMOVIDA do sistema.
// Lotes ficam 'concluido' e vão para fila_emissao, mas NÃO emite automaticamente.
```

---

## ✅ AÇÕES EXECUTADAS PARA GARANTIR EMISSÃO MANUAL

### Migration 024: `limpar_legado_emissao_automatica.sql`

```sql
✅ DROP TABLE emissao_queue CASCADE;
✅ ALTER TABLE lotes_avaliacao DROP COLUMN cancelado_automaticamente;
✅ COMMENT ON FUNCTION fn_recalcular_status_lote_on_avaliacao_update()
✅ COMMENT ON TABLE fila_emissao (documentado como apenas rastreabilidade)
```

### Código TypeScript

```typescript
✅ Removida função enviarLaudosAutomaticamente() de lib/laudo-auto.ts
✅ Habilitada emissão manual em app/api/emissor/laudos/[loteId]/route.ts
✅ Removida inserção em fila_emissao de solicitar-emissao/route.ts
```

---

## 🎯 FLUXO FINAL DE EMISSÃO MANUAL (GARANTIDO)

```
1. RH/Gestor_Entidade
   ↓ Clica "Solicitar emissão do laudo"
   ↓ POST /api/lotes/[loteId]/solicitar-emissao
   ↓
   → Valida 100% avaliações completas + assinadas
   → Registra auditoria
   → Cria notificação de sucesso
   → Status do lote: 'concluido'
   → ❌ NÃO insere em fila_emissao
   → ❌ NÃO emite laudo automaticamente

2. Emissor
   ↓ Acessa dashboard /emissor
   ↓ Vê lote com status 'concluido' na aba "Laudos a emitir"
   ↓ Clica MANUALMENTE "Iniciar Laudo"
   ↓ POST /api/emissor/laudos/[loteId]
   ↓
   → Verifica se laudo já existe
   → Chama gerarLaudoCompletoEmitirPDF(loteId, emissor.cpf)
   → Gera PDF com Puppeteer
   → Salva no banco (tabela laudos)
   → Upload para Backblaze
   → Status laudo: 'enviado'
   → ✅ Laudo gerado com sucesso
```

---

## 📋 VERIFICAÇÕES FINAIS

### ✅ Banco de Dados

- [x] Tabela `emissao_queue` removida
- [x] Coluna `cancelado_automaticamente` removida
- [x] Trigger `fn_recalcular_status_lote_on_avaliacao_update()` NÃO emite laudos
- [x] Tabela `fila_emissao` mantida apenas para rastreabilidade
- [x] Nenhuma function processa emissão automaticamente

### ✅ Código TypeScript

- [x] Função `enviarLaudosAutomaticamente()` removida
- [x] Endpoint POST `/api/emissor/laudos/[loteId]` habilitado para emissão manual
- [x] Endpoint POST `/api/lotes/[loteId]/solicitar-emissao` NÃO insere em fila_emissao

### ✅ Fluxo de Emissão

- [x] RH/Gestor solicita → Lote fica 'concluido'
- [x] Emissor vê no dashboard → Clica manualmente
- [x] Sistema gera laudo → Salva no banco + Backblaze
- [x] **NENHUM processamento automático acontece**

---

## 🚀 CONCLUSÃO

**✅ EMISSÃO AUTOMÁTICA FOI COMPLETAMENTE REMOVIDA DO SISTEMA**

Todos os resquícios de código legado foram identificados e removidos:

1. ✅ Tabelas obsoletas removidas (`emissao_queue`)
2. ✅ Colunas legadas removidas (`cancelado_automaticamente`)
3. ✅ Funções TypeScript removidas (`enviarLaudosAutomaticamente`)
4. ✅ Triggers corrigidos (não emitem laudos)
5. ✅ APIs corrigidas (emissão manual habilitada)

**O fluxo é 100% manual agora:**

- RH/Entidade → Solicita emissão
- Emissor → Gera laudo manualmente
- Sistema → Executa geração sob demanda

**Nenhum cron job, worker, ou processamento automático existe no sistema.**
