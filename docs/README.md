# Documentação do Projeto Qwork

Esta pasta contém toda a documentação organizada por categoria.

## Estrutura

### Geral

- `SOBRE-COPSOQ.md` - Informações sobre o questionário COPSOQ
- `GUIA-DE-USO.md` - Guia completo de uso do sistema
- `ESTRUTURA-ARQUIVOS.md` - Estrutura de arquivos do projeto

### Desenvolvimento

- `DEVELOPMENT_GUIDE.md` - Guia de desenvolvimento
- `DATABASE_SETUP.md` - Configuração do banco de dados
- `GUIA-RAPIDO-RLS.md` - Guia rápido sobre RLS
- `README-RLS.md` - Documentação completa sobre Row Level Security

### checklists/

- `CHECKLIST.md` - Lista de verificação geral do projeto

### improvements/

- `MELHORIAS-UX-NOTIFICACOES.md` - Melhorias de UX e notificações
- `MELHORIA-EXIBICAO-CONDICIONAL-BOXES.md` - Melhorias na exibição condicional

### process/

- `SINCRONIZACAO-DEV-PROD.md` - Processo de sincronização dev/prod
- `fluxograma-termos-privacidade.md` - Fluxograma de termos e privacidade

### reports/

- `RELATORIO-SINCRONIZACAO.md` - Relatório de sincronização
- `RESUMO-EXECUTIVO.md` - Resumo executivo
- `RESUMO-IMPLEMENTACOES-2025-01-23.md` - Resumo de implementações
- `TESTS-IMPLEMENTATION-REPORT.md` - Relatório de implementação de testes
- `RELATORIO-AUTO-FIX-TESTES.md` - Relatório de correções automatizadas (moved to `docs/reports`)
- `IMPLEMENTATION_SUMMARY.md` - Resumo executivo da solução de quality (moved to `docs/reports`)
- `RELATORIO_IMPLEMENTACAO.md` - Relatório de implementação das migrations de segurança (moved to `docs/reports`)

### testing/

- `TESTS.md` - Documentação de testes

### Segurança e Políticas

- `RBAC_PERMISSIONS.md` - Documentação completa de permissões RBAC
- `RLS-POLICIES-REVISION.md` - Revisão de políticas RLS
- `RLS-POLICIES-REVISION-V3.md` - Revisão v3 das políticas RLS
- `RESUMO-VISUAL-RLS.md` - Resumo visual do RLS
- `EXAMPLE-API-ROUTES-RLS.ts` - Exemplos de rotas API com RLS
- `db-security-integration-guide.ts` - Guia de integração de segurança DB
- `SECURITY-VALIDATIONS-README.md` - Validações adicionais de segurança (moved to `docs/security`)
- `README_SECURITY_MIGRATION.md` - Documentação da migration (moved to `docs/security`)

### quality/

- `QUALITY_SOLUTION_README.md` - Resumo da solução de quality (moved to `docs/quality`)
- `QUALITY_BASELINE_PLAN.md` - Plano de baseline de qualidade
- `CI_CONFIGURATION_GUIDE.md` - Guia de configuração CI para quality

### Implementações Específicas

- `CORRECAO-CLASSIFICACAO-RISCO.md` - Correção de classificação de risco
- `CORRECAO-LISTAGEM-GRUPOS-ALTO-RISCO.md` - Correção de listagem de grupos de alto risco

### Ferramentas & Scripts

- `scripts/powershell/` - PowerShell helpers e scripts de correção (movidos da raiz)
- `scripts/tools/` - Utilitários Node/CI e scripts auxiliares (movidos da raiz)
- `scripts/sql/` - Scripts SQL utilitários e one-off

## Convenções

- Arquivos seguem padrão kebab-case
- Documentos incluem data quando relevante
- Manter estrutura organizada por categoria
- Atualizar este README ao adicionar novos documentos
