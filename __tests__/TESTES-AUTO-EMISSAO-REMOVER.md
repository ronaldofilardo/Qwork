# TESTES COM AUTO-EMISSÃO PARA REMOVER/ATUALIZAR

## Migration 302: Sanitização Agressiva de Auto-Emissão

Data: 2026-02-04

---

## ❌ ARQUIVOS PARA REMOVER COMPLETAMENTE

### 1. `__tests__/integration/auto-conclusao-emissao.test.ts`

- **Motivo**: Todo o arquivo testa auto-emissão (`auto_emitir_agendado`)
- **Ação**: DELETAR o arquivo inteiro
- **Referências problemáticas**:
  - Linha 129: `auto_emitir_agendado: false`
  - Linha 138: `auto_emitir_agendado: false`
  - Linha 150-151: `expect(antes.lote.auto_emitir_agendado).toBe(false)`

### 2. `__tests__/api/system/auto-laudo.test.ts`

- **Motivo**: Arquivo dedicado a testar auto-emissão
- **Ação**: DELETAR o arquivo inteiro
- **Referências problemáticas**:
  - Linha 10: `'✅ Migration do banco (auto_emitir_em, notificacoes_admin)'`

### 3. `__tests__/api/emissor/lotes-auto.test.ts`

- **Motivo**: Testa lotes com auto-emissão
- **Ação**: DELETAR o arquivo inteiro
- **Referências problemáticas**:
  - Linha 46: `auto_emitir_em: null`
  - Linha 62: `auto_emitir_em: new Date()`
  - Linha 153: `auto_emitir_em: null`

### 4. `__tests__/api/emissor/reprocessar-emissao.test.ts`

- **Motivo**: Testa reprocessamento de auto-emissão
- **Ação**: DELETAR o arquivo inteiro
- **Referências problemáticas**:
  - Linhas 34-35, 84, 113, 145, 181: múltiplas referências a `auto_emitir_agendado`, `auto_emitir_em`

### 5. `__tests__/api/avaliacao/finalizar-auto.test.ts`

- **Motivo**: Testa finalização automática com auto-emissão
- **Ação**: DELETAR o arquivo inteiro
- **Referências problemáticas**:
  - Linha 137: regex testando `auto_emitir_em` e `auto_emitir_agendado`

---

## ⚠️ ARQUIVOS PARA ATUALIZAR/LIMPAR

### 6. `__tests__/integration/lote-encerramento-com-inativadas.test.ts`

- **Ação**: Remover verificações de `auto_emitir_agendado`
- **Linhas problemáticas**:
  - Linha 183: `call[0].includes('auto_emitir_agendado')`
  - Linha 283: `call[0].includes('auto_emitir_agendado = true')`

### 7. `__tests__/integration/lote-fluxo-completo.test.ts`

- **Ação**: Manter comentário explicativo, validar que teste ainda funciona
- **Linha 320**: `// Verificar status final (colunas auto_emitir_* foram removidas)`
- **Status**: ✅ OK - já tem comentário correto

### 8. `__tests__/entidade/entidade-fluxo-laudo-e2e.test.ts`

- **Ação**: Remover todas as queries que manipulam `auto_emitir_agendado` e `auto_emitir_em`
- **Linhas problemáticas**:
  - Linha 191: `UPDATE lotes_avaliacao SET status = 'concluido', auto_emitir_agendado = true, auto_emitir_em = NOW() + INTERVAL '5 seconds'`
  - Linha 197: `SELECT status, auto_emitir_agendado FROM lotes_avaliacao WHERE id = $1`
  - Linha 201: `expect(check.rows[0].auto_emitir_agendado).toBe(true)`
  - Linhas 407, 416: mais referências a `auto_emitir_agendado`

### 9. `__tests__/api/emissor/lotes-download-safety.test.ts`

- **Ação**: Remover mock de `auto_emitir_em: null`
- **Linha 36**: `auto_emitir_em: null`

### 10. `__tests__/lib/lotes-recalculo.test.ts`

- **Status**: ✅ PARCIALMENTE LIMPO
- **Ação**: Validar que não existem mais referências a `emitirLaudoImediato`

---

## ✅ ARQUIVOS DE VALIDAÇÃO (MANTER)

### 11. `__tests__/correcoes-31-01-2026/remocao-automacao.test.ts`

- **Status**: ✅ MANTER
- **Motivo**: Testa que as colunas foram REMOVIDAS corretamente
- **Comentário**: Este é um teste de validação da migração, não precisa ser removido

### 12. `__tests__/emissor/validation-manual-emission-changes.test.ts`

- **Status**: ✅ MANTER
- **Motivo**: Testa que `emitirLaudoImediato` NÃO existe mais no código
- **Comentário**: Este é um teste de validação da remoção, deve permanecer

### 13. `__tests__/emissor/manual-emission-flow.test.ts`

- **Status**: ✅ MANTER
- **Linha 11**: `NOTA: emitirLaudoImediato foi removida. Usando gerarLaudoCompletoEmitirPDF diretamente.`
- **Comentário**: Teste do fluxo MANUAL, está correto

---

## 🗑️ AÇÕES A EXECUTAR

```bash
# DELETAR arquivos de auto-emissão
Remove-Item -Path "__tests__/integration/auto-conclusao-emissao.test.ts"
Remove-Item -Path "__tests__/api/system/auto-laudo.test.ts"
Remove-Item -Path "__tests__/api/emissor/lotes-auto.test.ts"
Remove-Item -Path "__tests__/api/emissor/reprocessar-emissao.test.ts"
Remove-Item -Path "__tests__/api/avaliacao/finalizar-auto.test.ts"
```

---

## 📝 DOCUMENTAÇÃO

### Motivo da Remoção

Emissão automática de laudos foi **COMPLETAMENTE REMOVIDA** do sistema conforme:

- Migration 150: Removeu `INSERT INTO fila_emissao` do trigger de recálculo
- Migration 302: Sanitização agressiva de todos os vestígios de auto-emissão
- Política de negócio: Laudos devem ser gerados MANUALMENTE pelo emissor após solicitação do RH/Entidade

### Fluxo Atual (Manual)

1. RH/Entidade **solicita emissão** → POST `/api/lotes/[loteId]/solicitar-emissao`
2. Lote aparece no dashboard do **emissor**
3. Emissor clica "Gerar Laudo" → POST `/api/emissor/laudos/[loteId]`
4. `gerarLaudoCompletoEmitirPDF()` é chamado com CPF do emissor
5. PDF gerado + hash calculado + registro criado em `laudos`

### Validação

Após executar as remoções, executar:

```bash
pnpm test -- --testNamePattern="remocao-automacao"
pnpm test -- --testNamePattern="validation-manual-emission"
```

Ambos devem **PASSAR** ✅
