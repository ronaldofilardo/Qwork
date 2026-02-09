# 📚 Migrações do Banco de Dados

## 📋 Visão Geral

Este diretório contém todas as migrações SQL que transformaram o schema do PostgreSQL ao longo do tempo.

### Estrutura de Migrações

```
migrations/
├── 001_*.sql  até  099_*.sql   - Migrações iniciais
├── 100_*.sql  até  199_*.sql   - Refatorações e ajustes
├── 200_*.sql  até  299_*.sql   - Schema definitivo
├── 300_*.sql  até  399_*.sql   - Features adicionais
├── 400_*.sql  até  499_*.sql   - Segregação de entidades/clínicas
└── 500_*.sql  em diante        - Melhorias e correções
```

---

## 🔄 Como Usar

### Executar Migrações

```bash
pnpm prisma migrate deploy
```

### Criar Nova Migração

```bash
pnpm prisma migrate dev --name descricao_do_changes
```

### Ver Status

```bash
pnpm prisma migrate status
```

---

## 📌 Migrações Críticas

### RLS (Row-Level Security) - 400+

Define políticas de acesso para isolamento por entidade/clínica.

### RBAC (Role-Based Access Control) - 300+

Define perfis (gestor, rh, admin, emissor) e permissões.

### Schema Segregado - 200+

Tabelas separadas para entidades e clínicas.

---

## ⚠️ Importante

- **Nunca** revertir migrações em produção manualmente
- Usar `prisma migrate` para tracking automático
- Testar migrações em ambiente de staging antes

---

**Última atualização**: 7 de fevereiro de 2026
