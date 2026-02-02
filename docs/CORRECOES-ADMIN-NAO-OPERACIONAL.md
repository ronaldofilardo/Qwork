# Correções Necessárias - Admin NÃO é Operacional

## ❌ Rotas que Admin NÃO deve ter acesso

### 1. Auditorias (Admin pode ver relatórios administrativos, MAS não dados operacionais)

**PROBLEMA:** Admin tem rotas de auditoria que mostram dados operacionais

**Arquivos:**

- `app/api/admin/auditorias/laudos/route.ts` - ❌ DEVE SER REMOVIDO ou alterado para NÃO mostrar laudos
- `app/api/admin/auditorias/lotes/route.ts` - ❌ DEVE SER REMOVIDO ou alterado para NÃO mostrar lotes

**Solução:**

- Admin pode ver auditorias de: clínicas, contratantes, planos, emissores (administrativo)
- Admin NÃO pode ver auditorias de: laudos, lotes, avaliações, empresas, funcionários (operacional)

### 2. Views de Auditoria

As views `vw_auditoria_laudos` e `vw_auditoria_lotes` existem e são acessadas por admin.

**Ação:** Remover ou restringir acesso admin a essas views

---

## ✅ Correções a Aplicar

### 1. Deletar ou restringir rotas de auditoria operacional

```bash
# Opção 1: Deletar completamente (recomendado se admin não deve ver)
rm app/api/admin/auditorias/laudos/route.ts
rm app/api/admin/auditorias/lotes/route.ts

# Opção 2: Alterar para bloquear admin
# Trocar requireRole('admin') por requireRole(['rh', 'emissor'])
```

### 2. Remover views de auditoria operacional para admin

```sql
-- Dropar views ou alterar permissões
DROP VIEW IF EXISTS vw_auditoria_laudos;
DROP VIEW IF EXISTS vw_auditoria_lotes;
```

### 3. Verificar rotas /api/admin/\*

Garantir que todas as rotas em `/api/admin/*` sejam APENAS administrativas:

- ✅ `/api/admin/contratantes` - OK (administrativo)
- ✅ `/api/admin/clinicas` - OK (administrativo)
- ✅ `/api/admin/planos` - OK (administrativo)
- ✅ `/api/admin/emissores` - OK (administrativo)
- ❌ `/api/admin/auditorias/laudos` - REMOVER
- ❌ `/api/admin/auditorias/lotes` - REMOVER
- ❓ `/api/admin/reenviar-lote` - VERIFICAR (parece operacional)

---

## 🔍 Análise de /api/admin/reenviar-lote/route.ts

```typescript
// Arquivo: app/api/admin/reenviar-lote/route.ts
export const POST = async (req: Request) => {
  const user = await requireRole(['rh', 'gestor_entidade']); // ✅ CORRETO - não permite admin!
```

**Status:** ✅ OK - Não permite admin

---

## 📋 Checklist de Correções

- [ ] Deletar `/app/api/admin/auditorias/laudos/route.ts`
- [ ] Deletar `/app/api/admin/auditorias/lotes/route.ts`
- [ ] Dropar views `vw_auditoria_laudos` e `vw_auditoria_lotes`
- [ ] Verificar se há testes que precisam ser atualizados
- [ ] Atualizar documentação

---

## 🎯 Resumo

**Admin deve ter acesso a:**

- ✅ Clínicas (manage, approve)
- ✅ Contratantes/Entidades (manage, approve)
- ✅ Planos (manage)
- ✅ Emissores (manage)
- ✅ Roles e Permissions (manage)

**Admin NÃO deve ter acesso a:**

- ❌ Empresas clientes
- ❌ Funcionários (exceto RH e emissores para gestão administrativa)
- ❌ Avaliações
- ❌ Lotes
- ❌ Laudos
- ❌ Respostas
- ❌ Resultados
