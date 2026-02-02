# Organização do Diretório Database

**Data da Higienização:** 31 de Janeiro de 2026  
**Status:** ✅ Concluído

---

## 📊 Estrutura Organizada

```
database/
├── backups/              # Backups de banco de dados (2 arquivos)
├── deprecated/           # Migrações descontinuadas (5 arquivos)
├── fixes/                # Correções antigas mantidas (10 arquivos)
├── legacy-fixes/         # Correções legadas e scripts antigos (13 arquivos)
├── legacy-migrations/    # Migrações antigas (etapas, etc) (17 arquivos)
├── migrations/           # ⭐ PASTA PRINCIPAL - Migrações ativas (295 arquivos)
├── schemas/              # Schemas completos do banco (6 arquivos)
├── seeds/                # Seeds e dados iniciais (6 arquivos)
├── temp/                 # Arquivos temporários e ad-hoc (17 arquivos)
└── tests/                # Testes de RLS e imutabilidade (5 arquivos)
```

---

## 📁 Descrição das Pastas

### 🗄️ **backups/**

Backups completos do banco de dados para recuperação de emergência.

**Arquivos:**

- `backup-nr-bps_db-20260131_162816.sql` (570 KB)
- `backup-nr-bps_db_test-20260131_163108.sql` (3.5 MB)

**Uso:** Recuperação de desastre, rollback completo

---

### 🗂️ **schemas/**

Schemas completos consolidados para setup de novos ambientes.

**Arquivos:**

- `schema-complete.sql` - Schema completo mais recente (47 KB)
- `schema-neon-backup.sql` - Backup do Neon/produção (244 KB)
- `schema_nr-bps_db_test.sql` - Schema do banco de testes (324 KB)
- `schema-clean-final.sql` - Versão limpa (7 KB)
- `schema-clinicas-empresas.sql` - Schema parcial de clínicas
- `planos-schema.sql` - Schema de planos (12 KB)

**Uso:** Inicialização de novos ambientes, referência de estrutura

---

### 🚀 **migrations/** ⭐

**PASTA PRINCIPAL** - Contém todas as migrações ativas e organizadas.

**Subpastas:**

- `archived/` - Migrações antigas arquivadas
- `consolidated/` - Migrações consolidadas
- `deprecated/` - Migrações descontinuadas
- `scripts/` - Scripts de execução
- `tests/` - Testes específicos de migrações

**Total:** 295 arquivos

**Padrão de Nomenclatura:**

```
NNN_<categoria>_<descricao>.sql

Onde:
- NNN: 001-999 (numeração sequencial)
- categoria: security|schema|data|feature|fix|perf
- descricao: snake_case descritivo
```

---

### 🌱 **seeds/**

Dados iniciais e seeds para popular banco de desenvolvimento/teste.

**Arquivos:**

- `seed-admin-123456.sql` - Admin com senha padrão
- `seed-contratantes.sql` - Contratantes de exemplo
- `seed-users.mjs` - Script para criar usuários
- `list-users.mjs` - Script para listar usuários
- Outros seeds relacionados

**Uso:** Setup de desenvolvimento, testes

---

### 🔧 **legacy-migrations/**

Migrações antigas do sistema (antes da reorganização).

**Arquivos principais:**

- `etapa2-multi-tenancy.sql` - Multi-tenancy inicial
- `etapa3-empresas-clientes.sql` - Empresas e clientes
- `etapa4-funcionarios-empresa.sql` - Funcionários
- `etapa5-campos-funcionario.sql` - Campos extras
- `etapa14-relatorios-pdf-excel.sql` - Sistema de relatórios
- `etapa15-lotes-avaliacao.sql` - Lotes de avaliação
- `etapa16-laudos-emissor.sql` - Laudos e emissor
- `etapa-gestores-rh-unico.sql` - Gestores e RH
- `migration-001-contratantes.sql` - Contratantes base
- `migration-002-gestor-entidade.sql` - Gestor de entidade
- `migration-014-contratantes-snapshots.sql` - Snapshots
- `migration-015-contratantes-constraints.sql` - Constraints
- `migration-016-auditoria.sql` + `.utf8.sql` - Sistema de auditoria
- `migration-016-indice-avaliacao.sql` - Índice de avaliação
- `migration-017-rls.sql` - RLS inicial
- `lgpd-compliance-migration.sql` - Conformidade LGPD (12 KB)

**Total:** 17 arquivos

**⚠️ Importante:** Não aplicar diretamente. Funcionalidade já incorporada em `migrations/`.

---

### 🛠️ **legacy-fixes/**

Correções e ajustes antigos aplicados ao longo do tempo.

**Arquivos:**

- `fix-all-passwords.sql` - Correção massiva de senhas
- `fix-passwords.sql` + `fix-passwords-final.sql` - Correções de senha
- `fix-senha-gestores.sql` - Correção específica de gestores
- `fix-status-constraints.sql` - Ajustes de constraints
- `fix-detectar-anomalias-indice.sql` + `.final.sql` - Detecção de anomalias
- `fix-resultados-faltantes.mjs` - Script para resultados faltantes
- `functions-016-indice-avaliacao.sql` (4 versões: normal, clean, utf8, bak)
- `show-results.mjs` - Script para exibir resultados

**Total:** 13 arquivos

**Uso:** Referência histórica, debug

---

### 🧪 **tests/**

Scripts de teste para validar RLS, imutabilidade e integridade.

**Arquivos:**

