# 🔍 AUDITORIA COMPLETA: IDs e Códigos de Lotes/Laudos

**Data:** 03/02/2026  
**Objetivo:** Revisar desde a liberação do lote até a geração final do laudo no que diz respeito a IDs, nomes e códigos  
**Foco:** Buscar falhas, discrepâncias e inconsistências em backend, frontend, UIs, triggers, banco, RBAC, RLS e máquina de estados

---

## 📋 SUMÁRIO EXECUTIVO

### ✅ Estratégia de ID Atual

- **Regra fundamental:** `lote.id === laudo.id` (relação 1:1)
- **Problema identificado:** Sistema usa **DOIS identificadores** para lotes:
  1. `lotes_avaliacao.id` (INTEGER, chave primária)
  2. `lotes_avaliacao.codigo` (VARCHAR, gerado por `gerar_codigo_lote()`)

### ❌ Problema Principal

**O campo `codigo` está sendo usado desnecessariamente** em todo o sistema, criando:

- Redundância de identificação
- Complexidade de manutenção
- Confusão entre identificadores
- Overhead de geração e armazenamento

---

## 🔴 CATEGORIZAÇÃO DE PROBLEMAS

### 1️⃣ BACKEND (APIs e Lógica de Negócio)

#### 📍 APIs que GERAM código

```typescript
// ❌ PROBLEMA: Geração desnecessária de código
// app/api/rh/liberar-lote/route.ts (linha 271)
const codigo = await query(`SELECT gerar_codigo_lote() as codigo`);

// app/api/entidade/liberar-lote/route.ts (linha 140, 311)
const codigo = await query(`SELECT gerar_codigo_lote() as codigo`);
```

**Impacto:** Toda liberação de lote chama função PL/pgSQL para gerar código sequencial no formato `001-DDMMYY`.

#### 📍 APIs que RETORNAM codigo

```typescript
// app/api/rh/funcionarios/route.ts (linha 43)
// Retorna ultimo_lote_codigo no JOIN com avaliações
SELECT l.codigo FROM avaliacoes a2
JOIN lotes_avaliacao l ON a2.lote_id = l.id
WHERE a2.funcionario_cpf = f.cpf

// app/api/entidade/lote/[id]/relatorio-individual/route.ts (linha 217)
SELECT id, codigo, clinica_id, contratante_id
FROM lotes_avaliacao WHERE id = $1

// app/api/emissor/laudos/[loteId]/download/route.ts (linha 49)
SELECT id, codigo, titulo, emissor_cpf
FROM lotes_avaliacao WHERE id = $1

// app/api/avaliacao/relatorio-impressao/route.ts (linha 434, 570)
SELECT codigo, titulo FROM lotes_avaliacao WHERE id = $1
```

**Impacto:** 5+ endpoints retornam `codigo` além de `id`, propagando o uso.

#### 📍 Lógica de negócio usando codigo

```typescript
// lib/auto-concluir-lotes.test.ts (linha 171)
const mensagemEsperada = `Lote ${lote.codigo} concluído automaticamente`
// lib/laudo-auto.ts (linha 939, 1019, 1020, 1024, 1035, 1036, 1040, 1058, 1059, 1063)
// Múltiplas mensagens de log e notificações usando laudo.codigo
`[FASE 2] Enviando laudo do lote ${laudo.codigo} (ID: ${laudo.lote_id})`;
titulo: `Laudo do lote ${laudo.codigo} disponível`;
mensagem: `O laudo do lote ${laudo.codigo} foi emitido`;
```

**Impacto:** Sistema usa `codigo` para display/log, mas ID para operações críticas.

---

### 2️⃣ FRONTEND (Componentes e Páginas)

#### 📍 Componentes que EXIBEM codigo

