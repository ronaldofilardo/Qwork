# Limpeza de Código Legado — Sessão de Representantes

Data: 5 de abril de 2026

## Status de Deprecação

### ✅ PROBLEMA RESOLVIDO (Conversa #1)

**Alterar:** Erro 401 ao representante clicar "Acessar a plataforma" após aceitar contrato

**Causa:** Fetch para `/api/representante/me` não passava `credentials: 'same-origin'`

**Solução Implementada:**

- ✅ `app/representante/(portal)/rep-context.tsx` — Adicionado `credentials: 'same-origin'` + `cache: 'no-store'`
- ✅ `app/representante/(portal)/dados/page.tsx` — Idem
- ✅ `app/representante/(portal)/metricas/page.tsx` — Idem
- ✅ `app/representante/(portal)/dashboard/page.tsx` — Idem
- ✅ `app/representante/(portal)/minhas-vendas/page.tsx` — Idem

**Testes Adicionados:**

- ✅ `__tests__/representante/credentials-fetch-validation.test.tsx` — Valida que credentials estão corretos

---

## 🟡 Código Legado Identificado Para Remoção Futura

### 1. `lib/session-representante.ts`

**Status:** 🟡 LEGADO MAS AINDA ATIVO

**Problemas:**

- Mantém dois modos de autenticação: `rep-session` (legado) e `bps-session` (novo)
- `rep-session` é cookie simples sem proteção
- Duplica funcionalidade com `lib/session.ts` (novo)

**Opções:**

#### Opção A: Remover Completamente (RECOMENDADO)

- [ ] Parar de criar `rep-session` em `login/route.ts`
- [ ] Unificar todos os logins (email+código e criar-senha) para usar `createSession`
- [ ] Remover `criarSessaoRepresentante`, `getSessaoRepresentante`, `destruirSessaoRepresentante`
- [ ] Migrar testes para usar `createSession`

**Impacto:** Médio - afeta apenas representantes legados que usam login via email+código

#### Opção B: Manter por Retrocompatibilidade (ATUAL)

- Manter `rep-session` para representantes antigos
- Adicionar deprecação warning nos logs
- Planejar remoção em versão futura

**Recomendação:** Opção A (mais seguro e limpo)

---

### 2. `app/api/representante/login/route.ts`

**Status:** 🟡 LEGADO MAS AINDA ATIVO

**Descrição:** Login via email + código único (6 dígitos)

**Problema:** Usa `criarSessaoRepresentante` (legado)

**Alternativa Moderna:** Novo fluxo via convites → `criar-senha` → `createSession`

**Plano de Remoção:**

1. Avaliar quantos representantes ainda usam este fluxo
2. Migrar representantes antigos para novo modelo de convites
3. Remover `login/route.ts` completamente
4. Atualizar testes

**Timeline:** 2026-Q2 (próximo trimestre recomendado)

---

## Estrutura de Autenticação Moderna

```typescript
// ✅ NOVO — Recomendado para todos os novos logins
createSession({
  cpf: '12345678900',
  nome: 'João Silva',
  perfil: 'representante',
  representante_id: 1,
});

// 🟡 LEGADO — Será descontinuado
criarSessaoRepresentante({
  representante_id: 1,
  nome: 'João Silva',
  email: 'joao@email.com',
  codigo: 'ABC123',
  status: 'apto',
  tipo_pessoa: 'pf',
  criado_em_ms: Date.now(),
});
```

---

## Testes Relevantes

### Testes Que Precisam Ser Atualizados

- [ ] `__tests__/lib/session-representante.test.ts` — Migrar para `createSession`
- [ ] `__tests__/api/representante/login.test.ts` — Será removido com a rota
- [ ] `__tests__/integration/representante-flows.test.ts` — Atualizar para novo fluxo

### Testes Novos Adicionados

- [x] `__tests__/representante/credentials-fetch-validation.test.tsx` — Valida credentials corretos

---

## Checklist de Remoção (Futura)

Quando decidir remover o código legado:

### Fase 1: Assessoria

- [ ] Contar quantos representantes usam login legado
- [ ] Avaliar impacto
- [ ] Criar plano de migração

### Fase 2: Migração

- [ ] Criar ferramenta para migrar representantes para novo modelo
- [ ] Notificar representantes da mudança
- [ ] Permitir período de transição

### Fase 3: Remoção

- [ ] Remover `lib/session-representante.ts`
- [ ] Remover `login/route.ts`
- [ ] Atualizar testes
- [ ] Compilar e validar

### Fase 4: Documentação

- [ ] Atualizar docs do fluxo de autenticação
- [ ] Remover este arquivo (LEGACY-CODE-CLEANUP.md)

---

## Referências

- Fluxo Novo: `app/api/representante/criar-senha/route.ts` ← usar como modelo
- Sessão Unificada: `lib/session.ts` ← usar `createSession` para todos
- Autenticação: `lib/session-representante.ts` ← deprecar e remover

---

## Notas

- O código legado está **funcional mas não recomendado** para novos desenvolvimentos
- Toda nova autenticação deve usar `createSession` (unificado)
- Este documento deve ser revisado a cada trimestre
