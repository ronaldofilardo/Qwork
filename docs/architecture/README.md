# 🏗️ Arquitetura do Sistema

## 📐 Visão Geral

O QWork segue uma arquitetura segregada de tomadores com dois tipos principais:

### 1. **Entidades** (Tomador tipo `entidade`)

- Empresas privadas que contratam avaliações psicossociais
- Gerenciadas por usuários com perfil **Gestor**
- Tabela: `entidades`
- Campos principais: `id`, `nome`, `cnpj`, `responsavel_cpf`

### 2. **Clínicas** (Tomador tipo `clinica`)

- Clínicas de medicina ocupacional
- Gerenciadas por usuários com perfil **RH**
- Tabela: `clinicas`
- Campos principais: `id`, `nome`, `cnpj`

---

## 🔐 Controle de Acesso

### Perfis de Usuário

- **Gestor**: Acessa apenas a entidade vinculada
- **RH**: Acessa apenas a clínica vinculada
- **Admin**: Acesso administrativo do sistema (logs, configurações)
- **Emissor**: Acesso para emissão de laudos

### RLS (Row-Level Security)

- Políticas no PostgreSQL garantem isolamento por `entidade_id` ou `clinica_id`
- Cada perfil vê apenas dados da sua organização

---

## 📊 Estrutura de Dados Principal

```
Tomadores
├── Entidades (tipo='entidade')
│   ├── Funcionários
│   ├── Lotes de Avaliação
│   └── Contratos
│
└── Clínicas (tipo='clinica')
    ├── Empresas Clientes
    ├── Funcionários das Empresas
    └── Lotes de Avaliação
```

---

## 🔗 Fluxos Principais

### 1. Cadastro de Entidade

1. Criação em `entidades`
2. Vinculação de gestor
3. Configuração de acesso

### 2. Cadastro de Clínica

1. Criação em `clinicas`
2. Vinculação de RH
3. Configuração de empresas clientes

### 3. Fluxo de Avaliação

1. Criação de lote (vinculado a entidade ou clínica)
2. Adição de funcionários
3. Agendamento de avaliação
4. Emissão de laudo

---

## 📦 Stack Técnico

- **Frontend**: Next.js + React
- **Backend**: API Routes (Next.js)
- **Database**: PostgreSQL com RLS
- **Auth**: Custom RBAC + RLS
- **Testes**: Jest + Cypress

---

## 📝 Convenções

- Variáveis: `entidade_id` ou `clinica_id` (nunca misturadas)
- Tabelas: Schema público com prefixos opcionais
- Policies RLS: Nome descritivo + tipo (PERMISSIVE/RESTRICTIVE)

---

**Última atualização**: 7 de fevereiro de 2026
