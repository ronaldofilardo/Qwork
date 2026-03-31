# Testes das Correções - 31/01/2026

## Correção Implementada

**Problema**: Laudos estavam sendo marcados como "enviados" automaticamente ao serem gerados.

**Solução**: Separar a emissão do envio em dois passos manuais:

1. **Emitir** (gerar PDF) → Status `'emitido'`
2. **Enviar** (disponibilizar) → Status `'enviado'`

## Arquivos Corrigidos

### 1. `lib/laudo-auto.ts`

- ✅ Função `gerarLaudoCompletoEmitirPDF` emite com status `'emitido'`
- ✅ Removido `enviado_em = NOW()` de todos os INSERTs e UPDATEs
- ✅ Observações alteradas para "gerado pelo emissor"

### 2. `app/api/emissor/laudos/[loteId]/route.ts`

- ✅ **POST**: Gera laudo com status `'emitido'`
- ✅ **PATCH**: Valida que só aceita status `'enviado'`
- ✅ **PATCH**: Só envia laudos já `'emitidos'`
- ✅ **PATCH**: Atualiza `enviado_em = NOW()`

### 3. `app/api/lotes/[loteId]/solicitar-emissao/route.ts`

- ✅ Documentado que NÃO emite automaticamente
- ✅ Apenas registra a solicitação

## Testes

### Arquivo: `emissao-manual-fluxo.test.ts`

#### Testes Implementados:

1. ✅ `gerarLaudoCompletoEmitirPDF` cria laudo com status `'emitido'`
2. ✅ Arquivo PDF é criado localmente
3. ✅ API POST emite laudo (não envia)
4. ✅ API PATCH envia laudo (de `'emitido'` para `'enviado'`)
5. ✅ API PATCH não envia se não está `'emitido'`
6. ✅ API de solicitação NÃO emite automaticamente
7. ✅ Fluxo completo: Solicitar → Emitir → Enviar

## Executar Testes

```bash
# Executar apenas os testes de correção
pnpm test __tests__/correcoes-31-01-2026/emissao-manual-fluxo.test.ts

# Executar com timeout maior
pnpm test __tests__/correcoes-31-01-2026/emissao-manual-fluxo.test.ts --testTimeout=30000
```

## Fluxo Correto

```
┌─────────────────────────────────────────────────┐
│ 1. RH/Entidade: Solicitar Emissão              │
│    POST /api/lotes/[loteId]/solicitar-emissao  │
│    ➜ Apenas registra solicitação               │
│    ➜ Laudo NÃO é criado                        │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 2. Emissor: Gerar Laudo                         │
│    POST /api/emissor/laudos/[loteId]            │
│    ➜ PDF criado                                 │
│    ➜ Status: 'emitido'                          │
│    ➜ emitido_em: NOW()                          │
│    ➜ enviado_em: NULL                           │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 3. Emissor: Enviar Laudo                        │
│    PATCH /api/emissor/laudos/[loteId]           │
│    ➜ Status: 'enviado'                          │
│    ➜ enviado_em: NOW()                          │
│    ➜ Disponível para clínica/entidade          │
└─────────────────────────────────────────────────┘
```

## Resultado

✅ **Emissão 100% Manual**

- Nenhum laudo é emitido ou enviado automaticamente
- Emissor tem controle total sobre o processo
- Dois passos claros: Emitir → Enviar
