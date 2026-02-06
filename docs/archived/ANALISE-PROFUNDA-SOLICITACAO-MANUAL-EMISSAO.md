# 🔍 ANÁLISE PROFUNDA - Implementação de Solicitação Manual de Emissão de Laudos

**Data**: 29 de janeiro de 2026  
**Autor**: Sistema de Análise Copilot  
**Objetivo**: Análise completa de inconsistências, falhas e discrepâncias para implementação segura da solicitação manual de emissão

---

## 📋 SUMÁRIO EXECUTIVO

### Mudança Solicitada

Alterar o fluxo automático de emissão de laudos para manual:

- **ANTES**: Lote concluído → Emissão automática imediata
- **DEPOIS**: Lote concluído → Aguarda solicitação manual → Botão → Emissão

### Consideração Crítica

**Um lote pode entrar em estado `concluido` por:**

1. Última avaliação **concluída**
2. Última avaliação **inativada**
3. Combinação de **concluídas + inativadas = total liberadas**

### Escopo

✅ **Correção aplica-se SOMENTE a novos lotes e laudos**  
❌ **NÃO altera lotes/laudos existentes**

---

## 🗄️ 1. ANÁLISE DO BANCO DE DADOS

### 1.1. Esquema de Tabelas Principais

#### **Tabela: `lotes_avaliacao`**

```sql
CREATE TABLE public.lotes_avaliacao (
    id integer NOT NULL,
    codigo varchar(20) NOT NULL,
    clinica_id integer,           -- Para lotes de clínicas
    empresa_id integer,            -- Para lotes de empresas
    contratante_id integer,        -- Para lotes de entidades
    titulo varchar(100) NOT NULL,
    descricao text,
    tipo varchar(20) DEFAULT 'completo',
    status varchar(20) DEFAULT 'rascunho',
    liberado_por char(11) NOT NULL,
    liberado_em timestamp DEFAULT CURRENT_TIMESTAMP,
    emitido_em timestamp,          -- ⚠️ CRÍTICO: marca quando laudo foi emitido
    criado_em timestamp DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamp DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT lotes_avaliacao_status_check
    CHECK (status IN ('ativo', 'cancelado', 'finalizado', 'concluido', 'rascunho'))
);
```

**Estados do Lote:**

- `rascunho`: Lote criado mas não liberado
- `ativo`: Avaliações em andamento
- `concluido`: **PONTO DE INTERVENÇÃO** - Todas avaliações finalizadas (concluídas ou inativadas)
- `finalizado`: Laudo emitido e enviado
- `cancelado`: Todas avaliações inativadas

#### **Tabela: `laudos`**

```sql
CREATE TABLE public.laudos (
    id integer NOT NULL,
    lote_id integer NOT NULL,
    emissor_cpf char(11) NOT NULL,
    observacoes text,
    status varchar(20) DEFAULT 'rascunho',
    criado_em timestamp DEFAULT CURRENT_TIMESTAMP,
    emitido_em timestamp,
    enviado_em timestamp,
    hash_pdf text,                 -- Hash SHA-256 para integridade
    atualizado_em timestamp DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT laudos_status_check
    CHECK (status IN ('rascunho', 'emitido', 'enviado')),

    FOREIGN KEY (lote_id) REFERENCES lotes_avaliacao(id) ON DELETE CASCADE
);
```

#### **Tabela: `fila_emissao`** (Sistema de fila assíncrona)

```sql
CREATE TABLE fila_emissao (
    id SERIAL PRIMARY KEY,
    lote_id INTEGER NOT NULL REFERENCES lotes_avaliacao(id) ON DELETE CASCADE,
    tentativas INT DEFAULT 0,
    max_tentativas INT DEFAULT 3,
    proxima_tentativa TIMESTAMP DEFAULT NOW(),
    erro TEXT,
    criado_em TIMESTAMP DEFAULT NOW(),
    atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Índice para buscar itens pendentes
CREATE INDEX idx_fila_pendente
ON fila_emissao(proxima_tentativa)
WHERE tentativas < max_tentativas;

-- IMPORTANTE: Constraint de unicidade para evitar duplicação
-- ⚠️ FALTA IMPLEMENTAR: UNIQUE(lote_id) para evitar múltiplas entradas
```

### 1.2. Relações Críticas

```
lotes_avaliacao (1) ──┬─→ (N) avaliacoes
                      │
                      ├─→ (0..1) laudos
                      │
                      ├─→ (0..1) fila_emissao
                      │
                      ├─→ (N) empresas_clientes (via empresa_id)
                      │
                      └─→ (N) contratantes (via contratante_id)
```

**Cardinalidades:**

- 1 Lote → N Avaliações (obrigatório)
- 1 Lote → 0..1 Laudo (opcional até emissão)
- 1 Lote → 0..1 Entrada na Fila (opcional)
- 1 Lote → 1 Clínica **OU** 1 Entidade (mutuamente exclusivo)

