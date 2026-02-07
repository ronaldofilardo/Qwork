# Migração 500: Refatoração contratante_id → entidade_id/clinica_id

## Data: 2026-02-06

## Resumo Executivo

Esta migração remove todas as referências a `contratante_id` no código TypeScript, substituindo-as por `entidade_id` ou `clinica_id` conforme a arquitetura segregada.

## Estratégia de Migração

### 1. Mapeamento de Contextos

#### Apenas ENTIDADE (usar `entidade_id`):

- `contratos` - contratos são sempre de entidades
- `contratos_planos` - planos contratados por entidades
- `contratacao_personalizada` - contratações personalizadas de entidades
- `entidades_senhas` - senhas de gestores de entidades (já renomeado)
- `tokens_retomada_pagamento` - tokens de pagamento de entidades
- `funcionarios` (quando é funcionário direto de entidade, sem empresa_id)

#### Apenas CLÍNICA (manter `clinica_id`):

- `empresas_clientes` - empresas sempre pertencem a clínicas
- Já está correto, não usa contratante_id

#### AMBOS - ENTIDADE **OU** CLÍNICA (adicionar ambos, XOR):

- `lotes_avaliacao` - lotes podem ser de entidades ou de clínicas
- `pagamentos` - pagamentos podem ser de entidades ou clínicas
- `recibos` - recibos podem ser de entidades ou clínicas
- `notificacoes_admin` - notificações podem ser para entidades ou clínicas
- `audit_logs` - logs podem auditar entidades ou clínicas
- `funcionarios` - funcionários podem ser de entidades (entidade_id) ou de empresas (empresa_id+clinica_id)

### 2. Alterações em Tipos TypeScript

#### lib/types/contratacao.ts

```typescript
// ANTES:
export interface Contrato {
  id: number;
  contratante_id: number;
  plano_id: number;
  // ...
}

// DEPOIS:
export interface Contrato {
  id: number;
  entidade_id: number; // ← ALTERADO
  plano_id: number;
  // ...
}
```

```typescript
// ANTES:
export interface Pagamento {
  id: number;
  entidade_id: number;
  contrato_id?: number;
  // ...
}

// DEPOIS:
export interface Pagamento {
  id: number;
  entidade_id?: number; // ← ALTERADO: nullable
  clinica_id?: number; // ← NOVO
  contrato_id?: number;
  // ...
}
```

```typescript
// ANTES:
export interface AprovarContratanteDTO {
  contratante_id: number;
  admin_cpf: string;
  verificar_pagamento?: boolean;
}

// DEPOIS:
export interface AprovarEntidadeDTO {
  // ← RENOMEADO
  entidade_id: number; // ← ALTERADO
  admin_cpf: string;
  verificar_pagamento?: boolean;
}
```

### 3. Alterações em API Routes

#### Padrão de Substituição nas APIs:

##### Para Endpoints que servem APENAS ENTIDADES:

```typescript
// ANTES:
const contratanteId = session.contratante_id;
const query = `SELECT * FROM contratos WHERE contratante_id = $1`;

// DEPOIS:
const entidadeId = session.entidade_id;
const query = `SELECT * FROM contratos WHERE entidade_id = $1`;
```

##### Para Endpoints que servem AMBOS (Entidade OU Clínica):

```typescript
// ANTES:
const query = `
  SELECT * FROM lotes_avaliacao 
  WHERE contratante_id = $1
`;

// DEPOIS:
const query = `
  SELECT * FROM lotes_avaliacao 
  WHERE entidade_id = $1 OR clinica_id = $1
`;

// OU, se souber o tipo:
const query =
  session.tipo_usuario === 'gestor'
    ? `SELECT * FROM lotes_avaliacao WHERE entidade_id = $1`
    : `SELECT * FROM lotes_avaliacao WHERE clinica_id = $1`;
```

### 4. Alterações em Sessões

#### lib/session.ts ou lib/auth.ts

```typescript
// ANTES:
export interface SessionData {
  cpf: string;
  perfil: string;
  contratante_id?: number;
  clinica_id?: number;
}

// DEPOIS:
export interface SessionData {
  cpf: string;
  perfil: string;
  entidade_id?: number; // ← ALTERADO de contratante_id
  clinica_id?: number;
}
```

### 5. Lista de Arquivos a Atualizar

#### ALTA PRIORIDADE (Produção):

- [ ] `lib/types/contratacao.ts`
- [ ] `lib/types/database.ts`
- [ ] `lib/session.ts`
- [ ] `lib/auth.ts`
- [ ] `app/api/proposta/**/*.ts`
- [ ] `app/api/pagamento/**/*.ts`
- [ ] `app/api/recibo/**/*.ts`
- [ ] `app/api/public/contratante/*.ts` (renomear para /entidade)
- [ ] `app/api/rh/**/*.ts`
- [ ] `lib/db-security.ts`
- [ ] `lib/cadastroApi.ts`
- [ ] `lib/contratos/*.ts`

#### MÉDIA PRIORIDADE (Utilitários):

- [ ] `cypress.config.ts`
- [ ] `cypress/support/commands.ts`
- [ ] Arquivos em `backup_migration_20260205_134606/` (apenas documentar)

#### BAIXA PRIORIDADE (Testes):

- [ ] `__tests__/**/*.ts`

### 6. Validações Pós-Migração

1. **Build TypeScript**: `npm run build` ou `tsc --noEmit`
2. **Testes Unitários**: `npm run test:unit`
3. **Testes de Integração**: `npm run test:integration`
4. **Testes E2E**: `npm run test:e2e`

### 7. Checklist de Segurança

- [ ] Todas as queries SQL foram atualizadas
- [ ] RLS policies foram atualizadas (verificar no SQL)
- [ ] Session management usa entidade_id corretamente
- [ ] Authorization checks usam entidade_id ou clinica_id apropriadamente
- [ ] Audit logs registram entidade_id/clinica_id corretamente

### 8. Notas Importantes

1. **Não confundir**: `empresa` (cliente de clínica) ≠ `entidade` (empresa privada independente)
2. **XOR Enforcement**: Garantir que registros tenham APENAS `entidade_id` OU `clinica_id`, nunca ambos
3. **Backward Compatibility**: Nenhuma - banco está vazio, mudança limpa
4. **Views SQL**: Atualizar views que referenciam contratante_id
5. **Functions SQL**: Atualizar stored procedures e triggers

## Execução

Ordem de execução:

1. ✅ Migração SQL (500_segregar_fks_entidades_clinicas.sql)
2. 🔄 Atualizar tipos TypeScript
3. 🔄 Atualizar APIs principais
4. 🔄 Atualizar utilities e helpers
5. 🔄 Atualizar testes
6. 🔄 Validar build
7. 🔄 Executar suite de testes

## Rollback

Se necessário, reverter por:

1. Git revert dos commits
2. Executar SQL de rollback (se banco tiver dados)
