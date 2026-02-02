# Implementação das Fases 1, 2 e 3 - Sistema de Planos

## Resumo das Implementações

### Fase 1: Correções Críticas de Segurança ✅

#### 1.1 Rotação Automática de Chaves de Sessão

- **Arquivo**: `lib/session.ts`
- **Implementações**:
  - Adicionado `sessionToken` único para cada sessão
  - Campo `lastRotation` para rastrear timestamp
  - Função `regenerateSession()` para rotação manual
  - Rotação automática a cada 2 horas em `getSession()`
  - Tokens gerados com `crypto.randomBytes(32)`

#### 1.2 Sistema de MFA (Multi-Factor Authentication)

- **Arquivo**: `lib/mfa.ts`
- **Funções**:
  - `generateMFACode()`: Gera código de 6 dígitos
  - `createMFACode()`: Cria e armazena código no banco
  - `validateMFACode()`: Valida e marca código como usado
  - `hasPendingMFA()`: Verifica códigos pendentes
  - `cleanupExpiredMFACodes()`: Limpa códigos expirados
- **Expiração**: 10 minutos
- **Tabela**: `mfa_codes` (cpf, code, expires_at, used)

#### 1.3 Middleware de Validação MFA

- **Arquivo**: `middleware.ts`
- **Rotas protegidas**: `/api/admin/financeiro`, `/admin/financeiro`
- **Validação**: Admins precisam de `mfaVerified: true`
- **Erro**: Retorna `MFA_REQUIRED` (403) se não verificado

#### 1.4 Testes de Segurança

- **Arquivo**: `__tests__/security/session-mfa-security.test.ts`
- **Cobertura**:
  - Rotação de chaves (tokens únicos, timing)
  - Geração e validação de códigos MFA
  - Expiração de códigos
  - Bloqueio de rotas sem MFA

---

### Fase 2: Otimizações em Banco de Dados ✅

#### 2.1 Schema de Planos e Contratos

- **Arquivo**: `database/planos-schema.sql`
- **Tabelas criadas**:
  - `mfa_codes`: Códigos de autenticação
  - `planos`: Catálogo de planos (personalizado, básico, premium)
  - `contratos_planos`: Associação entidade/clínica com planos
  - `historico_contratos_planos`: Snapshots para auditoria
  - `notificacoes_financeiras`: Alertas financeiros
  - `auditoria_planos`: Log de alterações

#### 2.2 Triggers e Funções PostgreSQL

- **Triggers**:
  - `bloquear_alteracao_contrato_vigente()`: Impede mudanças durante vigência de 364 dias
  - `validar_limite_funcionarios()`: Valida limites e cria notificações
  - `criar_snapshot_contrato()`: Cria histórico automático
- **Funções**:
  - `refresh_funcionarios_por_contrato()`: Atualiza view materializada
  - `notificar_renovacoes_proximas()`: Job mensal de renovações
  - `calcular_custo_contrato()`: Calcula custo mensal

#### 2.3 View Materializada

- **Nome**: `view_funcionarios_por_contrato`
- **Propósito**: Agregação de funcionários ativos por contrato
- **Performance**: Índices otimizados para queries rápidas

#### 2.4 Helpers Seguros no db.ts

- **Arquivo**: `lib/db.ts`
- **Funções**:
  - `queryMultiTenant()`: Força filtros de clinica_id ou contratante_id
  - `contarFuncionariosAtivos()`: Contagem segura com agregação
  - `getNotificacoesFinanceiras()`: Lista notificações filtradas
  - `marcarNotificacaoComoLida()`: Atualiza status
  - `getContratosPlanos()`: Busca contratos com filtros obrigatórios

#### 2.5 Testes de Banco

- **Arquivo**: `__tests__/database/planos-triggers.test.ts`
- **Cobertura**:
  - Isolamento multi-tenant
  - Triggers de validação
  - Views materializadas
  - Funções de cálculo
  - Auditoria e histórico

---

### Fase 3: Melhorias em Frontend e Estado ✅

#### 3.1 Zustand Store para Planos

- **Arquivo**: `lib/stores/planosStore.ts`
- **Estado gerenciado**:
  - `planos[]`: Lista de planos
  - `contratos[]`: Contratos ativos
  - `notificacoes[]`: Notificações financeiras
- **Ações**:
  - CRUD completo para planos, contratos e notificações
  - `getNotificacoesNaoLidas()`: Filtra não lidas
- **Persistência**: localStorage via Zustand persist

#### 3.2 Componentes de UI

- **PlanosManager** (`components/admin/PlanosManager.tsx`):
  - Lista planos (básico, premium, personalizado)
  - Badges de tipo e status
  - Botão para criar plano personalizado
  - Visualização de valores e limites
- **NotificacoesFinanceiras** (`components/admin/NotificacoesFinanceiras.tsx`):
  - Lista notificações com ícones por tipo
  - Contador de não lidas
  - Botão "Marcar como lida"
  - Cores por prioridade (baixa/normal/alta/crítica)