---

## 🔐 2. ANÁLISE RLS E RBAC

### 2.1. Políticas RLS Existentes

#### **Para `lotes_avaliacao`:**

```sql
-- RH vê lotes de sua clínica
CREATE POLICY lotes_rh_clinica ON public.lotes_avaliacao FOR SELECT
USING (
    current_user_perfil() = 'rh'
    AND clinica_id = current_user_clinica_id()
);

-- Entidade vê lotes da sua contratante
CREATE POLICY lotes_entidade_select ON public.lotes_avaliacao FOR SELECT
USING (
    current_user_perfil() IN ('entidade', 'gestor')
    AND contratante_id = current_user_contratante_id()
);

-- Emissor vê lotes concluídos ou finalizados (DEPRECATED)
-- Policy 'lotes_emissor_select' foi removida; emissor NÃO pode visualizar lotes/avaliacoes.
USING (
    current_user_perfil() = 'emissor'
    AND status IN ('finalizado', 'concluido')
);
```

#### **Para `laudos`:**

```sql
-- Emissor vê e edita todos os laudos
CREATE POLICY laudos_emissor_select ON public.laudos FOR SELECT
USING (current_user_perfil() = 'emissor');

CREATE POLICY laudos_emissor_insert ON public.laudos FOR INSERT
WITH CHECK (current_user_perfil() = 'emissor');

CREATE POLICY laudos_emissor_update ON public.laudos FOR UPDATE
USING (current_user_perfil() = 'emissor')
WITH CHECK (current_user_perfil() = 'emissor');

-- RH vê laudos de lotes de sua clínica
CREATE POLICY laudos_rh_clinica ON public.laudos FOR SELECT
USING (
    current_user_perfil() = 'rh'
    AND lote_id IN (
        SELECT id FROM lotes_avaliacao
        WHERE clinica_id = current_user_clinica_id()
    )
);

-- Entidade vê laudos de seus lotes
CREATE POLICY laudos_entidade_select ON public.laudos FOR SELECT
USING (
    current_user_perfil() IN ('entidade', 'gestor')
    AND lote_id IN (
        SELECT id FROM lotes_avaliacao
        WHERE contratante_id = current_user_contratante_id()
    )
);
```

#### **Para `fila_emissao`:**

⚠️ **CRÍTICO: NÃO EXISTE POLÍTICA RLS PARA `fila_emissao`**

**Implicações:**

- Tabela não está protegida por RLS
- Qualquer usuário autenticado pode potencialmente manipular a fila
- **PRECISA SER CORRIGIDO** antes de implementar solicitação manual

### 2.2. Validações de Sessão

**Funções de Autenticação** (`lib/session.ts`):

```typescript
// Validação RH com empresa
requireRHWithEmpresaAccess(empresaId: number): Promise<Session>
  → Valida que RH pertence à clínica da empresa
  → Mapeia contratante_id para clinica_id se necessário
  → Bloqueia admin de operações de RH

// Validação Entidade
requireEntity(): Promise<Session & { contratante_id: number }>
  → Valida perfil 'gestor'
  → Garante contratante_id na sessão
  → Verifica se contratante está ativo

// Validação Clínica
requireClinica(): Promise<Session & { clinica_id: number }>
  → Valida perfil 'rh'
  → Garante clinica_id na sessão
  → Mapeia via contratante_id se necessário
```

---

## 🔄 3. ANÁLISE DOS FLUXOS ATUAIS

### 3.1. Fluxo de Conclusão de Lote

**Arquivo**: `lib/lotes.ts` → `recalcularStatusLotePorId()`

#### **Lógica de Conclusão:**

```typescript
// Critérios para status = 'concluido':
// 1. Total avaliações > 0
// 2. Avaliações concluídas > 0
// 3. (concluídas + inativadas) == total liberadas

if (
  liberadasNum > 0 &&
  concluidasNum > 0 &&
  concluidasNum + inativadasNum === liberadasNum
) {
  novoStatus = 'concluido';
}
```

#### **Ações Atuais ao Concluir:**

```typescript
if (novoStatus === 'concluido') {
  // 1. Atualizar status
  await query('UPDATE lotes_avaliacao SET status = $1 WHERE id = $2', [
    'concluido',
    loteId,
  ]);

  // 2. Adicionar à fila (com idempotência)
  await query(
    `
    INSERT INTO fila_emissao (lote_id, tentativas, max_tentativas, proxima_tentativa)
    VALUES ($1, 0, 3, NOW())
    ON CONFLICT (lote_id) DO NOTHING
  `,
    [loteId]
  );

  // 3. ⚠️ EMISSÃO IMEDIATA AUTOMÁTICA
  const { emitirLaudoImediato } = await import('@/lib/laudo-auto');
  const sucesso = await emitirLaudoImediato(loteId);
}
```

