# Relatório: Criação Automática de Pendências de Pagamento na QWork

**Data:** 8 de fevereiro de 2026  
**Scope:** Análise de onde pendências e parcelas de pagamento são criadas automaticamente durante o cadastro de entidades/tomadores.

---

## 📋 Resumo Executivo

Pendências de pagamento NO sistema QWork são criadas em **3 etapas principais**:

1. **Cadastro de Entidade** → Cria `contrato` com status `aguardando_pagamento`
2. **Iniciação de Pagamento** → Cria `pagamento` pendente
3. **Confirmação de Pagamento** → Cria `notificações` de parcelas futuras

As pendências **NÃO são criadas automaticamente** no momento do cadastro, mas sim quando o pagamento é confirmado (se for parcelado).

---

## 1. CADASTRO DE ENTIDADES - Onde Contrato é Criado

### Arquivo Principal

**[app/api/cadastro/tomadores/route.ts](app/api/cadastro/tomadores/route.ts)**

### 1.1 Determinação de Status (Linhas ~390-410)

```typescript
// Linhas 390-440
let statusToUse: StatusAprovacao = 'pendente' as StatusAprovacao;
let requiresPersonalizadoSetup = false;

if (planoId) {
  // Verificar tipo do plano para determinar fluxo
  const planoRes = await txClient.query(
    'SELECT tipo FROM planos WHERE id = $1',
    [planoId]
  );
  const plano = planoRes.rows[0];

  if (plano?.tipo === 'personalizado') {
    // Personalizado: aguarda definição de valor pelo admin
    statusToUse = 'pendente' as StatusAprovacao;
    requiresPersonalizadoSetup = true;
  } else {
    // Fixo ou outro: segue direto para pagamento
    statusToUse = 'aguardando_pagamento' as StatusAprovacao;
  }
}
```

**Lógica:**

- Se **SEM plano**: Status = `'pendente'`
- Se plano **PERSONALIZADO**: Status = `'pendente'`, requer aprovação de valor
- Se plano **FIXO** ou outro: Status = `'aguardando_pagamento'`

### 1.2 Criação do Contrato (Linhas ~500-650)

```typescript
// Linhas ~500-650
const contratoIns = await txClient.query<{ id: number }>(
  `INSERT INTO contratos (tomador_id, plano_id, numero_funcionarios, valor_total, status, aceito, tipo_tomador)
   VALUES ($1, $2, $3, $4, $5, false, $6) RETURNING id`,
  [
    entidade.id,
    planoId || null,
    numeroFuncionarios || null,
    valorTotal,
    statusContrato, // 'aguardando_aceite' ou 'aguardando_pagamento'
    tipo, // 'entidade' ou 'clinica'
  ]
);
```

**Informações Persistidas:**

- `tomador_id`: ID da entidade/tomador criado
- `plano_id`: ID do plano selecionado (se houver)
- `numero_funcionarios`: Número estimado de funcionários
- `valor_total`: Valor calculado (se plano fixo: R$20 × numero_funcionarios)
- `status`: `aguardando_aceite` ou `aguardando_pagamento`
- `aceito`: `false` (ainda não aceito)

**Cálculo do Valor Total (Linhas ~450-490):**

```typescript
// Linhas ~450-490
if (p.tipo === 'fixo' && numeroFuncionarios) {
  // Calcular valor total para plano fixo
  valorTotal = valorPorFuncionario * numeroFuncionarios; // R$20 × funcionários
  requiresPayment = valorTotal > 0;
  if (requiresPayment) {
    statusContrato = 'aguardando_pagamento';
  }
} else if (p.tipo === 'personalizado') {
  // Para personalizado, usar o preço base se existir
  requiresPayment = valorPorFuncionario > 0;
  valorTotal = valorPorFuncionario;
  statusContrato = 'aguardando_pagamento';
}
```

**Resumo do Fluxo de Cadastro:**

