# Guia Completo de Testes - Qwork

**Data de consolidação:** 29 de janeiro de 2026  
**Status:** Documentação unificada oficial

---

## 📋 Índice

1. [Boas Práticas Gerais](#boas-práticas-gerais)
2. [Testes de Fluxos de Pagamento](#testes-de-fluxos-de-pagamento)
3. [Testes de Empresas e Funcionários](#testes-de-empresas-e-funcionários)
4. [Proteção de Dados de Produção](#proteção-de-dados-de-produção)
5. [Fixtures e Dados de Teste](#fixtures-e-dados-de-teste)

---

## Boas Práticas Gerais

### 1. IDs de Teste Seguros

✅ **SEMPRE usar IDs altos para dados de teste:**

```typescript
// ✅ CORRETO
const testContratanteId = 999999;
const testUsuarioId = 888888;
const testEmpresaId = 777777;

// ❌ ERRADO
const testContratanteId = 1; // Pode conflitar com dados reais!
```

**Range recomendado para IDs de teste:** 900000+

### 2. Isolamento de Dados

✅ **Usar prefixos identificáveis em dados de teste:**

```typescript
// ✅ CORRETO
const testCnpj = '99999999000199'; // Claramente identificável como teste
const testEmail = 'teste.automatizado@exemplo.com';
const testNome = 'EMPRESA TESTE AUTOMATIZADO';
const testCpf = '99999999999';

// ❌ ERRADO
const testCnpj = '12345678000190'; // Pode parecer real
```

### 3. Limpeza Seletiva

✅ **DELETE com WHERE específico:**

```typescript
// ✅ CORRETO - Específico
await query('DELETE FROM contratantes WHERE id = $1', [testContratanteId]);
await query('DELETE FROM empresas_clientes WHERE cnpj LIKE $1', ['99999%']);

// ❌ ERRADO - Genérico demais
await query('DELETE FROM contratantes'); // NUNCA!
```

### 4. Proteção de Senhas de Gestores

⚠️ **NUNCA sobrescrever senhas de contratantes reais:**

```typescript
// ✅ CORRETO - Verificar antes de atualizar
const existing = await query(
  'SELECT senha_hash FROM contratantes_senhas WHERE contratante_id = $1',
  [contratanteId]
);

if (!existing.rows.length) {
  // Só cria se não existir
  await query(
    'INSERT INTO contratantes_senhas (contratante_id, senha_hash) VALUES ($1, $2)',
    [contratanteId, hashedPassword]
  );
}

// ❌ ERRADO - Sobrescreve sem verificar
await query(
  'UPDATE contratantes_senhas SET senha_hash = $1 WHERE contratante_id = $2',
  [newHash, contratanteId]
);
```

### 5. Variáveis de Ambiente para Testes

```bash
# .env.test
DATABASE_URL=postgresql://postgres:password@localhost:5432/qwork_test
NODE_ENV=test
SKIP_EMAIL_NOTIFICATIONS=true
MOCK_PAYMENT_PROVIDER=true
```

### 6. Setup e Teardown

```typescript
// jest.setup.js
beforeEach(async () => {
  // Iniciar transação
  await db.raw('BEGIN');
});

afterEach(async () => {
  // Rollback para limpar
  await db.raw('ROLLBACK');
});

afterAll(async () => {
  // Fechar conexões
  await db.destroy();
});
```

---

## Testes de Fluxos de Pagamento

### Teste 1: Cadastro com Plano Fixo

**Objetivo:** Validar fluxo completo de cadastro → contrato → pagamento

```typescript
describe('Cadastro com Plano Fixo', () => {
  test('deve criar contratante e aguardar pagamento', async () => {
    // 1. Criar cadastro
    const response = await fetch('/api/cadastro/contratante', {
      method: 'POST',
      body: JSON.stringify({
        cnpj: '99999999000199',
        razao_social: 'TESTE EMPRESA LTDA',
        plano_id: 1, // Plano fixo
        responsavel: {
          cpf: '99999999999',
          nome: 'Teste Responsável',
          email: 'teste@exemplo.com',
          senha: 'Teste@123',
        },
      }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();

    // 2. Verificar status
    const contratante = await db('contratantes')
      .where({ id: data.contratanteId })
      .first();

    expect(contratante.status).toBe('aguardando_pagamento');

    // 3. Verificar contrato criado
    const contrato = await db('contratos')
      .where({ contratante_id: data.contratanteId })
      .first();

    expect(contrato).toBeDefined();
    expect(contrato.status).toBe('aguardando_aceite');
  });
});
```

### Teste 2: Falha de Pagamento

**Objetivo:** Garantir que falha no pagamento não libera acesso

```typescript
describe('Falha de Pagamento', () => {
  test('deve manter status aguardando_pagamento após erro', async () => {
    // 1. Criar cadastro aprovado
    const contratanteId = await criarContratanteTeste({
      status: 'aguardando_pagamento',
    });

    // 2. Simular erro no pagamento
    const response = await fetch('/api/pagamento/processar', {
      method: 'POST',
      body: JSON.stringify({
        contratante_id: contratanteId,
        force_error: true, // Flag de teste
      }),
    });

    expect(response.status).toBe(500);

    // 3. Verificar que status não mudou
    const contratante = await db('contratantes')
      .where({ id: contratanteId })
      .first();

    expect(contratante.status).toBe('aguardando_pagamento');

    // 4. Verificar que acesso não foi liberado
    const loginResponse = await fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({
        cpf: '99999999999',
        senha: 'Teste@123',
      }),
    });

    expect(loginResponse.status).toBe(403);
  });
});
```

### Teste 3: Cadastro com Plano Personalizado

**Objetivo:** Validar fluxo de aprovação manual

```typescript
describe('Cadastro com Plano Personalizado', () => {
  test('deve criar como pendente e aguardar aprovação', async () => {
    // 1. Criar cadastro
    const response = await fetch('/api/cadastro/contratante', {
      method: 'POST',
      body: JSON.stringify({
        cnpj: '99999999000188',
        razao_social: 'TESTE PERSONALIZADO LTDA',
        plano_id: null, // Plano personalizado
        mensagem: 'Preciso de 100 funcionários',
        responsavel: {
          cpf: '99999999988',
          nome: 'Teste Gestor',
          email: 'gestor@exemplo.com',
          senha: 'Senha@123',
        },
      }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();

    // 2. Verificar status pendente
    const contratante = await db('contratantes')
      .where({ id: data.contratanteId })
      .first();

    expect(contratante.status).toBe('pendente');

    // 3. Verificar criação de contratacao_personalizada
    const personalizacao = await db('contratacao_personalizada')
      .where({ contratante_id: data.contratanteId })
      .first();

    expect(personalizacao).toBeDefined();
    expect(personalizacao.status).toBe('aguardando_valor_admin');
  });
});
```

---

## Testes de Empresas e Funcionários

### Teste 1: Cadastro de Empresa Cliente

**Objetivo:** Validar criação de empresa vinculada a contratante

```typescript
describe('Cadastro de Empresa Cliente', () => {
  test('RH deve poder cadastrar empresa', async () => {
    // 1. Criar contratante RH ativo
    const { contratanteId, sessionToken } = await criarContratanteAtivoTeste();

    // 2. Cadastrar empresa
    const response = await fetch('/api/empresas', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cnpj: '99999999000177',
        razao_social: 'EMPRESA CLIENTE TESTE',
        nome_fantasia: 'CLIENTE TESTE',
        representante: {
          nome: 'Representante Teste',
          telefone: '11999999999',
          email: 'rep@teste.com',
        },
      }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();

    // 3. Verificar vínculo
    const empresa = await db('empresas_clientes')
      .where({ id: data.empresaId })
      .first();

    expect(empresa.contratante_id).toBe(contratanteId);
  });
});
```

### Teste 2: Isolamento entre Clínicas

**Objetivo:** Garantir que RLS impede acesso cross-clinic

```typescript
describe('Isolamento RLS - Empresas', () => {
  test('RH não deve ver empresas de outra clínica', async () => {
    // 1. Criar duas clínicas
    const { sessionToken: token1 } = await criarContratanteAtivoTeste({
      cnpj: '99999999000166',
    });
    const { sessionToken: token2 } = await criarContratanteAtivoTeste({
      cnpj: '99999999000155',
    });

    // 2. Clínica 1 cria empresa
    const empresa1 = await fetch('/api/empresas', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token1}` },
      body: JSON.stringify({
        cnpj: '99999999000144',
        razao_social: 'EMPRESA CLINICA 1',
      }),
    });

    // 3. Clínica 2 tenta listar empresas
    const response = await fetch('/api/empresas', {
      headers: { Authorization: `Bearer ${token2}` },
    });

    const empresas = await response.json();

    // 4. Não deve ver empresa da clínica 1
    expect(empresas.find((e) => e.cnpj === '99999999000144')).toBeUndefined();
  });
});
```

---

## Proteção de Dados de Produção

### Checklist Pré-Execução

Antes de rodar testes, **SEMPRE** verificar:

- [ ] `NODE_ENV=test` está configurado
- [ ] Usando banco de dados de teste (não produção)
- [ ] IDs de teste são >= 900000
- [ ] CNPJs/CPFs começam com 99999
- [ ] Emails contêm "teste" ou "exemplo.com"
- [ ] Transações com ROLLBACK configuradas

### Comandos Seguros

```powershell
# Executar testes unitários
pnpm test:unit

