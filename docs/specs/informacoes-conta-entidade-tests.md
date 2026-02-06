# Critérios de Aceitação e Planos de Teste — Informações da Conta (Entidade)

## Critérios de Aceitação (padrão mínimo)

1. Layout
   - A tela deve usar estrutura de cards (Contrato, Pagamentos, Recibos) e visual coerente com `components/clinica/ContaSection.tsx`.
   - Em desktop, o conteúdo principal deve ocupar largura adequada (não ser um sidebar estreito). Em mobile, itens devem empilhar verticalmente.

2. Recibos / Parcelas
   - Cada pagamento com parcelas exibe cada parcela com número, valor, data de vencimento e badge indicando estado (Pago / Em aberto / Vencido).
   - Quando houver mais de 3 parcelas, exibir o resumo e um contador "+N parcelas" (com ação para expandir lista completa).
   - Cada pagamento com `recibo` mostra ação para "Ver Recibo" e "Baixar Recibo" (ou abrir `/recibo/{id}` em nova aba).

3. Acessibilidade
   - Contraste mínimo para texto de corpo da página >= 4.5:1.
   - Badges e botões têm `aria-label` descritivo.
   - Modais devem trap focus e permitir fechar via ESC.

4. Performance & UX
   - Ao carregar a tela, exibir skeletons; não travar a navegação mesmo com chamadas de fallback a `/api/entidade/contrato-fallback`.
   - A ação de visualizar recibo deve ser imediata (abrir modal ou nova aba rapidamente).

5. Segurança & Permissões
   - A API `/api/entidade/account-info` deve ser consumida apenas por sessões `gestor`; testes devem garantir 401 para perfis indevidos.

---

## Testes Unitários (Jest + React Testing Library)

- Snapshot do novo componente `AccountInfoSidebar` em modo `wide` com dados de pagamentos com múltiplas parcelas.
- Teste de `PaymentItem`:
  - Renderiza valor, badge de status, resumo de parcelas
  - Exibe link para recibo quando `pagamento.recibo` presente
  - Aciona `onOpenPagamento` quando clicado (mock function)
- Teste de `ReceiptModal`:
  - Abre quando `isOpen=true` e mostra dados corretos
  - Botão `Baixar Recibo` chama URL `/api/recibo/{id}/pdf` ou o link para `/recibo/{id}`
- Teste de acessibilidade: executar `axe` nos principais componentes para garantir sem erros graves.

---

## Testes de Integração / E2E (Cypress)

Cenários principais:

1. Fluxo básico (Entidade)
   - Logar como `gestor` (mock ou fixtures)
   - Visitar `/entidade/conta`
   - Validar que as seções `Contrato`, `Pagamentos` e `Recibos` aparecem
   - Abrir o primeiro pagamento com recibo e clicar em `Ver Recibo` (abrir nova aba ou modal)
   - Baixar o PDF do recibo (ou checar chamada `GET /api/recibo/{id}/pdf`)

2. Parcelas (múltiplas)
   - Verificar que ao clicar em "+N parcelas" a lista completa é exibida
   - Confirmar que os estados das parcelas (pago/em aberto) são visualmente distintos

3. Acessibilidade e navegação por teclado
   - Navegar por teclado até um pagamento, abrir o modal e fechar com ESC

---

## Testes de Contrato de API

- Verificar que `GET /api/entidade/account-info` retorna payload conforme esperado (contrato + pagamentos[].parcelas_json + pagamentos[].recibo)
- Testes de permissão (401 quando sessão inválida)

---

## Planos de verificação manual (QA)

- Comparar visualmente (screenshots) a tela Entidade antiga vs nova usando `components/clinica/ContaSection.tsx` como referência.
- Checar em telas de 1280x800, 1024x768, e 375x812 (iPhone X) para garantir responsividade.

---

Próximo passo: montar o plano de implementação (passo-a-passo, PR checklist e tarefas de desenvolvimento/testes).
