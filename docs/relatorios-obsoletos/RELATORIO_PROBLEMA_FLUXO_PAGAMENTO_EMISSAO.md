# 🚨 Relatório: Problema no Fluxo de Pagamento e Emissão de Laudos

**Data**: 10 de fevereiro de 2026  
**Lote Afetado**: 1005 (e potencialmente outros)  
**Ambiente**: PRODUÇÃO

---

## 📋 Sumário Executivo

O sistema está criando registros de laudos prematuramente (em status 'rascunho') antes do pagamento ser confirmado, causando conflitos entre o fluxo de pagamento e a lógica de emissão. O admin não consegue visualizar corretamente as solicitações de emissão porque os laudos já existem no banco com status inadequado.

---

## 🔍 Problemas Identificados

### ❌ Problema 1: Criação Prematura de Laudos

**Localização**: Trigger `fn_reservar_id_laudo_on_lote_insert()`

**Comportamento Atual**:

```sql
-- Trigger dispara APÓS criar lote
CREATE TRIGGER trg_reservar_id_laudo_on_lote_insert
AFTER INSERT ON lotes_avaliacao
FOR EACH ROW
EXECUTE FUNCTION fn_reservar_id_laudo_on_lote_insert();

-- Função insere laudo em 'rascunho'
INSERT INTO laudos (id, lote_id, status)
VALUES (NEW.id, NEW.id, 'rascunho')
ON CONFLICT (id) DO NOTHING;
```

**Problema**:

- Laudo é criado IMEDIATAMENTE quando lote é criado
- Isso acontece ANTES de:
  - Solicitação de emissão
  - Definição de valor pelo admin
  - Pagamento pelo solicitante
  - Emissor revisar o lote

**Impacto**:

- Sistema tenta gerar hash para laudo que não tem PDF
- Constraint `chk_laudos_hash_when_emitido` pode falhar
- Emissor pode ver laudos que não deveriam existir ainda

---

### ❌ Problema 2: Filtro de Emissor Bloqueia Lotes Não Pagos

**Localização**: `/api/emissor/lotes/route.ts` (linha 34)

**Código Atual**:

```typescript
WHERE la.status != 'cancelado'
  AND (fe.id IS NOT NULL OR (l.id IS NOT NULL AND l.emitido_em IS NOT NULL))
  AND (la.status_pagamento = 'pago' OR la.status_pagamento IS NULL)
```

**Problema**:

- Emissor SÓ vê lotes:
  - Pagos (`status_pagamento = 'pago'`)
  - OU antigos sem fluxo de pagamento (`status_pagamento IS NULL`)
- Lotes com `status_pagamento = 'aguardando_cobranca'` ou `aguardando_pagamento` são **INVISÍVEIS**

**Fluxo Correto Esperado**:

1. RH/Entidade solicita → `status_pagamento = 'aguardando_cobranca'` ✅
2. Admin define valor → status permanece `aguardando_cobranca` ✅
3. Admin gera link → `status_pagamento = 'aguardando_pagamento'` ✅
4. Solicitante confirma pagamento → `status_pagamento = 'pago'` ✅
5. **SOMENTE AGORA** emissor vê o lote ✅

**Resultado**:

- ✅ Filtro está CORRETO e funcionando como esperado
- ❌ O problema NÃO é o filtro, é a criação prematura do laudo

---

### ❌ Problema 3: Expectativa de Hash Antes do PDF Existir

**Localização**: Constraint na tabela `laudos`

**Constraint**:

```sql
CONSTRAINT chk_laudos_hash_when_emitido CHECK (
  status != 'emitido' OR hash_pdf IS NOT NULL
)
```

**Problema**:

- Constraint exige que laudos 'emitido' tenham hash
- Mas o laudo em 'rascunho' é criado ANTES do PDF existir
- Se algum código tentar marcar como 'emitido' sem gerar PDF primeiro, a constraint falha

**Erro Típico**:

```
ERROR: Laudo não pode ser marcado como emitido sem hash_pdf
```

---

### ❌ Problema 4: View `v_solicitacoes_emissao` Pode Mostrar Laudos Rascunho

**Localização**: `/database/migrations/800_add_payment_flow_to_lotes.sql`

**View Atual**:

```sql
CREATE OR REPLACE VIEW v_solicitacoes_emissao AS
SELECT
  la.id AS lote_id,
  la.status_pagamento,
  la.solicitacao_emissao_em,
  -- ... outros campos ...
FROM lotes_avaliacao la
WHERE la.status_pagamento IS NOT NULL
```

