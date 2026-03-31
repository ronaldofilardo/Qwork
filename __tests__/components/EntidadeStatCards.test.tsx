/**
 * @file __tests__/components/EntidadeStatCards.test.tsx
 * Testes para o componente EntidadeStatCards
 *
 * Valida:
 *  - Exibe 4 cards: Total de Funcionários, Concluídas, Inativadas, Pendentes
 *  - Total de Funcionários = inclui inativadas (ex: lote 42 → 11)
 *  - Card de Avaliações Inativadas é novo (lote 42 → 2)
 *  - Percentual de conclusão calculado sobre total (inclui inativadas)
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import EntidadeStatCards from '@/app/entidade/lote/[id]/components/EntidadeStatCards';

const estatisticasLote42 = {
  total_funcionarios: 11,
  funcionarios_concluidos: 8,
  funcionarios_inativados: 2,
  funcionarios_pendentes: 1,
};

describe('EntidadeStatCards', () => {
  describe('Cards exibidos', () => {
    it('deve renderizar o card Total de Funcionários com valor correto (inclui inativadas)', () => {
      render(<EntidadeStatCards estatisticas={estatisticasLote42} />);
      expect(screen.getByText('Total de Funcionários')).toBeInTheDocument();
      // O valor 11 aparece como número no card
      const valores = screen.getAllByText('11');
      expect(valores.length).toBeGreaterThanOrEqual(1);
    });

    it('deve renderizar o card Avaliações Concluídas', () => {
      render(<EntidadeStatCards estatisticas={estatisticasLote42} />);
      expect(screen.getByText('Avaliações Concluídas')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
    });

    it('deve renderizar o card Avaliações Inativadas com o valor correto', () => {
      render(<EntidadeStatCards estatisticas={estatisticasLote42} />);
      expect(screen.getByText('Avaliações Inativadas')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('deve renderizar o card Avaliações Pendentes', () => {
      render(<EntidadeStatCards estatisticas={estatisticasLote42} />);
      expect(screen.getByText('Avaliações Pendentes')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('deve exibir exatamente 4 cards', () => {
      const { container } = render(
        <EntidadeStatCards estatisticas={estatisticasLote42} />
      );
      // Cada card é um div com bg-white rounded-lg shadow-sm
      const cards = container.querySelectorAll(
        '.bg-white.rounded-lg.shadow-sm'
      );
      expect(cards).toHaveLength(4);
    });
  });

  describe('Percentual de conclusão', () => {
    it('deve calcular % sobre total_funcionarios (inclui inativadas): 8/11 = 73%', () => {
      render(<EntidadeStatCards estatisticas={estatisticasLote42} />);
      expect(screen.getByText(/73% de conclus/)).toBeInTheDocument();
    });

    it('não deve exibir % quando total_funcionarios = 0', () => {
      render(
        <EntidadeStatCards
          estatisticas={{
            total_funcionarios: 0,
            funcionarios_concluidos: 0,
            funcionarios_inativados: 0,
            funcionarios_pendentes: 0,
          }}
        />
      );
      expect(screen.queryByText(/% de conclus/)).not.toBeInTheDocument();
    });
  });

  describe('Valores variados', () => {
    it('deve refletir número correto para qualquer total_funcionarios', () => {
      render(
        <EntidadeStatCards
          estatisticas={{
            total_funcionarios: 50,
            funcionarios_concluidos: 40,
            funcionarios_inativados: 5,
            funcionarios_pendentes: 5,
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
        <EntidadeStatCards
          estatisticas={{
            total_funcionarios: 10,
            funcionarios_concluidos: 9,
            funcionarios_inativados: 0,
            funcionarios_pendentes: 1,
          }}
        />
      );
      expect(screen.getByText('Avaliações Inativadas')).toBeInTheDocument();
      // zero: haverá múltiplos 0 potencialmente, mas o card deve existir
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThanOrEqual(1);
    });
  });
});
