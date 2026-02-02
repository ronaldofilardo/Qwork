# 🔧 Plano de Implementação - Proteção Contra Emissão Automática

## 📝 Resumo

Embora o sistema principal JÁ FUNCIONE corretamente (emissão manual), existem funções e scripts legados que PODEM ser chamados acidentalmente e causar emissão automática indesejada.

**Objetivo**: Proteger o sistema contra chamadas acidentais de código legado.

---

## 🎯 Mudanças Necessárias

### 1. Proteger `lib/laudo-auto.ts` - Funções de Emissão Automática

**Arquivo**: `lib/laudo-auto.ts`

**Linhas a modificar**:

- Linha ~1316: `emitirLaudosAutomaticamente()`
- Linha ~1100: `emitirLaudoImediato()`

**Mudança 1.1**: Adicionar guard em `emitirLaudosAutomaticamente()`

```typescript
// ANTES (linha ~1316)
export async function emitirLaudosAutomaticamente() {
  console.log('[FASE 1 - CRON] emitirLaudosAutomaticamente() chamado...');
  // ... código de emissão
}

// DEPOIS
/**
 * @deprecated SISTEMA DESCONTINUADO - NÃO UTILIZAR
 *
 * Emissão automática foi REMOVIDA por decisão operacional.
 * Laudos são emitidos MANUALMENTE pelo emissor após revisão.
 *
 * Esta função lançará erro se chamada em produção.
 * Mantida apenas para compatibilidade com testes legados.
 */
export async function emitirLaudosAutomaticamente() {
  const isProduction = process.env.NODE_ENV === 'production';
  const errorMsg =
    '[ERRO CRÍTICO] emitirLaudosAutomaticamente() foi chamada! ' +
    'Emissão automática está DESABILITADA por decisão operacional. ' +
    'Laudos devem ser emitidos manualmente pelo emissor via interface.';

  console.error(errorMsg);

  // Registrar tentativa de uso
  try {
    await query(
      `INSERT INTO audit_logs (acao, entidade, dados, user_role, criado_em)
       VALUES ('erro_sistema', 'emissao_automatica_bloqueada', $1, 'sistema', NOW())`,
      [
        JSON.stringify({
          erro: 'Tentativa de emissão automática bloqueada',
          ambiente: process.env.NODE_ENV,
          stack: new Error().stack,
        }),
      ]
    );
  } catch (auditErr) {
    console.error('[ERRO] Falha ao registrar audit log:', auditErr);
  }

  // Em produção, bloquear execução
  if (isProduction) {
    throw new Error(errorMsg);
  }

  // Em desenvolvimento/teste, apenas avisar e não fazer nada
  console.warn(
    '[AVISO] Função legada chamada em ambiente ' + process.env.NODE_ENV
  );
  console.warn('[AVISO] Nenhuma emissão será realizada');
  return;
}
```

**Mudança 1.2**: Adicionar guard em `emitirLaudoImediato()`

```typescript
// ANTES (linha ~1100)
export async function emitirLaudoImediato(loteId: number): Promise<boolean> {
  console.log(`[EMISSÃO IMEDIATA] Processando lote ${loteId} - entrada`);
  // ... código de emissão
}

// DEPOIS
/**
 * @deprecated SISTEMA DESCONTINUADO - NÃO UTILIZAR
 *
 * Emite laudo IMEDIATAMENTE sem revisão do emissor.
 * Esta funcionalidade foi DESABILITADA por decisão operacional.
 *
 * Fluxo correto:
 * 1. Lote fica 'concluido' (automático)
 * 2. RH solicita emissão via interface
 * 3. Emissor revisa dados
 * 4. Emissor emite laudo manualmente
 *
 * Esta função lançará erro se chamada em produção.
 */
export async function emitirLaudoImediato(loteId: number): Promise<boolean> {
  const isProduction = process.env.NODE_ENV === 'production';
  const errorMsg =
    `[ERRO CRÍTICO] emitirLaudoImediato(${loteId}) foi chamada! ` +
    'Emissão imediata está DESABILITADA. ' +
    'Use o fluxo manual: RH solicita → Emissor revisa → Emissor emite.';

  console.error(errorMsg);

  // Registrar tentativa de uso
  try {
    await query(
      `INSERT INTO audit_logs (acao, entidade, dados, user_role, criado_em)
       VALUES ('erro_sistema', 'emissao_imediata_bloqueada', $1, 'sistema', NOW())`,
      [
        JSON.stringify({
          erro: 'Tentativa de emissão imediata bloqueada',
          loteId,
          ambiente: process.env.NODE_ENV,
          stack: new Error().stack,
        }),
      ]
    );
  } catch (auditErr) {
    console.error('[ERRO] Falha ao registrar audit log:', auditErr);
  }

  // Em produção, bloquear execução
  if (isProduction) {
    throw new Error(errorMsg);
  }

  // Em desenvolvimento/teste, apenas avisar e retornar false
  console.warn(
    '[AVISO] Função legada chamada em ambiente ' + process.env.NODE_ENV
  );
  console.warn('[AVISO] Nenhuma emissão será realizada');
  return false;
}
```

