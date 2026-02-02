# 📁 Estrutura Organizada de Testes

> **Data**: 31 de janeiro de 2026  
> **Status**: Higienizada e Categorizada  
> **Arquivos Organizados**: 79 testes movidos da raiz para categorias

---

## 🎯 Objetivo da Reorganização

A pasta `__tests__/` tinha **79 arquivos de teste na raiz**, dificultando navegação e manutenção. Esta reorganização agrupa testes por domínio funcional, facilitando:

- ✅ **Descoberta**: Encontrar testes relacionados rapidamente
- ✅ **Manutenção**: Organizar mudanças por contexto
- ✅ **Escalabilidade**: Adicionar novos testes nas categorias certas
- ✅ **Compreensão**: Estrutura reflete arquitetura do sistema

---

## 📂 Estrutura de Categorias

### 🔐 **admin/** (2 testes)

Testes de funcionalidades administrativas e dashboards de admin.

**Arquivos**:

- `admin-dashboard.test.tsx` - Dashboard administrativo
- `admin-ui-conditional-approval.test.tsx` - Aprovação condicional na UI admin

---

### 🔑 **auth/** (3 testes)

Testes de autenticação, login e controle de acesso.

**Arquivos**:

- `login.test.tsx` - Tela de login geral
- `clinica-login-auth.test.ts` - Login específico de clínica
- `integracao-aprovacao-login-gestor.test.ts` - Aprovação e login de gestores

---

### 📋 **avaliacao/** (5 testes)

Testes de avaliações psicossociais, efeito cascata e índices.

**Arquivos**:

- `avaliacao-navegacao.test.tsx` - Navegação entre telas de avaliação
- `avaliacao.test.tsx` - Componente principal de avaliação
- `indice-avaliacao.test.ts` - Cálculo de índices
- `efeito-cascata-grupo-unico.test.tsx` - Efeito cascata em grupo único
- `efeito-cascata.test.tsx` - Efeito cascata geral

---

### 🏥 **clinica/** (5 testes)

Testes da aplicação SPA de clínicas.

**Arquivos**:

- `clinica-conta-section.test.tsx` - Seção de conta da clínica
- `clinica-empresas-section.test.tsx` - Seção de empresas vinculadas
- `clinica-laudos-section.test.tsx` - Seção de laudos da clínica
- `clinica-sidebar.test.tsx` - Sidebar de navegação
- `clinica-spa-integration.test.tsx` - Integração SPA completa

---

### 📄 **contracts/** (4 testes)

Testes de contratos, pagamentos e planos.

**Arquivos**:

- `pagamento.test.tsx` - Fluxo de pagamento
- `terms-contrato.page.test.tsx` - Página de termos do contrato
- `payment-confirmation-integration.test.ts` - Confirmação de pagamento
- `plano-personalizado-correcoes.test.ts` - Correções em planos personalizados

---

### 🔧 **corrections/** (12 testes)

Testes de correções e sanitização de bugs históricos.

**Arquivos**:

- `conversation-changes.test.ts` - Mudanças em conversas
- `correcao-apis-conversa.test.ts` - Correção de APIs de conversa
- `correcao-imutabilidade-laudos.test.ts` - Imutabilidade de laudos
- `correcao-rls-policies-fila-emissao.test.ts` - RLS policies da fila
- `correcao-sistematica-status-avaliacoes.test.ts` - Status de avaliações
- `correcoes-criticas-implementadas.test.ts` - Correções críticas
- `correcoes-criticas.test.ts` - Outra rodada de correções críticas
- `correcoes-inconsistencias-status-simple.test.ts` - Status simples
- `correcoes-inconsistencias-status.test.ts` - Status inconsistentes
- `correcoes-sistema-conversa-final.test.ts` - Conversa final
- `correcoes-sistema-laudos.test.ts` - Sistema de laudos
- `sanitizacao-codigo-obsoleto.test.ts` - Código obsoleto

---

### 📊 **dashboard/** (2 testes)

Testes de dashboards gerais do sistema.

**Arquivos**:

- `dashboard.client.test.tsx` - Dashboard client-side
- `Dashboard.test.tsx` - Dashboard principal

---

### 🗄️ **database/** (2 testes)

Testes de migrações e schema do banco de dados.

**Arquivos**:

- `database-migrations-schema.test.ts` - Schema e migrações
- `migrations-database-correcoes.integration.test.ts` - Migrações de correções

---

### 📝 **emissor/** (13 testes)

Testes de emissão de laudos, PDFs e workflows de emissão.

**Arquivos**:

