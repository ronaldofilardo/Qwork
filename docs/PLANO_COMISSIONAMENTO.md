# 📋 Plano de Implementação: Sistema de Comissionamento

**Data:** 28 de Fevereiro de 2026  
**Status:** Planejamento  
**Objetivo:** Implementar modelo de negócio baseado em comissões por laudo emitido

---

## 📊 Visão Geral do Modelo

### Fluxo de Comissionamento

```
José (Representante)
    ↓
Indica Clínica X em fev/2026
    ↓
Clínica X emite:
  • 1º laudo: maio/2026 → Comissão paga em início de junho/2026
  • 2º laudo: junho/2026 → Comissão paga em início de julho/2026
  • 3º laudo: junho/2026 → Comissão paga em início de julho/2026
```

---

## 🏗️ Arquitetura da Solução

### 1. Modelo de Dados

#### Tabela: `representantes_comerciais`

```sql
CREATE TABLE representantes_comerciais (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    telefone VARCHAR(20) NOT NULL,
    cpf CHAR(11) NOT NULL UNIQUE,
    clinica_id INTEGER NOT NULL REFERENCES clinicas(id),

    -- Dados bancários para pagamento
    banco_codigo VARCHAR(5),
    agencia VARCHAR(10),
    conta VARCHAR(20),
    tipo_conta VARCHAR(20),
    titular_conta VARCHAR(100),

    -- Status
    ativo BOOLEAN DEFAULT TRUE,
    data_admissao DATE NOT NULL,
    data_demissao DATE,

    -- Auditoria
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT representante_cpf_valido CHECK (cpf ~ '^\d{11}$')
);
```

#### Tabela: `indicacoes_empresa`

