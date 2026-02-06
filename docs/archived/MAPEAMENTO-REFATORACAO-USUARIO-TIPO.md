# Mapeamento de Refatoração - perfil → usuario_tipo

**Data:** 29 de janeiro de 2026  
**Status:** 🔄 Em progresso

---

## 📋 APIs que Precisam de Refatoração

### 🔴 CRÍTICAS - Criam/Atualizam funcionários

| Arquivo                                                                                          | Linha    | Ação Necessária                                              | Prioridade |
| ------------------------------------------------------------------------------------------------ | -------- | ------------------------------------------------------------ | ---------- |
| [lib/db.ts](lib/db.ts)                                                                           | 1830     | Refatorar `criarContaResponsavel()` para usar `usuario_tipo` | 🔴 ALTA    |
| [app/api/rh/funcionarios/route.ts](app/api/rh/funcionarios/route.ts)                             | 114, 185 | Substituir INSERT direto por `criarFuncionario()`            | 🔴 ALTA    |
| [app/api/rh/funcionarios/import/route.ts](app/api/rh/funcionarios/import/route.ts)               | 202      | Migrar import em massa para `criarFuncionario()`             | 🔴 ALTA    |
| [app/api/pagamento/simulador/confirmar/route.ts](app/api/pagamento/simulador/confirmar/route.ts) | 117      | Usar `criarFuncionario()` na confirmação                     | 🟡 MÉDIA   |
| [app/api/pagamento/confirmar-simples/route.ts](app/api/pagamento/confirmar-simples/route.ts)     | 75       | Usar `criarFuncionario()`                                    | 🟡 MÉDIA   |
| [app/api/test/session/route.ts](app/api/test/session/route.ts)                                   | 59       | Usar `criarFuncionario()` em testes                          | 🟢 BAIXA   |

### 🟡 MÉDIAS - Consultas que filtram por perfil

| Arquivo                                                                        | Linha | Ação Necessária                                                                                      | Prioridade |
| ------------------------------------------------------------------------------ | ----- | ---------------------------------------------------------------------------------------------------- | ---------- |
| [app/api/rh/liberar-por-nivel/route.ts](app/api/rh/liberar-por-nivel/route.ts) | 35    | Alterar `perfil = 'funcionario'` → `usuario_tipo IN ('funcionario_clinica', 'funcionario_entidade')` | 🟡 MÉDIA   |
| [app/api/rh/empresas/[id]/route.ts](app/api/rh/empresas/[id]/route.ts)         | 66    | Idem                                                                                                 | 🟡 MÉDIA   |
| [app/api/test/usuarios/route.ts](app/api/test/usuarios/route.ts)               | 21    | Atualizar query de teste                                                                             | 🟢 BAIXA   |

### 🟢 BAIXAS - Verificações de autorização

| Arquivo                                                                                        | Linha  | Ação Necessária                                             | Prioridade |
| ---------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------- | ---------- |
| [app/api/rh/pendencias/route.ts](app/api/rh/pendencias/route.ts)                               | 34     | `session.perfil === 'rh'` → `session.usuario_tipo === 'rh'` | 🟢 BAIXA   |
| [app/api/rh/laudos/route.ts](app/api/rh/laudos/route.ts)                                       | 39     | Idem                                                        | 🟢 BAIXA   |
| [app/api/rh/laudos/[laudoId]/download/route.ts](app/api/rh/laudos/[laudoId]/download/route.ts) | 68, 70 | Atualizar verificações                                      | 🟢 BAIXA   |
| [app/api/notificacoes/\*.ts](app/api/notificacoes)                                             | Várias | Atualizar verificações                                      | 🟢 BAIXA   |

---

## 🎨 Componentes Frontend que Precisam Atualização

### Tipagens TypeScript

| Arquivo                                        | Linha | Ação Necessária                        |
| ---------------------------------------------- | ----- | -------------------------------------- |
| [components/Header.tsx](components/Header.tsx) | 16    | Adicionar tipos de `usuario_tipo_enum` |
| [app/rh/layout.tsx](app/rh/layout.tsx)         | 10    | Atualizar type `Session`               |
| [app/admin/page.tsx](app/admin/page.tsx)       | 17    | Atualizar type                         |

### Displays/UI

| Arquivo                                                                    | Linha   | Ação Necessária                             |
| -------------------------------------------------------------------------- | ------- | ------------------------------------------- |
| [components/clinica/ContaSection.tsx](components/clinica/ContaSection.tsx) | 741     | Mapear `usuario_tipo` para labels amigáveis |
| [components/Header.tsx](components/Header.tsx)                             | 92, 144 | Atualizar `getRoleTitle()`                  |

