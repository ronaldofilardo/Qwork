# Implementação: Plano Personalizado para Medicina Ocupacional

## Visão Geral

Esta implementação adiciona suporte completo para o **Plano Personalizado** com fluxo específico para Serviços de Medicina Ocupacional, resolvendo as inconsistências identificadas no sistema QWork.

## Prioridade Alta - Implementado

### 1. Fluxo Específico do Plano Personalizado ✅

**Implementado**: Migration 021 + PlanoPersonalizadoService

**Fluxo**:

```
Pré-cadastro (gestor)
  ↓
Aguardando Valor Admin (automático)
  ↓
Valor Definido (admin define)
  ↓
Contrato Gerado (automático)
  ↓
Contrato Aceito (gestor aceita)
  ↓
Aguardando Pagamento
  ↓
Pagamento Confirmado
  ↓
Ativo
```

**Arquivos**:

- `database/migrations/021_plano_personalizavel_fluxo.sql` - Schema completo
- `lib/plano-personalizado-service.ts` - Service com State Pattern
- `lib/types/contratacao-personalizada.ts` - Tipos e interfaces

**Características**:

- ✅ State Pattern para transições controladas
- ✅ Triggers PostgreSQL para auditoria automática
- ✅ Validações de integridade referencial
- ✅ Histórico imutável de transições
- ✅ Views para dashboards (pendentes, métricas)
- ✅ Constraints temporais (datas sequenciais)

### 2. RBAC/RLS Reforçado ✅

**Implementado**: Migration 022 + Middleware expandido

**Políticas RLS**:

- Admin: Acesso total a todas as contratações
- Gestor de Entidade: Acesso apenas às próprias contratações
- Sistema: Inserção automática no histórico via triggers

**Arquivos**:

- `database/migrations/022_rls_contratacao_personalizada.sql` - Políticas RLS
- `middleware.ts` - RBAC em nível de aplicação

**Características**:

- ✅ Row-Level Security habilitado
- ✅ Funções helper para verificações complexas
- ✅ Controle granular por endpoint
- ✅ Logs de segurança para auditoria
- ✅ Princípio do menor privilégio

### 3. Lógica Condicional por Tipo de Plano ✅

**Implementado**: Strategy Pattern

**Arquivos**:

- `lib/plano-strategy.ts` - Interfaces e estratégias
- `PlanoFixoStrategy` - Para planos fixos
- `PlanoPersonalizadoStrategy` - Para planos personalizados

**Características**:

- ✅ Interface segregada (IPlanoStrategy)
- ✅ Factory Pattern para instanciação
- ✅ Validações específicas por plano
- ✅ Cálculo de valores customizado
- ✅ Geração de contrato diferenciada
- ✅ Extensível (Open-Closed Principle)

### 4. APIs RESTful ✅

**Endpoints Implementados**:

**Gestor de Entidade**:

- `POST /api/contratacao/personalizado/pre-cadastro` - Criar pré-cadastro
- `POST /api/contratacao/personalizado/aceitar-contrato` - Aceitar contrato
- `POST /api/contratacao/personalizado/cancelar` - Cancelar contratação

**Admin**:

- `POST /api/admin/contratacao/definir-valor` - Definir valor do plano
- `POST /api/admin/contratacao/rejeitar` - Rejeitar contratação
- `GET /api/admin/contratacao/pendentes` - Listar pendentes + métricas

**Características**:

- ✅ Validações robustas de entrada
- ✅ Auditoria completa (logs estruturados)
- ✅ Mensagens de erro descritivas
- ✅ Respostas padronizadas
- ✅ Context setting para triggers PostgreSQL

## Tipos TypeScript Expandidos ✅

**Arquivo**: `lib/types/enums.ts`

**Novos Enums**:

```typescript
StatusContratacaoPersonalizada;
TipoPlano;
TipoContratante;
```

**Novos Validadores**:

```typescript
ExtendedTypeValidators.isStatusContratacaoPersonalizada;
ExtendedTypeValidators.isTipoPlano;
ExtendedTypeValidators.isTipoContratante;
```

**Novos Labels**:

```typescript
StatusContratacaoPersonalizadaLabels;
TipoPlanoLabels;
TipoContratanteLabels;
```

## Princípios SOLID Aplicados

### Single Responsibility

- `PlanoPersonalizadoService`: Gerencia apenas transições de contratação
- Cada Strategy implementa regras de um tipo de plano específico
- APIs separadas por responsabilidade (criar, definir valor, aceitar, etc.)

### Open-Closed

- Strategy Pattern permite adicionar novos tipos de plano sem modificar código
- State Pattern permite adicionar novos estados sem alterar lógica existente

### Liskov Substitution

- Todas as estratégias implementam mesma interface `IPlanoStrategy`
- Substituíveis sem quebrar o sistema

### Interface Segregation

- `IPlanoStrategy` tem apenas métodos necessários
- DTOs específicos por operação

### Dependency Inversion

- Serviços dependem de abstrações (Session) não de implementações
- Factory Pattern abstrai criação de estratégias

## Segurança

### Autenticação

