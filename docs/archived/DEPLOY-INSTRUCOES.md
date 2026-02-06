# Instruções de Deploy - Melhorias do Sistema de Contratação

**Data**: 13 de janeiro de 2026
**Versão**: 2.0.0
**Branch**: refactor/modal-cadastro-contratante-domain-extraction

---

## 🚨 PRÉ-REQUISITOS

- [ ] Backup completo do banco de dados
- [ ] Ambiente de staging para testes
- [ ] Acesso PostgreSQL com permissões de ALTER TABLE
- [ ] Build aprovado (`pnpm build` sem erros)

---

## 📝 CHECKLIST DE DEPLOY

### 1. Backup do Banco de Dados

```powershell
# Backup completo
pg_dump -U postgres -d nr-bps_db > backup_pre-deploy_$(Get-Date -Format 'yyyy-MM-dd_HHmmss').sql

# Verificar tamanho do backup
Get-ChildItem backup_pre-deploy*.sql | Select-Object Name, Length
```

### 2. Executar Migrations (em ordem)

#### Migration 015 - Constraints de Integridade

```powershell
psql -U postgres -d nr-bps_db -f database/migration-015-contratantes-constraints.sql
```

**Validação**:

```sql
-- Verificar constraints criadas
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'contratantes'
AND constraint_type = 'CHECK';

-- Deve retornar:
-- chk_contratantes_ativa_pagamento
-- chk_contratantes_aprovacao_completa
-- chk_contratantes_ativa_liberacao
-- chk_contratantes_pagamento_plano
```

#### Migration 016 - Sistema de Auditoria

```powershell
psql -U postgres -d nr-bps_db -f database/migration-016-auditoria.sql
```

**Validação**:

```sql
-- Verificar tabela de auditoria
SELECT COUNT(*) FROM auditoria;

-- Verificar triggers
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'contratantes';

-- Deve retornar:
-- trg_audit_contratante_insert
-- trg_audit_contratante_update
-- trg_audit_contratante_delete
```

#### Migration 017 - Row Level Security

```powershell
psql -U postgres -d nr-bps_db -f database/migration-017-rls.sql
```

**Validação**:

```sql
-- Verificar RLS habilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true;

-- Verificar políticas
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';
```

### 3. Atualizar Dados Legados (se necessário)

```sql
-- Identificar contratantes sem pagamento_confirmado definido
SELECT id, nome, ativa, pagamento_confirmado
FROM contratantes
WHERE pagamento_confirmado IS NULL;

-- Ajustar conforme regra de negócio:
-- - Se ativa = true, assumir pagamento_confirmado = true
-- - Se ativa = false, definir pagamento_confirmado = false

UPDATE contratantes
SET
  pagamento_confirmado = CASE WHEN ativa = true THEN true ELSE false END,
  data_liberacao_login = CASE WHEN ativa = true THEN COALESCE(aprovado_em, criado_em) ELSE NULL END
WHERE pagamento_confirmado IS NULL;
```

### 4. Deploy da Aplicação

#### Ambiente Local (Dev)

```bash
# Instalar dependências
pnpm install

# Build
pnpm build

# Iniciar servidor
pnpm start
```

#### Vercel (Produção)

```bash
# Definir variáveis de ambiente na Vercel
# DATABASE_URL=<neon_connection_string>
# SESSION_SECRET=<random_secret>
# NODE_ENV=production

# Deploy
vercel --prod
```

### 5. Validações Pós-Deploy

#### Teste 1: Validação de Constraints

```sql
-- Tentar criar contratante inválido (deve falhar)
BEGIN;

INSERT INTO contratantes (tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular, ativa, pagamento_confirmado)
VALUES ('clinica', 'Teste', '12345678000199', 'teste@example.com', '1199999999', 'Rua Teste', 'São Paulo', 'SP', '01000000', 'João', '12345678900', 'joao@example.com', '11988888888', true, false);
-- Deve falhar com: violates check constraint "chk_contratantes_ativa_pagamento"

ROLLBACK;
```

#### Teste 2: Validação de Auditoria

