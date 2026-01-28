# Checklist de Verificação - Emissão Automática de Laudos

**Data:** 5 de janeiro de 2026  
**Versão:** 1.0

---

## ✅ Pré-Requisitos

- [ ] PostgreSQL 17+ instalado
- [ ] Database `nr-bps_db` ou `nr-bps_db_test` configurado
- [ ] Node.js 18+ e pnpm instalados
- [ ] Variáveis de ambiente configuradas (`DATABASE_URL`, `CRON_SECRET`)

---

## 📋 Checklist de Implementação

### **1. Migration SQL**

- [ ] Executar `075_add_emissao_automatica_fix_flow.sql`

  ```bash
  psql -U postgres -d nr-bps_db -f database/migrations/075_add_emissao_automatica_fix_flow.sql
  ```

- [ ] Verificar novos campos criados:

  ```sql
  \d lotes_avaliacao
  -- Deve mostrar: emitido_em, enviado_em, cancelado_automaticamente, motivo_cancelamento
  ```

- [ ] Verificar triggers criados:

  ```sql
  \df verificar_cancelamento_automatico_lote
  \df verificar_conclusao_lote
  -- Ambos devem existir
  ```

- [ ] Verificar views criadas:
  ```sql
  \dv vw_metricas_emissao_laudos
  \dv vw_alertas_emissao_laudos
  -- Ambas devem existir
  ```

### **2. Código e Endpoints**

- [ ] Verificar arquivo `lib/laudo-auto.ts` refatorado
  - [ ] Função `emitirLaudoImediato(loteId)` existe
  - [ ] Função `emitirLaudosAutomaticamente()` refatorada
  - [ ] Função `enviarLaudosAutomaticamente()` refatorada
  - [ ] Função `enviarLaudoAutomatico(laudo)` existe

- [ ] Verificar endpoint `app/api/cron/emitir-laudos-auto/route.ts` criado
  - [ ] Exporta `GET`
  - [ ] Tem autenticação via `x-vercel-cron` ou `Bearer`
  - [ ] `maxDuration = 300`
  - [ ] `runtime = 'nodejs'`

- [ ] Verificar endpoint `app/api/system/monitoramento-emissao/route.ts` criado
  - [ ] Exporta `GET`
  - [ ] Requer perfil `admin` ou `emissor`

- [ ] Verificar `vercel.json` atualizado
  - [ ] Cron `*/5 * * * *` para `/api/cron/emitir-laudos-auto`

### **3. Testes**

- [ ] Executar testes unitários:

  ```bash
  pnpm test emissao-automatica-refatorada
  ```

  **Esperado:** Todos os testes passam (12+ testes)

- [ ] Executar testes de integração:
  ```bash
  pnpm test emitir-laudos-auto
  pnpm test monitoramento-emissao
  ```
  **Esperado:** Todos os testes passam (15+ testes)

### **4. Testes Manuais**

#### **Teste 1: Emissão Imediata**

1. Criar lote e concluir todas avaliações
2. Aguardar até 5 minutos
3. Verificar:
   ```sql
   SELECT id, codigo, status, emitido_em, enviado_em
   FROM lotes_avaliacao
   WHERE id = <lote_id>;
   ```
   **Esperado:**
   - `status = 'concluido'`
   - `emitido_em IS NOT NULL` (em até 5 min)
   - `enviado_em IS NULL` (ainda não enviado)

#### **Teste 2: Envio Delayed**

1. Aguardar 10 minutos após `emitido_em`
2. Verificar:
   ```sql
   SELECT id, codigo, emitido_em, enviado_em,
          EXTRACT(EPOCH FROM (enviado_em - emitido_em))::INTEGER as delay_segundos
   FROM lotes_avaliacao
   WHERE id = <lote_id>;
   ```
   **Esperado:**
   - `enviado_em IS NOT NULL`
   - `delay_segundos ~= 600` (aproximadamente 10 minutos)

#### **Teste 3: Cancelamento Automático**

1. Criar lote com 3 avaliações
2. Inativar todas as 3 avaliações
3. Verificar:
   ```sql
   SELECT id, codigo, status, cancelado_automaticamente, motivo_cancelamento
   FROM lotes_avaliacao
   WHERE id = <lote_id>;
   ```
   **Esperado:**
   - `status = 'cancelado'`
   - `cancelado_automaticamente = true`
   - `motivo_cancelamento` preenchido

#### **Teste 4: Idempotência**

1. Emitir laudo de um lote
2. Chamar `/api/cron/emitir-laudos-auto` novamente
3. Verificar:
   ```sql
   SELECT COUNT(*) FROM laudos WHERE lote_id = <lote_id>;
   SELECT COUNT(*) FROM auditoria_laudos
   WHERE lote_id = <lote_id> AND acao = 'emissao_automatica';
   ```
   **Esperado:**
   - Apenas 1 laudo criado
   - Apenas 1 registro de auditoria (não duplicado)

