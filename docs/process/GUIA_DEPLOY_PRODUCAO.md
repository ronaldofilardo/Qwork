<!-- Moved from database/migrations -->
# Guia de Deploy em Produção - RLS & RBAC Security

**Versão**: 1.0.0  
**Data**: 10 de dezembro de 2025  
**Status**: Pronto para Deploy Staging  
**Criticidade**: ALTA - Requer testes extensivos antes de produção

---

## ⚠️ AVISOS IMPORTANTES

### Antes de Começar

- ✅ **Migration foi testada em ambiente LOCAL**
- ⚠️ **NÃO EXECUTE em produção sem testes em staging**
- ⚠️ **FAÇA BACKUP COMPLETO antes de qualquer deploy**
- ⚠️ **RLS irá IMPACTAR todas as queries existentes**
- ⚠️ **Validar que aplicação usa queryWithContext()**

---

_Conteúdo resumido..._
