# Geração de Laudos (Política)

- Fonte única de verdade para HTML de laudo: `lib/templates/laudo-html.ts` -> `gerarHTMLLaudoCompleto()` ✅
- Regra operacional: **A geração de laudos em HTML e PDF deve ser feita exclusivamente pelo papel _emissor_ através do fluxo implementado em `lib/laudo-auto.ts` e API `app/api/emissor/laudos/[loteId]/pdf/route.ts`.**
- Remoções/limpeza aplicadas:
  - Qualquer gerador cliente (ex.: `html2pdf.js` na geração de laudos) foi removido do fluxo de laudos.
  - A função específica de laudo foi removida de `lib/pdf-generator.ts` (usar `gerarPdf` genérico para outras necessidades com cautela).
  - Scripts de verificação que duplicavam geração de laudos transformados em stubs (em `scripts/checks/`), e testes adaptados para validar o template canonical.

Motivação: garantir rastreabilidade, controle de emissões e assinatura/hashing centralizados, além de evitar divergências entre múltiplos geradores.

Se você for adicionar qualquer geração de laudo nova, consulte primeiro o time e siga este padrão. Para casos excepcionais, documente a justificativa no `docs/correcoes/`.
