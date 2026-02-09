# Mapa de Linhas - Criação Automática de Pendências

## 🎯 Localização Rápida: Números de Linha Específicos

### 1. DETERMINAÇÃO DE STATUS DO CONTRATO

**Arquivo:** `app/api/cadastro/tomadores/route.ts`

| Operação                         | Linhas  | Descrição                                                     |
| -------------------------------- | ------- | ------------------------------------------------------------- |
| Lógica de status                 | 370-410 | Determina se status será 'pendente' ou 'aguardando_pagamento' |
| Cálculo de valor total (fixo)    | 450-480 | Para plano fixo: R$20 × numero_funcionarios                   |
| Cálculo de valor (personalizado) | 485-495 | Usa preço base do plano                                       |

---

### 2. CRIAÇÃO DO CONTRATO

**Arquivo:** `app/api/cadastro/tomadores/route.ts`

| Operação        | Linhas  | SQL                                                                                                            |
| --------------- | ------- | -------------------------------------------------------------------------------------------------------------- |
| INSERT contrato | 500-650 | `INSERT INTO contratos (tomador_id, plano_id, numero_funcionarios, valor_total, status, aceito, tipo_tomador)` |
| Campos-chave    | 520-535 | `status` = 'aguardando_aceite' ou 'aguardando_pagamento'                                                       |
|                 |         | `aceito` = false                                                                                               |
|                 |         | `valor_total` = calculado se plano fixo                                                                        |

---

### 3. CRIAÇÃO DO PAGAMENTO

**Arquivo:** `app/api/pagamento/iniciar/route.ts`

| Operação                  | Linhas  | SQL                                                                       |
| ------------------------- | ------- | ------------------------------------------------------------------------- |
| Validação contrato aceito | 250-268 | Valida se `aceito = true`                                                 |
| CREATE pagamento          | 300-308 | `INSERT INTO pagamentos (tomador_id, contrato_id, valor, status, metodo)` |
| Status inicial            | 308     | `status` = 'pendente'                                                     |

---

### 4. CÁLCULO DE PARCELAS

**Arquivo:** `lib/parcelas-helper.ts`

| Operação                  | Linhas | Detalhe                                                    |
| ------------------------- | ------ | ---------------------------------------------------------- |
| Interface Parcela         | 5-12   | Estrutura com numero, valor, data_vencimento, pago, status |
| Função calcularParcelas() | 25-74  | Calcula array de parcelas                                  |
| Validações                | 27-33  | Requer: 1-12 parcelas, valor > 0                           |
| Loop de cálculo           | 40-70  | Para cada i de 0 até numeroParcelas                        |
| 1ª parcela                | 60-70  | `pago: true`, `status: 'pago'`                             |
| Demais parcelas           | 60-70  | `pago: false`, `status: 'pendente'`                        |
| Ajuste final              | 72-76  | Compensa arredondamentos na última parcela                 |

---

### 5. CONFIRMAÇÃO DE PAGAMENTO E CRIAÇÃO DE PARCELAS

**Arquivo:** `app/api/pagamento/confirmar/route.ts`

| Operação             | Linhas  | Descrição                                         |
| -------------------- | ------- | ------------------------------------------------- |
| Buscar pagamento     | 60-90   | Query para obter dados do pagamento               |
| UPDATE pagamento     | 120-140 | `UPDATE pagamentos SET status = 'pago'`           |
| Calcular parcelas    | 215-240 | `const parcelas = calcularParcelas(...)`          |
| Persistir detalhes   | 238-241 | `UPDATE pagamentos SET detalhes_parcelas`         |
| Loop de notificações | 244-276 | FOR EACH parcela (2 até N)                        |
| Criar notificação    | 250-268 | `await criarNotificacao(tipo='parcela_pendente')` |
| Dados da notificação | 250-265 | Titulo, mensagem, link_acao, prioridade='alta'    |

---

### 6. GESTÃO DE STATUS DE PARCELAS

**Arquivo:** `app/api/admin/cobranca/parcela/route.ts`

| Operação               | Linhas  | SQL/Descrição                                                           |
| ---------------------- | ------- | ----------------------------------------------------------------------- |
| PATCH atualizar status | 10-80   | `UPDATE pagamentos SET detalhes_parcelas = (CASE WHEN numero=X THEN...` |
| Validações status      | 25-35   | Aceita: 'pago', 'pendente', 'cancelado'                                 |
| GET histórico          | 100-160 | Lista pagamentos com histórico de parcelas                              |

---

## 📊 TABELAS AFETADAS

### A. Tabela: `tomadores` (ou `entidades`)

- Campo: `status` = 'pendente' (após cadastro)
- Campo: `plano_id` = ID do plano selecionado
- Campo: `numero_funcionarios_estimado` = Para planos fixos

### B. Tabela: `contratos`

- Campo: `status` = 'aguardando_aceite' → 'aguardando_pagamento'
- Campo: `aceito` = false → true (quando usuário aceita)
- Campo: `tomador_id` = ID da entidade
- Campo: `plano_id` = ID do plano
- Campo: `valor_total` = Valor calculado (plano fixo)
- Campo: `numero_funcionarios` = Estimado

### C. Tabela: `pagamentos`

- Campo: `status` = 'pendente' → 'pago'
- Campo: `tomador_id` = ID da entidade
- Campo: `contrato_id` = ID do contrato
- Campo: `valor` = Valor total a pagar
- Campo: `numero_parcelas` = Quantidade de parcelas
- Campo: `detalhes_parcelas` = JSON com array de parcelas

