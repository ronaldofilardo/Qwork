# Correção: Máquina de Estados de Pagamento e Contratante

## Problema Identificado

O sistema não está registrando o pagamento corretamente após o cadastro do contratante. O erro ocorre em:

```
POST /api/cadastro/contratante 201 in 599ms ✅
GET /api/pagamento/simulador 200 in 719ms ✅
POST /api/pagamento/iniciar 400 in 383ms ⠌
```

### Análise da Máquina de Estados

#### Estados do Contratante (`status_aprovacao_enum`)

- **pendente**: Cadastro criado, aguardando aprovação/pagamento
- **aprovado**: Aprovado após pagamento e análise
- **rejeitado**: Rejeitado pelo admin
- **em_reanalise**: Em análise novamente

#### Estados do Pagamento (`status_pagamento_enum`)

- **pendente**: Pagamento criado, aguardando processamento
- **processando**: Pagamento em processamento
- **pago**: Pagamento confirmado
- **cancelado**: Pagamento cancelado
- **reembolsado**: Pagamento reembolsado

#### Flags do Contratante

- **pagamento_confirmado**: `false` → `true` (após confirmação)
- **ativa**: `true` (padrão - controla se conta está ativa)

## Problema na Validação de Status

No arquivo [app/api/pagamento/iniciar/route.ts](../../app/api/pagamento/iniciar/route.ts#L179-L193):

```typescript
// PRIMEIRA VALIDAÇÃO: Verificar status
const enumCheck = await query(
  `SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid 
   WHERE t.typname = 'status_aprovacao_enum' AND e.enumlabel = 'aguardando_pagamento' LIMIT 1`
);
const hasAguardando = enumCheck.rows.length > 0;

const statusOk =
  String(contratante.status) === 'aguardando_pagamento' ||
  (!hasAguardando && String(contratante.status) === 'pendente');

if (!statusOk) {
  console.error(`[PAGAMENTO] Status inválido: ${contratante.status}`);
  return NextResponse.json(
    { error: 'Status inválido para pagamento' },
    { status: 400 }
  );
}
```

**Problema**: O código procura por `'aguardando_pagamento'` no enum, mas o enum **NÃO contém esse valor**. O enum tem apenas:

- pendente
- aprovado
- rejeitado
- em_reanalise

Resultado: `hasAguardando = false` → aceita apenas `status = 'pendente'`

**PORÉM**, no cadastro ([app/api/cadastro/contratante/route.ts](../../app/api/cadastro/contratante/route.ts)), o contratante é criado com `status = 'pendente'`, então **DEVERIA funcionar**.

## Investigação Adicional Necessária

Vou verificar:

1. Se o contratante foi criado corretamente com status 'pendente'
2. Se há outra validação que está falhando antes da verificação de status
3. Se o contrato_id está sendo passado corretamente

```sql
-- Verificar contratante recém-criado
SELECT id, nome, status, plano_id, pagamento_confirmado
FROM contratantes WHERE id = 2;

-- Resultado:
id | nome | status  | plano_id | pagamento_confirmado
----+------+---------+----------+---------------------
 2 | RLGR | pendente|        5 | f
```

✅ Status está correto (`pendente`)

## Causa Raiz Identificada

Na linha do código de iniciar pagamento:

```typescript
if (!contrato_id && !token) {
  return NextResponse.json(
    { error: 'ID do contratante e contrato são obrigatórios' },
    { status: 400 }
  );
}
```

O código **EXIGE** que `contrato_id` seja fornecido, mas o novo fluxo de cadastro **NÃO cria contrato até DEPOIS do pagamento**!

### Fluxo Atual (Problemático)

1. ✅ `POST /api/cadastro/contratante` → Cria contratante sem contrato
2. ⠌ `POST /api/pagamento/iniciar` → Exige contrato_id → **FALHA**

### Fluxo Correto (Esperado)

1. `POST /api/cadastro/contratante` → Cria contratante com status='pendente'
2. `POST /api/pagamento/iniciar` → Cria pagamento sem exigir contrato
3. `POST /api/pagamento/confirmar` → Confirma pagamento + gera contrato + ativa contratante

## Correções Necessárias

### 1. Remover exigência de contrato_id em `/api/pagamento/iniciar`

O endpoint deve aceitar apenas `contratante_id` para iniciar pagamento:

```typescript
// ANTES (ERRADO)
if (!contrato_id && !token) {
  return NextResponse.json(
    { error: 'ID do contratante e contrato são obrigatórios' },
    { status: 400 }
  );
}

// DEPOIS (CORRETO)
// contrato_id é opcional - será criado APÓS pagamento
if (!token) {
  // Token é opcional, mas se não fornecido, contratante_id é obrigatório
  if (!contratante_id) {
    return NextResponse.json(
      { error: 'ID do contratante é obrigatório' },
      { status: 400 }
    );
  }
}
```

### 2. Ajustar query de busca do contratante

A query atual LEFT JOIN com contratos funciona, mas precisa lidar com contrato ausente:

```typescript
// Já está defensivo com LEFT JOIN - OK!
LEFT JOIN contratos ctr ON ctr.contratante_id = c.id
  AND (ctr.id = $2 OR ($2 IS NULL AND ctr.id = (
    SELECT id FROM contratos WHERE contratante_id = c.id ORDER BY criado_em DESC LIMIT 1
  )))
```

### 3. Validação de valores sem contrato

Quando não há contrato, usar dados estimados do contratante:

```typescript
// SEGUNDA VALIDAÇÃO: verificar valores
if (
  !token &&
  (contratante.valor_total == null ||
    isNaN(parseFloat(String(contratante.valor_total))))
) {
  // Se não tem contrato, calcular valor baseado no plano e numero_funcionarios_estimado
  const valorUnitario = parseFloat(String(contratante.valor_unitario)) || 20.0;
  const numeroFunc = contratante.numero_funcionarios || 1;
  const valorCalculado = valorUnitario * numeroFunc;

  console.log(`[PAGAMENTO] Calculando valor sem contrato: ${valorCalculado}`);
  contratante.valor_total = valorCalculado;
}
```

## Máquina de Estados Corrigida

### Fluxo de Pagamento (atual)

```
┌─────────────────────────────────────────────────────────┠
│ 1. CADASTRO (POST /api/cadastro/contratante)          │
│    - Cria contratante com status='pendente'            │
│    - pagamento_confirmado=false                         │
│    - SEM criar contrato                                 │
│    - Retorna simulador_url                             │
└────────────────┬────────────────────────────────────────┘
                 │
                 â–¼
┌─────────────────────────────────────────────────────────┠
│ 2. SIMULAÇÃO (GET /api/pagamento/simulador)            │
│    - Calcula valor baseado em plano + nº funcionários  │
│    - Mostra detalhamento de parcelas                    │
└────────────────┬────────────────────────────────────────┘
                 │
                 â–¼
┌─────────────────────────────────────────────────────────┠
│ 3. INICIAR PAGAMENTO (POST /api/pagamento/iniciar)     │
│    - Valida: status='pendente' ✅                       │
│    - Cria registro em pagamentos com status='pendente'  │
│    - SEM exigir contrato_id ✅ (CORREÇÃO)              │
│    - Retorna payment_id para processamento             │
└────────────────┬────────────────────────────────────────┘
                 │
                 â–¼
┌─────────────────────────────────────────────────────────┠
│ 4. PROCESSAR PAGAMENTO (sistema externo)               │
│    - Mercado Pago / PagSeguro / etc                    │
└────────────────┬────────────────────────────────────────┘
                 │
                 â–¼
┌─────────────────────────────────────────────────────────┠
│ 5. CONFIRMAR PAGAMENTO (POST /api/pagamento/confirmar) │
│    - Atualiza pagamento: status='pago'                 │
│    - Gera contrato (1ª vez)                             │
│    - Atualiza contratante:                              │
│      * pagamento_confirmado=true                        │
│      * status='aprovado' (se auto-aprovação)           │
│      * data_liberacao_login=NOW()                       │
│    - Gera recibo PDF                                    │
│    - Cria notificações                                  │
│    - Cria credenciais de acesso                         │
└─────────────────────────────────────────────────────────┘
```

### Estados Intermediários

| Etapa                    | contratante.status | pagamento.status | pagamento_confirmado | Pode fazer login? |
| ------------------------ | ------------------ | ---------------- | -------------------- | ----------------- |
| Cadastro                 | pendente           | -                | false                | ⠌ Não             |
| Pagamento Iniciado       | pendente           | pendente         | false                | ⠌ Não             |
| Pagamento Processando    | pendente           | processando      | false                | ⠌ Não             |
| **Pagamento Confirmado** | aprovado           | pago             | true                 | ✅ **SIM**        |

## Implementação das Correções

Arquivos a modificar:

1. [app/api/pagamento/iniciar/route.ts](../../app/api/pagamento/iniciar/route.ts)
   - Remover exigência de contrato_id
   - Ajustar validação de valores para funcionar sem contrato
   - Calcular valor_total baseado em plano + numero_funcionarios_estimado

## Validação da Correção

Após implementar, o fluxo deve ser:

```bash
# 1. Criar contratante
POST /api/cadastro/contratante → 201 ✅
# Retorna: { id: 2, requires_payment: true, simulador_url: "/pagamento/simulador?..." }

# 2. Acessar simulador (opcional)
GET /pagamento/simulador?contratante_id=2&plano_id=5&numero_funcionarios=100 → 200 ✅

# 3. Iniciar pagamento (DEVE FUNCIONAR AGORA)
POST /api/pagamento/iniciar { contratante_id: 2 } → 200 ✅
# Retorna: { pagamento_id: 1, valor: 2000.00, ... }

# 4. Confirmar pagamento
POST /api/pagamento/confirmar { pagamento_id: 1 } → 200 ✅
# Gera contrato, ativa conta, cria credenciais
```

## Testes Recomendados

```typescript
// __tests__/integration/fluxo-pagamento-completo.test.ts
describe('Fluxo Completo de Cadastro e Pagamento', () => {
  it('deve permitir cadastro → pagamento → ativação sem contrato prévio', async () => {
    // 1. Cadastrar contratante
    const cadastro = await POST('/api/cadastro/contratante', { ... });
    expect(cadastro.status).toBe(201);
    expect(cadastro.body.requires_payment).toBe(true);

    const contratanteId = cadastro.body.id;

    // 2. Iniciar pagamento SEM contrato_id
    const iniciar = await POST('/api/pagamento/iniciar', {
      contratante_id: contratanteId
      // SEM contrato_id!
    });
    expect(iniciar.status).toBe(200); // ✅ DEVE PASSAR AGORA

    // 3. Confirmar pagamento
    const confirmar = await POST('/api/pagamento/confirmar', {
      pagamento_id: iniciar.body.pagamento_id
    });
    expect(confirmar.status).toBe(200);

    // 4. Verificar criação do contrato
    const contratante = await query('SELECT * FROM contratantes WHERE id = $1', [contratanteId]);
    expect(contratante.rows[0].pagamento_confirmado).toBe(true);
    expect(contratante.rows[0].status).toBe('aprovado');

    const contratos = await query('SELECT * FROM contratos WHERE contratante_id = $1', [contratanteId]);
    expect(contratos.rows.length).toBe(1); // Contrato criado APÓS pagamento
  });
});
```

## Referências

- [app/api/cadastro/contratante/route.ts](../../app/api/cadastro/contratante/route.ts) - Cadastro sem contrato
- [app/api/pagamento/iniciar/route.ts](../../app/api/pagamento/iniciar/route.ts) - Exige contrato (ERRO)
- [app/api/pagamento/confirmar/route.ts](../../app/api/pagamento/confirmar/route.ts) - Gera contrato após pagamento
- [database/schema-complete.sql](../../database/schema-complete.sql#L301-L308) - Enum status_pagamento_enum

---

**Data da Análise**: 11 de janeiro de 2026  
**Status**: Identificado e documentado - Aguardando implementação  
**Prioridade**: Alta - Bloqueador para fluxo de cadastro + pagamento
