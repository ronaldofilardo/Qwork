# Correção: Status de Avaliações em Andamento não Sincronizava

## 🐛 Problema Identificado

Avaliações com respostas salvas (por exemplo, 7/37 ou 13/37 questões respondidas) continuavam com status `'iniciada'` mesmo estando em andamento, causando inconsistência na visualização do lote pelo RH.

## 🔍 Causa Raiz

**Trigger `prevent_modification_after_emission` com erro fatal:**

- O trigger foi criado para prevenir modificações em avaliações após emissão do laudo
- Estava tentando acessar a coluna `codigo` da tabela `lotes_avaliacao`
- Essa coluna foi removida nas migrations 085, 160 e 164
- O trigger falhava silenciosamente, bloqueando TODAS as atualizações de status

**Fluxo quebrado:**

```
Funcionário responde → POST /api/avaliacao/respostas →
Tenta UPDATE status 'iniciada' → 'em_andamento' →
Trigger falha (coluna 'codigo' não existe) →
Erro capturado silenciosamente pelo try-catch →
Status permanece 'iniciada'
```

## ✅ Solução Aplicada

### 1. **Migration 997: Correção do Trigger**

Arquivo: `database/migrations/997_fix_prevent_modification_trigger.sql`

**Alterações:**

- Removida referência à coluna inexistente `codigo`
- Simplificado para usar apenas `emitido_em`
- Corrigido para funcionar com INSERT, UPDATE e DELETE
- Mantida a segurança: laudos emitidos permanecem imutáveis

**Antes:**

```sql
SELECT emitido_em, codigo INTO lote_emitido_em, lote_codigo
FROM lotes_avaliacao
WHERE id = NEW.lote_id;
```

**Depois:**

```sql
SELECT emitido_em INTO lote_emitido_em
FROM lotes_avaliacao
WHERE id = lote_id_val;
```

### 2. **Melhor Logging de Erros**

Arquivo: `app/api/avaliacao/respostas/route.ts` (linhas 65-73)

**Alteração:**

- Trocado `console.warn` por `console.error` com detalhes completos
- Log estruturado com `message`, `code`, `detail`, `avaliacaoId`
- Permite diagnóstico rápido de falhas futuras

### 3. **Correção Manual dos Dados**

Script de diagnóstico e correção aplicado com sucesso:

**Avaliações corrigidas:**

- Avaliação #31 (Jose do UP01): 13 respostas → status atualizado para `'em_andamento'`
- Avaliação #30 (DIMore Itali): 6 respostas → status atualizado para `'em_andamento'`

## 📊 Resultado

**Distribuição de status após correção:**
| Status | Total | Com Respostas |
|--------|-------|---------------|
| concluida | 15 | 15 |
| em_andamento | 2 | 2 |
| inativada | 14 | 1 |

✅ **0 avaliações com status inconsistente**

## 🔄 Fluxo Corrigido

```
Funcionário responde questão →
POST /api/avaliacao/respostas →
Salva resposta no banco →
Verifica status atual →
IF status == 'iniciada' THEN
  UPDATE para 'em_andamento' ✅
  Trigger valida (sem erro) ✅
  Log de sucesso ✅
END IF
```

## 🎯 Implementação Existente (Confirmada Funcionando)

1. **Backend Auto-Update** (`app/api/avaliacao/respostas/route.ts`, linhas 58-73):
   - Atualização automática após salvar respostas
   - Erro handling robusto
2. **Frontend Defensive Sync** (`app/avaliacao/page.tsx`, linhas 168-184):
   - Verifica inconsistências ao carregar página
   - Força sync se necessário

3. **Teste Unitário** (`__tests__/api/avaliacao/respostas.test.ts`, linhas 150-185):
   - Valida comportamento esperado
   - Mocks de todas as dependências

## 📝 Arquivos Modificados

1. ✅ `database/migrations/997_fix_prevent_modification_trigger.sql` (NOVO)
2. ✅ `app/api/avaliacao/respostas/route.ts` (melhor logging)

## 🧪 Validação

- [x] Trigger corrigido e aplicado ao banco local
- [x] Dados inconsistentes corrigidos (2 avaliações)
- [x] Logging melhorado para futuros diagnósticos
- [x] Sistema de auto-update de status funcionando
- [ ] **PENDENTE**: Aplicar migration 997 no banco Neon (produção)
- [ ] **PENDENTE**: Verificar se há inconsistências em produção e corrigir

## ⚠️ Próximos Passos Críticos

### Para Produção (Neon):

```bash
# 1. Conectar ao Neon
psql $env:DATABASE_URL

# 2. Aplicar migration
\i database/migrations/997_fix_prevent_modification_trigger.sql

# 3. Verificar inconsistências
SELECT a.id, a.funcionario_cpf, a.status, COUNT(r.id) as respostas
FROM avaliacoes a
LEFT JOIN respostas r ON r.avaliacao_id = a.id
WHERE a.status = 'iniciada'
GROUP BY a.id, a.funcionario_cpf, a.status
HAVING COUNT(r.id) > 0;

# 4. Se houver inconsistências, corrigir:
BEGIN;
SET LOCAL app.current_user_cpf = '00000000000';
SET LOCAL app.current_user_perfil = 'sistema';
UPDATE avaliacoes SET status = 'em_andamento', atualizado_em = NOW()
WHERE id IN (SELECT id FROM [...query acima...]);
COMMIT;
```

## 📚 Documentação Relacionada

- `DATABASE-POLICY.md` - Política de segregação de ambientes
- Migration 085, 160, 164 - Remoção da coluna `codigo`
- Migration 996 - Criação original do trigger (agora corrigido em 997)
- `CORRECAO-AUTO-CONCLUSAO-AVALIACOES.md` - Auto-conclusão aos 37 respostas

---

**Data:** 04/02/2026  
**Autor:** Sistema de correção automática  
**Status:** ✅ Corrigido em desenvolvimento, aguardando aplicação em produção
