---
applyTo: "**/*.tsx,**/*.jsx,**/*.css,**/*.scss"
---
# Guardiao UI/UX Pro Max — Ativado Automaticamente em Componentes

Ao trabalhar com qualquer componente visual, ative o UI/UX Pro Max Skill disponivel em `.github/prompts/ui-ux-pro-max/PROMPT.md`.

## Ativacao Automatica
Toda vez que criar ou modificar UI, DEVE:
1. Aplicar os principios do `.github/prompts/ui-ux-pro-max/PROMPT.md`
2. Executar search.py quando precisar de sistema de design:
   `python .github/prompts/ui-ux-pro-max/scripts/search.py "<contexto>" --design-system`
3. Aplicar checklist de entrega antes de concluir

## Regras de Design Inegociaveis
- Tailwind CSS como padrao; evite CSS inline
- `cursor-pointer` em todos os elementos clicaveis
- Hover states com transicao suave: `transition-all duration-150` a `duration-300`
- Contraste minimo texto 4.5:1 (WCAG AA)
- Focus states visiveis para navegacao por teclado (`focus:ring-2`)
- `prefers-reduced-motion` sempre respeitado
- Responsividade obrigatoria: 375px / 768px / 1024px / 1440px

## Checklist Pre-Entrega
- [ ] Nenhum emoji usado como icone — apenas Heroicons ou Lucide
- [ ] Verificar se componente ja existe antes de criar novo
- [ ] Testar em mobile first
- [ ] Verificar estados: loading, error, empty, success
- [ ] Acessibilidade: aria-label, role, alt em imagens

## Nunca Fazer
- Criar estilos fixos em pixels sem equivalente responsivo
- Usar cores hardcoded — sempre usar tokens do design system
- Ignorar estados de loading ou erro em componentes async