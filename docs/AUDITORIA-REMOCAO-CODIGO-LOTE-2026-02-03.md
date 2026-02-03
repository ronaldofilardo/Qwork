# 🔍 AUDITORIA COMPLETA - Remoção de 'codigo' e Padronização em 'id'

**Data:** 2026-02-03  
**Objetivo:** Remover completamente referências a 'codigo' de lote e padronizar identificação usando apenas ID (lote.id === laudo.id)

---

## 📊 SITUAÇÃO ATUAL

### ✅ JÁ CONCLUÍDO (Migration 160)

A migration [160_remove_codigo_padronizar_id.sql](../database/migrations/160_remove_codigo_padronizar_id.sql) já foi criada e inclui:

- ✅ Remove `lotes_avaliacao.codigo`
- ✅ Remove função `gerar_codigo_lote()`
- ✅ Remove `funcionarios.ultimo_lote_codigo`
- ✅ Recria views sem referências a codigo:
  - `vw_lotes_detalhados`
  - `vw_auditoria_lotes`

### ❌ PROBLEMAS IDENTIFICADOS

1. **Cards não aparecem em dashboards**
   - Dashboard de clínica: mostra cards mas ainda com referência a "código"
   - Dashboard de entidade: sistema não lista cards de lotes
   - Dashboard de emissor: lista códigos nos nomes dos lotes

2. **Coluna 'codigo' ainda existe na tabela**
   - Migration 160 não foi aplicada em produção
   - Tabela `lotes_avaliacao` ainda tem coluna `codigo`

3. **Backend APIs ainda referenciam 'codigo'**
   - 29 ocorrências em arquivos de API

4. **Frontend ainda usa 'codigo'**
   - Componentes React
   - Páginas Next.js
   - Hooks e bibliotecas

---

## 🎯 ESTRATÉGIA DE MIGRAÇÃO

### Princípio Fundamental

**ID do lote = ID do laudo (são imutáveis e únicos)**

### Formato de Display

- **Antes:** `Lote 001-030226` ou `lote.codigo`
- **Depois:** `Lote #123` ou `lote.id`

### Dados Históricos (Laudos Gerados)

- ❌ **NÃO** alterar PDFs/arquivos já gerados
- ❌ **NÃO** fazer correção retroativa em laudos imutáveis
- ✅ **SIM** atualizar apenas referências futuras

---

## 📝 PLANO DE EXECUÇÃO (4 FASES)

### FASE 1: DATABASE ✅ CRIADA (PENDENTE APLICAÇÃO)

#### Migration 160

- [x] Criada: `160_remove_codigo_padronizar_id.sql`
- [ ] **APLICAR EM PRODUÇÃO**

#### Verificação Pós-Migration

```sql
-- Verificar remoção de coluna
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'lotes_avaliacao' AND column_name = 'codigo';
-- Deve retornar 0 linhas

-- Verificar remoção de função
SELECT proname
FROM pg_proc
WHERE proname = 'gerar_codigo_lote';
-- Deve retornar 0 linhas
```

---

### FASE 2: BACKEND APIS ⚠️ EM ANDAMENTO

#### Arquivos com Referências a 'codigo':

**Alta Prioridade (Listagem de Lotes):**

1. ✅ `app/api/rh/lotes/route.ts` - Remover SELECT de codigo
2. ✅ `app/api/emissor/lotes/route.ts` - Remover codigo da query
3. ❌ `app/api/entidade/lotes/route.ts` - **CRÍTICO** (cards não aparecem)
4. ❌ `app/api/clinica/lotes/route.ts` - Se existir

**Média Prioridade (Relatórios):** 5. ❌ `app/api/rh/relatorio-lote-pdf/route.ts` - linha 145 6. ❌ `app/api/rh/relatorio-individual-pdf/route.ts` - linhas 65, 120, 175 7. ❌ `app/api/entidade/lote/[id]/relatorio-individual/route.ts` - linhas 187, 286, 341 8. ❌ `app/api/avaliacao/relatorio-impressao/route.ts` - linhas 434, 440, 619

**Baixa Prioridade (Detalhes/Download):** 9. ❌ `app/api/rh/laudos/[laudoId]/download/route.ts` - linha 93 10. ❌ `app/api/rh/laudos/route.ts` - linha 143 11. ❌ `app/api/rh/funcionarios/[cpf]/route.ts` - linha 45 12. ❌ `app/api/emissor/laudos/[loteId]/download/route.ts` - linhas 77, 84 13. ❌ `app/api/avaliacoes/inativar/route.ts` - múltiplas linhas 14. ❌ `app/api/admin/reenviar-lote/route.ts` - usa `codigoLote` como parâmetro 15. ❌ `app/api/admin/funcionarios/route.ts` - linha 37

---

### FASE 3: FRONTEND COMPONENTS 🔴 PENDENTE

#### Componentes React (~15 arquivos)

**Cards e Grids:**

1. ❌ `components/rh/LotesGrid.tsx` - linha 97: `<p>Código: {lote.id}</p>`
2. ❌ `components/emissor/ModalEmergencia.tsx` - linha 138
3. ❌ `components/RelatorioSetor.tsx` - linha 275
4. ❌ `components/BotaoSolicitarEmissao.tsx` - Se usa codigo
5. ❌ `components/DetalhesFuncionario.tsx` - Se usa codigo

**Mudança Padrão:**

```tsx
// ANTES:
<p>Código: {lote.codigo}</p>
<span>Lote {lote.codigo}</span>

// DEPOIS:
<p>Lote #{lote.id}</p>
<span>Lote #{lote.id}</span>
```

---

### FASE 4: PÁGINAS NEXT.JS 🔴 PENDENTE

#### Páginas (~10 arquivos)

