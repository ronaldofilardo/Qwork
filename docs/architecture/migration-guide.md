# Guia de Migração para Nova Arquitetura

**Data**: 13 de janeiro de 2026  
**Versão**: 1.0

---

## 🎯 Objetivo

Este guia ajuda desenvolvedores a migrar código existente para a nova arquitetura modular do QWork.

---

## 📦 Imports Atualizados

### Database

**Antes**:

```typescript
import { query, getSession } from '@/lib/db';
```

**Depois**:

```typescript
import { query } from '@/lib/infrastructure/database';
import { getSession } from '@/lib/session'; // Inalterado
```

**Compatibilidade**: Os imports antigos continuam funcionando por re-exports, mas estão deprecados.

---

### Configurações

**Antes**:

```typescript
const roles = ['admin', 'rh', 'funcionario'];
const PUBLIC_ROUTES = ['/login', '/api/planos'];
```

**Depois**:

```typescript
import { ROLES } from '@/lib/config/roles';
import { PUBLIC_ROUTES } from '@/lib/config/routes';
import { AVALIACAO_STATUS } from '@/lib/config/status';
```

---

### Middleware

**Antes**: Middleware monolítico em `middleware.ts`

**Depois**: Middlewares modulares

```typescript
import { authMiddleware } from '@/lib/interfaces/middleware/auth';
import { rbacMiddleware } from '@/lib/interfaces/middleware/rbac';
```

---

## 🛠️ Como Criar uma Nova Rota API

### Padrão Antigo (Não Usar)

```typescript
// ❌ Evitar
export async function GET(request: NextRequest) {
  const session = getSession();
  if (!session || session.perfil !== 'admin') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  const body = await request.json();
  // Validação manual...

  const result = await query('SELECT * FROM ...');
  return NextResponse.json(result.rows);
}
```

### Padrão Novo (Usar)

```typescript
// ✅ Recomendado
import {
  handleRequest,
  requireSession,
} from '@/lib/application/handlers/api-handler';
import { query } from '@/lib/infrastructure/database';
import { ROLES } from '@/lib/config/roles';
import { z } from 'zod';

// 1. Definir schema de validação
const InputSchema = z.object({
  nome: z.string().min(3).max(100),
  status: z.enum(['ativo', 'inativo']).optional(),
});

// 2. Criar handler
export const GET = handleRequest({
  allowedRoles: [ROLES.ADMIN],
  validate: InputSchema,

  execute: async (input, context) => {
    requireSession(context);

    const result = await query('SELECT * FROM tabela WHERE nome = $1', [
      input.nome,
    ]);

    return {
      data: result.rows,
      total: result.rowCount,
    };
  },
});
```

**Benefícios**:

- Validação automática com Zod
- Autorização declarativa
- Tratamento de erros centralizado
- Código 60% menor

---

## 🗃️ Como Usar Database Refatorado

### Queries Simples

```typescript
import { query, queryOne, queryScalar } from '@/lib/infrastructure/database';

// Múltiplas linhas
const users = await query('SELECT * FROM funcionarios WHERE ativo = $1', [
  true,
]);

// Uma linha
const user = await queryOne('SELECT * FROM funcionarios WHERE cpf = $1', [cpf]);

// Um valor
const count = await queryScalar('SELECT COUNT(*) FROM funcionarios');
```

### Helpers de CRUD

```typescript
import { insert, update, deleteRow } from '@/lib/infrastructure/database';

// Insert
const newUser = await insert('funcionarios', {
  cpf: '12345678900',
  nome: 'João Silva',
  ativo: true,
});

// Update
const updated = await update(
  'funcionarios',
  { nome: 'João Silva Atualizado' },
  { column: 'cpf', value: '12345678900' }
);

// Delete
await deleteRow('funcionarios', { column: 'id', value: 123 });
```

### Transações

```typescript
import { transaction } from '@/lib/infrastructure/database';

await transaction(async (client) => {
  await client.query('INSERT INTO ...', [...]);
  await client.query('UPDATE ...', [...]);
  // Se erro ocorrer, rollback automático
});
```

---

## 🧩 Como Migrar Componentes Grandes

### Estratégia de Decomposição

**Antes**: Componente monolítico (1.892 linhas)

```typescript
// ❌ components/modals/ModalCadastroContratante.tsx
export function ModalCadastroContratante() {
  // 200 linhas de estado
  // 500 linhas de lógica
  // 1000 linhas de JSX
}
```

**Depois**: Componente modular

```typescript
// ✅ components/modals/ModalCadastroContratante/index.tsx
export function ModalCadastroContratante() {
  const form = useCadastroForm(); // Hook customizado

  return (
    <Modal>
      <CadastroHeader />
      <CadastroFormulario form={form} />
      <CadastroAnexos />
      <CadastroActions onSubmit={form.submit} />
    </Modal>
  );
}

// components/modals/ModalCadastroContratante/useCadastroForm.ts
export function useCadastroForm() {
  // Lógica isolada e testável
}

// components/modals/ModalCadastroContratante/CadastroFormulario.tsx
export function CadastroFormulario({ form }) {
  // Apenas apresentação
}
```

---

## 📝 Checklist de Migração

Ao migrar um arquivo, siga:

- [ ] Dividir em módulos < 400 linhas
- [ ] Extrair lógica de negócio para use-cases (domain)
- [ ] Usar handleRequest para rotas API
- [ ] Importar constantes de `lib/config/`
- [ ] Adicionar testes unitários
- [ ] Atualizar imports em arquivos dependentes
- [ ] Marcar código antigo como deprecado
- [ ] Documentar mudanças

---

## 🔍 Exemplos Práticos

### Exemplo 1: Migrar Rota Admin

**Arquivo**: `app/api/admin/usuarios/route.ts`

1. Criar schema Zod
2. Extrair lógica para função pura
3. Usar handleRequest
4. Testar isoladamente

**Ver**: `lib/application/handlers/example-route.ts`

### Exemplo 2: Migrar Componente Grande

**Arquivo**: `components/admin/CobrancaContent.tsx` (643 linhas)

1. Identificar responsabilidades (filtros, tabela, ações)
2. Criar subcomponentes
3. Extrair hooks de estado
4. Testar componentes isoladamente

---

## 🚨 Pitfalls Comuns

### 1. Imports Circulares

**Problema**: `A imports B, B imports A`
**Solução**: Usar interfaces (ports) ou inversão de dependências

### 2. Estado Global Excessivo

**Problema**: Estado compartilhado entre muitos componentes
**Solução**: Context API + hooks ou React Query

### 3. Lógica em Componentes

**Problema**: Business logic misturada com UI
**Solução**: Extrair para hooks ou use-cases

---

## 📞 Suporte

Dúvidas? Consulte:

- [Plano de Refatoração](./refactor-plan.md)
- [Convenções do Projeto](../policies/CONVENCOES.md)
- [Guia de Testes](../GUIA-BOAS-PRATICAS-TESTES.md)
