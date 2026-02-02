# Sistema de Roles e RBAC - Qwork

**Data:** 22 de janeiro de 2026  
**Status:** Documentação oficial de roles e permissões

## Visão Geral

Este documento define claramente a separação de papéis no sistema Qwork, especialmente a distinção crítica entre **Gestores** (RH e Entidade) e **Funcionários**.

## Definições de Roles

### 1. Gestores (NÃO são funcionários)

#### Gestor RH (`perfil='rh'`)

- **Criação:** Via `criarContaResponsavel()` para contratantes tipo ≠ 'entidade'
- **Tabelas:** `funcionarios` (com perfil='rh') + `contratantes_funcionarios` (vínculo)
- **Autenticação:** `contratantes_senhas` com bcrypt
- **Permissões:**
  - ✅ Cadastrar empresas clientes
  - ✅ Cadastrar funcionários nas empresas
  - ✅ Criar e liberar lotes de avaliação
  - ✅ Baixar laudos, listagens, recibos
  - ✅ Gerenciar funcionários vinculados
  - ❌ Responder avaliações (não é avaliado)

#### Gestor Entidade (`perfil='gestor_entidade'`)

- **Criação:** Via `criarContaResponsavel()` para contratantes tipo = 'entidade'
- **Tabelas:** Apenas `contratantes_senhas` (SEM entrada em `funcionarios`)
- **Autenticação:** `contratantes_senhas` com bcrypt
- **Permissões:**
  - ✅ Cadastrar empresas clientes
  - ✅ Cadastrar funcionários nas empresas
  - ✅ Criar e liberar lotes de avaliação
  - ✅ Baixar laudos, listagens, recibos
  - ❌ Emitir laudos por padrão — gestores de entidade NÃO têm perfil `emissor`. Emissão só é permitida por usuários com `perfil = 'emissor'` (usuários independentes).
  - ❌ Responder avaliações (não é avaliado)

### 2. Funcionários

#### Funcionário Regular (`perfil='funcionario'`)

- **Criação:** Via cadastro RH/Entidade ou importação CSV
- **Tabelas:** `funcionarios` + vínculo em `contratantes_funcionarios`
- **Autenticação:** CPF + senha (se habilitado)
- **Permissões:**
  - ✅ Responder avaliações atribuídas
  - ✅ Visualizar próprios resultados (se permitido)
  - ❌ Cadastrar outros funcionários
  - ❌ Criar lotes
  - ❌ Baixar laudos

### 3. Roles Especiais

#### Emissor (`perfil='emissor'`)

- Usuário independente para emissão de laudos; **não** deve ser combinado com `gestor_entidade` ou `rh`.
- Permissões para emissão de laudos técnicos
- Sistema impede programaticamente que um CPF vinculado a um Gestor RH (`perfil='rh'`) ou a um Gestor Entidade (presente em `contratantes_senhas`) seja cadastrado como `emissor`.

#### Admin (`perfil='admin'`)

- Acesso total ao sistema
- Gerenciamento de clínicas e entidades

## Matriz de Permissões

| Ação                   | Funcionário | Gestor RH | Gestor Entidade | Emissor | Admin |
| ---------------------- | ----------- | --------- | --------------- | ------- | ----- |
| Responder avaliações   | ✅          | ❌        | ❌              | ❌      | ✅    |
| Cadastrar empresas     | ❌          | ✅        | ✅              | ❌      | ✅    |
| Cadastrar funcionários | ❌          | ✅        | ✅              | ❌      | ✅    |
| Criar lotes            | ❌          | ✅        | ✅              | ❌      | ✅    |
| Liberar lotes          | ❌          | ✅        | ✅              | ❌      | ✅    |
| Baixar laudos          | ❌          | ✅        | ✅              | ✅      | ✅    |
| Emitir laudos          | ❌          | ❌        | ⚠️              | ✅      | ✅    |
| Gerenciar clínicas     | ❌          | ❌        | ❌              | ❌      | ✅    |

⚠️ Gestor Entidade pode emitir se também tiver perfil `emissor`

## Implementação Atual

### Criação de Contas (lib/db.ts)

```typescript
// Função: criarContaResponsavel(contratanteData, responsavel)

// Para tipo !== 'entidade' (Gestores RH):
- Cria/atualiza registro em `funcionarios` com perfil='rh'
- Insere vínculo em `contratantes_funcionarios`
- Cria entrada em `contratantes_senhas` com bcrypt

// Para tipo === 'entidade' (Gestores Entidade):
- NÃO cria registro em `funcionarios`
- Apenas cria entrada em `contratantes_senhas` com bcrypt
```

### Tabelas Principais

#### `funcionarios`

- Armazena funcionários E gestores RH
- Campo `perfil` distingue: 'funcionario' | 'rh' | 'emissor' | 'admin'
- Gestores Entidade NÃO aparecem aqui

#### `contratantes`

- Armazena clínicas e entidades
- Campo `tipo`: 'clinica' | 'entidade'

