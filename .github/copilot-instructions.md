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

## AI Skills de Design (Anti-Slop)

Estas skills estao instaladas em `.agents/skills/` e ativam automaticamente quando voce pede ajuda com UI/UX.
Para acionar explicitamente no chat, mencione o nome da skill ou o comando desejado.

### Taste Skill — Design Anti-Slop (Automatico)
Skill principal para evitar UI generica. Ativa quando voce gera componentes visuais.

Principios obrigatorios:
- NUNCA usar Inter como fonte. Usar Geist, Outfit, Cabinet Grotesk ou Satoshi
- NUNCA fundo puro `#000000`. Usar zinc-950, off-black ou charcoal tintado
- NUNCA gradientes purple/blue AI. Usar neutrals (Zinc/Slate) + 1 accent color
- NUNCA 3-column card layout igual. Usar zig-zag, asymmetric grid ou horizontal scroll
- NUNCA `h-screen`. Usar `min-h-[100dvh]` para prevenir layout jump no iOS Safari
- NUNCA emojis em codigo. Substituir por icones Phosphor/Radix ou SVG
- Animacoes: spring physics (`stiffness: 100, damping: 20`), nunca linear easing
- Motion: animar somente `transform` e `opacity`, nunca `top`/`left`/`width`/`height`
- Loading states, empty states e error states sao OBRIGATORIOS em componentes interativos

Skill: `.agents/skills/design-taste-frontend/SKILL.md`
Redesign de UI existente: `.agents/skills/redesign-existing-projects/SKILL.md`
Output completo (sem placeholders): `.agents/skills/output-skill/SKILL.md`

### Impeccable — 18 Comandos de Design (Explicito)
Para usar, mencione o comando no chat junto com a area do projeto:

| Comando | Uso | Quando usar |
|---------|-----|-------------|
| `/audit <area>` | `"@Copilot /audit rh/dashboard"` | Antes de qualquer mudanca |
| `/critique <area>` | `"@Copilot /critique onboarding"` | Revisao UX: hierarchy, clarity |
| `/normalize <area>` | `"@Copilot /normalize components/Modal"` | Apos audit, alinhar design system |
| `/polish <area>` | `"@Copilot /polish feature modal"` | Ultimo passo antes de deploy |
| `/distill <area>` | `"@Copilot /distill sidebar"` | Remover complexidade |
| `/clarify <area>` | `"@Copilot /clarify form errors"` | Melhorar UX copy e mensagens |
| `/harden <area>` | `"@Copilot /harden checkout"` | Error handling, edge cases |
| `/animate <area>` | `"@Copilot /animate page transitions"` | Adicionar motion intencional |
| `/colorize <area>` | `"@Copilot /colorize dashboard"` | Introducao estrategica de cor |
| `/typeset <area>` | `"@Copilot /typeset headings"` | Corrigir hierarchy de fontes |
| `/layout <area>` | `"@Copilot /layout lotes-list"` | Corrigir spacing e ritmo |
| `/bolder <area>` | `"@Copilot /bolder hero section"` | Amplificar designs fracos |
| `/quieter <area>` | `"@Copilot /quieter admin panel"` | Reduzir excesso visual |

Combinado: `"@Copilot /audit /normalize /polish components/lotes"`

Skills: `.agents/skills/audit/`, `.agents/skills/critique/`, `.agents/skills/polish/`, etc.

### Impeccable CLI (Sem Agent)
Para detectar anti-patterns diretamente no codigo sem precisar de agent:
```
npx impeccable detect app/          # escanear diretorio
npx impeccable detect app/rh        # foco em uma area
npx impeccable detect --json app/   # output JSON para CI
```

### Code Review (GitHub — PRs)
Revisao automatica de PRs via Claude Code Review (configurar em claude.ai/admin-settings/claude-code).
Para acionar manualmente em um PR, comentar:
- `@claude review` — inicia review + subscribe pushes futuras
- `@claude review once` — review unica sem subscribe
Regras customizadas em: `REVIEW.md`