---

### 2. Proteger `lib/laudo-auto-refactored.ts`

**Arquivo**: `lib/laudo-auto-refactored.ts`

**Linha a modificar**: ~684

```typescript
// ANTES (linha ~684)
export async function emitirLaudosAutomaticamente(): Promise<void> {
  // ... código de emissão
}

// DEPOIS
/**
 * @deprecated SISTEMA DESCONTINUADO - NÃO UTILIZAR
 *
 * Versão refatorada da emissão automática (também descontinuada).
 * Ver comentário em lib/laudo-auto.ts para detalhes.
 */
export async function emitirLaudosAutomaticamente(): Promise<void> {
  // Redirecionar para a versão principal que tem o guard
  const { emitirLaudosAutomaticamente: funcaoLegada } =
    await import('@/lib/laudo-auto');
  return funcaoLegada();
}
```

---

### 3. Bloquear Scripts Legados

**Arquivo**: `scripts/emit-laudos-one.ts`

```typescript
// ADICIONAR NO TOPO (antes de qualquer import)

console.error('='.repeat(80));
console.error('⚠️  SCRIPT DESCONTINUADO - EXECUÇÃO BLOQUEADA');
console.error('='.repeat(80));
console.error('');
console.error('Este script usa emissão automática de laudos, que foi REMOVIDA');
console.error('do sistema por decisão operacional.');
console.error('');
console.error('FLUXO CORRETO:');
console.error(
  '  1. Lote fica "concluido" automaticamente após todas avaliações'
);
console.error('  2. RH recebe notificação e solicita emissão via interface');
console.error('  3. Emissor revisa dados do lote');
console.error('  4. Emissor emite laudo manualmente via interface');
console.error('');
console.error(
  'Se você precisa emitir laudos em massa, use a interface do emissor.'
);
console.error('');
console.error('='.repeat(80));

process.exit(1);

// ... resto do código original (nunca será executado)
```

**Arquivo**: `scripts/run-laudo-flow.ts`

```typescript
// ADICIONAR NO TOPO (antes de qualquer import)

console.error('='.repeat(80));
console.error('⚠️  SCRIPT DESCONTINUADO - EXECUÇÃO BLOQUEADA');
console.error('='.repeat(80));
console.error('');
console.error(
  'Este script testa o fluxo de emissão automática, que foi REMOVIDO'
);
console.error('do sistema por decisão operacional.');
console.error('');
console.error('Para testar emissão de laudos:');
console.error('  1. Use os testes de integração em __tests__/integration/');
console.error('  2. Ou teste manualmente via interface do emissor');
console.error('');
console.error('='.repeat(80));

process.exit(1);

// ... resto do código original (nunca será executado)
```

---

### 4. Adicionar Avisos em Scripts de Teste

**Arquivo**: `scripts/injetar-avaliacoes-aleatorias.mjs`

**Linha a modificar**: ~343-357

