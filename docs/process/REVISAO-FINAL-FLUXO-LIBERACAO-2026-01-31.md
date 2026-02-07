# REVISÃO FINAL DO FLUXO DE LIBERAÇÃO DE LOTE ATÉ SOLICITAR EMISSÃO

**Data:** 31 de janeiro de 2026  
**Análise:** Pós-implementação das 9 correções críticas

---

## ✅ SCHEMA DE DADOS - VALIDADO

### Tabela `lotes_avaliacao` (Corrigida)

```sql
CREATE TABLE public.lotes_avaliacao (
    id integer NOT NULL,
    codigo character varying(20) NOT NULL,
    clinica_id integer,                    -- ✅ NULLABLE (permite Entity)
    empresa_id integer,                    -- ✅ NULLABLE (permite Entity)
    contratante_id integer,                -- ✅ ADICIONADO (suporta Entity)
    titulo character varying(100) NOT NULL,
    descricao text,
    tipo character varying(20) DEFAULT 'completo'::character varying,
    status character varying(20) DEFAULT 'rascunho'::character varying,
    liberado_por character(11) NOT NULL,
    liberado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    laudo_enviado_em timestamp without time zone,
    finalizado_em timestamp without time zone,
    numero_ordem integer DEFAULT 1 NOT NULL,
    processamento_em timestamp without time zone,

    -- ✅ CONSTRAINT XOR: clinica_id OU contratante_id (não ambos)
    CONSTRAINT lotes_avaliacao_clinica_or_contratante_check
        CHECK ((clinica_id IS NOT NULL AND contratante_id IS NULL)
            OR (clinica_id IS NULL AND contratante_id IS NOT NULL)),

    -- ✅ UNIQUE: Previne duplicação de numero_ordem por empresa
    CONSTRAINT lotes_avaliacao_empresa_numero_ordem_unique
        UNIQUE (empresa_id, numero_ordem),

    CONSTRAINT lotes_avaliacao_status_check
        CHECK (status IN ('ativo', 'cancelado', 'finalizado', 'concluido', 'rascunho')),

    CONSTRAINT lotes_avaliacao_tipo_check
        CHECK (tipo IN ('completo', 'operacional', 'gestao'))
);
```

**✅ Campos removidos (obsoletos):**

- ❌ `auto_emitir_em` - Emissão automática foi removida
- ❌ `auto_emitir_agendado` - Emissão automática foi removida
- ❌ `emitido_em` - Movido para tabela `laudos` (normalização)
- ❌ `enviado_em` - Movido para tabela `laudos` (normalização)

**✅ Tabelas obsoletas removidas:**

- ❌ `fila_emissao` - Sistema de emissão automática removido
- ❌ `lotes_avaliacao_funcionarios` - Nunca foi usado

---

## 🔄 FLUXO 1: LIBERAÇÃO DE LOTE (RH - CLÍNICA/EMPRESA)

### Endpoint: `POST /api/rh/liberar-lote`

**Arquivo:** `app/api/rh/liberar-lote/route.ts`

### 1️⃣ Autenticação e Validação Inicial

```typescript
- requireAuth() → user.perfil === 'rh'
- requireRHWithEmpresaAccess(empresa_id) → valida acesso à empresa
- Extrai: { titulo, descricao, dataFiltro, loteReferenciaId, tipo }
```

### 2️⃣ Cálculo de Elegibilidade

```typescript
// Usa função SQL: calcular_elegibilidade_lote(empresa_id, numero_ordem_atual)
const elegibilidadeResult = await query(
  `SELECT * FROM calcular_elegibilidade_lote($1, $2)`,
  [empresaId, numeroOrdem]
);

// Retorna:
// - funcionario_cpf
// - funcionario_nome
// - elegivel: boolean
// - motivo_inclusao: 'novo_funcionario' | 'data_ultima_avaliacao'
// - total_avaliacoes
// - indice_psicossocial_completo
```

**Critérios de Elegibilidade (SQL):**

