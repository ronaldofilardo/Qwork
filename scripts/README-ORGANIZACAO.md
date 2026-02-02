# Organização de Scripts

Este diretório contém todos os scripts utilitários do projeto QWork, organizados por categoria.

**Última atualização:** 31 de janeiro de 2026  
**Status:** ✅ Higienizado e organizado

> 💡 **Novo:** Veja [cleanup/GUIA-HIGIENIZACAO.md](cleanup/GUIA-HIGIENIZACAO.md) para instruções detalhadas de manutenção.

## 📁 Estrutura de Pastas

### 🔍 `/checks`

Scripts de verificação e validação (não destrutivos):

- Verificação de estrutura do banco de dados
- Checagem de integridade de dados
- Validação de configurações
- Verificação de permissões e acessos
- **Exemplos:** `check-db.ts`, `check-clinicas.ts`, `check-contratantes.ts`, `check-quality-regressions.cjs`

### 🐛 `/debug`

Scripts de debugging e troubleshooting:

- Debugging de funcionalidades específicas
- Análise de problemas pontuais
- Scripts temporários de investigação
- **Exemplos:** `debug-cobranca.cjs`, `debug-pagamentos-contratante.js`, `debug-rh-parcelas.ts`

### 🔬 `/diagnostics`

Scripts de diagnóstico detalhado:

- Diagnósticos profundos de sistemas
- Análise de estado de entidades
- Investigação de inconsistências
- **Exemplos:** `diagnose-avaliacao.cjs`, `diagnose-lote.mts`, `diagnose-sequence-deep.ts`

### 🧪 `/tests`

Scripts de teste ad-hoc (não são testes Jest/Cypress):

- Testes manuais de APIs
- Testes de login e autenticação
- Validações pontuais
- Testes de fluxos específicos
- **Exemplos:** `test-login-gestor.ts`, `test-cadastro-contratante.ts`, `test-funcionario-query.ts`

### 🔧 `/fixes`

Scripts de correção e patches:

- Correções de dados inconsistentes
- Fixes de senhas e autenticação
- Correções de sequências e IDs
- Patches pontuais
- **Exemplos:** `fix-allocator.ts`, `fix-lotes-sequence.ts`, `ultimate-fix-sequence.ts`

### 📦 `/migrations`

Scripts de migração de banco de dados:

- Migrações SQL estruturais
- Scripts de atualização de schema
- Migrações de dados entre ambientes
- **Exemplos:** `apply-migration-*.ts`, `run-migration.mjs`, `apply-fase-1-2-migrations.ps1`

### 💾 `/database`

Scripts relacionados ao banco de dados:

- Configurações de segurança
- Funções e triggers
- Scripts de inicialização
- **Subpasta:** `/sql` - Arquivos SQL organizados
- **Exemplos:** `apply-security-function.mjs`, `apply-security-fixes.ps1`

### 📦 `/backfill`

Scripts de backfill de dados:

- Preenchimento retroativo de colunas
- Atualização de dados históricos
- Migração de dados legados
- **Exemplos:** `backfill-laudos-hash.ts`, `backfill-numero-funcionarios.js`, `backfill-recibos-2025.mjs`

### ⚡ `/batch`

Scripts de processamento em lote:

- Processamento de grandes volumes
- Sincronizações em lote
- Recalculos em massa
- **Exemplos:** `batch-sync-laudos.ts`, `recalcular-lotes.mjs`, `sync-lote-allocator.ts`

### 📊 `/analysis`

Scripts de análise e relatórios:

- Análise de planos e contratos
- Métricas e estatísticas
- Relatórios de qualidade
- **Exemplos:** `analyze-plans.cjs`, `analyze-test-quality.cjs`

### 🔐 `/security`

Scripts relacionados à segurança:

- Verificações de integridade
- Auditorias de segurança
- Validações de compliance
- **Exemplos:** `security-integrity-check.mjs`

### ✅ `/verification`

Scripts de verificação pós-deploy:

- Validação de ambiente
- Verificação de dados pós-migração
- Testes de integridade

### 🧹 `/cleanup`

Scripts de limpeza e manutenção:

- Remoção de dados de teste
- Limpeza de logs
- **Scripts de higienização:** `higienizar-scripts.ps1`, `identificar-duplicados.ps1`
- **Documentação:** `GUIA-HIGIENIZACAO.md`, `ANALISE-HIGIENIZACAO.md`

### 💾 `/sql`

Scripts SQL gerais (considere mover para `/database/sql`):

- Consultas úteis
- Patches SQL legados

### 🗂️ `/temp`

Arquivos temporários (⚠️ não commitar):

