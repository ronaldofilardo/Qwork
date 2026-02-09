# Correção: Erros ao criar funcionários de entidades e empresas de clínicas

**Data:** 23/01/2026  
**Status:** ✅ Corrigido

## Problema 1: Funcionários de entidades violam constraint

### Sintoma

```
error: a nova linha da relação "funcionarios" viola a restrição de verificação "funcionarios_clinica_check"
constraint: 'funcionarios_clinica_check'
```

### Causa Raiz

A constraint `funcionarios_clinica_check` estava configurada para aceitar apenas:

- `clinica_id IS NOT NULL`, OU
- `perfil IN ('emissor', 'admin', 'gestor')`

**Mas NÃO aceitava `tomador_id` como alternativa válida.**

A migration 072 tinha a lógica correta mas nunca foi aplicada ao banco de desenvolvimento.

### Solução Aplicada

1. **Atualizada constraint no banco:**

```sql
ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS funcionarios_clinica_check;
ALTER TABLE funcionarios ADD CONSTRAINT funcionarios_clinica_check CHECK (
    clinica_id IS NOT NULL
    OR tomador_id IS NOT NULL
    OR perfil IN ('emissor', 'admin', 'gestao')
) NOT VALID;
```

2. **Criada migration 073** para documentar a correção.

---

## Problema 2: Gestor RH não consegue criar empresas

### Sintoma

```
Error: Clínica não identificada na sessão
requireClinica: Falha ao mapear clínica via tomador_id: Clínica não identificada na sessão
```

### Causa Raiz

O tomador 10 (tipo 'clinica') **não tinha registro correspondente na tabela `clinicas`**.

A query de fallback em `requireClinica()` buscava:

```sql
SELECT id, ativa FROM clinicas WHERE tomador_id = $1
```

Mas não encontrava nada porque o registro estava ausente.

### Solução Aplicada

1. **Criado registro da clínica:**

```sql
INSERT INTO clinicas (tomador_id, nome, cnpj, email, telefone, endereco, ativa)
VALUES (10, 'SERVMEDOcip', '09110380000191', 'jiiohoi@hiuhiu.com',
        '(87) 98464-6664', 'R. Waldemar Kost, 1130 - Curitiba/PR - 81630-180', true)
RETURNING id; -- retornou id = 3
```