**⚠️ PONTOS DE MUDANÇA:**

- Remover chamada a `emitirLaudoImediato()`
- Remover inserção automática em `fila_emissao`
- Manter apenas mudança de status para `concluido`

### 3.2. Fluxo de Inativação

**APIs de Inativação:**

1. `/api/rh/lotes/[id]/avaliacoes/[avaliacaoId]/inativar` (para RH)
2. `/api/entidade/lotes/[id]/avaliacoes/[avaliacaoId]/reset` (para Entidade)
3. `/api/avaliacoes/inativar` (genérica)

#### **Processo de Inativação:**

```typescript
// 1. Validações
if (lote.emitido_em) {
  throw new Error('Não é possível inativar - laudo já emitido (imutável)');
}

// 2. Atualizar avaliação
await query(
  `
  UPDATE avaliacoes
  SET status = 'inativada',
      inativada_em = NOW(),
      motivo_inativacao = $2
  WHERE id = $1
`,
  [avaliacaoId, motivo]
);

// 3. Recalcular status do lote
const { novoStatus, loteFinalizado } = await recalcularStatusLotePorId(loteId);

// 4. Se lote ficou 'concluido' → DISPARA EMISSÃO AUTOMÁTICA
```

**Cenários de Conclusão por Inativação:**

```
Cenário 1: Última avaliação inativada
  Antes: [5 concluídas, 1 pendente]
  Ação:  Inativar a pendente
  Depois: [5 concluídas, 1 inativada] → Lote = concluído

Cenário 2: Mix de concluídas e inativadas
  Antes: [3 concluídas, 2 pendentes]
  Ação:  Inativar as 2 pendentes
  Depois: [3 concluídas, 2 inativadas] → Lote = concluído

Cenário 3: Todas inativadas
  Antes: [0 concluídas, 5 pendentes]
  Ação:  Inativar todas
  Depois: [0 concluídas, 5 inativadas] → Lote = cancelado
```

### 3.3. Fluxo de Emissão Atual

**Arquivo**: `lib/laudo-auto.ts` → `emitirLaudoImediato()`

```typescript
export async function emitirLaudoImediato(loteId: number): Promise<boolean> {
  // 1. Selecionar emissor ativo
  const emissor = await buscarEmissorAtivo();

  // 2. Verificar se já foi emitido (prevenir duplicação)
  const lote = await query(
    'SELECT emitido_em FROM lotes_avaliacao WHERE id = $1',
    [loteId]
  );
  if (lote.rows[0].emitido_em) {
    return false; // Já emitido
  }

  // 3. Marcar como finalizado e registrar timestamp
  await query(
    `
    UPDATE lotes_avaliacao 
    SET emitido_em = NOW(), 
        processamento_em = NULL, 
        status = 'finalizado' 
    WHERE id = $1
  `,
    [loteId]
  );

  // 4. Gerar laudo completo
  const laudoId = await gerarLaudoCompletoEmitirPDF(loteId, emissor.cpf);

  // 5. Calcular hash SHA-256
  const hash = await calcularHashPDF(pdfBuffer);
  await query('UPDATE laudos SET hash_pdf = $1 WHERE id = $2', [hash, laudoId]);

  // 6. Criar notificações
  await criarNotificacoesLaudo(loteId, laudoId);

  return true;
}
```

---

## ⚠️ 4. INCONSISTÊNCIAS E PROBLEMAS IDENTIFICADOS

### 4.1. Race Conditions

#### **Problema 1: Múltiplas Emissões Simultâneas**

**Cenário:**

```
Thread A: Lote 123 concluído → Chama emitirLaudoImediato()
Thread B: Lote 123 concluído → Chama emitirLaudoImediato()

Ambos verificam emitido_em = NULL
Ambos prosseguem com emissão
Resultado: Laudo duplicado
```

**Mitigação Atual:**

```typescript
// lib/lotes.ts linha 31
await query('SELECT pg_advisory_xact_lock($1)', [loteId]);
```

✅ **Advisory lock previne problema no recálculo**  
⚠️ **MAS não previne se emissão for chamada diretamente por múltiplas APIs**

#### **Problema 2: Fila sem Unicidade**

**Faltando:**

```sql
-- ⚠️ NÃO EXISTE:
ALTER TABLE fila_emissao ADD CONSTRAINT fila_emissao_lote_id_unique UNIQUE (lote_id);
```

**Impacto:**

- Mesmo lote pode ser adicionado múltiplas vezes à fila
- Processamento duplicado
- Desperdício de recursos

### 4.2. Validações de Permissão

#### **Problema 3: Falta de RLS na `fila_emissao`**

**Estado Atual:**

