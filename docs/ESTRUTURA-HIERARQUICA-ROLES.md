# Estrutura Hierárquica dos Papéis - Qwork

## Visão Geral

Este documento descreve a estrutura hierárquica completa de como cada papel (role) opera no sistema.

## 🏥 RH - Gestor de Clínica

### Estrutura Hierárquica

```
┌─────────────────────────────────────┐
│         CLÍNICA (clinica_id)        │
│                                     │
│  👤 RH (gestor da clínica)          │
│     - Único "funcionário" da clínica│
│     - Não é avaliado                │
│     - Gerencia empresas clientes    │
└─────────────────────────────────────┘
              │
              │ atende/gerencia
              ▼
┌─────────────────────────────────────┐
│    EMPRESAS CLIENTES (empresa_id)   │
│                                     │
│  🏢 Empresa Cliente 1               │
│  🏢 Empresa Cliente 2               │
│  🏢 Empresa Cliente 3               │
│  ...                                │
│                                     │
│  Vinculadas: clinica_id + empresa_id│
└─────────────────────────────────────┘
              │
              │ cada empresa tem
              ▼
┌─────────────────────────────────────┐
│   FUNCIONÁRIOS DAS EMPRESAS         │
│                                     │
│  👷 Funcionário 1 (Empresa 1)       │
│  👷 Funcionário 2 (Empresa 1)       │
│  👷 Funcionário 3 (Empresa 2)       │
│  👷 Funcionário 4 (Empresa 2)       │
│  ...                                │
│                                     │
│  Vinculados: empresa_id + clinica_id│
│  São avaliados                      │
└─────────────────────────────────────┘
```

### Permissões do RH

1. **Cadastrar Empresas Clientes**
   - Empresas vinculadas à sua `clinica_id`
   - Tabela: `empresas_clientes`
   - Campo: `clinica_id`

2. **Cadastrar Funcionários nas Empresas Clientes**
   - Funcionários vinculados a `empresa_id` + `clinica_id`
   - Tabela: `funcionarios`
   - Campos: `empresa_id`, `clinica_id`
   - **NÃO** tem `contratante_id`

3. **Criar e Liberar Lotes de Avaliação**
   - Para empresas clientes da clínica
   - Tabela: `lotes_avaliacao`
   - Campos: `empresa_id`, `clinica_id`

4. **Gerenciar Avaliações**
   - Inativar/resetar avaliações
   - Baixar laudos das empresas clientes

### Exemplo de Dados

```sql
-- Clínica
clinica_id = 1, nome = "Clínica XPTO"

-- RH da clínica
cpf = "11111111111", perfil = "rh", clinica_id = 1
-- (NÃO tem empresa_id, NÃO tem contratante_id)

-- Empresas CLIENTES da clínica
empresa_id = 10, nome = "Empresa A", clinica_id = 1
empresa_id = 20, nome = "Empresa B", clinica_id = 1
empresa_id = 30, nome = "Empresa C", clinica_id = 1

-- Funcionários DAS EMPRESAS CLIENTES
cpf = "22222222222", nome = "João", empresa_id = 10, clinica_id = 1
cpf = "33333333333", nome = "Maria", empresa_id = 10, clinica_id = 1
cpf = "44444444444", nome = "Pedro", empresa_id = 20, clinica_id = 1
```

## 🏢 Gestor Entidade

### Estrutura Hierárquica

```
┌─────────────────────────────────────┐
│      ENTIDADE (contratante_id)      │
│                                     │
│  👤 Gestor Entidade                 │
│     - Gerencia a própria entidade   │
│     - Não é avaliado                │
└─────────────────────────────────────┘
              │
              │ tem
              ▼
┌─────────────────────────────────────┐
│   FUNCIONÁRIOS DA ENTIDADE          │
│                                     │
│  👷 Funcionário 1                   │
│  👷 Funcionário 2                   │
│  👷 Funcionário 3                   │
│  ...                                │
│                                     │
│  Vinculados: contratante_id         │
│  NÃO tem empresa_id                 │
│  NÃO tem clinica_id                 │
│  São avaliados                      │
└─────────────────────────────────────┘
```

### Permissões do Gestor Entidade

1. **Cadastrar Funcionários Próprios**
   - Funcionários vinculados ao `contratante_id`
   - Tabela: `funcionarios`
   - Campo: `contratante_id`
   - **NÃO** tem `empresa_id` nem `clinica_id`

2. **Criar e Liberar Lotes de Avaliação**
   - Para funcionários da própria entidade
   - Tabela: `lotes_avaliacao`
   - Campo: `contratante_id`

3. **Gerenciar Avaliações**
   - Resetar avaliações (não inativar)
   - Baixar laudos da entidade

### Exemplo de Dados

```sql
-- Entidade
contratante_id = 100, tipo = "entidade", nome = "Grande Empresa X"

-- Gestor da entidade
cpf = "55555555555", perfil = "gestor", contratante_id = 100
-- (NÃO tem empresa_id, NÃO tem clinica_id)

-- Funcionários DA ENTIDADE
cpf = "66666666666", nome = "Carlos", contratante_id = 100
-- (NÃO tem empresa_id, NÃO tem clinica_id)
cpf = "77777777777", nome = "Ana", contratante_id = 100
```

