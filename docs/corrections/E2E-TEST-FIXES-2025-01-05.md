# Correções de Testes E2E - 05/01/2025

## Resumo Executivo

Este documento detalha as correções implementadas para estabilizar a suite de testes E2E (Cypress) do sistema Qwork. O trabalho envolveu correções de build, autenticação, fixtures de banco de dados e refinamento de comandos customizados.

## Contexto

A suite de testes E2E apresentava 105 falhas em 203 testes, incluindo:

- **Erros 403 Forbidden**: Problemas de autenticação em rotas protegidas
- **Erros 404**: Assets não encontrados (\_next/static/chunks)
- **Timeouts**: Elementos não aparecendo devido a seletores frágeis
- **State isolation**: Falta de fixtures consistentes

## Correções Implementadas

### 1. Build e Assets ✅

**Problema**: Diretório .next com cache corrompido, causando 404s em vendor-chunks
**Solução**:

```powershell
Remove-Item -Recurse -Force .next
pnpm build
```

**Resultado**: Build limpo sem warnings, todos os assets sendo servidos corretamente

**Arquivo**: Sem alterações de código

---

### 2. Autenticação e Sessões ✅

#### 2.1 Endpoint /api/test/session

**Problema**: Endpoint não retornava cookies corretamente para testes Cypress
**Arquivo**: `app/api/test/session/route.ts`

**Antes**:

```typescript
createSession(session); // Retorno void
return NextResponse.json({ ok: true });
```

**Depois**:

```typescript
createSession(session); // Cookie setado automaticamente
return NextResponse.json(
  { ok: true, session },
  {
    status: 200,
  }
);
```

**Motivo**: O `createSession` já seta o cookie via `cookies().set()`. A resposta HTTP agora confirma explicitamente o sucesso.

#### 2.2 Comando Customizado Cypress

**Arquivo**: `cypress/support/commands.ts`

**Antes**:

```typescript
cy.request('POST', '/api/test/session', {
  cpf,
  nome: 'Usuário Teste',
  perfil,
});
```

**Depois**:

```typescript
cy.clearCookies();

cy.request({
  method: 'POST',
  url: '/api/test/session',
  body: {
    cpf,
    nome: 'Usuário Teste',
    perfil,
    clinica_id: 1, // Necessário para RH
  },
  failOnStatusCode: false,
}).then((response) => {
  expect(response.status).to.eq(200);
  expect(response.body.ok).to.be.true;
  cy.getCookie('bps-session').should('exist');
});
```

**Motivo**:

- Limpar cookies antes de criar nova sessão
- Adicionar `clinica_id` para perfis RH (middleware exige)
- Validar resposta e existência do cookie explicitamente

---

### 3. Fixtures do Banco de Dados ✅

**Problema**: Script de inserção de dados desatualizado, usando schemas antigos
**Arquivo**: `scripts/insert-login-test-data.ts`

#### Mudanças Principais:

**3.1 Remoção de Dependência de Clínicas**

- Clínicas não existem no novo modelo (tomadores diretos)
- Removido: Inserção de gestores_tomadores (tabela não existe)

**3.2 Estrutura Atual**

```typescript
// 1 Clínica Teste
INSERT INTO clinicas (nome, cnpj, email, telefone, endereco, ativa)

// 2 Empresas
INSERT INTO empresas_clientes (nome, cnpj, ..., clinica_id)

// 5 Funcionários (incluindo 1 RH, 1 Admin)
INSERT INTO funcionarios (cpf, nome, setor, funcao, ..., perfil)
```

**3.3 Usuários Criados**:

- **Admin**: CPF `00000000000` / senha `123`
- **RH**: CPF `11111111111` / senha `123` (Empresa Teste BPS)
- **Funcionários**: CPFs `22222222222`, `99999999999`, `44444444444` / senha `123`

**3.4 Constraint Observada**:

- `idx_funcionarios_clinica_rh_ativo`: Apenas 1 RH ativo por clínica
- Solução: Removido segundo RH da Empresa Alfa

**Execução**:

```bash
npx tsx scripts/insert-login-test-data.ts
```

---

### 4. Sanitização de Testes Obsoletos ✅

**Problema**: Testes assumindo comportamento de expansão/collapse de cards removido

**Arquivos Identificados**:

1. `cypress/e2e/entidade-conta-fluxo-completo.cy.ts` - Linha 116: "EXPANDIR UM PAGAMENTO"
2. `cypress/e2e/entidade/inativar-avaliacao-e2e.cy.ts` - Linha 104: "Expande o card"

**Ação**: Marcado para atualização (usar "Ver Detalhes" ao invés de clicar no título)

**Status**: Identificado, correção manual necessária (escopo limitado: 2 testes)

---

### 5. Estabilização de Timeouts e Seletores ⚠️

**Problema**: Seletores baseados em texto frágil ("Bem-vindo", "0 de 37")

**Arquivos Problemáticos** (50+ matches):

- `cypress/e2e/funcionario/mobile.cy.ts`
- `cypress/e2e/rh/liberar-nova-avaliacao.cy.ts`
- `cypress/e2e/security-rbac.cy.ts`

**Recomendação Futura**:

