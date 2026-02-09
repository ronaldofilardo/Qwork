# Fluxo de Aprovação e Liberação de Login - tomadores

**Última atualização:** 24/12/2025  
**Status:** ✅ Documentação Completa

---

## 📋 Visão Geral

Este documento detalha o fluxo completo desde a **aprovação de um novo tomador** até a **liberação do login**, diferenciando os dois tipos: **Entidade** e **Clínica**.

---

## 🔄 Fluxo Geral (Ambos os Tipos)

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. CADASTRO INICIAL                                             │
│    - tomador preenche formulário                            │
│    - Status inicial: 'pendente'                                 │
│    - Flags: ativa=false, pagamento_confirmado=false             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. VALIDAÇÃO ADMIN                                              │
│    - Admin visualiza em "Novos Cadastros"                       │
│    - Revisa documentos e dados                                  │
│    - Decide: Aprovar / Rejeitar / Solicitar Reanálise           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                     ┌───────┴────────┐
                     │                │
              [APROVAR]          [REJEITAR]
                     │                │
                     │                └──> Status='rejeitado'
                     │                     motivo_rejeicao preenchido
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. APROVAÇÃO (handleAprovartomador)                         │
│    API: POST /api/admin/novos-cadastros                         │
│    Handler: handlers.ts → handleAprovartomador()            │
│                                                                  │
│    Executa:                                                     │
│    → aprovartomador(id, admin_cpf, session)                 │
│      - Status: 'pendente' → 'aprovado'                          │
│      - aprovado_em = NOW()                                      │
│      - aprovado_por_cpf = admin_cpf                             │
│                                                                  │
│    → SE tipo='clinica':                                         │
│      - INSERT INTO clinicas (...) VALUES (...)                  │
│      - Cria registro na tabela 'clinicas'                       │
│      - clinica.tomador_id = tomador.id                  │
│                                                                  │
│    → Log Audit: 'liberar_login' action                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. ATIVAÇÃO (ativartomador)                                 │
│    Módulo: lib/tomador-activation.ts                        │
│                                                                  │
│    Validações:                                                  │
│    ✓ tomador.ativa == false (não pode ativar já ativo)     │
│    ✓ tomador.status != 'cancelado'                          │
│    ✓ tomador.pagamento_confirmado == true                   │
│      OU isencao_manual=true (requer admin_cpf)                  │
│                                                                  │
│    Atualização:                                                 │
│    → UPDATE tomadores SET                                    │
│        ativa = true,                                            │
│        status = 'aprovado',                                     │
│        data_liberacao_login = NOW(),                            │
│        aprovado_em = COALESCE(aprovado_em, NOW())               │
│                                                                  │
│    → Log Audit obrigatório (ACTIVATE action)                    │
│    → COMMIT da transação                                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. CRIAÇÃO DE CONTA (criarContaResponsavel)                     │
│    Módulo: lib/db.ts                                            │
│    Chamado por: tomador-activation.ts após ativação         │
│                                                                  │
│    Gera Senha:                                                  │
│    → defaultPassword = últimos 6 dígitos do CNPJ (sem formatação)│
│    → hashed = bcrypt.hash(defaultPassword, 10)                  │
│                                                                  │
│    1. INSERT/UPDATE entidades_senhas:                        │
│       - tomador_id                                          │
│       - cpf (responsavel_cpf)                                   │
│       - senha_hash (bcrypt)                                     │
│                                                                  │
│    2. SE tipo != 'entidade':                                    │
│       → INSERT/UPDATE funcionarios:                             │
│         - cpf = responsavel_cpf                                 │
│         - perfil = 'rh'                                         │
│         - tomador_id                                        │
│         - senha_hash (bcrypt)                                   │
│       → INSERT tomadores_funcionarios (vínculo)              │
│                                                                  │
│       SE tipo == 'entidade':                                    │
│       → NÃO cria funcionario                                    │
│       → Login direto via entidades_senhas                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. LOGIN LIBERADO                                               │
│    Credenciais:                                                 │
│    - CPF: tomador.responsavel_cpf                           │
│    - Senha: últimos 6 dígitos do CNPJ                           │
│                                                                  │
│    Tabelas de Autenticação:                                     │
│    - entidades_senhas (ambos os tipos)                       │
│    - funcionarios (apenas clínica)                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🏢 Diferenças: Entidade vs Clínica

