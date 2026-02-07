# 🔄 Reestruturação: Separação de Usuários e Funcionários

**Data:** 04 de Fevereiro de 2026  
**Status:** 📋 Planejamento  
**Prioridade:** 🔴 CRÍTICA

---

## 📊 Visão Geral

Esta reestruturação estabelece uma clara separação entre **usuários do sistema** (que têm acesso à plataforma) e **funcionários** (que são avaliados pelas empresas/clínicas).

---

## 🎯 Modelo Proposto

### 🔐 Tabela `usuarios` - Acesso ao Sistema

Armazena **APENAS** usuários que têm acesso à plataforma:

| Tipo de Usuário | Descrição                    | Responsabilidades                                                    |
| --------------- | ---------------------------- | -------------------------------------------------------------------- |
| **admin**       | Administrador do sistema     | Gestão completa da plataforma                                        |
| **emissor**     | Emissor de laudos            | Emitir e gerenciar laudos                                            |
| **gestor**      | Gestor de Entidade (Empresa) | Gerir funcionários, lotes e avaliações da própria entidade           |
| **rh**          | Gestor de Clínica (RH)       | Gerir empresas clientes, funcionários, lotes e avaliações da clínica |

**Campos principais:**

```sql
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    cpf CHAR(11) UNIQUE NOT NULL,
    nome VARCHAR(200) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha_hash TEXT NOT NULL,
    tipo_usuario usuario_tipo_enum NOT NULL, -- admin, emissor, gestor, rh
    clinica_id INTEGER, -- NULL para admin/emissor, obrigatório para rh
    contratante_id INTEGER, -- NULL para admin/emissor/rh, obrigatório para gestor
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (clinica_id) REFERENCES clinicas(id),
    FOREIGN KEY (contratante_id) REFERENCES contratantes(id)
);
```

---

### 👥 Tabela `funcionarios` - Pessoas Avaliadas

Armazena **APENAS** funcionários que são avaliados (não têm acesso ao sistema):

- Funcionários de **entidades** (empresas)
- Funcionários de **empresas clientes** das clínicas

**Campos principais:**

```sql
CREATE TABLE funcionarios (
    id SERIAL PRIMARY KEY,
    cpf CHAR(11) UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    empresa_id INTEGER, -- Para funcionários de empresas clientes
    contratante_id INTEGER, -- Para funcionários de entidades
    clinica_id INTEGER, -- Clínica responsável
    setor VARCHAR(50),
    funcao VARCHAR(50),
    matricula VARCHAR(20),
    nivel_cargo nivel_cargo_enum, -- operacional ou gestao
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas_clientes(id),
    FOREIGN KEY (contratante_id) REFERENCES contratantes(id),
    FOREIGN KEY (clinica_id) REFERENCES clinicas(id),
    CHECK (
        (empresa_id IS NOT NULL AND contratante_id IS NULL) OR
        (empresa_id IS NULL AND contratante_id IS NOT NULL)
    )
);
```

---

## 🎭 Hierarquia e Responsabilidades

### 🔴 Admin (Administrador do Sistema)

- **Escopo:** Recursos administrativos do sistema
- **Acesso:** RBAC, roles, permissions, audit_logs
- **Permissões:**
  - Gerenciar roles e permissões (RBAC)
  - Visualizar e gerenciar logs de auditoria
  - Configurações globais do sistema
  - ❌ NÃO pode acessar clínicas
  - ❌ NÃO pode acessar entidades/contratantes
  - ❌ NÃO pode acessar empresas clientes
  - ❌ NÃO pode acessar funcionários
  - ❌ NÃO pode supervisionar emissores

### 📋 Emissor (Emissor de Laudos)

- **Escopo:** Laudos solicitados
- **Acesso:** Apenas tabela `laudos` e `fila_emissao`
- **Permissões:**
  - Emitir laudos para lotes que foram solicitados
  - Gerenciar tabela `laudos` (INSERT, UPDATE)
  - Visualizar fila de emissão
  - ❌ NÃO pode visualizar avaliações (restrito a RH e gestor)
  - ❌ NÃO pode visualizar lotes_avaliacao
  - ❌ NÃO pode visualizar funcionários

### 🏢 Gestor Entidade (Gestor de Empresa/Entidade)

- **Escopo:** Sua própria entidade (empresa)
- **Acesso:** Apenas dados da entidade vinculada
- **Permissões:**
  - ✅ Cadastrar e gerenciar funcionários da entidade
  - ✅ Criar e gerenciar lotes de avaliação
  - ✅ Acompanhar avaliações dos funcionários
  - ✅ Visualizar resultados e relatórios da entidade
  - ❌ NÃO pode criar empresas
  - ❌ NÃO pode acessar outras entidades

**Exemplo:** João da Silva é gestor da entidade "Construtora ABC" e só pode gerenciar os funcionários dessa construtora.

### 🏥 RH (Gestor de Clínica)