---

## 🧪 Testes que Precisam Atualização

### Testes de Integração

| Arquivo                                   | Ação Necessária                                             |
| ----------------------------------------- | ----------------------------------------------------------- |
| `__tests__/cadastroContratante.test.ts`   | Verificar que `criarContaResponsavel()` cria `usuario_tipo` |
| `__tests__/criarContaResponsavel.test.ts` | Atualizar assertions para `usuario_tipo`                    |
| `__tests__/clinica-login-auth.test.ts`    | Validar login com `usuario_tipo`                            |

### Testes de Componentes

| Arquivo                                              | Ação Necessária           |
| ---------------------------------------------------- | ------------------------- |
| `__tests__/components/Header.test.tsx`               | Atualizar mocks de sessão |
| `__tests__/components/clinica/ContaSection.test.tsx` | Atualizar mocks           |

---

## 🗺️ Plano de Execução Detalhado

### Fase 1: Refatorar lib/db.ts (criarContaResponsavel)

**Duração estimada:** 30 min  
**Risco:** 🔴 Alto

**Passos:**

1. ✅ Analisar função `criarContaResponsavel()` atual
2. ⏳ Substituir `perfil` por `usuario_tipo` em INSERTs
3. ⏳ Mapear lógica de tipo:
   - `tipo === 'entidade'` → `'gestor'`
   - `tipo === 'clinica'` → `'rh'`
4. ⏳ Atualizar queries de validação
5. ⏳ Testar com `npm test criarContaResponsavel`

**Arquivos afetados:**

- `lib/db.ts` (linhas 1830-1950)

---

### Fase 2: Refatorar APIs de Criação de Funcionários

**Duração estimada:** 1h  
**Risco:** 🟡 Médio

**Passos:**

1. ⏳ Importar `criarFuncionario()` de `lib/funcionarios.ts`
2. ⏳ Substituir INSERTs diretos em:
   - `app/api/rh/funcionarios/route.ts`
   - `app/api/rh/funcionarios/import/route.ts`
3. ⏳ Atualizar lógica de tipo para cada caso
4. ⏳ Testar criação individual e em massa

**Exemplo de refatoração:**

**Antes:**

```typescript
await query(
  `INSERT INTO funcionarios (cpf, nome, perfil, clinica_id, empresa_id, ativo)
   VALUES ($1, $2, 'funcionario', $3, $4, true)`,
  [cpf, nome, clinicaId, empresaId]
);
```

**Depois:**

```typescript
import { criarFuncionario } from '@/lib/funcionarios';

const funcionario = await criarFuncionario(
  {
    cpf,
    nome,
    usuario_tipo: 'funcionario_clinica',
    clinica_id: clinicaId,
    empresa_id: empresaId,
    ativo: true,
  },
  session
);
```

---

### Fase 3: Atualizar Queries de Consulta

**Duração estimada:** 30 min  
**Risco:** 🟢 Baixo

**Mapeamento de conversão:**

| perfil (antigo) | usuario_tipo (novo)                                 | Query Atualizada                                                        |
| --------------- | --------------------------------------------------- | ----------------------------------------------------------------------- |
| `'funcionario'` | `'funcionario_clinica'` OU `'funcionario_entidade'` | `WHERE usuario_tipo IN ('funcionario_clinica', 'funcionario_entidade')` |
| `'rh'`          | `'rh'`                                              | `WHERE usuario_tipo = 'rh'`                                             |
| `'gestor'`      | `'gestor'`                                          | `WHERE usuario_tipo = 'gestor'`                                         |
| `'admin'`       | `'admin'`                                           | `WHERE usuario_tipo = 'admin'`                                          |
| `'emissor'`     | `'emissor'`                                         | `WHERE usuario_tipo = 'emissor'`                                        |

---

### Fase 4: Atualizar Componentes Frontend

**Duração estimada:** 45 min  
**Risco:** 🟢 Baixo

**Etapas:**

1. **Criar helper de mapeamento:**

```typescript
// lib/usuario-tipo-helpers.ts
export function getUsuarioTipoLabel(tipo: usuario_tipo_enum): string {
  const labels = {
    funcionario_clinica: 'Funcionário',
    funcionario_entidade: 'Funcionário da Entidade',
    rh: 'Gestor RH',
    gestor: 'Gestor da Entidade',
    admin: 'Administrador',
    emissor: 'Emissor de Laudos',
  };
  return labels[tipo] || tipo;
}

export function mapPerfilToUsuarioTipo(
  perfil: string
): usuario_tipo_enum | null {
  const map = {
    funcionario: 'funcionario_clinica',
    rh: 'rh',
    gestor: 'gestor',
    admin: 'admin',
    emissor: 'emissor',
  };
  return map[perfil] || null;
}
```