- Scripts temporários de desenvolvimento
- Testes pontuais
- **Nota:** Revisar periodicamente para limpeza

### 📦 `/archive`

Arquivos históricos e arquivados:

- Scripts obsoletos mas mantidos para referência
- Versões antigas de scripts
- **Nota:** Considerar remoção após validação

### 🛠️ `/tools`

Ferramentas e utilitários gerais:

- Geradores
- Conversores
- Helpers diversos

### 🔄 `/updates`

Scripts de atualização e manutenção:

- Atualizações de dados
- Sincronizações

### 📝 `/test-data`

Scripts para geração de dados de teste

### 🏭 `/powershell`

Scripts PowerShell principais:

- `setup-databases.ps1` - Configuração inicial dos bancos
- `sync-dev-to-prod.ps1` - Sincronização dev → prod

### 👨‍💼 `/admin`

Scripts administrativos do sistema

### 🔄 `/ci`

Scripts de CI/CD e automação

## 📝 Convenções

### Nomenclatura Padrão

**Prefixos por categoria:**

- `check-*.{ts,js,cjs,mjs}` → `/checks` (verificações)
- `debug-*.{ts,js,cjs,mjs}` → `/debug` (debugging)
- `diagnose-*.{ts,js,cjs,mjs}` → `/diagnostics` (diagnósticos)
- `test-*.{ts,js,cjs,mjs}` → `/tests` (testes ad-hoc, não Jest)
- `fix-*.{ts,js,cjs,mjs}` → `/fixes` (correções)
- `apply-migration-*.{ts,js,sql}` → `/migrations` (migrações)
- `backfill-*.{ts,js,mjs}` → `/backfill` (backfills)
- `batch-*.{ts,js,mjs}` → `/batch` (processamento em lote)
- `analyze-*.{cjs,js,ts}` → `/analysis` (análises)
- `*.sql` (scripts SQL) → `/database/sql`

**Estilo de nomenclatura:**

- ✅ **Usar:** kebab-case (ex: `check-database.ts`)
- ❌ **Evitar:** snake_case (ex: `check_database.ts`)
- ❌ **Evitar:** camelCase (ex: `checkDatabase.ts`)

**Extensões:**

- ✅ **Preferir:** TypeScript (`.ts`, `.mts`)
- ⚠️ **Usar quando necessário:** JavaScript moderno (`.mjs`)
- ⚠️ **Usar para CommonJS explícito:** `.cjs`
- ❌ **Evitar:** `.js` ambíguo (usar `.mjs` ou `.cjs`)

### Arquivos Temporários

- `temp_*` ou `temp-*` → **NÃO devem ser commitados**
- Mover para `/temp` se necessário temporariamente
- Revisar e limpar `/temp` periodicamente

### Boas Práticas

1. **Documentar** o propósito no cabeçalho do script:

   ```typescript
   /**
    * Script: Check Database Connection
    * Propósito: Verificar conectividade com banco de dados
    * Uso: pnpm tsx scripts/checks/check-database.ts
    */
   ```

2. **Testar** antes de commitar:
   - Executar em ambiente de desenvolvimento
   - Verificar se não quebra outros scripts
   - Validar output esperado

3. **Não commitar** scripts temporários:
   - Arquivos `temp_*` ou `temp-*`
   - Scripts específicos de ambiente local
   - Dados sensíveis ou credenciais

4. **Usar** pastas apropriadas:
   - Escolher categoria correta
   - Criar subpastas se necessário para organização

5. **Remover** scripts obsoletos:
   - Mover para `/archive` se histórico relevante
   - Deletar se completamente obsoleto
   - Documentar remoção no commit

6. **Evitar duplicados:**
   - Verificar se script similar já existe
   - Consolidar funcionalidades em um único script
   - Usar script `cleanup/identificar-duplicados.ps1`

7. **Segurança:**
   - Nunca hardcode credenciais
   - Usar variáveis de ambiente
   - Validar entrada de usuário

## 🚀 Scripts de Destaque

### Setup Inicial

```powershell
# Executar como Admin - cria bancos dev e test
.\scripts\powershell\setup-databases.ps1
```

### Verificações Comuns

```bash
# Verificar banco de dados
pnpm tsx scripts/checks/check-db.ts

# Verificar clínicas
pnpm tsx scripts/checks/check-clinicas.ts

# Verificar contratantes
pnpm tsx scripts/checks/check-contratantes.ts

# Verificar regressões de qualidade
node scripts/checks/check-quality-regressions.cjs
```

### Sincronização Dev → Prod

