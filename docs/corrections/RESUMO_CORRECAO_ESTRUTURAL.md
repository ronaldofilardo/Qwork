# ✅ CORREÇÃO ESTRUTURAL CONCLUÍDA

**Data:** 05 de Fevereiro de 2026  
**Status:** Implementado - Aguardando execução da migração SQL

---

## 📋 Resumo das Mudanças

### Problema Corrigido:

A estrutura do sistema estava **incorreta** em relação a como Entidades e Clínicas gerenciam funcionários e empresas:

**ANTES (Incorreto):**

```
❌ tipo_usuario = 'gestor' (nome inconsistente)
❌ Hierarquia confusa: Entidades → Clínicas → Empresas → Funcionários
❌ empresas_clientes.clinica_id pode ser NULL (empresas órfãs)
❌ Não estava claro quem gera o quê
```

**AGORA (Correto):**

```
✅ tipo_usuario = 'gestor' (padronizado)
✅ ENTIDADE [gestor] → Gera funcionários DIRETAMENTE
✅ CLÍNICA [rh] → Gerencia EMPRESAS → Empresas têm funcionários
✅ empresas_clientes.clinica_id NOT NULL (sempre vinculado)
✅ Separação clara de responsabilidades
```

---

## 🎯 Nova Arquitetura

### Fluxo ENTIDADE:

```
┌─────────────┐
│  ENTIDADE   │ tipo_usuario = 'gestor'
│   [gestor]  │ entidade_id NOT NULL
└──────┬──────┘
       │
       │ GERA DIRETAMENTE
       │ (sem intermediário)
       ▼
┌─────────────┐
│FUNCIONÁRIOS │ funcionario_entidade
│             │ entidade_id NOT NULL
│             │ clinica_id = NULL
│             │ empresa_id = NULL
└──────┬──────┘
       │
       ▼
┌─────────────┐    ┌─────────┐
│ AVALIAÇÕES  │───▶│  LOTES  │
└─────────────┘    └─────────┘
```

### Fluxo CLÍNICA:

```
┌─────────────┐
│   CLÍNICA   │ tipo_usuario = 'rh'
│    [rh]     │ clinica_id NOT NULL
└──────┬──────┘
       │
       │ GERENCIA
       ▼
┌─────────────┐
│  EMPRESAS   │ empresas_clientes
│  (clientes) │ clinica_id NOT NULL ← SEMPRE!
└──────┬──────┘
       │
       │ TEM
       ▼
┌─────────────┐
│FUNCIONÁRIOS │ funcionario_clinica
│             │ empresa_id NOT NULL
│             │ clinica_id NOT NULL
│             │ entidade_id = NULL
└──────┬──────┘
       │
       ▼
┌─────────────┐    ┌─────────┐
│ AVALIAÇÕES  │───▶│  LOTES  │
└─────────────┘    └─────────┘
```

---

## 📝 Arquivos Modificados

### 1. Migração SQL

**Arquivo:** [database/migrations/400_corrigir_estrutura_entidades_empresas.sql](../database/migrations/400_corrigir_estrutura_entidades_empresas.sql)

**Ações:**

- ✅ Cria backups automáticos (\_backup_usuarios_m400, etc)
- ✅ Atualiza `usuarios.tipo_usuario`: `gestor` → `gestor`
- ✅ Remove `gestor` do enum
- ✅ Corrige estrutura de funcionários (entidade vs empresa)
- ✅ Garante `empresas_clientes.clinica_id NOT NULL`
- ✅ Atualiza constraints
- ✅ Recria view `gestores`
- ✅ Validações pré e pós-migração

### 2. TypeScript - Tipos e Enums

**Arquivo:** [lib/types/enums.ts](../lib/types/enums.ts)

```typescript
// Atualizado
GESTOR = 'gestor', // Gestor de Entidade: gera funcionários DIRETAMENTE
```

**Arquivo:** [lib/config/roles.ts](../lib/config/roles.ts)

```typescript
// Atualizado
GESTOR: 'gestor',

// Função atualizada
export function isGestor(role: Role): boolean {
  return role === ROLES.RH || role === ROLES.GESTOR;
}
```

### 3. Helpers e Utilitários

**Arquivo:** [lib/usuario-tipo-helpers.ts](../lib/usuario-tipo-helpers.ts)

```typescript
// Função getSQLWhereUsuarioTipo atualizada
case 'gestor': // antes era 'gestor'
  return "usuario_tipo = 'gestor'";
```

### 4. Database Helpers

**Arquivo:** [lib/db.ts](../lib/db.ts)

```typescript
// Função criarContaResponsavel() atualizada
const tipoUsuario = tomadorData.tipo === 'entidade' ? 'gestor' : 'rh';
```

### 5. Autenticação

**Arquivo:** [app/api/auth/login/route.ts](../app/api/auth/login/route.ts)

```typescript
// Verificação atualizada
if (usuario.tipo_usuario === 'gestor') {
  // Buscar senha em entidades_senhas
```

### 6. Middleware RBAC

