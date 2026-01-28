import { render, screen, fireEvent } from '@testing-library/react';
import PaymentItem from '@/components/payments/PaymentItem';

// Mock do componente ParcelItem
jest.mock('@/components/payments/ParcelItem', () => {
  return function MockParcelItem({ parcela }: any) {
    return (
      <div data-testid={`parcela-${parcela.numero}`}>
        Parcela {parcela.numero} - R$ {parcela.valor}
      </div>
    );
  };
});

describe('PaymentItem', () => {
  const mockPagamento = {
    id: 1,
    valor: 1000,
    status: 'pago',
    metodo: 'pix',
    data_pagamento: '2025-01-10T10:00:00Z',
    numero_parcelas: 3,
    parcelas_json: [
      {
        numero: 1,
        valor: 333.33,
        data_vencimento: '2025-01-10',
        pago: true,
      },
      {
        numero: 2,
        valor: 333.33,
        data_vencimento: '2025-02-10',
        pago: false,
      },
      {
        numero: 3,
        valor: 333.34,
        data_vencimento: '2025-03-10',
        pago: false,
      },
    ],
    recibo: {
      id: 42,
      numero_recibo: 'REC-2025-00001',
    },
  };

  it('deve renderizar valor e status do pagamento', () => {
    render(<PaymentItem pagamento={mockPagamento} />);

    expect(screen.getByText(/R\$\s?1\.000,00/)).toBeInTheDocument();
    expect(screen.getByText('pago')).toBeInTheDocument();
  });

  it('deve exibir data de pagamento quando pago', () => {
    render(<PaymentItem pagamento={mockPagamento} />);

    expect(screen.getByText(/Pago em/)).toBeInTheDocument();
  });

  it('deve exibir data de solicitação quando não pago', () => {
    const pagamentoPendente = {
      ...mockPagamento,
      status: 'pendente',
      data_pagamento: undefined,
      data_solicitacao: '2025-01-05T10:00:00Z',
    };

    render(<PaymentItem pagamento={pagamentoPendente} />);

    expect(screen.getByText(/Solicitado em/)).toBeInTheDocument();
  });

  it('deve exibir método de pagamento', () => {
    render(<PaymentItem pagamento={mockPagamento} />);

    expect(screen.getByText(/Método:\s?pix/)).toBeInTheDocument();
  });

  it('deve indicar número de parcelas quando > 1', () => {
    render(<PaymentItem pagamento={mockPagamento} />);

    expect(screen.getByText(/3 parcelas/)).toBeInTheDocument();
  });

  it('deve indicar "À vista" quando não há parcelas', () => {
    const pagamentoAvista = {
      ...mockPagamento,
      numero_parcelas: undefined,
      parcelas_json: [],
    };

    render(<PaymentItem pagamento={pagamentoAvista} />);

    expect(screen.getByText(/À vista/)).toBeInTheDocument();
  });

  it('deve renderizar parcelas (máximo 3 inicialmente)', () => {
    render(<PaymentItem pagamento={mockPagamento} />);

    expect(screen.getByTestId('parcela-1')).toBeInTheDocument();
    expect(screen.getByTestId('parcela-2')).toBeInTheDocument();
    expect(screen.getByTestId('parcela-3')).toBeInTheDocument();
  });

  it('deve mostrar botão "Ver todas" quando houver mais de 3 parcelas', () => {
    const pagamentoMuitasParcelas = {
      ...mockPagamento,
      numero_parcelas: 5,
      parcelas_json: [
        ...mockPagamento.parcelas_json,
        {
          numero: 4,
          valor: 250,
          data_vencimento: '2025-04-10',
          pago: false,
        },
        {
          numero: 5,
          valor: 250,
          data_vencimento: '2025-05-10',
          pago: false,
        },
      ],
    };

    render(<PaymentItem pagamento={pagamentoMuitasParcelas} />);

    expect(screen.getByText(/Ver todas/)).toBeInTheDocument();
  });

  it('deve expandir/ocultar parcelas ao clicar', () => {
    const pagamentoMuitasParcelas = {
      ...mockPagamento,
      numero_parcelas: 5,
      parcelas_json: [
        ...mockPagamento.parcelas_json,
        {
          numero: 4,
          valor: 250,
          data_vencimento: '2025-04-10',
          pago: false,
        },
        {
          numero: 5,
          valor: 250,
          data_vencimento: '2025-05-10',
          pago: false,
        },
      ],
    };

    render(<PaymentItem pagamento={pagamentoMuitasParcelas} />);

    // Inicialmente apenas 3 parcelas visíveis
    expect(screen.queryByTestId('parcela-4')).not.toBeInTheDocument();

    // Clicar em "Ver todas"
    fireEvent.click(screen.getByText(/Ver todas/));

    // Agora todas as parcelas devem estar visíveis
    expect(screen.getByTestId('parcela-4')).toBeInTheDocument();
    expect(screen.getByTestId('parcela-5')).toBeInTheDocument();

    // Botão deve mudar para "Ocultar"
    expect(screen.getByText(/Ocultar/)).toBeInTheDocument();
  });

  it('deve exibir resumo quando disponível', () => {
    const pagamentoComResumo = {
      ...mockPagamento,
      resumo: {
        totalParcelas: 3,
        parcelasPagas: 1,
        valorPendente: 666.67,
        statusGeral: 'em_aberto' as const,
      },
    };

    render(<PaymentItem pagamento={pagamentoComResumo} />);

    expect(screen.getByText(/1 \/ 3 parcelas pagas/)).toBeInTheDocument();
    expect(screen.getByText(/Valor pendente:/)).toBeInTheDocument();
  });

  it('deve exibir número do recibo e instruir onde baixar (Conta > Plano) quando disponível', () => {
    render(<PaymentItem pagamento={mockPagamento} />);

    const reciboText = screen.getByText(/Recibo: REC-2025-00001/);
    expect(reciboText).toBeInTheDocument();
    // Não deve ser um link direto no componente (download via Conta > Plano)
    expect(reciboText.closest('a')).toBeNull();

    // Instrução para o usuário onde baixar o comprovante
    expect(screen.getByText(/Conta\s*>\s*Plano/)).toBeInTheDocument();
  });

  it('não deve exibir botão de download do recibo dentro do PaymentItem', () => {
    render(<PaymentItem pagamento={mockPagamento} />);

    const downloadButton = screen.queryByLabelText('Baixar recibo em PDF');
    expect(downloadButton).toBeNull();
  });

  it('não deve exibir seção de recibo quando não houver recibo', () => {
    const pagamentoSemRecibo = {
      ...mockPagamento,
      recibo: undefined,
    };

    render(<PaymentItem pagamento={pagamentoSemRecibo} />);

    expect(screen.queryByText(/Recibo:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Baixar PDF/)).not.toBeInTheDocument();
  });

  it('deve chamar onOpenModal quando fornecido', () => {
    const mockOnOpenModal = jest.fn();

    render(
      <PaymentItem pagamento={mockPagamento} onOpenModal={mockOnOpenModal} />
    );

    fireEvent.click(screen.getByText('Ver detalhes completos'));

    expect(mockOnOpenModal).toHaveBeenCalledWith(mockPagamento);
  });

  it('deve exibir badge "pendente" para status em_aberto', () => {
    const pagamentoComResumo = {
      ...mockPagamento,
      status: 'pendente',
      resumo: {
        totalParcelas: 3,
        parcelasPagas: 0,
        valorPendente: 1000,
        statusGeral: 'em_aberto' as const,
      },
    };

    render(<PaymentItem pagamento={pagamentoComResumo} />);

    const badge = screen.getByText('pendente');
    expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');
  });

  it('deve exibir badge "pago" para status quitado', () => {
    const pagamentoComResumo = {
      ...mockPagamento,
      resumo: {
        totalParcelas: 3,
        parcelasPagas: 3,
        valorPendente: 0,
        statusGeral: 'quitado' as const,
      },
    };

    render(<PaymentItem pagamento={pagamentoComResumo} />);

    const badge = screen.getByText('pago');
    expect(badge).toHaveClass('bg-green-100', 'text-green-800');
  });
});
