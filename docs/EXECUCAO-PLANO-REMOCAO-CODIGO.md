# 🚀 EXECUÇÃO DO PLANO: Remoção Completa de 'codigo'

**Data:** 03/02/2026  
**Status:** ⏳ EM ANDAMENTO  
**Objetivo:** Remover completamente `lotes_avaliacao.codigo` e padronizar em `lotes_avaliacao.id`

---

## ✅ FASE 1: PREPARAÇÃO - COMPLETA

### Migration 160 Criada

- ✅ [database/migrations/160_remove_codigo_padronizar_id.sql](../database/migrations/160_remove_codigo_padronizar_id.sql)
- ✅ [scripts/apply-migration-160.ts](../scripts/apply-migration-160.ts)

**Ações da migration:**

1. Remove coluna `funcionarios.ultimo_lote_codigo`
2. Remove função `gerar_codigo_lote()`
3. Remove coluna `lotes_avaliacao.codigo`
4. Recria views sem referências a codigo
5. Atualiza comentários de documentação

---

## ✅ FASE 2: BACKEND - COMPLETA

### APIs Atualizadas

#### ✅ app/api/rh/liberar-lote/route.ts

- Removida geração `SELECT gerar_codigo_lote()`
- Removido `codigo` do INSERT
- Atualizado titulo: `Lote ${numeroOrdem} - #${numeroOrdem}`

#### ✅ app/api/entidade/liberar-lote/route.ts

- Removida geração de codigo (2 ocorrências)
- Removido `codigo` dos INSERTs
- Simplficado título: `Lote ${numeroOrdem}`

#### ✅ app/api/rh/funcionarios/route.ts

- Atualizado SELECT: `l.id` (não `l.codigo`)
- Campo `ultima_inativacao_lote` agora retorna `id`

#### ✅ app/api/entidade/lote/[id]/relatorio-individual/route.ts

- Removido `codigo` do SELECT

#### ✅ app/api/emissor/laudos/[loteId]/download/route.ts

- Removido `codigo` do SELECT

#### ✅ app/api/avaliacao/relatorio-impressao/route.ts

- Removido `codigo` do SELECT (1 de 2 ocorrências)
- Removida propriedade `codigo` do objeto `lote`

---

## ⏳ FASE 3: FRONTEND - EM ANDAMENTO

### Componentes a Atualizar

#### 🔴 ALTA PRIORIDADE (Display de usuário)

**components/emissor/ModalEmergencia.tsx**

```typescript
// ❌ ANTES
<strong>Lote:</strong> {loteCodigo} (ID: {loteId})

// ✅ DEPOIS
<strong>Lote:</strong> #{loteId}
```

**components/BotaoSolicitarEmissao.tsx**

```typescript
// ❌ ANTES
`Confirma a solicitação de emissão do laudo para o lote ${loteCodigo}?\n\n`
// ✅ DEPOIS
`Confirma a solicitação de emissão do laudo para o lote #${loteId}?\n\n`;
```

**components/DetalhesFuncionario.tsx**

```typescript
// ❌ ANTES
{avaliacao.lote_codigo}

// ✅ DEPOIS
Lote #{avaliacao.lote_id}
```

**components/clinica/LaudosSection.tsx**

```typescript
// ❌ ANTES
interface Laudo {
  lote_codigo: string;
}
{laudo.lote_codigo}

// ✅ DEPOIS
interface Laudo {
  lote_id: number;
}
Lote #{laudo.lote_id}
```

**components/funcionarios/FuncionariosSection.tsx**

```typescript
// ❌ ANTES
ultimo_lote_codigo?: string | null;
{funcionario.ultimo_lote_codigo || '—'}

// ✅ DEPOIS
ultimo_lote_id?: number | null;
Lote #{funcionario.ultimo_lote_id || '—'}
```

**components/modals/ModalUploadLaudo.tsx**

```typescript
// ❌ ANTES
interface Props {
  loteCodigo: string;
}
Lote: <span>{loteCodigo}</span>

