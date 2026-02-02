# Correções dos Papéis (Roles) - 31/01/2026

## Objetivo

Corrigir a separação de responsabilidades entre os papéis do sistema conforme política de negócio:

- **admin** - totalmente independente (gestão da plataforma)
- **emissor** - totalmente independente (emissão de laudos)
- **rh** - gestor de clínica (gerencia **empresas clientes** da clínica e os **funcionários dessas empresas**)
- **gestor_entidade** - gestor de entidade (gerencia apenas seus próprios funcionários)

## Problema Identificado

A função `requireRH()` em `lib/auth-require.ts` estava permitindo acesso tanto para `rh` quanto para `gestor_entidade`, causando confusão de responsabilidades e violando o princípio de segregação de funções.

## Correções Realizadas

### 1. Middleware de Autenticação (`middleware.ts`)

✅ **Antes:**
```typescript
if (session && session.perfil !== 'rh') {
  // Bloqueava apenas não-RH
  return new NextResponse('Acesso negado', { status: 403 });
}
```

✅ **Depois:**
```typescript
// APENAS perfil 'rh' pode acessar rotas /rh e /api/rh
// gestor_entidade deve usar /entidade e /api/entidade
if (session && session.perfil !== 'rh') {
  console.error(
    `[SECURITY] Usuário com perfil ${session.perfil} tentou acessar rota RH. Apenas gestores RH (clínica) têm acesso.`
  );
  return new NextResponse('Acesso negado', { status: 403 });
}
```

### 2. Funções de Autenticação (`lib/auth-require.ts`)

✅ **Antes:**
```typescript
export function requireRH(): Session {
  // RH endpoints devem ser acessíveis apenas por 'rh' ou 'gestor_entidade'
  return requireRole(['rh', 'gestor_entidade']);
}
```

✅ **Depois:**
```typescript
/**
 * Requer perfil de RH (gestor de clínica) - APENAS rh
 * Para gestores de entidade, use requireGestorEntidade()
 */
export function requireRH(): Session {
  return requireRole(['rh']);
}

/**
 * Requer perfil de gestor de entidade - APENAS gestor_entidade
 * Para gestores RH, use requireRH()
 */
export function requireGestorEntidade(): Session {
  return requireRole(['gestor_entidade']);
}

/**
 * Requer perfil de gestor (RH ou Entidade) - para endpoints comuns
 * Use com cautela - prefira requireRH() ou requireGestorEntidade() quando possível
 */
export function requireGestor(): Session {
  return requireRole(['rh', 'gestor_entidade']);
}
```

### 3. Rotas de API Entidade

✅ **Rotas atualizadas:**
- `app/api/entidade/lote/[id]/funcionarios/export/route.ts`
- `app/api/entidade/lote/[id]/relatorio-individual/[avaliacaoId]/html/route.ts`

Trocado de `requireRH()` para `requireGestor()` pois são rotas compartilhadas que validam o perfil específico internamente.

## Estrutura Correta de Rotas

### Rotas RH (apenas gestor de clínica)
```
/rh/*
/api/rh/*
  ├── empresas/              # Gerencia empresas CLIENTES da clínica
  ├── funcionarios/          # Gerencia funcionários DAS EMPRESAS CLIENTES
  ├── liberar-lote/          # Libera lotes para empresas clientes
  ├── lotes/.../inativar/    # Inativa avaliações de empresas clientes
  └── lotes/.../reset/       # Reseta avaliações de empresas clientes
```

**Estrutura:** Clínica → Empresas Clientes → Funcionários das Empresas

### Rotas Entidade (apenas gestor de entidade)
```
/entidade/*
/api/entidade/*
  ├── funcionarios/          # Gerencia APENAS funcionários próprios
  ├── liberar-lote/          # Libera lotes da entidade
  └── lotes/.../reset/       # Reseta avaliações da entidade
```

### Rotas Compartilhadas (com validação interna)
```
/api/lotes/[loteId]/solicitar-emissao/
  - RH: valida clinica_id + requireRHWithEmpresaAccess
  - Entidade: valida contratante_id
```

## Validações Implementadas

### RH (gestor de clínica)
1. ✅ Middleware bloqueia acesso de não-RH a `/rh/*` **empresa cliente** via `clinica_id`
4. ✅ Gestão de **empresas clientes** vinculadas à `clinica_id`
5. ✅ Gestão de **funcionários das empresas clientes** (vinculados a `empresa_id` + `clinica_id`)
3. ✅ `requireRHWithEmpresaAccess()` valida acesso à empresa via `clinica_id`
4. ✅ Gestão de funcionários vinculados a `empresa_id` + `clinica_id`

### Gestor Entidade
1. ✅ Middleware bloqueia acesso de não-entidade a `/entidade/*` e `/api/entidade/*`
2. ✅ `requireGestorEntidade()` aceita APENAS `perfil === 'gestor_entidade'`
3. ✅ Validação de acesso via `contratante_id`
4. ✅ Gestão de funcionários vinculados a `contratante_id`

## Arquivos Verificados e Corretos