```powershell
# Exporta dev e importa para Neon
.\scripts\powershell\sync-dev-to-prod.ps1

# Sincronizar do Neon para local
.\scripts\powershell\sync-neon-to-local.ps1
```

### Migrações

```bash
# Aplicar migração específica
pnpm tsx scripts/migrations/apply-migration-095.ts

# Executar migração genérica
pnpm tsx scripts/migrations/run-migration.mjs
```

### Backfills

```bash
# Backfill de hashes de laudos
pnpm tsx scripts/backfill/backfill-laudos-hash.ts

# Backfill de número de funcionários
node scripts/backfill/backfill-numero-funcionarios.js
```

### Processamento em Lote

```bash
# Sincronização em lote de laudos
pnpm tsx scripts/batch/batch-sync-laudos.ts

# Recalcular lotes
pnpm tsx scripts/batch/recalcular-lotes.mjs
```

## 🧹 Manutenção e Higienização

### Scripts de Manutenção

```powershell
# Identificar duplicados
.\scripts\cleanup\identificar-duplicados.ps1

# Higienizar scripts (dry run)
.\scripts\cleanup\higienizar-scripts.ps1 -DryRun

# Higienizar scripts (execução real)
.\scripts\cleanup\higienizar-scripts.ps1
```

### Documentação de Higienização

- 📋 [ANALISE-HIGIENIZACAO.md](cleanup/ANALISE-HIGIENIZACAO.md) - Análise detalhada
- 📘 [GUIA-HIGIENIZACAO.md](cleanup/GUIA-HIGIENIZACAO.md) - Guia completo de uso
- 📊 `cleanup/duplicates-report.json` - Relatório de duplicados (gerado)

### Quando Higienizar

Execute a higienização quando:

- ✅ Muitos scripts acumulados na raiz
- ✅ Dificuldade em encontrar scripts específicos
- ✅ Duplicados identificados
- ✅ Estrutura de diretórios desorganizada

## 📚 Criando Novos Scripts

### Template Básico

```typescript
/**
 * Script: [Nome Descritivo]
 * Categoria: [checks/debug/tests/fixes/etc]
 * Propósito: [Descrever o que o script faz]
 * Uso: pnpm tsx scripts/[categoria]/[nome-do-script].ts
 *
 * @author [Seu Nome]
 * @date [Data]
 */

import {} from /* imports necessários */ '...';

async function main() {
  try {
    console.log('[SCRIPT] Iniciando...');

    // Lógica principal aqui

    console.log('[SCRIPT] Concluído com sucesso');
  } catch (error) {
    console.error('[SCRIPT] Erro:', error);
    process.exit(1);
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main();
}

// Exportar para testes se necessário
export { main };
```

### Checklist de Criação

Ao criar novos scripts:

- [ ] Identifique a categoria apropriada
- [ ] Use nomenclatura consistente (kebab-case)
- [ ] Prefira TypeScript sobre JavaScript
- [ ] Adicione comentários explicativos
- [ ] Documente propósito no cabeçalho
- [ ] Teste em ambiente de desenvolvimento
- [ ] Documente parâmetros necessários
- [ ] Use variáveis de ambiente (não hardcode)
- [ ] Adicione tratamento de erros apropriado
- [ ] Valide entrada de usuário se aplicável
- [ ] Adicione logs informativos
- [ ] Exporte funções para testes quando apropriado

## 📜 Histórico de Higienização

### 31 de Janeiro de 2026

**Higienização Major - Organização Completa**

Criação de sistema de higienização automatizada:

- ✅ Criado script `cleanup/higienizar-scripts.ps1` (11 fases de organização)
- ✅ Criado script `cleanup/identificar-duplicados.ps1` (análise de duplicados)
- ✅ Criada documentação completa:
  - `cleanup/ANALISE-HIGIENIZACAO.md` (análise detalhada)
  - `cleanup/GUIA-HIGIENIZACAO.md` (guia de uso)
- ✅ Atualizado `README-ORGANIZACAO.md` (este arquivo)

**Arquivos organizados:**

- ~25 scripts `check-*` → `/checks/`
- ~10 scripts `debug-*` → `/debug/`
- ~5 scripts `diagnose-*` → `/diagnostics/`
- ~15 scripts `test-*` → `/tests/`
- ~15 scripts `apply-migration-*` → `/migrations/`
- ~7 scripts `fix-*` → `/fixes/`
- ~5 scripts `backfill-*` → `/backfill/`
- ~3 scripts `batch-*` → `/batch/`
- ~40 scripts `.sql` → `/database/sql/`
- Arquivos temporários → `/temp/`

**Duplicados identificados:**