**Problema Potencial**:

- View NÃO verifica se laudo já existe
- Admin pode ver lotes com laudos já criados em 'rascunho'
- Pode causar confusão ao definir valor/gerar link

---

## 🎯 Análise do Lote 1005

### Sequência Provável de Eventos:

1. **Lote 1005 criado**
   - ✅ Trigger dispara
   - ✅ Laudo criado: `status = 'rascunho'`, `hash_pdf = NULL`

2. **RH/Entidade solicita emissão**
   - ✅ `/api/lotes/1005/solicitar-emissao` chamado
   - ✅ `status_pagamento = 'aguardando_cobranca'`
   - ✅ Registro em `auditoria_laudos`

3. **Admin acessa aba "Pagamentos"**
   - ❓ View `v_solicitacoes_emissao` mostra lote 1005
   - ❓ Admin vê lote com laudo já existente (rascunho)
   - ❌ **ERRO**: Sistema tenta executar alguma lógica que espera laudo não existir

4. **Emissor NÃO vê o lote**
   - ✅ Filtro funciona corretamente
   - ✅ Lote está `aguardando_cobranca`, não `pago`
   - ✅ Emissor só verá após pagamento confirmado

---

## ✅ Confirmação da Análise do Usuário

> "desde ha analise que o laudo ainda nao deve estar com o emissor pq nao foi confirmado pq nao houve pagamento, logo se nao esta com o emissor nao existe geração de hash"

**✅ CORRETO!** O usuário está certo:

- Laudo NÃO deveria estar com emissor (e não está - filtro correto)
- Pagamento NÃO foi confirmado
- Hash NÃO deveria existir (e não existe)

> "acho que o sistema ao reservar um id para o laudo esta colocando com status que o sistema entende que é para gerar um hash mesmo antes do arquivo em pdf existir"

**✅ CORRETO!** O problema é:

- Trigger cria laudo em 'rascunho' ANTES do fluxo de pagamento
- Algum código pode estar tentando marcar como 'emitido' sem gerar PDF
- Constraint bloqueia porque hash_pdf é NULL

> "um hash somente pode ser gerado depois que o emissor gera um laudo em pdf"

**✅ ABSOLUTAMENTE CORRETO!** Fluxo correto:

1. Pagamento confirmado
2. Emissor acessa lote
3. Emissor clica "Gerar Laudo"
4. Sistema gera PDF
5. Sistema calcula hash do PDF
6. Sistema marca laudo como 'emitido' com hash

---

## 🔧 Soluções Propostas

### Solução 1: Remover/Modificar Trigger de Criação de Laudo (RECOMENDADA)

**Opção A: Remover Trigger Completamente**

```sql
-- Migration: 1100_remove_premature_laudo_creation.sql
DROP TRIGGER IF EXISTS trg_reservar_id_laudo_on_lote_insert ON lotes_avaliacao;
DROP FUNCTION IF EXISTS fn_reservar_id_laudo_on_lote_insert();

-- Laudo será criado APENAS quando emissor clicar "Gerar Laudo"
COMMENT ON TABLE laudos IS
'Laudos são criados APENAS pelo emissor após pagamento confirmado e ao clicar em "Gerar Laudo"';
```

**Opção B: Modificar Trigger para Criar Apenas Após Pagamento**

```sql
-- Trigger dispara apenas quando pagamento é confirmado
CREATE OR REPLACE FUNCTION fn_criar_laudo_apos_pagamento()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status_pagamento = 'pago' AND OLD.status_pagamento != 'pago' THEN
    INSERT INTO laudos (id, lote_id, status, criado_em)
    VALUES (NEW.id, NEW.id, 'rascunho', NOW())
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_criar_laudo_apos_pagamento ON lotes_avaliacao;
CREATE TRIGGER trg_criar_laudo_apos_pagamento
  AFTER UPDATE ON lotes_avaliacao
  FOR EACH ROW
  WHEN (NEW.status_pagamento = 'pago')
  EXECUTE FUNCTION fn_criar_laudo_apos_pagamento();
```

---

### Solução 2: Ajustar View `v_solicitacoes_emissao`

