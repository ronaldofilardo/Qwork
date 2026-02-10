# 🔧 Guia de Correção: Problema no Fluxo de Pagamento e Emissão

## 📋 Sumário

O sistema está criando laudos prematuramente (em status 'rascunho') através de uma trigger, antes do fluxo de pagamento ser concluído. Isso causa conflitos e erros quando o admin tenta processar solicitações de emissão.

---

## 🎯 Problema Confirmado

Sua análise está 100% correta:

> "ao reservar um id para o laudo esta colocando com status que o sistema entende que é para gerar um hash mesmo antes do arquivo em pdf existir"

✅ **CORRETO**: Existe uma trigger (`fn_reservar_id_laudo_on_lote_insert()`) que cria laudo em 'rascunho' IMEDIATAMENTE quando o lote é criado, ANTES de:

- Solicitação de emissão
- Definição de valor
- Pagamento
- Geração do PDF

> "um hash somente pode ser gerado depois que o emissor gera um laudo em pdf"

✅ **ABSOLUTAMENTE CORRETO**: O hash deve ser calculado a partir do PDF físico gerado pelo emissor.

---

## 🚀 Execução Rápida (Produção)

### Passo 1: Diagnóstico

```powershell
# Executar diagnóstico do lote 1005
.\diagnostico_completo.ps1 -Lote 1005
```

Isso mostrará:

- Estado atual do lote 1005
- Se há laudo criado prematuramente
- Status do fluxo de pagamento
- Histórico de auditoria

### Passo 2: Aplicar Correções

```powershell
# Aplicar correções (após revisar diagnóstico)
.\diagnostico_completo.ps1 -Lote 1005 -Aplicar
```

Isso irá:

1. ✅ Remover trigger de criação prematura
2. ✅ Limpar laudos rascunho órfãos
3. ✅ Atualizar view v_solicitacoes_emissao
4. ✅ Adicionar validações no admin

---

## 📝 O Que Foi Corrigido

### 1. APIs do Admin (Imediato)

- ✅ Adicionada validação em `definir-valor` para detectar laudos já emitidos
- ✅ Adicionada validação em `gerar-link` para prevenir conflitos
- ✅ Adicionados logs de debug para facilitar troubleshooting

### 2. Migration 1100 (Estrutural)

- ✅ Remove trigger `trg_reservar_id_laudo_on_lote_insert`
- ✅ Limpa laudos rascunho órfãos (criados antes do pagamento)
- ✅ Atualiza view `v_solicitacoes_emissao` para incluir info do laudo
- ✅ Atualiza documentação da tabela `laudos`

---

## 🔄 Fluxo Correto Após Correção

### Antes (❌ Errado)

```
1. Criar lote
2. ❌ Trigger cria laudo em 'rascunho' automaticamente
3. Solicitar emissão
4. Admin tenta definir valor
5. ❌ ERRO: Laudo já existe em rascunho
```

### Depois (✅ Correto)

```
1. Criar lote
2. ✅ Nenhum laudo é criado
3. Solicitar emissão → `status_pagamento = 'aguardando_cobranca'`
4. Admin define valor → ✅ Sem conflitos
5. Admin gera link → `status_pagamento = 'aguardando_pagamento'`
6. Solicitante paga → `status_pagamento = 'pago'`
7. Emissor vê lote no dashboard
8. Emissor clica "Gerar Laudo"
9. ✅ Sistema cria laudo + gera PDF + calcula hash
10. Status = 'emitido' com hash_pdf
11. Emissor envia → Status = 'enviado'
```

---

## 🧪 Testes Pós-Correção

### 1. Testar Lote 1005 (Existente)

```sql
-- Verificar estado após correção
SELECT
  la.id, la.status_pagamento,
  l.id AS laudo_id, l.status AS laudo_status, l.hash_pdf
FROM lotes_avaliacao la
LEFT JOIN laudos l ON l.lote_id = la.id
WHERE la.id = 1005;
```

Resultado esperado:

- Se lote não estava pago: laudo deve ter sido removido
- Se estava com laudo rascunho órfão: deve ter sido limpo

### 2. Testar Novo Lote

