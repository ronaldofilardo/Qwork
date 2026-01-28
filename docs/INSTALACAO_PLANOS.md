# Guia de Instalação e Configuração - Sistema de Planos

## Pré-requisitos

- Node.js 18+ e pnpm instalados
- PostgreSQL 17+ instalado e rodando
- Acesso ao banco de dados (usuário com permissões DDL/DML)

## Passo 1: Instalar Dependências

```bash
# Instalar zod para validação (se ainda não instalado)
pnpm add zod

# Verificar outras dependências
pnpm install
```

## Passo 2: Configurar Variáveis de Ambiente

Adicionar ao `.env.local`:

```env
# Existentes (manter)
LOCAL_DATABASE_URL=postgresql://postgres:123456@localhost:5432/nr-bps_db
TEST_DATABASE_URL=postgresql://postgres:123456@localhost:5432/nr-bps_db_test
DATABASE_URL=<URL_NEON_PRODUCAO>
SESSION_SECRET=<sua_chave_secreta>
NODE_ENV=development

# Novas (opcional para Fase 4/5)
AUTHORIZED_ADMIN_IPS=127.0.0.1,::1
```

## Passo 3: Executar Schema de Planos

### Ambiente de Desenvolvimento

```bash
# Conectar ao banco de desenvolvimento
psql -U postgres -d nr-bps_db

# Executar schema
\i database/planos-schema.sql

# Ou via linha de comando
psql -U postgres -d nr-bps_db -f database/planos-schema.sql
```

### Ambiente de Teste

```bash
# Executar no banco de testes
psql -U postgres -d nr-bps_db_test -f database/planos-schema.sql
```

### Verificar Instalação

```sql
-- Verificar tabelas criadas
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%plano%';

-- Deve retornar: planos, contratos_planos, historico_contratos_planos, auditoria_planos

-- Verificar planos padrão
SELECT * FROM planos;
-- Deve retornar: Básico e Premium

-- Verificar triggers
SELECT tgname FROM pg_trigger WHERE tgname LIKE '%plano%';
```

## Passo 4: Executar Testes

```bash
# Testes de segurança (Fase 1)
pnpm test __tests__/security/session-mfa-security.test.ts

# Testes de banco (Fase 2)
pnpm test __tests__/database/planos-triggers.test.ts

# Testes de frontend (Fase 3)
pnpm test __tests__/components/planos-components.test.tsx

# Todos os testes
pnpm test:all
```

## Passo 5: Iniciar Servidor de Desenvolvimento

```bash
pnpm dev
```

Acessar: http://localhost:3000

## Passo 6: Integração com Sidebar (Manual)

### 6.1 Localizar Componente de Navegação Admin

Arquivo provável: `app/admin/layout.tsx` ou `components/admin/Navigation.tsx`

### 6.2 Adicionar Sub-abas no Financeiro

Exemplo de estrutura:

```tsx
// No sidebar do admin
{
  label: 'Financeiro',
  icon: <DollarIcon />,
  subitems: [
    { label: 'Dashboard', href: '/admin/financeiro' },
    { label: 'Planos', href: '/admin/financeiro/planos' }, // NOVO
    { label: 'Notificações', href: '/admin/financeiro/notificacoes' }, // NOVO
  ]
}
```

### 6.3 Criar Páginas Admin

#### `/app/admin/financeiro/planos/page.tsx`

```tsx
import PlanosManager from '@/components/admin/PlanosManager';

export default function PlanosPage() {
  return (
    <div className="container mx-auto p-6">
      <PlanosManager />
    </div>
  );
}
```

#### `/app/admin/financeiro/notificacoes/page.tsx`

```tsx
import NotificacoesFinanceiras from '@/components/admin/NotificacoesFinanceiras';

export default function NotificacoesPage() {
  return (
    <div className="container mx-auto p-6">
      <NotificacoesFinanceiras />
    </div>
  );
}
```

## Passo 7: Testar Fluxo Completo

### 7.1 Login como Admin

```
URL: http://localhost:3000/login
Credenciais: Admin do sistema
```

### 7.2 Verificar MFA (se implementado)

- Sistema deve solicitar código MFA para acessar `/admin/financeiro`
- Código será gerado e armazenado em `mfa_codes`
- Expiração: 10 minutos

### 7.3 Acessar Planos

```
URL: http://localhost:3000/admin/financeiro/planos
```

Verificar:

- Lista de planos (Básico, Premium)
- Botão "Novo Plano Personalizado"
- Filtros e badges de status

### 7.4 Criar Plano Personalizado

1. Clicar em "Novo Plano Personalizado"
2. Preencher formulário:
   - Nome
   - Valor por funcionário
   - Descrição (opcional)
3. Salvar
4. Verificar auditoria:
   ```sql
   SELECT * FROM auditoria_planos ORDER BY created_at DESC LIMIT 5;
   ```

### 7.5 Acessar Notificações

```
URL: http://localhost:3000/admin/financeiro/notificacoes
```

Verificar:

- Contador de não lidas
- Filtros por tipo/prioridade
- Botão "Marcar como lida"

## Passo 8: Monitoramento (Fase 5)

### 8.1 Criar Endpoint de Health Check

```typescript
// app/api/health/route.ts
import { performHealthCheck } from '@/lib/health-check';

export async function GET() {
  const health = await performHealthCheck();
  return Response.json(health, {
    status: health.status === 'healthy' ? 200 : 503,
  });
}
```

### 8.2 Testar Health Check

```bash
curl http://localhost:3000/api/health
```

Resposta esperada:

```json
{
  "status": "healthy",
  "timestamp": "2025-12-20T...",
  "checks": {
    "database": { "status": "ok", "message": "Database conectado" },
    "session": { "status": "ok", "message": "Sistema de sessão operacional" },
    "mfa": { "status": "ok", "message": "Sistema MFA operacional" },
    "planos": { "status": "ok", "message": "X contratos ativos" }
  }
}
```

## Troubleshooting

### Erro: "Tabela planos não existe"

```bash
# Verificar se schema foi executado
psql -U postgres -d nr-bps_db -c "\dt planos"

# Se não existir, executar schema novamente
psql -U postgres -d nr-bps_db -f database/planos-schema.sql
```

### Erro: "MFA_REQUIRED"

1. Verificar se usuário é admin
2. Verificar se MFA foi implementado corretamente
3. Temporariamente, comentar validação MFA em `middleware.ts` para debug

### Erro: "Query failed - multi-tenant"

- Garantir que queries incluem `clinica_id` ou `contratante_id`
- Usar helper `queryMultiTenant()` em vez de `query()` direta

### Testes Falhando

```bash
# Limpar cache de testes
pnpm test --clearCache

# Executar testes isolados
pnpm test --testPathPattern=session-mfa

# Verificar variável de ambiente de teste
echo $TEST_DATABASE_URL
```

## Próximos Passos

1. ✅ Schema instalado
2. ✅ Testes passando
3. ✅ APIs funcionando
4. ⏳ Integrar com sidebar (manual)
5. ⏳ Criar fluxo de cadastro de empresa com planos
6. ⏳ Implementar job cron para renovações
7. ⏳ Adicionar testes e2e (Cypress)

## Contato e Suporte

- Documentação completa: `docs/IMPLEMENTACAO_PLANOS.md`
- Convenções: `CONVENCOES.md`
- Issues: Issues do repositório (ou sistema de issues usado)
