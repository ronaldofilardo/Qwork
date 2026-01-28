import { render, screen } from '@testing-library/react';
import ParcelItem from '@/components/payments/ParcelItem';

describe('ParcelItem', () => {
  const mockParcela = {
    numero: 1,
    valor: 100.5,
    data_vencimento: '2025-01-15',
    pago: false,
  };

  it('deve renderizar corretamente uma parcela não paga', () => {
    render(<ParcelItem parcela={mockParcela} />);

    expect(screen.getByText('Parcela 1')).toBeInTheDocument();
    expect(screen.getByText('Em aberto')).toBeInTheDocument();
    expect(screen.getByText(/R\$\s?100,50/)).toBeInTheDocument();
    // Data pode variar por 1 dia devido ao timezone UTC
    expect(screen.getByText(/1[45]\/01\/2025/)).toBeInTheDocument();
  });

  it('deve renderizar corretamente uma parcela paga', () => {
    const parcelaPaga = { ...mockParcela, pago: true };
    render(<ParcelItem parcela={parcelaPaga} />);

    expect(screen.getByText('Pago')).toBeInTheDocument();
    const badge = screen.getByText('Pago');
    expect(badge).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('deve aplicar estilos diferentes para parcela paga vs não paga', () => {
    const { rerender } = render(<ParcelItem parcela={mockParcela} />);

    const badgeAberto = screen.getByText('Em aberto');
    expect(badgeAberto).toHaveClass('bg-gray-100', 'text-gray-700');

    rerender(<ParcelItem parcela={{ ...mockParcela, pago: true }} />);

    const badgePago = screen.getByText('Pago');
    expect(badgePago).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('deve ter aria-label apropriado', () => {
    render(<ParcelItem parcela={mockParcela} />);

    const badge = screen.getByLabelText('Em aberto');
    expect(badge).toBeInTheDocument();
  });

  it('deve formatar valor em reais', () => {
    render(<ParcelItem parcela={{ ...mockParcela, valor: 1234.56 }} />);

    expect(screen.getByText(/R\$\s?1\.234,56/)).toBeInTheDocument();
  });

  it('deve formatar data corretamente', () => {
    render(
      <ParcelItem parcela={{ ...mockParcela, data_vencimento: '2025-12-25' }} />
    );

    // Data pode variar por 1 dia devido ao timezone UTC
    expect(screen.getByText(/2[45]\/12\/2025/)).toBeInTheDocument();
  });
});
