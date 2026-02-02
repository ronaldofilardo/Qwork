# Sistema de Planos Financeiros - Qwork

## 📋 Visão Geral

Implementação completa do sistema de planos financeiros para o Qwork, incluindo:

- **Fase 1**: Correções de segurança (rotação de sessões + MFA)
- **Fase 2**: Banco de dados (planos, contratos, triggers, auditoria)
- **Fase 3**: Frontend (componentes, store Zustand, PWA offline)
- **Preparação Fases 4/5**: Rate limiting, validação, health checks

## 🚀 Início Rápido

```bash
# 1. Instalar dependências
pnpm install

# 2. Executar schema de banco
psql -U postgres -d nr-bps_db -f database/planos-schema.sql

# 3. Executar testes
pnpm test:all

# 4. Iniciar desenvolvimento
pnpm dev
```

Acesse: http://localhost:3000/admin/financeiro/planos

## 📁 Arquivos Criados/Modificados

### Segurança (Fase 1)

- ✅ `lib/session.ts` - Rotação de chaves
- ✅ `lib/mfa.ts` - Multi-factor authentication
- ✅ `middleware.ts` - Validação MFA
- ✅ `__tests__/security/session-mfa-security.test.ts`

### Banco de Dados (Fase 2)

- ✅ `database/planos-schema.sql` - Schema completo
- ✅ `lib/db.ts` - Helpers multi-tenant
- ✅ `__tests__/database/planos-triggers.test.ts`

### Frontend (Fase 3)

- ✅ `lib/stores/planosStore.ts` - Zustand store
- ✅ `components/admin/PlanosManager.tsx`
- ✅ `components/admin/NotificacoesFinanceiras.tsx`
- ✅ `components/PWAInitializer.tsx` - Sync offline
- ✅ `__tests__/components/planos-components.test.tsx`

### APIs

- ✅ `app/api/admin/financeiro/planos/route.ts`
- ✅ `app/api/admin/financeiro/notificacoes/route.ts`
- ✅ `app/api/admin/financeiro/notificacoes/[id]/route.ts`

### Infraestrutura (Fases 4/5)

- ✅ `lib/rate-limit.ts` - Rate limiting
- ✅ `lib/validation.ts` - Schemas Zod
- ✅ `lib/health-check.ts` - Monitoramento

### Documentação

- ✅ `docs/IMPLEMENTACAO_PLANOS.md` - Detalhes técnicos
- ✅ `docs/INSTALACAO_PLANOS.md` - Guia de instalação
- ✅ `docs/PLANOS_README.md` - Este arquivo

## 📊 Estrutura de Planos

### Tipos de Planos

| Tipo              | Valor                 | Limite           | Descrição  |
| ----------------- | --------------------- | ---------------- | ---------- |
| **Básico**        | R$ 1.224/ano          | 50 funcionários  | Fixo anual |
| **Premium**       | R$ 3.999,99/ano       | 200 funcionários | Fixo anual |
| **Personalizado** | Valor por funcionário | Customizado      | Negociado  |

### Regras de Negócio

- **Vigência**: 364 dias a partir da contratação
- **Bloqueio**: Valores fixos durante vigência (não podem ser alterados)
- **Parcelamento**: 1 a 12 vezes (anual ou mensal)
- **Validação automática**: Triggers verificam limites ao inserir/atualizar funcionários
- **Notificações**: Criadas automaticamente quando limite é excedido

## 🔒 Segurança Implementada

### Rotação de Sessões

- Token único por sessão (`crypto.randomBytes(32)`)
- Rotação automática a cada 2 horas
- Timestamp de última rotação

### MFA (Multi-Factor Authentication)

- Códigos de 6 dígitos
- Expiração: 10 minutos
- Requerido para rotas `/admin/financeiro`
- Invalidação automática após uso

### Isolamento Multi-Tenant

- Função `queryMultiTenant()` força filtros
- Previne cross-contaminação entre clínicas/entidades
- Validação em tempo de execução

## 🗄️ Banco de Dados

### Tabelas Principais

```sql
planos                      -- Catálogo de planos
contratos_planos            -- Associação entidade/plano
historico_contratos_planos  -- Snapshots auditoria
notificacoes_financeiras    -- Alertas financeiros
auditoria_planos            -- Log de alterações
mfa_codes                   -- Códigos MFA
```

### Triggers Implementados

- `bloquear_alteracao_contrato_vigente` - Previne mudanças durante vigência
- `validar_limite_funcionarios` - Valida limites e cria notificações
- `criar_snapshot_contrato` - Cria histórico automático