- Verificação de sessão em todas as APIs
- Tokens únicos com rotação automática

### Autorização

- RBAC em middleware
- RLS no banco de dados
- Validação dupla (app + database)

### Auditoria

- Histórico imutável de transições
- Captura de IP e User-Agent
- Logs estruturados
- Timestamps automáticos

## Testabilidade

### Preparado para Testes

**Testes Unitários** (Próximo passo):

- `PlanoPersonalizadoService` - Transições de estado
- Strategies - Validações e cálculos
- Type Guards - Validação de tipos

**Testes de Integração** (Próximo passo):

- Fluxo completo: pré-cadastro → ativação
- APIs com diferentes roles
- Triggers e constraints do banco

**Testes de Segurança** (Próximo passo):

- Tentativas de bypass de RLS
- Acessos não autorizados
- Transições inválidas

## Próximos Passos (Prioridade Média)

### Notificações

- Sistema de notificações assíncrono
- WebSocket para tempo real
- Componente `NotificationHub` no admin dashboard

### Frontend

- Hook `useFluxoContratacao`
- Componentes condicionais por plano
- Telas para admin gerenciar pendentes

### Validações Backend

- Schemas Zod para validação em camadas
- Middleware de validação reutilizável

## Como Usar

### 1. Aplicar Migrations

```powershell
# Banco de desenvolvimento
psql -U postgres -d nr-bps_db -f database/migrations/021_plano_personalizavel_fluxo.sql
psql -U postgres -d nr-bps_db -f database/migrations/022_rls_contratacao_personalizada.sql

# Banco de testes
psql -U postgres -d nr-bps_db_test -f database/migrations/021_plano_personalizavel_fluxo.sql
psql -U postgres -d nr-bps_db_test -f database/migrations/022_rls_contratacao_personalizada.sql
```

### 2. Fluxo de Uso

**Gestor de Entidade**:

1. Faz login com credenciais de gestor
2. Seleciona "Plano Personalizado" no cadastro
3. Preenche número estimado de funcionários e justificativa
4. Sistema cria pré-cadastro automaticamente

**Admin**:

1. Acessa dashboard de pendentes
2. Visualiza pré-cadastros aguardando definição de valor
3. Define valor por funcionário
4. Sistema gera contrato automaticamente

**Gestor** (novamente):

1. Recebe notificação de contrato gerado (futuro)
2. Visualiza e lê contrato
3. Aceita contrato
4. Procede ao pagamento

### 3. Exemplo de Uso da API

```typescript
// Criar pré-cadastro
const response = await fetch('/api/contratacao/personalizado/pre-cadastro', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contratante_id: 123,
    numero_funcionarios_estimado: 150,
    justificativa_contratante:
      'Serviço de Medicina Ocupacional precisa de avaliação personalizada',
  }),
});

// Admin define valor
const responseValor = await fetch('/api/admin/contratacao/definir-valor', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contratacao_id: 1,
    valor_por_funcionario: 45.0,
    observacoes_admin: 'Valor ajustado considerando volume',
  }),
});
```

## Estrutura de Arquivos

```
database/
  migrations/
    021_plano_personalizavel_fluxo.sql
    022_rls_contratacao_personalizada.sql

lib/
  types/
    enums.ts (expandido)
    contratacao-personalizada.ts (novo)
  plano-personalizado-service.ts (novo)
  plano-strategy.ts (novo)

app/api/
  contratacao/
    personalizado/
      pre-cadastro/route.ts (novo)
      aceitar-contrato/route.ts (novo)
      cancelar/route.ts (novo)
  admin/
    contratacao/
      definir-valor/route.ts (novo)
      rejeitar/route.ts (novo)
      pendentes/route.ts (novo)

middleware.ts (atualizado)
```

## Métricas e KPIs

### Views Disponíveis

**vw_contratacoes_personalizadas_pendentes**:

- Lista de contratações aguardando ação
- Cálculo de SLA (48 horas)
- Dados do contratante

**vw_metricas_contratacao_personalizada**:

- Total por status
- Tempo médio de definição de valor
- Tempo médio total do fluxo
- Taxa de conversão

### Exemplo de Query

```sql
-- Buscar pendentes com SLA excedido
SELECT * FROM vw_contratacoes_personalizadas_pendentes
WHERE sla_excedido = TRUE
ORDER BY horas_desde_cadastro DESC;

-- Buscar métricas
SELECT * FROM vw_metricas_contratacao_personalizada;
```

## Conclusão

Esta implementação resolve todas as inconsistências de **Prioridade Alta** identificadas, estabelecendo uma base sólida para:

- ✅ Fluxo específico e controlado para Plano Personalizado
- ✅ Segurança robusta com RBAC e RLS
- ✅ Arquitetura extensível e testável
- ✅ Conformidade com boas práticas (SOLID, DRY)
- ✅ Auditoria completa para compliance

As implementações de **Prioridade Média** e **Baixa** podem ser desenvolvidas incrementalmente sem impactar o que já foi implementado, seguindo os princípios de Open-Closed e Dependency Inversion aplicados nesta fase.