### **TIPO: ENTIDADE**

#### Características

- Representa uma **empresa direta** que contrata o sistema
- **Não** gerencia outras empresas
- Relacionamento: `tomador (entidade) → empresas_clientes → funcionarios`

#### Fluxo de Aprovação

1. ✅ **Aprovação**: Status muda para 'aprovado'
2. ✅ **Ativação**: `ativa=true` após validação de pagamento
3. ✅ **Criação de Senha**: `entidades_senhas` (CPF + bcrypt hash)
4. ❌ **NÃO cria funcionario**: Responsável **não** entra na tabela `funcionarios`
5. ✅ **Login**: Via `entidades_senhas` apenas

#### Estrutura de Dados

```sql
-- tomador entidade
tomadores:
  id=7, tipo='entidade', nome='Empresa ABC Ltda',
  responsavel_cpf='12345678901', cnpj='12345678000100'

-- Senha do responsável
entidades_senhas:
  tomador_id=7, cpf='12345678901', senha_hash='$2b$10...'

-- Empresas associadas (pode ser a própria entidade ou subsidiárias)
empresas_clientes:
  id=3, nome='Empresa ABC', tomador_id=7, clinica_id=NULL

-- ❌ NÃO existe em funcionarios com perfil especial
```

#### Login da Entidade

- **Endpoint**: `/api/auth/login` ou `/api/auth/login-entidade`
- **Validação**: Busca em `entidades_senhas` WHERE `cpf = ? AND tomador_id = ?`
- **Perfil retornado**: `gestor` ou `rh` (derivado da sessão)

---

### **TIPO: CLÍNICA**

#### Características

- Representa uma **clínica** que gerencia **múltiplas empresas clientes**
- Relacionamento: `tomador (clinica) → clinica → empresas_clientes → funcionarios`

#### Fluxo de Aprovação

1. ✅ **Aprovação**:
   - Status muda para 'aprovado'
   - **Cria registro em `clinicas`** automaticamente
     ```sql
     INSERT INTO clinicas (nome, cnpj, email, telefone, endereco, cidade, estado, tomador_id)
     VALUES (...) ON CONFLICT (tomador_id) DO NOTHING
     ```
2. ✅ **Confirmação de Pagamento**: Automática via simulador de pagamento
3. ✅ **Ativação AUTOMÁTICA**: `ativa=true` imediatamente após confirmação de pagamento
4. ✅ **Criação de Senha**: `entidades_senhas` (CPF + bcrypt hash)
5. ❌ **NÃO cria funcionario**: Responsável **não** entra na tabela `funcionarios` (intencional)
6. ✅ **Login**: Via `entidades_senhas` apenas

#### Estrutura de Dados

```sql
-- tomador clínica
tomadores:
  id=8, tipo='clinica', nome='Clínica BPS Saúde',
  responsavel_cpf='98765432100', cnpj='98765432000199'

-- Registro da clínica criado automaticamente na aprovação
clinicas:
  id=1, nome='Clínica BPS Saúde', tomador_id=8, cnpj='98765432000199'

-- Senha do responsável
entidades_senhas:
  tomador_id=8, cpf='98765432100', senha_hash='$2b$10...'

-- ❌ NÃO existe em funcionarios (responsável não é funcionário)

-- Empresas gerenciadas pela clínica
empresas_clientes:
  id=4, nome='Empresa XYZ', clinica_id=1, tomador_id=NULL
```