# Executar testes de integração (banco de teste)
pnpm test:integration

# Executar com coverage
pnpm test:coverage

# Executar teste específico
pnpm test -- cadastro-contratante.test.ts
```

### Comandos PERIGOSOS (nunca em produção!)

```powershell
# ❌ NUNCA EXECUTAR EM PRODUÇÃO
# Limpar dados de teste (só em ambiente de desenvolvimento)
psql -d qwork_test -c "DELETE FROM contratantes WHERE id >= 900000"
psql -d qwork_test -c "DELETE FROM empresas_clientes WHERE cnpj LIKE '99999%'"
```

---

## Fixtures e Dados de Teste

### Criar Fixtures Reutilizáveis

```typescript
// tests/fixtures/contratantes.ts

export async function criarContratanteTeste(overrides = {}) {
  const defaultData = {
    id: 999000 + Math.floor(Math.random() * 999),
    cnpj: `9999999900${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`,
    razao_social: 'TESTE EMPRESA LTDA',
    tipo: 'clinica',
    status: 'ativo',
    ...overrides,
  };

  const [contratante] = await db('contratantes')
    .insert(defaultData)
    .returning('*');

  return contratante;
}

export async function criarContratanteAtivoTeste(overrides = {}) {
  // Criar contratante
  const contratante = await criarContratanteTeste({
    status: 'ativo',
    ...overrides,
  });

  // Criar conta responsável
  const responsavel = await db('funcionarios')
    .insert({
      cpf: '99999999900',
      nome: 'Gestor Teste',
      perfil: 'rh',
    })
    .returning('*');

  // Criar senha
  await db('contratantes_senhas').insert({
    contratante_id: contratante.id,
    senha_hash: await bcrypt.hash('Teste@123', 10),
  });

  // Criar sessão
  const sessionToken = jwt.sign(
    { contratanteId: contratante.id, perfil: 'rh' },
    process.env.JWT_SECRET
  );

  return { contratante, responsavel, sessionToken };
}
```

### Usar Fixtures nos Testes

```typescript
import { criarContratanteAtivoTeste } from './fixtures/contratantes';