2. **Atualizar tipos de Session:**

```typescript
// lib/session.ts
export interface Session {
  cpf: string;
  nome?: string;
  usuario_tipo: usuario_tipo_enum; // NOVO
  perfil?: string; // @deprecated - manter temporariamente para compatibilidade
  clinica_id?: number;
  contratante_id?: number;
  // ...
}
```

3. **Atualizar componentes:**
   - `Header.tsx`: usar `getUsuarioTipoLabel(session.usuario_tipo)`
   - `ContaSection.tsx`: idem

---

### Fase 5: Executar Testes RLS

**Duração estimada:** 20 min  
**Risco:** 🟡 Médio

**Comandos:**

```bash
# Testes de isolamento RLS
npm test -- --testPathPattern="rls|isolation|security"

# Testes específicos de funcionarios
npm test -- --testPathPattern="funcionarios"

# Testes de criação de conta
npm test criarContaResponsavel
```

**Validações esperadas:**

- ✅ Gestores RH só veem funcionários da sua clínica
- ✅ Gestores Entidade veem todos os funcionários vinculados
- ✅ Admin vê todos os registros
- ✅ Funcionários só veem seus próprios dados

---

### Fase 6: Criar Migration para Remover Coluna perfil

**Duração estimada:** 10 min  
**Risco:** 🟢 Baixo

**Arquivo:** `database/migrations/202_remover_coluna_perfil.sql`

```sql
-- Migration 202: Remover coluna perfil obsoleta
-- Data: 2026-01-29
-- Descrição: Remove coluna perfil após migração completa para usuario_tipo

BEGIN;

\echo '=== MIGRATION 202: REMOVER COLUNA PERFIL ==='

-- 1. Verificar que todos os registros têm usuario_tipo
DO $$
DECLARE
  registros_sem_tipo INT;
BEGIN
  SELECT COUNT(*) INTO registros_sem_tipo
  FROM funcionarios
  WHERE usuario_tipo IS NULL;

  IF registros_sem_tipo > 0 THEN
    RAISE EXCEPTION 'Ainda há % registros sem usuario_tipo. Migration abortada.', registros_sem_tipo;
  END IF;

  RAISE NOTICE 'Todos os registros têm usuario_tipo. Prosseguindo...';
END $$;

-- 2. Remover índices que usam perfil (se existirem)
DROP INDEX IF EXISTS idx_funcionarios_perfil;

-- 3. Remover constraint de perfil (se existir)
ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS funcionarios_perfil_check;

-- 4. Remover coluna perfil
ALTER TABLE funcionarios DROP COLUMN IF EXISTS perfil;

\echo '   ✓ Coluna perfil removida'

COMMIT;

\echo '=== MIGRATION 202: CONCLUÍDA COM SUCESSO ==='
```

---

## ⚠️ Riscos e Mitigações

| Risco                            | Probabilidade | Impacto | Mitigação                                        |
| -------------------------------- | ------------- | ------- | ------------------------------------------------ |
| Código legado ainda usa `perfil` | Alta          | Alto    | Manter coluna `perfil` até validação completa    |
| Queries antigas em produção      | Média         | Alto    | Fazer release gradual, monitorar logs            |
| Testes quebram                   | Média         | Médio   | Rodar suite completa antes de deploy             |
| RLS policies não funcionam       | Baixa         | Crítico | Validar com testes específicos antes de produção |

---

## ✅ Checklist de Validação Final

Antes de considerar a refatoração completa:

- [ ] Todas as APIs usam `criarFuncionario()` ou `atualizarFuncionario()`
- [ ] Nenhum INSERT/UPDATE direto em `funcionarios` (exceto migrations)
- [ ] Queries usam `usuario_tipo` em vez de `perfil`
- [ ] Componentes React exibem labels corretos
- [ ] Testes RLS passam 100%
- [ ] Testes de integração passam 100%
- [ ] Validação manual em ambiente de staging
- [ ] Monitoramento de logs em produção (1 semana)
- [ ] Remover coluna `perfil` com migration 202

---

## 📊 Métricas de Progresso

**Total de arquivos a refatorar:** 25  
**Concluídos:** 0  
**Em progresso:** 1  
**Pendentes:** 24

**Estimativa total:** 3h 15min  
**Risco geral:** 🟡 Médio

---

**Última atualização:** 29/01/2026 23:15
