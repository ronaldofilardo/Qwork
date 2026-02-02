# Permissões RBAC - Controle de Acesso Baseado em Papéis

## Visão Geral

O sistema Qwork implementa um modelo de segurança baseado em **RBAC (Role-Based Access Control)** combinado com **RLS (Row-Level Security)** para controle granular de permissões.

## Papéis do Sistema

### 1. Admin

**Descrição**: Administrador do sistema com acesso completo.

**Permissões**:

- `manage:avaliacoes` - Gerenciar todas as avaliações
- `manage:funcionarios` - Gerenciar todos os funcionários
- `manage:empresas` - Gerenciar todas as empresas clientes
- `manage:lotes` - Gerenciar lotes de avaliação
- `manage:laudos` - Gerenciar laudos
- `read:avaliacoes` - Ler avaliações
- `read:funcionarios` - Ler funcionários
- `read:empresas` - Ler empresas
- `read:lotes` - Ler lotes
- `read:laudos` - Ler laudos
- `write:laudos` - Escrever laudos
- `read:lotes:clinica` - Ler lotes da clínica

**Acesso RLS**: Acesso irrestrito a todas as tabelas (full access).

### 2. RH

**Descrição**: Responsável de Recursos Humanos de uma clínica específica.

**Permissões**:

- `read:avaliacoes` - Ler avaliações da própria clínica
- `read:funcionarios` - Ler funcionários da própria clínica
- `read:empresas` - Ler empresas da própria clínica
- `read:lotes` - Ler lotes da própria clínica
- `read:laudos` - Ler laudos da própria clínica
- `write:laudos` - Escrever laudos da própria clínica
- `read:lotes:clinica` - Ler lotes da própria clínica

**Acesso RLS**: Restrito à clínica associada (`clinica_id`).

### 3. Emissor

**Descrição**: Profissional responsável por emitir laudos.

**Permissões**:

- `read:laudos` - Ler laudos
- `write:laudos` - Escrever laudos

**Acesso RLS**: Restrito à clínica associada.

### 4. Funcionario

**Descrição**: Funcionário que responde avaliações.

**Permissões**:

- `read:avaliacoes` - Ler próprias avaliações

**Acesso RLS**: Restrito aos próprios dados.

## Controle de Acesso por Recurso

### Empresas Clientes (`empresas_clientes`)

- **Admin**: CREATE, READ, UPDATE, DELETE em todas as clínicas
- **RH**: CREATE, READ, UPDATE, DELETE apenas na própria clínica
- **Outros**: Sem acesso

### Funcionários (`funcionarios`)

- **Admin**: READ, UPDATE em todos os funcionários
- **RH**: CREATE, READ, UPDATE, DELETE na própria clínica
- **Funcionário**: READ apenas nos próprios dados

### Avaliações (`avaliacoes`)

- **Admin**: READ em todas as avaliações
- **RH**: READ, UPDATE na própria clínica
- **Funcionário**: READ, UPDATE apenas nas próprias avaliações

### Laudos (`laudos`)

- **Admin**: READ em todos os laudos
- **RH/Emissor**: READ, UPDATE na própria clínica

## Implementação Técnica

### RBAC

- Tabelas: `roles`, `permissions`, `role_permissions`
- Função: `user_has_permission(permission_name)`
- Verificação: Antes da execução de operações críticas

### RLS

- Políticas definidas em `database/migrations/`
- Funções auxiliares: `current_user_*()`
- Aplicado automaticamente pelo PostgreSQL

## Histórico de Correções

### 2025-12-27: Correção de Permissões Admin para Empresas

- **Problema**: Perfil admin não conseguia criar empresas dentro de clínicas devido a políticas RLS restritivas
- **Solução**: Atualizadas políticas RLS para conceder acesso irrestrito ao admin
- **Migração**: `055_admin_empresas_fix.sql`
- **Impacto**: Admin agora tem full access para gerenciar empresas em todas as clínicas

## Verificação de Permissões

Para verificar se um usuário tem uma permissão específica:

```sql
SELECT user_has_permission('manage:empresas');
```

Para listar todas as permissões de um papel:

````sql
SELECT p.name
FROM role_permissions rp
JOIN roles r ON r.id = rp.role_id
JOIN permissions p ON p.id = rp.permission_id
WHERE r.name = 'admin';
```</content>
<parameter name="filePath">c:\apps\QWork\docs\RBAC_PERMISSIONS.md
````