```sql
-- Criar contratante válido
INSERT INTO contratantes (tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular, ativa, pagamento_confirmado)
VALUES ('entidade', 'Empresa Teste', '98765432000188', 'empresa@teste.com', '1199999999', 'Rua Teste 2', 'Rio de Janeiro', 'RJ', '20000000', 'Maria', '98765432100', 'maria@teste.com', '21988888888', false, false);

-- Verificar registro de auditoria
SELECT * FROM auditoria
WHERE entidade_tipo = 'contratante'
ORDER BY criado_em DESC
LIMIT 1;
-- Deve retornar registro com acao = 'criar'
```

#### Teste 3: Validação de RLS

```sql
-- Testar contexto RLS
BEGIN;

-- Definir contexto de gestor de entidade
SELECT set_rls_context('gestor', NULL, NULL, 1);

-- Tentar acessar contratante de outro (deve retornar vazio)
SELECT * FROM contratantes WHERE id = 2;

-- Acessar próprio contratante (deve funcionar)
SELECT * FROM contratantes WHERE id = 1;

ROLLBACK;
```

#### Teste 4: Validação de Login

```bash
# Tentar login com conta inativa
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "cpf": "98765432100",
    "senha": "senha123"
  }'

# Deve retornar 403: Aguardando confirmação de pagamento
```

#### Teste 5: Validação de Recibo

```bash
# Tentar gerar recibo sem contrato
curl -X POST http://localhost:3000/api/recibo/gerar \
  -H "Content-Type: application/json" \
  -d '{
    "contratante_id": 1,
    "pagamento_id": 1
  }'

# Deve retornar 400: contrato_id é obrigatório
```

---

## 🔄 ROLLBACK (se necessário)

### 1. Restaurar Banco de Dados

```powershell
# Parar aplicação
# Restaurar backup
psql -U postgres -d nr-bps_db < backup_pre-deploy_<timestamp>.sql
```

### 2. Reverter Deploy

```bash
# Vercel
vercel rollback

# Local
git checkout <commit_anterior>
pnpm install
pnpm build
```

---

## 📊 MONITORAMENTO PÓS-DEPLOY

### Métricas a Observar

1. **Performance de Queries**

   ```sql
   -- Queries mais lentas
   SELECT query, mean_exec_time, calls
   FROM pg_stat_statements
   ORDER BY mean_exec_time DESC
   LIMIT 10;
   ```

2. **Taxa de Violações de Constraint**

   ```sql
   -- Verificar logs de erro
   SELECT COUNT(*)
   FROM pg_stat_database
   WHERE datname = 'nr-bps_db';
   ```

3. **Registros de Auditoria**

   ```sql
   -- Total de eventos auditados hoje
   SELECT acao, COUNT(*)
   FROM auditoria
   WHERE criado_em >= CURRENT_DATE
   GROUP BY acao;
   ```

4. **RLS - Verificar Performance**
   ```sql
   -- Tempo médio de queries com RLS
   SELECT schemaname, tablename, idx_scan, seq_scan
   FROM pg_stat_user_tables
   WHERE schemaname = 'public';
   ```

---

## ⚠️ PONTOS DE ATENÇÃO

### 1. RLS pode impactar performance inicialmente

- Monitorar tempos de resposta
- Criar índices adicionais se necessário
- Considerar cache para queries frequentes

### 2. Auditoria gera volume de dados

- Planejar rotação de logs (ex: manter últimos 90 dias)
- Considerar tabela de arquivamento
- Monitorar crescimento do banco

### 3. Constraints podem bloquear operações legadas

- Revisar scripts de importação de dados
- Atualizar testes que criam dados mockados
- Documentar novos requisitos para desenvolvedores

---

## 📞 SUPORTE

Em caso de problemas:

1. Verificar logs da aplicação: `logs/combined.log`
2. Verificar logs do PostgreSQL: `/var/log/postgresql/`
3. Consultar auditoria: `SELECT * FROM auditoria ORDER BY criado_em DESC LIMIT 50;`
4. Verificar issues no repositório (link removido)

---

## ✅ CHECKLIST FINAL

- [ ] Migrations executadas sem erro
- [ ] Constraints validadas
- [ ] Auditoria funcionando
- [ ] RLS habilitado e testado
- [ ] Testes E2E passando
- [ ] Build aprovado
- [ ] Deploy realizado
- [ ] Validações pós-deploy OK
- [ ] Monitoramento configurado
- [ ] Documentação atualizada
- [ ] Equipe notificada

---

**Status**: 🟢 Pronto para Deploy
**Última Atualização**: 2026-01-13
