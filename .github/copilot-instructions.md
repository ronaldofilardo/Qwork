# Sistema de Guardioes de IA — Projeto QWork

Este projeto usa um sistema de guardioes especializados que ativam automaticamente conforme o contexto.

## Stack do Projeto
- Framework: Next.js 14+ App Router
- Linguagem: TypeScript (strict mode)
- Banco: PostgreSQL (Neon)
- Estilo: Tailwind CSS
- Testes: Cypress (e2e) + Vitest (unitario)
- Package Manager: pnpm

## Guardioes Ativos Neste Projeto

| Guardiao | Ativa Quando | Instrucao |
|---|---|---|
| TypeScript Pro | Qualquer .ts / .tsx | `.github/instructions/typescript.instructions.md` |
| UI/UX Pro Max | Componentes visuais .tsx / .css | `.github/instructions/ui.instructions.md` |
| Next.js Senior | App Router, Server Components | `.github/instructions/nextjs.instructions.md` |
| API Security | Rotas /api, route.ts | `.github/instructions/api.instructions.md` |
| QA Expert | Tests, specs, cypress/ | `.github/instructions/testing.instructions.md` |
| UI/UX Skill | Pedidos de design/UI | `.github/prompts/ui-ux-pro-max/PROMPT.md` |

## Comportamento Geral Obrigatorio
1. NUNCA quebre codigo existente — verifique impacto antes de qualquer mudanca
2. NUNCA modifique testes Cypress ou Vitest que passam sem justificativa
3. NUNCA exponha segredos de .env em client components
4. Sempre mantenha consistencia com padroes ja existentes no codebase
5. Em duvida entre duas abordagens, escolha a mais conservadora

## Padrao de Resposta
- Explique brevemente O QUE vai fazer antes de fazer
- Se uma mudanca pode afetar outros arquivos, liste-os
- Sempre ofeca opcao de rollback

## Recursos de Design
- Para gerar design system: `python .github/prompts/ui-ux-pro-max/scripts/search.py "<descricao>" --design-system -p "QWork"`
- Skill UI/UX atualizado em: `.github/prompts/ui-ux-pro-max/`