describe('API Empresas', () => {
  test('deve listar empresas da clínica', async () => {
    const { sessionToken } = await criarContratanteAtivoTeste();

    const response = await fetch('/api/empresas', {
      headers: { Authorization: `Bearer ${sessionToken}` },
    });

    expect(response.status).toBe(200);
  });
});
```

---

## Padrões de Qualidade de Código de Teste

### Características dos Melhores Testes

Baseado em análise de 494 testes (Janeiro 2026), os testes de melhor qualidade (score 85-100) compartilham estas características:

#### 1. Documentação Completa

```typescript
/**
 * Testes de [Módulo/Funcionalidade]
 *
 * @description
 * [O que é testado e por quê]
 *
 * Cobertura:
 * - Funcionalidade A
 * - Caso de borda B
 *
 * @see {@link /caminho/arquivo.ts}
 */
```

#### 2. Type Imports

```typescript
// ✅ Separar tipos de valores
import type { QueryResult } from 'pg';
import { query } from '@/lib/db';
```

#### 3. Limpeza de Mocks

```typescript
describe('Testes', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Sempre presente
  });
});
```

#### 4. Estrutura AAA

```typescript
it('deve fazer algo', async () => {
  // Arrange: Preparar
  const data = { test: true };

  // Act: Executar
  const result = await fn(data);

  // Assert: Verificar
  expect(result).toBe(expected);
});
```

#### 5. Nomes Descritivos

```typescript
// ✅ Bom
it('deve marcar lote como concluído quando todas avaliações forem finalizadas', () => {});