- `test-rls-policies.sql` - Testes de RLS (14 KB)
- `test-rls-policies-fixed.sql` - Versão corrigida (9 KB)
- `test-rls-v3.sql` - Versão 3 dos testes (11 KB)
- `test-imutabilidade.sql` - Testes de imutabilidade
- `clean-test-db.sql` - Limpar banco de teste

**Uso:** Validação de segurança e integridade

---

### 📝 **temp/**

Arquivos temporários, ad-hoc e de uso único.

**Categorias:**

- **Alterações rápidas:** `add-*.sql`, `alter-*.sql`
- **Limpezas:** `cleanup-*.sql`
- **Drops:** `drop-*.sql`
- **Correções pontuais:** `correcao-*.sql`
- **Temporários:** `tmp-*.sql`, `tmp_*.sql`
- **Executores:** `run-*.sql`
- **Atualizações:** `update-*.sql`
- **Logs:** `logs-*.sql`
- **Segurança:** `security-*.sql`
- **Triggers:** `enforce-*.sql`

**Total:** 17 arquivos

**⚠️ Aviso:** Arquivos ad-hoc sem versionamento. Usar com cautela.

---

### ⚠️ **deprecated/**

Migrações e scripts descontinuados que não devem mais ser usados.

**Conteúdo:** 5 arquivos de migrações antigas da pasta `migrations/deprecated/`

**Uso:** Apenas referência histórica. **NÃO APLICAR.**

---

### 🔧 **fixes/**

Correções importantes mantidas separadamente.

**Conteúdo:** 10 arquivos de correções da pasta `migrations/fixes/`

**Uso:** Referência para correções aplicadas.

---

## 📋 Resultado da Higienização

### Antes da Higienização

- ❌ **64 arquivos** na raiz de `database/`
- ❌ Schemas, backups, seeds, tests, migrations misturados
- ❌ Nomenclatura inconsistente
- ❌ Duplicatas (encoding UTF-8, clean, normal, bak)
- ❌ Difícil navegação e manutenção

### Depois da Higienização

- ✅ **0 arquivos** na raiz de `database/`
- ✅ Organização por tipo e propósito
- ✅ Estrutura clara de pastas
- ✅ Fácil localização de arquivos
- ✅ Separação de legado vs. ativo
- ✅ Backups isolados
- ✅ Seeds organizados

---

## 🎯 Recomendações de Uso

### Para Desenvolvimento

1. **Setup inicial:** Use `schemas/schema-complete.sql`
2. **Seeds:** Execute os arquivos em `seeds/`
3. **Migrações:** Aplique arquivos em `migrations/` em ordem numérica

### Para Produção

1. **Backup primeiro:** Sempre criar backup antes de migrar
2. **Migrações ativas:** Apenas arquivos em `migrations/` (números > 200)
3. **Evitar legado:** Não aplicar nada de `legacy-*`

### Para Testes

1. **Schema de teste:** Use `schemas/schema_nr-bps_db_test.sql`
2. **Limpeza:** Use `tests/clean-test-db.sql`
3. **Validação:** Execute testes em `tests/test-*.sql`

---

## 🚨 Avisos Importantes

### ⚠️ NÃO Usar Diretamente

- `legacy-migrations/` - Funcionalidade já incorporada
- `deprecated/` - Scripts descontinuados
- `temp/` - Arquivos ad-hoc sem garantias

### ✅ Usar Com Segurança

- `migrations/` - Pasta principal, versionada
- `schemas/` - Para setup de ambientes
- `seeds/` - Para popular dados iniciais
- `tests/` - Para validação

### 📦 Manter Como Referência

- `legacy-fixes/` - Histórico de correções
- `backups/` - Recuperação de emergência

---

## 📈 Estatísticas

| Pasta              | Arquivos | Tamanho Aprox. | Status             |
| ------------------ | -------- | -------------- | ------------------ |
| migrations/        | 295      | ~2 MB          | ✅ Ativo           |
| schemas/           | 6        | ~650 KB        | ✅ Referência      |
| backups/           | 2        | ~4 MB          | ✅ Segurança       |
| legacy-migrations/ | 17       | ~100 KB        | ⚠️ Legado          |
| legacy-fixes/      | 13       | ~120 KB        | ⚠️ Legado          |
| seeds/             | 6        | ~20 KB         | ✅ Desenvolvimento |
| temp/              | 17       | ~15 KB         | ⚠️ Ad-hoc          |
| tests/             | 5        | ~50 KB         | ✅ Validação       |
| deprecated/        | 5        | ~10 KB         | ❌ Não usar        |
| fixes/             | 10       | ~30 KB         | ⚠️ Referência      |

**Total geral:** ~7 MB em 376 arquivos

---

## 🔄 Próximos Passos

1. ✅ Higienização concluída (31/01/2026)
2. ⬜ Documentar dependências entre migrações
3. ⬜ Criar script de validação de ordem de migrações
4. ⬜ Implementar CI/CD para validar migrações
5. ⬜ Consolidar migrações < 200 em um arquivo master
6. ⬜ Criar política de retenção de backups
7. ⬜ Automatizar limpeza de arquivos temporários

---

## 📞 Contato

**Higienização executada por:** GitHub Copilot  
**Data:** 31/01/2026  
**Próxima revisão:** Trimestral ou conforme necessidade

---

## 📖 Ver Também

- `/database/migrations/README.md` - Documentação de migrações
- `/database/migrations/ANALISE-MIGRACAO-31-01-2026.md` - Análise detalhada
- `/database/schemas/schema-complete.sql` - Schema completo atual
