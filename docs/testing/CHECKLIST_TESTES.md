# Checklist de Testes para Migrations 410 e 420

## Migration 410: Enforce usuarios-only

### ✅ Testes Obrigatórios

1. **Teste de Constraint**: Tentativa de inserir admin/emissor/gestor em `funcionarios` deve falhar

   ```powershell
   pnpm test __tests__/database/enforce-usuarios-only.test.ts
   ```

2. **Teste de Trigger**: Mensagem de erro deve ser clara e direcionar para `usuarios`

   ```powershell
   pnpm test __tests__/database/trigger-prohibited-roles.test.ts
   ```

3. **Teste de Criação de Contas**: Criação de admin/gestor/emissor deve criar em `usuarios`
   ```powershell
   pnpm test __tests__/lib/criarContaResponsavel
   ```

### ⚠️ Testes Opcionais (mas recomendados)

4. **Teste de RLS/RBAC**: Verificar que políticas de acesso ainda funcionam
   ```powershell
   pnpm test __tests__/security/rls-rbac.test.ts
   ```

---

## Migration 420: Rename tomadores → entidades

### ✅ Testes Obrigatórios

1. **Teste de Rename de Tabelas**: Verificar que `entidades` e `entidades_senhas` existem

   ```powershell
   pnpm test __tests__/database/rename-tomadores.test.ts
   ```

2. **Teste de Foreign Keys**: Verificar que FKs foram atualizadas corretamente

   ```powershell
   pnpm test __tests__/database/fk-entidades.test.ts
   ```

3. **Teste de API**: Verificar que endpoints `/api/admin/entidades` funcionam

   ```powershell
   pnpm test __tests__/api/admin-entidades.test.ts
   ```

4. **Teste de Criação de Entidades**: Verificar fluxo completo de registro
   ```powershell
   pnpm test __tests__/registration/cadastro-entidade.test.ts
   ```

### ⚠️ Testes Opcionais (mas recomendados)

5. **Teste de Senhas**: Verificar que `entidades_senhas` funciona corretamente

   ```powershell
   pnpm test __tests__/seguranca/protecao-senhas.test.ts
   ```

6. **Teste de RLS para Entidades**: Verificar isolamento por entidade
   ```powershell
   pnpm test __tests__/security/rls-contratacao.test.ts
   ```

---

## Testes de Regressão

### ✅ Suite Mínima (rodar após migrations)

```powershell
# Suite completa (se autorizado)
pnpm test

# Ou apenas testes críticos
pnpm test __tests__/database
pnpm test __tests__/registration
pnpm test __tests__/api
```

---

## Validação Manual

### Migration 410

1. Conectar ao banco e tentar inserir admin em funcionarios:

   ```sql
   -- Este comando DEVE FALHAR
   INSERT INTO funcionarios (cpf, nome, usuario_tipo, senha_hash, ativo, criado_em, atualizado_em)
   VALUES ('99999999999', 'Test Admin', 'admin', 'hash', true, NOW(), NOW());
   ```

2. Verificar constraint:

   ```sql
   SELECT conname, pg_get_constraintdef(oid)
   FROM pg_constraint
   WHERE conname = 'no_account_roles_in_funcionarios';
   ```

3. Verificar trigger:
   ```sql
   SELECT tgname FROM pg_trigger WHERE tgname = 'trg_reject_prohibited_roles';
   ```

### Migration 420

1. Verificar rename de tabelas:

   ```sql
   SELECT tablename FROM pg_tables WHERE tablename IN ('entidades', 'entidades_senhas');
   ```

2. Verificar rename de colunas:

   ```sql
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'usuarios' AND column_name = 'entidade_id';
   ```

3. Verificar FKs:
   ```sql
   SELECT conname, conrelid::regclass, confrelid::regclass
   FROM pg_constraint
   WHERE conname LIKE '%entidade%';
   ```

---

## Critérios de Aprovação

✅ **Migration 410 aprovada se:**

- Constraint `no_account_roles_in_funcionarios` existe
- Trigger `trg_reject_prohibited_roles` existe e funciona
- Inserção de admin/emissor/gestor em funcionarios falha com erro claro
- Criação de contas do sistema usa tabela `usuarios`

✅ **Migration 420 aprovada se:**

- Tabelas `entidades` e `entidades_senhas` existem
- Tabelas `tomadores` e `entidades_senhas` não existem
- Colunas `entidade_id` existem em `usuarios`, `clinicas`, `entidades_senhas`
- FKs apontam para `entidades(id)`
- Código e testes atualizados funcionam

---

## Ordem de Execução Recomendada

1. **Aplicar migrations** (`scripts/apply-migrations-410-420.ps1`)
2. **Validação manual rápida** (queries SQL acima)
3. **Testes obrigatórios Migration 410**
4. **Testes obrigatórios Migration 420**
5. **Revisão de código atualizado**
6. **Testes de regressão (suite mínima)**
7. **Aprovação final**

---

## Em Caso de Falha

### Migration 410 falhou:

- Revisar logs da migration
- Verificar se `usuario_tipo_enum` existe
- Verificar se tabela `funcionarios` tem coluna `usuario_tipo`

### Migration 420 falhou:

- Verificar se tabelas antigas existem
- Verificar se há dados nas tabelas (não deveria ter)
- Executar migration manualmente linha por linha

### Testes falharam:

- Revisar erro específico
- Verificar se migration foi aplicada corretamente
- Atualizar código/testes conforme necessário

---

## Notas Importantes

⚠️ **Não rodar suite completa** conforme solicitado pelo usuário
⚠️ **Migrations são idempotentes** - podem ser executadas múltiplas vezes
⚠️ **Banco está vazio** - não há risco de perda de dados
⚠️ **Não criar branches** - trabalhar direto na main conforme solicitado
