# Plano de Implementação — Informações da Conta (Entidade)

## Objetivo

Implementar a nova UI para a tela **Informações da Conta (Entidade)** para que fique visualmente e funcionalmente tão próxima quanto possível da versão **Clínica**, com foco em: legibilidade de recibos/parcelas, consistência de componentes e acessibilidade.

---

## Passos (ordem recomendada)

1. Preparação (1h)
   - Criar branch: `feat/entidade-conta-ux`.
   - Adicionar ticket/descrição (link para `docs/specs/informacoes-conta-entidade-ux.md`).

2. Extrair / Criar componentes reutilizáveis (2-3h)
   - Extrair trechos relacionados a pagamentos/parcelas de `components/clinica/ContaSection.tsx` para:
     - `components/payments/PaymentItem.tsx`
     - `components/payments/ParcelItem.tsx`
     - `components/payments/PaymentSummaryCard.tsx`
   - Garantir props bem tipadas (TypeScript) e testes unitários para cada um.

3. Atualizar modais (30–60min)
   - Em `components/modals/ModalVerPagamento.tsx` adicionar (se `pagamento.recibo`) botão `Baixar Recibo` e/ou link para `/recibo/{id}`.
   - Garantir que o modal suporte `onDownload` callback para testes.

4. Tornar `AccountInfoSidebar` configurável (1-2h)
   - Adicionar prop `variant?: 'sidebar' | 'main'` ou `wide?: boolean`.
   - No modo `main`, alterar `containerClass` para usar layout central (ex: max-w-2xl, não `w-80`) e renderizar cards (`Contrato`, `Pagamentos`) usando os componentes extraídos.
   - Manter compatibilidade com `stacked` e `isLoading` comportamentos atuais.

5. Alternativa: criar `EntidadeContaSection` (se preferir menos risco)
   - Implementar nova `components/entidade/ContaSection.tsx` reusando os componentes extraídos e consumindo `/api/entidade/account-info`.
   - Substituir em `app/entidade/conta/page.tsx` a chamada atual por `<ContaSection/>`.

6. Testes (2-3h)
   - Unit tests: `__tests__/components/*` para novos componentes e snapshots.
   - Integration tests: atualizar `__tests__/components/AccountInfoSidebar.test.tsx` para a nova estrutura (modo `main`).
   - E2E: adicionar Cypress tests para `/entidade/conta` (abrir modal de recibo, baixar PDF, expandir parcelas).
   - Acessibilidade: rodar `axe` nos principais fluxos e corrigir problemas críticos.

7. Documentação & Imagens (30min)
   - Atualizar `docs/specs/informacoes-conta-entidade-ux.md` com mockup final (incluir `docs/specs/images/entidade-proposal.png`)
   - Adicionar notas de migração/componente no README do `components/payments` (se aplicável).

8. PR e revisão (30–60min)
   - Incluir screenshots before/after.
   - Checklist do PR:
     - [ ] Nova funcionalidade coberta por testes unit + e2e
     - [ ] Accessibility checks (axe) passam
     - [ ] Documentação atualizada com screenshots e descrição
     - [ ] Testes de contrato da API (mocked) presentes
     - [ ] Revisão de código aprovada (2 reviewers)

---

## Estimativa de esforço

- Total estimado: ~8–12 horas (dependendo do nível de extração para evitar duplicação)

---

## Riscos e mitigação

- Risco: duplicação do código entre `clinica` e `entidade` se extração não for feita corretamente. Mitigação: extrair componentes e escrever testes unitários com contratos claros.
- Risco: variações de schema (alguns ambientes não têm `recibos` ou colunas antigas). Mitigação: manter fallback server-side (já presente nas APIs) e checar behavior em ambientes de testes.

---

## PR Checklist / Instruções de revisão

- Rodar `pnpm test` e confirmar que os novos testes passam.
- Rodar `pnpm test:e2e` ou executar os cenários Cypress adicionados.
- Verificar manualmente em 1280x800 / 1024x768 / 375x812.
- Verificar links `Ver Recibo` e `Baixar Recibo` (abrir em nova aba e baixa PDF).

---

Próximo passo: quando você aprovar, eu começo a implementar as mudanças (faço a extração, adaptação e abrirei PR com os testes).
