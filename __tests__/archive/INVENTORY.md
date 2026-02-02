# Inventário de Testes - QWork

> Gerado automaticamente em Janeiro 2026

## 📊 Estatísticas

### Total de Arquivos de Teste

- **API Tests**: ~50 arquivos
- **Component Tests**: ~30 arquivos
- **Hook Tests**: ~15 arquivos
- **Integration Tests**: ~20 arquivos
- **E2E Tests**: ~10 arquivos
- **Visual Regression**: ~5 arquivos

## 🗂️ Organização por Categoria

### 1. API - Emissor de Laudos

```
__tests__/api/emissor/
├── laudos.test.ts                           # CRUD de laudos
├── laudo-auto.test.ts                       # Geração automática
├── fluxo-emissao-laudo.test.ts             # Fluxo completo
└── emissor-*.test.ts                        # Funcionalidades específicas

__tests__/emissor/
├── dashboard-novas-funcionalidades.test.tsx
├── emissor-*.test.ts
└── ...
```

### 2. API - RH e Gestão

```
__tests__/api/rh/
├── liberar-lote.test.ts
├── dashboard.test.ts
└── ...

__tests__/rh/
├── empresa-dashboard-*.test.tsx
├── lote-*.test.tsx
└── ...
```

### 3. API - Admin

```
__tests__/api/admin/
├── novos-cadastros-*.test.ts
├── aprovar-*.test.ts
└── ...

__tests__/admin/
├── admin-dashboard.test.tsx
├── admin-ui-conditional-approval.test.tsx
└── ...
```

### 4. API - Sistema

```
__tests__/api/system/
├── auto-laudo.test.ts
└── ...
```

### 5. Componentes React

```
__tests__/components/
├── planos-components.test.tsx
└── ...
```

### 6. Hooks Customizados

```
__tests__/hooks/
├── useEmergenciaLaudo.test.tsx
├── useLiberarLote.test.ts
├── useLaudos.test.ts
└── ...

__tests__/lib/hooks/
├── useLaudos.test.ts
├── useAnomalias.test.ts
└── ...
```

### 7. Bibliotecas e Utilitários

```
__tests__/lib/
├── questoes.test.ts
├── test-helpers.ts
├── laudo-storage-fallback.test.ts
└── ...
```

### 8. Autenticação

```
__tests__/auth/
└── ...

__tests__/authentication/
└── ...
```

### 9. Avaliações

```
__tests__/avaliacao/
├── popup-ui.test.tsx
└── ...

__tests__/
├── avaliacao.test.tsx
├── avaliacao-navegacao.test.tsx
└── ...
```

### 10. Clínica

```
__tests__/
├── clinica-*.test.tsx
└── clinica-*.test.ts
```

### 11. Cadastro e Contratos

```
__tests__/
├── cadastro-contratante-completo.test.ts
├── cadastroApi.test.ts
├── cadastroContratante.test.ts
└── ...

__tests__/contracts/
└── ...

__tests__/registration/
└── ...
```

### 12. Lotes e Emissão

```
__tests__/lotes/
└── ...

__tests__/
├── lote-cancelamento-automatico.test.ts
├── emissor-*.test.ts
└── ...
```

### 13. Database e Migrations

```
__tests__/database/
└── ...

__tests__/
├── database-migrations-schema.test.ts
├── migrations-database-correcoes.integration.test.ts
└── ...
```

### 14. Segurança e Auditoria

```
__tests__/audit/
└── ...

__tests__/security/
└── ...

__tests__/seguranca/
└── ...

__tests__/
├── audit-system-actions.test.ts
├── middleware-security.test.ts
└── ...
```

### 15. Correções e Sanitização

```
__tests__/corrections/
└── ...

__tests__/
├── correcao-*.test.ts
├── correcoes-*.test.ts
└── sanitizacao-codigo-obsoleto.test.ts
```

### 16. Integração e E2E

```
__tests__/integration/
└── ...

__tests__/e2e/
└── ...

__tests__/integracao/
└── ...

__tests__/
├── *-integration.test.ts
├── *-e2e.test.ts
└── ...
```

### 17. Regressão Visual

```
__tests__/visual-regression/
├── responsiveness.test.tsx
├── page-snapshots.test.tsx
├── css-layout.test.tsx
└── README.md
```

### 18. Helpers e Utilitários de Teste

```
__tests__/helpers/
└── ...

__tests__/lib/
└── test-helpers.ts
```

### 19. Middleware

```
__tests__/middleware/
└── ...

__tests__/
└── middleware-*.test.ts
```

