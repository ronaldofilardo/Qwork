# Guia Rápido - Aplicação das Políticas RLS Revisadas

## 📌 O que foi implementado?

### Restrições para Admin:

- ❌ **Sem acesso** a: avaliações, respostas, resultados, lotes, laudos
- ✅ **Acesso limitado** a: funcionários (apenas RH e Emissor)
- ✅ **Acesso total** a: empresas e clínicas

### Imutabilidade:

- 🔒 **Resultados** de avaliações concluídas não podem ser modificados
- 🔒 **Respostas** de avaliações concluídas não podem ser modificadas
- 🔒 **Status** de avaliações concluídas não pode ser alterado

## 🚀 Como aplicar

### 1️⃣ Backup (OBRIGATÓRIO)

```powershell
# Desenvolvimento
pg_dump -U postgres -d nr-bps_db > backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql

# Teste
pg_dump -U postgres -d nr-bps_db_test > backup_test_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql
```

### 2️⃣ Aplicar em Desenvolvimento

```powershell
# Conectar ao banco
psql -U postgres -d nr-bps_db

# Executar migração
\i database/migrate-rls-policies.sql
```

### 3️⃣ Executar Testes

```powershell
# Validar políticas
psql -U postgres -d nr-bps_db -f database/test-rls-policies.sql
```

Se todos os testes mostrarem **✓ PASSOU**, está pronto!

### 4️⃣ Aplicar em Teste

```powershell
psql -U postgres -d nr-bps_db_test -f database/migrate-rls-policies.sql
```

### 5️⃣ Aplicar em Produção (Neon)

```powershell
# Conectar ao Neon
psql $env:DATABASE_URL -f database/migrate-rls-policies.sql

# Ou via arquivo .env
$env:DATABASE_URL = "postgresql://..."
psql $env:DATABASE_URL -f database/migrate-rls-policies.sql
```

## 📋 Verificação Manual

```sql
-- Listar políticas criadas
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname LIKE 'admin_%'
ORDER BY tablename, policyname;

-- Listar triggers criados
SELECT tgname, tgrelid::regclass
FROM pg_trigger
WHERE tgname LIKE '%immutability%' OR tgname LIKE '%concluded%';
```

## 🔄 Rollback (se necessário)

```powershell
# Restaurar backup
psql -U postgres -d nr-bps_db < backup_XXXXXX.sql
```

## ⚠️ Impactos no Frontend

### Ajustar em `app/admin/page.tsx`:

- Remover seções de avaliações/resultados
- Manter apenas gestão de clínicas, empresas e usuários

### Ajustar em `components/ConditionalHeader.tsx`:

- Esconder links para `/admin/avaliacoes`, `/admin/resultados`

### Ajustar em API routes:

- Adicionar verificação adicional de perfil Admin
- Retornar 403 Forbidden quando apropriado

## 📁 Arquivos Criados

1. **`database/rls-policies-revised.sql`** - Políticas RLS completas
2. **`database/migrate-rls-policies.sql`** - Script de migração seguro
3. **`database/test-rls-policies.sql`** - Testes automatizados
4. **`docs/RLS-POLICIES-REVISION.md`** - Documentação completa

## 🎯 Próximos Passos

- [ ] Fazer backup do banco de dados
- [ ] Aplicar em desenvolvimento
- [ ] Executar testes automatizados
- [ ] Validar manualmente com diferentes perfis
- [ ] Ajustar frontend conforme necessário
- [ ] Aplicar em teste
- [ ] Aplicar em produção
- [ ] Comunicar usuários sobre mudanças

## 💡 Dicas

- Use o perfil **Admin** para manutenções emergenciais
- Monitore a tabela `audit_access_log` (criada automaticamente)
- Revise as políticas periodicamente
- Documente qualquer exceção necessária

---

**Documento gerado em: 11/12/2025**  
**Qwork - Sistema de Avaliação Psicossocial**