- **Escopo:** Sua clínica e todas as empresas clientes vinculadas
- **Acesso:** Dados da clínica e empresas clientes
- **Permissões:**
  - ✅ Cadastrar e gerenciar empresas clientes
  - ✅ Cadastrar e gerenciar funcionários das empresas clientes
  - ✅ Criar e gerenciar lotes de avaliação
  - ✅ Acompanhar avaliações de todas as empresas clientes
  - ✅ Visualizar resultados e relatórios consolidados
  - ✅ Solicitar emissão de laudos
  - ❌ NÃO pode acessar outras clínicas

**Exemplo:** Maria Santos é RH da "Clínica Ocupacional Saúde+" e gerencia todas as empresas que são clientes dessa clínica.

---

## 📐 Diagrama de Relacionamentos

```
┌─────────────────────────────────────────────────────────────┐
│                        SISTEMA QWORK                         │
└─────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│                    TABELA: usuarios                           │
│  (Usuários com acesso ao sistema)                             │
├───────────────────────────────────────────────────────────────┤
│ • admin (administrador do sistema)                            │
│ • emissor (emissor de laudos)                                 │
│ • gestor (gestor de empresa/entidade)                │
│ • rh (gestor de clínica)                                      │
└───────────────────────────────────────────────────────────────┘
         │                                │
         │                                │
         ▼                                ▼
┌─────────────────┐              ┌─────────────────┐
│    clinicas     │              │  contratantes   │
│   (Clínicas)    │              │   (Entidades)   │
└─────────────────┘              └─────────────────┘
         │                                │
         │ gerencia                       │ possui
         ▼                                ▼
┌─────────────────┐              ┌───────────────────────────┐
│ empresas_       │              │   TABELA: funcionarios    │
│   clientes      │─────────────▶│ (Pessoas avaliadas)       │
│                 │  possui      │                           │
└─────────────────┘              │ • Funcionários de         │
                                 │   empresas clientes       │
                                 │ • Funcionários de         │
                                 │   entidades               │
                                 └───────────────────────────┘
                                         │
                                         │ realiza
                                         ▼
                                 ┌─────────────────┐
                                 │   avaliacoes    │
                                 └─────────────────┘
```

---

## 🔄 Fluxos de Trabalho

### 📌 Fluxo 1: RH gerenciando empresa cliente

```
1. RH (usuário) acessa o sistema
2. RH cadastra empresa cliente na sua clínica
3. RH cadastra funcionários da empresa cliente (tabela funcionarios)
4. RH cria lote de avaliação para esses funcionários
5. Funcionários realizam avaliações
6. RH solicita emissão de laudo
7. Emissor (usuário) emite o laudo
```

### 📌 Fluxo 2: Gestor de entidade gerenciando sua empresa

```
1. Gestor Entidade (usuário) acessa o sistema
2. Gestor Entidade visualiza sua entidade (já cadastrada)
3. Gestor Entidade cadastra funcionários da entidade (tabela funcionarios)
4. Gestor Entidade cria lote de avaliação para seus funcionários
5. Funcionários realizam avaliações
6. Gestor Entidade acompanha resultados
7. Gestor Entidade pode solicitar laudo (emitido por emissor)
```

---

## 🛠️ Migração de Dados

### Estado Atual (Problemático)

Atualmente, a tabela `funcionarios` contém:

- Funcionários que são avaliados (correto ✅)
- Gestores de entidades (incorreto ❌)
- Gestores de RH (incorreto ❌)
- Admins (incorreto ❌)
- Emissores (incorreto ❌)

### Estado Desejado

**Tabela `usuarios`:**

- admin
- emissor
- gestor
- rh

**Tabela `funcionarios`:**

- Apenas funcionários que são avaliados

### Passos da Migração

```sql
-- 1. Criar nova estrutura da tabela usuarios
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    cpf CHAR(11) UNIQUE NOT NULL,
    nome VARCHAR(200) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha_hash TEXT NOT NULL,
    tipo_usuario usuario_tipo_enum NOT NULL,
    clinica_id INTEGER,
    contratante_id INTEGER,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Migrar dados da tabela funcionarios para usuarios
INSERT INTO usuarios (cpf, nome, email, senha_hash, tipo_usuario, clinica_id, contratante_id, ativo, criado_em, atualizado_em)
SELECT
    cpf,
    nome,
    email,
    senha_hash,
    usuario_tipo, -- admin, emissor, gestor, rh
    clinica_id,
    contratante_id,
    ativo,
    criado_em,
    atualizado_em
FROM funcionarios
WHERE usuario_tipo IN ('admin', 'emissor', 'gestor', 'rh');

-- 3. Remover usuários do sistema da tabela funcionarios
DELETE FROM funcionarios
WHERE usuario_tipo IN ('admin', 'emissor', 'gestor', 'rh');

-- 4. Remover colunas desnecessárias da tabela funcionarios
ALTER TABLE funcionarios
DROP COLUMN IF EXISTS senha_hash,
DROP COLUMN IF EXISTS usuario_tipo,
DROP COLUMN IF EXISTS perfil;

-- 5. Adicionar constraints
ALTER TABLE funcionarios
ADD CONSTRAINT funcionarios_vinculo_check
CHECK (
    (empresa_id IS NOT NULL AND contratante_id IS NULL) OR
    (empresa_id IS NULL AND contratante_id IS NOT NULL)
);
```

