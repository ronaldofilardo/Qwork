# Fluxo Cadastro → Contrato → Pagamento

**Data:** 2026-01-15  
**Correção:** Discrepância enum + transação atômica

---

## Problemas Identificados

### 1. Enum `aguardando_pagamento` ausente no banco

- **Banco de desenvolvimento (nr-bps_db):** Status enum tinha apenas `pendente`, `aprovado`, `rejeitado`, `em_reanalise`
- **TypeScript:** StatusAprovacao incluía `aguardando_pagamento`
- **Impacto:** INSERT INTO tomadores com status='aguardando_pagamento' falhava com erro PostgreSQL 22P02

### 2. Transação não-atômica

- **Problema:** Rota usava `db.query('BEGIN')` seguido de múltiplos `db.query()`
- **Causa raiz:** Pool de conexões pode atribuir clientes diferentes para cada query
- **Consequência:** Queries executadas fora do escopo da transação, sem atomicidade garantida
- **Erro observado:** PostgreSQL 25P02 "transação atual foi interrompida" ao tentar retry

### 3. Tabela `contratos` não existe no banco de desenvolvimento

- **Achado:** Verificação do schema revelou que a tabela `contratos` não foi criada
- **Nota:** Código mantido para quando a tabela for criada, mas não causará erro no fluxo atual

---

## Correções Implementadas

### ✅ Tarefa 1: Adicionar valor ao enum

**Migration criada:** `database/migrations/002_add_aguardando_pagamento_to_status_enum.sql`

```sql
ALTER TYPE status_aprovacao_enum ADD VALUE 'aguardando_pagamento';
```

**Executada em:**

- ✓ nr-bps_db (dev)
- ✓ nr-bps_db_test (test - já tinha o valor)

**Resultado:**

```
status_aprovacao_enum:
  [1] pendente
  [2] aprovado
  [3] rejeitado
  [4] em_reanalise
  [5] aguardando_pagamento  ← ADICIONADO
```

### ✅ Tarefa 1.5: Adicionar coluna numero_funcionarios_estimado

**Migration criada:** `database/migrations/003_add_numero_funcionarios_estimado_to_tomadores.sql`

```sql
ALTER TABLE tomadores ADD COLUMN numero_funcionarios_estimado INTEGER NULL;
```

**Executada em:**

- ✓ nr-bps_db (dev)
- ✓ nr-bps_db_test (test - já tinha a coluna)

**Motivo:** Rota de cadastro tenta persistir o número estimado de funcionários informado no formulário.

### ✅ Tarefa 2: Refatorar transação na rota

**Arquivo:** `app/api/cadastro/tomador/route.ts`

#### Antes (não-atômico):

```typescript
await db.query('BEGIN');
try {
  const tomador = await createtomador({ ... });
  // ... mais operações ...
  await db.query('COMMIT');
} catch (error) {
  await db.query('ROLLBACK');
}
```

**Problemas:**

- Cada `db.query()` pode usar um cliente diferente do pool
- `createtomador()` usa `query()` internamente, não compartilha transação
- ROLLBACK pode falhar se executado em cliente diferente

#### Depois (atômico):

```typescript
const result = await db.transaction(async (txClient) => {
  // Todas as queries usam o mesmo txClient
  const emailCheck = await txClient.query(...);
  const cnpjCheck = await txClient.query(...);
  const tomadorResult = await txClient.query<tomador>(...);

  // ... operações dentro da transação ...

  return {
    tomador,
    requiresPayment,
    simuladorUrl,
    contratoIdCreated,
    // ... outros dados ...
  };
});
// COMMIT automático se nenhum erro
// ROLLBACK automático em caso de exceção
```

**Benefícios:**

- ✅ Garantia de atomicidade (mesma conexão para todas as queries)
- ✅ COMMIT/ROLLBACK automáticos gerenciados por `transaction()`
- ✅ Impossível executar queries fora do escopo da transação

### ✅ Tarefa 3: Remover lógica de enum fallback

**Antes:**

```typescript
// Checagem se enum existe
const enumCheck = await db.query("SELECT 1 FROM pg_enum ...");
if (enumCheck.rowCount > 0) {
  statusToUse = 'aguardando_pagamento';
}

// Retry com fallback
try {
  const contratoIns = await query(..., 'aguardando_pagamento', ...);
} catch (err) {
  if (msg.includes('invalid input value for enum')) {
    const contratoIns = await query(..., 'pendente', ...);
  }
}
```

**Depois:**

```typescript
// Enum garantido no banco após migration
let statusToUse: StatusAprovacao = 'pendente';
if (planoId) {
  statusToUse = 'aguardando_pagamento';
}

// INSERT direto, sem fallback
const tomadorResult = await txClient.query<tomador>(
  `INSERT INTO tomadores (..., status, ...) VALUES (..., $19, ...)`,
  [..., statusToUse, ...]
);
```

**Benefícios:**

- ✅ Código mais simples e direto
- ✅ Não há mais risco de retry em transação abortada
- ✅ Falha rápida se enum estiver incorreto (melhor para debugging)

---

## Fluxo Correto: Estados e Transições

### Estado 1: Cadastro Inicial

**Ação:** Usuário submete formulário de cadastro com plano selecionado

**Operações (dentro de transação atômica):**

