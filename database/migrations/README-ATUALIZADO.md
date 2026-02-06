# Database Migrations - README

## 📋 Visão Geral

Este diretório contém as migrações de banco de dados do sistema QWork.

**Última Higienização:** 31/01/2026  
**Total de Migrações Ativas:** ~230 arquivos  
**Sistema de Controle:** Manual (recomendado migrar para Prisma Migrate)

---

## 📁 Estrutura de Pastas

```
database/migrations/
├── *.sql                    # Migrações ativas (numeradas)
├── README.md               # Este arquivo
├── ANALISE-MIGRACAO-31-01-2026.md  # Relatório de análise completo
├── tests/                  # Migrações específicas de teste
│   ├── 004_test_rls_rbac_fixes.sql
│   ├── 071_add_missing_columns_for_test_sync.sql
│   └── ... (9 arquivos)
├── deprecated/             # Migrações obsoletas/duplicadas
│   ├── *encoding duplicates*
│   ├── *functional duplicates*
│   ├── *admin cleanup old versions*
│   └── ... (40+ arquivos)
├── scripts/                # Scripts de execução (CJS/MJS)
│   ├── final-migration.cjs
│   └── run-migration-042.cjs
├── consolidated/           # Migrações consolidadas (futuro)
└── archived/               # Migrações antigas arquivadas (futuro)
```

---

## 🔢 Sistema de Numeração

### Padrão Atual

```
NNN_<descricao_snake_case>.sql

Onde:
- NNN: Número sequencial (001-999)
- descricao: Descrição em snake_case

Exemplos:
- 001_security_rls_rbac.sql
- 050_create_contratos_table.sql
- 114_consolidate_rls_funcionarios.sql
```

### Sequências Especiais

- **000-199:** Migrações principais (evolutivas)
- **200-299:** Grandes refatorações (fase 1, fase 2, etc)
- **996-999:** Consolidações críticas e emergenciais
- **1000+:** Sistema legado (mover para deprecated)

---

## ✅ Higienização Realizada (31/01/2026)

### Ações Executadas

#### 1. Organização Estrutural

- ✅ Criadas pastas: `tests/`, `deprecated/`, `scripts/`, `consolidated/`, `archived/`
- ✅ Movidos 9 arquivos de teste para `tests/`
- ✅ Movidos 2 scripts CJS para `scripts/`

#### 2. Resolução de Duplicatas

- ✅ Encoding duplicates: Mantidas versões UTF-8, movidas versões antigas
  - `001_security_rls_rbac.sql` (OLD) → deprecated, renomeada UTF-8
  - `030_protecao_senhas_critica.sql` (OLD + ASCII) → deprecated, renomeada UTF-8
  - `062_add_calcular_elegibilidade_lote_contratante.sql` (OLD + clean) → deprecated

- ✅ Duplicatas funcionais: Mantidas versões principais/clean
  - `104_add_data_nascimento_funcionarios.sql` → deprecated (mantida 071)
  - `105_add_contratante_id_to_funcionarios.sql` → deprecated (mantida 108)
  - `206_add_gestor_role.sql` (OLD) → deprecated, renomeada clean
  - `207_add_current_user_contratante_id_helper.sql` (OLD) → deprecated, renomeada clean
  - `063_5_add_current_user_contratante_id_function.sql` → deprecated (mantida 207)
  - `211_create_dba_maintenance_role.sql` (OLD) → deprecated, renomeada neon

#### 3. Arquivamento de Obsoletos

- ✅ Emissão automática (6 arquivos):
  - `011_add_auto_emitir_em.sql`
  - `096_desabilitar_emissao_automatica_trigger.sql`
  - `097_remover_campos_emissao_automatica.sql`
  - `024_limpar_legado_emissao_automatica.sql`
  - `221_remove_obsolete_auto_emission.sql`
  - `080_add_liberada_status.sql.DESCONTINUADA`

- ✅ Admin RLS cleanups (8 arquivos antigos → mantida apenas 209):
  - `005_remove_admin_empresas_policies.sql`
  - `018_remove_admin_laudos_permissions.sql`
  - `020_remove_admin_operational_rls.sql`
  - `021_cleanup_admin_role_permissions.sql`
  - `022_remove_admin_funcionarios_policies.sql`
  - `023_remove_all_admin_operational_rls.sql`
  - `024_cleanup_final_admin_policies.sql`
  - `025_remove_remaining_admin_policies.sql`

- ✅ Arquivos ad-hoc (13 arquivos):
  - `insert_senha.sql`
  - `fix_add_link_enviado_em.sql`
  - `allow-hash-backfill.sql`
  - `add-gestor-entidade-constraints.sql`
  - `APLICAR-096-SE-NECESSARIO.sql`
  - `apply_migrations_manual.sql`
  - `apply-all-fixes.sql`
  - `apply-gestor-entidade-role.sql`
  - `fix-contratantes-sync-status-ativa.sql`
  - `fix-disable-obsolete-contract-triggers.sql`
  - `fix-funcionarios-clinica-check-allow-empresa.sql`
  - `fix-missing-clinicas.sql`
  - `fix-remove-obsolete-contract-trigger.sql`

### Resultado

- **Antes:** 282 arquivos SQL + 2 CJS na pasta principal
- **Depois:** ~230 arquivos SQL na pasta principal, ~50+ em deprecated, 9 em tests, 2 em scripts

---

## 📊 Categorias de Migrações

### Segurança & Autenticação

