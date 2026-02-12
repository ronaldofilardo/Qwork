# 📋 RESUMO EXECUTIVO: Pendências de Pagamento no QWork

## 🎯 Resposta Direta

**Pergunta:** Onde entidades são cadastradas e onde pendências de pagamento estão sendo geradas automaticamente para novos cadastros?

**Resposta:**

- ❌ **NÃO há geração automática de pendências no cadastro**
- ✅ **Pendências SÃO CRIADAS apenas ao confirmar pagamento parcelado**
- 📍 **Local específico:** Linhas 244-276 de [`app/api/pagamento/confirmar/route.ts`](app/api/pagamento/confirmar/route.ts)

---

## 📍 3 ARQUIVOS CRÍTICOS

### 1. Cadastro de Entidades

**Arquivo:** [`app/api/cadastro/tomadores/route.ts`](app/api/cadastro/tomadores/route.ts)

| O que faz                           | Linhas  | Resultado                                    |
| ----------------------------------- | ------- | -------------------------------------------- |
| Cria entidade/tomador               | 350-450 | status = 'pendente'                          |
| Calcula valor total (se plano fixo) | 450-495 | valor = R$20 × funcionários                  |
| Cria contrato                       | 500-650 | status = 'aguardando_aceite', aceito = false |

**Pendências criadas aqui?** ❌ NÃO

### 2. Iniciação de Pagamento

**Arquivo:** [`app/api/pagamento/iniciar/route.ts`](app/api/pagamento/iniciar/route.ts)

| O que faz              | Linhas  | Resultado               |
| ---------------------- | ------- | ----------------------- |
| Valida contrato aceito | 250-268 | Requer: `aceito = true` |
| Cria pagamento         | 300-308 | status = 'pendente'     |

**Pendências criadas aqui?** ❌ NÃO

### 3. Confirmação de Pagamento ⭐ **AQUI CRIAM PENDÊNCIAS!**

**Arquivo:** [`app/api/pagamento/confirmar/route.ts`](app/api/pagamento/confirmar/route.ts)

| O que faz                | Linhas      | Resultado                                         |
| ------------------------ | ----------- | ------------------------------------------------- |
| Marca como pago          | 120-140     | status = 'pago'                                   |
| Calcula parcelas         | 215-240     | Array com 1 paga + (N-1) pendentes                |
| **CRIA NOTIFICAÇÕES** ⭐ | **244-276** | **INSERT notificacoes (tipo='parcela_pendente')** |

---

## 🔴 CÓDIGO QUE CRIA PENDÊNCIAS

### Linhas 244-276 de `confirm/route.ts`

```typescript
for (const parcela of parcelas) {
  if (parcela.numero === 1) continue; // Pula primeira

  await criarNotificacao({
    tipo: 'parcela_pendente', // ⭐ CRIA PENDÊNCIA AQUI!
    destinatario_id: pagamento.tomador_id,
    titulo: `Parcela ${parcela.numero}/${numero}`,
    // dados completos...
  });
}
```

**O que acontece:**

1. Loop percorre array de parcelas calculadas
2. Pula primeira (já é paga)
3. Para cada parcela 2 até N → CRIA notificação
4. Cada notificação = 1 pendência no Centro de Operações

---

## 📊 DADOS PERSISTIDOS

### Tabela: `pagamentos`

```sql
INSERT INTO pagamentos (
  tomador_id,       -- ID da entidade
  contrato_id,      -- ID do contrato
  valor,            -- Total a pagar
  status,           -- 'pendente' → 'pago'
  numero_parcelas   -- Quantidade de parcelas
);

-- Após confirmação:
UPDATE pagamentos
SET detalhes_parcelas = '[
  {numero: 1, valor: 500, status: "pago", pago: true},
  {numero: 2, valor: 500, status: "pendente", pago: false},
  ...
]'::jsonb
```

### Tabela: `notificacoes`

```sql
INSERT INTO notificacoes (
  tipo,                -- 'parcela_pendente'
  destinatario_id,     -- tomador_id
  titulo,              -- 'Parcela 2/6 - Vence em 05/02'
  dados_contexto       -- {pagamento_id, numero_parcela, valor}
);
```

---

## 🔢 EXEMPLO PRÁTICO

### Entrada: Cadastro com 2.000 reais em 4 parcelas

1. **POST /api/cadastro/tomadores**
   - Cria: 1 entidade (status='pendente')
   - Cria: 1 contrato (status='aguardando_aceite')
   - Pendências criadas: **0**

2. **Usuário aceita contrato**
   - Update: contrato (aceito=true)

3. **POST /api/pagamento/iniciar**
   - Cria: 1 pagamento (status='pendente')
   - Pendências criadas: **0**

