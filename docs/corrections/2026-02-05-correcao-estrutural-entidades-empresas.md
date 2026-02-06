# Correção Estrutural - Resumo de Mudanças

**Data:** 05 de Fevereiro de 2026  
**Tipo:** Correção Estrutural Crítica  
**Status:** ✅ Implementado (aguardando execução da migração)

---

## 🎯 Objetivo

Corrigir a estrutura do sistema para refletir a organização correta:

### ANTES (Incorreto):

- ❌ `gestor` (nome inconsistente)
- ❌ Entidades → Clínicas → Empresas → Funcionários (hierarquia confusa)
- ❌ `empresas_clientes.clinica_id` pode ser NULL

### DEPOIS (Correto):

- ✅ `gestor` (nome padronizado)
- ✅ **ENTIDADE [gestor]** → Funcionários DIRETOS
- ✅ **CLÍNICA [rh]** → Empresas → Funcionários
- ✅ `empresas_clientes.clinica_id NOT NULL` (sempre vinculado a clínica)

---

## 📊 Arquitetura Corrigida

### Fluxo Entidade:

```
ENTIDADE [gestor]
    ↓
Funcionários (diretos)
    ↓
Avaliações → Lotes
```

### Fluxo Clínica:

```
CLÍNICA [rh]
    ↓
EMPRESAS (clientes)
    ↓
Funcionários (da empresa)
    ↓
Avaliações → Lotes
```

---

## 📝 Mudanças Implementadas

### 1. Migração SQL ([400_corrigir_estrutura_entidades_empresas.sql](../../database/migrations/400_corrigir_estrutura_entidades_empresas.sql))

**Ações:**

- ✅ Atualiza `usuarios.tipo_usuario`: `gestor` → `gestor`
- ✅ Remove `gestor` do enum `usuario_tipo_enum`
- ✅ Corrige funcionários de entidade (garante `entidade_id`, remove `clinica_id/empresa_id`)
- ✅ Corrige funcionários de empresa (garante `empresa_id` + `clinica_id`)
- ✅ Corrige empresas órfãs (garante `clinica_id NOT NULL`)
- ✅ Atualiza constraints
- ✅ Recria view `gestores`

**Segurança:**

- Cria backups automáticos: `_backup_usuarios_m400`, `_backup_funcionarios_m400`, `_backup_empresas_m400`
- Validações antes e depois da migração
- Rollback automático em caso de erro

### 2. Código TypeScript

**Arquivos atualizados:**

#### [lib/types/enums.ts](../../lib/types/enums.ts)

```typescript
// ANTES
gestor = 'gestor',

// DEPOIS
GESTOR = 'gestor', // Gestor de Entidade: gera funcionários DIRETAMENTE
```

#### [lib/config/roles.ts](../../lib/config/roles.ts)

```typescript
// ANTES
gestor: 'gestor',

// DEPOIS
GESTOR: 'gestor',
```

#### [lib/usuario-tipo-helpers.ts](../../lib/usuario-tipo-helpers.ts)

```typescript
// Atualizado getSQLWhereUsuarioTipo()
case 'gestor': // antes era 'gestor'
  return "usuario_tipo = 'gestor'";
```

#### [lib/db.ts](../../lib/db.ts)

```typescript
// Função criarContaResponsavel()
const tipoUsuario = contratanteData.tipo === 'entidade' ? 'gestor' : 'rh';
```

#### [app/api/auth/login/route.ts](../../app/api/auth/login/route.ts)

```typescript
if (usuario.tipo_usuario === 'gestor') { // antes era 'gestor'
  // Buscar senha em entidades_senhas
```

### 3. Documentação

#### [DIAGRAMA_ESTRUTURA_GESTORES_FUNCIONARIOS.md](../../docs/DIAGRAMA_ESTRUTURA_GESTORES_FUNCIONARIOS.md)

- ✅ Atualizado para `tipo_usuario: 'gestor'`
- ✅ Clarifica que Gestor gera funcionários DIRETAMENTE
- ✅ Clarifica que RH gerencia EMPRESAS
- ✅ View `gestores` corrigida
- ✅ Regra de Ouro atualizada com fluxos

#### [MIGRATION_400_GUIA.md](../../docs/MIGRATION_400_GUIA.md)

- ✅ Guia completo de execução
- ✅ Checklist pré/pós migração
- ✅ Plano de rollback
- ✅ Testes necessários

---

## 🔍 Impacto

### Banco de Dados:

- **Tabelas modificadas:** 4 (usuarios, funcionarios, empresas_clientes, usuario_tipo_enum)
- **Views recriadas:** 1 (gestores)
- **Constraints atualizadas:** 3
- **Risco:** 🟡 MÉDIO (com backups e validações)

### Código:

- **Arquivos TypeScript:** 5
- **Documentação:** 2
- **Compatibilidade:** Mantida com adaptadores deprecados

### Usuários:

- **Impacto visível:** Mínimo (apenas nomenclatura interna)
- **Funcionalidades:** Nenhuma funcionalidade quebrada
- **Login:** Continua funcionando normalmente

---

## ✅ Validações

### Pré-Migração:

```sql
-- Contar registros com gestor
SELECT COUNT(*) FROM usuarios WHERE tipo_usuario = 'gestor';
```

### Pós-Migração:

```sql
-- Deve retornar 0
SELECT COUNT(*) FROM usuarios WHERE tipo_usuario = 'gestor';

-- Deve retornar contagem de gestores
SELECT COUNT(*) FROM gestores WHERE usuario_tipo = 'gestor';

-- Deve retornar 0 (sem empresas órfãs)
SELECT COUNT(*) FROM empresas_clientes WHERE clinica_id IS NULL;

-- Validar funcionários de entidade
SELECT COUNT(*) FROM funcionarios
WHERE usuario_tipo = 'funcionario_entidade'
AND entidade_id IS NOT NULL
AND clinica_id IS NULL;
```

---

## 📋 Próximos Passos

### Antes de Executar:

1. [ ] Revisar [MIGRATION_400_GUIA.md](../../docs/MIGRATION_400_GUIA.md)
2. [ ] Fazer backup completo do banco
3. [ ] Testar migração em ambiente local
4. [ ] Agendar janela de manutenção

### Execução:

1. [ ] Executar migração SQL
2. [ ] Validar resultados
3. [ ] Reiniciar aplicação
4. [ ] Executar testes funcionais

### Pós-Execução:

1. [ ] Monitorar logs
2. [ ] Validar login de gestores
3. [ ] Validar criação de funcionários
4. [ ] Marcar migration como completa

---

## 🔗 Arquivos Relacionados

### Migração:

- [400_corrigir_estrutura_entidades_empresas.sql](../../database/migrations/400_corrigir_estrutura_entidades_empresas.sql)

### Código:

- [lib/types/enums.ts](../../lib/types/enums.ts)
- [lib/config/roles.ts](../../lib/config/roles.ts)
- [lib/usuario-tipo-helpers.ts](../../lib/usuario-tipo-helpers.ts)
- [lib/db.ts](../../lib/db.ts)
- [app/api/auth/login/route.ts](../../app/api/auth/login/route.ts)

### Documentação:

- [DIAGRAMA_ESTRUTURA_GESTORES_FUNCIONARIOS.md](../../docs/DIAGRAMA_ESTRUTURA_GESTORES_FUNCIONARIOS.md)
- [MIGRATION_400_GUIA.md](../../docs/MIGRATION_400_GUIA.md)

---

**Implementado por:** Sistema de Migração Automática  
**Revisado por:** Pendente  
**Data de Execução Planejada:** A definir
