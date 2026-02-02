# 🧹 Análise de Limpeza - Pasta `/docs`

**Data:** 29 de janeiro de 2026  
**Responsável:** Sistema de Revisão  
**Status:** 📋 Relatório de Análise

---

## 📊 Resumo Executivo

Análise completa da pasta `/docs` identificou **43 documentos** que podem ser **removidos, consolidados ou arquivados**, resultando em uma redução estimada de **~40% do volume** de documentação ativa.

### Estatísticas Gerais

- **Total de arquivos MD:** ~205 arquivos
- **Candidatos à remoção:** 22 arquivos
- **Candidatos ao arquivamento:** 21 arquivos
- **Duplicações identificadas:** 8 casos
- **Tamanho estimado liberado:** ~2.5MB

---

## 🗑️ CATEGORIA 1: Documentos para REMOÇÃO (22 arquivos)

### 1.1 Correções Concluídas (Dezembro 2025)

**Justificativa:** Correções já aplicadas e validadas há mais de 1 mês. Informações preservadas no código e commits.

- [ ] `corrections/2025-12-28-cadastro-empresa-representante.md` ✅ Concluído
- [ ] `corrections/2025-12-28-remocao-admin-empresas.md` ✅ Concluído
- [ ] `corrections/2025-12-29-tela-raiz-rh-cards.md` ✅ Concluído (310 linhas)
- [ ] `corrections/correcao-fluxo-navegacao-empresas-2025-12-30.md` ✅ Concluído
- [ ] `corrections/LIMPEZA-2025-12-24.md` ✅ Concluído
- [ ] `corrections/CORRECOES-CLINICA-ROTAS-2025-12-24.md` ✅ Concluído
- [ ] `corrections/RESUMO-IMPLEMENTACAO-CORRECOES-2025-12-21.md` ✅ Concluído
- [ ] `corrections/VALIDATION-REPORT-2025-12-23.md` ✅ Concluído
- [ ] `corrections/CORRECAO-SISTEMA-PAGAMENTOS-2025-12-27.md` ✅ Concluído

**Ação recomendada:** Arquivar em `docs/archived/corrections-2025/` ou remover completamente.

---

### 1.2 Implementações Finalizadas (2024)

**Justificativa:** Implementações de 2024 já estão em produção e validadas.

- [ ] `ATUALIZACAO-EMISSOR-DASHBOARD.md` (Data: 24/12/2024)
- [ ] `reports/RESUMO-IMPLEMENTACOES-2024-12-11.md` (2024)

**Ação recomendada:** Remover ou mover para `docs/archived/implementacoes-2024/`.

---

### 1.3 Relatórios de Implementação Redundantes

**Justificativa:** Múltiplos relatórios descrevendo a mesma implementação.

#### Grupo A: Implementação Completa (3 versões do mesmo tema)

- [ ] `RESUMO-IMPLEMENTACAO-COMPLETA.md` (485 linhas)
- [ ] `implementacoes/IMPLEMENTACAO-COMPLETA.md` (461 linhas)
- [ ] `RESUMO-IMPLEMENTACAO-INDICE.md`

**Consolidar em:** Um único arquivo `docs/guides/HISTORICO-IMPLEMENTACAO-PLANO-PERSONALIZADO.md`

#### Grupo B: Emissão Automática (2 versões)

- [ ] `RELATORIO-IMPLEMENTACAO-EMISSAO-AUTOMATICA.md` (276 linhas)
- [ ] `implementacoes/IMPLEMENTACAO-COMPLETA-EMISSAO-2026-01-05.md`
- [ ] `reports/SUMARIO-EMISSAO-AUTOMATICA-2026-01-05.md`

**Consolidar em:** Um único arquivo no `guides/`.

#### Grupo C: Relatórios de Execução (duplicados)

- [ ] `reports/RESUMO-EXECUTIVO.md`
- [ ] `reports/SUMARIO-EXECUTIVO.md`
- [ ] `reports/IMPLEMENTATION_SUMMARY.md`

**Ação recomendada:** Manter apenas `RESUMO-EXECUTIVO.md` atualizado.

---

### 1.4 Documentos de PRs Antigos

**Justificativa:** PRs já mergeados há mais de 1 mês, informações no histórico do Git.

- [ ] `prs/PR-0001-remove-rascunho-and-emission-immediate.md`
- [ ] `prs/PR-0002-fix-tests-cron-and-emission.md`
- [ ] `prs/PR-0003-fixtures-and-integration-fixes.md`

**Ação recomendada:** Remover. Histórico está no GitHub.

---

## 📦 CATEGORIA 2: Documentos para ARQUIVAMENTO (21 arquivos)

