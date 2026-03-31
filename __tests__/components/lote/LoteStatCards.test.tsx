/**
 * @file __tests__/components/lote/LoteStatCards.test.tsx
 * Testes para o componente unificado LoteStatCards
 *
 * Valida:
 *  - Renderiza 4 cards com valores corretos
 *  - Exibe percentual de conclusão quando total > 0
 *  - Não exibe percentual quando total = 0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoteStatCards from '@/components/lote/LoteStatCards';
import type { Estatisticas } from '@/lib/lote/types';

const estatisticasMock: Estatisticas = {
  total: 11,
  concluidas: 8,
  inativadas: 2,
  pendentes: 1,
};

describe('LoteStatCards', () => {
  it('deve renderizar 4 cards', () => {
    const { container } = render(
      <LoteStatCards estatisticas={estatisticasMock} />
    );
    const cards = container.querySelectorAll('.bg-white.rounded-lg.shadow-sm');
    expect(cards).toHaveLength(4);
  });

  it('deve exibir Total de Avaliações com valor correto', () => {
    render(<LoteStatCards estatisticas={estatisticasMock} />);
    expect(screen.getByText('Total de Avaliações')).toBeInTheDocument();
    expect(screen.getByText('11')).toBeInTheDocument();
  });

  it('deve exibir Avaliações Concluídas com valor correto', () => {
    render(<LoteStatCards estatisticas={estatisticasMock} />);
    expect(screen.getByText('Avaliações Concluídas')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('deve exibir Avaliações Inativadas com valor correto', () => {
    render(<LoteStatCards estatisticas={estatisticasMock} />);
    expect(screen.getByText('Avaliações Inativadas')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('deve exibir Avaliações Pendentes com valor correto', () => {
    render(<LoteStatCards estatisticas={estatisticasMock} />);
    expect(screen.getByText('Avaliações Pendentes')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('deve exibir percentual de conclusão quando total > 0', () => {
    render(<LoteStatCards estatisticas={estatisticasMock} />);
    // 8/11 = 72.72...% → arredonda para 73%
    expect(screen.getByText(/73% de conclusão/)).toBeInTheDocument();
  });

  it('não deve exibir percentual quando total = 0', () => {
    const empty: Estatisticas = {
      total: 0,
      concluidas: 0,
      inativadas: 0,
      pendentes: 0,
    };
    render(<LoteStatCards estatisticas={empty} />);
    expect(screen.queryByText(/de conclusão/)).not.toBeInTheDocument();
  });
});