// ❌ Ruim
it('testa lote', () => {});
```

### Ferramentas de Análise

```bash
# Analisar qualidade de todos os testes
pnpm quality:tests-analyze

# Ver relatório detalhado
cat __tests__/quality-report.json

# Validar política de mocks
pnpm validate:mocks
```

### Checklist por Teste

- [ ] JSDoc completo no topo
- [ ] `import type` para tipos
- [ ] `beforeEach(() => jest.clearAllMocks())`
- [ ] Comentários AAA em testes complexos
- [ ] Nomes descritivos (deve X quando Y)
- [ ] Sem `console.log`
- [ ] Sem `@ts-nocheck` injustificado
- [ ] `afterAll` para cleanup

### Referências de Qualidade

- **Template Perfeito**: `tests/api/emissor/laudos/hash-sha256-laudo.test.ts`
- **Guia Detalhado**: `__tests__/TOP10-CHARACTERISTICS.md`
- **Referência Rápida**: `__tests__/QUICK-REFERENCE.md`
- **Política de Mocks**: `docs/testing/MOCKS_POLICY.md` (seção Padrões de Qualidade)

---

## Comandos Úteis

### Executar Testes

```powershell
# Todos os testes
pnpm test

# Apenas unitários
pnpm test:unit

# Apenas integração
pnpm test:integration

# Com watch mode
pnpm test:watch

# Teste específico
pnpm test -- --testNamePattern="Cadastro com Plano Fixo"
```

### Limpar Dados de Teste (ambiente test apenas!)

```powershell
# Via script
cd scripts
.\cleanup-test-data.ps1

# Ou via SQL (CUIDADO!)
psql -d qwork_test -c "
  DELETE FROM contratantes WHERE id >= 900000;
  DELETE FROM empresas_clientes WHERE cnpj LIKE '99999%';
  DELETE FROM funcionarios WHERE cpf LIKE '99999%';
"
```

---

## Referências

### Documentação de Testes

- **Política de Mocks**: `docs/testing/MOCKS_POLICY.md`
- **Guia Completo**: Este arquivo
- **Exemplo de Testes**: `docs/testing/MOCKS_POLICY_EXAMPLE.test.tsx`

### Estrutura de Testes

- **Índice Master**: `__tests__/INDEX.md`
- **Guia Rápido**: `__tests__/QUICKSTART.md`
- **Inventário**: `__tests__/INVENTORY.md`
- **Características Top 10**: `__tests__/TOP10-CHARACTERISTICS.md`
- **Referência Rápida**: `__tests__/QUICK-REFERENCE.md`

### Configuração

- **Jest Config**: `jest.config.cjs`, `jest.unit.config.cjs`
- **Fixtures**: `tests/fixtures/`
- **Setup Global**: `jest.global-setup.cjs`, `jest.setup.js`

### Ferramentas

- **Análise de Qualidade**: `scripts/analyze-test-quality.cjs`
- **Validador de Mocks**: `scripts/validate-mock-policy.cjs`
- **Helpers de Teste**: `__tests__/lib/test-helpers.ts`

### Exemplos de Testes Exemplares

- **Template Perfeito** (Score 100): `tests/api/emissor/laudos/hash-sha256-laudo.test.ts`
- **Lógica Complexa**: `__tests__/lib/recalculo-emissao-inativadas.test.ts`
- **Segurança**: `__tests__/seguranca/protecao-senhas.test.ts`
- **RLS/RBAC**: `__tests__/security/rls-rbac.test.ts`

---

## Histórico

| Data       | Descrição                                     |
| ---------- | --------------------------------------------- |
| 25/12/2025 | Guia de testes de correção de pagamento       |
| 29/01/2026 | Consolidação em guia completo de testes       |
| 31/01/2026 | Adicionado padrões de qualidade e referências |
