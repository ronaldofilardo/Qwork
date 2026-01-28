# Scripts do Projeto BPS

Esta pasta contém todos os scripts utilitários organizados por categoria.

## Estrutura de Organização

### analysis/

Scripts de análise de dados e relatórios

- `analisar-*.mjs`: Análises específicas de dados
- `analise-*.mjs`: Análises gerais
- `identificar-*.mjs`: Identificação de problemas
- `investigar-*.mjs`: Investigação de issues
- `listar_*.mjs`: Scripts de listagem
- `verificar-dados-orfaos.mjs`: Verificação de dados órfãos

### checks/

Scripts de verificação e validação

- `check-*.mjs`: Verificações diversas do sistema

### cleanup/

Scripts de limpeza e manutenção

- `limpar-*.mjs`: Limpeza de dados
- `limpeza-*.mjs`: Scripts de limpeza completa
- `avaliacoes-null.mjs`: Tratamento de avaliações nulas

### debug/

Scripts de debug e troubleshooting

- `debug-*.mjs`: Scripts de debug
- `detalhes-*.mjs`: Detalhamento de informações

### fixes/

Scripts de correção e reparo

- `aplicar-*.mjs`: Aplicação de correções
- `corrigir-*.mjs`: Correções específicas
- `recriar-*.mjs`: Recriação de dados
- `fix-*.mjs`: Correções gerais

### migrations/

Scripts de migração de banco de dados

- `run_migration_*.mjs`: Execução de migrações
- `apply_migration_*.mjs`: Aplicação de migrações

### tests/

Scripts de teste e validação

- `test-*.mjs`: Scripts de teste
- `teste-*.mjs`: Testes específicos
- `criar_lote_teste.mjs`: Criação de dados de teste
- `test-emissao-automatica-dev.js`: **[NOVO]** Teste de emissão automática de laudos em desenvolvimento

### updates/

Scripts de atualização

- `update-*.mjs`: Atualizações do sistema

### verification/

Scripts de verificação

- `verificar-*.mjs`: Verificações diversas

### powershell/

Scripts PowerShell (.ps1)

- Scripts de automação e correção para Windows

### sql/

Scripts SQL

- Scripts de correção e migração SQL

## Scripts Especiais

- `validate-organization.mjs`: Valida se a organização dos arquivos está correta
- `cron-local.mjs`: Execução de tarefas cron localmente
- `quality-baseline-report.cjs`: Relatório de qualidade do código

## Como Usar

Execute os scripts a partir da raiz do projeto:

```bash
# Verificar bancos de dados
node scripts/checks/check_databases.mjs

# Executar script SQL
psql -h localhost -U postgres -d nr-bps_db -f scripts/sql/implement_audit.sql

# Executar script PowerShell
.\scripts\powershell\setup-databases.ps1
```

## Manutenção

- Mantenha scripts organizados por categoria
- Documente scripts complexos com comentários
- Remova scripts temporários após uso
- Atualize este README quando adicionar novas categorias