- `emissor-download-client-side-fallback.test.ts` - Fallback de download
- `emissor-page-client-pdf.test.tsx` - Página de PDF client-side
- `emissor-pdf-imutabilidade.unit.test.ts` - Imutabilidade de PDFs
- `emissor-production-fixes.test.ts` - Fixes de produção
- `emissor-vercel-pdf-integration.test.ts` - Integração Vercel PDF
- `emissor-workflow-improvements.test.ts` - Melhorias no workflow
- `emissao-emergencial.integration.test.ts` - Emissão emergencial
- `manual-emission-flow.test.ts` - Fluxo manual
- `validation-manual-emission-changes.test.ts` - Validação de mudanças
- `rastreabilidade-emissao-manual.test.ts` - Rastreabilidade
- `laudo-hash-integridade.test.ts` - Hash e integridade
- `hash-backfill.test.ts` - Backfill de hashes
- `immutability-laudo-persistence.integration.test.ts` - Persistência imutável

---

### 🏢 **entidade/** (4 testes)

Testes da aplicação de entidades (empresas).

**Arquivos**:

- `entidade-fluxo-laudo-e2e.test.ts` - Fluxo E2E de laudos
- `entidade-layout.test.tsx` - Layout da entidade
- `entidade-lotes-imutabilidade.unit.test.ts` - Imutabilidade de lotes
- `entidade-sidebar.test.tsx` - Sidebar de navegação

---

### 📦 **lotes/** (1 teste)

Testes de lotes de avaliações.

**Arquivos**:

- `lote-cancelamento-automatico.test.ts` - Cancelamento automático

---

### 🔀 **middleware/** (2 testes)

Testes de middleware e integrações de API.

**Arquivos**:

- `middleware-api-integration.test.ts` - Integração de APIs
- `middleware-security.test.ts` - Segurança do middleware

---

### 📝 **registration/** (8 testes)

Testes de cadastro de contratantes e criação de contas.

**Arquivos**:

- `cadastro-contratante-completo.test.ts` - Cadastro completo
- `cadastroApi.test.ts` - API de cadastro
- `cadastroContratante.test.ts` - Cadastro de contratante
- `criarContaResponsavel.test.ts` - Criar conta de responsável
- `criarContaResponsavel.unit.test.ts` - Teste unitário de criação
- `sucesso-cadastro.test.tsx` - Tela de sucesso no cadastro
- `ativar-contratante-sem-recibo.test.ts` - Ativação sem recibo
- `separacao-novos-cadastros-vs-contratantes.test.ts` - Separação de cadastros

---

### 👥 **rh/** (12 testes)

Testes de funcionalidades de RH, lotes, funcionários e estatísticas.

**Arquivos**:

- `gestores-rh-integration.test.ts` - Integração de gestores
- `rh-download-sem-geracao.unit.test.ts` - Download sem geração
- `rh-lote-solicitar-emissao-cards.test.ts` - Cards de solicitação
- `penetration-test-rh-lotes.test.ts` - Testes de penetração
- `fluxo-completo-personalizado.test.ts` - Fluxo personalizado
- `funcionarios-filtros.test.tsx` - Filtros de funcionários ✨
- `funcionarios-bulk-operations.test.tsx` - Operações em lote ✨
- `empresas-statistics.test.tsx` - Estatísticas de empresas ✨
- `dashboard-tabs-navigation.test.tsx` - Navegação de tabs ✨
- `dashboard-lotes-laudos.test.tsx` - Lotes com laudos ✨
- `dashboard-funcionarios-tab.test.tsx` - Tab de funcionários ✨
- `lote-grupos-classificacao.test.tsx` - Classificação de grupos ✨

---

### ⚙️ **system/** (9 testes)

Testes de sistema, infraestrutura e integrações gerais.

**Arquivos**:

- `api-logger-integration.test.ts` - Logger de APIs
- `audit-system-actions.test.ts` - Auditoria de ações
- `environment-configuration.test.ts` - Configuração de ambiente
- `environment-isolation.test.ts` - Isolamento de ambiente
- `offline-system.test.ts` - Sistema offline
- `react-query-integration.test.tsx` - React Query
- `query-client-provider.test.tsx` - Provider de query client
- `structured-logger.test.ts` - Logger estruturado
- `state-machine-automatic-approval.test.ts` - Máquina de estados

---

### 🎨 **visual-regression/** (2 testes)

Testes de consistência visual e responsividade.

**Arquivos**:

- `visual-consistency.test.tsx` - Consistência visual
- `mobile-responsividade.test.tsx` - Responsividade mobile