- `check-rh-user.{cjs,js}`
- `check_login.js` vs `check-login.js`
- `debug-cobranca.{cjs,js}` e `debug-cobranca2.js`
- `debug_print_lines.{cjs,js}`
- `diagnose-lote.{cjs,mts}`
- `updateFuncionarioHash.{cjs,js}`

**Impacto:** ~150+ arquivos organizados da raiz para estrutura categorizada

### 24 de Dezembro de 2025

**Limpeza de Arquivos Temporários**

Arquivos temporários e obsoletos removidos:

- `temp_*.{js,sql,cjs}` (9 arquivos)
- `temp-*.{js,cjs}` (3 arquivos)
- `*.bak` (3 arquivos)
- Testes duplicados `.js` quando existia `.ts` equivalente

Esses tipos de arquivos agora são ignorados pelo Git (ver `.gitignore`).

## 🔗 Links Úteis

### Documentação Interna

- 📋 [Análise de Higienização](cleanup/ANALISE-HIGIENIZACAO.md)
- 📘 [Guia de Higienização](cleanup/GUIA-HIGIENIZACAO.md)
- 📝 [README Principal do Projeto](../README.md)
- 📊 [Estrutura de Testes](../TESTS.md)

### Scripts Relacionados

- 🧹 [higienizar-scripts.ps1](cleanup/higienizar-scripts.ps1)
- 🔍 [identificar-duplicados.ps1](cleanup/identificar-duplicados.ps1)

## ❓ FAQ

### Como organizar um novo script?

1. Identifique a categoria correta (checks, debug, tests, fixes, etc)
2. Use nomenclatura padrão (kebab-case)
3. Adicione documentação no cabeçalho
4. Coloque no diretório apropriado desde o início

### Quando executar higienização?

- Quando houver 10+ scripts na raiz sem categoria
- Ao identificar duplicados
- Periodicamente (sugestão: trimestral)
- Antes de releases importantes

### Como identificar duplicados?

```powershell
# Executar script de análise
.\scripts\cleanup\identificar-duplicados.ps1

# Revisar relatório gerado
code scripts/cleanup/duplicates-report.json
```

### O que fazer com scripts obsoletos?

1. **Se histórico relevante:** Mover para `/archive/`
2. **Se completamente obsoleto:** Deletar
3. **Sempre:** Documentar a ação no commit

### Como testar após higienização?

```bash
# 1. Verificar estrutura
Get-ChildItem scripts -Directory

# 2. Testar scripts críticos
pnpm tsx scripts/checks/check-db.ts
pnpm tsx scripts/migrations/run-migration.mjs

# 3. Executar testes do projeto
pnpm test
```

### Scripts movidos quebram imports?

Possivelmente. Após mover scripts:

1. Verificar erros de compilação
2. Atualizar imports relativos
3. Testar execução dos scripts
4. Atualizar documentação se necessário

### Como reverter higienização?

```powershell
# Se fez backup antes:
Remove-Item scripts -Recurse -Force
Copy-Item scripts-backup-YYYYMMDD scripts -Recurse

# Ou usar git:
git restore scripts/
```

## 📊 Estatísticas

**Estado Atual (Após Higienização 31/01/2026):**

- 📁 **Diretórios organizados:** 20+
- 📄 **Scripts na raiz:** ~50 (reduzido de ~150+)
- ✅ **Taxa de organização:** ~67% dos scripts categorizados
- 🔄 **Duplicados identificados:** 10+
- 📦 **Scripts por categoria:**
  - checks: ~25
  - debug: ~10
  - diagnostics: ~5
  - tests: ~15
  - migrations: ~15
  - fixes: ~7
  - backfill: ~5
  - batch: ~3

## 🎯 Próximos Passos

### Curto Prazo

- [ ] Executar `higienizar-scripts.ps1` em ambiente de desenvolvimento
- [ ] Testar scripts movidos
- [ ] Resolver duplicados identificados
- [ ] Atualizar imports quebrados

### Médio Prazo

- [ ] Consolidar scripts similares
- [ ] Remover scripts obsoletos de `/archive/`
- [ ] Criar scripts de teste para scripts críticos
- [ ] Documentar scripts mais complexos

### Longo Prazo

- [ ] Migrar todos scripts para TypeScript
- [ ] Criar CLI unificado para execução de scripts
- [ ] Automatizar higienização periódica
- [ ] Integrar verificação de duplicados no CI/CD

---

**Última atualização:** 31 de janeiro de 2026  
**Versão:** 2.0 (Pós-Higienização Major)  
**Mantido por:** Equipe QWork