1. ✅ Perfil = 'funcionario' (exclui RH e gestores)
2. ✅ Ativo = true
3. ✅ Não avaliado nos últimos 365 dias OU
4. ✅ Novo funcionário sem avaliação prévia
5. ✅ Índice psicossocial completo (grupos 1-8)

### 3️⃣ Filtros Opcionais

```typescript
// Filtro por data de contratação
if (dataFiltro) {
  funcionarios = funcionarios.filter((f) => f.criado_em > dataFiltro);
}

// Filtro por tipo de lote (operacional/gestão)
if (tipo !== 'completo') {
  funcionarios = funcionarios.filter((f) => f.nivel_cargo === tipo);
}
```

### 4️⃣ Criação do Lote (Transação)

```typescript
await query('BEGIN');

// Gerar código único
const codigo = await query(`SELECT gerar_codigo_lote() as codigo`);

// Inserir lote
const lote = await query(
  `INSERT INTO lotes_avaliacao 
   (codigo, clinica_id, empresa_id, titulo, descricao, tipo, status, liberado_por, numero_ordem) 
   VALUES ($1, $2, $3, $4, $5, $6, 'ativo', $7, $8) 
   RETURNING id, codigo, liberado_em, numero_ordem`,
  [codigo, clinicaId, empresaId, titulo, descricao, tipo, user.cpf, numeroOrdem]
);
```

**✅ Campos obrigatórios:**

- `clinica_id` → NOT NULL para RH
- `empresa_id` → NOT NULL para RH
- `contratante_id` → NULL para RH
- `liberado_por` → CPF do RH autenticado

### 5️⃣ Criação de Avaliações

```typescript
for (const func of funcionarios) {
  await query(
    `INSERT INTO avaliacoes 
     (funcionario_cpf, status, inicio, lote_id) 
     VALUES ($1, 'iniciada', NOW(), $2)`,
    [func.cpf, loteId]
  );
  avaliacoesCriadas++;
}

// ✅ ROLLBACK se nenhuma avaliação foi criada
if (avaliacoesCriadas === 0) {
  await query('ROLLBACK');
  return 500;
}
```

### 6️⃣ Auditoria e Commit

```typescript
await query(
  `INSERT INTO audit_logs 
   (user_cpf, action, resource, resource_id, details) 
   VALUES ($1, 'liberar_lote', 'lotes_avaliacao', $2, $3)`,
  [user.cpf, loteId, JSON.stringify({ avaliacoes: avaliacoesCriadas })]
);

await query('COMMIT');
```

---

## 🔄 FLUXO 2: LIBERAÇÃO DE LOTE (ENTIDADE - DIRETO CONTRATANTE)

### Endpoint: `POST /api/entidade/liberar-lote`

**Arquivo:** `app/api/entidade/liberar-lote/route.ts`

### 1️⃣ Autenticação

```typescript
- requireEntity() → user.perfil === 'gestor'
- contratanteId = session.contratante_id
```

### 2️⃣ Buscar Empresas Vinculadas

```typescript
const empresas = await query(
  `SELECT DISTINCT empresa_id
   FROM funcionarios
   WHERE contratante_id = $1
     AND empresa_id IS NOT NULL
     AND ativo = true`,
  [contratanteId]
);

// ✅ LOOP: Processa cada empresa independentemente (sem transação global)
for (const empresa of empresas) { ... }
```

### 3️⃣ Cálculo de Elegibilidade (Por Empresa)

```typescript
// Usa função SQL: calcular_elegibilidade_lote_contratante(contratante_id, numero_ordem)
const elegibilidadeResult = await query(
  `SELECT * FROM calcular_elegibilidade_lote_contratante($1, $2)`,
  [contratanteId, numeroOrdem]
);
```

**✅ Diferença:** Calcula elegibilidade por `contratante_id` (não por empresa_id)

### 4️⃣ Criação do Lote (Sem Transação Explícita)

