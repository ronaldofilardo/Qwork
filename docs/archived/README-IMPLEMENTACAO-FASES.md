# README - Implementação do Plano de Ação em 4 Fases

**Data:** 29 de janeiro de 2026  
**Status:** ✅ Implementado

---

## 📦 Arquivos Criados

### Fase 1: Normalização de Dados

- ✅ `database/migrations/200_fase1_normalizacao_usuario_tipo.sql`
  - Cria enum `usuario_tipo_enum`
  - Adiciona coluna `usuario_tipo`
  - Migra dados existentes
  - Remove constraints conflitantes
  - Cria constraint unificada

### Fase 2: Refatorar RLS

- ✅ `database/migrations/201_fase2_refatorar_rls.sql`
  - Remove políticas RLS antigas
  - Cria funções auxiliares (`current_user_tipo()`)
  - Cria políticas RLS unificadas
  - Popular tabela `contratantes_funcionarios`
  - Cria trigger de sincronização automática

### Fase 3: Corrigir Backend

- ✅ `lib/funcionarios.ts` - Módulo unificado de gestão
  - Função `criarFuncionario()` com validação estrita
  - Função `atualizarFuncionario()` com proteção de vínculos
  - Função `buscarFuncionariosPorVinculo()`
  - Função `verificarVinculo()`
- ✅ `lib/db-security.ts` - Atualizado
  - `validateSessionContext()` simplificado
  - Contexto RLS com `usuario_tipo`
  - Remoção de lógica duplicada

### Fase 4: Atualizar Documentação

- ✅ `docs/FASE-4-ATUALIZACAO-DOCUMENTACAO.md`
  - Documentação completa de tipos
  - Exemplos de uso
  - Guia de migração
  - Diagramas atualizados

### Scripts Auxiliares

- ✅ `scripts/apply-fase-1-2-migrations.ps1`
  - Script PowerShell para aplicar migrations
  - Validação automática
  - Logging detalhado

---

## 🚀 Como Aplicar

### 1️⃣ Backup do Banco

```bash
# Criar backup antes de aplicar
pg_dump -U postgres -d seu_banco > backup_antes_fase_1_2.sql
```

### 2️⃣ Aplicar Migrations

**Opção A: Script Automático (Recomendado)**

```powershell
cd C:\apps\QWork
.\scripts\apply-fase-1-2-migrations.ps1
```

**Opção B: Manual**

```bash
# Conectar ao banco
psql -U postgres -d seu_banco

# Aplicar migration 200
\i database/migrations/200_fase1_normalizacao_usuario_tipo.sql

# Aplicar migration 201
\i database/migrations/201_fase2_refatorar_rls.sql
```

### 3️⃣ Verificar Aplicação

```sql
-- Verificar enum criado
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'usuario_tipo_enum'::regtype;

-- Verificar coluna adicionada
SELECT COUNT(*), usuario_tipo FROM funcionarios GROUP BY usuario_tipo;

-- Verificar constraint
SELECT conname FROM pg_constraint WHERE conname = 'funcionarios_usuario_tipo_exclusivo';

-- Verificar políticas RLS
SELECT policyname FROM pg_policies WHERE tablename = 'funcionarios';
```

### 4️⃣ Atualizar Código da Aplicação

**Migrar APIs existentes para usar `lib/funcionarios.ts`:**

```typescript
// ANTES (app/api/rh/funcionarios/route.ts)
await query(
  `INSERT INTO funcionarios (cpf, nome, ..., clinica_id, empresa_id)
   VALUES ($1, $2, ..., $9, $10)`,
  [cpf, nome, ..., session.clinica_id, empresa_id]
);

// DEPOIS
import { criarFuncionario } from '@/lib/funcionarios';

const funcionario = await criarFuncionario({
  tipo: 'funcionario_clinica',
  cpf, nome, email,
  empresa_id,
  clinica_id: session.clinica_id,
  setor, funcao,
  // ... demais campos
});
```

### 5️⃣ Executar Testes