```sql
CREATE TABLE indicacoes_empresa (
    id SERIAL PRIMARY KEY,
    representante_id INTEGER NOT NULL REFERENCES representantes_comerciais(id),
    empresa_id INTEGER NOT NULL REFERENCES empresas_clientes(id),

    -- Rastreabilidade
    indicado_em DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Uma empresa só pode ser indicada uma vez por um representante
    UNIQUE(representante_id, empresa_id),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Tabela: `comissoes_laudo`

```sql
CREATE TABLE comissoes_laudo (
    id SERIAL PRIMARY KEY,
    laudo_id INTEGER NOT NULL REFERENCES laudos(id),
    representante_id INTEGER NOT NULL REFERENCES representantes_comerciais(id),
    empresa_id INTEGER NOT NULL REFERENCES empresas_clientes(id),
    clinica_id INTEGER NOT NULL REFERENCES clinicas(id),

    -- Valores
    valor_laudo DECIMAL(10, 2) NOT NULL, -- Valor do serviço
    percentual_comissao DECIMAL(5, 2) NOT NULL DEFAULT 2.5, -- 2.5% por padrão
    valor_comissao DECIMAL(10, 2) NOT NULL, -- Calculado: valor_laudo * percentual_comissao / 100

    -- Status do processamento
    status VARCHAR(20) NOT NULL DEFAULT 'pendente',
    -- pendente: laudo emitido, aguardando período de fechamento
    -- processada: incluída em lote de pagamento
    -- paga: pagamento confirmado
    -- cancelada: comissão cancelada

    -- Período de referência (mês em que foi emitido o laudo)
    mes_emissao_laudo DATE NOT NULL, -- First day of month (ex: 2026-05-01)

    -- Período de pagamento (quando será paga)
    mes_pagamento DATE NOT NULL, -- First day of month (ex: 2026-06-01)

    -- Datas
    data_emissao_laudo TIMESTAMP NOT NULL, -- Quando o laudo foi emitido (emitido_em)
    data_processamento TIMESTAMP, -- Quando foi incluída na comissão
    data_pagamento TIMESTAMP, -- Quando foi efetivamente paga

    -- Para auditoria
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Tabela: `lotes_pagamento_comissao`

```sql
CREATE TABLE lotes_pagamento_comissao (
    id SERIAL PRIMARY KEY,
    clinica_id INTEGER NOT NULL REFERENCES clinicas(id),

    -- Periodo de referência
    mes_referencia DATE NOT NULL UNIQUE, -- ex: 2026-06-01

    -- Dados do lote
    total_comissoes DECIMAL(12, 2) NOT NULL DEFAULT 0,
    quantidade_comissoes INTEGER NOT NULL DEFAULT 0,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'preparacao',
    -- preparacao: sendo montado
    -- pronto: pronto para enviar para financeiro
    -- em_processamento: sendo processado para pagamento
    -- pago: todos os pagamentos foram processados

    -- Auditoria
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processado_em TIMESTAMP,

    UNIQUE(clinica_id, mes_referencia)
);
```

---

## 🔄 Fluxos de Negócio

### Fluxo 1: Indicação de Empresa

**Quando:** Um representante indica uma empresa cliente  
**Ator:** Gerente de clínica ou representante

```
1. Representante indica empresa (novamente possível adicionar via formulário)
2. Sistema registra em `indicacoes_empresa`
   - representante_id
   - empresa_id
   - indicado_em (data atual)
3. Sistema valida:
   - Representante existe
   - Representante está ativo
   - Empresa existe
   - Constraint unique garante uma indicação por representante/empresa
```

### Fluxo 2: Emissão de Laudo → Geração de Comissão

**Quando:** Sistema emite um laudo  
**Where:** `/api/emissor/laudos/[loteId]` POST

**Current Flow:**

```
POST /api/emissor/laudos/[loteId]
  → Valida lote pronto
  → Chama gerarLaudoCompletoEmitirPDF(loteId, emissor_cpf)
  → Cria registro em laudos com status='emitido', emitido_em=NOW()
  → Retorna laudo_id
```

**New Addition:**

```
Após emissão bem-sucedida:
  1. Buscar lote_id do laudo
  2. Buscar empresa_id/clinica_id do lote
  3. Buscar indicações_empresa para esta empresa
  4. Para CADA representante que indicou:
     a. Calcular valor da comissão:
        - valor_laudo: buscar no lote (valor total) ou fixo por tipo
        - percentual: de configuração (default 2.5%)
        - valor_comissao = valor_laudo * percentual / 100
     b. Determinar período de pagamento:
        - mes_emissao_laudo = FIRST_DAY_OF_MONTH(agora)
        - mes_pagamento = FIRST_DAY_OF_MONTH(agora + 1 mês)
     c. Inserir em comissoes_laudo com status='pendente'
  5. Retornar sucesso
```

### Fluxo 3: Processamento Mensal de Comissões

**Quando:** Início de cada mês (por job agendado)  
**Quando:** 01:00 UTC todo dia 1º do mês

**Steps:**

```
1. Para cada clínica:
   a. Buscar comissões com:
      - status = 'pendente'
      - mes_pagamento = MÊS ATUAL

   b. Se encontrar comissões:
      i. Agregar por representante:
         - Total de comissões do mês
         - Quantidade de laudos

      ii. Criar (ou usar existente) registro em lotes_pagamento_comissao:
         - clinica_id
         - mes_referencia = data de hoje (primeiro dia do mês)
         - total_comissoes = SUM(valor_comissao)
         - quantidade_comissoes = COUNT(*)
         - status = 'pronto'

      iii. Atualizar comissoes_laudo:
          - status = 'processada'
          - data_processamento = NOW()

      iv. Registrar em logs para auditoria

2. Gerar relatório de comissões para financeiro:
   - Total por clínica
   - Total geral
   - Detalhes por representante
```

### Fluxo 4: Cancelamento de Laudo → Cancelamento de Comissão

**Quando:** Laudo é cancelado (se implementar essa feature)

```
1. Buscar comissões linked ao laudo
2. Se status = 'pendente' ou 'processada':
   - Atualizar status para 'cancelada'
   - Registrar motivo
   - Não gerar comissão
3. Se status = 'paga':
   - Registrar como devolução
   - Gerar aviso para financeiro
```

---

## 🛠️ Implementação em Fases

### Fase 1: Infraestrutura de Dados (1-2 semanas)

- [ ] Criar tabelas SQL (representantes_comerciais, indicacoes_empresa, comissoes_laudo, lotes_pagamento_comissao)
- [ ] Criar migrations
- [ ] Adicionar comentários COMMENT ON COLUMN
- [ ] Criar índices para performance
- [ ] Validar constraints

**SQL a executar:**

- criar_tabelas_comissionamento.sql

### Fase 2: APIs de Gerenciamento (2 semanas)

#### 2.1 Representantes Comerciais

- [ ] GET /api/clinica/[clinicaId]/representantes - Listar representantes
- [ ] POST /api/clinica/[clinicaId]/representantes - Criar representante
- [ ] PUT /api/clinica/[clinicaId]/representantes/[id] - Atualizar
- [ ] DELETE /api/clinica/[clinicaId]/representantes/[id] - Desativar
- [ ] GET /api/clinica/[clinicaId]/representantes/[id]/comissoes - Dashboard de comissões

#### 2.2 Indicações

- [ ] GET /api/clinica/[clinicaId]/indicacoes - Listar indicações
- [ ] POST /api/clinica/[clinicaId]/indicacoes - Criar indicação
- [ ] DELETE /api/clinica/[clinicaId]/indicacoes/[id] - Remover indicação
- [ ] GET /api/clinica/[clinicaId]/empresas/[empresaId]/indicacoes - Ver representantes da empresa

#### 2.3 Comissões

- [ ] GET /api/clinica/[clinicaId]/comissoes - Listar comissões (filtros por status, mês)
- [ ] GET /api/clinica/[clinicaId]/comissoes/[id] - Detalhe
- [ ] GET /api/clinica/[clinicaId]/relatorio-comissoes - Relatório mensal

### Fase 3: Integração com Emissão de Laudos (1 semana)

- [ ] Modificar `/api/emissor/laudos/[loteId]` POST para:
  - Criar comissões após emissão bem-sucedida
  - Retornar comissões criadas na resposta
  - Logging detalhado
  - Tratamento de erros (não bloquear emissão se comissão falhar)

### Fase 4: Job de Processamento Mensal (1 semana)

- [ ] Criar job `/app/api/jobs/processar-comissoes-mensais`
- [ ] Configurar agendador (cron 0 1 1 \* \* - 1º do mês às 01:00 UTC)
- [ ] Lógica de agregação
- [ ] Lógica de geração de lotes de pagamento
- [ ] Lógica de notificação para financeiro
- [ ] Logging e tratamento de erros

### Fase 5: UI - Dashboard de Comissões (2 semanas)

- [ ] Página `/app/clinica/[clinicaId]/comissoes` - Dashboard para gerente
- [ ] Listar representantes com comissões
- [ ] Filtros: período, status, representante
- [ ] Gráficos: comissões ao longo do tempo
- [ ] Exportar relatório (CSV/PDF)

### Fase 6: UI - Gestão de Representantes (1 semana)

- [ ] Página `/app/clinica/[clinicaId]/representantes` - CRUD
- [ ] Form de criação/edição
- [ ] Lista com filtros
- [ ] Validações frontend

### Fase 7: Testes e Validação (2 semanas)

- [ ] Testes unitários das funções de cálculo
- [ ] Testes de integração das APIs
- [ ] Testes do fluxo completo (indicação → laudo → comissão)
- [ ] Testes do job mensal
- [ ] Testes de edge cases

---

## 💰 Estrutura de Precificação (Configurável)

### Opção 1: Percentual fixo por laudo

- 2.5% do valor do laudo
- Aplicável a todos os tipos de laudo
- Configurável por clínica

### Opção 2: Valor fixo por tipo de laudo

- COPSOQ Completo: R$ 150
- COPSOQ Operacional: R$ 100
- Personalizado: Configurável

### Opção 3: Escala progressiva

- Até 10 laudos/mês: 2%
- 11-20 laudos/mês: 2.5%
- 21+: 3%

**Recomendação:** Começar com Opção 1 (percentual fixo) por simplicidade

---

## 🔐 Segurança e Validações

### Regras de Negócio

1. ✅ Representante deve estar ativo para gerar comissões
2. ✅ Empresa deve estar vinculada via indicação do representante
3. ✅ Só comissões com status 'pendente' podem ser processadas
4. ✅ Uma empresa pode ser indicada por múltiplos representantes
5. ✅ Cada representante recebe comissão apenas UMA VEZ por laudo (mesmo que indicação duplicada)
6. ✅ Auditoria completa de todas as transações
7. ✅ RLS (Row Level Security) para isolamento por clínica

### Controle de Acesso

- `Gerente de Clínica`: Pode criar/editar/deletar representantes e indicações, ver comissões
- `Representante`: Pode ver apenas suas próprias comissões
- `Admin`: Acesso a tudo
- `Financeiro`: Pode ver lotes de pagamento e processar (role novo)

---

## 📊 Campos Adicionais no Lote de Avaliação

Considerar adicionar a `lotes_avaliacao`:

```sql
ALTER TABLE lotes_avaliacao ADD COLUMN empresa_indicador_id INTEGER REFERENCES empresas_clientes(id);
```

Isso permite rastrear qual empresa original indicou o serviço (se houver sugestão).

---

## 🚀 Cronograma Estimado

| Fase              | Semanas | Início     | Fim        |
| ----------------- | ------- | ---------- | ---------- |
| 1. Infraestrutura | 1-2     | 28-fev     | 10-mar     |
| 2. APIs           | 2       | 10-mar     | 24-mar     |
| 3. Integração     | 1       | 24-mar     | 31-mar     |
| 4. Job            | 1       | 31-mar     | 7-abr      |
| 5. UI Dashboard   | 2       | 7-abr      | 21-abr     |
| 6. UI Gestão      | 1       | 21-abr     | 28-abr     |
| 7. Testes         | 2       | 28-abr     | 12-mai     |
| 8. Deploy         | 1       | 12-mai     | 19-mai     |
| **TOTAL**         | **~11** | **28-fev** | **19-mai** |

---

## 📝 Próximos Passos Imediatos

1. ✅ Revisar este plano com stakeholders
2. ⏳ Validar estrutura de dados e fluxos
3. ⏳ Começar Fase 1 (criar tabelas SQL)
4. ⏳ Configurar permissões e RLS
5. ⏳ Escrever migrações

---

## 📌 Notas Importantes

- Sistema é **totalmente auditável**: cada transação registra quem, quando, what
- Banco de dados é **idempotente**: podem rodar jobs sem duplicação
- **Sem dependência de terceiros**: sistema de pagamento é separado (Asaas pode ser usado after)
- **Escalável**: suporta múltiplas clínicas, infinitos representantes
- **Reversível**: comissões podem ser canceladas a qualquer tempo

---

## ❓ Dúvidas a Resolver

1. **Valor unitário do laudo**: Como será calculado? Fixo por tipo, variável por empresa, ou?
2. **Período de carência**: Representante novo tem período mínimo antes de gerar comissões?
3. **Comissão para empresa indicadora**: Será necessário também?
4. **Integração com pagamentos**: Via Asaas ou outro sistema?
5. **Comprovação de laudo**: Email para representante quando laudo é emitido?
