/**
 * @file __tests__/contracts/terms-contrato.page.test.tsx
 * Testes: Página /termos/contrato
 */

import { render, screen } from '@testing-library/react';
import TermosContratoPage from '@/app/termos/contrato/page';

describe('Página /termos/contrato', () => {
  it('exibe título do contrato e cláusulas do v2', () => {
    render(<TermosContratoPage />);
    expect(
      screen.getByText(/CONTRATO DE PRESTAÇÃO DE SERVIÇOS/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: /DA ADESÃO MÍNIMA E EMISSÃO DE RELATÓRIO/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: /DA GESTÃO OPERACIONAL E COMERCIAL/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: /DA NATUREZA JURÍDICA/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: /DA ASSINATURA DIGITAL/i,
      })
    ).toBeInTheDocument();
  });
});