```sql
-- Tabela fila_emissao NÃO tem RLS habilitado
-- Qualquer usuário pode:
SELECT * FROM fila_emissao;  -- Ver todos os itens
INSERT INTO fila_emissao ... -- Adicionar itens
UPDATE fila_emissao ...      -- Modificar
DELETE FROM fila_emissao ... -- Remover
```

**Necessário:**

```sql
ALTER TABLE fila_emissao ENABLE ROW LEVEL SECURITY;

-- Apenas sistema pode manipular fila
CREATE POLICY fila_emissao_system_only ON fila_emissao
FOR ALL TO PUBLIC
USING (false)  -- Ninguém acessa
WITH CHECK (false); -- Ninguém modifica

-- Emissor vê itens para processar
CREATE POLICY fila_emissao_emissor_select ON fila_emissao
FOR SELECT TO PUBLIC
USING (
    current_user_perfil() = 'emissor'
    AND tentativas < max_tentativas
);
```

#### **Problema 4: Bypass de Validação em APIs Diretas**

**APIs que chamam `emitirLaudoImediato()` diretamente:**

1. `/api/admin/reenviar-lote/route.ts`
2. `/api/emissor/laudos/[loteId]/reprocessar/route.ts`
3. `/api/emissor/laudos/[loteId]/emergencia/route.ts`

**Problema:**

- Não verificam se lote pertence ao solicitante
- Admin pode emitir laudo de qualquer lote
- Emissor pode reprocessar sem validação de propriedade

### 4.3. Estados Inconsistentes

#### **Problema 5: Lote Concluído sem Avaliações**

**Possível por:**

```sql
-- Deletar todas avaliações
DELETE FROM avaliacoes WHERE lote_id = 123;

-- Lote permanece 'concluido'
-- Mas não há dados para gerar laudo!
```

**Validação Faltante:**

```typescript
// Antes de emitir
const totalAvaliacoes = await query(
  'SELECT COUNT(*) FROM avaliacoes WHERE lote_id = $1',
  [loteId]
);

if (totalAvaliacoes.rows[0].count === 0) {
  throw new Error('Lote sem avaliações - impossível emitir laudo');
}
```

#### **Problema 6: Lote Finalizado sem Laudo**

**Possível por:**

```sql
-- Atualizar status manualmente
UPDATE lotes_avaliacao SET status = 'finalizado' WHERE id = 123;

-- Mas laudo não foi gerado!
```

**Integridade Faltante:**

```sql
-- Constraint que garante laudo quando finalizado
ALTER TABLE lotes_avaliacao
ADD CONSTRAINT check_finalizado_tem_laudo
CHECK (
    status != 'finalizado'
    OR EXISTS (
        SELECT 1 FROM laudos
        WHERE lote_id = lotes_avaliacao.id
        AND status = 'enviado'
    )
);
```

### 4.4. Dados Órfãos

#### **Problema 7: Laudo sem Lote**

**Configuração Atual:**

```sql
FOREIGN KEY (lote_id) REFERENCES lotes_avaliacao(id) ON DELETE CASCADE
```

✅ **OK**: Cascata remove laudo quando lote é deletado

#### **Problema 8: Fila sem Lote**

**Configuração Atual:**

```sql
FOREIGN KEY (lote_id) REFERENCES lotes_avaliacao(id) ON DELETE CASCADE
```

✅ **OK**: Cascata remove entrada da fila quando lote é deletado

### 4.5. Imutabilidade

#### **Problema 9: Modificação Após Emissão**

**Proteção Atual:**

```typescript
// Em APIs de inativação
if (lote.emitido_em) {
  throw new Error('Laudo já emitido - avaliações são imutáveis');
}
```

✅ **BOM**: APIs protegem modificações

**Mas falta:**

```sql
-- Trigger para prevenir UPDATE direto
CREATE OR REPLACE FUNCTION prevent_modification_after_emission()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM lotes_avaliacao
        WHERE id = NEW.lote_id
        AND emitido_em IS NOT NULL
    ) THEN
        RAISE EXCEPTION 'Não é possível modificar avaliação - laudo já emitido';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_avaliacao_update_after_emission
BEFORE UPDATE ON avaliacoes
FOR EACH ROW
EXECUTE FUNCTION prevent_modification_after_emission();
```

---

## 🎯 5. VALIDAÇÕES DE INTEGRIDADE FRONTEND ↔ BACKEND

### 5.1. Componentes Frontend

#### **RH (Clínica):**

- `components/rh/LotesGrid.tsx` → Exibe lotes
- `app/rh/empresa/[id]/lote/[loteId]/page.tsx` → Detalhes do lote

**Estados Exibidos:**

```typescript
{lote.status === 'ativo' && <Badge>Em andamento</Badge>}
{lote.status === 'concluido' && <Badge>Concluído - aguardando laudo</Badge>}
{lote.status === 'finalizado' && <Badge>Laudo disponível</Badge>}
{lote.status === 'cancelado' && <Badge>Cancelado</Badge>}
```

