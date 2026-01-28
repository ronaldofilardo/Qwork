import { render, screen } from '@testing-library/react';
import PaymentSummaryCard from '@/components/payments/PaymentSummaryCard';

describe('PaymentSummaryCard', () => {
  it('deve renderizar o resumo financeiro corretamente', () => {
    render(<PaymentSummaryCard total={1000} pago={600} restante={400} />);

    expect(screen.getByText('Resumo Financeiro')).toBeInTheDocument();
    expect(screen.getByText('Status dos pagamentos')).toBeInTheDocument();
  });

  it('deve exibir o valor total formatado', () => {
    render(<PaymentSummaryCard total={1234.56} pago={600} restante={634.56} />);

    expect(screen.getByText(/R\$\s?1\.234,56/)).toBeInTheDocument();
  });

  it('deve exibir o valor pago em verde', () => {
    render(<PaymentSummaryCard total={1000} pago={600} restante={400} />);

    const pagoElement = screen.getByText(/R\$\s?600,00/);
    expect(pagoElement).toHaveClass('text-green-600');
  });

  it('deve exibir o valor restante em laranja', () => {
    render(<PaymentSummaryCard total={1000} pago={600} restante={400} />);

    const restanteElement = screen.getByText(/R\$\s?400,00/);
    expect(restanteElement).toHaveClass('text-orange-600');
  });

  it('deve exibir três colunas (Total, Pago, Restante)', () => {
    render(<PaymentSummaryCard total={1000} pago={600} restante={400} />);

    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Pago')).toBeInTheDocument();
    expect(screen.getByText('Restante')).toBeInTheDocument();
  });

  it('deve renderizar com valores zero', () => {
    render(<PaymentSummaryCard total={0} pago={0} restante={0} />);

    const valores = screen.getAllByText(/R\$\s?0,00/);
    expect(valores).toHaveLength(3);
  });

  it('deve ter ícone de dólar', () => {
    const { container } = render(
      <PaymentSummaryCard total={1000} pago={600} restante={400} />
    );

    // Verificar se o ícone DollarSign está presente
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('deve aplicar gradiente de fundo', () => {
    const { container } = render(
      <PaymentSummaryCard total={1000} pago={600} restante={400} />
    );

    const card = container.querySelector('.bg-gradient-to-br');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('from-blue-50', 'to-indigo-50');
  });
});