#### `contratantes_senhas`

- Autenticação de gestores (RH e Entidade)
- Hash bcrypt (12 rounds)
- Senha padrão: últimos 6 dígitos CNPJ

#### `contratantes_funcionarios`

- Vínculo entre contratantes e funcionários/gestores RH
- Gestores Entidade NÃO têm vínculo aqui

## Checklist de Revisão

### 1. Database Layer (lib/db.ts)

- [ ] `criarContaResponsavel()`: Verificar bifurcação tipo='entidade'
- [ ] Queries de autenticação: Checar se usam tabelas corretas
- [ ] Queries de permissões: Verificar filtros por perfil

### 2. API Routes (app/api/)

- [ ] `app/api/auth/`: Autenticação distingue gestores de funcionários
- [ ] `app/api/rh/`: Apenas gestores RH acessam
- [ ] `app/api/entidade/`: Apenas gestores Entidade acessam
- [ ] `app/api/avaliacao/`: Apenas funcionários respondem
- [ ] `app/api/admin/`: Verificar controle de acesso

### 3. RLS Policies (database/migrations/)

- [ ] Políticas em `funcionarios`: Gestores Entidade não vazam
- [ ] Políticas em `contratantes_funcionarios`: Vínculos corretos
- [ ] Políticas em `avaliacoes`: Apenas funcionários acessam próprias
- [ ] Políticas em `lotes_avaliacao`: Apenas gestores gerenciam

### 4. Frontend Components

- [ ] `app/rh/`: UI apenas para gestores RH
- [ ] `app/entidade/`: UI apenas para gestores Entidade
- [ ] `app/avaliacao/`: UI apenas para funcionários
- [ ] Modais de criação: Não confundem gestores com funcionários

### 5. Tests

- [ ] `__tests__/security/rls-rbac.test.ts`: Cobertura de roles
- [ ] `__tests__/seguranca/`: Testes de isolamento
- [ ] `__tests__/system/`: Fluxos end-to-end por perfil

## Arquivos Críticos para Auditoria

### Alta Prioridade

1. [lib/db.ts](lib/db.ts#L1342-L1620) - `criarContaResponsavel()`
2. [database/migrations/](database/migrations/) - RLS policies
3. [app/api/auth/](app/api/auth/) - Lógica de autenticação
4. [middleware.ts](middleware.ts) - Controle de acesso de rotas

### Média Prioridade

5. [app/api/rh/](app/api/rh/) - Endpoints de gestores RH
6. [app/api/entidade/](app/api/entidade/) - Endpoints de gestores Entidade
7. [app/api/avaliacao/](app/api/avaliacao/) - Endpoints de funcionários
8. [components/modals/](components/modals/) - Modais de criação

### Testes

9. [**tests**/security/rls-rbac.test.ts](__tests__/security/rls-rbac.test.ts)
10. [**tests**/seguranca/bcrypt-senhas.test.ts](__tests__/seguranca/bcrypt-senhas.test.ts)

## Problemas Conhecidos

### ⚠️ Ambiguidade: Gestores RH em `funcionarios`

**Situação Atual:**

- Gestores RH são criados na tabela `funcionarios` com `perfil='rh'`
- Isso pode causar confusão: "gestor é funcionário?"

**Clarificação:**

- **NO**: Gestor RH NÃO é funcionário no sentido funcional
- Está em `funcionarios` por questões de implementação/vínculo
- Perfil `'rh'` claramente separa do perfil `'funcionario'`

**Queries devem sempre filtrar:**

```sql
-- Para listar APENAS funcionários (não gestores):
WHERE perfil = 'funcionario'

-- Para listar gestores RH:
WHERE perfil = 'rh'

-- NUNCA fazer:
WHERE perfil IN ('funcionario', 'rh')  -- ERRADO! Confunde papéis
```

### ✅ Separação Clara: Gestores Entidade

**Situação Atual:**

- Gestores Entidade NÃO aparecem em `funcionarios`
- Autenticação apenas via `contratantes_senhas`
- Sem vínculos em `contratantes_funcionarios`

**Isto está CORRETO e deve ser mantido.**

## Recomendações

### Curto Prazo

1. ✅ Documentar distinção (este arquivo)
2. ⏳ Auditar todas as queries com `perfil`
3. ⏳ Revisar RLS policies
4. ⏳ Adicionar testes de isolamento de roles

### Longo Prazo

1. Considerar renomear tabela `funcionarios` para `usuarios` (breaking change)
2. Adicionar campo `tipo_usuario` explícito: 'gestor_rh' | 'gestor_entidade' | 'funcionario'
3. Criar view `vw_apenas_funcionarios` para queries comuns

## Contato

Para dúvidas sobre roles e permissões, consultar:

- Este documento: `docs/roles-and-rbac.md`
- Testes de segurança: `__tests__/security/`
- Schema completo: `database/schema-complete.sql`

---

**Última atualização:** 22 de janeiro de 2026  
**Responsável:** Equipe Qwork
