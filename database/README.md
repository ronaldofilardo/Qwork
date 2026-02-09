# 🗄️ Database

## 📊 Estrutura

### `/migrations`

Todas as transformações do schema SQL em sequência numérica.

- Veja [migrations/README.md](migrations/README.md) para detalhes

### `/seeds`

Dados iniciais para desenvolvimento e testes (se existirem).

### Arquivo Principal

- `schema.prisma` - Define schema em Prisma ORM

---

## 🔗 Conexão

### Variáveis de Ambiente

```env
DATABASE_URL="postgresql://user:password@host:port/database"
```

### Verificar Conexão

```bash
pnpm prisma db execute --stdin < query.sql
```

---

## 📐 Design Atual

### Tabelas Principais

#### Tomadores (Segregados)

- `entidades` - Empresas que contratam avaliações
- `clinicas` - Clínicas de medicina ocupacional

#### Usuários

- `funcionarios` - Funcionários das entidades/clínicas
- `usuarios` - Autenticação e perfis

#### Operacional

- `lotes` - Agrupamento de avaliações
- `avaliacoes` - Cada avaliação individual
- `laudos` - Resultado das avaliações

#### Financeiro

- `contratos` - Acordos de serviço
- `pagamentos` - Cobranças

---

## 🔐 Segurança

### RLS (Row-Level Security)

- Ativo em produção
- Desabilitado em testes (com cuidado)
- Policies por entidade_id ou clinica_id

### RLS Policies

```sql
-- Exemplo: usuário vê apenas sua entidade
CREATE POLICY user_sees_own_entidade ON entidades
  USING (id = current_user_entidade_id());
```

---

## 🚀 Operações Comuns

### Status de Migrações

```bash
pnpm prisma migrate status
```

### Carregar Schema

```bash
pnpm prisma db push
```

### Reset Database (⚠️ Cuidado!)

```bash
pnpm prisma migrate reset
```

### Backup

```bash
pg_dump -U postgres -h localhost database_name > backup.sql
```

### Restaurar

```bash
psql -U postgres -h localhost database_name < backup.sql
```

---

## 📋 Índices Críticos

- `entidades(cnpj)` - Lookup rápido
- `clinicas(cnpj)` - Lookup rápido
- `funcionarios(entidade_id)` - Filter por entidade
- `funcionarios(clinica_id)` - Filter por clínica
- `lotes(entidade_id)` - Filter por tomador
- `avaliacoes(lote_id)` - Join performance

---

## 🔍 Troubleshooting

### Erro de Migração

```bash
# Ver logs de execução
pnpm prisma migrate resolve --rolled-back
```

### Tabela Não Existir

```sql
-- Verificar schema
\dt -- PostgreSQL
```

### RLS Bloqueando Queries

```sql
-- Temporariamente desabilitar para debug
SET ROLE postgres;
ALTER TABLE tablename DISABLE ROW LEVEL SECURITY;
```

---

**Última atualização**: 7 de fevereiro de 2026