#### Login da Clínica

- **Endpoint**: `/api/auth/login` ou `/api/auth/login-clinica`
- **Validação**: Busca em `entidades_senhas` WHERE `cpf = ? AND tomador_id = ?`
- **Perfil retornado**: `gestor_clinica` ou `rh` (derivado da sessão)

---

## ⚠️ Pontos Críticos e Validações

### 1. **Aprovação SEM Ativação Automática**

```typescript
// lib/db.ts → aprovartomador()
// ❌ NÃO ativa automaticamente
UPDATE tomadores
SET status = 'aprovado',
    aprovado_em = CURRENT_TIMESTAMP,
    aprovado_por_cpf = $2
WHERE id = $1
-- Nota: ativa ainda é false aqui
```

**Por quê?**

- Ativação requer **pagamento confirmado** ou **isenção manual**
- Separação de responsabilidades: Aprovação ≠ Ativação

---

### 2. **Ativação AUTOMÁTICA Pós-Pagamento**

```typescript
// Após confirmação de pagamento no simulador:
// Sistema chama ativartomador() automaticamente
// lib/tomador-activation.ts → ativartomador()
if (!tomador.pagamento_confirmado && !isencao_manual) {
  throw new Error(
    'Não é possível ativar tomador sem pagamento confirmado. Use isencao_manual apenas em casos excepcionais.'
  );
}
```

**Regras:**

- ✅ Pagamento confirmado no simulador → **Ativa AUTOMATICAMENTE**
- ✅ Isenção manual (requer `admin_cpf`) → Ativa com log de auditoria (casos excepcionais)
- ❌ Sem pagamento E sem isenção → BLOQUEIO
- ℹ️ **Admin NUNCA cria contas manualmente** - tudo é automatizado

---

### 3. **Criação de Conta APÓS Ativação**

```typescript
// lib/tomador-activation.ts → ativartomador()
await query('COMMIT'); // Ativação comitada

try {
  await criarContaResponsavel(tomador_id);
} catch (accountError) {
  console.error('Erro ao criar conta responsável:', accountError);
  result.warning = 'Conta responsável não foi criada automaticamente.';
}
```

**Importante:**

- Se `criarContaResponsavel()` falhar, a ativação **NÃO é revertida**
- Sistema tenta recriar automaticamente na próxima tentativa de login
- Erro não bloqueia a ativação (design deliberado)
- **Admin NUNCA cria contas manualmente** - processo totalmente automatizado

---

### 4. **Senha Padrão Baseada em CNPJ**

```typescript
// lib/db.ts → criarContaResponsavel()
const cleanCnpj = cnpj.replace(/[./-]/g, ''); // Remove formatação
const defaultPassword = cleanCnpj.slice(-6); // Últimos 6 dígitos
const hashed = await bcrypt.hash(defaultPassword, 10);
```

**Exemplo:**

- CNPJ: `12.345.678/0001-00`
- Senha padrão: `000100` (últimos 6 dígitos)
- Hash armazenado: `$2b$10$...` (bcrypt)

---

### 5. **Trigger de Auditoria Requer Contexto**

```sql
-- Audit trigger precisa de:
SET app.current_user_cpf = '12345678901';
SET app.current_user_perfil = 'admin';

-- Caso contrário:
ERROR: valor NULL na coluna "usuario_cpf" da relação "audit_logs" viola a restrição NOT NULL
```

**Solução:**

- APIs admin passam `session` para `query(text, params, session)`
- `lib/db.ts` configura contexto automaticamente via `SET LOCAL`

---

## 🐛 Erros Comuns e Diagnóstico

### ❌ Erro: "tomador não pode ser ativado"

**Mensagem completa:**

```
Não é possível ativar tomador sem pagamento confirmado.
```

**Causa:**

- `tomador.pagamento_confirmado = false`
- Tentativa de ativar sem isenção manual

**Solução:**

