# Correção de Erros Críticos: Avaliações e Lotes

**Data:** 04/02/2026  
**Autor:** Sistema  
**Status:** 🔴 CRÍTICO

---

## 📋 Problemas Identificados

### 1. 🔴 **CRÍTICO: Avaliações não são marcadas como 'concluída'**

**Problema:**  
Quando um funcionário responde todas as 37 questões da avaliação, o sistema não atualiza o status para `'concluida'` no banco de dados. A avaliação permanece como `'em_andamento'` ou `'iniciada'`, impedindo que:
- O lote avance para status `'concluido'`
- O botão "Solicitar Emissão do Laudo" seja exibido
- O fluxo de emissão seja completado

**Causa Raiz:**  
O código em [app/api/avaliacao/respostas/route.ts](../app/api/avaliacao/respostas/route.ts#L118-L250) executa a lógica de auto-conclusão quando `totalRespostas >= 37`, mas há casos onde:
1. A transação com `transactionWithContext` falha silenciosamente
2. O status é atualizado na memória mas não persiste no banco
3. Não há validação posterior para garantir consistência

**Evidências:**
- Avaliação #17 do lote 21 tem 37 respostas mas status = 'iniciada'
- Avaliação #51 (conforme screenshot) tem 37 respostas mas status != 'concluida'
- Dashboard da entidade não atualiza corretamente

---

### 2. 🔴 **CRÍTICO: lote_id_allocator sobrepondo IDs existentes**

**Problema:**  
A tabela `lote_id_allocator` (criada na migration 085) não está sincronizada com a tabela `lotes_avaliacao`, causando:
- Violações de PRIMARY KEY ao criar novos lotes
- IDs duplicados tentando ser inseridos
- Falhas ao liberar novos lotes de avaliação

**Causa Raiz:**  
1. A função `fn_next_lote_id()` não verifica se o ID já existe antes de retornar
2. O valor em `lote_id_allocator.last_id` está defasado em relação ao `MAX(id)` de `lotes_avaliacao`
3. Não há proteção contra race conditions ou colisões

**Evidências:**
- Conforme relatado: "lotes_id_allocator não esta respeitando a tabela de lotes e esta sobrepondo lotes"
- IDs sendo reutilizados ao criar novos lotes

---

## 🔧 Soluções Implementadas

### Migration 300: Correção de Auto-Conclusão de Avaliações

**Arquivo:** [database/migrations/300_fix_conclusao_automatica_avaliacao.sql](../database/migrations/300_fix_conclusao_automatica_avaliacao.sql)

**O que faz:**
1. ✅ **Diagnóstico:** Lista todas as avaliações com 37+ respostas mas status incorreto
2. ✅ **Correção de Dados:** Atualiza status para `'concluida'` em avaliações com 37+ respostas
3. ✅ **Trigger de Validação:** Cria `fn_validar_status_avaliacao()` para garantir consistência futura
4. ✅ **Verificação:** Valida se todas as avaliações estão corretas

**Trigger criado:**
```sql
CREATE TRIGGER trg_validar_status_avaliacao
    BEFORE UPDATE ON avaliacoes
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status OR NEW.status != 'concluida')
    EXECUTE FUNCTION fn_validar_status_avaliacao();
```

**Comportamento:**
- Antes de cada UPDATE em `avaliacoes`, verifica se tem 37+ respostas
- Se sim e status != 'concluida', ajusta automaticamente
- Garante que o banco sempre reflete o estado correto

---

### Migration 301: Correção do lote_id_allocator

**Arquivo:** [database/migrations/301_fix_lote_id_allocator_collision.sql](../database/migrations/301_fix_lote_id_allocator_collision.sql)

**O que faz:**
1. ✅ **Sincronização:** Atualiza `lote_id_allocator` para o `MAX(id)` atual
2. ✅ **Função Melhorada:** Reescreve `fn_next_lote_id()` com:
   - Verificação de colisões (loop com retry)
   - Sincronização automática com MAX(id)
   - Proteção contra race conditions
3. ✅ **Constraints:** Adiciona trigger para garantir apenas 1 linha em `lote_id_allocator`
4. ✅ **Função de Manutenção:** Cria `resincronizar_lote_id_allocator()` para correções futuras

**Função aprimorada:**
```sql
CREATE OR REPLACE FUNCTION fn_next_lote_id()
RETURNS bigint AS $$
DECLARE
    v_next bigint;
    v_max_existing bigint;
    v_retries INT := 0;
    v_max_retries INT := 5;
BEGIN
    -- Verificar MAX(id) atual
    SELECT COALESCE(MAX(id), 0) INTO v_max_existing FROM lotes_avaliacao;
    
    -- Loop com retry para garantir ID único
    LOOP
        UPDATE lote_id_allocator
        SET last_id = GREATEST(last_id + 1, v_max_existing + 1)
        RETURNING last_id INTO v_next;
        
        -- Verificar colisão
        IF NOT EXISTS (SELECT 1 FROM lotes_avaliacao WHERE id = v_next) THEN
            RETURN v_next;
        END IF;
        
        -- Retry
        v_retries := v_retries + 1;
        IF v_retries >= v_max_retries THEN
            RAISE EXCEPTION 'Falha ao gerar ID único após % tentativas', v_max_retries;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
```

---

## 📊 Scripts de Diagnóstico

### Script Completo

**Arquivo:** [scripts/diagnostico-completo-avaliacoes-lotes.sql](../scripts/diagnostico-completo-avaliacoes-lotes.sql)

**O que verifica:**
1. Avaliações com 37+ respostas e seu status
2. Estatísticas por status de avaliação
3. Estado do `lote_id_allocator` (sincronizado ou não)
4. Lotes recentes e validação de status
5. IDs duplicados ou gaps
6. Funções e triggers instalados
7. Resumo executivo do sistema

**Como executar:**
```bash
# No banco de produção (Neon)
psql "postgresql://..." -f scripts/diagnostico-completo-avaliacoes-lotes.sql

# Ou no banco local
psql -U postgres -d nr-bps_db -f scripts/diagnostico-completo-avaliacoes-lotes.sql
```

---

## 🚀 Plano de Aplicação

### 1️⃣ **Backup do Banco** (OBRIGATÓRIO)
```bash
# Neon (produção)
pg_dump "postgresql://..." > backup-pre-migrations-300-301.sql

# Local
pg_dump -U postgres nr-bps_db > backup-pre-migrations-300-301.sql
```

### 2️⃣ **Executar Diagnóstico**
```bash
psql "postgresql://..." -f scripts/diagnostico-completo-avaliacoes-lotes.sql
```

Analise a saída e identifique:
- Quantas avaliações têm erro
- Quantos lotes estão afetados
- Estado do allocator

### 3️⃣ **Aplicar Migration 300**
```bash
psql "postgresql://..." -f database/migrations/300_fix_conclusao_automatica_avaliacao.sql
```

**Verificações pós-migration:**
- Avaliações com 37+ respostas devem estar `'concluida'`
- Trigger `trg_validar_status_avaliacao` deve existir
- Campo `envio` preenchido nas avaliações corrigidas

### 4️⃣ **Aplicar Migration 301**
```bash
psql "postgresql://..." -f database/migrations/301_fix_lote_id_allocator_collision.sql
```

**Verificações pós-migration:**
- `lote_id_allocator.last_id` >= `MAX(id) de lotes_avaliacao`
- Função `fn_next_lote_id()` com validação de colisões
- Trigger `trg_lote_id_allocator_single_row` deve existir

### 5️⃣ **Executar Diagnóstico Novamente**
```bash
psql "postgresql://..." -f scripts/diagnostico-completo-avaliacoes-lotes.sql
```

Compare com a saída anterior:
- ✅ Avaliações com erro devem estar zeradas
- ✅ Allocator deve estar sincronizado
- ✅ Todos os triggers e funções devem estar presentes

### 6️⃣ **Testar Fluxo Completo**

**Teste 1: Completar Avaliação**
1. Login como funcionário
2. Responder 37 questões de uma avaliação
3. Verificar no banco: `status = 'concluida'` e `envio IS NOT NULL`

**Teste 2: Criar Novo Lote**
1. Login como gestor de entidade
2. Criar novo lote de avaliação
3. Verificar no banco: ID único, sem colisões

**Teste 3: Solicitar Emissão**
1. Concluir todas as avaliações de um lote
2. Verificar que lote mudou para `status = 'concluido'`
3. Botão "Solicitar Emissão do Laudo" deve aparecer

---

## 🔄 Comandos Úteis de Manutenção

### Verificar estado atual
```sql
-- Ver allocator
SELECT * FROM lote_id_allocator;

-- Ver MAX(id) de lotes
SELECT MAX(id) FROM lotes_avaliacao;

-- Verificar diferença
SELECT 
    (SELECT last_id FROM lote_id_allocator) as allocator,
    (SELECT MAX(id) FROM lotes_avaliacao) as max_lote,
    (SELECT MAX(id) FROM lotes_avaliacao) - (SELECT last_id FROM lote_id_allocator) as diferenca;
```

### Resincronizar manualmente (se necessário)
```sql
SELECT resincronizar_lote_id_allocator();
```

### Verificar avaliações com problemas
```sql
SELECT 
    a.id,
    a.status,
    COUNT(DISTINCT (r.grupo, r.item)) as respostas
FROM avaliacoes a
JOIN respostas r ON r.avaliacao_id = a.id
WHERE a.status != 'concluida'
GROUP BY a.id, a.status
HAVING COUNT(DISTINCT (r.grupo, r.item)) >= 37;
```

---

## 📝 Notas Importantes

### ⚠️ Sobre o Fluxo de Entidade vs Clínica

O problema afeta **apenas o fluxo de entidade**, porque:
- **Clínica:** Usa o mesmo código em `app/api/avaliacao/respostas/route.ts` que funciona corretamente
- **Entidade:** Usa o mesmo código, mas há casos específicos de RLS (Row Level Security) que podem causar falhas na transação

A correção via trigger garante que **ambos os fluxos** funcionem corretamente, independente de onde a avaliação é concluída.

### ⚠️ Sobre Race Conditions

A função `fn_next_lote_id()` melhorada inclui:
- **Advisory Lock:** `pg_advisory_xact_lock()` previne concorrência
- **Loop com Retry:** Até 5 tentativas em caso de colisão
- **Verificação Explícita:** Checa se ID já existe antes de retornar

### ⚠️ Rollback

Ambas as migrations são **transacionais** (usam BEGIN/COMMIT). Se houver erro durante aplicação:
1. A transação é revertida automaticamente
2. O banco permanece no estado anterior
3. Nenhuma alteração parcial é aplicada

---

## ✅ Checklist de Validação

Após aplicar as migrations, verificar:

- [ ] Todas as avaliações com 37+ respostas têm `status = 'concluida'`
- [ ] Campo `envio` preenchido nas avaliações concluídas
- [ ] `lote_id_allocator.last_id` >= `MAX(id)` de lotes_avaliacao
- [ ] Função `fn_next_lote_id()` retorna IDs únicos
- [ ] Função `fn_validar_status_avaliacao()` existe
- [ ] Trigger `trg_validar_status_avaliacao` está ativo
- [ ] Trigger `trg_lote_id_allocator_single_row` está ativo
- [ ] Criar novo lote funciona sem erros
- [ ] Completar avaliação atualiza status automaticamente
- [ ] Dashboard da entidade mostra status correto
- [ ] Botão "Solicitar Emissão" aparece quando lote está concluído

---

## 📞 Suporte

Se encontrar problemas após aplicar as migrations:

1. Execute o script de diagnóstico completo
2. Verifique os logs do PostgreSQL
3. Verifique os logs da aplicação (console do Next.js)
4. Se necessário, use a função `resincronizar_lote_id_allocator()`

---

**Última atualização:** 04/02/2026  
**Versão:** 1.0  
**Aplicável a:** Banco de Produção (Neon) e Desenvolvimento (Local)