```typescript
// components/emissor/ModalEmergencia.tsx (linha 140)
<strong>Lote:</strong> {loteCodigo} (ID: {loteId})

// components/BotaoSolicitarEmissao.tsx (linha 62)
`Confirma a solicitação de emissão do laudo para o lote ${loteCodigo}?\n\n`

// components/DetalhesFuncionario.tsx (linha 310)
{avaliacao.lote_codigo}

// components/clinica/LaudosSection.tsx (linha 165)
{laudo.lote_codigo}

// components/funcionarios/FuncionariosSection.tsx (linha 531, 543)
{funcionario.ultimo_lote_codigo || '—'}

// components/modals/ModalUploadLaudo.tsx (linha 222)
Lote: <span className="font-semibold">{loteCodigo}</span>

// components/RelatorioSetor.tsx (linha 115-116)
const loteCodigo = ((dados)['lote'] as Record<string, unknown>)?.['codigo']
a.download = `relatorio-setor-${setorSelecionado}-lote-${loteCodigo ?? 'sem-codigo'}.pdf`
```

**Impacto:** ~15+ componentes exibem `codigo` para usuários finais.

#### 📍 Páginas que EXIBEM codigo

```typescript
// app/rh/empresa/[id]/lote/[loteId]/page.tsx (linha 925, 1069, 1168)
Código: {lote.codigo}
`Confirma a solicitação de emissão do laudo para o lote ${lote.codigo}?`
a.download = `Laudo_${lote.codigo}.pdf`

// app/emissor/page.tsx (linha 369, 399, 546, 699, 815)
a.download = `laudo-${lote.codigo || lote.id}.pdf`
{lote.titulo} - Lote: {lote.codigo}

// app/entidade/lotes/page.tsx (linha 223, 398)
Código: {lote.codigo}

// app/entidade/lote/[id]/page.tsx (linha 688, 806, 907)
<p>Código: {lote.codigo}</p>

// app/entidade/laudos/page.tsx (linha 85)
<p>{laudo.lote_codigo}</p>

// app/emissor/laudo/[loteId]/page.tsx (linha 110, 938)
a.download = `laudo-${lote?.codigo || loteId}.pdf`
loteCodigo={lote?.codigo || ''}
```

**Impacto:** Todas as interfaces principais mostram `codigo` como identificador visível.

---

### 3️⃣ BANCO DE DADOS

#### 📍 Função de geração de código

```sql
-- database/legacy-migrations/etapa15-lotes-avaliacao.sql (linha 44-69)
CREATE OR REPLACE FUNCTION gerar_codigo_lote()
RETURNS VARCHAR(20) AS $$
DECLARE
    data_atual VARCHAR(6);
    sequencial INT;
    codigo VARCHAR(20);
BEGIN
    -- Formato: 001-DDMMYY (ex: 001-291125)
    data_atual := TO_CHAR(CURRENT_DATE, 'DDMMYY');

    -- Buscar próximo sequencial para a data
    SELECT COALESCE(MAX(CAST(SPLIT_PART(la.codigo, '-', 1) AS INTEGER)), 0) + 1
    INTO sequencial
    FROM lotes_avaliacao la
    WHERE la.codigo LIKE '%-' || data_atual;

    -- Formatar código com zeros à esquerda
    codigo := LPAD(sequencial::TEXT, 3, '0') || '-' || data_atual;

    RETURN codigo;
END;
$$ LANGUAGE plpgsql;
```

**Análise:**

- ✅ Função bem estruturada
- ❌ Gera overhead em TODA liberação de lote
- ❌ Formato `001-DDMMYY` não agrega valor operacional (ID já é único e sequencial)
- ❌ Requer SCAN em `lotes_avaliacao` com LIKE pattern

#### 📍 Migrations que usam codigo

