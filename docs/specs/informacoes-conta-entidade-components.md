# Mapeamento de Componentes — Informações da Conta (Entidade)

**Objetivo:** identificar componentes existentes que podem ser reaproveitados e listar novos componentes a criar para alinhar a tela `Entidade` com o layout da `Clínica`.

---

## Componentes existentes que podem ser reutilizados

- `components/modals/ModalVerPagamento.tsx` — modal bem projetado para visualizar detalhes de um pagamento. Pode ser reutilizado como `ReceiptModal` / `PaymentModal` com leve adaptação (adicionar botão de download do recibo quando `pagamento.recibo` existir).
- `components/modals/ModalContrato.tsx` — já usado em `AccountInfoSidebar` para visualizar contrato.
- `/app/recibo/[id]/page.tsx` + APIs `/api/recibo/*` — infraestrutura para visualizar/baixar recibos (usar link `href=/recibo/{id}` ou botão para `/api/recibo/{id}/pdf`).
- `components/clinica/ContaSection.tsx` — implementação completa da tela Clinica (estrutura em cards, badges, listagem de pagamentos/parcelas). Ainda que esteja no namespace `clinica`, seu markup e UX são o padrão a ser reproduzido.

---

## Componentes a criar / extrair (prioridade)

- `components/payments/PaymentSummaryCard.tsx`
  - Props: { total: number, pago: number, restante: number }
  - Responsabilidade: exibir sumário de pagamentos (Total / Pago / Restante) e CTA para ver histórico

- `components/payments/PaymentItem.tsx`
  - Props: {
    pagamento: {
    id: number;
    valor: number;
    status: string;
    numero_parcelas?: number;
    parcelas: Array<{ numero:number; valor:number; data_vencimento:string; pago?:boolean }>;
    recibo?: { id:number; numero_recibo:string } | null;
    },
    onOpenPagamento?: (pagamento) => void
    }
  - Responsabilidade: renderizar o bloco de um pagamento (valor, badge de status, resumo de parcelas, link/ação para ver recibo/modal)

- `components/payments/ParcelItem.tsx`
  - Props: { parcela: { numero, valor, data_vencimento, pago } }
  - Responsabilidade: visualização consistente de uma parcela com badge de status

- `components/payments/ReceiptModal.tsx` (ou reutilizar `ModalVerPagamento`)
  - Props: { isOpen, onClose, pagamento, reciboId? }
  - Responsabilidade: mostrar detalhes do pagamento + botão `Baixar Recibo` (abre `/api/recibo/{id}/pdf` ou `window.open(`/recibo/${id}`)`)

- Ajuste em `components/AccountInfoSidebar.tsx`
  - Tornar responsivo a variações: aceitar prop `variant: 'sidebar' | 'main'` ou `wide?: boolean`.
  - Em `main/wide` modo, não forçar `w-80`; usar layout central semelhante ao `ContaSection` e renderizar os cards (Contrato / Pagamentos / Recibos) como na Clínica.
  - Extrair a lógica de render de pagamentos para `PaymentItem`.

---

## Arquivos que provavelmente serão alterados

- `components/AccountInfoSidebar.tsx` — converter para suportar modo `wide` e delegar render de pagamentos a novos componentes.
- `app/entidade/conta/page.tsx` — alterar para usar `AccountInfoSidebar` em modo `wide` ou substituir por `ContaSection` parametrizado (apontar para `/api/entidade/account-info`).
- `components/clinica/ContaSection.tsx` — extrair trechos de UI (lista de pagamentos, parcelas) para componentes reutilizáveis a fim de evitar duplicação.
- `components/modals/ModalVerPagamento.tsx` — adicionar opção de exibir botão `Baixar Recibo` se `pagamento.recibo` existir.
- `__tests__/components/AccountInfoSidebar.test.tsx` — assegurar cobertura de novas variações (modo wide, itens de parcela completos, abrir modal, link para recibo).
- `cypress/e2e/*` — adicionar cenários E2E para o fluxo: visualizar a tela Entidade, abrir recibo (em nova aba ou modal) e baixar PDF.

---

## Observações técnicas e de compatibilidade

- A API `/api/entidade/account-info` já retorna `pagamentos` com `parcelas_json` e `recibo` quando disponível — dados suficientes para a nova UI.
- Evitar duplicação: preferível extrair componentes de `components/clinica/ContaSection.tsx` e reaproveitar na `Entidade`.
- A geração/visualização/baixa de recibos já está implementada (`/recibo/{id}`, `/api/recibo/{id}/pdf`), usar essas rotas para construir as ações de download/visualização.

---

Próximo passo: escrever os critérios de aceitação e cenários de teste (unit + e2e) para validar a mudança. Depois disso, montar o plano de implementação passo-a-passo para o PR.
