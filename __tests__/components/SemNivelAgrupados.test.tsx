/**
 * @file __tests__/components/SemNivelAgrupados.test.tsx
 *
 * Testes para o componente SemNivelAgrupados (step 4 — Níveis da importação em massa).
 *
 * Cobre:
 *  - Fallback (sem dados de empresa): renderiza botões G/O pequenos por função
 *  - Grouped (com empresa): renderiza botões G/O pequenos no header de cada função
 *  - Não renderiza botões legados full-width ("G — Gestão" / "O — Operacional")
 *  - Toggle: clicar G seleciona 'gestao'; clicar novamente deseleciona ('')
 *  - Toggle: clicar O seleciona 'operacional'; clicar novamente deseleciona ('')
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import SemNivelAgrupados from '@/components/importacao/SemNivelAgrupados';
import type { FuncaoNivelInfo, NivelCargo } from '@/components/importacao/NivelCargoStep';

jest.mock('lucide-react', () => {
  const MockIcon = ({ size, className }: { size?: number; className?: string }) => (
    <svg data-testid="mock-icon" style={{ width: size, height: size }} className={className} />
  );
  return new Proxy({}, { get: () => MockIcon });
});

// ─── Fixtures ────────────────────────────────────────────────────────────────

/** Função sem dados de empresa → cai no fallback flat */
const funcaoSemEmpresa: FuncaoNivelInfo = {
  funcao: 'Operador',
  qtdFuncionarios: 2,
  qtdNovos: 2,
  qtdExistentes: 0,
  isMudancaRole: false,
  isMudancaNivel: false,
  niveisAtuais: [],
  qtdSemNivelNaPlanilha: 2,
  // sem funcionariosSemNivel → grouped ficará vazio → fallback renderiza
};

/** Função com dados de empresa → grouped branch */
const funcaoComEmpresa: FuncaoNivelInfo = {
  funcao: 'Técnico',
  qtdFuncionarios: 1,
  qtdNovos: 1,
  qtdExistentes: 0,
  isMudancaRole: false,
  isMudancaNivel: false,
  niveisAtuais: [],
  qtdSemNivelNaPlanilha: 1,
  funcionariosSemNivel: [
    { nome: 'Lara Monteiro', empresa: 'Empresa ABC' },
  ],
};

function buildProps(
  funcoes: FuncaoNivelInfo[],
  nivelCargoMap: Record<string, NivelCargo> = {},
  onChange = jest.fn()
) {
  return { funcoesNivelInfo: funcoes, nivelCargoMap, onChange };
}

// ─── Testes ──────────────────────────────────────────────────────────────────

describe('SemNivelAgrupados — fallback (sem empresa)', () => {
  it('renderiza botão "G" por função no fallback', () => {
    render(<SemNivelAgrupados {...buildProps([funcaoSemEmpresa])} />);
    expect(screen.getAllByRole('button', { name: 'G' }).length).toBeGreaterThanOrEqual(1);
  });

  it('renderiza botão "O" por função no fallback', () => {
    render(<SemNivelAgrupados {...buildProps([funcaoSemEmpresa])} />);
    expect(screen.getAllByRole('button', { name: 'O' }).length).toBeGreaterThanOrEqual(1);
  });

  it('NÃO renderiza botão legado "G — Gestão" no fallback', () => {
    render(<SemNivelAgrupados {...buildProps([funcaoSemEmpresa])} />);
    expect(screen.queryByText('G — Gestão')).not.toBeInTheDocument();
  });

  it('NÃO renderiza botão legado "O — Operacional" no fallback', () => {
    render(<SemNivelAgrupados {...buildProps([funcaoSemEmpresa])} />);
    expect(screen.queryByText('O — Operacional')).not.toBeInTheDocument();
  });

  it('NÃO renderiza texto "Qual nível para" no fallback', () => {
    render(<SemNivelAgrupados {...buildProps([funcaoSemEmpresa])} />);
    expect(screen.queryByText(/Qual nível para/i)).not.toBeInTheDocument();
  });

  describe('toggle fallback', () => {
    it('chama onChange com "gestao" ao clicar G (não selecionado)', () => {
      const onChange = jest.fn();
      render(<SemNivelAgrupados {...buildProps([funcaoSemEmpresa], {}, onChange)} />);
      fireEvent.click(screen.getAllByRole('button', { name: 'G' })[0]);
      expect(onChange).toHaveBeenCalledWith('Operador', 'gestao');
    });

    it('chama onChange com "" ao clicar G (já selecionado)', () => {
      const onChange = jest.fn();
      render(
        <SemNivelAgrupados
          {...buildProps([funcaoSemEmpresa], { Operador: 'gestao' }, onChange)}
        />
      );
      fireEvent.click(screen.getAllByRole('button', { name: 'G' })[0]);
      expect(onChange).toHaveBeenCalledWith('Operador', '');
    });

    it('chama onChange com "operacional" ao clicar O (não selecionado)', () => {
      const onChange = jest.fn();
      render(<SemNivelAgrupados {...buildProps([funcaoSemEmpresa], {}, onChange)} />);
      fireEvent.click(screen.getAllByRole('button', { name: 'O' })[0]);
      expect(onChange).toHaveBeenCalledWith('Operador', 'operacional');
    });

    it('chama onChange com "" ao clicar O (já selecionado)', () => {
      const onChange = jest.fn();
      render(
        <SemNivelAgrupados
          {...buildProps([funcaoSemEmpresa], { Operador: 'operacional' }, onChange)}
        />
      );
      fireEvent.click(screen.getAllByRole('button', { name: 'O' })[0]);
      expect(onChange).toHaveBeenCalledWith('Operador', '');
    });
  });
});