```javascript
// ANTES (linha ~343)
// 7. Marcar lote como concluído (para permitir solicitação de emissão)
console.log(`\n📋 Finalizando lote...\n`);
await client.query(
  `UPDATE lotes_avaliacao 
   SET status = 'concluido', finalizado_em = NOW(), atualizado_em = NOW()
   WHERE id = $1`,
  [loteId]
);
console.log(`   ✓ Lote marcado como 'concluido'\n`);

// DEPOIS (linha ~343)
// 7. Marcar lote como concluído (para permitir solicitação de emissão)
console.log(`\n📋 Finalizando lote...\n`);
await client.query(
  `UPDATE lotes_avaliacao 
   SET status = 'concluido', finalizado_em = NOW(), atualizado_em = NOW()
   WHERE id = $1`,
  [loteId]
);
console.log(`   ✓ Lote marcado como 'concluido'\n`);

console.log('\n⚠️  IMPORTANTE: Emissão de Laudo é MANUAL');
console.log('   Este script NÃO emite o laudo automaticamente.');
console.log('   Para emitir o laudo:');
console.log('   1. Faça login como RH (CPF: 04703084945)');
console.log(`   2. Acesse a empresa "${empresaNome}"`);
console.log(`   3. Localize o lote "${codigoLote}"`);
console.log('   4. Clique em "Solicitar Emissão de Laudo"');
console.log('   5. Faça login como Emissor');
console.log('   6. Revise os dados e emita o laudo\n');
```

---

### 5. Documentar Mudanças no README Principal

**Arquivo**: `README.md` ou `docs/FLUXO-EMISSAO-LAUDOS.md`

**Adicionar seção**:

```markdown
## 📋 Emissão de Laudos

### ⚠️ IMPORTANTE: Emissão é MANUAL

A partir de [data da mudança], a emissão de laudos passou a ser **MANUAL** por decisão operacional.

### Fluxo Correto

1. **Lote Concluído** (automático)
   - Quando todas as avaliações do lote são finalizadas
   - Status muda para `concluido`
   - Sistema cria registro na `fila_emissao`
   - RH/Entidade recebe notificação

2. **Solicitação de Emissão** (manual pelo RH)
   - RH acessa o lote concluído
   - Clica em "Solicitar Emissão de Laudo"
   - Sistema notifica o emissor

3. **Revisão e Emissão** (manual pelo Emissor)
   - Emissor acessa painel de lotes pendentes
   - Revisa dados do lote
   - Gera preview do laudo
   - Confirma emissão
   - Sistema gera PDF e disponibiliza para download

### ❌ O Que NÃO Fazer

- ❌ NÃO execute scripts de emissão automática (`emit-laudos-one.ts`, `run-laudo-flow.ts`)
- ❌ NÃO chame funções `emitirLaudosAutomaticamente()` ou `emitirLaudoImediato()` diretamente
- ❌ NÃO espere que laudos sejam emitidos automaticamente ao concluir lote

### 🔒 Proteções Implementadas

- Funções legadas de emissão automática bloqueiam execução em produção
- Scripts legados exibem erro e saem imediatamente
- Tentativas de uso são registradas no audit log
```

---

## 📋 Checklist de Implementação

### Etapa 1: Proteção de Código (30 min)

- [ ] 1.1. Modificar `lib/laudo-auto.ts` - Adicionar guard em `emitirLaudosAutomaticamente()`
- [ ] 1.2. Modificar `lib/laudo-auto.ts` - Adicionar guard em `emitirLaudoImediato()`
- [ ] 1.3. Modificar `lib/laudo-auto-refactored.ts` - Redirecionar para função principal

### Etapa 2: Bloqueio de Scripts (15 min)

- [ ] 2.1. Modificar `scripts/emit-laudos-one.ts` - Adicionar bloqueio
- [ ] 2.2. Modificar `scripts/run-laudo-flow.ts` - Adicionar bloqueio
- [ ] 2.3. Modificar `scripts/injetar-avaliacoes-aleatorias.mjs` - Adicionar avisos

### Etapa 3: Documentação (20 min)

- [ ] 3.1. Criar/atualizar `docs/FLUXO-EMISSAO-LAUDOS.md`
- [ ] 3.2. Atualizar `README.md` com seção de emissão manual
- [ ] 3.3. Revisar comentários em `lib/lotes.ts` para garantir clareza

### Etapa 4: Testes (30 min)

- [ ] 4.1. Testar que lote fica 'concluido' sem emitir laudo
- [ ] 4.2. Testar que scripts bloqueados não executam
- [ ] 4.3. Testar que funções guardadas lançam erro em NODE_ENV=production
- [ ] 4.4. Verificar que registros de audit_logs são criados corretamente

### Etapa 5: Validação Final (15 min)

- [ ] 5.1. Code review das mudanças
- [ ] 5.2. Testar fluxo completo: conclusão → solicitação → emissão manual
- [ ] 5.3. Verificar logs e notificações
- [ ] 5.4. Deploy em staging para validação

