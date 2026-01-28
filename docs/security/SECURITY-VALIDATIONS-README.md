<!-- Moved from project root -->
# Validações Adicionais de Segurança - QWork

Este documento descreve as validações adicionais implementadas para prevenir inconsistências em RBAC (Role-Based Access Control) e RLS (Row-Level Security) no sistema QWork.

## 📋 Visão Geral das Validações

As validações foram implementadas em **4 camadas**:

### 1. 🗄️ **Validações no Banco de Dados** (`database/security-validations.sql`)

- **Triggers automáticos** que previnem inserções/atualizações inválidas
- **Constraints de integridade referencial** entre clínicas, empresas e funcionários
- **Auditoria automática** de mudanças críticas

### 2. 🔧 **Validações na Aplicação** (`lib/security-validation.ts`)

- **Validação de sessão** em tempo real
- **Verificação de acesso a recursos** antes de operações
- **Detecção de anomalias** de segurança

### 3. 🌐 **Middleware de Segurança** (`lib/security-middleware.ts`)

- **Validação automática** em cada requisição autenticada
- **Detecção de sessões inválidas** com destruição automática
- **Logging de incidentes** de segurança

### 4. 📊 **Verificações Periódicas** (`scripts/security-integrity-check.mjs`)

- **Auditoria completa** do sistema executada periodicamente
- **Relatórios de inconsistências** com severidade
- **Recomendações de correção**

## 🚀 Como Implementar

### Passo 1: Aplicar Validações no Banco

```bash
# Executar no banco de dados PostgreSQL
psql -d nr-bps_db -f database/security-validations.sql
```

### Passo 2: Integrar Middleware no Next.js

```typescript
// middleware.ts
import { securityValidationMiddleware } from "@/lib/security-middleware";

export function middleware(request) {
  // Executar validações de segurança primeiro
  const securityResponse = securityValidationMiddleware(request);
  if (securityResponse.status !== 200) {
    return securityResponse;
  }

  // Continuar com outros middlewares...
}
```

### Passo 3: Usar Validações em APIs

```typescript
// Em qualquer API route
import {
  validateResourceAccess,
  quickSessionValidation,
} from "@/lib/security-config";

export async function GET(request) {
  const session = await getSession();

  // Validação rápida de sessão
  if (!(await quickSessionValidation(session))) {
    return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
  }

  // Validação de acesso ao recurso
  const empresaId = parseInt(params.id);
  if (!(await validateResourceAccess(session, "empresa", empresaId))) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  // Continuar com lógica normal...
}
```

### Passo 4: Configurar Verificações Periódicas

```bash
# Adicionar ao crontab (Linux/Mac) ou Task Scheduler (Windows)
# Executar diariamente às 2:00 AM
0 2 * * * node scripts/security-integrity-check.mjs

# Ou via npm script no package.json
"scripts": {
  "security-check": "node scripts/security-integrity-check.mjs"
}
```

## 🔍 Validações Implementadas

### Validações de Banco de Dados

| Validação                                | Descrição                                                      | Severidade |
| ---------------------------------------- | -------------------------------------------------------------- | ---------- |
| `validate_user_clinica_integrity`        | Garante que usuários tenham clinica_id válido                  | Alta       |
| `validate_empresa_clinica_integrity`     | Impede mudança de clínica de empresas com funcionários         | Alta       |
| `validate_funcionario_empresa_integrity` | Garante que funcionários pertençam a empresas da mesma clínica | Crítica    |

### Validações de Aplicação

| Função                     | Descrição                                  | Quando Executar              |
| -------------------------- | ------------------------------------------ | ---------------------------- |
| `validateSessionIntegrity` | Verifica consistência entre sessão e banco | Todo acesso autenticado      |
| `validateResourceAccess`   | Valida permissões de acesso a recursos     | Antes de operações sensíveis |
| `detectAccessAnomalies`    | Detecta padrões suspeitos de acesso        | Login e operações críticas   |

### Verificações Periódicas

| Verificação               | Descrição                        | Frequência |
| ------------------------- | -------------------------------- | ---------- |
| Usuários sem clínica      | RH/Funcionários sem clinica_id   | Diária     |
| Referências inválidas     | clinica_id inexistente           | Diária     |
| Funcionários cross-clinic | Funcionários em empresas erradas | Diária     |
| Múltiplos RH              | Clínicas com >1 RH ativo         | Diária     |
| Empresas vazias           | Empresas sem funcionários        | Semanal    |

## ⚠️ Respostas a Incidentes

### Por Severidade

- **Baixa**: Apenas log
- **Média**: Log + alerta por email
- **Alta**: Log + alerta + notificação ao admin
- **Crítica**: Log + alerta + notificação + bloqueio de acesso

### Ações Automáticas

- **Sessões inválidas**: Destruição automática + redirect para login
- **Acesso negado**: Log detalhado + possível bloqueio temporário
- **Dados corrompidos**: Alerta imediato + quarentena de usuário

## 📊 Monitoramento

### Métricas a Monitorar

- Número de sessões inválidas detectadas
- Tentativas de acesso a recursos fora da clínica
- Usuários com anomalias de associação
- Tempo de resposta das validações

### Logs de Segurança

Todos os incidentes são logados em:

- Console (desenvolvimento)
- Tabela `audit_security_incidents` (produção)
- Arquivos de log dedicados

## 🧪 Testes

### Testes Unitários

```bash
npm test -- security-validation.test.ts
```

### Testes de Integração

```bash
npm test -- security-middleware.test.ts
```

### Testes de Segurança

```bash
npm run security-check
```

## 🔧 Manutenção

### Atualização de Regras

1. Modificar funções em `security-validation.ts`
2. Atualizar triggers em `security-validations.sql`
3. Executar migração no banco
4. Testar thoroughly

### Backup de Segurança

- Fazer backup antes de aplicar mudanças
- Testar rollback procedures
- Manter versão anterior por 30 dias

## 📞 Suporte

Para questões sobre segurança:

- **Equipe de Segurança**: security@qwork.com.br
- **Administradores**: admin@qwork.com.br
- **Documentação Técnica**: Este arquivo + comentários no código
