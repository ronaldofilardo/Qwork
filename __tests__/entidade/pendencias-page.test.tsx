/**
 * @file __tests__/entidade/pendencias-page.test.tsx
 * Testes: EntidadePendenciasPage — caixa de critérios de elegibilidade
 *
 * Verifica que a página exibe o box informativo com os 4 critérios
 * antes do componente PendenciasSection.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock de next/dynamic para evitar carregamento assíncrono do PendenciasSection
jest.mock('next/dynamic', () => (_importFn: unknown, _options: unknown) => {
  const MockPendenciasSection = () => <div data-testid="pendencias-section" />;
  MockPendenciasSection.displayName = 'MockPendenciasSection';
  return MockPendenciasSection;
});

import EntidadePendenciasPage from '@/app/entidade/pendencias/page';

describe('EntidadePendenciasPage — box de critérios de elegibilidade', () => {
  it('deve renderizar o heading e subtítulo da página', () => {
    render(<EntidadePendenciasPage />);
    expect(screen.getByText('Pendências')).toBeInTheDocument();
    expect(
      screen.getByText(/Funcionários sem avaliação concluída/i)
    ).toBeInTheDocument();
  });

  it('deve renderizar o box informativo de critérios', () => {
    render(<EntidadePendenciasPage />);
    expect(
      screen.getByText('Quem aparece nas pendências?')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Um funcionário é listado aqui quando se enquadra/i)
    ).toBeInTheDocument();
  });

  it('deve exibir os 4 critérios de elegibilidade', () => {
    render(<EntidadePendenciasPage />);

    expect(screen.getByText('Nunca avaliados:')).toBeInTheDocument();
    expect(
      screen.getByText('Ciclo(s) em atraso sem conclusão recente:')
    ).toBeInTheDocument();
    expect(screen.getByText('Avaliação vencida:')).toBeInTheDocument();
    expect(screen.getByText('Sem conclusão válida:')).toBeInTheDocument();
  });

  it('deve exibir a nota de rodapé sobre funcionários ativos', () => {
    render(<EntidadePendenciasPage />);
    expect(
      screen.getByText(
        /Somente funcionários ativos e com vínculo ativo são considerados/i
      )
    ).toBeInTheDocument();
  });

  it('deve renderizar o PendenciasSection após o box de critérios', () => {
    render(<EntidadePendenciasPage />);
    expect(screen.getByTestId('pendencias-section')).toBeInTheDocument();
  });

  it('o box de critérios deve aparecer antes do PendenciasSection no DOM', () => {
    const { container } = render(<EntidadePendenciasPage />);

    const allElements = Array.from(container.querySelectorAll('*'));
    const boxIndex = allElements.findIndex((el) =>
      el.textContent?.includes('Quem aparece nas pendências?')
    );
    const sectionIndex = allElements.findIndex(
      (el) => (el as HTMLElement).dataset?.testid === 'pendencias-section'
    );

    expect(boxIndex).toBeGreaterThan(-1);
    expect(sectionIndex).toBeGreaterThan(-1);
    expect(boxIndex).toBeLessThan(sectionIndex);
  });

  it('deve exibir descrição de cada critério', () => {
    render(<EntidadePendenciasPage />);

    expect(
      screen.getByText(/ainda não participaram de nenhum ciclo avaliativo/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/avaliação foi inativada e não há conclusão válida/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/última avaliação concluída foi há mais de 12 meses/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/nenhuma avaliação foi concluída — apenas inativadas/i)
    ).toBeInTheDocument();
  });
});