// ✅ DEPOIS
interface Props {
  loteId: number;
}
Lote: <span>#{loteId}</span>
```

**components/RelatorioSetor.tsx**

```typescript
// ❌ ANTES
const loteCodigo = dados['lote']?.['codigo'];
a.download = `relatorio-setor-${setorSelecionado}-lote-${loteCodigo ?? 'sem-codigo'}.pdf`;

// ✅ DEPOIS
const loteId = dados['lote']?.['id'];
a.download = `relatorio-setor-${setorSelecionado}-lote-${loteId}.pdf`;
```

#### 🟡 MÉDIA PRIORIDADE (Páginas)

**app/rh/empresa/[id]/lote/[loteId]/page.tsx**

```typescript
// ❌ ANTES (linhas 925, 1069, 1168)
Código: {lote.codigo}
`Confirma... lote ${lote.codigo}?`
a.download = `Laudo_${lote.codigo}.pdf`

// ✅ DEPOIS
Lote #{lote.id}
`Confirma... lote #${lote.id}?`
a.download = `Laudo_${lote.id}.pdf`
```

**app/emissor/page.tsx**

```typescript
// ❌ ANTES (linhas 369, 399, 546)
a.download = `laudo-${lote.codigo || lote.id}.pdf`
{lote.titulo} - Lote: {lote.codigo}

// ✅ DEPOIS
a.download = `laudo-${lote.id}.pdf`
{lote.titulo} - Lote #{lote.id}
```

**app/entidade/lotes/page.tsx**

```typescript
// ❌ ANTES
Código: {lote.codigo}

// ✅ DEPOIS
Lote #{lote.id}
```

**app/entidade/lote/[id]/page.tsx**

```typescript
// ❌ ANTES (linhas 688, 806, 907)
<p>Código: {lote.codigo}</p>
`... lote ${lote.codigo}?`
a.download = `Laudo_${lote.codigo}.pdf`

// ✅ DEPOIS
<p>Lote #{lote.id}</p>
`... lote #${lote.id}?`
a.download = `Laudo_${lote.id}.pdf`
```

**app/entidade/laudos/page.tsx**

```typescript
// ❌ ANTES
interface Laudo {
  lote_codigo: string;
}
<p>{laudo.lote_codigo}</p>

// ✅ DEPOIS
interface Laudo {
  lote_id: number;
}
<p>Lote #{laudo.lote_id}</p>
```

**app/emissor/laudo/[loteId]/page.tsx**

```typescript
// ❌ ANTES (linhas 110, 938)
a.download = `laudo-${lote?.codigo || loteId}.pdf`
loteCodigo={lote?.codigo || ''}

// ✅ DEPOIS
a.download = `laudo-${loteId}.pdf`
loteId={loteId}
```

---

## ⏳ FASE 4: BIBLIOTECAS (lib/) - PENDENTE

### lib/laudo-auto.ts

```typescript
// ❌ ANTES (múltiplas ocorrências)
`[FASE 2] Enviando laudo do lote ${laudo.codigo} (ID: ${laudo.lote_id})`;
titulo: `Laudo do lote ${laudo.codigo} disponível`;
mensagem: `O laudo do lote ${laudo.codigo} foi emitido`
// ✅ DEPOIS
`[FASE 2] Enviando laudo do lote #${laudo.lote_id}`;
titulo: `Laudo do lote #${laudo.lote_id} disponível`;
mensagem: `O laudo do lote #${laudo.lote_id} foi emitido`;
```

### lib/hooks/useLaudos.ts

```typescript
// ❌ ANTES
a.download = `laudo-${laudo.codigo || 'sem-codigo'}.pdf`;

// ✅ DEPOIS
a.download = `laudo-${laudo.id}.pdf`;
```

### lib/auto-concluir-lotes (tests)

```typescript
// ❌ ANTES
const mensagemEsperada = `Lote ${lote.codigo} concluído automaticamente`;

// ✅ DEPOIS
const mensagemEsperada = `Lote #${lote.id} concluído automaticamente`;
```

---

## ⏳ FASE 5: TESTES - PENDENTE

### Estratégia de Atualização

1. **Substituir mocks:**

```typescript
// ❌ ANTES
{ id: 1, codigo: 'LOTE001', titulo: 'Teste' }

