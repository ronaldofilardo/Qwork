# Sistema de Índice de Avaliação - Qwork

## Visão Geral

O Sistema de Índice de Avaliação foi implementado para garantir que **nenhum funcionário fique mais de 1 ano sem realizar uma avaliação biopsicossocial**, assegurando que o laudo sempre reflita o estado atual da empresa.

### Conceito Central

- **Índice de Avaliação**: Número sequencial que registra a última avaliação concluída por um funcionário (ex.: 10 = fez o 10º lote da empresa)
- **Índice 0**: Funcionário novo que nunca fez avaliação
- **Número de Ordem do Lote**: Sequência cronológica dos lotes na empresa (1, 2, 3...)

### Princípio de Obrigatoriedade

1. **Funcionários novos** (índice 0) devem ser incluídos automaticamente no próximo lote
2. **Índice incompleto** (ex.: fez lote 8, mas empresa está no lote 11) força inclusão automática
3. **Mais de 1 ano** sem avaliação válida força inclusão automática
4. **Inativações consecutivas** são bloqueadas (não pode inativar 2 vezes seguidas)

---

## Instalação

### 1. Executar Migration SQL

```bash
node run_migration_016.mjs
```

Isso irá:

- Adicionar campos `indice_avaliacao`, `data_ultimo_lote` em `funcionarios`
- Adicionar campo `numero_ordem` em `lotes_avaliacao`
- Criar índices para performance
- Popular dados existentes com índices retroativos
- Criar 5 funções PostgreSQL de negócio

### 2. Verificar Estrutura

Após a migration, verifique:

```sql
-- Ver funcionários por índice
SELECT indice_avaliacao, COUNT(*)
FROM funcionarios
GROUP BY indice_avaliacao
ORDER BY indice_avaliacao;

-- Ver lotes com numero_ordem
SELECT codigo, numero_ordem, liberado_em
FROM lotes_avaliacao
ORDER BY numero_ordem DESC;
```

---

## APIs Backend

### 1. Iniciar Ciclo (Atualizada)

**Endpoint**: `POST /api/rh/liberar-lote`

**Alterações**:

- Usa função `calcular_elegibilidade_lote()` para incluir automaticamente:
  - Funcionários novos (índice 0)
  - Índices atrasados (faltou lote anterior)
  - Mais de 1 ano sem avaliação
- Retorna resumo agregado com prioridades (críticas, altas, médias)
- Atribui `numero_ordem` automaticamente ao lote

**Response**:

```json
{
  "success": true,
  "lote": {
    "id": 123,
    "codigo": "008-181225",
    "numero_ordem": 11
  },
  "resumoInclusao": {
    "funcionarios_novos": 5,
    "indices_atrasados": 3,
    "mais_de_1_ano_sem_avaliacao": 2,
    "prioridade_critica": 1,
    "prioridade_alta": 4,
    "mensagem": "Incluindo automaticamente: 5 funcionários com pendências prioritárias"
  }
}
```

### 2. Inativar Avaliação (Nova)

**Endpoint**: `POST /api/avaliacoes/inativar`

**Body**:

```json
{
  "avaliacao_id": 456,
  "motivo": "Licença médica por 90 dias",
  "forcar": false
}
```

**Validações**:

- Impede 2ª inativação consecutiva (retorna erro com detalhes)
- Se `forcar: true`, exige justificativa ≥ 50 caracteres
- Registra log de auditoria com tipo `INATIVACAO_FORCADA` ou `INATIVACAO_NORMAL`

**Response (bloqueada)**:

```json
{
  "error": "Inativação bloqueada",
  "permitido": false,
  "motivo": "⚠️ NÃO É POSSÍVEL INATIVAR! Funcionário já teve avaliação anterior inativada (Lote 003-151225). Inativar consecutivamente viola obrigatoriedade...",
  "pode_forcar": true
}
```

### 3. Finalizar Avaliação (Atualizada)

**Endpoint**: `POST /api/avaliacao/finalizar`

**Alterações**:

- Atualiza `indice_avaliacao` e `data_ultimo_lote` do funcionário
- Registra log de auditoria com tipo `ATUALIZACAO_INDICE`

### 4. Validar Lote Pré-Laudo (Nova)

**Endpoint**: `GET /api/laudos/validar-lote?lote_id=123`

**Validações**:

- Verifica se todos funcionários elegíveis foram incluídos
- Detecta anomalias (>3 inativações, índices muito atrasados, >2 anos sem avaliação)
- Retorna recomendações antes da emissão

**Response**:

```json
{
  "valido": false,
  "pode_emitir": true,
  "validacao": {
    "total_avaliacoes": 50,
    "avaliacoes_concluidas": 42,
    "funcionarios_pendentes": 3,
    "taxa_conclusao": 84.0
  },
  "anomalias": {
    "total": 5,
    "do_lote": 2,
    "criticas": 1,
    "altas": 1
  },
  "recomendacoes": [
    {
      "tipo": "PENDÊNCIA",
      "severidade": "ALTA",
      "mensagem": "3 funcionário(s) elegíveis não foram incluídos neste lote",
      "acao": "Considere criar um lote complementar"
    }
  ]
}
```