### **5. Monitoramento**

- [ ] Acessar endpoint de monitoramento:

  ```bash
  curl -H "Authorization: Bearer <admin-token>" \
       http://localhost:3000/api/system/monitoramento-emissao
  ```

- [ ] Verificar resposta JSON contém:
  - [ ] `metricas_gerais` (emissões/envios 24h, latências)
  - [ ] `percentis_latencia` (P50, P95, P99)
  - [ ] `alertas_criticos` (array)
  - [ ] `lotes_pendentes_emissao` (array)
  - [ ] `lotes_pendentes_envio` (array)
  - [ ] `historico_emissoes` (array)
  - [ ] `erros_recentes` (array)
  - [ ] `emissor_status` (ok: true/false)

### **6. Diagnóstico SQL**

- [ ] Executar função de diagnóstico:

  ```sql
  SELECT * FROM diagnosticar_lote_emissao(<lote_id>);
  ```

  **Esperado:** Tabela com status detalhado de cada campo

- [ ] Verificar métricas:

  ```sql
  SELECT * FROM vw_metricas_emissao_laudos LIMIT 10;
  ```

  **Esperado:** Latências de emissão/envio em segundos

- [ ] Verificar alertas:
  ```sql
  SELECT * FROM vw_alertas_emissao_laudos WHERE tipo_alerta LIKE 'CRITICO%';
  ```
  **Esperado:** Lista de lotes com problemas (se houver)

---

## 🚨 Resolução de Problemas

### **Problema: Lote não emite após conclusão**

**Verificar:**

```sql
-- 1. Status do lote
SELECT id, codigo, status, emitido_em, atualizado_em
FROM lotes_avaliacao WHERE id = <lote_id>;

-- 2. Avaliações
SELECT COUNT(*), status FROM avaliacoes
WHERE lote_id = <lote_id> GROUP BY status;

-- 3. Emissor ativo
SELECT cpf, nome FROM funcionarios
WHERE perfil = 'emissor' AND ativo = true;

-- 4. Último log de cron
SELECT * FROM auditoria_laudos
WHERE lote_id = <lote_id>
ORDER BY criado_em DESC LIMIT 5;
```

**Soluções:**

- Se `status != 'concluido'`: Verificar se todas avaliações foram concluídas
- Se não há emissor ativo: Ativar um emissor no sistema
- Se há erro em auditoria: Verificar logs detalhados

### **Problema: Laudo emitido mas não enviado**

**Verificar:**

```sql
SELECT
  id, codigo, emitido_em, enviado_em, auto_emitir_em,
  EXTRACT(EPOCH FROM (NOW() - emitido_em))::INTEGER as idade_emissao_seg,
  EXTRACT(EPOCH FROM (auto_emitir_em - NOW()))::INTEGER as tempo_ate_envio_seg
FROM lotes_avaliacao WHERE id = <lote_id>;
```

**Soluções:**

- Se `tempo_ate_envio_seg > 0`: Aguardar até `auto_emitir_em`
- Se `tempo_ate_envio_seg < 0` e `enviado_em IS NULL`: Verificar logs de erro

### **Problema: Lote não cancela automaticamente**

**Verificar:**

```sql
-- Trigger existe?
\df verificar_cancelamento_automatico_lote

-- Todas avaliações inativadas?
SELECT status, COUNT(*) FROM avaliacoes
WHERE lote_id = <lote_id> GROUP BY status;
```

**Soluções:**

- Recriar trigger executando migration
- Verificar se lote está `status = 'ativo'` (trigger só funciona em ativos)

---

## 📊 Métricas de Sucesso

### **Latências Esperadas**

| Métrica       | Valor Ideal | Valor Aceitável | Crítico |
| ------------- | ----------- | --------------- | ------- |
| Emissão (P50) | < 30s       | < 60s           | > 120s  |
| Emissão (P95) | < 60s       | < 120s          | > 300s  |
| Envio (P50)   | ~600s       | 600-650s        | > 700s  |
| Envio (P95)   | ~610s       | 610-660s        | > 720s  |

### **Taxa de Sucesso**

- **Emissões bem-sucedidas:** > 99%
- **Envios bem-sucedidos:** > 99.5%
- **Cancelamentos automáticos:** 100% (quando aplicável)

---

## ✅ Aprovação Final

- [ ] Todos os testes passam
- [ ] Testes manuais executados com sucesso
- [ ] Monitoramento funcional
- [ ] Documentação revisada
- [ ] Deploy realizado (staging)
- [ ] Validação em staging OK
- [ ] Deploy produção autorizado

---

**Data de Verificação:** ********\_********  
**Responsável:** ********\_********  
**Status:** [ ] Aprovado [ ] Pendente [ ] Reprovado
