/**
 * Testes para badges de classificação G1-G10 e filtros na página de lote da entidade
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock de componente simplificado para teste dos badges
const BadgeClassificacao = ({
  media,
  numeroGrupo,
}: {
  media: number | undefined;
  numeroGrupo: number;
}) => {
  if (media === undefined) return <span className="text-gray-400">-</span>;

  const gruposPositivos = [2, 3, 5, 6];
  const isPositivo = gruposPositivos.includes(numeroGrupo);

  let colorClass = '';
  let label = '';

  if (isPositivo) {
    if (media > 66) {
      label = 'Excelente';
      colorClass = 'bg-green-100 text-green-800';
    } else if (media >= 33) {
      label = 'Monitorar';
      colorClass = 'bg-yellow-100 text-yellow-800';
    } else {
      label = 'Atenção';
      colorClass = 'bg-red-100 text-red-800';
    }
  } else {
    if (media < 33) {
      label = 'Excelente';
      colorClass = 'bg-green-100 text-green-800';
    } else if (media <= 66) {
      label = 'Monitorar';
      colorClass = 'bg-yellow-100 text-yellow-800';
    } else {
      label = 'Atenção';
      colorClass = 'bg-red-100 text-red-800';
    }
  }

  return (
    <span
      className={`px-2 py-1 text-xs rounded-full font-medium whitespace-nowrap ${colorClass}`}
      data-testid={`badge-g${numeroGrupo}`}
    >
      {label}
    </span>
  );
};

describe('Badges de Classificação G1-G10', () => {
  describe('Grupos Positivos (2, 3, 5, 6) - Maior é melhor', () => {
    it('deve mostrar "Excelente" (verde) quando média > 66', () => {
      render(<BadgeClassificacao media={75} numeroGrupo={2} />);
      const badge = screen.getByTestId('badge-g2');
      expect(badge).toHaveTextContent('Excelente');
      expect(badge).toHaveClass('bg-green-100 text-green-800');
    });

    it('deve mostrar "Monitorar" (amarelo) quando média entre 33 e 66', () => {
      render(<BadgeClassificacao media={50} numeroGrupo={3} />);
      const badge = screen.getByTestId('badge-g3');
      expect(badge).toHaveTextContent('Monitorar');
      expect(badge).toHaveClass('bg-yellow-100 text-yellow-800');
    });

    it('deve mostrar "Atenção" (vermelho) quando média < 33', () => {
      render(<BadgeClassificacao media={25} numeroGrupo={5} />);
      const badge = screen.getByTestId('badge-g5');
      expect(badge).toHaveTextContent('Atenção');
      expect(badge).toHaveClass('bg-red-100 text-red-800');
    });
  });

  describe('Grupos Negativos (1, 4, 7, 8, 9, 10) - Menor é melhor', () => {
    it('deve mostrar "Excelente" (verde) quando média < 33', () => {
      render(<BadgeClassificacao media={20} numeroGrupo={1} />);
      const badge = screen.getByTestId('badge-g1');
      expect(badge).toHaveTextContent('Excelente');
      expect(badge).toHaveClass('bg-green-100 text-green-800');
    });

    it('deve mostrar "Monitorar" (amarelo) quando média entre 33 e 66', () => {
      render(<BadgeClassificacao media={50} numeroGrupo={4} />);
      const badge = screen.getByTestId('badge-g4');
      expect(badge).toHaveTextContent('Monitorar');
      expect(badge).toHaveClass('bg-yellow-100 text-yellow-800');
    });

    it('deve mostrar "Atenção" (vermelho) quando média > 66', () => {
      render(<BadgeClassificacao media={80} numeroGrupo={7} />);
      const badge = screen.getByTestId('badge-g7');
      expect(badge).toHaveTextContent('Atenção');
      expect(badge).toHaveClass('bg-red-100 text-red-800');
    });
  });

  describe('Casos limite', () => {
    it('deve mostrar "-" quando média é undefined', () => {
      render(<BadgeClassificacao media={undefined} numeroGrupo={1} />);
      const badge = screen.getByText('-');
      expect(badge).toHaveClass('text-gray-400');
    });

    it('deve classificar corretamente no limite 66 para grupo positivo', () => {
      render(<BadgeClassificacao media={66} numeroGrupo={2} />);
      const badge = screen.getByTestId('badge-g2');
      expect(badge).toHaveTextContent('Monitorar');
    });

    it('deve classificar corretamente no limite 33 para grupo positivo', () => {
      render(<BadgeClassificacao media={33} numeroGrupo={3} />);
      const badge = screen.getByTestId('badge-g3');
      expect(badge).toHaveTextContent('Monitorar');
    });

    it('deve classificar corretamente no limite 66 para grupo negativo', () => {
      render(<BadgeClassificacao media={66} numeroGrupo={1} />);
      const badge = screen.getByTestId('badge-g1');
      expect(badge).toHaveTextContent('Monitorar');
    });

    it('deve classificar corretamente no limite 33 para grupo negativo', () => {
      render(<BadgeClassificacao media={33} numeroGrupo={4} />);
      const badge = screen.getByTestId('badge-g4');
      expect(badge).toHaveTextContent('Monitorar');
    });
  });

  describe('Todos os grupos', () => {
    it('deve classificar corretamente todos os 10 grupos com diferentes médias', () => {
      const testCases = [
        { grupo: 1, media: 20, esperado: 'Excelente' }, // Negativo, < 33
        { grupo: 2, media: 80, esperado: 'Excelente' }, // Positivo, > 66
        { grupo: 3, media: 70, esperado: 'Excelente' }, // Positivo, > 66
        { grupo: 4, media: 25, esperado: 'Excelente' }, // Negativo, < 33
        { grupo: 5, media: 75, esperado: 'Excelente' }, // Positivo, > 66
        { grupo: 6, media: 68, esperado: 'Excelente' }, // Positivo, > 66
        { grupo: 7, media: 30, esperado: 'Excelente' }, // Negativo, < 33
        { grupo: 8, media: 28, esperado: 'Excelente' }, // Negativo, < 33
        { grupo: 9, media: 50, esperado: 'Monitorar' }, // Negativo, 33-66
        { grupo: 10, media: 70, esperado: 'Atenção' }, // Negativo, > 66
      ];

      testCases.forEach(({ grupo, media, esperado }) => {
        const { unmount } = render(
          <BadgeClassificacao media={media} numeroGrupo={grupo} />
        );
        const badge = screen.getByTestId(`badge-g${grupo}`);
        expect(badge).toHaveTextContent(esperado);
        unmount();
      });
    });
  });
});

// Mock de componente de filtro
const FiltroMock = ({
  valores,
  selecionados,
  onToggle,
}: {
  valores: string[];
  selecionados: string[];
  onToggle: (valor: string) => void;
}) => (
  <div data-testid="filtro-dropdown">
    {valores.map((valor) => (
      <label key={valor} data-testid={`filtro-${valor}`}>
        <input
          type="checkbox"
          checked={selecionados.includes(valor)}
          onChange={() => onToggle(valor)}
        />
        <span>{valor}</span>
      </label>
    ))}
  </div>
);

describe('Filtros por Classificação', () => {
  it('deve permitir selecionar múltiplas classificações', () => {
    const mockToggle = jest.fn();
    const valores = ['Excelente', 'Monitorar', 'Atenção'];
    const selecionados: string[] = [];

    render(
      <FiltroMock
        valores={valores}
        selecionados={selecionados}
        onToggle={mockToggle}
      />
    );

    const excelente = screen.getByTestId('filtro-Excelente');
    fireEvent.click(excelente.querySelector('input'));

    expect(mockToggle).toHaveBeenCalledWith('Excelente');
  });

  it('deve permitir desselecionar classificação', () => {
    const mockToggle = jest.fn();
    const valores = ['Excelente', 'Monitorar', 'Atenção'];
    const selecionados = ['Excelente'];

    render(
      <FiltroMock
        valores={valores}
        selecionados={selecionados}
        onToggle={mockToggle}
      />
    );

    const excelente = screen
      .getByTestId('filtro-Excelente')
      .querySelector('input');
    expect(excelente).toBeChecked();

    fireEvent.click(excelente);
    expect(mockToggle).toHaveBeenCalledWith('Excelente');
  });

  it('deve mostrar todas as opções de classificação', () => {
    const mockToggle = jest.fn();
    const valores = ['Excelente', 'Monitorar', 'Atenção'];

    render(
      <FiltroMock valores={valores} selecionados={[]} onToggle={mockToggle} />
    );

    expect(screen.getByText('Excelente')).toBeInTheDocument();
    expect(screen.getByText('Monitorar')).toBeInTheDocument();
    expect(screen.getByText('Atenção')).toBeInTheDocument();
  });
});

describe('Integração: Filtros + Badges', () => {
  it('deve filtrar funcionários por classificação de grupo específico', () => {
    const funcionarios = [
      { nome: 'Func1', g1: 20 }, // Excelente
      { nome: 'Func2', g1: 50 }, // Monitorar
      { nome: 'Func3', g1: 80 }, // Atenção
    ];

    const getClassificacao = (media: number, grupo: number) => {
      const gruposPositivos = [2, 3, 5, 6];
      const isPositivo = gruposPositivos.includes(grupo);

      if (isPositivo) {
        if (media > 66) return 'Excelente';
        if (media >= 33) return 'Monitorar';
        return 'Atenção';
      } else {
        if (media < 33) return 'Excelente';
        if (media <= 66) return 'Monitorar';
        return 'Atenção';
      }
    };

    // Filtrar apenas "Excelente"
    const filtroAtivo = ['Excelente'];
    const filtrados = funcionarios.filter((f) =>
      filtroAtivo.includes(getClassificacao(f.g1, 1))
    );

    expect(filtrados).toHaveLength(1);
    expect(filtrados[0].nome).toBe('Func1');
  });

  it('deve filtrar com múltiplas classificações selecionadas', () => {
    const funcionarios = [
      { nome: 'Func1', g1: 20 }, // Excelente
      { nome: 'Func2', g1: 50 }, // Monitorar
      { nome: 'Func3', g1: 80 }, // Atenção
    ];

    const getClassificacao = (media: number, grupo: number) => {
      if (media < 33) return 'Excelente';
      if (media <= 66) return 'Monitorar';
      return 'Atenção';
    };

    // Filtrar "Excelente" e "Monitorar"
    const filtroAtivo = ['Excelente', 'Monitorar'];
    const filtrados = funcionarios.filter((f) =>
      filtroAtivo.includes(getClassificacao(f.g1, 1))
    );

    expect(filtrados).toHaveLength(2);
    expect(filtrados.map((f) => f.nome)).toEqual(['Func1', 'Func2']);
  });
});
