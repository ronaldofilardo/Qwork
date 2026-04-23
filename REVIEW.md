# Claude Code Review — QWork Custom Rules

> Instruções de alta prioridade para o Code Review automático de PRs neste repositório.
> Este arquivo sobrescreve o comportamento padrão de revisão para o contexto do QWork.

---

## Contexto do Sistema

**QWork** é um sistema de gestão de avaliações de saúde ocupacional com emissão 100% manual de laudos médicos.

- **Stack**: Next.js 14+ App Router, TypeScript strict, PostgreSQL, Tailwind CSS, Zod, React Query
- **Constraint crítica**: `lote.id = laudo.id` sempre (trigger `fn_reservar_id_laudo_on_lote_insert`)
- **CPF único cross-perfil**: migration 1229 (constraint `cpf_unico_sistema`)
- **DB Policy**: DEV=nr-bps_db_test (local), PROD=neondb_v2 (Neon) — nunca misturar
- **Auto-emissão**: desabilitada, não reativar sem aprovação explícita

---

## O que é 🔴 Important (deve ser corrigido antes do merge)

Reserve para issues que **quebram comportamento**, **vazam dados** ou **bloqueiam rollback**:

- **Lógica de emissão**: quebra de constraint `lote.id = laudo.id` ou `pagamento_completo_check`
- **CPF único**: INSERT/UPDATE de `usuarios`, `representantes`, `funcionarios` sem verificar CPF único cross-perfil
- **Lotes isentos**: `isento_pagamento=true` sem preencher `pagamento_metodo`, `pagamento_parcelas`, `pago_em` — viola `pagamento_completo_check`
- **Database scope**: queries em `/api` sem filtrar por `clinica_id`, `entidade_id` ou contexto de sessão — risco de vazamento cross-tenant
- **Segurança**: CPF completo exposto em logs, tokens em client components, segredos de `.env` expostos
- **DB Policy**: código que acessa `neondb_v2` em contexto dev/test, ou `ALLOW_PROD_DB_LOCAL=true` em `.env.local`
- **Migrations**: não backward-compatible, sem rollback seguro, ou com `ON CONFLICT` em índices parciais (usar constraint UNIQUE)
- **NODE_ENV**: `NODE_ENV=production` em `.env.local` causa `405` em routes PATCH/PUT — flagrar se introduzido

---

## O que NÃO reportar (Skip)

- Lint, formatação, type errors (enforçado pelo CI)
- Arquivos gerados: `database/migrations/`, `pnpm-lock.yaml`, `*.lock`, `src/gen/`
- Tests que violam regras intencionalmente (mocks de prod DB em ambiente de teste controlado)
- Documentação cosmética (typos em comentários, README fora do critical path)
- Mudanças apenas em `__tests__/` sem alteração de código de produção

---

## Cap de Nits

- **Máximo 3 🟡 Nits por review**. Se encontrar mais, listar no summary como "mais N itens similares"
- Se todos os findings forem Nits, iniciar o summary com **"Sem issues bloqueantes"**
- Após a primeira review de um PR, suprimir novos Nits em pushes subsequentes — reportar somente 🔴 Important

---

## Sempre Verificar

| Check | Descrição |
|-------|-----------|
| ✅ Nova rota `/api` | Tem teste de integração correspondente em `__tests__/api/`? |
| ✅ CPF em logs | Alguma linha loga CPF sem mascarar? (`cpf.slice(0,3)...` deve ser usado) |
| ✅ Funcionários INSERT | Passam `clinica_id` (perfil RH) ou `contratante_id` (perfil Entidade)? Sem FK viola `funcionarios_clinica_check` |
| ✅ Lote isento | Se `isento_pagamento=true`, campos `pagamento_metodo='isento'`, `pagamento_parcelas=1`, `pago_em=NOW()` preenchidos? |
| ✅ Split financeiro | Comissão calculada sobre `netValue` (após gateway), não sobre `valor_bruto` |
| ✅ RLS e multi-tenant | Queries de RH scoped a `clinica_id`, queries de Entidade scoped a `entidade_id`, admin sem restrição |

---

## Shape do Summary

Iniciar o body da review com uma linha de contagem: `N Important, N Nit, N Pre-existing`.  
Se não houver issues de nenhum tipo, postar apenas: **"Nenhum issue encontrado."**

---

## Não Bloquear Merge

Esta revisão tem conclusão neutra — nunca bloqueia o merge. Para gates baseados em severidade,
usar a leitura do check run output via `gh api` e parsing do JSON de severity.