### 2.1 Correções de Janeiro 2026 (manter até março 2026)

**Justificativa:** Correções recentes, manter por 2 meses para referência.

**Arquivar em:** `docs/archived/corrections-2026-01/` após 15/março/2026

- `corrections/2026-01-02-cards-lotes-entidades.md` ✅ Completo
- `corrections/2026-01-05_alinhamento-elegibilidade-clinicas-entidades.md`
- `corrections/2026-01-13-fluxo-cadastro-ativacao-sistemico.md`
- `corrections/2026-01-22-fix-gestor-entidade-as-funcionario.md` ✅ Aplicado
- `corrections/2026-01-22-lint-chunking.md`
- `corrections/2026-01-22-rbac-rls-audit.md`
- `corrections/2026-01-23-criar-lotes-avaliacao.md` ✅ Corrigido
- `corrections/2026-01-23-funcionarios-entidades-empresas-clinicas.md`
- `corrections/2026-01-24-segregacao-ambientes.md`
- `corrections/ANALISE-FLUXO-ENTIDADE-040126.md`
- `corrections/CORRECOES-IMPLEMENTADAS-040126.md` ✅ Concluído
- `corrections/ANALISE-MAQUINA-ESTADO-EMISSAO-AUTOMATICA-2026-01-05.md`
- `corrections/BUG-CRITICO-ENTIDADE-SEM-EMISSAO-AUTO-2026-01-05.md`
- `corrections/CORRECAO-EMISSAO-IMEDIATA-2026-01-18.md`
- `corrections/CORRECOES-CRITICAS-2026-01-04.md`
- `corrections/CORRECOES-INCONSISTENCIAS-STATUS-2026-01-04.md`
- `corrections/RELATORIO-CORRECAO-LAUDOS-2026-01-05.md`
- `corrections/RELATORIO-IMPLEMENTACAO-ENTIDADE-040126.md`

---

### 2.2 Análises e Máquinas de Estado (documentação técnica temporária)

**Justificativa:** Análises já incorporadas ao código, mantém valor histórico.

**Arquivar em:** `docs/archived/analises/`

- `corrections/MAQUINA-ESTADO-LAUDOS-2026-01-05.md`
- `corrections/maquina-estados-pagamento.md`
- `MAQUINA-ESTADO-SIMPLIFICADA.md`

---

## 🔄 CATEGORIA 3: Documentos para CONSOLIDAÇÃO (8 casos)

### 3.1 Guias RLS/RBAC (5 arquivos → 1 arquivo)

**Redundância:** Múltiplos guias sobre o mesmo tema.

**Arquivos atuais:**

- `README-RLS.md`
- `GUIA-RAPIDO-RLS.md`
- `RLS-POLICIES-REVISION-V3.md`
- `RLS-RBAC-FIXES-README.md`
- `RLS-RBAC-FIXES-SUMMARY.md`
- `RBAC_PERMISSIONS.md`
- `roles-and-rbac.md`

**Consolidar em:** `docs/security/GUIA-COMPLETO-RLS-RBAC.md`

---

### 3.2 Guias de Testes (3 arquivos → 1 arquivo)

**Arquivos atuais:**

- `GUIA-BOAS-PRATICAS-TESTES.md`
- `testing/TESTS.md`
- `testing/MOCKS_POLICY.md`

**Consolidar em:** `docs/testing/GUIA-COMPLETO-TESTES.md`

---

### 3.3 Documentação de Implementação de Planos

**Arquivos atuais:**

- `IMPLEMENTACAO_PLANOS.md`
- `INSTALACAO_PLANOS.md`
- `NOTAS_DEV_PLANOS.md`
- `PLANOS_README.md`

**Consolidar em:** `docs/guides/SISTEMA-PLANOS-COMPLETO.md`

---

## ✅ CATEGORIA 4: Documentos MANTER (Essenciais)

### 4.1 Guias Operacionais Ativos

- ✅ `QUICK-START.md`
- ✅ `DEVELOPMENT_GUIDE.md`
- ✅ `DATABASE_SETUP.md`
- ✅ `README.md` (índice principal)
- ✅ `INDEX.md`
- ✅ `README-ORGANIZACAO.md`

### 4.2 Guias de Deploy e Produção

- ✅ `DEPLOY-INSTRUCOES.md`
- ✅ `DEPLOY-RECIBOS.md`
- ✅ `deployment/` (pasta)
- ✅ `RUNNING-LOCAL-AGAINST-PROD.md`
- ✅ `VERCEL-ENV-VARS.md`
- ✅ `ENVIRONMENT-PROTECTION.md`