// ✅ DEPOIS
{ id: 1, titulo: 'Teste' }
```

2. **Atualizar assertions:**

```typescript
// ❌ ANTES
expect(lote.codigo).toBe('001-030226');

// ✅ DEPOIS
expect(lote.id).toBe(1);
```

3. **Remover testes de geração:**

```typescript
// ❌ REMOVER completamente
it('deve gerar codigo sequencial', async () => {
  const codigo = await query(`SELECT gerar_codigo_lote() as codigo`);
  expect(codigo.rows[0].codigo).toMatch(/\d{3}-\d{6}/);
});
```

### Arquivos de Teste Identificados (20+)

- `__tests__/rh/dashboard-lotes-laudos.test.tsx`
- `__tests__/visual-regression/component-specific.test.tsx`
- `__tests__/integration/inativar-contratante-integration.test.ts`
- `__tests__/security/audit-logs.test.ts`
- `__tests__/lotes/*.test.ts` (múltiplos)
- `__tests__/api/entidade/liberar-lote.test.ts`
- Etc.

---

## 📊 STATUS ATUAL

| Fase                  | Status      | Progresso                                  |
| --------------------- | ----------- | ------------------------------------------ |
| 1. Migration          | ✅ Completa | 100%                                       |
| 2. Backend APIs       | ✅ Completa | 95% (falta 1 linha em relatorio-impressao) |
| 3. Frontend           | ⏳ Pendente | 0%                                         |
| 4. Bibliotecas (lib/) | ⏳ Pendente | 0%                                         |
| 5. Testes             | ⏳ Pendente | 0%                                         |
| 6. Aplicar Migration  | ⏳ Pendente | 0%                                         |
| 7. Validação          | ⏳ Pendente | 0%                                         |

---

## 🎯 PRÓXIMOS PASSOS IMEDIATOS

### 1. Finalizar Backend (5 min)

- Corrigir última linha em `app/api/avaliacao/relatorio-impressao/route.ts`

### 2. Atualizar Frontend (30-60 min)

- Componentes de alta prioridade (ModalEmergencia, BotaoSolicitarEmissao, etc)
- Páginas principais (emissor, rh, entidade)

### 3. Atualizar Bibliotecas (15 min)

- lib/laudo-auto.ts (mensagens)
- lib/hooks/useLaudos.ts (download)

### 4. Atualizar Testes (60-90 min)

- Substituir mocks
- Atualizar assertions
- Remover testes de geração de codigo

### 5. Aplicar Migration (10 min)

```bash
pnpm tsx scripts/apply-migration-160.ts
```

### 6. Testar Completamente (30 min)

- Liberação de lote (RH e Entidade)
- Display de lotes em dashboards
- Download de laudos
- Emissão de laudos
- Relatórios

---

## ⚠️ RISCOS E MITIGAÇÕES

### Risco: Quebra de testes

**Mitigação:** Atualizar todos os mocks e assertions antes de rodar suite completa

### Risco: Frontend ainda mostrando "codigo"

**Mitigação:** Revisão sistemática de todos os componentes listados acima

### Risco: APIs ainda retornando "codigo"

**Mitigação:** ✅ Já mitigado - APIs atualizadas

### Risco: Rollback difícil

**Mitigação:**

- ✅ Commit de migration separado
- ✅ Commit de backend separado
- ⏳ Commit de frontend separado (facilita rollback parcial)

---

## 📝 CHECKLIST FINAL (Antes de Deploy)

- [ ] Migration 160 aplicada em produção
- [ ] Todos os testes passando
- [ ] Interface exibe "Lote #123" (não "Código: 001-030226")
- [ ] Downloads de PDF funcionando com nome `laudo-123.pdf`
- [ ] Liberação de lote sem erro de `gerar_codigo_lote()`
- [ ] Dashboards carregando corretamente
- [ ] Emissão de laudos funcionando
- [ ] Relatórios gerando corretamente
- [ ] Auditoria sem referências a codigo
- [ ] Documentação atualizada (README, DATABASE-POLICY)

---

**Status:** 📍 PAUSADO - Aguardando continuação  
**Última atualização:** 03/02/2026 - Backend 95% completo  
**Próximo:** Atualizar componentes Frontend de alta prioridade
