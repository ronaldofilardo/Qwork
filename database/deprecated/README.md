# Arquivos SQL Deprecados (arquivados)

Estes arquivos foram movidos para `docs/archived/database-deprecated-README.md` para referência histórica. Consulte `docs/archived/ORIGINAL_STUBS.md` para índice de arquivos arquivados.

## ⚠️ NÃO EXECUTAR EM PRODUÇÃO

Estes arquivos são mantidos apenas para referência histórica e **NÃO devem ser executados** em nenhum ambiente.

## Arquivos Arquivados

### Políticas RLS Obsoletas

- `rls-policies.sql` - Políticas RLS originais (substituídas pela migração 001 e 004)
- `rls-policies-revised.sql` - Revisão intermediária das políticas (substituída pela migração 004)
- `migrate-rls-policies.sql` - Script de migração intermediário (substituído pela migração 004)
- `create-rh-policies.sql` - Políticas parciais para RH (incorporadas na migração 004)

## Política Atual

✅ **Use apenas:** `database/migrations/004_rls_rbac_fixes.sql` - Implementação final e consolidada de todas as políticas RLS/RBAC

## Histórico de Substituição

- **2025-12-10**: Migração 001 implementou RLS inicial
- **2025-12-11**: Scripts intermediários criados para correções
- **2025-12-14**: Migração 004 consolidou todas as políticas RLS/RBAC

## Remoção Futura

Estes arquivos serão removidos permanentemente após 90 dias da data de arquivamento.