```typescript
const lote = await queryWithContext(
  `INSERT INTO lotes_avaliacao 
   (codigo, clinica_id, empresa_id, titulo, descricao, tipo, status, liberado_por, numero_ordem) 
   VALUES ($1, $2, $3, $4, $5, $6, 'ativo', $7, $8) 
   RETURNING id, codigo, liberado_em, numero_ordem`,
  [
    codigo,
    clinicaId,
    empresaId,
    titulo,
    descricao,
    tipo,
    session.cpf,
    numeroOrdem,
  ]
);
```

**⚠️ OBSERVAÇÃO:** Entity **não usa transação explícita** porque:

1. Processa múltiplas empresas em loop
2. Cada empresa é independente (falha em uma não afeta outras)
3. Comportamento intencional (não é erro)

**✅ Campos obrigatórios:**

- `clinica_id` → Vem de `empresas_clientes.clinica_id`
- `empresa_id` → NOT NULL (mesmo para Entity)
- `contratante_id` → NULL para Entity (não é gravado)

**❌ PROBLEMA IDENTIFICADO:** Entity ainda grava `clinica_id` e `empresa_id`, mas deveria gravar `contratante_id` conforme schema corrigido!

---

## 🔄 FLUXO 3: RECÁLCULO DE STATUS DO LOTE

### Biblioteca: `lib/lotes.ts` - Função `recalcularStatusLotePorId()`

**Quando é chamado:**

- Ao finalizar uma avaliação
- Ao inativar uma avaliação
- Ao restaurar uma avaliação

### Máquina de Estados

```typescript
// ✅ REGRAS DEFINIDAS (não alterar):
// 1. Todas inativadas → 'cancelado'
// 2. (concluídas + inativadas) == liberadas → 'concluido'
// 3. Caso contrário → 'ativo'

if (inativadas === total_avaliacoes) {
  novoStatus = 'cancelado';
} else if (concluidas > 0 && concluidas + inativadas === liberadas) {
  novoStatus = 'concluido';
} else {
  novoStatus = 'ativo';
}
```

**✅ Validação SQL adicional:**

```sql
SELECT * FROM validar_lote_pre_laudo($1)
-- Retorna:
-- - valido: boolean
-- - alertas: text[]
-- - funcionarios_pendentes: integer
-- - detalhes: jsonb
```

---

## 🔄 FLUXO 4: SOLICITAÇÃO DE EMISSÃO MANUAL

### Endpoint: `POST /api/lotes/[loteId]/solicitar-emissao`

**Arquivo:** `app/api/lotes/[loteId]/solicitar-emissao/route.ts`

### 1️⃣ Autenticação e Validação de Permissão

```typescript
const user = await requireAuth();

// Buscar lote
const lote = await query(
  `SELECT id, codigo, status, clinica_id, empresa_id, contratante_id 
   FROM lotes_avaliacao 
   WHERE id = $1`,
  [loteId]
);

// ✅ VALIDAÇÃO DE PERMISSÃO (RH vs Entity)
if (lote.clinica_id && user.perfil === 'rh') {
  await requireRHWithEmpresaAccess(lote.empresa_id);
} else if (lote.contratante_id && user.perfil === 'gestor') {
  if (user.contratante_id !== lote.contratante_id) {
    return 403; // Sem permissão
  }
} else {
  return 403; // Perfil não autorizado
}
```

### 2️⃣ Validações de Estado

```typescript
// ✅ Lote deve estar 'concluido'
if (lote.status !== 'concluido') {
  return 400;
}

// ✅ Laudo NÃO pode ter sido emitido
const laudoExistente = await query(
  `SELECT id, status FROM laudos WHERE lote_id = $1`,
  [loteId]
);

if (
  laudoExistente.rows.length > 0 &&
  laudoExistente.rows[0].status === 'enviado'
) {
  return 400;
}
```

### 3️⃣ Registro de Auditoria (Sem Fila)

