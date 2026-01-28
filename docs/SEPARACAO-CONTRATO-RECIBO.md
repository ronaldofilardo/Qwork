# Separação de Contrato e Recibo - Documentação Completa

**Data de Implementação:** 22 de dezembro de 2025  
**Objetivo:** Separar informações contratuais (prestação de serviço) das informações financeiras (valores, vigência, parcelas)

## 📋 Sumário

1. [Visão Geral](#visão-geral)
2. [Motivação](#motivação)
3. [Arquitetura da Solução](#arquitetura-da-solução)
4. [Implementação](#implementação)
5. [Fluxo de Uso](#fluxo-de-uso)
6. [Estruturas de Dados](#estruturas-de-dados)
7. [APIs Criadas](#apis-criadas)
8. [Migrações de Banco](#migrações-de-banco)
9. [Testes](#testes)
10. [Manutenção e Próximos Passos](#manutenção-e-próximos-passos)

---

## 🎯 Visão Geral

A implementação separa o contrato em **dois documentos independentes**:

### 1. **Contrato Padrão** (Neutro)

- **Foco:** Prestação de serviço, escopo, responsabilidades
- **Quando:** Gerado imediatamente após seleção do plano
- **Conteúdo:** Termos de serviço, confidencialidade, vigência genérica
- **SEM:** Valores financeiros, parcelas, vencimentos

### 2. **Recibo Financeiro**

- **Foco:** Informações financeiras completas
- **Quando:** Gerado automaticamente após confirmação de pagamento
- **Conteúdo:**
  - Vigência calculada (data_pagamento + 364 dias)
  - Valor total anual
  - Valor por funcionário (se aplicável)
  - Número de funcionários cobertos
  - Forma de pagamento detalhada
  - Parcelas com vencimentos

---

## 💡 Motivação

### Problemas Resolvidos

1. **Separação de Responsabilidades**
   - Contrato → documento legal de prestação de serviço
   - Recibo → comprovante financeiro

2. **Clareza Contratual**
   - Cliente foca primeiro no serviço
   - Valores detalhados aparecem apenas após pagamento

3. **Flexibilidade**
   - Contrato permanece válido independente de mudanças de pagamento
   - Recibo pode ser reemitido/ajustado sem afetar contrato

4. **Auditoria**
   - Rastreabilidade completa: contrato → pagamento → recibo
   - Histórico de valores pagos por período

---

## 🏗️ Arquitetura da Solução

```
┌─────────────────────────────────────────────────────────────┐
│                  FLUXO DE CONTRATAÇÃO                       │
└─────────────────────────────────────────────────────────────┘

1. Seleção de Plano
   └─> Gera Contrato Neutro (lib/contrato-helpers.ts)
       └─> Salva em `contratos` (sem valores)

2. Aceite Digital
   └─> Registra aceite com IP e timestamp

3. Pagamento
   └─> Processa pagamento
       └─> Confirma pagamento (app/api/pagamento/confirmar/route.ts)
           └─> Dispara geração de recibo (POST /api/recibo/gerar)
               └─> Salva em `recibos`
               └─> Calcula vigência (364 dias)
               └─> Formata parcelas

4. Recibo Disponível
   └─> Acessível via /recibo/[id]
```

---

## 🔧 Implementação

### Arquivos Criados/Modificados

#### 1. **Migration: Tabela Recibos**

**Arquivo:** `database/migrations/041_criar_tabela_recibos.sql`

- Cria tabela `recibos` com campos:
  - `numero_recibo` (formato REC-AAAA-NNNNN)
  - `vigencia_inicio`, `vigencia_fim` (calculados)
  - `valor_total_anual`, `valor_por_funcionario`
  - `forma_pagamento`, `numero_parcelas`, `detalhes_parcelas` (JSONB)
  - `descricao_pagamento` (texto narrativo)
- **Foreign Keys:** `contrato_id`, `pagamento_id`, `contratante_id`
- **Triggers:** Auto-geração de número de recibo
- **Views:** `vw_recibos_completos` (join com contratos, contratantes, pagamentos, planos)
- **Funções:** `gerar_numero_recibo()`, `calcular_vigencia_fim()`

**Executar:**

```bash
psql -U postgres -d nr-bps_db -f database/migrations/041_criar_tabela_recibos.sql
```

---

#### 2. **API: Geração de Recibo**

**Arquivo:** `app/api/recibo/gerar/route.ts`

**POST /api/recibo/gerar**

- **Body:** `{ contrato_id, pagamento_id, emitido_por_cpf? }`
- **Validações:**
  - Verifica se recibo já existe
  - Valida se pagamento está confirmado (`status = 'pago'`)
  - Busca dados completos de contrato, pagamento, contratante, plano
- **Lógica:**
  1. Calcula vigência: `data_pagamento + 364 dias`
  2. Determina número de funcionários cobertos
  3. Calcula valor por funcionário (se plano personalizado)
  4. Gera descrição de pagamento (parcelas com vencimentos)
  5. Insere recibo no banco

- **Retorno:**
  ```json
  {
    "success": true,
    "message": "Recibo gerado com sucesso",
    "recibo": {
      "id": 1,
      "numero_recibo": "REC-2025-00001",
      "vigencia_inicio": "2025-12-22",
      "vigencia_fim": "2026-12-21",
      "numero_funcionarios_cobertos": 50,
      "valor_total_anual": 15000.0,
      "valor_por_funcionario": 300.0,
      "forma_pagamento": "parcelado",
      "numero_parcelas": 10,
      "descricao_pagamento": "Pagamento parcelado em 10x de R$ 1.500,00..."
    }
  }
  ```

**GET /api/recibo/gerar?id=1**

- Busca recibo por ID
- Retorna dados completos via view `vw_recibos_completos`

---

#### 3. **Integração no Fluxo de Pagamento**

**Arquivo:** `app/api/pagamento/confirmar/route.ts`

**Modificações:**

- Após confirmação de pagamento e liberação de login
- Busca `contrato_id` vinculado ao pagamento
- Chama `POST /api/recibo/gerar` automaticamente
- Não falha se geração de recibo der erro (log de erro)
- Retorna no response:
  ```json
  {
    "success": true,
    "message": "Pagamento confirmado com sucesso!",
    "contratante_id": 1,
    "login_liberado": false, // contratante deve ter contrato aceito para liberação automática
    "recibo_gerado": true,
    "numero_recibo": "REC-2025-00001"
  }
  ```

---

#### 4. **Helpers de Contrato e Recibo**

**Arquivo:** `lib/contrato-helpers.ts`

**Funções:**

1. **`gerarContratoNeutro(contratante, plano)`**
   - Gera texto do contrato SEM valores financeiros
   - Inclui: objeto, responsabilidades, vigência genérica, LGPD
   - Remove menções a preços, parcelas, vencimentos

2. **`gerarTextoRecibo(dados)`**
   - Gera texto formatado do recibo
   - Inclui: vigência, valores, parcelas, vencimentos
   - Layout para impressão/PDF

3. **`validarDadosContrato(contratante, plano)`**
   - Valida dados antes de gerar contrato
   - Retorna `{ valido: boolean, erros: string[] }`

---

#### 5. **Página de Visualização de Recibo**

**Arquivo:** `app/recibo/[id]/page.tsx`

**Componente React:**

- Busca recibo por ID via `GET /api/recibo/gerar?id={id}`
- Exibe:
  - Número do recibo e data de emissão
  - Dados do contratante e plano
  - Vigência destacada (início e fim)
  - Valores formatados (total, por funcionário)
  - Forma de pagamento detalhada
  - Referências ao contrato e pagamento
- **Funcionalidades:**
  - Botão "Imprimir" (`window.print()`)
  - Navegação de volta
  - Layout responsivo

**Acesso:** `/recibo/[id]`

---

## 📊 Fluxo de Uso

### Fluxo Completo (Exemplo Prático)

```
1. Cliente cadastra empresa
   └─> Empresa XYZ, CNPJ 12.345.678/0001-90

2. Seleciona plano
   └─> Plano Personalizado, 50 funcionários

3. Sistema gera contrato neutro
   ┌──────────────────────────────────────────────────┐
   │ CONTRATO DE PRESTAÇÃO DE SERVIÇOS                │
   │                                                    │
   │ CONTRATANTE: Empresa XYZ                          │
   │ CNPJ: 12.345.678/0001-90                          │
   │                                                    │
   │ OBJETO: Prestação de serviços de avaliação        │
   │ psicossocial via plataforma Qwork                 │
   │                                                    │
   │ PLANO: Personalizado                              │
   │                                                    │
   │ [... termos de serviço, responsabilidades ...]    │
   │                                                    │
   │ NOTA: Valores e vigência constam no RECIBO        │
   │ DE PAGAMENTO, emitido após confirmação            │
   └──────────────────────────────────────────────────┘

4. Cliente aceita contrato
   └─> Registra IP, data/hora de aceite

5. Redireciona para pagamento
   └─> Simula pagamento: 10x R$ 150,00 (boleto)

6. Sistema confirma pagamento
   └─> Libera login
   └─> DISPARA geração de recibo

7. Recibo gerado automaticamente
   ┌──────────────────────────────────────────────────┐
   │ RECIBO DE PAGAMENTO - REC-2025-00001             │
   │                                                    │
   │ CONTRATANTE: Empresa XYZ                          │
   │ CNPJ: 12.345.678/0001-90                          │
   │                                                    │
   │ VIGÊNCIA:                                         │
   │ Início: 22/12/2025 (data do pagamento)           │
   │ Fim: 21/12/2026 (364 dias)                        │
   │                                                    │
   │ COBERTURA:                                        │
   │ Funcionários: 50                                  │
   │ Valor por funcionário: R$ 300,00                  │
   │                                                    │
   │ VALOR TOTAL ANUAL: R$ 15.000,00                   │
   │                                                    │
   │ FORMA DE PAGAMENTO:                               │
   │ Parcelado em 10x de R$ 1.500,00                   │
   │ Vencimentos: 12/01, 12/02, 12/03, ...            │
   │ (via BOLETO)                                      │
   └──────────────────────────────────────────────────┘

8. Cliente acessa recibo
   └─> /recibo/1
   └─> Pode imprimir ou salvar PDF
```

---

## 🗂️ Estruturas de Dados

### Tabela `recibos`

```sql
CREATE TABLE recibos (
    id SERIAL PRIMARY KEY,
    contrato_id INTEGER NOT NULL,              -- FK para contratos
    pagamento_id INTEGER NOT NULL,             -- FK para pagamentos
    contratante_id INTEGER NOT NULL,           -- FK para contratantes

    numero_recibo VARCHAR(50) UNIQUE NOT NULL, -- REC-AAAA-NNNNN

    vigencia_inicio DATE NOT NULL,             -- data_pagamento
    vigencia_fim DATE NOT NULL,                -- data_pagamento + 364 dias

    numero_funcionarios_cobertos INTEGER NOT NULL,

    valor_total_anual DECIMAL(10,2) NOT NULL,
    valor_por_funcionario DECIMAL(10,2),       -- se plano personalizado

    forma_pagamento VARCHAR(50) NOT NULL,      -- 'avista', 'parcelado', etc.
    numero_parcelas INTEGER DEFAULT 1,
    valor_parcela DECIMAL(10,2),
    detalhes_parcelas JSONB,                   -- [{parcela: 1, valor: 100, vencimento: '2025-01-15'}]

    descricao_pagamento TEXT,                  -- texto narrativo

    conteudo_pdf_path TEXT,                    -- caminho do PDF (futuro)
    conteudo_texto TEXT,                       -- backup em texto

    emitido_por_cpf VARCHAR(11),              -- quem emitiu (null = sistema)
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Exemplo de `detalhes_parcelas` (JSONB)

```json
[
  { "parcela": 1, "valor": 1500.00, "vencimento": "2025-01-12" },
  { "parcela": 2, "valor": 1500.00, "vencimento": "2025-02-12" },
  { "parcela": 3, "valor": 1500.00, "vencimento": "2025-03-12" },
  ...
  { "parcela": 10, "valor": 1500.00, "vencimento": "2025-10-12" }
]
```

---

## 🔌 APIs Criadas

### 1. POST /api/recibo/gerar

**Descrição:** Gera recibo financeiro pós-pagamento

**Request:**

```json
{
  "contrato_id": 1,
  "pagamento_id": 5,
  "emitido_por_cpf": "12345678901" // opcional
}
```

**Response (Sucesso):**

```json
{
  "success": true,
  "message": "Recibo gerado com sucesso",
  "recibo": {
    "id": 1,
    "numero_recibo": "REC-2025-00001",
    "vigencia_inicio": "2025-12-22",
    "vigencia_fim": "2026-12-21",
    "numero_funcionarios_cobertos": 50,
    "valor_total_anual": 15000.0,
    "valor_por_funcionario": 300.0,
    "forma_pagamento": "parcelado",
    "numero_parcelas": 10,
    "descricao_pagamento": "Pagamento parcelado em 10x de R$ 1.500,00, vencimentos: 12/01, 12/02, 12/03, 12/04, 12/05, 12/06, 12/07, 12/08, 12/09, 12/10 (via BOLETO)"
  }
}
```

**Response (Erro):**

```json
{
  "error": "Pagamento ainda não foi confirmado"
}
```

**Validações:**

- Contrato e pagamento existem
- Pagamento está com `status = 'pago'`
- Recibo não foi gerado anteriormente (retorna existente se já foi)

---

### 2. GET /api/recibo/gerar

**Descrição:** Busca recibo por ID ou por contrato/pagamento

**Opções de Query:**

1. Por ID: `GET /api/recibo/gerar?id=1`
2. Por contrato: `GET /api/recibo/gerar?contrato_id=1`
3. Por contrato+pagamento: `GET /api/recibo/gerar?contrato_id=1&pagamento_id=5`

**Response:**

```json
{
  "success": true,
  "recibo": {
    "id": 1,
    "numero_recibo": "REC-2025-00001",
    "vigencia_inicio": "2025-12-22",
    "vigencia_fim": "2026-12-21",
    "numero_funcionarios_cobertos": 50,
    "valor_total_anual": 15000.0,
    "valor_por_funcionario": 300.0,
    "forma_pagamento": "parcelado",
    "numero_parcelas": 10,
    "descricao_pagamento": "...",
    "criado_em": "2025-12-22T10:30:00Z",
    // Dados do contrato
    "numero_contrato": "CONT-2025-00001",
    "contrato_data_aceite": "2025-12-22T09:00:00Z",
    // Dados do contratante
    "contratante_nome": "Empresa XYZ",
    "contratante_cnpj": "12.345.678/0001-90",
    "contratante_email": "contato@empresaxyz.com.br",
    // Dados do plano
    "plano_nome": "Plano Personalizado",
    "plano_tipo": "personalizado",
    // Dados do pagamento
    "pagamento_metodo": "boleto",
    "data_pagamento": "2025-12-22T10:00:00Z",
    "pagamento_status": "pago"
  }
}
```

---

## 💾 Migrações de Banco

### Executar Migration

**Desenvolvimento (nr-bps_db):**

```bash
psql -U postgres -d nr-bps_db -f database/migrations/041_criar_tabela_recibos.sql
```

**Teste (nr-bps_db_test):**

```bash
psql -U postgres -d nr-bps_db_test -f database/migrations/041_criar_tabela_recibos.sql
```

**Produção (Neon Cloud):**

```powershell
# Usar script de sync
.\scripts\powershell\sync-dev-to-prod.ps1

# Ou manualmente
$env:DATABASE_URL = "postgresql://..."
psql $env:DATABASE_URL -f database/migrations/041_criar_tabela_recibos.sql
```

### Verificar Migration

```sql
-- Verificar se tabela foi criada
SELECT * FROM information_schema.tables
WHERE table_name = 'recibos';

-- Verificar colunas
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'recibos';

-- Verificar view
SELECT * FROM vw_recibos_completos LIMIT 1;

-- Testar função
SELECT gerar_numero_recibo();
SELECT calcular_vigencia_fim('2025-12-22'::DATE);
```

---

## ✅ Testes

### Testes Manuais

#### 1. Testar Geração de Recibo

```bash
# POST via curl
curl -X POST http://localhost:3000/api/recibo/gerar \
  -H "Content-Type: application/json" \
  -d '{
    "contrato_id": 1,
    "pagamento_id": 5
  }'

# Verificar no banco
psql -U postgres -d nr-bps_db -c "SELECT * FROM recibos WHERE id = 1;"
```

#### 2. Testar Busca de Recibo

```bash
# GET por ID
curl http://localhost:3000/api/recibo/gerar?id=1

# GET por contrato
curl http://localhost:3000/api/recibo/gerar?contrato_id=1
```

#### 3. Testar Fluxo Completo

1. Cadastrar contratante via `/login` → "Novo Cadastro"
2. Selecionar plano
3. Aceitar contrato
4. Simular pagamento
5. Verificar se recibo foi gerado automaticamente
6. Acessar `/recibo/1`

### Testes Unitários (Jest)

**Arquivo:** `__tests__/api/recibo-gerar.test.ts`

```typescript
describe('POST /api/recibo/gerar', () => {
  it('deve gerar recibo com sucesso', async () => {
    // Mock de contrato e pagamento confirmado
    const response = await fetch('/api/recibo/gerar', {
      method: 'POST',
      body: JSON.stringify({
        contrato_id: 1,
        pagamento_id: 5,
      }),
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.recibo.numero_recibo).toMatch(/^REC-\d{4}-\d{5}$/);
    expect(data.recibo.vigencia_fim).toBeDefined();
  });

  it('deve retornar erro se pagamento não foi confirmado', async () => {
    // Mock de pagamento pendente
    const response = await fetch('/api/recibo/gerar', {
      method: 'POST',
      body: JSON.stringify({
        contrato_id: 1,
        pagamento_id: 99, // pagamento pendente
      }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('não foi confirmado');
  });

  it('deve retornar recibo existente se já foi gerado', async () => {
    // Gerar recibo pela primeira vez
    await fetch('/api/recibo/gerar', {
      method: 'POST',
      body: JSON.stringify({ contrato_id: 1, pagamento_id: 5 }),
    });

    // Tentar gerar novamente
    const response = await fetch('/api/recibo/gerar', {
      method: 'POST',
      body: JSON.stringify({ contrato_id: 1, pagamento_id: 5 }),
    });

    const data = await response.json();
    expect(data.message).toContain('já foi gerado');
    expect(data.recibo).toBeDefined();
  });
});
```

**Executar:**

```bash
pnpm test __tests__/api/recibo-gerar.test.ts
```

### Testes E2E (Cypress)

**Arquivo:** `cypress/e2e/recibo-fluxo-completo.cy.ts`

```typescript
describe('Fluxo Completo: Contrato → Pagamento → Recibo', () => {
  it('deve gerar recibo após confirmação de pagamento', () => {
    // 1. Login como contratante
    cy.visit('/login');
    cy.get('input[name="cpf"]').type('12345678901');
    cy.get('input[name="senha"]').type('senha123');
    cy.get('button[type="submit"]').click();

    // 2. Aceitar contrato (se necessário)
    cy.url().should('include', '/contrato/');
    cy.contains('Aceitar e Continuar').click();

    // 3. Simular pagamento
    cy.url().should('include', '/pagamento/');
    cy.get('select[name="metodo"]').select('boleto');
    cy.get('input[name="parcelas"]').clear().type('10');
    cy.contains('Simular Pagamento').click();

    // 4. Verificar confirmação
    cy.contains('Pagamento confirmado', { timeout: 10000 });

    // 5. Verificar se recibo foi criado
    cy.request('GET', '/api/recibo/gerar?contrato_id=1').then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.recibo).to.exist;
      expect(response.body.recibo.numero_recibo).to.match(/^REC-\d{4}-\d{5}$/);

      // 6. Acessar página do recibo
      const reciboId = response.body.recibo.id;
      cy.visit(`/recibo/${reciboId}`);

      // 7. Validar conteúdo
      cy.contains('Recibo de Pagamento');
      cy.contains(/REC-\d{4}-\d{5}/);
      cy.contains('Vigência do Contrato');
      cy.contains('Informações Financeiras');
      cy.contains('Forma de Pagamento');
    });
  });
});
```

**Executar:**

```bash
pnpm test:e2e
```

---

## 🔧 Manutenção e Próximos Passos

### Próximas Implementações

#### 1. **Geração de PDF do Recibo**

- Usar jsPDF ou Puppeteer
- Template profissional
- Salvar em `recibos.conteudo_pdf_path`
- Endpoint: `GET /api/recibo/[id]/pdf`

**Exemplo:**

```typescript
// app/api/recibo/[id]/pdf/route.ts
import { jsPDF } from 'jspdf';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Buscar recibo
  const recibo = await query(
    'SELECT * FROM vw_recibos_completos WHERE id = $1',
    [params.id]
  );

  // Gerar PDF
  const doc = new jsPDF();
  doc.text(`RECIBO ${recibo.numero_recibo}`, 10, 10);
  // ... adicionar mais conteúdo

  const pdfBuffer = doc.output('arraybuffer');

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="recibo-${recibo.numero_recibo}.pdf"`,
    },
  });
}
```

---

#### 2. **Dashboard de Recibos**

- Listar todos os recibos de um contratante
- Filtrar por vigência, plano, status
- Download em lote (ZIP)

**Exemplo de componente:**

```tsx
// app/admin/recibos/page.tsx
export default function RecibosPage() {
  const [recibos, setRecibos] = useState([]);

  useEffect(() => {
    fetch('/api/recibo/listar?contratante_id=1')
      .then((res) => res.json())
      .then((data) => setRecibos(data.recibos));
  }, []);

  return (
    <div>
      <h1>Meus Recibos</h1>
      <table>
        <thead>
          <tr>
            <th>Número</th>
            <th>Vigência</th>
            <th>Valor</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {recibos.map((recibo) => (
            <tr key={recibo.id}>
              <td>{recibo.numero_recibo}</td>
              <td>
                {recibo.vigencia_inicio} - {recibo.vigencia_fim}
              </td>
              <td>R$ {recibo.valor_total_anual}</td>
              <td>
                <button onClick={() => window.open(`/recibo/${recibo.id}`)}>
                  Visualizar
                </button>
                <button
                  onClick={() => window.open(`/api/recibo/${recibo.id}/pdf`)}
                >
                  Baixar PDF
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

#### 3. **Notificações de Vencimento**

- Enviar emails antes de cada vencimento de parcela
- Alertar sobre fim de vigência (30, 15, 7 dias antes)
- Integrar com tabela `notificacoes` existente

**Exemplo de cron job:**

```typescript
// app/api/cron/verificar-vencimentos/route.ts
export async function GET(request: NextRequest) {
  const hoje = new Date();
  const proximos7Dias = new Date();
  proximos7Dias.setDate(proximos7Dias.getDate() + 7);

  // Buscar parcelas próximas do vencimento
  const parcelas = await query(
    `
    SELECT r.*, c.email
    FROM recibos r
    JOIN contratantes c ON r.contratante_id = c.id
    WHERE r.detalhes_parcelas::jsonb @> '[{"vencimento": $1}]'::jsonb
  `,
    [proximos7Dias.toISOString().split('T')[0]]
  );

  // Enviar emails
  for (const parcela of parcelas.rows) {
    await enviarEmail(parcela.email, 'Lembrete de Vencimento', '...');
  }

  return NextResponse.json({ success: true });
}
```

---

#### 4. **Relatórios Financeiros**

- Dashboard de receitas por período
- Gráficos de contratos ativos/expirados
- Previsão de receita baseada em recibos

---

#### 5. **Renovação Automática**

- Detectar recibos próximos do fim (30 dias)
- Enviar proposta de renovação
- Gerar novo contrato/recibo automaticamente após pagamento

---

### Troubleshooting

#### Problema: Recibo não foi gerado após pagamento

**Diagnóstico:**

```sql
-- Verificar se pagamento foi confirmado
SELECT id, status FROM pagamentos WHERE id = 5;

-- Verificar se tem contrato vinculado
SELECT contrato_id FROM pagamentos WHERE id = 5;

-- Verificar logs da API
-- Buscar erros em logs/api-logger.log
```

**Solução:**

```bash
# Gerar recibo manualmente
curl -X POST http://localhost:3000/api/recibo/gerar \
  -H "Content-Type: application/json" \
  -d '{
    "contrato_id": 1,
    "pagamento_id": 5
  }'
```

---

#### Problema: Vigência incorreta

**Diagnóstico:**

```sql
-- Verificar cálculo
SELECT
  data_pagamento,
  data_pagamento + INTERVAL '364 days' as vigencia_fim
FROM pagamentos WHERE id = 5;

-- Comparar com recibo
SELECT vigencia_inicio, vigencia_fim FROM recibos WHERE pagamento_id = 5;
```

**Solução:**

```sql
-- Corrigir vigência manualmente (se necessário)
UPDATE recibos
SET vigencia_fim = vigencia_inicio + INTERVAL '364 days'
WHERE id = 1;
```

---

#### Problema: Parcelas incorretas

**Diagnóstico:**

```sql
-- Ver detalhes das parcelas
SELECT
  id,
  numero_parcelas,
  valor_parcela,
  detalhes_parcelas
FROM recibos WHERE id = 1;

-- Calcular valor correto
SELECT
  valor_total_anual,
  numero_parcelas,
  valor_total_anual / numero_parcelas as valor_parcela_correto
FROM recibos WHERE id = 1;
```

**Solução:**

- Ajustar lógica em `gerarDetalhesParcelas()` em `/api/recibo/gerar/route.ts`
- Recriar recibo:
  ```sql
  DELETE FROM recibos WHERE id = 1;
  -- Chamar novamente POST /api/recibo/gerar
  ```

---

### Considerações de Segurança

1. **Acesso aos Recibos**
   - Implementar middleware de autenticação
   - Validar se usuário tem permissão para ver recibo
   - Usar session.contratante_id para filtrar

2. **LGPD**
   - Recibos contêm dados financeiros sensíveis
   - Manter logs de acesso (quem visualizou, quando)
   - Permitir exclusão após prazo legal (5 anos)

3. **Auditoria**
   - Registrar alterações em `recibos.atualizado_em`
   - Criar tabela de histórico se necessário
   - Nunca deletar, apenas desativar (`ativo = false`)

---

### Performance

**Otimizações Implementadas:**

- Índices em `recibos` (contrato_id, pagamento_id, contratante_id)
- View materializada `vw_recibos_completos` (futuro)
- Cache de recibos frequentemente acessados (Redis/futuro)

**Monitoramento:**

```sql
-- Verificar queries lentas
SELECT * FROM pg_stat_statements
WHERE query LIKE '%recibos%'
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Analisar uso de índices
EXPLAIN ANALYZE
SELECT * FROM vw_recibos_completos WHERE contratante_id = 1;
```

---

## 📚 Referências

- [Copilot Instructions](./copilot-instructions.md)
- [Convenções do Projeto](CONVENCOES.md)
- [Guia de Execução](GUIA-RAPIDO-EXECUCAO.md)
- [Migration 020 - Sistema de Planos](database/migrations/020_sistema_planos_contratos_pagamentos.sql)
- [API de Pagamento](app/api/pagamento/confirmar/route.ts)

---

## ✅ Checklist de Implementação

- [x] Criar migration `041_criar_tabela_recibos.sql`
- [x] Implementar API `POST /api/recibo/gerar`
- [x] Implementar API `GET /api/recibo/gerar`
- [x] Integrar geração de recibo em `app/api/pagamento/confirmar/route.ts`
- [x] Criar helper `lib/contrato-helpers.ts` (contratos neutros)
- [x] Criar página de visualização `/recibo/[id]`
- [x] Documentar fluxo completo
- [ ] Criar testes unitários (Jest)
- [ ] Criar testes E2E (Cypress)
- [ ] Implementar geração de PDF
- [ ] Criar dashboard de recibos
- [ ] Implementar notificações de vencimento
- [ ] Validar em produção (Neon Cloud)

---

**Implementado por:** Copilot (Claude Sonnet 4.5)  
**Data:** 22 de dezembro de 2025  
**Versão:** 1.0.0