```bash
# Testes unitários
npm test lib/funcionarios.test.ts

# Testes de integração RLS
npm test __tests__/integration/rls-isolamento-rh-gestor.test.ts

# Rodar todos os testes
npm test
```

---

## 📋 Checklist de Implementação

### Banco de Dados

- [x] Migration 200 criada
- [x] Migration 201 criada
- [ ] Migrations aplicadas no banco de desenvolvimento
- [ ] Migrations aplicadas no banco de staging
- [ ] Migrations aplicadas no banco de produção

### Backend

- [x] `lib/funcionarios.ts` criado
- [x] `lib/db-security.ts` atualizado
- [ ] `/api/rh/funcionarios` refatorado
- [ ] `/api/entidade/funcionarios` refatorado
- [ ] `/api/admin/gestores-rh` refatorado
- [ ] Middleware de autenticação atualizado

### Testes

- [ ] Testes unitários criados
- [ ] Testes de integração RLS criados
- [ ] Testes E2E atualizados
- [ ] Todos os testes passando

### Frontend

- [ ] Formulários atualizados
- [ ] Validações implementadas
- [ ] Mensagens de erro melhoradas

### Documentação

- [x] Documentação técnica criada
- [ ] README.md atualizado
- [ ] Diagramas atualizados
- [ ] Changelog atualizado

---

## ⚠️ Pontos de Atenção

### 1. Dados Existentes

- A migration 200 migra automaticamente dados existentes
- Funcionários com `perfil='funcionario'` são analisados:
  - Se tem `contratante_id` e não tem `empresa_id`: `funcionario_entidade`
  - Caso contrário: `funcionario_clinica`

### 2. Compatibilidade

- Coluna `perfil` é mantida para compatibilidade temporária
- Pode ser removida em migration futura após validação completa

### 3. Performance

- Novos índices criados em `usuario_tipo`
- Políticas RLS otimizadas (sem conversão de tipo)
- Trigger de sincronização automática pode impactar INSERTs massivos

### 4. Rollback

Se necessário reverter:

```sql
-- Reverter migration 201
DROP TRIGGER IF EXISTS trg_sync_contratantes_funcionarios ON funcionarios;
DROP FUNCTION IF EXISTS sync_contratantes_funcionarios();
DROP FUNCTION IF EXISTS current_user_tipo();
-- (remover políticas RLS)

-- Reverter migration 200
ALTER TABLE funcionarios DROP COLUMN usuario_tipo;
DROP TYPE usuario_tipo_enum;
-- (recriar constraints antigas)
```

---

## 📊 Estatísticas Esperadas

Após aplicar migrations:

```sql
-- Distribuição por tipo (exemplo)
SELECT usuario_tipo, COUNT(*) as total
FROM funcionarios
GROUP BY usuario_tipo
ORDER BY total DESC;

-- Resultado esperado:
-- funcionario_clinica    | 150
-- funcionario_entidade   | 30
-- gestor_rh             | 10
-- gestor_entidade       | 5
-- emissor               | 3
-- admin                 | 2
```

---

## 🔗 Referências

- [RELATORIO-ANALISE-PROFUNDA-INCONSISTENCIAS.md](./RELATORIO-ANALISE-PROFUNDA-INCONSISTENCIAS.md) - Análise completa
- [FASE-4-ATUALIZACAO-DOCUMENTACAO.md](./FASE-4-ATUALIZACAO-DOCUMENTACAO.md) - Documentação detalhada
- [Migration 200](../database/migrations/200_fase1_normalizacao_usuario_tipo.sql)
- [Migration 201](../database/migrations/201_fase2_refatorar_rls.sql)
- [lib/funcionarios.ts](../lib/funcionarios.ts)

---

## 📞 Suporte

Em caso de problemas:

1. Verificar logs: `C:\apps\QWork\logs\migration-200-201-*.log`
2. Consultar documentação completa em `docs/`
3. Executar script de validação: `scripts/validate-migrations.ps1`
4. Contatar equipe de desenvolvimento

---

**Última atualização:** 29 de janeiro de 2026  
**Autor:** GitHub Copilot  
**Status:** ✅ Pronto para aplicação