1. Validar dados (email, CNPJ únicos)
2. INSERT tomador com `status='aguardando_pagamento'`, `ativa=false`, `pagamento_confirmado=false`
3. UPDATE numero_funcionarios_estimado (se fornecido)
4. SELECT plano para calcular valores
5. Se plano fixo: INSERT contrato com `status='aguardando_pagamento'`, `aceito=false`

**Estado resultante no banco:**

```sql
-- Tabela: tomadores
status: 'aguardando_pagamento'
ativa: false
pagamento_confirmado: false
plano_id: <id do plano selecionado>

-- Tabela: contratos (se plano fixo)
status: 'aguardando_pagamento'
aceito: false
valor_total: <calculado>
```

**Response para frontend:**

```json
{
  "success": true,
  "id": <tomador_id>,
  "requires_payment": true,
  "requires_contract_acceptance": true,  ← indica que há contrato pendente
  "contrato_id": <contrato_id>,
  "simulador_url": null,  ← não fornecido diretamente
  "message": "Cadastro realizado! Aceite o contrato gerado para prosseguir ao simulador."
}
```

### Estado 2: Aceite do Contrato

**Ação:** Usuário visualiza e aceita o contrato

**Operações esperadas (a implementar em rota separada):**

1. UPDATE contratos SET aceito=true WHERE id=<contrato_id>
2. Liberar acesso ao simulador de pagamento

**Estado resultante:**

```sql
-- Tabela: contratos
status: 'aguardando_pagamento'
aceito: true  ← mudou
```

**Response:**

```json
{
  "success": true,
  "simulador_url": "/pagamento/simulador?tomador_id=X&plano_id=Y&numero_funcionarios=Z"
}
```

### Estado 3: Simulador de Pagamento

**Ação:** Usuário configura pagamento (confirma valores, método de pagamento)

**Condição de entrada:** `contratos.aceito = true`

**Operações na rota `/pagamento/simulador/confirmar`:**

1. Validar contrato aceito
2. Processar pagamento (mock ou integração real)
3. UPDATE tomadores SET pagamento_confirmado=true, status='aprovado'
4. UPDATE contratos SET status='pago' ou 'pagamento_confirmado'

**Estado resultante:**

```sql
-- Tabela: tomadores
status: 'aprovado'  ← mudou
pagamento_confirmado: true  ← mudou
ativa: true  ← pode ser ativado ou aguardar aprovação admin

-- Tabela: contratos
status: 'pago'  ← mudou
aceito: true
```

### Estado 4: Acesso Liberado

**Condição:** `tomadores.pagamento_confirmado = true`

**Ações disponíveis:**

- Login do gestor habilitado
- Criação de funcionários
- Acesso ao sistema completo

---

## Checklist de Validação

### ✅ Banco de Dados

- [x] Enum `aguardando_pagamento` existe em `status_aprovacao_enum`
- [x] Migration aplicada em dev (nr-bps_db)
- [x] Migration aplicada em test (nr-bps_db_test)
- [ ] Tabela `contratos` criada (pendente - código já preparado)

### ✅ Código

- [x] Rota `/api/cadastro/tomador` usa `db.transaction()`
- [x] Todas as queries dentro usam `txClient`
- [x] Não há mais `db.query('BEGIN')` ou `db.query('COMMIT')` manual
- [x] Lógica de enum fallback removida
- [x] Status `aguardando_pagamento` usado quando há plano selecionado

### ✅ Fluxo

- [ ] POST /api/cadastro/tomador cria tomador com status correto
- [ ] Contrato criado se plano fixo
- [ ] Frontend recebe `contrato_id` e `requires_contract_acceptance`
- [ ] Rota de aceite de contrato (a implementar)
- [ ] Simulador de pagamento valida contrato aceito
- [ ] Pagamento confirmado atualiza estados corretamente

---

## Próximos Passos

1. **Testar fluxo completo:**
   - POST cadastro com plano fixo
   - Verificar response contém `contrato_id`
   - Verificar dados no banco

2. **Implementar rota de aceite de contrato** (se não existir):

   ```
   POST /api/contrato/[id]/aceitar
   ```

3. **Ajustar simulador de pagamento:**
   - Validar `contratos.aceito = true` antes de processar
   - Atualizar estados após pagamento

4. **Criar tabela `contratos`** (se não existir):

   ```sql
   CREATE TABLE contratos (
     id SERIAL PRIMARY KEY,
     tomador_id INTEGER REFERENCES tomadores(id),
     plano_id INTEGER REFERENCES planos(id),
     numero_funcionarios INTEGER,
     valor_total DECIMAL(10,2),
     status status_aprovacao_enum,  -- reutiliza enum existente
     aceito BOOLEAN DEFAULT FALSE,
     conteudo TEXT,
     criado_em TIMESTAMP DEFAULT NOW(),
     aceito_em TIMESTAMP
   );
   ```

5. **Testes de integração:**
   - Ajustar testes que validam `aguardando_pagamento`
   - Adicionar testes para fluxo contract-first
   - Validar transações atômicas (rollback em caso de erro)

---

## Comandos de Verificação

```powershell
# Verificar enum no banco
node scripts/checks/verify-status-enums.cjs

# Verificar estrutura da tabela tomadores
node scripts/checks/verify-database-structure.cjs

# Testar POST cadastro
# (aguardando implementação de teste automatizado)
```

---

**Status atual:** ✅ Correções implementadas, servidor rodando sem erros  
**Aguardando:** Teste do fluxo completo com POST real + validação no banco