1. Confirmar pagamento via admin: `UPDATE tomadores SET pagamento_confirmado=true WHERE id=?`
2. OU usar isenção manual: `ativartomador({ tomador_id, isencao_manual: true, admin_cpf })`

---

### ❌ Erro: "Conta responsável não criada"

**Mensagem completa:**

```
Conta responsável não foi criada automaticamente.
```

**Causa:**

- Erro em `criarContaResponsavel()` (ex: CPF duplicado, CNPJ inválido)
- Ativação foi bem-sucedida, mas criação de senha falhou

**Solução:**

1. Verificar `entidades_senhas` se senha existe: `SELECT * FROM entidades_senhas WHERE tomador_id=?`
2. Sistema tentará recriar automaticamente no próximo login
3. Verificar logs de erro para identificar a causa raiz
4. **Não é necessário intervenção manual** - processo é automatizado

---

### ❌ Erro: "Clínica não encontrada após aprovação"

**Causa:**

- Registro na tabela `clinicas` não foi criado durante aprovação
- Possível falha silenciosa no `aprovartomador()`

**Diagnóstico:**

```sql
-- Verificar se clinica existe
SELECT c.id as tomador_id, c.nome, cl.id as clinica_id
FROM tomadores c
LEFT JOIN clinicas cl ON cl.tomador_id = c.id
WHERE c.tipo='clinica' AND c.id=?;

-- Se clinica_id for NULL, verificar logs e reexecutar aprovação
```

---

### ❌ Erro: "Login negado após aprovação (Pagamento não confirmado)"

**Causa:**

- tomador aprovado mas não ativado (`ativa=false`)
- Pagamento ainda não confirmado no simulador
- Senha não criada em `entidades_senhas`

**Diagnóstico:**

```sql
-- Verificar status completo
SELECT
  c.id, c.tipo, c.ativa, c.status, c.pagamento_confirmado,
  cs.cpf, cs.senha_hash
FROM tomadores c
LEFT JOIN entidades_senhas cs ON cs.tomador_id = c.id
WHERE c.id = ?;
```

**Checklist:**

- [ ] `ativa = true`?
- [ ] `status = 'aprovado'`?
- [ ] `pagamento_confirmado = true`?
- [ ] `entidades_senhas` tem registro?
- [ ] Sistema recebeu callback do simulador de pagamento?

---

## 📊 Estados do tomador

| Campo                  | Pendente     | Aprovado (Aguardando) | Ativo (Liberado) | Rejeitado     |
| ---------------------- | ------------ | --------------------- | ---------------- | ------------- |
| `status`               | `'pendente'` | `'aprovado'`          | `'aprovado'`     | `'rejeitado'` |
| `ativa`                | `false`      | `false`               | `true`           | `false`       |
| `pagamento_confirmado` | `false`      | `false`               | `true`           | `false`       |
| `aprovado_em`          | `NULL`       | `TIMESTAMP`           | `TIMESTAMP`      | `NULL`        |
| `data_liberacao_login` | `NULL`       | `NULL`                | `TIMESTAMP`      | `NULL`        |
| **Pode logar?**        | ❌           | ❌                    | ✅               | ❌            |

**Estado "Aprovado mas Inativo":**

- Admin aprovou cadastro
- Sistema aguarda confirmação de pagamento
- Login ainda não liberado

---

## 🔐 Autenticação por Tipo

### **Entidade**

```typescript
// Busca apenas em entidades_senhas
const senhaResult = await query(
  'SELECT * FROM entidades_senhas WHERE cpf = $1',
  [cpf]
);
// Valida bcrypt.compare(senha, senha_hash)
// Session: { perfil: 'gestor', tomador_id }
```

### **Clínica**