- RLS/RBAC: 001, 002, 004, 029, 063, 064, 114, 201, 209, 210, 213
- Senhas: 030, 20260126
- Auditoria: 003, 013, 016, 043, 046, 067, 074, 076, 077, 078

### Estrutura de Dados

- **Contratantes:** 003, 031-033, 053, 084, 086-087, 091, 115
- **Funcionários:** 009, 068-074, 082, 093, 100-103, 108-110, 202-203
- **Empresas/Clínicas:** 011, 042, 055, 201, 212
- **Lotes:** 000, 061, 220
- **Avaliações:** 007, 013, 081, 113, 205
- **Laudos:** 004, 013, 017, 065, 070, 079, 081, 091-093, 112, 1002

### Integrações & Fluxos

- **Pagamentos:** 007, 021, 026, 028, 030, 041-044, 047-048, 052-054, 106-107
- **Contratos:** 004-006, 009, 021, 050-054, 084
- **Fila de Emissão:** 007b, 070, 101, 997-998
- **Recibos:** 041-044, 107-108

### Notificações

Sistema: 008, 010, 015, 023, 034, 076

### Performance & Manutenção

- **Índices:** 014, 017, 060, 222
- **Views:** 007e, 008, 010-011, 016, 042, 044, 066, 076
- **Funções:** 006, 054, 063, 080, 092, 094, 207
- **Triggers:** 007c, 026, 047-048, 057-059, 072, 074, 079

---

## 🚀 Como Usar

### Aplicar Migrações Manualmente

```bash
# Com psql (Produção)
psql -U postgres -h localhost -p 5432 -d nr-bps_db \
  -f database/migrations/NNN_nome_migracao.sql

# Com psql (Teste)
psql -U postgres -h localhost -p 5432 -d nr-bps_db_test \
  -f database/migrations/NNN_nome_migracao.sql
```

### Verificar Migrações Aplicadas

**Nota:** O sistema atual não possui tabela de controle de migrações.

**Recomendação:** Implementar sistema de controle:

```sql
-- Criar tabela de controle
CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(255) PRIMARY KEY,
  applied_at TIMESTAMP DEFAULT NOW(),
  checksum VARCHAR(64),
  description TEXT,
  execution_time_ms INTEGER,
  applied_by VARCHAR(255)
);
```

---

## ⚠️ Boas Práticas

### ✅ FAZER

- Numerar sequencialmente (próximo número disponível)
- Usar snake_case na descrição
- Testar em ambiente de desenvolvimento primeiro
- Documentar breaking changes no arquivo
- Criar migrations idempotentes (usar `IF NOT EXISTS`, `IF EXISTS`)
- Fazer backup antes de aplicar em produção

### ❌ NÃO FAZER

- Editar migrações já aplicadas
- Renumerar migrações existentes
- Aplicar migrações fora de ordem
- Misturar múltiplas funcionalidades em uma migração
- Criar migrações sem numeração

### 📝 Template de Nova Migração

```sql
-- Migration NNN: <Título Descritivo>
-- Data: YYYY-MM-DD
-- Descrição: <Explicação detalhada do que a migração faz>
-- Breaking Changes: <Se houver, descrever>
-- Dependências: <Migrações que devem estar aplicadas antes>

BEGIN;

-- Seu código SQL aqui
-- Use comentários para explicar seções complexas

-- Exemplo:
-- 1. Adicionar nova coluna
ALTER TABLE tabela
  ADD COLUMN IF NOT EXISTS nova_coluna VARCHAR(255);

-- 2. Criar índice
CREATE INDEX IF NOT EXISTS idx_tabela_coluna
  ON tabela(nova_coluna);

-- 3. Adicionar constraint
ALTER TABLE tabela
  ADD CONSTRAINT chk_tabela_coluna
  CHECK (nova_coluna IS NOT NULL);

COMMIT;

-- Rollback (opcional, mas recomendado)
-- BEGIN;
-- ALTER TABLE tabela DROP COLUMN IF EXISTS nova_coluna;
-- COMMIT;
```

---

## 🔍 Troubleshooting

### Erro: "migration already applied"

- Verificar se a migração está na tabela de controle
- Se necessário, criar migração de correção (não editar a original)

### Erro: "constraint already exists"

- Usar `IF NOT EXISTS` em CREATE
- Usar `IF EXISTS` em DROP
- Verificar estado atual do banco antes de aplicar

### Erro: "syntax error"

- Validar SQL em ambiente de teste
- Verificar encoding do arquivo (UTF-8)
- Verificar se há caracteres especiais problemáticos

---

## 📞 Suporte

### Documentação Adicional

- **Análise Completa:** Ver `ANALISE-MIGRACAO-31-01-2026.md`
- **Histórico de Mudanças:** Ver commits no Git
- **Schema Atual:** Consultar `database/schema-complete.sql` (se existir)

### Próximos Passos Recomendados

1. ✅ Implementar tabela de controle `schema_migrations`
2. ⬜ Migrar para Prisma Migrate ou similar
3. ⬜ Criar CI/CD para validação automática
4. ⬜ Consolidar migrações < 200 em arquivo único
5. ⬜ Documentar dependências entre migrações
6. ⬜ Criar scripts de rollback para migrações críticas

---

## 📝 Log de Mudanças

### 2026-01-31 - Higienização Massiva

- Reorganização estrutural completa
- Resolução de 30+ duplicatas
- Arquivamento de 50+ arquivos obsoletos
- Criação de estrutura de pastas organizada
- Documentação atualizada

### Anterior

- Ver histórico no Git para mudanças anteriores

---

**Mantido por:** Equipe QWork  
**Última Atualização:** 31/01/2026
