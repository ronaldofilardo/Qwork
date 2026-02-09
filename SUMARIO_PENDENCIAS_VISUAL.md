# 📍 Sumário: Onde Pendências São Criadas

## 🎯 Visão Geral

```
CADASTRO DE ENTIDADE
       ↓
   ✅ Cria: tomador (status='pendente')
   ✅ Cria: contrato (aceito=false)
   ❌ NÃO cria: pagamento
   ❌ NÃO cria: pendências
       ↓
[USUÁRIO ACEITA CONTRATO]
       ↓
   ✅ Update: contrato (aceito=true)
       ↓
INICIAR PAGAMENTO
       ↓
   ✅ Cria: pagamento (status='pendente')
   ❌ NÃO cria: parcelas ainda
       ↓
CONFIRMAR PAGAMENTO
       ↓
   ✅ Update: pagamento (status='pago')
   ✅ Calcula: parcelas (1 paga + outras pendentes)
   ✅ Cria: notificações (para parcelas 2+ )  ⭐ AQUI!
       ↓
CENTRO DE OPERAÇÕES
       ↓
   ✅ Exibe notificações de parcelas pendentes
```

---

## 📁 Arquivos Principais

### 1️⃣ CADASTRO DE ENTIDADE

- **Arquivo**: `app/api/cadastro/tomadores/route.ts`
- **Funções**:
  - ✅ Cria entidade/tomador
  - ✅ Cria contrato com valor calculado
  - ❌ NÃO cria pendências
- **Linhas-chave**:
  - 370-410: Determina status
  - 450-495: Calcula valor total
  - 500-650: Insere contrato

### 2️⃣ CRIAÇÃO DE PAGAMENTO

- **Arquivo**: `app/api/pagamento/iniciar/route.ts`
- **Funções**:
  - ✅ Valida contrato aceito
  - ✅ Cria registro de pagamento
  - ❌ NÃO cria parcelas/notificações
- **Linhas-chave**: 250-268, 300-308

### 3️⃣ CONFIRMAÇÃO DE PAGAMENTO ⭐ AQUI CRIAM PENDÊNCIAS!

- **Arquivo**: `app/api/pagamento/confirmar/route.ts`
- **Funções**:
  - ✅ Marca pagamento como pago
  - ✅ Calcula parcelas
  - ✅ **CRIA NOTIFICAÇÕES DE PARCELAS PENDENTES** ⭐
- **Linhas-chave**: 215-240, 244-276

### 4️⃣ CÁLCULO DE PARCELAS

- **Arquivo**: `lib/parcelas-helper.ts`
- **Funções**:
  - ✅ Calcula estrutura de parcelas
  - ✅ Define primeira como paga
  - ✅ Define demais como pendentes
- **Linhas-chave**: 25-74

### 5️⃣ GESTÃO DE PARCELAS

- **Arquivo**: `app/api/admin/cobranca/parcela/route.ts`
- **Funções**:
  - ✅ Atualiza status de parcelas
  - ✅ Retorna histórico
- **Linhas-chave**: 10-80, 100-160

---

## 📊 Tabelas Envolvidas

| Tabela         | Campo-chave             | Status-chave        | Linha-inserção                          |
| -------------- | ----------------------- | ------------------- | --------------------------------------- |
| `tomadores`    | tomador_id              | 'pendente'          | app/api/cadastro/tomadores: 350-450     |
| `contratos`    | contrato_id             | 'aguardando_aceite' | app/api/cadastro/tomadores: 500-650     |
| `pagamentos`   | pagamento_id            | 'pendente' → 'pago' | app/api/pagamento/iniciar: 300-308      |
| `notificacoes` | tipo='parcela_pendente' | pendente            | app/api/pagamento/confirmar: 244-276 ⭐ |

---

## 🔴 PONTO CRÍTICO: ONDE AS PENDÊNCIAS NASCEM

### ⭐ Linhas 244-276 em `app/api/pagamento/confirmar/route.ts`

```typescript
// LOOP QUE CRIA AS PENDÊNCIAS
for (const parcela of parcelas) {
  if (parcela.numero === 1) continue; // Pula primeira (já paga)

  await criarNotificacao({
    tipo: 'parcela_pendente', // ⭐ TIPO-CHAVE
    titulo: `Parcela ${parcela.numero}/${numero}...`,
    // ... dados da notificação
  });
}
```

**O que acontece aqui:**

1. Percorre cada parcela calculada
2. Pula a primeira (que já está paga)
3. Para cada parcela 2 até N:
   - **CRIA UMA NOTIFICAÇÃO** com tipo `'parcela_pendente'`
   - Notificação aparece no Centro de Operações
   - Tomador vê como "pendência de pagamento"

---

## 🚀 FLUXO RÁPIDO: 5 PASSOS

