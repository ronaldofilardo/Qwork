# Organização de Scripts

Este diretório contém todos os scripts utilitários do projeto QWork, organizados por categoria.

## Estrutura de Pastas

### 🔍 `/checks`

Scripts de verificação e diagnóstico:

- Verificação de estrutura do banco de dados
- Checagem de integridade de dados
- Validação de configurações
- **Exemplos:** `check-db-status.cjs`, `check-entities.cjs`, `check-structure.cjs`

### 🧪 `/tests`

Scripts de teste ad-hoc (não são testes Jest/Cypress):

- Testes manuais de APIs
- Testes de login e autenticação
- Validações pontuais
- **Exemplos:** `test-login.js`, `test-api.cjs`, `test-hash.cjs`

### 🔧 `/fixes`

Scripts de correção e migração de dados:

- Correções de senhas
- Fixes de enums e constraints
- Correções pontuais de dados
- **Exemplos:** `fix-senha.js`, `fix-enums.cjs`, `debug-login.cjs`

### 📊 `/analysis`

Scripts de análise e relatórios:

- Análise de planos
- Métricas e estatísticas
- **Exemplos:** `analyze-plans.cjs`, `analyze-plans-simple.cjs`

### ⚙️ `/batch`

Scripts em lote (PowerShell/Batch):

- Automações do Windows
- Execuções em lote

### 🔐 `/security`

Scripts relacionados à segurança:

- Verificações de integridade
- Auditorias de segurança

### 📦 `/migrations`

Scripts de migração de banco de dados:

- Migrações SQL
- Scripts de atualização de schema

### 🛠️ `/tools`

Ferramentas e utilitários gerais:

- Geradores
- Conversores
- Helpers diversos

### 🔄 `/updates`

Scripts de atualização e manutenção:

- Atualizações de dados
- Sincronizações

### ✅ `/verification`

Scripts de verificação pós-deploy:

- Validação de ambiente
- Verificação de dados

### 🧹 `/cleanup`

Scripts de limpeza:

- Remoção de dados de teste
- Limpeza de logs

### 💾 `/sql`

Scripts SQL diversos:

- Consultas úteis
- Patches SQL

### 📝 `/test-data`

Scripts para geração de dados de teste

### 🐛 `/debug`

Scripts de debug e diagnóstico avançado

### 🏭 `/powershell`

Scripts PowerShell principais:

- `setup-databases.ps1` - Configuração inicial dos bancos
- `sync-dev-to-prod.ps1` - Sincronização dev → prod

## Convenções

### Nomenclatura

- `check-*.{js,cjs,mjs}` → `/checks`
- `test-*.{js,cjs,mjs}` → `/tests` (ad-hoc, não Jest)
- `fix-*.{js,cjs,mjs}` → `/fixes`
- `analyze-*.{js,cjs,mjs}` → `/analysis`
- `*.sql` específicos → pasta apropriada
- Scripts temporários `temp_*` ou `temp-*` → **NÃO devem ser commitados**

### Boas Práticas

1. **Documentar** o propósito no cabeçalho do script
2. **Testar** antes de commitar
3. **Não commitar** scripts temporários ou específicos de ambiente local
4. **Usar** pastas apropriadas para cada tipo de script
5. **Remover** scripts obsoletos após validação

## Scripts de Destaque

### Setup Inicial

```powershell
# Executar como Admin - cria bancos dev e test
.\powershell\setup-databases.ps1
```

### Verificações Comuns

```bash
# Verificar status do banco
node scripts/checks/check-db-status.cjs

# Verificar estrutura completa
node scripts/checks/check-full-state.cjs
```

### Sincronização Dev → Prod

```powershell
# Exporta dev e importa para Neon
.\powershell\sync-dev-to-prod.ps1
```

## Manutenção

Ao criar novos scripts:

1. Identifique a categoria apropriada
2. Use nomenclatura consistente
3. Adicione comentários explicativos
4. Teste em ambiente de desenvolvimento
5. Documente parâmetros necessários
6. Não hardcode credenciais (use variáveis de ambiente)

## Arquivos Removidos na Limpeza (2025-12-24)

Arquivos temporários e obsoletos removidos:

- `temp_*.{js,sql,cjs}` (9 arquivos)
- `temp-*.{js,cjs}` (3 arquivos)
- `*.bak` (3 arquivos)
- Testes duplicados `.js` quando existia `.ts` equivalente

Esses tipos de arquivos agora são ignorados pelo Git (ver `.gitignore`).
