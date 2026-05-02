# GUIA RÁPIDO: Resolver Erro de Banco de Testes em Desenvolvimento

## Problema

Ao executar `pnpm dev` após rodar testes, você vê:

```
⚠️ LOCAL_DATABASE_URL aponta para o banco de testes "nr-bps_db_test"
🚨 ERRO CRÍTICO: Tentativa de usar banco de TESTES em ambiente de DESENVOLVIMENTO!
```

## Causa

Variáveis de ambiente do terminal (PowerShell) ficaram definidas após executar testes.

## Solução Rápida

### Opção 1: Usar Script de Limpeza (RECOMENDADO)

```powershell
.\scripts\clean-env-dev.ps1
```

Este script:

- Limpa `TEST_DATABASE_URL`
- Define `NODE_ENV=development`
- Inicia `pnpm dev` com ambiente correto

### Opção 2: Limpar Manualmente

```powershell
# 1. Limpar variáveis
$env:TEST_DATABASE_URL = $null
$env:NODE_ENV = "development"

# 2. Reiniciar servidor
pnpm dev
```

### Opção 3: Novo Terminal (MAIS SIMPLES)

1. **Feche o terminal atual completamente** (não apenas parar o servidor)
2. Abra um **novo terminal**
3. Execute `pnpm dev`

## Verificação

Após iniciar o servidor, você deve ver:

```
✓ Compiled successfully
🖥️ [lib/db.ts] Conectado ao banco: nr-bps_db @ localhost (ambiente: development)
```

**Sem avisos** sobre `TEST_DATABASE_URL` ou `nr-bps_db_test`.

## gestor Após Refatoração

### Como Funciona Agora

1. **Login**: Via `entidades_senhas` (igual antes)
2. **Validação**: Via `requireEntity()` → `validateGestorContext()`
3. **Queries**: Usam `queryAsGestor()` ou `query()` direta
4. **RLS**: **Não aplicado** (gestores não usam RLS)
5. **Tabelas**: Gestor **NÃO** está mais em `funcionarios`

### Endpoints de gestor

Todos os endpoints `/api/entidade/*` foram atualizados para usar:

```typescript
// Antes (ERRADO - causava erro)
const result = await queryWithContext(`SELECT ...`, [params]);

// Agora (CORRETO)
const result = await query(`SELECT ...`, [params]);
// ou
const result = await queryAsGestor(`SELECT ...`, [params]);
```

### Verificar Gestor no Banco

```sql
-- Gestor deve estar APENAS em entidades_senhas
SELECT cpf_cnpj, perfil, tomador_id, ativo
FROM entidades_senhas
WHERE perfil = 'gestor';

-- Gestor NÃO deve estar em funcionarios
SELECT * FROM funcionarios
WHERE cpf IN (
  SELECT cpf_cnpj FROM entidades_senhas
  WHERE perfil = 'gestor'
);
-- Deve retornar 0 linhas
```

## Próximos Passos (Produção)

⚠️ **IMPORTANTE**: As migrações SQL ainda precisam ser aplicadas no banco de desenvolvimento:

```bash
# 1. Backup
pg_dump "postgresql://postgres:<local_password>@localhost:5432/nr-bps_db" > backup_pre_migration.sql

# 2. Aplicar Migration 300 (RLS)
psql "postgresql://postgres:<local_password>@localhost:5432/nr-bps_db" -f database/migrations/300_update_rls_exclude_gestores.sql

# 3. Aplicar Migration 301 (Cleanup)
psql "postgresql://postgres:<local_password>@localhost:5432/nr-bps_db" -f database/migrations/301_cleanup_gestores_funcionarios.sql

# 4. Validar
psql "postgresql://postgres:<local_password>@localhost:5432/nr-bps_db" -c "
SELECT COUNT(*) as gestores_incorretos FROM funcionarios
WHERE cpf IN (
  SELECT cpf_cnpj FROM entidades_senhas
  WHERE perfil IN ('gestor', 'rh')
);"
# Deve retornar 0
```

## Dúvidas Comuns

### "Por que o erro menciona nr-bps_db_test se meu .env.local está correto?"

Porque variáveis de ambiente do terminal têm **precedência mais alta** que arquivos `.env`.

### "Preciso mudar código dos endpoints?"

**Não**. Todos os endpoints já foram corrigidos na refatoração. Você só precisa:

1. Limpar ambiente do terminal
2. Aplicar migrações SQL (quando pronto)

### "O login do gestor mudou?"

**Não**. O login continua exatamente igual. A mudança foi apenas nas **queries internas** após o login.

### "Erro: o valor nulo na coluna 'id' da relação 'lotes_avaliacao' viola restrição"

**Sintoma:**

```
INSERT INTO lotes_avaliacao (...) VALUES (...)
error: o valor nulo na coluna "id" da relação "lotes_avaliacao" viola a restrição de não-nulo
```

**Causa:**
A tabela `lote_id_allocator` está vazia. A função `fn_next_lote_id()` faz UPDATE nessa tabela, mas sem registros, retorna NULL.

**Solução Imediata:**

```bash
psql "postgresql://postgres:<local_password>@localhost:5432/nr-bps_db" -c "
  INSERT INTO lote_id_allocator (last_id) VALUES (0)
  ON CONFLICT DO NOTHING;
"
```

**Solução Permanente:**

```bash
# Aplicar Migration 302
psql "postgresql://postgres:<local_password>@localhost:5432/nr-bps_db" -f database/migrations/302_fix_lote_id_allocator.sql
```

---

## Erro: Foreign Key Violation em lotes_avaliacao (liberado_por)

### Sintomas

```
inserção ou atualização em tabela "lotes_avaliacao" viola restrição de chave estrangeira "lotes_avaliacao_liberado_por_fkey"
Chave (liberado_por)=(CPF_DO_GESTOR) não está presente na tabela "funcionarios".
```

### Causa

Após refatoração de gestores (separação de funcionarios), a FK `lotes_avaliacao.liberado_por` ainda referenciava `funcionarios(cpf)`, mas gestores agora usam `entidades_senhas`.

### Solução

**Aplicar Migration 303:**

```bash
psql "postgresql://postgres:<local_password>@localhost:5432/nr-bps_db" -f database/migrations/303_fix_lotes_avaliacao_liberado_por_fk.sql
```

Esta migration:

- Remove FK antiga para `funcionarios`
- Adiciona FK nova para `entidades_senhas(cpf)`

---

## Erro: SECURITY: app.current_user_cpf not set

### Sintomas

```
SECURITY: app.current_user_cpf not set. Call SET LOCAL app.current_user_cpf before query.
```

### Causa

Gestores bypass RLS mas triggers de auditoria ainda precisam das variáveis de sessão.

### Solução

**Atualizar lib/db-gestor.ts:**

```typescript
// Adicionar configuração de variáveis de sessão antes da query
await query('SELECT set_config($1, $2, false)', [
  'app.current_user_cpf',
  session.cpf,
]);
await query('SELECT set_config($1, $2, false)', [
  'app.current_user_perfil',
  session.perfil,
]);
```

---

**Última Atualização**: 01/02/2026  
**Documentação Completa**:

- [IMPLEMENTATION-SUMMARY.md](./IMPLEMENTATION-SUMMARY.md) - Resumo da refatoração
- [CORRECOES-LIBERACAO-LOTES-DEFINITIVO.md](./CORRECOES-LIBERACAO-LOTES-DEFINITIVO.md) - ✅ Solução definitiva para liberação de lotes