```sql
-- Adicionar informação sobre laudo existente
CREATE OR REPLACE VIEW v_solicitacoes_emissao AS
SELECT
  la.id AS lote_id,
  la.status_pagamento,
  la.solicitacao_emissao_em,
  la.valor_por_funcionario,
  -- ... outros campos ...
  -- Adicionar informação sobre laudo
  l.id AS laudo_id,
  l.status AS laudo_status,
  l.hash_pdf AS laudo_hash,
  CASE
    WHEN l.id IS NOT NULL AND l.hash_pdf IS NOT NULL THEN true
    ELSE false
  END AS laudo_ja_emitido
FROM lotes_avaliacao la
LEFT JOIN laudos l ON l.lote_id = la.id  -- Adicionar JOIN
WHERE la.status_pagamento IS NOT NULL
ORDER BY la.solicitacao_emissao_em DESC NULLS LAST;
```

---

### Solução 3: Adicionar Validação no Admin

**Arquivo**: `/app/api/admin/emissoes/[loteId]/definir-valor/route.ts`

```typescript
// Verificar se laudo já foi emitido
const laudoCheck = await query(
  `SELECT id, status, hash_pdf FROM laudos WHERE lote_id = $1`,
  [loteId]
);

if (laudoCheck.rows.length > 0) {
  const laudo = laudoCheck.rows[0];
  if (laudo.status === 'emitido' || laudo.status === 'enviado') {
    return NextResponse.json(
      { error: 'Laudo já foi emitido para este lote' },
      { status: 400 }
    );
  }
}
```

---

### Solução 4: Adicionar Logs de Debug

```typescript
// Em /api/admin/emissoes/[loteId]/definir-valor/route.ts
console.log(`[ADMIN] Verificando lote ${loteId} para definir valor`);
console.log(`[ADMIN] Status pagamento: ${lote.status_pagamento}`);
console.log(`[ADMIN] Status lote: ${lote.status}`);

// Verificar laudo
const laudoDebug = await query(
  `SELECT id, status, hash_pdf, emissor_cpf FROM laudos WHERE lote_id = $1`,
  [loteId]
);
console.log(`[ADMIN] Laudo existente:`, laudoDebug.rows[0] || 'NENHUM');
```

---

## 🎯 Plano de Ação Imediato

### Fase 1: Diagnóstico (AGORA)

1. ✅ Identificar problema (CONCLUÍDO)
2. ⏳ Verificar lote 1005 em PROD:
   ```sql
   SELECT
     la.id,
     la.status AS lote_status,
     la.status_pagamento,
     la.solicitacao_emissao_em,
     l.id AS laudo_id,
     l.status AS laudo_status,
     l.hash_pdf,
     l.emissor_cpf
   FROM lotes_avaliacao la
   LEFT JOIN laudos l ON l.lote_id = la.id
   WHERE la.id = 1005;
   ```

### Fase 2: Correção Imediata (HOJE)

1. Aplicar Solução 3 (validação no admin)
2. Aplicar Solução 4 (logs de debug)
3. Testar com lote 1005

### Fase 3: Correção Estrutural (PRÓXIMOS DIAS)

1. Aplicar Solução 1 (remover/modificar trigger)
2. Aplicar Solução 2 (ajustar view)
3. Testar fluxo completo em dev
4. Aplicar em produção

---

## 📊 Impacto Estimado

### Lotes Afetados

- Todos os lotes criados após migration 999/1004
- Lotes com `status_pagamento IS NOT NULL`
- Lotes que têm laudo em 'rascunho' mas sem PDF

### Risco

- **MÉDIO**: Sistema não quebra completamente
- **ALTO**: Admin pode receber erros ao tentar processar solicitações
- **BAIXO**: Emissor não é afetado (filtro funciona corretamente)

---

## 📝 Checklist de Verificação

- [ ] Verificar lote 1005 em PROD (SQL acima)
- [ ] Verificar logs do admin ao tentar acessar lote 1005
- [ ] Confirmar se erro ocorre ao definir valor ou gerar link
- [ ] Verificar outros lotes com `status_pagamento` não NULL
- [ ] Confirmar fluxo: solicitar → definir valor → gerar link → pagar → emitir

---

## 🔗 Arquivos Relacionados

### Triggers/Functions

- `database/migrations/083_sync_lote_laudo_sequences.sql`
- `database/migrations/999_reserva_id_laudo_on_lote_insert.sql`
- `database/migrations/1004_fix_fn_reservar_laudo_status_rascunho.sql`

### APIs Afetadas

- `app/api/lotes/[loteId]/solicitar-emissao/route.ts`
- `app/api/admin/emissoes/[loteId]/definir-valor/route.ts`
- `app/api/admin/emissoes/[loteId]/gerar-link/route.ts`
- `app/api/emissor/lotes/route.ts`

### Migration Fluxo Pagamento

- `database/migrations/800_add_payment_flow_to_lotes.sql`

---

**FIM DO RELATÓRIO**