---

## Funções PostgreSQL

### 1. calcular_elegibilidade_lote(empresa_id, numero_lote_atual)

Retorna lista de funcionários que **devem** ser incluídos no próximo lote:

```sql
SELECT * FROM calcular_elegibilidade_lote(1, 11);
```

**Colunas retornadas**:

- `funcionario_cpf`, `funcionario_nome`
- `motivo_inclusao` ("Funcionário novo", "Índice atrasado", "Mais de 1 ano")
- `indice_atual` (0, 8, 10...)
- `dias_sem_avaliacao` (NULL se nunca fez)
- `prioridade` (CRÍTICA, ALTA, MÉDIA, NORMAL)

### 2. verificar_inativacao_consecutiva(cpf, lote_id)

Valida se avaliação pode ser inativada:

```sql
SELECT * FROM verificar_inativacao_consecutiva('12345678901', 123);
```

**Retorna**:

- `permitido` (true/false)
- `motivo` (texto explicativo)
- `total_inativacoes_consecutivas` (0, 1, 2...)
- `ultima_inativacao_lote` (código do lote, ex.: "003-151225")

**Observações de regra**:

- A validação considera funcionários de **empresas** e **entidades**.
- Se o funcionário **não tem avaliações anteriores** (ex.: recém-importado/inscrito), a inativação do **primeiro** lote é permitida e **não** é sinalizada como inativação forçada.
- A partir da **segunda inativação** (ou seja, quando já existe **≥ 1** inativação anterior), a operação passa a ser sinalizada como restrita — o sistema exigirá justificativa detalhada e permitirá forçar a inativação mediante justificativa (campo `forcar` no endpoint).

### 3. detectar_anomalias_indice(empresa_id)

Detecta padrões suspeitos:

```sql
SELECT * FROM detectar_anomalias_indice(1);
```

**Tipos de anomalias**:

- `INATIVAÇÕES CONSECUTIVAS` (>3 nos últimos lotes)
- `ÍNDICE ATRASADO` (>5 lotes de diferença)
- `PRAZO EXCEDIDO` (>2 anos sem avaliação)
- `NUNCA AVALIADO` (índice 0 por >6 meses)

### 4. validar_lote_pre_laudo(lote_id)

Check pré-laudo com alertas:

```sql
SELECT * FROM validar_lote_pre_laudo(123);
```

**Retorna**:

- `valido` (true/false)
- `alertas` (array de textos)
- `funcionarios_pendentes` (count)
- `detalhes` (JSONB com taxas e métricas)

### 5. obter_proximo_numero_ordem(empresa_id)

Helper para gerar próximo número de ordem:

```sql
SELECT obter_proximo_numero_ordem(1); -- Retorna: 11
```

---

## Frontend (A Implementar)

### 1. Indicadores na Lista de Funcionários

**Componente**: `app/rh/empresa/[id]/page.tsx`

**Adicionar coluna "Última Avaliação"**:

```tsx
<td className="px-3 py-2 text-sm">
  {func.indice_avaliacao === 0 ? (
    <span className="text-yellow-600 font-semibold">⚠️ Nunca fez</span>
  ) : (
    <span className="text-gray-700">
      Lote {func.indice_avaliacao}
      {diasDesdeUltimaAvaliacao > 365 && (
        <span className="ml-2 text-red-600">🔴 >1 ano</span>
      )}
    </span>
  )}
</td>
```

### 2. Modal de Inativação com Validação

Antes de inativar, chamar:

```ts
const response = await fetch(`/api/avaliacoes/inativar?avaliacao_id=${id}`);
const validacao = await response.json();

if (!validacao.validacao.permitido) {
  // Mostrar modal de aviso com botão "Forçar Inativação"
  showWarningModal(validacao.validacao.motivo);
}
```

### 3. Aba "Pendências" no Dashboard

**Nova aba** com métricas:

- Funcionários com índice 0 (nunca fizeram)
- Índices atrasados (>2 lotes de diferença)
- Mais de 1 ano sem avaliação
- Anomalias críticas e altas

### 4. Resumo no Modal de Iniciar Ciclo

Mostrar resumo após gerar lote:

```tsx
<div className="bg-blue-50 p-4 rounded">
  <h4 className="font-bold">Resumo de Inclusão</h4>
  <ul>
    <li>✅ {resumo.funcionarios_novos} novos</li>
    <li>⚠️ {resumo.indices_atrasados} atrasados</li>
    <li>🔴 {resumo.prioridade_critica} críticos</li>
  </ul>
</div>
```

---

## PWA/Offline (A Implementar)

### Atualizar IndexedDB Schema

**Arquivo**: `components/PWAInitializer.tsx`

```ts
const DB_VERSION = 3; // Incrementar versão

db.createObjectStore('funcionarios', { keyPath: 'cpf' });
// Adicionar índices:
db.objectStore('funcionarios').createIndex(
  'indice_avaliacao',
  'indice_avaliacao'
);
db.objectStore('funcionarios').createIndex(
  'data_ultimo_lote',
  'data_ultimo_lote'
);
```