### Views Materializadas

- `view_funcionarios_por_contrato` - Agregação de funcionários ativos

## 🧪 Testes

```bash
# Testes unitários (Fase 1)
pnpm test __tests__/security/session-mfa-security.test.ts

# Testes de banco (Fase 2)
pnpm test __tests__/database/planos-triggers.test.ts

# Testes de frontend (Fase 3)
pnpm test __tests__/components/planos-components.test.tsx

# Todos os testes
pnpm test:all
```

### Cobertura

- ✅ Rotação de chaves de sessão
- ✅ Geração e validação de códigos MFA
- ✅ Triggers de banco de dados
- ✅ Isolamento multi-tenant
- ✅ Componentes React
- ✅ Zustand store
- ✅ Sincronização offline

## 📱 Interface do Usuário

### Aba "Planos"

- Lista planos (básico, premium, personalizado)
- Criar plano personalizado (admin)
- Badges de tipo e status
- Visualização de valores e limites

### Aba "Notificações"

- Lista notificações com ícones por tipo
- Contador de não lidas
- Marcar como lida
- Cores por prioridade (baixa/normal/alta/crítica)

## 🔄 Sincronização Offline (PWA)

- Cache local em `localStorage`
- Sincronização automática ao reconectar
- Prioriza dados críticos (planos e notificações)
- Integrado com `PWAInitializer`

## 📝 Próximos Passos (Manual)

### 1. Integrar com Sidebar

Adicionar no `app/admin/layout.tsx`:

```tsx
{
  label: 'Financeiro',
  subitems: [
    { label: 'Planos', href: '/admin/financeiro/planos' },
    { label: 'Notificações', href: '/admin/financeiro/notificacoes' },
  ]
}
```

### 2. Criar Páginas

**`app/admin/financeiro/planos/page.tsx`**:

```tsx
import PlanosManager from '@/components/admin/PlanosManager';
export default function PlanosPage() {
  return <PlanosManager />;
}
```

**`app/admin/financeiro/notificacoes/page.tsx`**:

```tsx
import NotificacoesFinanceiras from '@/components/admin/NotificacoesFinanceiras';
export default function NotificacoesPage() {
  return <NotificacoesFinanceiras />;
}
```

### 3. Implementar Job Cron

Para renovações e limpeza de MFA:

```typescript
// scripts/cron-planos.ts
import cron from 'node-cron';
import { query } from '@/lib/db';
import { cleanupExpiredMFACodes } from '@/lib/mfa';

// Diariamente às 3h
cron.schedule('0 3 * * *', async () => {
  await cleanupExpiredMFACodes();
  await query('SELECT notificar_renovacoes_proximas()');
});
```

### 4. Testes E2E (Cypress)

```typescript
// cypress/e2e/planos.cy.ts
describe('Sistema de Planos', () => {
  it('deve listar planos', () => {
    cy.visit('/admin/financeiro/planos');
    cy.contains('Plano Básico');
  });

  it('deve criar plano personalizado', () => {
    // ... testes de criação
  });
});
```

## 📚 Documentação Adicional

- [Implementação Detalhada](./IMPLEMENTACAO_PLANOS.md)
- [Guia de Instalação](./INSTALACAO_PLANOS.md)
- [Convenções do Projeto](../CONVENCOES.md)

## ❓ Troubleshooting

### Erro: "Tabela planos não existe"

```bash
psql -U postgres -d nr-bps_db -f database/planos-schema.sql
```

### Erro: "MFA_REQUIRED"

Verificar se usuário é admin e se MFA foi configurado corretamente.

### Erro: "Query failed - multi-tenant"

Usar `queryMultiTenant()` em vez de `query()` direta para queries com isolamento.

## 🎯 Status da Implementação

- [x] Fase 1: Segurança (sessões + MFA)
- [x] Fase 2: Banco de dados (schema + triggers)
- [x] Fase 3: Frontend (componentes + store)
- [x] Estrutura Fase 4: Rate limiting + validação
- [x] Estrutura Fase 5: Health checks
- [ ] Integração com sidebar (manual)
- [ ] Páginas admin (manual)
- [ ] Job cron para renovações (manual)
- [ ] Testes E2E (manual)

## 🤝 Contribuindo

1. Executar testes: `pnpm test:all`
2. Verificar tipos: `pnpm type-check`
3. Lint: `pnpm lint`
4. Seguir convenções em `CONVENCOES.md`

## 📄 Licença

Propriedade da equipe Qwork - Uso interno apenas.