**⚠️ Falta:**

- Botão "Solicitar Emissão" quando `status === 'concluido'`
- Indicador de "Aguardando emissão manual"

#### **Entidade:**

- `app/entidade/lotes/page.tsx` → Lista lotes
- `app/entidade/lote/[id]/page.tsx` → Detalhes do lote

**⚠️ Falta:**

- Mesmo botão de solicitação
- Validação de permissão para solicitar

### 5.2. APIs Existentes

#### **GET `/api/rh/lotes`**

```typescript
// Retorna lista de lotes
{
  (id,
    codigo,
    titulo,
    status,
    total_avaliacoes,
    avaliacoes_concluidas,
    avaliacoes_inativadas,
    motivos_bloqueio);
}
```

**⚠️ Falta:**

- Campo `pode_solicitar_emissao: boolean`
- Campo `aguardando_emissao: boolean`

#### **GET `/api/emissor/lotes`**

```typescript
// Filtro de lotes por status
case 'laudo-para-emitir':
  return (
    lote.status === 'concluido' &&
    (!lote.laudo || lote.laudo.status !== 'enviado')
  );
```

**Continua OK** após mudança (emissor ainda vê lotes concluídos)

### 5.3. Notificações

**Sistema de Notificações Atual:**

```typescript
// lib/laudo-auto.ts
await query(
  `
  INSERT INTO notificacoes (
    user_cpf, tipo, mensagem, lote_id, criado_em
  ) VALUES ($1, 'lote_concluido_aguardando_laudo', $2, $3, NOW())
`,
  [responsavel_cpf, mensagem, loteId]
);
```

**Tipos de notificação:**

- `lote_concluido_aguardando_laudo` ✅ (já existe)
- `laudo_emitido_automaticamente`
- `laudo_enviado`
- `emissao_solicitada` ⚠️ (precisa criar)
- `emissao_processando` ⚠️ (precisa criar)

---

## 🚨 6. RISCOS E DEPENDÊNCIAS

### 6.1. Riscos Críticos

| Risco                         | Probabilidade | Impacto | Mitigação                         |
| ----------------------------- | ------------- | ------- | --------------------------------- |
| Race condition na solicitação | Média         | Alto    | Advisory lock + constraint UNIQUE |
| Bypass de permissão RLS       | Baixa         | Crítico | Implementar RLS em fila_emissao   |
| Lote órfão na fila            | Baixa         | Médio   | Cleanup job + validação           |
| Solicitação duplicada         | Alta          | Médio   | Constraint UNIQUE + validação UI  |
| Estado inconsistente          | Média         | Alto    | Trigger + validação transacional  |

### 6.2. Dependências

**Código:**

- `lib/lotes.ts` (mudança crítica)
- `lib/laudo-auto.ts` (usado pelo emissor)
- `lib/session.ts` (validações de permissão)

**Banco de Dados:**

- `fila_emissao` (precisa RLS e UNIQUE)
- `lotes_avaliacao` (precisa novo campo?)
- Triggers de auditoria

**Frontend:**

- Componentes de lotes (RH e Entidade)
- Sistema de notificações
- Toast/feedback

### 6.3. Testes Afetados

**Arquivos de Teste que Precisam Atualização:**

```
__tests__/system/auto-laudo-emission.test.ts
__tests__/integration/auto-conclusao-emissao.test.ts
__tests__/integration/lote-fluxo-completo.test.ts
__tests__/lib/recalculo-emissao-inativadas.test.ts
__tests__/lote-cancelamento-automatico.test.ts
scripts/tests/test-emissao-automatica-dev.js
```

**Total estimado: ~15 arquivos de teste**

---

## ✅ 7. PLANO DE IMPLEMENTAÇÃO SEGURA

### 7.1. Fase 1 - Preparação do Banco de Dados

#### **Migration 1: Adicionar Constraint UNIQUE**

```sql
-- Prevenir duplicação na fila
ALTER TABLE fila_emissao
ADD CONSTRAINT fila_emissao_lote_id_unique UNIQUE (lote_id);

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_fila_emissao_lote_id
ON fila_emissao(lote_id)
WHERE tentativas < max_tentativas;
```

#### **Migration 2: Implementar RLS**

```sql
-- Ativar RLS
ALTER TABLE fila_emissao ENABLE ROW LEVEL SECURITY;

-- Policy: Apenas sistema manipula
CREATE POLICY fila_emissao_system_only ON fila_emissao
FOR ALL TO PUBLIC
USING (
    -- Permitir acesso apenas via funções de sistema
    current_setting('app.system_bypass', true) = 'true'
)
WITH CHECK (
    current_setting('app.system_bypass', true) = 'true'
);

-- Policy: Emissor visualiza fila
CREATE POLICY fila_emissao_emissor_view ON fila_emissao
FOR SELECT TO PUBLIC
USING (
    current_user_perfil() = 'emissor'
);
```

