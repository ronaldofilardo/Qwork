# Análise de Higienização do Diretório /scripts

Data: 31 de janeiro de 2026

## 📋 Resumo da Análise

O diretório `/scripts` contém aproximadamente 200+ arquivos na raiz, muitos dos quais são:

- Scripts de debug/check duplicados
- Arquivos temporários
- Scripts de migração antigos
- Arquivos com múltiplas extensões (.js, .cjs, .mjs, .ts, .mts)

## 🗂️ Estrutura Atual

### Diretórios Organizados (✅)

- `/admin` - Scripts administrativos
- `/analysis` - Scripts de análise
- `/archive` - Arquivos arquivados
- `/backfill` - Scripts de backfill de dados
- `/backups` - Backups (vazio atualmente)
- `/checks` - Scripts de verificação
- `/ci` - Scripts de CI/CD
- `/cleanup` - Scripts de limpeza
- `/database` - Scripts de banco de dados
- `/db` - Outro diretório de DB
- `/debug` - Scripts de debug
- `/diagnostics` - Diagnósticos
- `/fixes` - Correções
- `/migrations` - Migrações
- `/powershell` - Scripts PowerShell
- `/security` - Scripts de segurança
- `/sql` - Scripts SQL
- `/temp` - Arquivos temporários
- `/tests` - Testes ad-hoc
- `/tools` - Ferramentas
- `/updates` - Scripts de atualização
- `/verification` - Verificações

### Arquivos na Raiz (⚠️ Necessitam Organização)

#### 1. Arquivos Temporários (Devem ser movidos ou removidos)

- `temp_hash.ts` → mover para `/temp/`
- `checks/list-contratantes-temp.js` → mover para `/temp/`
- `fixes/temp_create_login.sql` → mover para `/temp/`
- Diretório `/temp/` completo (15 arquivos) → revisar necessidade
- Diretório `/archive/tmp/` → consolidar com `/temp/`

#### 2. Scripts de Check/Debug Duplicados na Raiz

Muitos scripts `check-*.{ts,js,cjs}` e `debug-*.{ts,js,cjs}` que deveriam estar em:

- `/checks/` para verificações
- `/debug/` para debugging
- `/diagnostics/` para diagnósticos

**Exemplos:**

- `check-all-avaliacoes.cjs` → `/checks/`
- `check-backblaze.mts` → `/checks/`
- `check-clinicas.ts` → `/checks/`
- `check-contratantes.ts` → `/checks/`
- `check-cpf.ts` → `/checks/`
- `check-data.ts` → `/checks/`
- `check-db.ts` → `/checks/`
- `check-function.cjs` → `/checks/`
- `check-get-permissions.cjs` → `/checks/`
- `check-laudo-id-mismatch.cjs` → `/checks/`
- `check-login.js` → `/checks/`
- `check-lote-2.ts` → `/checks/`
- `check-lote-5.ts` → `/checks/`
- `check-lotes-status.ts` → `/checks/`
- `check-pendentes.mjs` → `/checks/`
- `check-puppeteer-launch.ts` → `/checks/`
- `check-puppeteer.ts` → `/checks/`
- `check-quality-regressions.cjs` → `/checks/`
- `check-rh-user.cjs` → `/checks/`
- `check-rh-user.js` → `/checks/` (duplicado!)
- `check-test-database.js` → `/checks/`
- `check-trigger-function.ts` → `/checks/`
- `check-trigger-updated.ts` → `/checks/`
- `check_login.js` → `/checks/` (duplicado com nomenclatura diferente!)
- `check_try_catch.cjs` → `/checks/`

**Debug scripts:**

- `debug-cobranca.cjs` → `/debug/`
- `debug-cobranca.js` → `/debug/` (duplicado!)
- `debug-cobranca2.js` → `/debug/`
- `debug-pagamentos-contratante.js` → `/debug/`
- `debug-rh-parcelas.ts` → `/debug/`
- `debug_post_cadastro.js` → `/debug/`
- `debug_print_lines.cjs` → `/debug/`
- `debug_print_lines.js` → `/debug/` (duplicado!)

**Diagnostics:**

- `diagnose-avaliacao.cjs` → `/diagnostics/`
- `diagnose-lote-alt.cjs` → `/diagnostics/`
- `diagnose-lote.cjs` → `/diagnostics/`
- `diagnose-lote.mts` → `/diagnostics/` (duplicado!)
- `diagnose-sequence-deep.ts` → `/diagnostics/`

#### 3. Scripts de Test na Raiz (Mover para /tests/)

- `test-cadastro-contratante.ts` → `/tests/`
- `test-confirm-direct.ts` → `/tests/`
- `test-confirm-pagamento3.ts` → `/tests/`
- `test-conn.ts` → `/tests/`
- `test-env-vars.ts` → `/tests/`
- `test-findindex.cjs` → `/tests/`
- `test-funcionario-query.ts` → `/tests/`
- `test-laudo-download.mts` → `/tests/`
- `test-login-gestor.ts` → `/tests/`
- `test_create_contratante.js` → `/tests/`
- `test_flow_api.js` → `/tests/`
- `test_flow_api_multipart.js` → `/tests/`
- `dev-test-cross-platform.js` → `/tests/`
- `dev-test.bat` → `/tests/`