---

## 🧪 Casos de Teste

### Teste 1: Lote Concluído Não Emite Automaticamente

```typescript
// Dado um lote com todas avaliações finalizadas
const loteId = await criarLoteComAvaliacoes();
await finalizarTodasAvaliacoes(loteId);

// Quando o recálculo de status é acionado
await recalcularStatusLotePorId(loteId);

// Então o lote fica 'concluido'
const lote = await query('SELECT status FROM lotes_avaliacao WHERE id = $1', [
  loteId,
]);
expect(lote.rows[0].status).toBe('concluido');

// E NÃO existe laudo emitido
const laudo = await query('SELECT id FROM laudos WHERE lote_id = $1', [loteId]);
expect(laudo.rows.length).toBe(0);

// E existe registro na fila de emissão
const fila = await query('SELECT id FROM fila_emissao WHERE lote_id = $1', [
  loteId,
]);
expect(fila.rows.length).toBe(1);
```

### Teste 2: Função Legada Bloqueada em Produção

```typescript
// Dado ambiente de produção
process.env.NODE_ENV = 'production';

// Quando tentamos chamar emissão automática
try {
  await emitirLaudosAutomaticamente();
  fail('Deveria ter lançado erro');
} catch (error) {
  // Então lança erro específico
  expect(error.message).toContain('DESABILITADA');
}

// E registra no audit log
const audit = await query(
  `SELECT dados FROM audit_logs 
   WHERE acao = 'erro_sistema' AND entidade = 'emissao_automatica_bloqueada'
   ORDER BY criado_em DESC LIMIT 1`
);
expect(audit.rows.length).toBe(1);
expect(audit.rows[0].dados).toContain(
  'Tentativa de emissão automática bloqueada'
);
```

### Teste 3: Script Bloqueado

```bash
# Quando executamos script legado
node scripts/emit-laudos-one.ts

# Então exibe mensagem de erro
# E sai com código 1
# E NÃO executa código de emissão
```

---

## 🚀 Deployment

### Ordem de Deploy

1. **Staging**: Deploy e validação completa
2. **Production**: Deploy em horário de baixo uso
3. **Monitoramento**: Verificar logs após deploy

### Rollback Plan

Se algo der errado, reverter apenas os arquivos modificados:

- `lib/laudo-auto.ts`
- `lib/laudo-auto-refactored.ts`
- `scripts/emit-laudos-one.ts`
- `scripts/run-laudo-flow.ts`

Não há mudanças no banco de dados, então rollback é simples.

---

## 📊 Métricas de Sucesso

### KPIs para Monitorar

1. **Lotes Concluídos**: Devem continuar ficando 'concluido' normalmente
2. **Laudos Emitidos**: Devem ser emitidos apenas via interface do emissor
3. **Tentativas de Emissão Automática**: Devem ser 0 (ou registradas e bloqueadas)
4. **Erros no Audit Log**: Monitorar `emissao_automatica_bloqueada` e `emissao_imediata_bloqueada`

### Queries para Monitoramento

```sql
-- Verificar tentativas bloqueadas
SELECT criado_em, dados
FROM audit_logs
WHERE acao = 'erro_sistema'
  AND entidade IN ('emissao_automatica_bloqueada', 'emissao_imediata_bloqueada')
ORDER BY criado_em DESC
LIMIT 10;

-- Verificar lotes concluídos aguardando emissão
SELECT COUNT(*) as total
FROM lotes_avaliacao l
LEFT JOIN laudos ld ON ld.lote_id = l.id
WHERE l.status = 'concluido'
  AND ld.id IS NULL;

-- Verificar fila de emissão
SELECT COUNT(*) as pendentes
FROM fila_emissao
WHERE processado_em IS NULL;
```

---

## ✅ Conclusão

Após implementar estas mudanças, o sistema estará protegido contra chamadas acidentais de emissão automática, enquanto mantém o fluxo manual funcionando corretamente.

**Tempo estimado**: ~2 horas (implementação + testes)  
**Risco**: Baixo (mudanças são defensivas, não afetam fluxo principal)  
**Impacto**: Positivo (previne emissões não autorizadas)

---

**Criado por**: GitHub Copilot  
**Data**: 31 de janeiro de 2026  
**Status**: Pronto para implementação