#### **Migration 3: Adicionar Trigger de Validação**

```sql
-- Prevenir modificação após emissão
CREATE OR REPLACE FUNCTION prevent_modification_after_emission()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM lotes_avaliacao
        WHERE id = NEW.lote_id
        AND emitido_em IS NOT NULL
    ) THEN
        RAISE EXCEPTION 'Não é possível modificar avaliação de lote com laudo emitido';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_avaliacao_update_after_emission
BEFORE UPDATE ON avaliacoes
FOR EACH ROW
EXECUTE FUNCTION prevent_modification_after_emission();
```

### 7.2. Fase 2 - Backend (Lib e APIs)

#### **Mudança 1: `lib/lotes.ts`**

```typescript
// REMOVER emissão automática
if (novoStatus === 'concluido') {
  await query('UPDATE lotes_avaliacao SET status = $1 WHERE id = $2', [
    'concluido',
    loteId,
  ]);

  // ❌ REMOVER: Não adicionar à fila automaticamente
  // ❌ REMOVER: Não chamar emitirLaudoImediato()

  // ✅ ADICIONAR: Criar notificação
  await query(
    `
    INSERT INTO notificacoes (user_cpf, tipo, mensagem, lote_id, criado_em)
    SELECT liberado_por, 'lote_aguardando_solicitacao_emissao',
           'Lote concluído - clique para solicitar emissão do laudo', $1, NOW()
    FROM lotes_avaliacao WHERE id = $1
  `,
    [loteId]
  );
}
```

#### **Mudança 2: Nova API - Solicitar Emissão**

```typescript
// app/api/lotes/[loteId]/solicitar-emissao/route.ts

import { requireAuth } from '@/lib/session';
import { query } from '@/lib/db';
import { requireRHWithEmpresaAccess, requireEntity } from '@/lib/session';

export async function POST(
  request: Request,
  { params }: { params: { loteId: string } }
) {
  const user = await requireAuth();
  const loteId = parseInt(params.loteId);

  // 1. Buscar lote e validar permissões
  const lote = await query(
    `
    SELECT id, codigo, status, clinica_id, empresa_id, contratante_id, emitido_em
    FROM lotes_avaliacao WHERE id = $1
  `,
    [loteId]
  );

  if (lote.rows.length === 0) {
    return NextResponse.json({ error: 'Lote não encontrado' }, { status: 404 });
  }

  const loteData = lote.rows[0];

  // 2. Validar permissão baseado no tipo de lote
  if (loteData.clinica_id && user.perfil === 'rh') {
    await requireRHWithEmpresaAccess(loteData.empresa_id);
  } else if (loteData.contratante_id && user.perfil === 'gestor') {
    const session = await requireEntity();
    if (session.contratante_id !== loteData.contratante_id) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }
  } else {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }

  // 3. Validar status do lote
  if (loteData.status !== 'concluido') {
    return NextResponse.json(
      {
        error: `Lote não está concluído (status atual: ${loteData.status})`,
      },
      { status: 400 }
    );
  }

  // 4. Validar que não foi emitido
  if (loteData.emitido_em) {
    return NextResponse.json(
      {
        error: 'Laudo já foi emitido para este lote',
      },
      { status: 400 }
    );
  }

  // 5. Verificar se já existe laudo
  const laudoExistente = await query(
    `
    SELECT id, status FROM laudos WHERE lote_id = $1
  `,
    [loteId]
  );

  if (
    laudoExistente.rows.length > 0 &&
    laudoExistente.rows[0].status === 'enviado'
  ) {
    return NextResponse.json(
      {
        error: 'Laudo já foi enviado para este lote',
      },
      { status: 400 }
    );
  }

  // 6. Adicionar à fila (com lock para evitar duplicação)
  try {
    await query('BEGIN');
    await query('SELECT pg_advisory_xact_lock($1)', [loteId]);

    await query(
      `
      INSERT INTO fila_emissao (lote_id, tentativas, max_tentativas, proxima_tentativa)
      VALUES ($1, 0, 3, NOW())
      ON CONFLICT (lote_id) DO NOTHING
    `,
      [loteId]
    );

    // 7. Chamar emissão imediata
    const { emitirLaudoImediato } = await import('@/lib/laudo-auto');
    const sucesso = await emitirLaudoImediato(loteId);

    await query('COMMIT');

    if (sucesso) {
      // 8. Criar notificação de sucesso
      await query(
        `
        INSERT INTO notificacoes (user_cpf, tipo, mensagem, lote_id, criado_em)
        VALUES ($1, 'emissao_solicitada_sucesso',
                'Emissão do laudo foi solicitada com sucesso. O laudo será gerado em breve.', 
                $2, NOW())
      `,
        [user.cpf, loteId]
      );

      return NextResponse.json({
        success: true,
        message: 'Emissão do laudo solicitada com sucesso',
      });
    } else {
      throw new Error('Falha na emissão');
    }
  } catch (error) {
    await query('ROLLBACK');
    console.error('Erro ao solicitar emissão:', error);

    return NextResponse.json(
      {
        error: 'Erro ao solicitar emissão do laudo',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
```