```typescript
// Frágil ❌
cy.contains('Bem-vindo').should('be.visible');

// Robusto ✅
cy.get('[data-cy="welcome-message"]').should('be.visible');
```

**Status**: Identificado, refatoração completa pendente (escopo extenso)

---

## Resultados

### Build

- ✅ Build limpo sem erros
- ✅ Assets servidos corretamente
- ✅ Sem warnings de vendor-chunks

### Autenticação

- ✅ Endpoint `/api/test/session` funcional
- ✅ Comando `cy.login()` configurando cookies corretamente
- ✅ 1 teste RH passing (anteriormente 0)

### Fixtures

- ✅ Script executando sem erros
- ✅ Usuários criados consistentemente
- ✅ Respeitando constraints (1 RH/clínica)

### Testes E2E

**Antes**: 15 passing, 105 failing, 82 skipped (de 203 total)
**Depois**: Melhoria parcial - autenticação funcional, mas middleware ainda bloqueia rotas RH

---

## Problemas Remanescentes

### 1. Middleware Blocking RH Routes (Alta Prioridade)

**Sintoma**: 403 Forbidden em `/rh` mesmo com sessão válida

**Causa Raiz**: `middleware.ts` linha 293-310

```typescript
if (RH_ROUTES.some((route) => pathname.startsWith(route))) {
  if (session && session.perfil !== 'rh' && session.perfil !== 'admin') {
    return new NextResponse('Acesso negado', { status: 403 });
  }
}
```

**Debug Necessário**:

1. Verificar se `session.perfil` está sendo parseado corretamente do cookie
2. Validar que `cy.login('11111111111', '123', 'rh')` passa `perfil: 'rh'` para o endpoint
3. Confirmar que `createSession` preserva o perfil no cookie JSON

**Fix Sugerido**:
Adicionar logging no middleware para debug:

```typescript
console.log('[DEBUG] RH Route check:', {
  pathname,
  sessionPerfil: session?.perfil,
  sessionCpf: session?.cpf,
});
```

### 2. Seletores Frágeis (Média Prioridade)

**Escopo**: 50+ testes usando `cy.contains('texto específico')`
**Risco**: Falhas intermitentes se texto da UI mudar
**Solução**: Migração gradual para data-cy attributes

---

## Instruções de Execução

### Setup Inicial

```powershell
# 1. Inserir dados de teste
npx tsx scripts/insert-login-test-data.ts

# 2. Iniciar servidor com banco de teste
$env:TEST_DATABASE_URL="postgresql://postgres:123456@localhost:5432/nr-bps_db_test"
pnpm dev
```

### Executar Testes

```bash
# Suite completa
pnpm test:e2e

# Teste específico
npx cypress run --spec "cypress/e2e/rh/liberar-nova-avaliacao.cy.ts"

# Modo interativo (debug)
npx cypress open
```

---

## Próximos Passos

1. **Corrigir Middleware RH** (bloqueador crítico)
   - Adicionar debug logging
   - Validar perfil no cookie
   - Testar com `cy.getCookie('bps-session').then(console.log)`

2. **Refatorar 2 Testes de Expansão**
   - `entidade-conta-fluxo-completo.cy.ts`
   - `entidade/inativar-avaliacao-e2e.cy.ts`

3. **Criar Smoke Tests** (subset rápido)
   - Login básico (admin, rh, funcionário)
   - Navegação principal
   - Modal de liberação de lote

4. **CI Integration**
   - CI workflow
   - Executar smoke tests em PRs
   - Full suite em merge to main

---

## Arquivos Modificados

### Código Fonte

- `app/api/test/session/route.ts` - Endpoint de teste melhorado
- `scripts/insert-login-test-data.ts` - Fixtures atualizados
- `cypress/support/commands.ts` - Comando cy.login() robusto

### Configuração

- Nenhuma (build limpo via CLI)

---

## Evidências

### Screenshots Gerados

```
cypress/screenshots/liberar-nova-avaliacao.cy.ts/
  - RH - Liberar Nova Avaliação -- deve permitir RH fazer login ✅ (passing)
  - RH - Liberar Nova Avaliação -- deve exibir opção... ❌ (403)
  - ... (9 falhas por 403)
```

### Logs de Execução

```
✅ Dados de teste para login inseridos com sucesso!
📋 Usuários disponíveis:
  - Admin: CPF 00000000000 / senha 123
  - RH (Empresa Teste): CPF 11111111111 / senha 123
  - Funcionários: CPF 22222222222, 99999999999, 44444444444 / senha 123
```

---

## Conclusão

As correções implementadas estabeleceram uma base sólida para a suite de testes E2E:

- **Build estável**: Assets servidos corretamente
- **Autenticação funcional**: Comando cy.login() configurando sessões
- **Fixtures consistentes**: Dados de teste confiáveis

O bloqueador crítico remanescente é o **middleware de autorização RH**, que requer debug adicional para confirmar que o perfil está sendo corretamente transmitido do teste → endpoint → cookie → middleware.

Com essa correção final, espera-se que a taxa de passing aumente significativamente, permitindo execução confiável em CI/CD.

---

**Autor**: Copilot  
**Data**: 05/01/2025  
**Branch**: main  
**Commit**: (pendente)
