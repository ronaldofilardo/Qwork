import { render, screen } from '@testing-library/react';
import TermosContratoPage from '@/app/termos/contrato/page';

describe('Página /termos/contrato', () => {
  it('exibe título do contrato e cláusula sobre menores', () => {
    render(<TermosContratoPage />);
    expect(
      screen.getByText(/CONTRATO DE PRESTAÇÃO DE SERVIÇOS DIGITAIS/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: /AVALIAÇÃO DE MENORES DE 18 ANOS/i,
      })
    ).toBeInTheDocument();
  });
});
