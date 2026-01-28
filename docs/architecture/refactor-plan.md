# Plano de Refatoração - QWork

**Data**: 13 de janeiro de 2026  
**Status**: Em Progresso  
**Objetivo**: Reduzir complexidade, melhorar manutenibilidade e testabilidade

---

## 🎯 Princípios Orientadores

1. **Single Responsibility Principle (SRP)** – Cada módulo/função com uma única razão para mudar
2. **Explicit over Implicit** – Evitar lógica escondida ou "mágica"
3. **Testabilidade** – Funções puras, baixo acoplamento, alta coesão
4. **Consistência** – Padrões claros de nomenclatura e estrutura
5. **Limite de tamanho** – Arquivos < 400-500 linhas como consequência natural

---

## 📁 Nova Estrutura de Pastas

```
lib/
├── domain/              # Regras de negócio puras (sem frameworks)
│   ├── entities/        # Entidades de domínio
│   ├── use-cases/       # Casos de uso (lógica de negócio)
│   └── ports/           # Interfaces (contratos)
│
├── infrastructure/      # Implementações concretas
│   ├── database/        # Conexão, queries, transações
│   └── pdf/            # Geração de PDFs
│       ├── templates/   # Templates HTML
│       └── generators/  # Geradores de PDF
│
├── application/         # Orquestração
│   └── handlers/        # Handlers de API (handleRequest)
│
├── interfaces/          # Adaptadores externos
│   └── middleware/      # Middlewares (auth, rbac, audit)
│
└── config/             # Configurações e constantes
    ├── roles.ts        # Definições de roles
    ├── routes.ts       # Rotas do sistema
    ├── status.ts       # Enums de status
    └── env.ts          # Variáveis de ambiente
```

---

## 🔧 Componentes Refatorados

### 1. Database (`lib/infrastructure/database/`)

**Antes**: `lib/db.ts` (1.554 linhas)  
**Depois**: Dividido em módulos coesos

- **`connection.ts`**: Gerenciamento de conexões (Neon + PostgreSQL local)
- **`queries.ts`**: Funções de query (query, queryOne, insert, update, etc.)
- **`transactions.ts`**: Suporte a transações
- **`index.ts`**: Re-exporta tudo mantendo compatibilidade

**Benefícios**:

- Separação de responsabilidades
- Mais fácil de testar unitariamente
- Melhor legibilidade

### 2. API Handler (`lib/application/handlers/api-handler.ts`)

**Novo padrão para rotas API**:

```typescript
export const GET = handleRequest({
  allowedRoles: [ROLES.ADMIN],
  validate: GetContratantesSchema, // Zod
  execute: async (input, context) => {
    requireSession(context);
    return getContratantesPendentes(input);
  },
});
```

**Benefícios**:

- Validação centralizada (Zod)
- Autorização declarativa
- Tratamento de erros consistente
- Código mais limpo e testável

### 3. Middleware (`lib/interfaces/middleware/`)

**Antes**: `middleware.ts` (358 linhas com múltiplas responsabilidades)  
**Depois**: Dividido em módulos

- **`auth.ts`**: Verificação de sessão
- **`rbac.ts`**: Controle de acesso por role
- **`audit.ts`**: Logging de segurança
- **`index.ts`**: Orquestra middlewares em cadeia

**Benefícios**:

- Cada middleware com uma responsabilidade
- Fácil adicionar/remover middlewares
- Testável isoladamente

### 4. Configurações (`lib/config/`)

**Novo**: Centralização de constantes e enums

- **`roles.ts`**: Definições de perfis e hierarquia
- **`routes.ts`**: Rotas do sistema
- **`status.ts`**: Enums de status (avaliação, lote, laudo)
- **`env.ts`**: Variáveis de ambiente

**Benefícios**:

- Elimina strings mágicas
- Type-safe
- Reutilizável

---

## ✅ Checklist de Implementação

### Sprint 1: Fundação ✅

- [x] Criar estrutura de pastas
- [x] Criar módulos de configuração (roles, routes, status, env)
- [x] Decompor `lib/db.ts` → `infrastructure/database/*`
- [x] Criar `handleRequest` pattern
- [x] Fragmentar middlewares
- [x] Documentar padrões

### Sprint 2: Templates e PDF (Próximo)

- [ ] Mover `lib/templates/laudo-html.ts` → `infrastructure/pdf/templates/`
- [ ] Mover `lib/templates/recibo-template.ts` → `infrastructure/pdf/templates/`
- [ ] Extrair `lib/receipt-generator.ts` → `infrastructure/pdf/generators/`
- [ ] Criar testes unitários para geradores

### Sprint 3: Domain Logic

- [ ] Refatorar `lib/laudo-auto-refactored.ts` → `domain/use-cases/emitirLaudo.ts`
- [ ] Extrair entidades de domínio
- [ ] Criar ports/interfaces para repositórios

### Sprint 4: Rotas API

- [ ] Refatorar `app/api/admin/novos-cadastros/route.ts` (rota-piloto)
- [ ] Aplicar `handleRequest` em mais 5 rotas críticas
- [ ] Documentar padrão de rotas

### Sprint 5: Componentes UI

- [ ] Decompor `components/modals/ModalCadastroContratante.tsx`
- [ ] Decompor `components/admin/NovoscadastrosContent.tsx`
- [ ] Extrair hooks customizados

### Sprint 6: Qualidade e CI

- [ ] Adicionar ESLint rules (`max-lines`, `complexity`)
- [ ] Configurar lint-staged + Husky
- [ ] Script de detecção de arquivos grandes
- [ ] Executar regressão completa

---

## 🔍 Métricas de Sucesso

| Métrica                       | Antes      | Meta       |
| ----------------------------- | ---------- | ---------- |
| Arquivos > 500 linhas         | 48         | < 10       |
| Complexidade média            | Alta       | Baixa      |
| Cobertura de testes unitários | ~60%       | > 80%      |
| Tempo de onboarding           | ~2 semanas | < 1 semana |

---

## 📋 Regras de Migração

1. **PRs pequenos**: Máximo 500 linhas changed
2. **Testes obrigatórios**: Todos os testes devem passar
3. **Compatibilidade**: Manter imports antigos funcionando (com deprecation)
4. **Documentação**: Atualizar docs a cada mudança
5. **Code review**: Mínimo 1 aprovação antes de merge

---

## 🚨 Riscos e Mitigação

| Risco             | Probabilidade | Impacto | Mitigação                       |
| ----------------- | ------------- | ------- | ------------------------------- |
| Regressões        | Média         | Alto    | Testes automatizados em cada PR |
| Quebra de imports | Alta          | Médio   | Re-exports de compatibilidade   |
| Overhead inicial  | Alta          | Baixo   | Ganhos de longo prazo compensam |

---

## 📚 Referências

- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [Políticas do Projeto](../policies/CONVENCOES.md)
- [Guia de Testes](../GUIA-BOAS-PRATICAS-TESTES.md)

---

**Próximas ações**:

1. Validar Sprint 1 (completa)
2. Iniciar Sprint 2 (templates PDF)
3. Aplicar handleRequest em rotas piloto