describe('SemNivelAgrupados — grouped (com empresa)', () => {
  it('exibe o nome da empresa como cabeçalho', () => {
    render(<SemNivelAgrupados {...buildProps([funcaoComEmpresa])} />);
    expect(screen.getByText('Empresa ABC')).toBeInTheDocument();
  });

  it('exibe o nome da função ("Técnico")', () => {
    render(<SemNivelAgrupados {...buildProps([funcaoComEmpresa])} />);
    expect(screen.getByText('Técnico')).toBeInTheDocument();
  });

  it('renderiza botão "G" no header da função (grouped)', () => {
    render(<SemNivelAgrupados {...buildProps([funcaoComEmpresa])} />);
    expect(screen.getAllByRole('button', { name: 'G' }).length).toBeGreaterThanOrEqual(1);
  });

  it('renderiza botão "O" no header da função (grouped)', () => {
    render(<SemNivelAgrupados {...buildProps([funcaoComEmpresa])} />);
    expect(screen.getAllByRole('button', { name: 'O' }).length).toBeGreaterThanOrEqual(1);
  });

  it('NÃO renderiza botão legado "G — Gestão" no grouped', () => {
    render(<SemNivelAgrupados {...buildProps([funcaoComEmpresa])} />);
    expect(screen.queryByText('G — Gestão')).not.toBeInTheDocument();
  });

  it('NÃO renderiza botão legado "O — Operacional" no grouped', () => {
    render(<SemNivelAgrupados {...buildProps([funcaoComEmpresa])} />);
    expect(screen.queryByText('O — Operacional')).not.toBeInTheDocument();
  });

  it('NÃO renderiza texto "Qual nível para" no grouped', () => {
    render(<SemNivelAgrupados {...buildProps([funcaoComEmpresa])} />);
    expect(screen.queryByText(/Qual nível para/i)).not.toBeInTheDocument();
  });

  it('exibe nome do funcionário como tag', () => {
    render(<SemNivelAgrupados {...buildProps([funcaoComEmpresa])} />);
    expect(screen.getByText('Lara Monteiro')).toBeInTheDocument();
  });

  describe('toggle grouped', () => {
    it('chama onChange com "gestao" ao clicar G (não selecionado)', () => {
      const onChange = jest.fn();
      render(<SemNivelAgrupados {...buildProps([funcaoComEmpresa], {}, onChange)} />);
      fireEvent.click(screen.getAllByRole('button', { name: 'G' })[0]);
      expect(onChange).toHaveBeenCalledWith('Técnico', 'gestao');
    });

    it('chama onChange com "" ao clicar G (já selecionado)', () => {
      const onChange = jest.fn();
      render(
        <SemNivelAgrupados
          {...buildProps([funcaoComEmpresa], { Técnico: 'gestao' }, onChange)}
        />
      );
      fireEvent.click(screen.getAllByRole('button', { name: 'G' })[0]);
      expect(onChange).toHaveBeenCalledWith('Técnico', '');
    });
  });

  describe('estado visual dos botões (grouped)', () => {
    it('botão G tem bg-purple-600 quando nivel=gestao', () => {
      render(
        <SemNivelAgrupados
          {...buildProps([funcaoComEmpresa], { Técnico: 'gestao' })}
        />
      );
      const gButton = screen.getAllByRole('button', { name: 'G' })[0];
      expect(gButton.className).toMatch(/bg-purple-600/);
    });

    it('botão O tem bg-blue-600 quando nivel=operacional', () => {
      render(
        <SemNivelAgrupados
          {...buildProps([funcaoComEmpresa], { Técnico: 'operacional' })}
        />
      );
      const oButton = screen.getAllByRole('button', { name: 'O' })[0];
      expect(oButton.className).toMatch(/bg-blue-600/);
    });
  });
});