### 7.3. Fase 3 - Frontend

#### **Componente: Botão de Solicitação**

```typescript
// components/BotaoSolicitarEmissao.tsx

'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface Props {
  loteId: number;
  // loteCodigo: removido
  loteStatus: string;
  onSuccess?: () => void;
}

export function BotaoSolicitarEmissao({
  loteId,
  loteCodigo,
  loteStatus,
  onSuccess
}: Props) {
  const [loading, setLoading] = useState(false);

  // Só exibir se lote está concluído
  if (loteStatus !== 'concluido') {
    return null;
  }

  const handleSolicitar = async () => {
    if (!confirm(`Confirma solicitação de emissão do laudo para o lote ${loteCodigo}?`)) {
      return;
    }

    setLoading(true);
    toast.loading('Solicitando emissão...', { id: 'solicitar-emissao' });

    try {
      const response = await fetch(`/api/lotes/${loteId}/solicitar-emissao`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao solicitar emissão');
      }

      toast.success('Emissão solicitada com sucesso!', { id: 'solicitar-emissao' });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error(error.message || 'Erro ao solicitar emissão',
        { id: 'solicitar-emissao' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          <span className="text-2xl">✅</span>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            Lote Concluído
          </h3>
          <p className="text-sm text-gray-600">
            Todas as avaliações foram finalizadas. Solicite a emissão do laudo.
          </p>
        </div>
      </div>

      <button
        onClick={handleSolicitar}
        disabled={loading}
        className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700
                   transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed
                   flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10"
                      stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>Solicitando...</span>
          </>
        ) : (
          <>
            <span>🚀</span>
            <span>Solicitar Emissão do Laudo</span>
          </>
        )}
      </button>
    </div>
  );
}
```

### 7.4. Fase 4 - Testes

#### **Teste de Integração**

```typescript
// __tests__/integration/solicitacao-manual-emissao.test.ts

describe('Solicitação Manual de Emissão', () => {
  it('deve permitir RH solicitar emissão de lote concluído', async () => {
    // Setup: criar lote concluído
    const loteId = await criarLoteConcluido();

    // Ação: solicitar emissão
    const response = await fetch(`/api/lotes/${loteId}/solicitar-emissao`, {
      method: 'POST',
      headers: { Cookie: rhSessionCookie },
    });

    // Verificação
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);

    // Verificar que laudo foi criado
    const laudo = await query('SELECT * FROM laudos WHERE lote_id = $1', [
      loteId,
    ]);
    expect(laudo.rows.length).toBe(1);
  });

  it('deve bloquear solicitação duplicada', async () => {
    const loteId = await criarLoteConcluido();

    // Primeira solicitação
    await fetch(`/api/lotes/${loteId}/solicitar-emissao`, {
      method: 'POST',
      headers: { Cookie: rhSessionCookie },
    });

    // Segunda solicitação (duplicada)
    const response = await fetch(`/api/lotes/${loteId}/solicitar-emissao`, {
      method: 'POST',
      headers: { Cookie: rhSessionCookie },
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('já foi emitido');
  });

  it('deve bloquear entidade de solicitar lote de outra entidade', async () => {
    const loteId = await criarLoteConcluido({ contratante_id: 999 });

    const response = await fetch(`/api/lotes/${loteId}/solicitar-emissao`, {
      method: 'POST',
      headers: { Cookie: entidadeSessionCookie }, // contratante_id = 1
    });

    expect(response.status).toBe(403);
  });
});
```

---

## 📊 8. CHECKLIST DE IMPLEMENTAÇÃO

### 8.1. Banco de Dados

- [ ] Criar migration para constraint UNIQUE em fila_emissao
- [ ] Criar migration para RLS em fila_emissao
- [ ] Criar migration para trigger de imutabilidade
- [ ] Testar migrations em ambiente de desenvolvimento
- [ ] Validar performance dos índices
- [ ] Documentar mudanças no schema

### 8.2. Backend

- [ ] Modificar `lib/lotes.ts` - remover emissão automática
- [ ] Criar API `/api/lotes/[loteId]/solicitar-emissao/route.ts`
- [ ] Adicionar validações de permissão
- [ ] Implementar advisory lock
- [ ] Adicionar logging de auditoria
- [ ] Criar notificações
- [ ] Atualizar tipos TypeScript
- [ ] Documentar mudanças na API

### 8.3. Frontend