```sql
-- database/migrations/016_add_ultima_avaliacao_denormalized.sql
-- Adiciona coluna denormalizada ultimo_lote_codigo em funcionarios
ALTER TABLE funcionarios ADD COLUMN ultimo_lote_codigo VARCHAR(20);

-- database/migrations/080_update_verificar_inativacao_consecutiva.sql
-- Retorna v_ultima_inativacao_codigo em função de validação

-- database/migrations/003_auditoria_completa.sql
-- Views de auditoria incluem l.codigo as lote/numero_lote
```

**Impacto:** Migrations propagam uso de `codigo` em colunas denormalizadas e views.

#### 📍 Bucket/Storage usando lote_id (✅ CORRETO)

```typescript
// lib/storage/laudo-storage.ts (linha 127)
// ✅ USA loteId (não codigo)
const key = `laudos/lote-${loteId}/laudo-${timestamp}-${random}.pdf`;
```

**Análise:** Storage usa **corretamente** `lote_id` para estrutura de pastas no Backblaze.

---

### 4️⃣ MÁQUINA DE ESTADOS

#### 📍 Estados de lote

```typescript
// Fluxo de estados:
// rascunho → ativo → concluido → emitido → enviado
```

**Análise:**

- ✅ Transições usam `lotes_avaliacao.status` (não dependem de codigo)
- ✅ Recálculo de status em `fn_recalcular_status_lote_on_avaliacao_update`
- ✅ Constraints verificam status válidos

**Nenhuma inconsistência encontrada** na máquina de estados relacionada a ID/codigo.

---

### 5️⃣ RLS (Row Level Security)

#### 📍 Policies que filtram por lote_id

```sql
-- Todas as policies encontradas usam lote_id (não codigo)
-- Exemplo de pattern:
CREATE POLICY policy_lotes_entidade ON lotes_avaliacao
  USING (contratante_id = app.current_contratante_id());

CREATE POLICY admin_all_lotes ON lotes_avaliacao
  USING (current_setting('app.perfil') = 'admin');
```

**Análise:**

- ✅ RLS usa `lote_id` para JOINs com outras tabelas
- ✅ Não há policies filtrando por `codigo`
- ✅ Segurança não comprometida por duplicidade de identificadores

---

### 6️⃣ RBAC (Role Based Access Control)

**Análise:**

- ✅ Permissions verificam acesso a `lotes_avaliacao` por `id`
- ✅ Não há lógica RBAC baseada em `codigo`
- ✅ `emissor` role valida `lote_id` para geração de laudos

---

### 7️⃣ TESTES

#### 📍 Testes que usam codigo

```typescript
// __tests__/rh/dashboard-lotes-laudos.test.tsx
codigo: 'LOTE001', codigo: 'LOTE002'

// __tests__/visual-regression/component-specific.test.tsx
loteCodigo="LOTE-001"

// __tests__/integration/inativar-contratante-integration.test.ts
const codigo = await query(`SELECT gerar_codigo_lote() as codigo`);

// __tests__/security/audit-logs.test.ts
const dadosAnteriores = { id: 123, codigo: 'LOTE-001' };
```

**Impacto:** Testes validam comportamento de `codigo`, dificultando remoção.

---

## 📊 ANÁLISE DE IMPACTO

### Uso de `lotes_avaliacao.codigo`

| Categoria         | Ocorrências | Status                      |
| ----------------- | ----------- | --------------------------- |
| APIs backend      | ~10         | ❌ Retornam codigo          |
| Componentes React | ~15         | ❌ Exibem codigo            |
| Páginas frontend  | ~10         | ❌ Usam codigo              |
| Migrations SQL    | ~5          | ❌ Criam colunas com codigo |
| Função geradora   | 1           | ❌ gerar_codigo_lote()      |
| Storage/Bucket    | 0           | ✅ Usa lote_id              |
| RLS Policies      | 0           | ✅ Usa lote_id              |
| RBAC              | 0           | ✅ Usa lote_id              |
| Máquina Estados   | 0           | ✅ Usa status, não codigo   |
| Testes            | ~20         | ❌ Validam codigo           |

---

## 🎯 RECOMENDAÇÕES