**Arquivo:** [lib/interfaces/middleware/rbac.ts](../lib/interfaces/middleware/rbac.ts)

```typescript
// Verificação de acesso atualizada
if (session.perfil !== ROLES.GESTOR && session.perfil !== ROLES.ADMIN) {
  return new NextResponse('Acesso negado', { status: 403 });
}
```

### 7. Documentação

**Arquivos:**

- ✅ [docs/DIAGRAMA_ESTRUTURA_GESTORES_FUNCIONARIOS.md](../docs/DIAGRAMA_ESTRUTURA_GESTORES_FUNCIONARIOS.md) - Diagrama atualizado
- ✅ [docs/MIGRATION_400_GUIA.md](../docs/MIGRATION_400_GUIA.md) - Guia completo de migração
- ✅ [docs/corrections/2026-02-05-correcao-estrutural-entidades-empresas.md](../docs/corrections/2026-02-05-correcao-estrutural-entidades-empresas.md) - Resumo das correções

---

## 🚀 Próximos Passos

### ANTES de executar a migração:

1. **Fazer BACKUP completo:**

   ```bash
   # Local
   pg_dump -h localhost -U postgres -d nr-bps_db > backup_pre_m400.sql

   # Produção - usar interface Neon para snapshot
   ```

2. **Testar em ambiente local:**

   ```bash
   psql -h localhost -U postgres -d nr-bps_db_test -f database/migrations/400_corrigir_estrutura_entidades_empresas.sql
   ```

3. **Revisar checklist:**
   - [ ] Backup criado ✓
   - [ ] Migração testada em local ✓
   - [ ] Equipe notificada
   - [ ] Janela de manutenção agendada

### EXECUTAR migração:

```bash
# Desenvolvimento
psql -h localhost -U postgres -d nr-bps_db -f database/migrations/400_corrigir_estrutura_entidades_empresas.sql

# Produção (após validar em dev)
# Conectar ao Neon e executar
```

### APÓS migração:

1. **Validar resultados:**

   ```sql
   -- Não deve ter mais gestor
   SELECT COUNT(*) FROM usuarios WHERE tipo_usuario = 'gestor'; -- 0

   -- Deve ter gestores
   SELECT COUNT(*) FROM gestores WHERE usuario_tipo = 'gestor';

   -- Não deve ter empresas órfãs
   SELECT COUNT(*) FROM empresas_clientes WHERE clinica_id IS NULL; -- 0
   ```

2. **Reiniciar aplicação:**

   ```bash
   pnpm dev # ou deploy no Vercel
   ```

3. **Testar funcionalidades:**
   - [ ] Login como gestor
   - [ ] Login como RH
   - [ ] Criar funcionário (entidade)
   - [ ] Criar empresa (clínica)
   - [ ] Criar funcionário (empresa)

---

## 📊 Estatísticas

### Arquivos Modificados:

- **Migração SQL:** 1 arquivo
- **TypeScript:** 6 arquivos
- **Documentação:** 3 arquivos
- **Total:** 10 arquivos

### Linhas de Código:

- **SQL:** ~350 linhas
- **TypeScript:** ~50 linhas modificadas
- **Documentação:** ~800 linhas

### Impacto:

- **Risco:** 🟡 MÉDIO (com backups e validações)
- **Tempo estimado:** 5-10 minutos
- **Downtime necessário:** Sim (produção)

---

## ✅ Checklist Final

### Implementação:

- [x] Migração SQL criada
- [x] Código TypeScript atualizado
- [x] Documentação atualizada
- [x] Guia de migração criado
- [x] Validações implementadas
- [x] Plano de rollback documentado

### Antes de Executar:

- [ ] Backup criado
- [ ] Testado em local
- [ ] Equipe notificada
- [ ] Janela agendada

### Pós-Execução:

- [ ] Migração executada
- [ ] Validações OK
- [ ] Aplicação reiniciada
- [ ] Testes funcionais OK

---

## 📚 Documentação de Referência

- **Guia completo:** [MIGRATION_400_GUIA.md](../docs/MIGRATION_400_GUIA.md)
- **Diagrama atualizado:** [DIAGRAMA_ESTRUTURA_GESTORES_FUNCIONARIOS.md](../docs/DIAGRAMA_ESTRUTURA_GESTORES_FUNCIONARIOS.md)
- **Relatório detalhado:** [2026-02-05-correcao-estrutural-entidades-empresas.md](../docs/corrections/2026-02-05-correcao-estrutural-entidades-empresas.md)

---

## 🎉 Benefícios da Correção

1. **Clareza:** Estrutura reflete a realidade do negócio
2. **Consistência:** Nomenclatura padronizada (`gestor` ao invés de `gestor`)
3. **Integridade:** Empresas sempre vinculadas a clínicas (NOT NULL)
4. **Manutenibilidade:** Código mais fácil de entender e manter
5. **Escalabilidade:** Base sólida para futuras funcionalidades

---

**Implementado por:** Sistema  
**Data:** 05 de Fevereiro de 2026  
**Pronto para:** Execução