1. ✅ Criar novo lote (RH)
2. ✅ Verificar que NÃO há laudo:
   ```sql
   SELECT * FROM laudos WHERE lote_id = [novo_lote_id];
   -- Deve retornar 0 registros
   ```
3. ✅ Solicitar emissão
4. ✅ Admin define valor (deve funcionar sem erro)
5. ✅ Admin gera link (deve funcionar sem erro)
6. ✅ Confirmar pagamento simulado
7. ✅ Verificar que emissor vê o lote
8. ✅ Emissor gera laudo
9. ✅ Verificar que laudo foi criado COM hash

---

## 🐛 Debug: Se Admin Ainda Ver Erro no Lote 1005

### Verificar estado atual

```sql
-- Ver tudo sobre o lote 1005
SELECT * FROM v_solicitacoes_emissao WHERE lote_id = 1005;
```

### Limpar manualmente se necessário

```sql
-- SOMENTE se o lote está travado
BEGIN;

-- Verificar estado
SELECT
  la.status_pagamento,
  l.id AS laudo_id, l.status AS laudo_status
FROM lotes_avaliacao la
LEFT JOIN laudos l ON l.lote_id = la.id
WHERE la.id = 1005;

-- Se tem laudo rascunho órfão, remover
DELETE FROM laudos
WHERE lote_id = 1005
  AND status = 'rascunho'
  AND hash_pdf IS NULL
  AND emitido_em IS NULL;

-- Resetar status de pagamento se necessário
UPDATE lotes_avaliacao
SET status_pagamento = 'aguardando_cobranca',
    link_pagamento_token = NULL,
    link_pagamento_enviado_em = NULL
WHERE id = 1005;

COMMIT;
```

---

## 📊 Monitoramento

### Logs a Observar

```typescript
// Admin define valor
[ADMIN] Definir valor - Lote 1005: { status: 'concluido', status_pagamento: 'aguardando_cobranca' }
[WARN] Lote 1005 tem laudo rascunho órfão (será recriado quando emissor gerar)

// Admin gera link
[ADMIN] Gerar link - Lote 1005: { status: 'concluido', status_pagamento: 'aguardando_cobranca', ... }
[INFO] Admin 12345678901 gerou link para lote 1005 - Token: abc...
```

### Verificar Trigger Foi Removido

```sql
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgname = 'trg_reservar_id_laudo_on_lote_insert';
-- Deve retornar 0 registros após migration
```

---

## 📞 Suporte

Se encontrar problemas:

1. Execute diagnóstico completo:

   ```powershell
   .\diagnostico_completo.ps1 -Lote 1005
   ```

2. Verifique logs do servidor:

   ```powershell
   # Ver logs recentes
   Get-Content -Path "logs\server.log" -Tail 100
   ```

3. Revise o relatório completo:
   - [RELATORIO_PROBLEMA_FLUXO_PAGAMENTO_EMISSAO.md](./RELATORIO_PROBLEMA_FLUXO_PAGAMENTO_EMISSAO.md)

---

## ✅ Checklist Final

- [ ] Executado diagnóstico do lote 1005
- [ ] Aplicada Migration 1100 em PROD
- [ ] Trigger `trg_reservar_id_laudo_on_lote_insert` removido
- [ ] Laudos rascunho órfãos limpos
- [ ] Admin consegue definir valor sem erro
- [ ] Admin consegue gerar link sem erro
- [ ] Testado fluxo completo com novo lote
- [ ] Emissor vê apenas lotes pagos
- [ ] Laudo é criado apenas após "Gerar Laudo"
- [ ] Hash é calculado a partir do PDF físico
- [ ] Documentação atualizada

---

**Data**: 10/02/2026  
**Documentos Relacionados**:

- [RELATORIO_PROBLEMA_FLUXO_PAGAMENTO_EMISSAO.md](./RELATORIO_PROBLEMA_FLUXO_PAGAMENTO_EMISSAO.md)
- [diagnostico_lote_1005.sql](./diagnostico_lote_1005.sql)
- [database/migrations/1100_fix_premature_laudo_creation.sql](./database/migrations/1100_fix_premature_laudo_creation.sql)