```
PASSO 1: POST /api/cadastro/tomadores
         ↳ Cria entidade + contrato (sem pendência)
         📍 app/api/cadastro/tomadores/route.ts:350-650

PASSO 2: [Usuário aceita contrato]
         ↳ UPDATE contratos SET aceito=true

PASSO 3: POST /api/pagamento/iniciar
         ↳ Cria pagamento (status='pendente')
         📍 app/api/pagamento/iniciar/route.ts:300-308

PASSO 4: POST /api/pagamento/confirmar
         ↳ UPDATE pagamento SET status='pago'
         ↳ Calcula parcelas
         ↳ ⭐ CRIA NOTIFICAÇÕES
         📍 app/api/pagamento/confirmar/route.ts:244-276

PASSO 5: Centro de Operações exibe notificações
         ↳ Tomador vê pendências de parcelas
```

---

## 💡 RESUMO EXECUTIVO

### O QUE CRIA PENDÊNCIAS DE PAGAMENTO?

✅ **SIM - Cria pendências:**

- Confirmação de pagamento com `numero_parcelas > 1`
- Arquivo: `app/api/pagamento/confirmar/route.ts`
- Linhas: 244-276
- Tipo: `notificacoes` com `tipo='parcela_pendente'`

❌ **NÃO - Não cria pendências:**

- Cadastro de entidade
- Aceitação de contrato
- Iniciação de pagamento

### QUANDO AS PENDÊNCIAS SÃO CRIADAS?

⏰ **Momento exato:**

- Quando pagamento é **confirmado** (status='pago')
- E `numero_parcelas > 1`
- Criando 1 notificação para cada parcela futura (2 até N)

### QUANTAS PENDÊNCIAS POR CADASTRO?

🔢 **Fórmula:**

```
Número de pendências = (numero_parcelas - 1)

Exemplos:
- Pagamento à vista (1 parcela) → 0 pendências
- Pagamento 2x → 1 pendência
- Pagamento 6x → 5 pendências
- Pagamento 12x → 11 pendências
```

---

## 📌 CHECKLIST DE INVESTIGAÇÃO

Para rastrear uma pendência específica, verificar na ordem:

- [ ] ✅ Foi cadastrada uma entidade/tomador?
  - Ver: `tomadores` table
  - Verificar: `status`, `criado_em`

- [ ] ✅ Um contrato foi criado?
  - Ver: `contratos` table
  - Verificar: `status`, `aceito`, `valor_total`

- [ ] ✅ O contrato foi aceito?
  - Ver: `contratos` table
  - Verificar: `aceito = true`

- [ ] ✅ Um pagamento foi criado?
  - Ver: `pagamentos` table
  - Verificar: `status`, `numero_parcelas`

- [ ] ✅ O pagamento foi confirmado como 'pago'?
  - Ver: `pagamentos` table
  - Verificar: `status = 'pago'`, `data_pagamento`

- [ ] ✅ Quantas parcelas foram calculadas?
  - Ver: `pagamentos.detalhes_parcelas` (JSON)
  - Verificar: array com `numero`, `status`, `pago`

- [ ] ✅ Notificações foram criadas?
  - Ver: `notificacoes` table
  - Verificar: `tipo = 'parcela_pendente'`, `destinatario_id`

---

## 🔗 REFERÊNCIAS RÁPIDAS

| Necessidade                         | Arquivo                              | Linhas  |
| ----------------------------------- | ------------------------------------ | ------- |
| Ver código que calcula parcelas     | lib/parcelas-helper.ts               | 25-74   |
| Ver código que cria notificações    | app/api/pagamento/confirmar/route.ts | 244-276 |
| Ver lógica de determinação de valor | app/api/cadastro/tomadores/route.ts  | 450-495 |
| Ver validação de contrato aceito    | app/api/pagamento/iniciar/route.ts   | 250-268 |

---

## ❓ PERGUNTAS FREQUENTES

**P: Por que não aparecem pendências logo após cadastro?**
R: Porque as pendências só nascem APÓS confirmação de pagamento parcelado (linhas 244-276 de confirmar/route.ts). Cadastro não cria automaticamente pendências.

**P: E se o pagamento for à vista (1 parcela)?**
R: Nenhuma notificação de pendência é criada. O loop que cria notificações valida `numero_parcelas > 1` (linha 215).

**P: Onde vê a pendência o usuário?**
R: No Centro de Operações (notificações), como `tipo='parcela_pendente'`.

**P: Como cancelo uma pendência?**
R: Atualizando o status da parcela em `pagamentos.detalhes_parcelas` via endpoint PATCH /api/admin/cobranca/parcela (linhas 10-80).

**P: A primeira parcela é criada como pendência?**
R: Não! Linha 62 de parcelas-helper.ts força `pago: true` para i===0, e loop em confirmar/route.ts pula primeira parcela (continue na linha 244).