---

## 📊 Estatísticas da Organização

### Antes

```
📁 __tests__/
   📄 79 arquivos de teste na raiz
   📁 Algumas pastas com testes organizados
   ❌ Difícil navegação
   ❌ Difícil manutenção
```

### Depois

```
📁 __tests__/
   📁 16 categorias organizadas
   📄 0 arquivos na raiz
   ✅ Fácil descoberta
   ✅ Estrutura clara
   ✅ Escalável
```

### Distribuição por Categoria

| Categoria              | Testes | Percentual |
| ---------------------- | ------ | ---------- |
| **emissor/**           | 13     | 16.5%      |
| **corrections/**       | 12     | 15.2%      |
| **rh/**                | 12     | 15.2%      |
| **system/**            | 9      | 11.4%      |
| **registration/**      | 8      | 10.1%      |
| **avaliacao/**         | 5      | 6.3%       |
| **clinica/**           | 5      | 6.3%       |
| **entidade/**          | 4      | 5.1%       |
| **contracts/**         | 4      | 5.1%       |
| **auth/**              | 3      | 3.8%       |
| **admin/**             | 2      | 2.5%       |
| **dashboard/**         | 2      | 2.5%       |
| **database/**          | 2      | 2.5%       |
| **middleware/**        | 2      | 2.5%       |
| **visual-regression/** | 2      | 2.5%       |
| **lotes/**             | 1      | 1.3%       |
| **TOTAL**              | **79** | **100%**   |

---

## 🎯 Convenções de Nomenclatura

### Padrões de Nomes de Arquivos

- **`.test.tsx`** - Testes de componentes React
- **`.test.ts`** - Testes de lógica/APIs/utils
- **`.integration.test.ts`** - Testes de integração
- **`.unit.test.ts`** - Testes unitários isolados
- **`.e2e.test.ts`** - Testes end-to-end

### Localização de Testes

Testes devem estar na pasta que melhor representa seu **domínio funcional**, não necessariamente espelhando a estrutura de `app/` ou `components/`.

**Exemplo**:

- ❌ `__tests__/app/admin/dashboard.test.tsx`
- ✅ `__tests__/admin/dashboard.test.tsx`

---

## 🚀 Próximos Passos

### Manutenção Contínua

1. **Novos testes** devem ser criados nas categorias apropriadas
2. **Evitar raiz**: Nunca adicionar testes na raiz de `__tests__/`
3. **Criar subcategorias**: Se uma pasta crescer muito (>15 arquivos), considerar subdivisões

### Sugestões de Subcategorias Futuras

**emissor/** (13 arquivos) poderia ser dividido:

```
emissor/
  ├── pdf/           - Testes de PDF (6 arquivos)
  ├── workflow/      - Testes de fluxo (4 arquivos)
  └── integrity/     - Testes de integridade (3 arquivos)
```

**corrections/** (12 arquivos) poderia ser arquivado:

```
corrections/
  ├── 2024/          - Correções antigas
  └── active/        - Correções ativas
```

---

## 📖 Guia de Navegação Rápida

### Por Domínio

- **Autenticação?** → `auth/`
- **Avaliações?** → `avaliacao/`
- **Laudos/PDFs?** → `emissor/`
- **RH/Funcionários?** → `rh/`
- **Admin?** → `admin/`
- **Cadastro?** → `registration/`
- **Pagamento?** → `contracts/`
- **Bugs corrigidos?** → `corrections/`

### Por Tipo

- **Testes unitários** → Busque `.unit.test.ts` em qualquer pasta
- **Testes de integração** → Busque `.integration.test.ts`
- **Testes E2E** → Busque `.e2e.test.ts`
- **Testes visuais** → `visual-regression/`

---

## ✅ Benefícios Alcançados

1. **Descoberta Rápida**:
   - Antes: "Onde está o teste de login?" → scroll em 79 arquivos
   - Depois: "Onde está o teste de login?" → `auth/login.test.tsx`

2. **Contexto Claro**:
   - Antes: `correcao-apis-conversa.test.ts` na raiz
   - Depois: `corrections/correcao-apis-conversa.test.ts`

3. **Escalabilidade**:
   - Adicionar novo teste de emissor? → `emissor/novo-teste.test.ts`
   - Estrutura suporta crescimento sem caos

4. **Manutenção**:
   - Mudou o sistema de laudos? → Todos os testes em `emissor/`
   - Refatorou RH? → Todos os testes em `rh/`

---

**Estrutura higienizada e pronta para crescimento!** 🎉