2. **Melhorada lógica de `requireClinica()` em [lib/session.ts](c:/apps/QWork/lib/session.ts#L306-L360):**
   - Agora busca também o `tipo` do tomador
   - Valida se é realmente do tipo 'clinica'
   - Mensagens de erro mais específicas para diagnóstico

---

## Problema 3: Trigger de auditoria exige user_perfil NOT NULL

### Sintoma

```
error: o valor nulo na coluna "user_perfil" da relação "audit_logs" viola a restrição de não-nulo
função PL/pgSQL audit_trigger_func() linha 31 em comando SQL
```

### Causa Raiz

A função `audit_trigger_func()` usa `current_user_perfil()` para popular `user_perfil` em `audit_logs`.  
Quando operações são feitas via `query()` direto (sem `queryWithContext()`), o contexto não é setado e a função retorna NULL, violando a constraint NOT NULL.

### Solução Aplicada

1. **Atualizado trigger para usar NULLIF:**

```sql
CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS trigger AS $function$
BEGIN
    -- Para INSERT:
    INSERT INTO public.audit_logs (user_cpf, user_perfil, ...)
    VALUES (
        NULLIF(current_user_cpf(), ''),
        NULLIF(current_user_perfil(), ''),  -- ← Permite NULL
        ...
    );
END;
$function$;
```

2. **Alterada coluna para permitir NULL:**

```sql
ALTER TABLE audit_logs ALTER COLUMN user_perfil DROP NOT NULL;
```

3. **Criada migration 074** para documentar a correção.

---

## Problema 4: Gestor RH não validado em queryWithContext

### Sintoma

```
[validateSessionContext] Funcionário não encontrado: CPF=04703084945, Perfil=rh
Error: Contexto de sessão inválido: usuário não encontrado ou inativo
```

### Causa Raiz

O gestor RH (tomador_id=10, tipo 'clinica') não tinha registro na tabela `funcionarios`.  
A função `validateSessionContext()` buscava apenas em `funcionarios`, não considerando gestores que existem apenas em `entidades_senhas`.

### Solução Aplicada

1. **Criado registro do gestor RH:**

```sql
INSERT INTO funcionarios (cpf, nome, email, perfil, ativo, clinica_id, tomador_id, senha_hash)
VALUES ('04703084945', 'Tani K', 'dsoijoi@hihi.com', 'rh', true, 3, 10, '[hash]')
RETURNING id; -- retornou id = 16
```

2. **Melhorada lógica de `validateSessionContext()` em [lib/db-security.ts](c:/apps/QWork/lib/db-security.ts#L25-L100):**
   - Para perfil 'rh': busca primeiro em `funcionarios`, depois em `entidades_senhas` (gestores de clínica)
   - Para perfil 'gestor': busca apenas em `entidades_senhas`
   - Para demais perfis: busca apenas em `funcionarios`

---

## Arquivos Alterados

- ✅ [database/migrations/073_fix_funcionarios_clinica_check_tomador.sql](c:/apps/QWork/database/migrations/073_fix_funcionarios_clinica_check_tomador.sql) - Constraint para aceitar tomador_id
- ✅ [database/migrations/074_fix_audit_trigger_allow_null_perfil.sql](c:/apps/QWork/database/migrations/074_fix_audit_trigger_allow_null_perfil.sql) - Trigger permite user_perfil NULL
- ✅ [database/migrations/013b_create_nivel_cargo_enum_column.sql](c:/apps/QWork/database/migrations/013b_create_nivel_cargo_enum_column.sql) - Migration idempotente para criar enum `nivel_cargo_enum` e coluna `funcionarios.nivel_cargo` em ambientes de teste
- ✅ [database/migrations/013c_modify_nivel_cargo_constraint_remove_rh.sql](c:/apps/QWork/database/migrations/013c_modify_nivel_cargo_constraint_remove_rh.sql) - Remove `nivel_cargo` para perfis que não devem tê-lo (`rh`, `gestor`) e ajusta constraint para exigir `nivel_cargo` apenas para `perfil = 'funcionario'`
- ✅ [lib/session.ts](c:/apps/QWork/lib/session.ts#L306-L360) - Melhorada função `requireClinica()`
- ✅ [lib/db-security.ts](c:/apps/QWork/lib/db-security.ts#L25-L100) - Melhorada validação de contexto para RH
- ✅ Banco de dados: constraints atualizadas + registros criados

---

## Ação Requerida

⚠️ **O usuário RH precisa fazer logout e login novamente** para que o `clinica_id` seja carregado corretamente na sessão.

Após o re-login, a sessão terá:

```typescript
{
  cpf: '04703084945',
  nome: 'Tani K',
  perfil: 'rh',
  tomador_id: 10,
  clinica_id: 3  // ← Agora será populado no login
}
```

---

## Testes

Para testar:

1. **Funcionário de entidade:**

```bash
# Deve funcionar agora (tomador_id=9, clinica_id=NULL, entidade_id=9)
curl -X POST http://localhost:3000/api/entidade/funcionarios \
  -H "Cookie: bps-session=..." \
  -d '{"cpf":"82030097004","nome":"Teste","...","tomador_id":9}'
```

2. **Empresa de clínica:**

```bash
# Após re-login, deve funcionar (clinica_id=3 estará na sessão)
curl -X POST http://localhost:3000/api/rh/empresas \
  -H "Cookie: bps-session=..." \
  -d '{"nome":"Empresa Teste","cnpj":"...","clinica_id":3}'
```

---

## Prevenção Futura

1. **Sempre aplicar migrations em ordem** (usar script de setup ou sequencial)
2. **Garantir criação de registro `clinicas` ao aprovar tomador tipo 'clinica'**
3. **Criar registro em `funcionarios` para gestores RH** ou ajustar lógica para aceitar gestores apenas em `entidades_senhas`
   - Observação: os perfis de gestão **não devem receber** `nivel_cargo`. Em particular, `perfil = 'rh'` e `perfil = 'gestor'` devem ter `nivel_cargo = NULL`.
4. **Usar `queryWithContext()` quando possível** para popular contexto de auditoria
5. **Manter audit_logs.user_perfil como NULL-able** para operações sem contexto