4. **POST /api/pagamento/confirmar**
   - Update: pagamento (status='pago')
   - Calcula: 4 parcelas
   - **Cria: 3 notificações** (parcelas 2, 3, 4)
   - Pendências criadas: **3** ⭐

### Saída:

```
Pagamento de R$ 2.000,00
├─ Parcela 1: R$ 500,00 → PAGA (08/02) ✅
├─ Parcela 2: R$ 500,00 → PENDENTE (08/03) 🔴
├─ Parcela 3: R$ 500,00 → PENDENTE (08/04) 🔴
└─ Parcela 4: R$ 500,00 → PENDENTE (08/05) 🔴

Notificações criadas: 3
Pendências no Centro de Operações: 3
```

---

## 🎯 FLUXO VISUAL

```
┌─────────────────────────────────────┐
│ POST /api/cadastro/tomadores        │ Linhas 350-650
├─────────────────────────────────────┤
│ ✅ CREATE tomadores                 │
│ ✅ CREATE contratos                 │
│ ❌ NÃO cria pendências              │
└──────────────┬──────────────────────┘
               │
               ↓
        [Usuário aceita]
               │
               ↓
┌─────────────────────────────────────┐
│ POST /api/pagamento/iniciar        │ Linhas 250-308
├─────────────────────────────────────┤
│ ✅ CREATE pagamentos                │
│ ❌ NÃO cria pendências              │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│ POST /api/pagamento/confirmar       │ Linhas 110-276
├─────────────────────────────────────┤
│ ✅ UPDATE pagamentos (status=pago)  │
│ ✅ Calcula parcelas (lib/helper)    │
│ ⭐ INSERT notificacoes              │ ← AQUI CRIA PENDÊNCIAS
│    (tipo='parcela_pendente')        │ (Linhas 244-276)
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│ Centro de Operações                 │
├─────────────────────────────────────┤
│ 🔔 Parcela 2/4 - Vence em 08/03    │
│ 🔔 Parcela 3/4 - Vence em 08/04    │
│ 🔔 Parcela 4/4 - Vence em 08/05    │
└─────────────────────────────────────┘
```

---

## 📁 ARQUIVOS GERADOS (NESTE RELATÓRIO)

| Arquivo                                                                                  | Seção      | Detalhe                                       |
| ---------------------------------------------------------------------------------------- | ---------- | --------------------------------------------- |
| [RELATORIO_PENDENCIAS_CADASTRO_ENTIDADES.md](RELATORIO_PENDENCIAS_CADASTRO_ENTIDADES.md) | Completo   | Análise detalhada com explicações técnicas    |
| [MAPA_LINHAS_PENDENCIAS.md](MAPA_LINHAS_PENDENCIAS.md)                                   | Referência | Números de linha específicos de cada operação |
| [SUMARIO_PENDENCIAS_VISUAL.md](SUMARIO_PENDENCIAS_VISUAL.md)                             | Visual     | Diagramas e fluxogramas                       |
| Este arquivo                                                                             | Resumo     | Informações condensadas                       |

---

## ✅ CONCLUSÕES

### 1. Onde Entidades São Cadastradas?

**Arquivo:** `app/api/cadastro/tomadores/route.ts` (Linhas 350-650)

- Aceita FormData com dados de entidade e plano
- Cria registro em `tomadores` ou `clinicas`
- Cria `contratos` com status `aguardando_aceite`
- **NÃO cria pendências nesta etapa**

### 2. Onde Pendências Nascem?

**Arquivo:** `app/api/pagamento/confirmar/route.ts` (Linhas 244-276)

- Após pagamento ser confirmado como 'pago'
- Se `numero_parcelas > 1`
- Cria 1 `notificacao` para cada parcela (2 até N)
- Tipo: `'parcela_pendente'`
- Destino: Centro de Operações do tomador

### 3. MÃO de Obra Envolvida?

- 3 rotas de API (cadastro, iniciar, confirmar)
- 1 helper de cálculo (parcelas-helper.ts)
- 3 tabelas (pagamentos, notificacoes, contato com contratos)
- 0 triggers automáticos (tudo é código TypeScript)

### 4. Quando Ocorrem?

- Cadastro: **Immediato** (POST /api/cadastro/tomadores)
- Contratos: **Immediato** (criado com cadastro)
- Pagamento: **Quando iniciado** (POST /api/pagamento/iniciar)
- Pendências: **Quando confirmado** (POST /api/pagamento/confirmar)

---

## 🔗 LINKS RÁPIDOS

- 📄 [Cadastro de Tomadores](app/api/cadastro/tomadores/route.ts#L350)
- 💳 [Iniciar Pagamento](app/api/pagamento/iniciar/route.ts#L300)
- ✅ [Confirmar Pagamento](app/api/pagamento/confirmar/route.ts#L244)
- 🧮 [Cálculo de Parcelas](lib/parcelas-helper.ts#L25)