## 💼 Admin - Gestor da Plataforma

### Estrutura

```
┌─────────────────────────────────────┐
│           PLATAFORMA                │
│                                     │
│  👤 Admin                           │
│     - Gestão da plataforma          │
│     - Auditoria                     │
│     - Configurações globais         │
│     - Financeiro                    │
│     - NÃO gerencia operações        │
└─────────────────────────────────────┘
```

### Permissões do Admin

- ✅ Visualizar dados para auditoria
- ✅ Gerenciar configurações da plataforma
- ✅ Acessar relatórios financeiros
- ❌ **NÃO** cria empresas clientes
- ❌ **NÃO** cria funcionários operacionais
- ❌ **NÃO** libera lotes
- ❌ **NÃO** emite laudos

## 📋 Emissor - Profissional Independente

### Estrutura

```
┌─────────────────────────────────────┐
│          EMISSOR                    │
│                                     │
│  👤 Emissor                         │
│     - Profissional independente     │
│     - Emite laudos técnicos         │
│     - Acessa lotes liberados        │
│     - NÃO vinculado a clínica       │
│     - NÃO vinculado a entidade      │
└─────────────────────────────────────┘
              │
              │ emite laudos para
              ▼
┌─────────────────────────────────────┐
│    LOTES LIBERADOS                  │
│    (de qualquer clínica/entidade)   │
└─────────────────────────────────────┘
```

### Permissões do Emissor

- ✅ Visualizar lotes com status 'concluido'/'a_emitir'
- ✅ Gerar laudos técnicos
- ✅ Enviar laudos
- ❌ **NÃO** cria lotes
- ❌ **NÃO** gerencia funcionários
- ❌ **NÃO** gerencia empresas

## 🔐 Isolamento de Dados

### RH (Clínica)

```sql
WHERE clinica_id = current_user_clinica_id()
  AND (empresa_id IS NOT NULL)
```

### Gestor Entidade

```sql
WHERE contratante_id = current_user_contratante_id()
  AND (empresa_id IS NULL)
  AND (clinica_id IS NULL)
```

### Emissor

```sql
WHERE perfil = 'emissor'
  AND (lote.status IN ('concluido', 'a_emitir'))
```

### Admin

```sql
-- Acesso de leitura para auditoria
-- Sem acesso operacional
```

## 📊 Comparação

| Aspecto          | RH (Clínica)                          | Gestor Entidade                            |
| ---------------- | ------------------------------------- | ------------------------------------------ |
| **Vinculação**   | `clinica_id`                          | `contratante_id`                           |
| **Gerencia**     | Empresas clientes + seus funcionários | Funcionários próprios                      |
| **Empresas**     | Múltiplas empresas clientes           | A própria entidade (não cadastra empresas) |
| **Funcionários** | De várias empresas clientes           | Apenas da entidade                         |
| **Estrutura**    | Clínica → Empresas → Funcionários     | Entidade → Funcionários                    |
| **Rotas**        | `/rh/*`, `/api/rh/*`                  | `/entidade/*`, `/api/entidade/*`           |

## 🎯 Cenários de Uso

### Cenário 1: Clínica de Saúde Ocupacional

```
Clínica XPTO (clinica_id = 1)
  ↓ RH da clínica
  ├─ Empresa A (Fábrica) - 50 funcionários
  ├─ Empresa B (Escritório) - 30 funcionários
  └─ Empresa C (Loja) - 20 funcionários

Total: 3 empresas clientes, 100 funcionários avaliados
```

### Cenário 2: Grande Empresa Contratando Diretamente

```
Grande Empresa Y (contratante_id = 100)
  ↓ Gestor Entidade
  └─ 500 funcionários próprios

Total: 1 entidade, 500 funcionários avaliados
```

## ✅ Validações no Código

### RH

```typescript
// Middleware
if (pathname.startsWith('/api/rh') && session.perfil !== 'rh') {
  return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
}

// Autorização
const session = requireRH(); // Apenas perfil 'rh'
await requireRHWithEmpresaAccess(empresa_id); // Valida clinica_id

// Query
WHERE empresa_id = $1
  AND clinica_id = $2  -- clinica do RH
  AND contratante_id IS NULL
```

### Gestor Entidade

```typescript
// Middleware
if (pathname.startsWith('/api/entidade') && session.perfil !== 'gestor') {
  return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
}

// Autorização
const session = requireGestorEntidade(); // Apenas perfil 'gestor'

// Query
WHERE contratante_id = $1  -- contratante do gestor
  AND empresa_id IS NULL
  AND clinica_id IS NULL
```

## 📝 Observações Importantes

1. **Clínica ≠ Empresa**
   - Clínica é prestadora de serviço (faz avaliações)
   - Empresas clientes são atendidas pela clínica

2. **RH não tem funcionários na clínica**
   - A clínica só tem o RH (gestor)
   - Funcionários pertencem às empresas clientes

3. **Gestor Entidade não gerencia empresas**
   - A entidade já é a "empresa"
   - Funcionários são diretamente da entidade

4. **Emissor é independente**
   - Não vinculado a clínica nem entidade
   - Acessa lotes de qualquer origem

5. **Admin não é operacional**
   - Não cria dados operacionais
   - Foco em gestão da plataforma