```typescript
await query('BEGIN');

// Advisory lock
await query('SELECT pg_advisory_xact_lock($1)', [loteId]);

// ❌ REMOVIDO: INSERT INTO fila_emissao (obsoleto)

// ✅ Apenas auditoria
await query(
  `INSERT INTO auditoria_laudos 
   (lote_id, acao, status, emissor_cpf, emissor_nome, ip_address, observacoes) 
   VALUES ($1, 'solicitacao_manual', 'pendente', $2, $3, $4, $5)`,
  [
    loteId,
    user.cpf,
    user.nome,
    ip_address,
    `Solicitação manual por ${user.perfil}`,
  ]
);

await query('COMMIT');
```

**✅ Sem emissão automática:** O laudo será gerado manualmente pelo EMISSOR quando acessar o dashboard.

---

## 🚨 PROBLEMA CRÍTICO IDENTIFICADO

### ❌ Entity não grava `contratante_id` corretamente

**Local:** `app/api/entidade/liberar-lote/route.ts` linha ~135

**Código atual:**

```typescript
const loteResult = await queryWithContext(
  `INSERT INTO lotes_avaliacao 
   (codigo, clinica_id, empresa_id, titulo, descricao, tipo, status, liberado_por, numero_ordem) 
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
  [
    codigo,
    clinicaId,
    empresaId,
    titulo,
    descricao,
    tipo,
    session.cpf,
    numeroOrdem,
  ]
);
```

**❌ ERRO:** Está inserindo `clinica_id` e `empresa_id`, mas:

1. XOR constraint exige `contratante_id` OU `clinica_id` (não ambos)
2. Schema espera `contratante_id` para fluxo Entity
3. Violará constraint quando executar

**✅ CORREÇÃO NECESSÁRIA:**

```typescript
const loteResult = await queryWithContext(
  `INSERT INTO lotes_avaliacao 
   (codigo, contratante_id, titulo, descricao, tipo, status, liberado_por, numero_ordem) 
   VALUES ($1, $2, $3, $4, $5, 'ativo', $6, $7)`,
  [codigo, contratanteId, titulo, descricao, tipo, session.cpf, numeroOrdem]
);
```

---

## ✅ VALIDAÇÕES UNIFICADAS

### Função SQL: `validar_lote_pre_laudo(lote_id)`

**Usado por:**

- ✅ `app/api/rh/lotes/route.ts` (GET - listar lotes)
- ✅ `app/api/emissor/lotes/route.ts` (GET - listar lotes)
- ✅ `app/api/entidade/lotes/route.ts` (GET - listar lotes)
- ✅ `app/api/laudos/validar-lote/route.ts` (POST - validação explícita)

**❌ REMOVIDO:**

- `lib/validacao-lote-laudo.ts` - Duplicação JavaScript removida

---

## 📊 RESUMO DE CONSISTÊNCIA

### ✅ CORRETO

1. Schema com XOR constraint (clinica_id OU contratante_id)
2. UNIQUE constraint em (empresa_id, numero_ordem)
3. Validação unificada via SQL function
4. Emissão automática completamente removida
5. Tabelas obsoletas removidas
6. RH usa transação com ROLLBACK
7. Entity processa múltiplas empresas independentemente
8. Solicitação manual registra apenas auditoria

### ❌ PROBLEMA CRÍTICO

**Entity liberar-lote ainda insere clinica_id/empresa_id em vez de contratante_id**

### ⚠️ OBSERVAÇÕES

1. Entity não precisa de ROLLBACK (intencional - múltiplas empresas)
2. Função `calcular_elegibilidade_lote_contratante` existe e funciona
3. Migrações criadas mas não aplicadas ao banco ainda

---

## 🔧 CORREÇÃO FINAL NECESSÁRIA

**Arquivo:** `app/api/entidade/liberar-lote/route.ts`

**Linhas:** ~130-150

**Ação:** Alterar INSERT para usar `contratante_id` em vez de `clinica_id`/`empresa_id`
