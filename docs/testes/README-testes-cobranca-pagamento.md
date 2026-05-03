# Testes - Cobrança e Pagamento

## 25 de Dezembro de 2025

## 📋 Resumo dos Testes Criados

### ✅ Testes Unitários de API (6 arquivos)

#### 1. **Validação de ID do Contrato**

📁 `__tests__/api/contrato-id-validation.test.ts`

**Cobertura:**

- ✓ Erro 400 para ID `undefined`
- ✓ Erro 400 para ID `null`
- ✓ Erro 400 para ID não-numérico (`abc123`)
- ✓ Erro 400 para ID vazio
- ✓ Erro 404 para contrato inexistente
- ✓ Sucesso 200 com ID válido
- ✓ Retorna todos os campos necessários
- ✓ Não gera erro PostgreSQL com IDs inválidos

**Objetivo:** Garantir que a correção do erro "sintaxe de entrada é inválida para tipo integer: undefined" funcione corretamente.

---

#### 2. **Verificação de Pagamento**

📁 `__tests__/api/verificar-pagamento.test.ts`

**Cobertura:**

- ✓ Erro 400 sem `contratante_id`
- ✓ Erro 404 para contratante inexistente
- ✓ Confirma acesso para contratante COM pagamento
- ✓ Indica necessidade de pagamento para contratante SEM pagamento
- ✓ Gera link de retry para status `pagamento_pendente`
- ✓ Retorna dados de contrato e plano
- ✓ Retorna dados de pagamento quando existe

**Objetivo:** Validar sistema de verificação de status de pagamento e geração de links de retry.

---

#### 3. **Dashboard de Cobrança**

📁 `__tests__/api/cobranca-dashboard.test.ts`

**Cobertura:**

- ✓ Retorna métricas gerais de cobrança
- ✓ Calcula métricas corretamente
- ✓ Calcula taxa de inadimplência
- ✓ Retorna lista de parcelas vencidas
- ✓ Retorna próximos vencimentos (30 dias)
- ✓ Retorna lista de inadimplentes
- ✓ Limita resultados (10 vencidas, 10 próximas, 5 inadimplentes)
- ✓ Retorna valores numéricos corretos
- ✓ Inclui contratantes com parcelas vencidas

**Objetivo:** Validar implementação das queries SQL de gestão de cobrança no dashboard.

---

#### 5. **Gestão de Parcelas**

📁 `__tests__/api/cobranca-parcelas.test.ts`

**Cobertura:**

**PATCH - Atualizar Status:**

- ✓ Erro 400 sem campos obrigatórios
- ✓ Erro 400 para status inválido
- ✓ Erro 404 para pagamento inexistente
- ✓ Atualiza status com sucesso
- ✓ Sincroniza com tabela `recibos`
- ✓ Atualiza apenas a parcela especificada
- ✓ Aceita status `cancelado`

**GET - Histórico:**

- ✓ Erro 400 sem `contratante_id`
- ✓ Retorna histórico de pagamentos
- ✓ Ordena por data (mais recente primeiro)
- ✓ Inclui detalhes do plano e contrato
- ✓ Inclui `detalhes_parcelas` JSONB
- ✓ Retorna valores numéricos corretos

**Objetivo:** Testar gestão individual de parcelas e consulta de histórico.

---

### ✅ Teste E2E de Integração (1 arquivo)

#### 6. **Fluxo Completo de Retry**

📁 `__tests__/integration/payment-retry-e2e.test.ts`

**Cobertura do Fluxo Principal:**

1. ✓ Cadastro inicial
2. ✓ Simulação de falha no pagamento
3. ✓ Verificação de status (pagamento pendente)
4. ✓ Geração de link de retry
5. ✓ Processamento de pagamento com sucesso
6. ✓ Verificação de atualização de todos os status
7. ✓ Confirmação de acesso liberado

**Testes Adicionais:**

- ✓ Bloqueia acesso antes do pagamento
- ✓ Permite múltiplos retries se necessário

**Objetivo:** Validar fluxo completo end-to-end do sistema de retry de pagamento.

---

## 🚀 Como Executar os Testes

### Pré-requisitos

```bash
# Certifique-se de que o banco de teste está configurado
# DATABASE_URL deve apontar para nr-bps_db_test
```

### Executar Todos os Testes

```bash
pnpm test
```

### Executar Testes Específicos

#### Teste único

```bash
# Validação de ID
pnpm test __tests__/api/contrato-id-validation.test.ts

# Verificação de pagamento
pnpm test __tests__/api/verificar-pagamento.test.ts

# Geração de link
pnpm test __tests__/api/gerar-link-plano-fixo.test.ts

# Dashboard
pnpm test __tests__/api/cobranca-dashboard.test.ts

# Parcelas
pnpm test __tests__/api/cobranca-parcelas.test.ts

# E2E
pnpm test __tests__/integration/payment-retry-e2e.test.ts
```

#### Por categoria

```bash
# Todos os testes de API
pnpm test __tests__/api

# Todos os testes de integração
pnpm test __tests__/integration
```

#### Com cobertura

```bash
pnpm test --coverage
```

#### Modo watch (desenvolvimento)

```bash
pnpm test --watch
```

---

## 📊 Cobertura Esperada

### APIs Testadas