- [ ] Criar componente `BotaoSolicitarEmissao`
- [ ] Integrar em `components/rh/LotesGrid.tsx`
- [ ] Integrar em `app/rh/empresa/[id]/lote/[loteId]/page.tsx`
- [ ] Integrar em `app/entidade/lotes/page.tsx`
- [ ] Integrar em `app/entidade/lote/[id]/page.tsx`
- [ ] Adicionar feedback visual (loading, success, error)
- [ ] Implementar confirmação antes de solicitar
- [ ] Testar responsividade

### 8.4. Testes

- [ ] Atualizar testes de emissão automática
- [ ] Criar testes para solicitação manual
- [ ] Testes de permissão (RH, Entidade, Admin)
- [ ] Testes de race condition
- [ ] Testes de duplicação
- [ ] Testes de estados inválidos
- [ ] Testes de integração E2E
- [ ] Testes de performance

### 8.5. Documentação

- [ ] Atualizar README com novo fluxo
- [ ] Documentar API de solicitação
- [ ] Atualizar diagramas de fluxo
- [ ] Criar guia de migração
- [ ] Documentar rollback plan

### 8.6. Deploy

- [ ] Deploy em staging
- [ ] Testes em staging
- [ ] Validação com usuários beta
- [ ] Deploy em produção
- [ ] Monitoramento pós-deploy
- [ ] Rollback plan testado

---

## 🔄 9. ROLLBACK PLAN

### Cenário: Implementação Apresenta Problemas

#### **Opção 1: Reverter Código**

```typescript
// lib/lotes.ts
if (novoStatus === 'concluido') {
  // RESTAURAR emissão automática
  const { emitirLaudoImediato } = await import('@/lib/laudo-auto');
  await emitirLaudoImediato(loteId);
}
```

#### **Opção 2: Feature Flag**

```typescript
// .env
ENABLE_MANUAL_EMISSION = false;

// lib/lotes.ts
const manualEmission = process.env.ENABLE_MANUAL_EMISSION === 'true';

if (novoStatus === 'concluido' && !manualEmission) {
  await emitirLaudoImediato(loteId);
}
```

#### **Opção 3: Migração Reversa**

```sql
-- Remover RLS
ALTER TABLE fila_emissao DISABLE ROW LEVEL SECURITY;

-- Remover constraint
ALTER TABLE fila_emissao DROP CONSTRAINT IF EXISTS fila_emissao_lote_id_unique;
```

---

## 📈 10. MÉTRICAS DE SUCESSO

### KPIs a Monitorar

| Métrica                    | Objetivo | Como Medir                     |
| -------------------------- | -------- | ------------------------------ |
| Tempo médio de solicitação | < 2s     | Logs de performance            |
| Taxa de sucesso            | > 99%    | Contagem de erros              |
| Duplicações evitadas       | 0        | Violações de UNIQUE constraint |
| Lotes órfãos na fila       | 0        | Query periódica                |
| Satisfação do usuário      | > 4/5    | Pesquisa pós-implementação     |

### Queries de Monitoramento

```sql
-- Lotes aguardando solicitação
SELECT COUNT(*)
FROM lotes_avaliacao
WHERE status = 'concluido'
AND emitido_em IS NULL;

-- Lotes na fila há muito tempo
SELECT *
FROM fila_emissao
WHERE criado_em < NOW() - INTERVAL '1 hour'
AND tentativas < max_tentativas;

-- Taxa de erro por tentativa
SELECT
  tentativas,
  COUNT(*) as total,
  AVG(EXTRACT(EPOCH FROM (atualizado_em - criado_em))) as tempo_medio
FROM fila_emissao
GROUP BY tentativas;
```

---

## 🎓 11. CONCLUSÕES E RECOMENDAÇÕES

### Pontos Críticos Identificados

1. **⚠️ CRÍTICO**: Falta de RLS em `fila_emissao`
2. **⚠️ ALTO**: Race conditions potenciais
3. **⚠️ MÉDIO**: Falta de constraint UNIQUE
4. **⚠️ MÉDIO**: Validações de imutabilidade incompletas

### Recomendações Prioritárias

1. **Implementar RLS imediatamente** antes de qualquer mudança
2. **Adicionar constraint UNIQUE** para prevenir duplicação
3. **Usar advisory locks** em todas as operações críticas
4. **Criar triggers de validação** para garantir integridade
5. **Implementar feature flag** para rollback rápido

### Próximos Passos

1. ✅ Análise completa (este documento)
2. ⏳ Revisão e aprovação da arquitetura
3. ⏳ Implementação das migrations
4. ⏳ Desenvolvimento das APIs
5. ⏳ Integração do frontend
6. ⏳ Testes extensivos
7. ⏳ Deploy incremental

---

**Documento gerado em**: 29/01/2026  
**Última atualização**: 29/01/2026  
**Versão**: 1.0