```typescript
// Busca em entidades_senhas (IGUAL à entidade)
const senhaResult = await query(
  "SELECT cs.*, c.tipo FROM entidades_senhas cs JOIN tomadores c ON cs.tomador_id = c.id WHERE cs.cpf = $1 AND c.tipo='clinica'",
  [cpf]
);
// Valida bcrypt.compare(senha, senha_hash)
// Session: { perfil: 'gestor_clinica', clinica_id, tomador_id }
```

**Importante:** Ambos os tipos (entidade e clínica) usam **apenas** `entidades_senhas` para autenticação.

---

## 🧪 Testes de Fluxo

### **Script de Teste Entidade**

```powershell
.\scripts\tests\test-flow-entidade.ps1
```

### **Script de Teste Clínica**

```powershell
.\scripts\tests\test-flow-clinica.ps1
```

Ambos simulam o fluxo completo:

1. Cadastro de tomador
2. Aprovação por admin
3. Confirmação de pagamento
4. Ativação e criação de conta
5. Teste de login

---

## 📚 Referências de Código

### **Arquivos Principais**

1. **Handlers de Aprovação**
   - [app/api/admin/novos-cadastros/handlers.ts](app/api/admin/novos-cadastros/handlers.ts)
     - `handleAprovartomador()` (linha ~102)
     - `handleRejeitartomador()` (linha ~140)
     - `handleSolicitarReanalise()` (linha ~180)

2. **Ativação de tomador**
   - [lib/tomador-activation.ts](lib/tomador-activation.ts)
     - `ativartomador()` (linha 45)
     - `desativartomador()` (linha 175)

3. **Criação de Conta**
   - [lib/db.ts](lib/db.ts)
     - `criarContaResponsavel()` (linha 1342)
     - `aprovartomador()` (linha ~950)

4. **Schemas de Validação**
   - [app/api/admin/novos-cadastros/schemas.ts](app/api/admin/novos-cadastros/schemas.ts)
     - `Aprovartomadoreschema`
     - `Rejeitartomadoreschema`

---

## ✅ Checklist de Implementação

Para novos desenvolvedores ou ao revisar o fluxo:

- [ ] tomador criado com `status='pendente'` e `ativa=false`
- [ ] Admin aprova via `/api/admin/novos-cadastros` com `acao='aprovar'`
- [ ] `aprovartomador()` altera `status='aprovado'` sem ativar
- [ ] Se `tipo='clinica'`, cria registro em `clinicas` automaticamente
- [ ] Simulador de pagamento confirma → `pagamento_confirmado=true`
- [ ] **Ativação AUTOMÁTICA**: `ativartomador()` executado pelo sistema
- [ ] `criarContaResponsavel()` cria senha em `entidades_senhas`
- [ ] **Ambos os tipos** (entidade e clínica) NÃO criam em `funcionarios`
- [ ] Senha padrão = últimos 6 dígitos do CNPJ (bcrypt hash)
- [ ] Audit logs registram todas as ações críticas
- [ ] Login liberado apenas se `ativa=true` e senha existir
- [ ] **Admin NUNCA cria contas manualmente** - processo totalmente automatizado

---

## 🎯 Resumo Executivo

| Aspecto                         | Entidade                      | Clínica                                 |
| ------------------------------- | ----------------------------- | --------------------------------------- |
| **Criação de `clinicas`?**      | ❌ Não                        | ✅ Sim (na aprovação)                   |
| **Registro em `funcionarios`?** | ❌ Não                        | ❌ Não                                  |
| **Autenticação via**            | `entidades_senhas`            | `entidades_senhas`                      |
| **Perfil de login**             | `gestor`                      | `gestor_clinica`                        |
| **Gerencia empresas?**          | Diretamente (próprias)        | Múltiplas clientes via `clinicas`       |
| **Estrutura**                   | `tomador → empresas_clientes` | `tomador → clinica → empresas_clientes` |
| **Ativação**                    | Automática pós-pagamento      | Automática pós-pagamento                |

---

**Documentado por:** Copilot  
**Revisão técnica:** Necessária após merge da branch `fix/database-structure`