**Dashboards Críticos:**

1. ❌ `app/entidade/lotes/page.tsx` - **CRÍTICO** (cards não listam)
   - Interface `LoteAvaliacao` não deve ter `codigo`
   - Cards devem exibir `Lote #{lote.id}`
2. ❌ `app/clinica/lotes/page.tsx` - Se existir
   - Mesmas mudanças

3. ❌ `app/emissor/page.tsx` - linha 814
   - `loteCodigo={lote.id}` (já correto, mas verificar uso interno)

4. ❌ `app/emissor/laudo/[loteId]/page.tsx` - linha 938
   - `loteCodigo={lote?.codigo || ''}` → `loteCodigo={lote?.id || 0}`

**Páginas de RH:** 5. ❌ `app/rh/lotes/page.tsx` - Se existir 6. ❌ `app/rh/dashboard/page.tsx` - Se existir

---

### FASE 5: BIBLIOTECAS & HOOKS 🔴 PENDENTE

#### Libs (~5 arquivos)

1. ❌ `lib/templates/laudo-html.ts` - linha 597

   ```ts
   // ANTES:
   html = html.replace('{{LOTE_CODIGO}}', etapa1.loteCodigo || '');

   // DEPOIS:
   html = html.replace('{{LOTE_ID}}', etapa1.loteId?.toString() || '');
   ```

2. ❌ `lib/audit-integration-examples.ts` - linhas 114, 134

   ```ts
   // Remover 'codigo' das queries SELECT
   'SELECT id, titulo, liberado, liberado_em, status FROM lotes_avaliacao WHERE id = $1';
   ```

3. ❌ `lib/hooks/useLotesAvaliacao.ts`
   - Interface `LoteAvaliacao` não deve ter `codigo`

4. ❌ `lib/types/database.ts` - linha 54

   ```ts
   export interface LoteAvaliacao {
     id: number;
     // codigo: string; ❌ REMOVER
     titulo: string;
     // ...
   }
   ```

5. ❌ `lib/queries.ts` - Verificar queries que selecionam codigo

---

### FASE 6: TESTES 🔴 PENDENTE

#### Arquivos de Teste (~20 arquivos)

**Testes de Componentes:**

1. ❌ `__tests__/components/DetalhesFuncionario-acesso.test.tsx` - linha 83
2. ❌ `__tests__/components/LotesGrid.test.tsx` - linha 10

**Testes de Libs:** 3. ❌ `__tests__/lib/relatorio-individual-html.test.ts` - linha 15 4. ❌ `__tests__/lib/relatorio-lote-html.test.ts` - linha 6 5. ❌ `__tests__/lib/pdf-relatorio-generator.test.ts` - linhas 57, 246 6. ❌ `__tests__/lib/hooks/useLotesAvaliacao.test.ts` - linhas 14, 126

**Testes de API:** 7. ❌ Todos os testes de API que criam/verificam lotes

**Mudança Padrão em Mocks:**

```ts
// ANTES:
const mockLote = {
  id: 1,
  codigo: 'LOTE-001',
  titulo: 'Teste',
};

// DEPOIS:
const mockLote = {
  id: 1,
  titulo: 'Teste',
};
```

---

## 🎯 CHECKLIST DE VALIDAÇÃO

### Backend

- [ ] Queries não selecionam `codigo`
- [ ] Funções não usam `gerar_codigo_lote()`
- [ ] APIs retornam apenas `id`
- [ ] Triggers não referenciam `codigo`

### Frontend

- [ ] Cards exibem `Lote #ID`
- [ ] Interfaces TypeScript não têm `codigo`
- [ ] Componentes usam `lote.id`
- [ ] Nenhum texto "Código do Lote"

### Database

- [ ] Coluna `codigo` removida de `lotes_avaliacao`
- [ ] Função `gerar_codigo_lote()` não existe
- [ ] Coluna `ultimo_lote_codigo` removida de `funcionarios`
- [ ] Views recriadas sem `codigo`

### Testes

- [ ] Todos os mocks usam apenas `id`
- [ ] Testes não verificam `codigo`
- [ ] Testes passam após mudanças

---

## 🚨 RISCOS E MITIGAÇÕES

### Risco 1: Laudos já gerados com referência a codigo

**Mitigação:** Não alterar PDFs/arquivos existentes (imutáveis)

### Risco 2: Queries antigas que ainda buscam 'codigo'

**Mitigação:** Migration 160 remove a coluna, causará erro visível para corrigir

### Risco 3: Frontend quebrando após remoção

**Mitigação:** Atualizar todos os componentes antes de aplicar migration

### Risco 4: Backup/restore com schema antigo

**Mitigação:** Documentar que backups pré-migration 160 precisam de ajuste

---

## 📈 MÉTRICAS DE SUCESSO

1. **Migration aplicada sem erros**
2. **0 referências a 'codigo' em código ativo**
3. **Cards de lotes aparecem corretamente em todos os dashboards**
4. **Formato `Lote #ID` consistente em todo sistema**
5. **Todos os testes passando**

---

## 🔗 ARQUIVOS RELACIONADOS

- [160_remove_codigo_padronizar_id.sql](../database/migrations/160_remove_codigo_padronizar_id.sql)
- [apply-migration-160.ts](../scripts/apply-migration-160.ts) - Se existir
- [EXECUCAO-PLANO-REMOCAO-CODIGO.md](./EXECUCAO-PLANO-REMOCAO-CODIGO.md) - Se existir

---

## ✅ APROVAÇÃO

**Status:** 🟡 Aguardando execução das fases  
**Próximo Passo:** Aplicar Fase 2 (Backend APIs) e Fase 3 (Frontend)  
**Responsável:** AI Assistant  
**Data Prevista:** 2026-02-03