#### 3.3 PWA - Sincronização Offline

- **Arquivo**: `components/PWAInitializer.tsx`
- **Melhorias**:
  - Função `syncPlanosData()` para sincronizar planos e notificações
  - Cache em localStorage (`planos-cache`, `notificacoes-cache`)
  - Trigger automático ao reconectar (evento `online`)

#### 3.4 Testes de Frontend

- **Arquivo**: `__tests__/components/planos-components.test.tsx`
- **Cobertura**:
  - Zustand store (CRUD, filtros)
  - Renderização de componentes
  - Interações (marcar como lida)
  - Loading e erros
  - Sincronização offline

---

### Estrutura Preparada para Fases 4 e 5 ✅

#### Fase 4: Rate Limiting e Validação

- **Arquivo**: `lib/rate-limit.ts`
  - Middleware de rate limiting baseado em IP
  - Configurações por endpoint (auth, api, adminFinanceiro)
  - Armazenamento em memória (produção: Redis)
  - Cleanup automático de registros expirados
- **Arquivo**: `lib/validation.ts`
  - Schemas Zod para planos, contratos, MFA, notificações
  - Função `validateInput()` genérica
  - Sanitização de strings
  - Validação de CPF, valores monetários, datas

#### Fase 5: Health Checks e Monitoramento

- **Arquivo**: `lib/health-check.ts`
  - `performHealthCheck()`: Verifica database, session, MFA, planos
  - Status: healthy/degraded/unhealthy
  - Response time tracking
  - `getSystemMetrics()`: Uptime, memória
  - Endpoint para monitoramento externo

---

### APIs Criadas

#### 1. `/api/admin/financeiro/planos`

- **GET**: Lista planos (admin + MFA)
- **POST**: Cria plano personalizado (validação Zod)
- **Auditoria**: Registra criação em `auditoria_planos`

#### 2. `/api/admin/financeiro/notificacoes`

- **GET**: Lista notificações (filtros: contrato_id, nao_lidas)

#### 3. `/api/admin/financeiro/notificacoes/[id]`

- **PATCH**: Marca notificação como lida

---

## Regras de Negócio Implementadas

### Planos

1. **Básico**: R$ 1.224/ano, até 50 funcionários
2. **Premium**: R$ 3.999,99/ano, até 200 funcionários
3. **Personalizado**: Valor por funcionário definido pelo admin

### Contratos

- **Vigência**: 364 dias a partir da contratação
- **Bloqueio**: Valores fixos durante vigência (flag `bloqueado`)
- **Parcelamento**: 1 a 12 vezes (anual ou mensal)
- **Validação automática**: Trigger verifica limites ao inserir/atualizar funcionários

### Notificações

- **Limite excedido**: Criada automaticamente via trigger
- **Renovação próxima**: Job mensal (função `notificar_renovacoes_proximas()`)
- **Prioridades**: baixa, normal, alta, crítica

---

## Próximos Passos (Débitos Técnicos)

### Curto Prazo

1. Implementar job cron para renovações e limpeza de MFA
2. Integrar rate limiting no middleware principal
3. Criar endpoint de health check (`/api/health`)
4. Adicionar testes e2e (Cypress) para fluxos de planos

### Médio Prazo

1. Migrar rate limiting para Redis (ambientes distribuídos)
2. Implementar sistema de pagamentos (Stripe/PagSeguro)
3. Dashboard de métricas financeiras
4. Exportação de relatórios (PDF/Excel)

### Longo Prazo

1. Notificações push (WebSockets/Server-Sent Events)
2. Integração com contabilidade externa
3. Sistema de upgrade/downgrade automático
4. BI e analytics avançados

---

## Comandos para Testar

```bash
# Executar schema de planos
psql -U postgres -d nr-bps_db -f database/planos-schema.sql

# Executar testes unitários
pnpm test __tests__/security/session-mfa-security.test.ts
pnpm test __tests__/database/planos-triggers.test.ts
pnpm test __tests__/components/planos-components.test.tsx

# Executar todos os testes
pnpm test:all

# Iniciar servidor de desenvolvimento
pnpm dev
```

---

## Checklist de Implementação

- [x] Fase 1: Rotação de chaves de sessão
- [x] Fase 1: Sistema de MFA
- [x] Fase 1: Middleware de validação MFA
- [x] Fase 1: Testes de segurança
- [x] Fase 2: Schema de banco de dados
- [x] Fase 2: Triggers e views
- [x] Fase 2: Helpers seguros no db.ts
- [x] Fase 2: Testes de banco
- [x] Fase 3: Zustand store
- [x] Fase 3: Componentes de UI
- [x] Fase 3: Sincronização PWA
- [x] Fase 3: Testes de frontend
- [x] Fase 4: Estrutura de rate limiting
- [x] Fase 4: Schemas de validação
- [x] Fase 5: Sistema de health checks
- [x] APIs de planos e notificações
- [ ] Integração completa com sidebar (manual)
- [ ] Testes e2e (Cypress)
- [ ] Deploy e validação em produção