### D. Tabela: `notificacoes`

- Campo: `tipo` = 'parcela_pendente'
- Campo: `destinatario_id` = tomador_id
- Campo: `dados_contexto` = JSON com {pagamento_id, numero_parcela, total_parcelas, valor, vencimento}

---

## 🔄 SEQUÊNCIA CHAMADAS DE API

```
1. POST /api/cadastro/tomadores [LINHAS 115-814]
   └─ INSERT entidades (linhas 350-450)
   └─ INSERT contratos (linhas 500-650)
   └─ RETURN: {id, status='pendente', contrato_id}

2. [USUÁRIO ACEITA CONTRATO]
   └─ PUT /api/contratos/{id}/aceitar
   └─ UPDATE contratos SET aceito=true

3. POST /api/pagamento/iniciar [LINHAS 1-322]
   └─ Validar: aceito=true (linhas 250-268)
   └─ INSERT pagamentos (linhas 300-308)
   └─ status='pendente'
   └─ RETURN: {pagamento_id, status='pendente'}

4. POST /api/pagamento/confirmar [LINHAS 1-717]
   └─ UPDATE pagamentos SET status='pago' (linhas 120-140)
   └─ IF numero_parcelas > 1:
      ├─ calcularParcelas() [lib/parcelas-helper.ts:25-74]
      ├─ UPDATE detalhes_parcelas (linhas 238-241)
      └─ FOR EACH parcela (2..N): [linhas 244-276]
         └─ INSERT notificacoes (tipo='parcela_pendente')

5. GET /api/admin/cobranca/parcela [HISTÓRICO]
   └─ SELECT * FROM pagamentos com parcelas
```

---

## ⚠️ PONTOS CRÍTICOS

### ⚠️ NENHUMA PENDÊNCIA É CRIADA AUTOMATICAMENTE NO CADASTRO!

- Contrato é criado mas não está aceito
- Pagamento não é criado automaticamente
- Pendências (notificações) só nascem APÓS confirmação de pagamento parcelado

### ⚠️ PRIMEIRA PARCELA SEMPRE SERÁ PAGA NO ATO

- Linha 62 de `parcelas-helper.ts`: `pago: i === 0` (sempre true para primeira)
- Linha 66: `status: i === 0 ? 'pago' : 'pendente'`
- Mensagem de confirmação fala em "Primeira parcela paga imediatamente"

### ⚠️ PARCELAS SÓ EXISTEM SE `numero_parcelas > 1`

- Linhas 215-240 de `confirmar/route.ts` validam: `numero_parcelas && numero_parcelas > 1`
- Pagamento à vista (1 parcela) não cria notificações

### ⚠️ NOTIFICAÇÕES VÃO PARA O TOMADOR, NÃO PARA O ADMIN

- Linha 246: `destinatario_id: pagamento.tomador_id`
- Aparece no Centro de Operações do tomador/clinica

---

## 📌 EXEMPLO CONCRETO

Para um cadastro com **2.000 reais em 4 parcelas**:

### Etapa 1: Cadastro (app/api/cadastro/tomadores/route.ts)

```
Linhas 350-450:
  INSERT INTO entidades (nome, cnpj, ..., plano_id=5)
  RETURNING id=123

Linhas 500-650:
  INSERT INTO contratos (tomador_id=123, plano_id=5, valor_total=2000, status='aguardando_aceite')
  RETURNING id=999
```

### Etapa 2: Aceitar Contrato

```
[Usuário clica em "Aceitar"]
UPDATE contratos SET aceito=true WHERE id=999
```

### Etapa 3: Iniciar Pagamento (app/api/pagamento/iniciar/route.ts)

```
Linhas 250-268:
  SELECT aceito FROM contratos WHERE id=999  -- aceito=true ✅

Linhas 300-308:
  INSERT INTO pagamentos (tomador_id=123, contrato_id=999, valor=2000, status='pendente')
  RETURNING id=777
```

### Etapa 4: Confirmar Pagamento (app/api/pagamento/confirmar/route.ts)

```
Linhas 120-140:
  UPDATE pagamentos SET status='pago', numero_parcelas=4, data_pagamento=NOW()

Linhas 215-240:
  calcularParcelas(valorTotal=2000, numeroParcelas=4)
  RESULT: [
    {numero:1, valor:500, status:'pago', pago:true, data_vencimento:'2026-02-08'},
    {numero:2, valor:500, status:'pendente', pago:false, data_vencimento:'2026-03-08'},
    {numero:3, valor:500, status:'pendente', pago:false, data_vencimento:'2026-04-08'},
    {numero:4, valor:500, status:'pendente', pago:false, data_vencimento:'2026-05-08'}
  ]

Linhas 244-276:
  FOR parcela IN [PARCELA 2, 3, 4]:
    INSERT INTO notificacoes (
      tipo='parcela_pendente',
      titulo='Parcela 2/4 - Vence em 08/03',
      mensagem='R$ 500,00',
      prioridade='alta'
    )

  RESULT: 3 notificações criadas (parcelas 2, 3, 4)
```

### Resultado Final:

- ✅ 1 tomador criado
- ✅ 1 contrato criado e aceito
- ✅ 1 pagamento confirmado
- ✅ 4 parcelas calculadas (1 pago + 3 pendentes)
- ✅ 3 notificações criadas (parcelas 2, 3, 4)
- ✅ Tomador vê no Centro de Operações 3 pendências de parcelas
