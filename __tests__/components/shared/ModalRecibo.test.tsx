/**
 * @file __tests__/components/shared/ModalRecibo.test.tsx
 * Testes: componente ModalRecibo
 * Cobre:
 * - Remoção do campo "Número do Lote"
 * - Exibição do campo "Número do Laudo" quando presente
 * - Logo QWork exibida antes do rodapé
 * - Comportamento de fechar modal
 */

import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import ModalRecibo, {
  type PagamentoReciboData,
} from '@/components/shared/ModalRecibo';

const fakePagamento: PagamentoReciboData = {
  id: 50,
  valor: 58.8,
  metodo: 'boleto',
  status: 'pago',
  numeroParcelas: 6,
  detalhesParcelas: [
    {
      numero: 1,
      valor: 9.8,
      data_vencimento: '2026-03-17',
      pago: true,
      data_pagamento: '2026-03-17',
    },
    { numero: 2, valor: 9.8, data_vencimento: '2026-04-20', pago: false },
  ],
  numeroFuncionarios: 6,
  valorPorFuncionario: 9.8,
  reciboNumero: 'PAG-000050',
  reciboUrl: null,
  dataPagamento: '2026-03-18T09:46:00Z',
  dataConfirmacao: '2026-03-18T09:46:00Z',
  criadoEm: '2026-03-18T09:44:00Z',
  loteId: 38,
  loteCodigo: '38',
  loteNumero: 17,
  laudoId: 38,
};

describe('ModalRecibo', () => {
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Remoção do campo Número do Lote ──────────────────────────────────────

  it('não deve exibir o campo "Número do Lote" no recibo', () => {
    render(
      <ModalRecibo
        pagamento={fakePagamento}
        organizacaoNome="Clinica Lead REP-PJ"
        onClose={onClose}
      />
    );

    expect(screen.queryByText('Número do Lote')).not.toBeInTheDocument();
  });

  it('não deve exibir o título "Referência de Lote e Laudo"', () => {
    render(
      <ModalRecibo
        pagamento={fakePagamento}
        organizacaoNome="Clinica Lead REP-PJ"
        onClose={onClose}
      />
    );

    expect(
      screen.queryByText('Referência de Lote e Laudo')
    ).not.toBeInTheDocument();
  });

  // ── Exibição do Laudo ────────────────────────────────────────────────────

  it('deve exibir o campo "Número do Laudo" quando laudoId presente', () => {
    render(
      <ModalRecibo
        pagamento={fakePagamento}
        organizacaoNome="Clinica Lead REP-PJ"
        onClose={onClose}
      />
    );

    expect(screen.getByText('Número do Laudo')).toBeInTheDocument();
    expect(screen.getByText('000038')).toBeInTheDocument();
  });

  it('deve exibir título "Referência de Laudo" (sem lote)', () => {
    render(
      <ModalRecibo
        pagamento={fakePagamento}
        organizacaoNome="Clinica Lead REP-PJ"
        onClose={onClose}
      />
    );

    expect(screen.getByText(/Referência de Laudo/i)).toBeInTheDocument();
  });

  it('não deve exibir seção de laudo quando laudoId é null', () => {
    render(
      <ModalRecibo
        pagamento={{ ...fakePagamento, laudoId: null }}
        organizacaoNome="Clinica Lead REP-PJ"
        onClose={onClose}
      />
    );

    expect(screen.queryByText('Número do Laudo')).not.toBeInTheDocument();
    expect(screen.queryByText(/Referência de Laudo/i)).not.toBeInTheDocument();
  });

  // ── Logo QWork ───────────────────────────────────────────────────────────

  it('deve exibir a logo QWork com src "/logo-qwork.png"', () => {
    render(
      <ModalRecibo
        pagamento={fakePagamento}
        organizacaoNome="Clinica Lead REP-PJ"
        onClose={onClose}
      />
    );

    const logo = screen.getByAltText('QWork');
    expect(logo).toBeInTheDocument();
    // next/image otimiza a URL — verificar que referencia o asset correto
    expect(logo.getAttribute('src')).toMatch(/logo-qwork/);
  });

  it('deve exibir a logo antes do texto de rodapé (QWork · Gestão de Saúde Ocupacional)', () => {
    render(
      <ModalRecibo
        pagamento={fakePagamento}
        organizacaoNome="Clinica Lead REP-PJ"
        onClose={onClose}
      />
    );

    const logo = screen.getByAltText('QWork');
    const footer = logo.closest('.footer');
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveTextContent(/Gestão de Saúde Ocupacional/i);
  });

  // ── Comportamento geral ──────────────────────────────────────────────────

  it('deve chamar onClose ao clicar no botão X', () => {
    render(
      <ModalRecibo
        pagamento={fakePagamento}
        organizacaoNome="Clinica Lead REP-PJ"
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByLabelText('Fechar'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('não deve renderizar nada quando pagamento é null', () => {
    const { container } = render(
      <ModalRecibo
        pagamento={null}
        organizacaoNome="Clinica Lead REP-PJ"
        onClose={onClose}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('deve exibir número do recibo no documento', () => {
    render(
      <ModalRecibo
        pagamento={fakePagamento}
        organizacaoNome="Clinica Lead REP-PJ"
        onClose={onClose}
      />
    );

    expect(screen.getByText('PAG-000050')).toBeInTheDocument();
  });
});