1. Usuário registra entidade com plano selecionado
2. Sistema cria `entidade` com status `pendente`
3. Sistema cria `contrato` com:
   - Status = `aguardando_aceite` (contrato precisa ser aceito)
   - Valor total calculado se plano fixo
   - Requer aceite ANTES de iniciar pagamento

---

## 2. INICIAÇÃO DE PAGAMENTO - Criação do Registro de Pagamento

### Arquivo Principal

**[app/api/pagamento/iniciar/route.ts](app/api/pagamento/iniciar/route.ts)**

### 2.1 Validações Pré-requisitos (Linhas ~150-250)

```typescript
// Linha ~250-260: Exigir contrato aceito
let contratoIdValido: number | null = null;
if (contratoIdParam) {
  const contratoRow = await query(
    `SELECT id, aceito FROM contratos WHERE id = $1 AND tomador_id = $2`,
    [contratoIdParam, finalTomadorId]
  );
  if (contratoRow.rows.length === 0 || !contratoRow.rows[0].aceito) {
    return NextResponse.json(
      { error: 'Contrato deve ser aceito antes do pagamento' },
      { status: 400 }
    );
  }
  contratoIdValido = contratoRow.rows[0].id;
}
```

**Requisitos:**

- Contrato DEVE estar `aceito = true`
- Tomador tem status apropriado

### 2.2 Criação do Pagamento (Linhas ~290-308)

```typescript
// Linhas ~300-308
const pagamentoResult = await query(
  `INSERT INTO pagamentos (
    tomador_id, contrato_id, valor, status, metodo
  ) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
  [finalTomadorId, contratoIdValido, finalValorTotal, 'pendente', 'avista']
);