#### 4. Scripts de Migração (Consolidar em /migrations/)

- `apply-contratos-migration.js` → `/migrations/`
- `apply-fase-1-2-migrations.ps1` → `/migrations/`
- `apply-migration-072.mts` → `/migrations/`
- `apply-migration-091.ts` → `/migrations/`
- `apply-migration-092.ts` → `/migrations/`
- `apply-migration-093.ts` → `/migrations/`
- `apply-migration-095.ts` → `/migrations/`
- `apply-migration-200-*.sql` (múltiplos) → `/migrations/`
- `apply-migration-201-*.sql` (múltiplos) → `/migrations/`
- `apply-migrations-*.ps1` (múltiplos) → `/migrations/`
- `apply-test-migrations-admin.js` → `/migrations/`
- `run-migration.mjs` → `/migrations/`

#### 5. Scripts de Fix/Correção (Mover para /fixes/)

- `fix-*.{ts,js,sql,mts}` (múltiplos arquivos) → `/fixes/`
- `corrigir-*.{cjs,sql}` → `/fixes/`
- `force-fix-sequence.ts` → `/fixes/`
- `ultimate-fix-sequence.ts` → `/fixes/`

#### 6. Scripts de Backfill (Mover para /backfill/)

- `backfill-*.{ts,js,mjs}` na raiz → `/backfill/`
- Arquivos no `/archive/` que são backfills → `/backfill/archive/`

#### 7. Scripts de Database (Consolidar em /database/)

- `apply-security-function.mjs` → `/database/`
- `apply-security-fixes.ps1` → `/database/`
- Arquivos SQL na raiz → `/database/sql/`
- Scripts `.sql` em múltiplos diretórios

#### 8. Arquivos de Documentação (Manter organizados)

- ✅ `README.md` (principal)
- ✅ `README-ORGANIZACAO.md` (deve ser atualizado)
- ✅ `README-BACKFILL-RECIBOS.md`
- ✅ `HASH-BACKFILL-README.md`

#### 9. Scripts de Lote/Batch (Consolidar)

- `run-*.{ts,mts,bat}` → revisar localização apropriada
- `recalcular-lotes.mjs` → `/batch/`
- `batch-sync-laudos.ts` → `/batch/`

#### 10. Duplicados com Extensões Diferentes

- `check-rh-user.cjs` e `check-rh-user.js`
- `check_login.js` e `check-login.js`
- `debug-cobranca.{cjs,js}` e `debug-cobranca2.js`
- `debug_print_lines.{cjs,js}`
- `diagnose-lote.{cjs,mts}`
- `updateFuncionarioHash.{cjs,js}`

## 🎯 Plano de Ação Recomendado

### Fase 1: Organização Imediata (Alta Prioridade)

1. ✅ Mover todos os scripts `check-*` para `/checks/`
2. ✅ Mover todos os scripts `debug-*` para `/debug/`
3. ✅ Mover todos os scripts `diagnose-*` para `/diagnostics/`
4. ✅ Mover todos os scripts `test-*` para `/tests/`
5. ✅ Mover scripts temporários para `/temp/`

### Fase 2: Consolidação (Média Prioridade)

1. ⏳ Consolidar scripts de migração em `/migrations/`
2. ⏳ Mover scripts de fix para `/fixes/`
3. ⏳ Organizar scripts SQL em `/database/sql/`
4. ⏳ Consolidar scripts de backfill em `/backfill/`

### Fase 3: Limpeza (Baixa Prioridade)

1. ⏳ Remover duplicados (manter versão mais recente/TypeScript)
2. ⏳ Avaliar necessidade de manter `/archive/`
3. ⏳ Limpar diretório `/temp/` de arquivos muito antigos
4. ⏳ Atualizar documentação

### Fase 4: Verificação

1. ⏳ Garantir que scripts movidos ainda funcionam
2. ⏳ Atualizar imports/paths em scripts que referenciam outros
3. ⏳ Atualizar README-ORGANIZACAO.md
4. ⏳ Criar script de verificação de integridade

## 📊 Estatísticas

- **Total de arquivos na raiz:** ~150+
- **Arquivos a mover:** ~100+
- **Duplicados identificados:** ~10+
- **Diretórios temporários:** 2 (`/temp/`, `/archive/tmp/`)
- **Scripts de check:** ~25
- **Scripts de debug:** ~10
- **Scripts de test:** ~15
- **Scripts de migração:** ~15
- **Scripts de fix:** ~20

## ⚠️ Cuidados

1. **NÃO** remover arquivos sem verificar dependências
2. **NÃO** mover scripts que estão em uso ativo sem testar
3. **SEMPRE** manter backup antes de operações de limpeza
4. **VERIFICAR** imports e referências cruzadas
5. **DOCUMENTAR** mudanças no README

## 🔍 Próximos Passos

1. Revisar esta análise
2. Aprovar plano de ação
3. Executar Fase 1 (organização)
4. Testar scripts movidos
5. Executar Fases 2-4 progressivamente
6. Atualizar documentação