---

## ✅ Benefícios da Reestruturação

### 1. 🎯 Clareza Conceitual

- **Separação clara:** Usuários do sistema vs. pessoas avaliadas
- **Modelo intuitivo:** Mais fácil de entender e explicar
- **Código mais limpo:** Queries e lógica de negócio mais diretas

### 2. 🔒 Segurança

- **Controle de acesso:** Autenticação apenas na tabela usuarios
- **RLS simplificado:** Policies mais claras e eficientes
- **Auditoria:** Logs separados para ações de usuários

### 3. 🚀 Performance

- **Índices otimizados:** Sem mistura de tipos diferentes
- **Queries mais rápidas:** Menos condições WHERE complexas
- **Cache eficiente:** Tabelas com propósitos distintos

### 4. 🧩 Manutenibilidade

- **Migrations mais simples:** Mudanças isoladas por contexto
- **Testes mais fáceis:** Cada tabela com responsabilidade única
- **Documentação clara:** Modelo autoexplicativo

---

## 📋 Checklist de Implementação

### Fase 1: Preparação

- [ ] Backup completo do banco de dados
- [ ] Revisar todas as queries existentes que usam `funcionarios`
- [ ] Identificar todas as foreign keys que referenciam `funcionarios`
- [ ] Documentar todos os casos de uso atuais

### Fase 2: Criação da Nova Estrutura

- [ ] Criar tabela `usuarios` com estrutura completa
- [ ] Criar índices necessários em `usuarios`
- [ ] Criar triggers de auditoria para `usuarios`
- [ ] Implementar RLS policies para `usuarios`

### Fase 3: Migração de Dados

- [ ] Migrar admin, emissor, gestor, rh para `usuarios`
- [ ] Validar integridade dos dados migrados
- [ ] Atualizar foreign keys relacionadas
- [ ] Limpar dados de `funcionarios`

### Fase 4: Atualização do Código

- [ ] Atualizar models e types do TypeScript
- [ ] Modificar queries de autenticação
- [ ] Ajustar endpoints da API
- [ ] Corrigir componentes do frontend
- [ ] Atualizar testes automatizados

### Fase 5: Validação

- [ ] Testes de integração completos
- [ ] Testes de permissões e RLS
- [ ] Testes de performance
- [ ] Validação com dados reais (staging)

### Fase 6: Deployment

- [ ] Deploy em ambiente de staging
- [ ] Testes de aceitação
- [ ] Deploy em produção
- [ ] Monitoramento pós-deploy

---

## ⚠️ Riscos e Mitigações

| Risco                           | Impacto  | Probabilidade | Mitigação                                |
| ------------------------------- | -------- | ------------- | ---------------------------------------- |
| Perda de dados durante migração | 🔴 Alto  | 🟡 Médio      | Backups múltiplos, rollback plan         |
| Queries quebradas após migração | 🟠 Médio | 🔴 Alto       | Revisão completa, testes automatizados   |
| Downtime prolongado             | 🟠 Médio | 🟡 Médio      | Janela de manutenção, migração otimizada |
| Inconsistência de dados         | 🔴 Alto  | 🟡 Médio      | Validações em cada etapa, transactions   |

---

## 📚 Referências

- Migration 200: `database/migrations/200_fase1_normalizacao_usuario_tipo.sql`
- Migration 132: `database/migrations/132_create_semantic_views.sql`
- Schema atual: `schema-comparison/schema-neon-2026-02-04_10-20-22.sql`
- Documentação RLS: `docs/security/GUIA-COMPLETO-RLS-RBAC.md`

---

## 🎓 Glossário

| Termo                    | Definição                                                 |
| ------------------------ | --------------------------------------------------------- |
| **Usuario**              | Pessoa que tem acesso ao sistema (login)                  |
| **Funcionário**          | Pessoa que é avaliada pelo sistema (sem login)            |
| **Entidade/Contratante** | Empresa que contrata avaliações diretamente               |
| **Empresa Cliente**      | Empresa cliente de uma clínica                            |
| **Clínica**              | Empresa prestadora de serviços de saúde ocupacional       |
| **Gestor Entidade**      | Usuário que gerencia sua própria empresa/entidade         |
| **RH**                   | Usuário que gerencia uma clínica e suas empresas clientes |

---

**Última atualização:** 04 de Fevereiro de 2026  
**Responsável:** Equipe de Desenvolvimento QWork  
**Status:** 📋 Aguardando aprovação para implementação
