# Testes do Fluxo Personalizado

## Resumo

Este documento descreve os testes criados e validados para o fluxo completo do plano personalizado, desde o cadastro até a liberação do login para o responsável da entidade ou gestor RH da clínica.

## Status dos Testes

✅ **APROVADO** - Todos os testes essenciais do fluxo personalizado estão funcionando

## Testes Implementados

### 1. Teste Simplificado de Integração

**Arquivo:** `__tests__/integration/fluxo-personalizado-simples.test.ts`

**Status:** ✅ PASSOU

**Escopo:** Testa todo o ciclo do plano personalizado de forma simplificada:

1. Cadastro → pendente
2. Admin aprova → define valores
3. Pagamento confirmado
4. Login liberado

**Validações:**

- Contratante criado com status `pendente`
- Entrada em `contratacao_personalizada` com status `aguardando_valor_admin`
- Admin define valor_por_funcionario e valor_total
- Contrato criado com status `aguardando_pagamento`
- Após pagamento: contrato vira `ativo`, contratante vira `aprovado`
- Senha criada em `contratantes_senhas` com hash bcrypt
- Estado final consistente em todas as tabelas

**Tecnologias:**

- Direct database queries com `@/lib/db`
- bcryptjs para hash de senhas
- Limpeza automática de dados de teste

### 2. Teste Completo End-to-End

**Arquivo:** `__tests__/integration/fluxo-completo-personalizado.test.ts`

**Status:** ✅ PASSOU

**Escopo:** Simula o fluxo real incluindo chamadas à API de cadastro:

1. Empresa preenche formulário via API `/api/cadastro/contratante`
2. Admin define valores e gera link de pagamento
3. Simulação de acesso ao link e confirmação de pagamento
4. Verificação de liberação de login

**Validações:**

- API de cadastro retorna status 201
- FormData com arquivos simulados (cartao_cnpj, contrato_social, doc_identificacao)
- Resposta da API contém `contratante.status === 'pendente'`
- Token de pagamento gerado e armazenado
- Link de pagamento formatado corretamente
- Todos os estados finais validados

**Diferencial:**

- Testa a integração real com a API
- Valida upload de arquivos
- Verifica mensagens de retorno da API

## Correções Aplicadas

### Build - Erros de Linting Corrigidos

1. **handlers.ts**: Removidos imports não utilizados (`getContratantesPendentes`, `TipoContratante`)
2. **simulador/route.ts**:
   - Removida variável `numFuncs` não utilizada
   - Mudado `let numeroFuncionariosUsar` para `const`
3. **laudos/[laudoId]/download/route.ts**: Adicionado prefixo `_` em `permErr` não utilizado

### Testes - Correções Aplicadas

1. **CNPJ/CPF**: Formato correto sem pontuação (14/11 dígitos)
2. **bcrypt**: Uso de `bcryptjs` ao invés de `bcrypt` (pacote instalado no projeto)
3. **Imports**: Imports corretos no topo do arquivo

## Execução dos Testes

### Rodar Teste Simplificado

```bash
pnpm test fluxo-personalizado-simples --no-coverage
```

### Rodar Teste Completo

```bash
pnpm test fluxo-completo-personalizado --no-coverage
```

### Rodar Todos os Testes do Fluxo Personalizado

```bash
pnpm test "personalizado" --no-coverage
```

## Cobertura do Fluxo

### Etapas Testadas ✅

1. **Cadastro Inicial**
   - ✅ Criação de contratante com plano personalizado
   - ✅ Status inicial `pendente`
   - ✅ Entrada em `contratacao_personalizada`

2. **Aprovação Admin**
   - ✅ Definição de valor_por_funcionario
   - ✅ Definição de numero_funcionarios_estimado
   - ✅ Cálculo de valor_total_estimado
   - ✅ Geração de payment_link_token
   - ✅ Criação de contrato

3. **Pagamento**
   - ✅ Atualização de status para `pago`
   - ✅ Ativação do contrato
   - ✅ Contratante fica `aprovado`
   - ✅ `pagamento_confirmado = true`

4. **Liberação de Login**
   - ✅ Criação de senha com hash bcrypt
   - ✅ Armazenamento em `contratantes_senhas`
   - ✅ `data_liberacao_login` definida

### Integrações Testadas ✅

- ✅ API `/api/cadastro/contratante` (POST)
- ✅ Upload de arquivos simulado
- ✅ Transações de banco de dados
- ✅ Limpeza automática de dados de teste

## Próximos Passos (Futuro)

### Testes Adicionais Sugeridos (Opcional)

1. **Teste de Rejeição de Proposta**
   - Contratante recusa valores propostos pelo admin
   - Admin é notificado para renegociação

2. **Teste de Expiração de Link**
   - Link de pagamento expira após 48h
   - Sistema bloqueia acesso a link expirado

3. **Teste de Notificações**
   - Verificar criação de notificações para gestor
   - Validar formato e conteúdo das notificações

4. **Teste E2E com UI**
   - Usando Cypress ou Playwright
   - Simular cliques e navegação real

## Ambiente de Teste

- **Banco:** `nr-bps_db_test` (PostgreSQL)
- **Isolamento:** Garantido por `jest.setup.js`
- **Limpeza:** Automática em `beforeEach` e `afterAll`
- **Validação:** Scripts de pre-test verificam isolamento

## Conclusão

O fluxo personalizado está **100% testado** nas etapas essenciais:

- Cadastro ✅
- Aprovação Admin ✅
- Pagamento ✅
- Liberação de Login ✅

Todos os testes estão passando e o código está pronto para produção.

---

**Data:** 20/01/2026  
**Autor:** Copilot  
**Status:** ✅ APROVADO
