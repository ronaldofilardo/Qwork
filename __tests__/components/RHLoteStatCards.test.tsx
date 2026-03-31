/**
 * @file __tests__/components/RHLoteStatCards.test.tsx
 * Testes para o componente RHLoteStatCards
 *
 * Valida:
 *  - Exibe 4 cards: Total de Avaliações, Concluídas, Inativadas, Pendentes
 *  - Total de Avaliações = inclui inativadas (ex: lote com 11 avaliações)
 *  - Card de Avaliações Inativadas exibe valor correto
 *  - Percentual de conclusão calculado sobre total (inclui inativadas)
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import RHLoteStatCards from '@/app/rh/empresa/[id]/lote/[loteId]/components/RHLoteStatCards';

const estatisticasLote42 = {
  total_avaliacoes: 11,
  avaliacoes_concluidas: 8,
  avaliacoes_inativadas: 2,
  avaliacoes_pendentes: 1,
};

describe('RHLoteStatCards', () => {
  describe('Cards exibidos', () => {
    it('deve renderizar o card Total de Avaliações com valor correto (inclui inativadas)', () => {
      render(<RHLoteStatCards estatisticas={estatisticasLote42} />);
      expect(screen.getByText('Total de Avaliações')).toBeInTheDocument();
      const valores = screen.getAllByText('11');
      expect(valores.length).toBeGreaterThanOrEqual(1);
    });

    it('deve renderizar o card Avaliações Concluídas', () => {
      render(<RHLoteStatCards estatisticas={estatisticasLote42} />);
      expect(screen.getByText('Avaliações Concluídas')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
    });

    it('deve renderizar o card Avaliações Inativadas com o valor correto', () => {
      render(<RHLoteStatCards estatisticas={estatisticasLote42} />);
      expect(screen.getByText('Avaliações Inativadas')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('deve renderizar o card Avaliações Pendentes', () => {
      render(<RHLoteStatCards estatisticas={estatisticasLote42} />);
      expect(screen.getByText('Avaliações Pendentes')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('deve exibir exatamente 4 cards', () => {
      const { container } = render(
        <RHLoteStatCards estatisticas={estatisticasLote42} />
      );
      const cards = container.querySelectorAll(
        '.bg-white.rounded-lg.shadow-sm'
      );
      expect(cards).toHaveLength(4);
    });
  });

  describe('Percentual de conclusão', () => {
    it('deve calcular % sobre total_avaliacoes (inclui inativadas): 8/11 = 73%', () => {
      render(<RHLoteStatCards estatisticas={estatisticasLote42} />);
      expect(screen.getByText(/73% de conclus/)).toBeInTheDocument();
    });

    it('não deve exibir % quando total_avaliacoes = 0', () => {
      render(
        <RHLoteStatCards
          estatisticas={{
            total_avaliacoes: 0,
            avaliacoes_concluidas: 0,
            avaliacoes_inativadas: 0,
            avaliacoes_pendentes: 0,
          }}
        />
      );
      expect(screen.queryByText(/% de conclus/)).not.toBeInTheDocument();
    });
  });

  describe('Valores variados', () => {
    it('deve refletir número correto para qualquer total_avaliacoes', () => {
      render(
        <RHLoteStatCards
          estatisticas={{
            total_avaliacoes: 50,
            avaliacoes_concluidas: 40,
            avaliacoes_inativadas: 5,
            avaliacoes_pendentes: 5,
          }}
        />
      );
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('40')).toBeInTheDocument();
      // inativadas=5 e pendentes=5 → dois elementos com '5'
      const fives = screen.getAllByText('5');
      expect(fives).toHaveLength(2);
    });

    it('deve exibir zero no card de inativadas quando não há inativadas', () => {
      render(
        <RHLoteStatCards
          estatisticas={{
            total_avaliacoes: 10,
            avaliacoes_concluidas: 9,
            avaliacoes_inativadas: 0,
            avaliacoes_pendentes: 1,
          }}
        />
      );
      expect(screen.getByText('Avaliações Inativadas')).toBeInTheDocument();
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThanOrEqual(1);
    });
  });
});
