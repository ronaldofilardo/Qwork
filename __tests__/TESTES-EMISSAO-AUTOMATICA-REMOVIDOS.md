# Testes de Emissão Automática - Removidos

## Status: ⚠️ TESTES DESCONTINUADOS

As funções de emissão automática foram **completamente removidas** do sistema por decisão operacional.

### Funções Removidas:

- `emitirLaudoImediato()` de `lib/laudo-auto.ts`
- `emitirLaudosAutomaticamente()` de `lib/laudo-auto.ts`
- `emitirLaudosAutomaticamente()` de `lib/laudo-auto-refactored.ts`

### Motivo da Remoção:

O sistema mudou para **emissão manual** de laudos:

1. Lote fica 'concluido' automaticamente
2. RH/Entidade solicita emissão via interface
3. Emissor revisa os dados
4. Emissor emite laudo manualmente

### Testes Afetados e Ações:

#### ❌ Testes Removidos (testavam emissão automática):

- `__tests__/system/auto-laudo-emission.test.ts` - Testava emitirLaudosAutomaticamente()
- `__tests__/lib/emissao-automatica-refatorada.test.ts` - Testava fluxo automático completo
- `__tests__/lib/lote-status-update.test.ts` - Testava mudança automática de status
- `__tests__/lib/laudo-auto-refactored.test.ts` - Testava função refatorada

#### ✅ Testes Mantidos (testam fluxo manual):

- `__tests__/emissor/manual-emission-flow.test.ts` - Testa fluxo manual correto
- `__tests__/emissor/validation-manual-emission-changes.test.ts` - Valida remoção de emissão automática
- `__tests__/integration/emissao-laudo-e2e.test.ts` - Precisa atualização para remover uso de emitirLaudoImediato()

#### 🔧 Testes Precisam Atualização:

- `__tests__/lib/recalculo-emissao-inativadas.test.ts` - Mock de emitirLaudoImediato precisa ser removido
- `__tests__/lib/lotes-recalculo.test.ts` - Mock de emitirLaudoImediato precisa ser removido
- `__tests__/integration/immutabilidade-apos-emissao.test.ts` - Uso direto precisa ser removido
- `__tests__/integration/emissao-imediata-ao-concluir.test.ts` - Testa emissão imediata (descontinuada)

### Novo Padrão de Testes:

Em vez de testar emissão automática, teste o fluxo manual:

```typescript
// ❌ ANTIGO (REMOVIDO)
import { emitirLaudoImediato } from '@/lib/laudo-auto';
const sucesso = await emitirLaudoImediato(loteId);

// ✅ NOVO (CORRETO)
// Teste via API manual do emissor
const response = await fetch(`/api/emissor/emitir-laudo/${loteId}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ emissorCpf: '12345678900' }),
});
```

### Referências:

- [lib/laudo-auto.ts](../lib/laudo-auto.ts) - Funções removidas
- [app/api/lotes/[loteId]/solicitar-emissao/route.ts](../app/api/lotes/[loteId]/solicitar-emissao/route.ts) - Fluxo correto de solicitação
- [app/api/emissor/](../app/api/emissor/) - APIs de emissão manual

### Data da Remoção:

31 de janeiro de 2026