### Sincronizar ao Reconectar

```ts
async function syncIndice() {
  const response = await fetch('/api/rh/funcionarios?empresa_id=1');
  const funcionarios = await response.json();

  funcionarios.forEach((func) => {
    // Salvar indice_avaliacao e data_ultimo_lote no IndexedDB
  });
}
```

---

## Testes (A Implementar)

### Testes Jest

**Arquivo**: `__tests__/indice-avaliacao.test.ts`

```ts
describe('Sistema de Índice de Avaliação', () => {
  test('Deve incluir funcionário novo (índice 0) automaticamente', async () => {
    // Criar funcionário com indice 0
    // Gerar lote
    // Verificar se foi incluído
  });

  test('Deve bloquear 2ª inativação consecutiva', async () => {
    // Inativar avaliação do lote N
    // Tentar inativar lote N+1
    // Esperar erro 400 com motivo
  });

  test('Deve atualizar índice após conclusão', async () => {
    // Criar avaliação no lote 10
    // Finalizar avaliação
    // Verificar se funcionario.indice_avaliacao === 10
  });
});
```

### Testes Cypress

**Arquivo**: `cypress/e2e/indice-avaliacao.cy.ts`

```ts
describe('Fluxo Completo de Índice', () => {
  it('Deve gerar lote com resumo agregado', () => {
    cy.visit('/rh/empresa/1');
    cy.contains('Iniciar Novo Ciclo').click();
    // Verificar resumo com novos/atrasados/críticos
  });

  it('Deve mostrar aviso ao inativar consecutivamente', () => {
    // Navegar para lista de avaliações
    // Clicar em "Inativar"
    // Verificar modal de aviso se for 2ª consecutiva
  });
});
```

---

## Auditoria

Todos os eventos são registrados na tabela `auditorias`:

```sql
SELECT
  acao,
  detalhes,
  criado_em
FROM auditorias
WHERE acao IN ('ATUALIZACAO_INDICE', 'INATIVACAO_FORCADA', 'INATIVACAO_NORMAL')
ORDER BY criado_em DESC;
```

**Tipos de ações**:

- `ATUALIZACAO_INDICE`: Índice atualizado após conclusão
- `INATIVACAO_NORMAL`: Avaliação inativada sem restrições
- `INATIVACAO_FORCADA`: Inativação consecutiva forçada com justificativa

---

## Troubleshooting

### Funcionário não foi incluído no lote

1. Verificar índice atual:

```sql
SELECT indice_avaliacao, data_ultimo_lote FROM funcionarios WHERE cpf = '12345678901';
```

2. Verificar elegibilidade:

```sql
SELECT * FROM calcular_elegibilidade_lote(1, 11) WHERE funcionario_cpf = '12345678901';
```

3. Se não retornar, verificar se `ativo = true` e se atende critérios

### Erro ao gerar lote (numero_ordem duplicado)

Verificar se há lotes com mesmo numero_ordem:

```sql
SELECT * FROM lotes_avaliacao WHERE empresa_id = 1 ORDER BY numero_ordem DESC;
```

Se houver duplicatas, corrigir manualmente:

```sql
UPDATE lotes_avaliacao SET numero_ordem = <novo_valor> WHERE id = <lote_id>;
```

### Índice não atualizado após conclusão

Verificar se avaliação tem lote_id:

```sql
SELECT a.id, a.lote_id, la.numero_ordem
FROM avaliacoes a
LEFT JOIN lotes_avaliacao la ON a.lote_id = la.id
WHERE a.id = 456;
```

Se `lote_id` for NULL, reatribuir manualmente:

```sql
UPDATE avaliacoes SET lote_id = <lote_id_correto> WHERE id = 456;
-- Depois, refinalizar a avaliação
```

---

## Roadmap

- [x] Migration SQL + Funções PostgreSQL
- [x] APIs Backend (liberar-lote, inativar, finalizar, validar-lote)
- [x] Auditoria e logs
- [ ] Frontend - Indicadores na lista
- [ ] Frontend - Modal de inativação com validação
- [ ] Frontend - Aba "Pendências"
- [ ] Frontend - Resumo no modal de lote
- [ ] PWA/Offline - Sincronização de índice
- [ ] Testes Jest
- [ ] Testes Cypress
- [ ] Dashboard de Pendências (nova página)

---

## Suporte

Para dúvidas ou problemas, consultar:

- [database/migration-016-indice-avaliacao.sql](database/migration-016-indice-avaliacao.sql) - Schema e campos
- [database/functions-016-indice-avaliacao.sql](database/functions-016-indice-avaliacao.sql) - Funções de negócio
- [app/api/avaliacoes/inativar/route.ts](app/api/avaliacoes/inativar/route.ts) - API de inativação
- [app/api/rh/liberar-lote/route.ts](app/api/rh/liberar-lote/route.ts) - API de lotes
- [app/api/laudos/validar-lote/route.ts](app/api/laudos/validar-lote/route.ts) - Validação pré-laudo

**Última atualização**: 18 de dezembro de 2025