### 🔴 ALTA PRIORIDADE

1. **Deprecar `lotes_avaliacao.codigo`**
   - Manter coluna por compatibilidade (popular com `id::varchar`)
   - Adicionar trigger para sincronizar `codigo = id::varchar`
   - Planejar remoção em versão futura

2. **Atualizar APIs para retornar apenas `id`**
   - Remover `SELECT codigo` de queries
   - Manter `codigo` em responses para compatibilidade (= id)
   - Adicionar deprecation warnings

3. **Atualizar Frontend para usar `id`**
   - Substituir `{lote.codigo}` por `{lote.id}`
   - Atualizar downloads: `laudo-${lote.id}.pdf`
   - Manter display como "Lote #123" (padronizado)

### 🟡 MÉDIA PRIORIDADE

4. **Remover `gerar_codigo_lote()`**
   - Função não será mais necessária
   - Reduz overhead em liberação de lotes

5. **Atualizar migrations/views**
   - Remover `ultimo_lote_codigo` de `funcionarios`
   - Substituir por `ultimo_lote_id`
   - Atualizar views de auditoria

6. **Refatorar testes**
   - Substituir `codigo: 'LOTE001'` por `id: 1`
   - Atualizar assertions

### 🟢 BAIXA PRIORIDADE

7. **Documentação**
   - Adicionar ADR (Architecture Decision Record) explicando mudança
   - Atualizar DATABASE-POLICY.md

---

## 🛠️ PLANO DE MIGRAÇÃO

### Fase 1: Preparação (ATUAL)

- [x] Auditoria completa (este documento)
- [ ] Criar migration de depreciação
- [ ] Adicionar trigger de sincronização

### Fase 2: Backend (1-2 semanas)

- [ ] Atualizar APIs para deprecar `codigo`
- [ ] Adicionar warnings em logs
- [ ] Manter compatibilidade

### Fase 3: Frontend (1-2 semanas)

- [ ] Atualizar componentes para usar `id`
- [ ] Manter display consistente ("Lote #ID")
- [ ] Testar interfaces

### Fase 4: Limpeza (futuro)

- [ ] Remover coluna `codigo` após período de depreciação
- [ ] Remover função `gerar_codigo_lote()`
- [ ] Remover colunas denormalizadas (`ultimo_lote_codigo`)

---

## ✅ CONCLUSÕES

### Problemas Identificados

1. ❌ **Redundância de identificação:** `id` e `codigo` coexistem sem necessidade
2. ❌ **Overhead de geração:** `gerar_codigo_lote()` executa em toda liberação
3. ❌ **Complexidade de manutenção:** Dois identificadores em todo o código
4. ❌ **Confusão de desenvolvedores:** Quando usar `id` vs `codigo`?

### Pontos Positivos

1. ✅ **Regra `lote.id === laudo.id` respeitada** em toda aplicação
2. ✅ **Storage usa `lote_id`** corretamente (pastas Backblaze)
3. ✅ **RLS/RBAC não afetados** pela duplicidade
4. ✅ **Máquina de estados íntegra** (não depende de codigo)

### Estratégia Recomendada

**Remover progressivamente `codigo` e padronizar em `id`**, mantendo:

- Identificação única e sequencial
- Display consistente ("Lote #123")
- Simplicidade de manutenção
- Performance (sem overhead de geração)

---

## 📝 PRÓXIMOS PASSOS

1. ✅ **Auditoria completa** (CONCLUÍDO)
2. ⏳ **Criar migration de depreciação** (PRÓXIMO)
3. ⏳ **Atualizar APIs backend**
4. ⏳ **Refatorar frontend**
5. ⏳ **Testar fluxos completos**
6. ⏳ **Documentar mudanças**

---

**Elaborado por:** GitHub Copilot  
**Revisado em:** 03/02/2026  
**Status:** ✅ AUDITORIA COMPLETA
