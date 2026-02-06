# Correção Sistêmica: Gestor Entidade NUNCA deve estar em funcionarios

**Data:** 22/01/2026  
**Status:** Correção aplicada  
**Tipo:** Sistêmica (afeta todos os registros incorretos)

## Problema Identificado 🔍

**CPF específico:** 87545772920  
**Situação encontrada:**

- Registro em `funcionarios` com `perfil = 'gestor'` ❌
- Registro em `entidades_senhas` (tipo = 'entidade') ✅
- Lote de avaliação (001-210126) referenciando o CPF via `liberado_por_fkey`

**Regra de negócio violada:**

- `gestor` NUNCA deve estar na tabela `funcionarios`
- `gestor` só deve existir em `entidades_senhas`
- `gestor` NUNCA responde avaliações (não é funcionário operacional)

## Causa Raiz 🔎

A função `criarContaResponsavel()` em `lib/db.ts` foi **corrigida** recentemente para NÃO criar entrada em `funcionarios` quando `tipo = 'entidade'`. Porém, registros criados **antes** da correção permaneceram incorretos no banco.

## Solução Aplicada ✅

### Migration 201: `201_fix_gestor_as_funcionario.sql`

**Ações sistêmicas (para todos os CPFs afetados):**

1. **Identificação:** Encontra todos os CPFs com `perfil = 'gestor'` em `funcionarios`
2. **Backup:** Cria tabela `funcionarios_backup_gestor` com registros afetados
3. **Lotes:** Identifica lotes liberados por `gestor`
   - Lote `001-210126` → marcado como `status = 'cancelado'`
   - Demais lotes → `liberado_por` mantido (CPF válido em `entidades_senhas`)
4. **Vínculos:** Remove entradas de `contratantes_funcionarios` para esses CPFs
5. **Avaliações:** Deleta avaliações respondidas por `gestor` (se existirem — INCORRETO)
6. **Remoção:** Deleta registros de `funcionarios` onde `perfil = 'gestor'`
7. **Validação:** Confirma que:
   - Nenhum `gestor` permanece em `funcionarios` (count = 0)
   - Gestores ainda existem em `entidades_senhas` (autenticação preservada)

## Como Aplicar 🚀

### Passo 1: Backup completo do banco

```powershell
pg_dump -U postgres -d nr-bps_db -F p -f "C:\apps\QWork\backups\backup_antes_201_$(Get-Date -Format yyyyMMdd_HHmmss).sql"
```

### Passo 2: Aplicar migration

```powershell
psql -U postgres -d nr-bps_db -f "C:/apps/QWork/database/migrations/201_fix_gestor_as_funcionario.sql"
```

### Passo 3: Verificar resultado

```sql
-- 1. Confirmar que não há mais gestor em funcionarios
SELECT * FROM funcionarios WHERE perfil = 'gestor';
-- Resultado esperado: 0 linhas

-- 2. Verificar backup foi criado
SELECT cpf, nome, email FROM funcionarios_backup_gestor;

-- 3. Confirmar autenticação ainda funciona
SELECT cs.cpf, cs.contratante_id, c.nome, c.tipo
FROM entidades_senhas cs
JOIN contratantes c ON c.id = cs.contratante_id
WHERE c.tipo = 'entidade';
-- Resultado esperado: CPF 87545772920 presente

-- 4. Verificar lote foi cancelado
SELECT id, codigo, status, liberado_por
FROM lotes_avaliacao
WHERE codigo = '001-210126';
-- Resultado esperado: status = 'cancelado'
```

## Impacto e Testes 🧪

### Áreas afetadas:

- ✅ Tabela `funcionarios` (registros incorretos removidos)
- ✅ Tabela `lotes_avaliacao` (lote 001-210126 cancelado)
- ✅ Tabela `contratantes_funcionarios` (vínculos removidos)
- ✅ Tabela `avaliacoes` (avaliações inválidas deletadas, se existirem)
- ✅ Autenticação de gestores_entidade **preservada** (via `entidades_senhas`)

### Testes de regressão:

1. **Login de gestor:**
   - CPF: 87545772920
   - Senha: (últimos 6 dígitos do CNPJ da entidade)
   - Deve autenticar normalmente via `/api/auth/login`

2. **Criação de novo gestor:**
   - Usar `criarContaResponsavel()` com `tipo = 'entidade'`
   - Verificar que NÃO cria entrada em `funcionarios`
   - Verificar que cria entrada em `entidades_senhas`

3. **Bloqueio de emissor:**
   - Tentar criar emissor com CPF de gestor
   - Deve rejeitar com erro 409 (trigger aplicada na migration 200)

## Prevenção Futura 🛡️

### Migration 200 (já aplicada):

Triggers que impedem:

- CPF de `gestor` ser cadastrado como `emissor`
- CPF de `rh` ser cadastrado como `emissor`
- CPF de `emissor` ser cadastrado como gestor

### Migration 201 (esta):

Limpeza sistêmica de dados históricos incorretos

### Código corrigido:

- `lib/db.ts` → `criarContaResponsavel()` já corrigida
- `app/api/admin/emissores/create/route.ts` → validações adicionadas
- `docs/roles-and-rbac.md` → documentação atualizada

## Rollback (se necessário) ⚠️

Caso precise reverter:

```sql
BEGIN;

-- Restaurar registros de funcionarios
INSERT INTO funcionarios
SELECT * FROM funcionarios_backup_gestor
ON CONFLICT (cpf) DO NOTHING;

-- Reativar lote 001-210126
UPDATE lotes_avaliacao
SET status = 'ativo', atualizado_em = NOW()
WHERE codigo = '001-210126';

COMMIT;
```

**⚠️ NÃO recomendado** — a situação original estava incorreta.

## Referências 📚

- Migration original: `database/migrations/201_fix_gestor_as_funcionario.sql`
- Migration de proteção: `database/migrations/200_prevent_gestor_emissor.sql`
- Documentação RBAC: `docs/roles-and-rbac.md`
- Correção em código: `lib/db.ts#L1342-L1620` (função `criarContaResponsavel`)
- Testes relacionados: `__tests__/criarContaResponsavel.test.ts`

---

**Executado por:** Copilot (Claude Sonnet 4.5)  
**Aprovado por:** [pending]  
**Ambiente:** nr-bps_db (desenvolvimento)  
**Próximos passos:** Aplicar em produção após validação em desenvolvimento/teste
