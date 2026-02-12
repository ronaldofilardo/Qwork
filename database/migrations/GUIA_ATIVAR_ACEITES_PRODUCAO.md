# 🚀 Guia de Execução - Ativar Sistema de Aceites em Produção

## Status Atual

- ✅ Código está pronto em produção (commit `892da65`)
- ⏳ Tabelas de aceites ainda não existem no banco de produção
- ⚠️ Modal de termos aparece, mas retorna erro 503 ao tentar registrar

## O Que Fazer Para Funcionar Totalmente

### Opção 1: Executar via PowerShell (RECOMENDADO)

```powershell
# 1. Navegar para pasta de migrations
cd database/migrations

# 2. Executar script PowerShell (com backup automático)
.\PRODUCAO_executar_migration_aceites.ps1

# 3. Ou especificar DATABASE_URL manualmente
.\PRODUCAO_executar_migration_aceites.ps1 -DatabaseUrl $env:DATABASE_URL

# 4. Para modo DRY-RUN (visualizar sem executar)
.\PRODUCAO_executar_migration_aceites.ps1 -DryRun

# 5. Para pular backup
.\PRODUCAO_executar_migration_aceites.ps1 -NoBackup
```

---

### Opção 2: Executar SQL Diretamente (Neon Dashboard)

1. **Abrir Neon Dashboard**: https://console.neon.tech
2. **Conectar ao banco**: `neondb`
3. **SQL Editor → Query**
4. **Copiar e colar conteúdo de**: `PRODUCAO_criar_tabelas_aceites.sql`
5. **Executar a query**

---

### Opção 3: Executar via psql (CLI)

```bash
# 1. Com DATABASE_URL
psql $DATABASE_URL -f database/migrations/PRODUCAO_criar_tabelas_aceites.sql

# 2. Ou especificar manualmente
psql postgresql://user:pass@host/neondb -f PRODUCAO_criar_tabelas_aceites.sql
```

---

## O Que a Migration Faz

✅ **Cria 2 tabelas**:

- `aceites_termos_usuario` - Registra aceite individual por CPF
- `aceites_termos_entidade` - Registra aceite por CNPJ (redundância legal)

✅ **Cria 8 índices** para performance

✅ **Adiciona comentários** (documentação no banco)

---

## Validação - Como Saber Que Funcionou

Após executar a migration:

```sql
-- Verificar tabelas
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'aceites%';

-- Verificar índices
SELECT indexname FROM pg_indexes
WHERE tablename LIKE 'aceites%';
```

**Esperado**:

```
  tablename
─────────────────────────────
 aceites_termos_usuario
 aceites_termos_entidade
(2 rows)
```

---

## Teste End-to-End

Após a migration:

### 1️⃣ Fazer Login

```bash
POST /api/auth/login
Body: {
  "cpf": "29930511059",
  "senha": "sua-senha"
}
```

### 2️⃣ Resposta Deve Ter

```json
{
  "success": true,
  "perfil": "gestor",
  "termosPendentes": {
    "termos_uso": true,
    "politica_privacidade": true
  }
}
```

### 3️⃣ Modal Deve Aparecer

- ✅ Modal de termos aparece
- ✅ Botão "Aceitar" funciona
- ✅ Dados são salvos no banco

### 4️⃣ Próximo Login

- ✅ Termos já aceitos (não aparece modal)
- ✅ Redireciona direto para dashboard

---

## Em Caso de Problemas

### Problema: "Erro 503 - Recurso temporariamente indisponível"

**Causa**: Migration não foi executada ainda

**Solução**: Execute uma das 3 opções acima

---

### Problema: "relation ... does not exist" (erro 42P01)

**Causa**: Tabela não foi criada

**Solução**:

1. Verifique se a migration executou sem erros
2. Valide as tabelas com query acima
3. Se continuar: execute novamente

---

### Problema: Precisa Reverter

```bash
# Executar rollback
psql $DATABASE_URL -f PRODUCAO_rollback_aceites.sql
```

**O que acontece**:

- ✓ Dados moved para tabelas de backup (`*_backup_*`)
- ✓ Tabelas originais são removidas
- ✓ Sistema volta a funcionar sem sistema de termos

---

## Próximas Ações

### Imediatamente (Hoje)

- [ ] Executar a migration
- [ ] Validar que as tabelas foram criadas
- [ ] Fazer teste de login em PROD

### Hoje à Noite / Amanhã

- [ ] Confirmar que usuários RH/Gestor conseguem aceitar termos
- [ ] Monitorar logs da aplicação
- [ ] Confirmar que dados estão sendo salvos no banco

### Futuro

- [ ] Implementar versionamento de termos (se necessário)
- [ ] Dashboard de auditoria de aceites

---

## Documentação de Suporte

- 📄 [PRODUCAO_criar_tabelas_aceites.sql](PRODUCAO_criar_tabelas_aceites.sql) - SQL da migration
- 🔄 [PRODUCAO_rollback_aceites.sql](PRODUCAO_rollback_aceites.sql) - SQL de rollback
- 🚀 [PRODUCAO_executar_migration_aceites.ps1](PRODUCAO_executar_migration_aceites.ps1) - Script PowerShell

---

## Contato / Dúvidas

Se houver problemas:

1. Verifique os logs da aplicação
2. Execute a query de validação acima
3. Consulte a seção "Em Caso de Problemas"

---

**Status**: Pronto para produção ✅
**Última atualização**: 12/02/2026