### 4.3 Documentação de Fluxos Ativos

- ✅ `FLUXO-PLANO-PERSONALIZADO.md`
- ✅ `guides/FLUXO-CONTRATACAO.md`
- ✅ `guides/FLUXO-CADASTRO-CONTRATANTES.md`

### 4.4 Documentação Técnica Atual

- ✅ `LAUDO-GENERATION.md`
- ✅ `PDF-CLIENT-GENERATION-IMPLEMENTATION.md`
- ✅ `RECIBOS_MATERIALIZED_VIEW.md`
- ✅ `SEPARACAO-CONTRATO-RECIBO.md`

### 4.5 Segurança e Compliance

- ✅ `security/` (toda pasta)
- ✅ `POLITICA-PRIVACIDADE-LGPD.md`
- ✅ `README-LGPD.md`
- ✅ `SUMARIO-EXECUTIVO-LGPD.md`
- ✅ `PROTECAO-SENHAS.md`

### 4.6 Políticas e Processos

- ✅ `policies/` (toda pasta)
- ✅ `process/` (toda pasta)
- ✅ `cleanup-policy.md`
- ✅ `contributing/`

---

## 📋 PLANO DE AÇÃO RECOMENDADO

### Fase 1: Limpeza Imediata (Esta Semana)

```bash
# 1. Criar pasta de arquivo
mkdir -p docs/archived/corrections-2025
mkdir -p docs/archived/corrections-2026-Q1
mkdir -p docs/archived/implementacoes-2024
mkdir -p docs/archived/prs

# 2. Mover correções antigas
git mv docs/corrections/2025-12-*.md docs/archived/corrections-2025/
git mv docs/corrections/LIMPEZA-2025-12-24.md docs/archived/corrections-2025/
git mv docs/corrections/RESUMO-IMPLEMENTACAO-CORRECOES-2025-12-21.md docs/archived/corrections-2025/

# 3. Arquivar PRs antigos
git mv docs/prs/*.md docs/archived/prs/

# 4. Arquivar implementações 2024
git mv docs/ATUALIZACAO-EMISSOR-DASHBOARD.md docs/archived/implementacoes-2024/
git mv docs/reports/RESUMO-IMPLEMENTACOES-2024-12-11.md docs/archived/implementacoes-2024/
```

### Fase 2: Consolidação (Próxima Semana)

1. **Consolidar documentação RLS/RBAC** em arquivo único
2. **Consolidar guias de testes** em arquivo único
3. **Consolidar documentação de planos** em arquivo único
4. **Remover duplicatas** após consolidação

### Fase 3: Arquivamento Programado (15 Março 2026)

- Mover correções de janeiro 2026 para `archived/corrections-2026-Q1/`

---

## 📊 Resultados Esperados

### Antes da Limpeza

- **Total de arquivos:** ~205 arquivos MD
- **Profundidade:** 3-4 níveis
- **Duplicações:** 15+ casos
- **Docs obsoletos:** 43 arquivos

### Depois da Limpeza

- **Total de arquivos:** ~125 arquivos MD (~39% redução)
- **Profundidade:** Máximo 2 níveis
- **Duplicações:** 0 casos
- **Docs obsoletos:** 0 (todos arquivados)
- **Estrutura:** Clara e organizada

---

## 🎯 Benefícios

1. **Navegação Mais Rápida:** Menos arquivos = busca mais eficiente
2. **Manutenção Simplificada:** Sem duplicações para manter sincronizadas
3. **Clareza:** Documentação ativa vs histórico bem definidos
4. **Performance:** Menos arquivos para indexar pelo VS Code/GitHub
5. **Conformidade:** Alinhado com `cleanup-policy.md`

---

## ⚠️ Avisos Importantes

1. **Não deletar permanentemente:** Sempre mover para `archived/` primeiro
2. **Git history preservado:** Arquivos continuam acessíveis no histórico
3. **Revisar antes de executar:** Validar lista com time
4. **Backup:** Criar branch de backup antes da limpeza
5. **Comunicar:** Avisar equipe sobre mudanças na estrutura

---

## 📝 Checklist de Execução

- [ ] Criar branch `docs/cleanup-2026-01`
- [ ] Criar estrutura de pastas `archived/`
- [ ] Executar Fase 1 (limpeza imediata)
- [ ] Revisar e validar mudanças
- [ ] Criar PR com lista de arquivos movidos
- [ ] Atualizar `README.md` com nova estrutura
- [ ] Merge após aprovação
- [ ] Agendar Fase 2 (consolidação)
- [ ] Agendar Fase 3 (arquivamento Q1 2026)

---

**Fim do Relatório**