const pagamentoId = pagamentoResult.rows[0].id;
```

**Status Inicial do Pagamento:**

- `status`: `'pendente'` - aguardando confirmação
- `metodo`: `'avista'` - será atualizado quando confirmado
- Neste momento, NENHUMA parcela é criada ainda

---

## 3. CONFIRMAÇÃO DE PAGAMENTO - Criação de Parcelas e Notificações

### Arquivo Principal

**[app/api/pagamento/confirmar/route.ts](app/api/pagamento/confirmar/route.ts)**

### 3.1 Cálculo de Parcelas (Linhas ~215-240)

```typescript
// Linhas ~215-240
if (
  pagamentoAtual.rows.length > 0 &&
  pagamentoAtual.rows[0].numero_parcelas &&
  pagamentoAtual.rows[0].numero_parcelas > 1
) {
  const numero = parseInt(pagamentoAtual.rows[0].numero_parcelas);
  const valor = parseFloat(pagamentoAtual.rows[0].valor);
  const dataInicio = new Date(pagamentoAtual.rows[0].data_pagamento);

  const parcelas = calcularParcelas({
    valorTotal: valor,
    numeroParcelas: numero,
    dataInicial: dataInicio,
  });

  await query(
    `UPDATE pagamentos SET detalhes_parcelas = $2 WHERE id = $1`,
    [pagamento_id, JSON.stringify(parcelas)]
  );
```

**Campo Persistido:**

- `detalhes_parcelas`: JSON com array de parcelas

### 3.2 Criação de Notificações de Parcelas (Linhas ~244-276)

```typescript
// Linhas ~244-276
for (const parcela of parcelas) {
  // Pular a primeira parcela (já paga)
  if (parcela.numero === 1) continue;

  try {
    const vencimento = new Date(parcela.data_vencimento);
    const vencimentoFormatado = vencimento.toLocaleDateString('pt-BR');

    await criarNotificacao({
      tipo: 'parcela_pendente',
      destinatario_id: pagamento.tomador_id,
      destinatario_tipo: 'tomador',
      titulo: `Parcela ${parcela.numero}/${numero} - Vence em ${vencimentoFormatado}`,
      mensagem: `Você tem uma parcela pendente no valor de R$ ${parcela.valor.toFixed(2).replace('.', ',')} com vencimento em ${vencimentoFormatado}.`,
      dados_contexto: {
        pagamento_id: pagamento_id,
        numero_parcela: parcela.numero,
        total_parcelas: numero,
        vencimento: parcela.data_vencimento,
        valor: parcela.valor,
        tomador_id: pagamento.tomador_id,
      },
      link_acao: '/rh/conta#pagamentos',
      botao_texto: 'Ver Pagamentos',
      prioridade: 'alta',
    });
  } catch (notifError) {
    console.error(
      `Erro ao criar notificação de parcela ${parcela.numero}:`,
      notifError
    );
  }
}
```

**O que acontece:**

1. Para CADA parcela (exceto a primeira que já está paga)
2. Uma `notificacao` é criada com tipo `'parcela_pendente'`
3. Contem informações de vencimento e valor
4. Aparece no Centro de Operações para o tomador

---

## 4. CÁLCULO DE PARCELAS - Lógica de Distribuição

### Arquivo Principal

**[lib/parcelas-helper.ts](lib/parcelas-helper.ts)**

### 4.1 Função `calcularParcelas()` (Linhas ~25-74)

```typescript
// Linhas ~25-74
export function calcularParcelas(params: CalculoParcelasParams): Parcela[] {
  const { valorTotal, numeroParcelas, dataInicial } = params;

  if (numeroParcelas < 1 || numeroParcelas > 12) {
    throw new Error('Número de parcelas deve estar entre 1 e 12');
  }

  const dataBase = dataInicial || new Date();
  const diaVencimento = dataBase.getDate();
  const valorParcela = valorTotal / numeroParcelas;
  const parcelas: Parcela[] = [];

  for (let i = 0; i < numeroParcelas; i++) {
    const dataVencimento = new Date(dataBase);

    // Para parcelas seguintes, avançar meses mantendo o mesmo dia
    if (i > 0) {
      // Calcular ano e mês alvo mantendo o offset i
      const year = dataBase.getFullYear();
      const monthIndex = dataBase.getMonth() + i;
      const lastDayOfMonth = new Date(year, monthIndex + 1, 0).getDate();
      const day = Math.min(diaVencimento, lastDayOfMonth);

      const adjDate = new Date(year, monthIndex, day, hora, minutos, segundos, ms);
      dataVencimento.setTime(adjDate.getTime());
    }

    parcelas.push({
      numero: i + 1,
      valor: Math.round(valorParcela * 100) / 100,
      data_vencimento: dataVencimento.toISOString().split('T')[0],
      pago: i === 0,  // ✅ Primeira parcela SEMPRE paga
      data_pagamento: i === 0 ? new Date().toISOString() : null,
      status: i === 0 ? 'pago' : 'pendente',
    });
  }
```

### 4.2 Estrutura de Parcela (Linhas ~5-12)

```typescript
// Linhas ~5-12
export interface Parcela {
  numero: number;
  valor: number;
  data_vencimento: string; // ISO format (YYYY-MM-DD)
  pago: boolean;
  data_pagamento: string | null;
  status: 'pago' | 'pendente';
}
```

**Regras Críticas:**

- ✅ **1ª parcela**: SEMPRE `pago: true` no mesmo dia
- 📅 **Demais parcelas**: `pago: false`, mesma data nos meses seguintes
- 💰 **Distribuição de valor**: Total ÷ número de parcelas
- 🔄 **Ajuste final**: Última parcela compensa arredondamentos

---

## 5. FLUXO COMPLETO - Linha do Tempo

```
┌─────────────────────────────────────────────────────────────────────┐
│                      FLUXO DE CADASTRO E PAGAMENTO                  │
└─────────────────────────────────────────────────────────────────────┘

1. POST /api/cadastro/tomadores
   └─ Criar ENTIDADE (status='pendente')
      └─ INSERT INTO contratos (status='aguardando_aceite')
         └─ Contrato criado, ainda não aceito ❌

2. [USUÁRIO ACEITA CONTRATO]
   └─ PUT /api/contratos/:id/aceitar
      └─ UPDATE contratos SET aceito=true

3. POST /api/pagamento/iniciar
   └─ Validar: contrato MUST be aceito=true
   └─ INSERT INTO pagamentos (status='pendente')
      └─ Pagamento criado, aguardando confirmação ❌

4. POST /api/pagamento/confirmar
   └─ UPDATE pagamentos SET status='pago'
   └─ SE numero_parcelas > 1:
      ├─ CALL calcularParcelas()
      │  └─ Gera array com todas as parcelas
      │     - Parcela 1: pago=true, status='pago'
      │     - Parcelas 2-N: pago=false, status='pendente'
      │
      └─ FOR EACH parcela (2 até N):
         └─ INSERT INTO notificacoes (tipo='parcela_pendente')
            └─ Notificação criada para cada parcela ✅

5. [CENTRO DE OPERAÇÕES]
   └─ Exibe notificações de parcelas pendentes
      └─ Usuário vê: "Parcela 2/6 - Vence em 05/02"
```

---

## 6. ARQUIVOS CRÍTICOS

| Arquivo                                                                            | Função                                         | Linhas-Chave     |
| ---------------------------------------------------------------------------------- | ---------------------------------------------- | ---------------- |
| [app/api/cadastro/tomadores/route.ts](app/api/cadastro/tomadores/route.ts)         | Cadastro de entidade e criação de contrato     | 390-450, 500-650 |
| [app/api/pagamento/iniciar/route.ts](app/api/pagamento/iniciar/route.ts)           | Criação de registro de pagamento               | 290-308          |
| [app/api/pagamento/confirmar/route.ts](app/api/pagamento/confirmar/route.ts)       | Confirmação de pagamento e criação de parcelas | 215-276          |
| [lib/parcelas-helper.ts](lib/parcelas-helper.ts)                                   | Cálculo matemático de parcelas                 | 5-74             |
| [app/api/admin/cobranca/parcela/route.ts](app/api/admin/cobranca/parcela/route.ts) | Gestão de status de parcelas                   | 1-80             |

---

## 7. TOTAIS GERADOS NO SISTEMA

### Tabelas Envolvidas

- `tomadores` - Entidade principal
- `contratos` - Contrato de serviço (1 por tomador)
- `pagamentos` - Registro de pagamento
- `notificacoes` - Notificações de parcelas pendentes (N-1)

### Exemplo Prático

Para um cadastro com **pagamento de R$ 2.000 em 4 parcelas**:

| Entidade                 | Registros | Status Inicial                                         |
| ------------------------ | --------- | ------------------------------------------------------ |
| tomadores                | 1         | pendente                                               |
| contratos                | 1         | aguardando_aceite → aceito=true → aguardando_pagamento |
| pagamentos               | 1         | pendente → pago                                        |
| detalhes_parcelas (JSON) | 4         | 1 pago + 3 pendentes                                   |
| notificacoes             | 3         | parcela_pendente (parcelas 2, 3, 4)                    |

---

## 8. CONCLUSÕES

✅ **Pendências de pagamento NÃO são criadas automaticamente no cadastro**

- Contrato é criado mas fica em status `aguardando_aceite`
- Usuário precisa aceitar o contrato explicitamente

✅ **Parcelas são criadas APENAS após confirmação de pagamento**

- Quando pagamento é confirmado (status='pago')
- Se `numero_parcelas > 1`, calcula-se as parcelas
- Para cada parcela futura (2 até N), cria-se notificação

✅ **Primeira parcela é sempre liquidada no ato da confirmação**

- Status 'pago' com data_pagamento = NOW()
- Demais parcelas ficam com status 'pendente'

✅ **Notificações servem como pendências no Centro de Operações**

- Tipo: `parcela_pendente`
- Contem: número da parcela, data de vencimento, valor
- Aparece para o tomador logado

---

## 📎 Anexos

- Estrutura de dados: [database/](database/)
- Migrações: [database/migrations/](database/migrations/)
- Testes de integração: [**tests**/integration/fluxo-cadastro-pagamento-ativacao.test.ts](__tests__/integration/fluxo-cadastro-pagamento-ativacao.test.ts)
