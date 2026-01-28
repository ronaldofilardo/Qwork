# Especificação UI/UX — Informações da Conta (Login: Entidade)

**Objetivo:** alinhar a tela `Informações da Conta` do login `Entidade` ao mesmo padrão visual e de usabilidade da tela `Clínica`, priorizando legibilidade dos recibos/parcelas e consistência de componentes.

---

## 1. Resumo das mudanças propostas ✅

- Estruturar o conteúdo em **cards**: `Contrato atual`, `Pagamentos`, `Recibos`.
- Usar **abas** quando fizer sentido (`Cadastradas` / `Plano`), igual à clínica.
- Exibir cada **parcela** como item com: número, valor, vencimento, status (badge), ação `Ver Recibo` (modal) e `Baixar` (PDF).
- Adotar **badges coloridos** (verde/pago, amarelo/pendente, vermelho/vencido).
- Reusar componentes existentes (Card, Badge, Tabs, Modal) para garantir consistência.

---

## 2. Layout e estrutura detalhada 🔧

- Container principal: largura máxima 980px, alinhado à esquerda com padding consistente (24px interno do card).
- Card `Contrato atual` (coluna esquerda - 320–360px em desktop): contrato, plano, valor por funcionário, vigência, botão `Ver Contrato`.
- Card `Pagamentos` (coluna central): sumário (total, pago, restante) + lista de pagamentos recentes.
- Card `Recibos` (aba/accordion): lista de parcelas por recibo; cada item com:
  - Ícone/label (Parcela 1/3)
  - Valor (em destaque)
  - Data de vencimento
  - Status badge (com tooltip explicando status)
  - Ações: `Ver Recibo` (abre modal com detalhe + botão `Baixar PDF`), `Marcar como pago` (se aplicável)

> Mobile: itens empilhados; ações agrupadas em um menu (kebab) para economizar espaço.

---

## 3. Comportamento e interações ✨

- Clique em `Ver Recibo`: abrir modal com resumo, método de pagamento, histórico de parcelas e botão de download.
- Listas com paginador ou infinite scroll (se > 20 items) para não poluir interface.
- Skeleton loaders durante carregamento de dados.
- Mensagem amigável quando não houver recibos: "Nenhum recibo encontrado" com CTA para contato ou emitir 2ª via.

---

## 4. Acessibilidade & WCAG ♿

- Contraste de texto >= 4.5:1 para corpo; 3:1 para texto grande.
- Botões com foco visível e navegáveis por teclado.
- Badges devem ter texto legível e `aria-label` descrevendo o estado.
- Modal com foco gerenciado (trap focus) e botão de fechar claro.

---

## 5. Componentes a reutilizar / criar 🧩

- Reutilizar: `Card`, `Tabs`, `Badge`, `Button`, `Modal`.
- Criar/adaptar:
  - `PaymentSummaryCard` (total/pago/restante)
  - `ReceiptItem` (lista de parcelas)
  - `ReceiptModal` (visualização + botão de download)

---

## 6. Critérios de aceitação (deliverables) ✅

- A tela `Entidade` deve aparentar e comportar-se como `Clínica` em estrutura e interação.
- Cada parcela tem botão `Ver Recibo` que abre o modal com botão `Baixar PDF`.
- Status visível por badge com cores padronizadas.
- Testes automatizados:
  - Snapshot da nova tela
  - Cypress E2E: abrir tela, ver recibo, baixar PDF
- Acessibilidade verificada (checagem manual + axe-core automatizado nos testes).

---

## 7. Notas para implementação 🔧

- Priorizar alteração por composição (reutilizar componentes existentes em `components/`).
- Pensar em props explícitas para `ReceiptItem` (e.g., { id, number, value, dueDate, status, receiptUrl }).
- Manter strings em i18n (pasta de traduções), evitar hard-coded.

---

## 8. Imagens / anexos (placeholders) 🖼️

- `docs/specs/images/entidade-before.png` — screenshot atual Entidade (anotar problemas).
- `docs/specs/images/clinica-reference.png` — screenshot referência Clínica.
- `docs/specs/images/entidade-proposal.png` — mockup da proposta (adicionar quando pronto).

---

## 9. Próximos passos (sprint) 🗓️

1. Criar mockup visual (Figma ou PNG) e screenshots anotadas.
2. Mapear componentes e apontar arquivos onde serão alterados.
3. Implementar em branch com testes e PR.

---

> Observação: Posso gerar as imagens anotadas e o mockup (PNG) se você autorizar; em seguida procedo para mapear os componentes para implementação.