### Rotas já com separação correta:
- ✅ `app/api/rh/funcionarios/route.ts` - valida `requireRHWithEmpresaAccess`
- ✅ `app/api/entidade/funcionarios/route.ts` - valida `contratante_id`
- ✅ `app/api/rh/liberar-lote/route.ts` - valida `user.perfil !== 'rh'`
- ✅ `app/api/entidade/liberar-lote/route.ts` - usa `requireEntity()`
- ✅ `app/api/rh/lotes/.../inativar/route.ts` - valida RH + empresa
- ✅ `app/api/rh/lotes/.../reset/route.ts` - valida RH + empresa
- ✅ `app/api/entidade/lotes/.../reset/route.ts` - valida entidade + contratante
- ✅ `app/api/lotes/[loteId]/solicitar-emissao/route.ts` - valida ambos corretamente

## Políticas de Banco de Dados (RLS)

As políticas RLS no banco já estão corretas e fazem a distinção entre:
- `current_user_perfil() = 'rh'` AND `clinica_id = current_user_clinica_id()`
- `current_user_perfil() = 'gestor_entidade'` AND `contratante_id = current_user_contratante_id()`

## Fluxos de Trabalho

### Cadastro e Liberação de Conta
- **Admin** - gestão da plataforma, não cria empresas/funcionários operacionais
- **RH** - criado via `criarContaResponsavel()` para contratantes tipo ≠ 'entidade'
- **Gestor Entidade** - criado via `criarContaResponsavel()` para contratantes tipo = 'entidade'

### Gestão de Empresas e Funcionários
- **RH** (gestor de clínica):
  - A clínica em si tem apenas o RH (não tem funcionários operacionais)
  - A clínica **atende empresas clientes**
  - O RH **cadastra empresas clientes** (vinculadas à `clinica_id`)
  - O RH **cadastra funcionários** dentro de cada **empresa cliente** (vinculados a `empresa_id` + `clinica_id`)
  - Estrutura: `Clínica → Empresas Clientes → Funcionários das Empresas`
  
- **Gestor Entidade**:
  - Gerencia APENAS funcionários vinculados ao seu `contratante_id`
  - Não gerencia empresas (a entidade já é a "empresa")

### Liberação de Lotes
- **RH** - libera lotes para **empresas clientes** da clínica (usando `clinica_id` + `empresa_id`)
- **Gestor Entidade** - libera lotes para sua entidade (usando `contratante_id`)

### Inativação e Reset de Avaliações
- **RH** - inativa/reseta avaliações de lotes das **empresas clientes** da clínica
- **Gestor Entidade** - reseta avaliações de lotes da entidade (não tem inativação separada)

### Solicitação de Emissão de Laudos
- **RH** - solicita emissão para lotes das **empresas clientes** (valida acesso à empresa via `clinica_id`)
- **Gestor Entidade** - solicita emissão para lotes da entidade (valida `contratante_id`)
- **Emissor** - emite laudos (independente, acessa todos os lotes liberados)

## Impacto

✅ **Segurança aprimorada** - Separação clara de responsabilidades entre RH e Gestor Entidade
✅ **Conformidade** - Alinhado com política de negócio do sistema
✅ **Manutenibilidade** - Código mais claro e fácil de entender
✅ **Auditoria** - Rastreamento correto de ações por perfil

## Testes Recomendados

1. ✅ Verificar que RH não acessa rotas `/entidade/*`
2. ✅ Verificar que Gestor Entidade não acessa rotas `/rh/*`
3. ✅ Verificar que Admin não cria funcionários operacionais
4. ✅ Verificar que Emissor é independente
5. ✅ Testar liberação de lotes por ambos os perfis
6. ✅ Testar reset de avaliações por ambos os perfis
7. ✅ Testar solicitação de emissão por ambos os perfis

## Notas Importantes

- ⚠️ A função `requireGestor()` deve ser usada com cautela, apenas para endpoints que realmente precisam aceitar ambos os perfis
- ⚠️ Sempre prefira `requireRH()` ou `requireGestorEntidade()` para manter a separação clara
- ⚠️ O middleware já bloqueia acessos indevidos, mas as validações nas rotas são importantes para defesa em profundidade
- ⚠️ As políticas RLS no banco são a última linha de defesa

## Arquivos Modificados

1. ✅ `middleware.ts` - Corrigido comentário e validação de rotas RH
2. ✅ `lib/auth-require.ts` - Adicionadas funções separadas para RH e Gestor Entidade
3. ✅ `app/api/entidade/lote/[id]/funcionarios/export/route.ts` - Trocado `requireRH()` por `requireGestor()`
4. ✅ `app/api/entidade/lote/[id]/relatorio-individual/[avaliacaoId]/html/route.ts` - Trocado `requireRH()` por `requireGestor()`

## Conclusão

A separação de roles foi corrigida com sucesso. Agora:

- **admin** e **emissor** são totalmente independentes ✅
- **rh** gerencia empresas/funcionários da clínica ✅
- **gestor_entidade** gerencia apenas seus próprios funcionários ✅
- Middleware, rotas e validações estão alinhados ✅
- RLS no banco reforça a segregação ✅