### 20. Entidade

```
__tests__/entidade/
└── ...

__tests__/entity/
└── ...

__tests__/
├── entidade-*.test.ts
└── entidade-*.test.tsx
```

## 🔍 Análise de Testes

### Testes que Precisam de Revisão

#### ⚠️ Com @ts-nocheck

```
__tests__/rh/lote-grupos-classificacao.test.tsx
__tests__/lib/test-helpers.ts
```

**Ação**: Revisar tipos e remover @ts-nocheck quando possível

#### 🔄 Testes Duplicados Potenciais

```
# Laudos
__tests__/api/emissor/laudos.test.ts
__tests__/api/emissor/laudo-auto.test.ts
__tests__/api/emissor/fluxo-emissao-laudo.test.ts
tests/api/emissor/laudos/hash-sha256-laudo.test.ts

# Correções
__tests__/correcao-*.test.ts (múltiplos)
__tests__/correcoes-*.test.ts (múltiplos)

# Dashboard
__tests__/Dashboard.test.tsx
__tests__/dashboard.client.test.tsx
__tests__/admin/admin-dashboard.test.tsx
```

**Ação**: Consolidar testes similares

#### 📝 Testes de Correções Antigas

```
__tests__/correcao-apis-conversa.test.ts
__tests__/correcao-imutabilidade-laudos.test.ts
__tests__/correcao-rls-policies-fila-emissao.test.ts
__tests__/correcoes-criticas-implementadas.test.ts
__tests__/correcoes-criticas.test.ts
__tests__/correcoes-inconsistencias-status-simple.test.ts
__tests__/correcoes-inconsistencias-status.test.ts
__tests__/correcoes-sistema-conversa-final.test.ts
__tests__/correcoes-sistema-laudos.test.ts
```

**Ação**: Considerar arquivar ou consolidar em testes de regressão

### Testes Bem Estruturados ✅

```
__tests__/lib/test-helpers.ts              # Utilitários de mock padronizados
__tests__/hooks/useLiberarLote.test.ts     # Testes de hook bem organizados
__tests__/visual-regression/*.test.tsx      # Testes visuais estruturados
tests/api/emissor/laudos/hash-sha256-laudo.test.ts  # Documentado e completo
```

## 📋 Padrões Identificados

### ✅ Boas Práticas

- Uso de `jest.clearAllMocks()` em `beforeEach`
- Estrutura Arrange-Act-Assert
- Uso de `waitFor` para operações assíncronas
- Mocks bem definidos
- Testes isolados

### ⚠️ Áreas de Melhoria

- Alguns arquivos com @ts-nocheck
- Testes de correções antigas que podem ser consolidados
- Possíveis duplicações entre **tests**/api e tests/api
- Nomenclatura inconsistente em alguns casos

## 🎯 Recomendações

### Prioridade Alta

1. **Revisar testes com @ts-nocheck** - Corrigir tipos
2. **Consolidar testes de correções** - Criar suite de regressão
3. **Documentar padrões** - Atualizar MOCKS_POLICY.md

### Prioridade Média

4. **Reorganizar estrutura** - Padronizar **tests** vs tests
5. **Adicionar testes faltantes** - Cobrir gaps de cobertura
6. **Atualizar snapshots** - Revisar visual regression

### Prioridade Baixa

7. **Otimizar performance** - Paralelizar testes independentes
8. **Adicionar benchmarks** - Medir performance de testes
9. **Criar templates** - Templates para novos testes

## 📈 Métricas de Qualidade

### Cobertura Atual (Estimada)

- **Statements**: ~75%
- **Branches**: ~65%
- **Functions**: ~70%
- **Lines**: ~75%

### Meta

- **Statements**: 80%
- **Branches**: 70%
- **Functions**: 80%
- **Lines**: 80%

## 🔄 Manutenção Contínua

### Ações Semanais

- [ ] Revisar testes falhando
- [ ] Atualizar snapshots se necessário
- [ ] Verificar warnings de qualidade

### Ações Mensais

- [ ] Revisar cobertura de código
- [ ] Atualizar documentação
- [ ] Consolidar testes duplicados
- [ ] Arquivar testes obsoletos

### Ações Trimestrais

- [ ] Auditoria completa de testes
- [ ] Atualizar política de testes
- [ ] Treinar equipe em novas práticas
- [ ] Revisar métricas de qualidade

---

**Última atualização**: 31 de Janeiro de 2026
**Próxima revisão**: 28 de Fevereiro de 2026