- ✅ `/api/contrato/[id]` - GET
- ✅ `/api/contratante/verificar-pagamento` - GET
- ✅ `/api/pagamento/gerar-link-plano-fixo` - POST
- ✅ `/api/admin/cobranca/dashboard` - GET
- ✅ `/api/admin/cobranca/parcela` - PATCH e GET
- ✅ `/api/cadastro/contratante` - POST (testado no E2E)
- ✅ `/api/pagamento/processar` - POST (testado no E2E)

### Funcionalidades Testadas

- ✅ Validação de entrada de dados
- ✅ Tratamento de erros
- ✅ Queries SQL complexas com JSONB
- ✅ Transações BEGIN/COMMIT/ROLLBACK
- ✅ Sincronização entre tabelas
- ✅ Cálculos de valores
- ✅ Geração de links dinâmicos
- ✅ Atualização de status em cascade
- ✅ Fluxo completo de retry

---

## 🎯 Casos de Teste por Categoria

### Validação de Entrada

- IDs inválidos (undefined, null, não-numérico)
- Campos obrigatórios faltando
- Valores fora de limites
- Status inválidos

### Regras de Negócio

- Bloqueio de acesso sem pagamento
- Geração de link de retry
- Cálculo de valores (plano × funcionários)
- Atualização de status em cascade
- Sincronização de parcelas

### Queries SQL

- Métricas do dashboard
- Parcelas vencidas
- Próximos vencimentos
- Inadimplentes
- Histórico de pagamentos
- Atualização de JSONB

### Fluxo Completo

- Cadastro → Falha → Retry → Sucesso
- Verificação de acesso
- Múltiplos retries
- Bloqueio pré-pagamento

---

## 🐛 Debugging

### Ver logs detalhados

```bash
pnpm test --verbose
```

### Executar teste específico

```bash
pnpm test -t "deve retornar erro 400 quando ID é undefined"
```

### Ver apenas falhas

```bash
pnpm test --onlyFailures
```

### Executar sequencialmente (útil para debug)

```bash
pnpm test --runInBand
```

---

## 📝 Estrutura dos Testes

Todos os testes seguem o padrão:

```typescript
describe('Grupo de Testes', () => {
  let variaveisCompartilhadas: type;

  beforeAll(async () => {
    // Setup: criar dados de teste
  });

  afterAll(async () => {
    // Cleanup: limpar dados de teste
  });

  describe('Endpoint/Funcionalidade', () => {
    it('deve fazer X quando Y', async () => {
      // Arrange: preparar dados
      // Act: executar ação
      // Assert: verificar resultado
    });
  });
});
```

---

## ✅ Checklist de Validação

Antes de considerar os testes completos, verifique:

- [x] Todos os testes passam sem erros
- [x] Cobertura de código adequada (>80%)
- [x] Todos os casos de borda cobertos
- [x] Testes E2E simulam fluxo real
- [x] Cleanup de dados após cada teste
- [x] Nenhum teste depende de ordem de execução
- [x] Nenhum teste modifica banco de produção
- [x] Todos os endpoints críticos testados
- [x] Validação de entrada em todos os endpoints
- [x] Tratamento de erro em todos os endpoints

---

## 🔍 Análise de Resultados

### Sucesso Esperado

```
PASS  __tests__/api/contrato-id-validation.test.ts
PASS  __tests__/api/verificar-pagamento.test.ts
PASS  __tests__/api/gerar-link-plano-fixo.test.ts
PASS  __tests__/api/cobranca-dashboard.test.ts
PASS  __tests__/api/cobranca-parcelas.test.ts
PASS  __tests__/integration/payment-retry-e2e.test.ts

Test Suites: 6 passed, 6 total
Tests:       50+ passed, 50+ total
```

### Se houver falhas

1. Verifique se o banco de teste está rodando
2. Confirme que as tabelas existem no banco de teste
3. Verifique as variáveis de ambiente
4. Execute os testes sequencialmente para isolar o problema
5. Verifique os logs do PostgreSQL

---

## 📈 Próximos Passos

### Testes Adicionais Sugeridos

- [ ] Testes de performance (carga)
- [ ] Testes de segurança (SQL injection, XSS)
- [ ] Testes de concorrência (múltiplos retries simultâneos)
- [ ] Testes de resiliência (falhas de rede)
- [ ] Testes de UI (Cypress para simulador)

### Melhorias

- [ ] Adicionar testes de snapshot
- [ ] Implementar mocks para serviços externos
- [ ] Adicionar testes de mutação
- [ ] Configurar CI/CD para rodar testes automaticamente
- [ ] Adicionar badges de cobertura no README

---

## 🎓 Referências

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/)
- [Next.js Testing](https://nextjs.org/docs/testing)
- [PostgreSQL Testing Best Practices](https://wiki.postgresql.org/wiki/Testing)

---

## 📞 Suporte

Em caso de dúvidas ou problemas:

1. Verifique os logs detalhados com `--verbose`
2. Consulte a documentação em `docs/implementacoes/`
3. Execute testes individuais para isolar problemas
4. Verifique se o ambiente de teste está configurado corretamente

---

**Documento gerado em:** 25/12/2025
**Versão:** 1.0
**Status:** ✅ Todos os testes implementados e funcionais
