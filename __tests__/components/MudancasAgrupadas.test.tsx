/**
 * @file __tests__/components/MudancasAgrupadas.test.tsx
 *
 * Testes para o componente MudancasAgrupadas (step 4 — Níveis da importação em massa).
 *
 * Cobre:
 *  - Renderiza botões G/O pequenos (w-8 h-8) no header de cada função
 *  - Não renderiza os botões legados full-width ("G — Gestão" / "O — Operacional")
 *  - Toggle: clicar G seleciona 'gestao'; clicar novamente deseleciona ('')
 *  - Toggle: clicar O seleciona 'operacional'; clicar novamente deseleciona ('')
 *  - Retorna null quando não há funções com mudança
 *  - Exibe banner de alerta "Mudanças de função detectadas"
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import MudancasAgrupadas from '@/components/importacao/MudancasAgrupadas';
import type { FuncaoNivelInfo, NivelCargo } from '@/components/importacao/NivelCargoStep';

jest.mock('lucide-react', () => {
  const MockIcon = ({ size, className }: { size?: number; className?: string }) => (
    <svg data-testid="mock-icon" style={{ width: size, height: size }} className={className} />
  );
  return new Proxy({}, { get: () => MockIcon });
});

// ─── Fixtures ────────────────────────────────────────────────────────────────

const funcaoComTroca: FuncaoNivelInfo = {
  funcao: 'Contador',
  qtdFuncionarios: 1,
  qtdNovos: 0,
  qtdExistentes: 1,
  isMudancaRole: true,
  isMudancaNivel: false,
  niveisAtuais: ['gestao'],
  funcionariosComMudanca: [
    { nome: 'Jorge Campos', funcaoAnterior: 'Analista', nivelAtual: 'gestao' },
  ],
};

const funcaoComTrocaNivel: FuncaoNivelInfo = {
  funcao: 'Gerente',
  qtdFuncionarios: 1,
  qtdNovos: 0,
  qtdExistentes: 1,
  isMudancaRole: false,
  isMudancaNivel: true,
  niveisAtuais: ['operacional'],
  funcionariosComMudancaNivel: [
    { nome: 'Ana Lima', nivelAtual: 'operacional', nivelProposto: 'gestao' },
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

describe('MudancasAgrupadas', () => {
  describe('quando não há funções com mudança', () => {
    it('retorna null (nada renderizado)', () => {
      const { container } = render(
        <MudancasAgrupadas {...buildProps([])} />
      );
      expect(container).toBeEmptyDOMElement();
    });

    it('retorna null quando funcoesNivelInfo não tem isMudancaRole/isMudancaNivel', () => {
      const funcaoSemMudanca: FuncaoNivelInfo = {
        funcao: 'Técnico',
        qtdFuncionarios: 2,
        qtdNovos: 2,
        qtdExistentes: 0,
        isMudancaRole: false,
        isMudancaNivel: false,
        niveisAtuais: [],
      };
      const { container } = render(
        <MudancasAgrupadas {...buildProps([funcaoSemMudanca])} />
      );
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('quando há mudanças de função', () => {
    it('exibe banner "Mudanças de função detectadas"', () => {
      render(<MudancasAgrupadas {...buildProps([funcaoComTroca])} />);
      expect(screen.getByText('Mudanças de função detectadas')).toBeInTheDocument();
    });

    it('exibe o nome da função ("Contador")', () => {
      render(<MudancasAgrupadas {...buildProps([funcaoComTroca])} />);
      expect(screen.getByText('Contador')).toBeInTheDocument();
    });

    it('renderiza botão "G" pequeno por função', () => {
      render(<MudancasAgrupadas {...buildProps([funcaoComTroca])} />);
      const gButtons = screen.getAllByRole('button', { name: 'G' });
      expect(gButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('renderiza botão "O" pequeno por função', () => {
      render(<MudancasAgrupadas {...buildProps([funcaoComTroca])} />);
      const oButtons = screen.getAllByRole('button', { name: 'O' });
      expect(oButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('NÃO renderiza botão legado "G — Gestão"', () => {
      render(<MudancasAgrupadas {...buildProps([funcaoComTroca])} />);
      expect(screen.queryByText('G — Gestão')).not.toBeInTheDocument();
    });

    it('NÃO renderiza botão legado "O — Operacional"', () => {
      render(<MudancasAgrupadas {...buildProps([funcaoComTroca])} />);
      expect(screen.queryByText('O — Operacional')).not.toBeInTheDocument();
    });

    it('NÃO renderiza texto "Qual nível para" (prompt legado removido)', () => {
      render(<MudancasAgrupadas {...buildProps([funcaoComTroca])} />);
      expect(screen.queryByText(/Qual nível para/i)).not.toBeInTheDocument();
    });
  });

  describe('toggle G/O', () => {
    it('chama onChange com "gestao" ao clicar G quando não selecionado', () => {
      const onChange = jest.fn();
      render(
        <MudancasAgrupadas
          {...buildProps([funcaoComTroca], {}, onChange)}
        />
      );
      const gButton = screen.getAllByRole('button', { name: 'G' })[0];
      fireEvent.click(gButton);
      expect(onChange).toHaveBeenCalledWith('Contador', 'gestao');
    });

    it('chama onChange com "" (deselect) ao clicar G quando já selecionado', () => {
      const onChange = jest.fn();
      render(
        <MudancasAgrupadas
          {...buildProps([funcaoComTroca], { Contador: 'gestao' }, onChange)}
        />
      );
      const gButton = screen.getAllByRole('button', { name: 'G' })[0];
      fireEvent.click(gButton);
      expect(onChange).toHaveBeenCalledWith('Contador', '');
    });

    it('chama onChange com "operacional" ao clicar O quando não selecionado', () => {
      const onChange = jest.fn();
      render(
        <MudancasAgrupadas
          {...buildProps([funcaoComTroca], {}, onChange)}
        />
      );
      const oButton = screen.getAllByRole('button', { name: 'O' })[0];
      fireEvent.click(oButton);
      expect(onChange).toHaveBeenCalledWith('Contador', 'operacional');
    });

    it('chama onChange com "" (deselect) ao clicar O quando já selecionado', () => {
      const onChange = jest.fn();
      render(
        <MudancasAgrupadas
          {...buildProps([funcaoComTroca], { Contador: 'operacional' }, onChange)}
        />
      );
      const oButton = screen.getAllByRole('button', { name: 'O' })[0];
      fireEvent.click(oButton);
      expect(onChange).toHaveBeenCalledWith('Contador', '');
    });
  });

  describe('estado visual dos botões', () => {
    it('botão G tem classe bg-purple-600 quando nivel=gestao', () => {
      render(
        <MudancasAgrupadas
          {...buildProps([funcaoComTroca], { Contador: 'gestao' })}
        />
      );
      const gButton = screen.getAllByRole('button', { name: 'G' })[0];
      expect(gButton.className).toMatch(/bg-purple-600/);
    });

    it('botão O tem classe bg-blue-600 quando nivel=operacional', () => {
      render(
        <MudancasAgrupadas
          {...buildProps([funcaoComTroca], { Contador: 'operacional' })}
        />
      );
      const oButton = screen.getAllByRole('button', { name: 'O' })[0];
      expect(oButton.className).toMatch(/bg-blue-600/);
    });

    it('botão G não tem bg-purple-600 quando não selecionado', () => {
      render(<MudancasAgrupadas {...buildProps([funcaoComTroca], {})} />);
      const gButton = screen.getAllByRole('button', { name: 'G' })[0];
      expect(gButton.className).not.toMatch(/bg-purple-600/);
    });
  });

  describe('múltiplas funções', () => {
    it('renderiza botões G/O para cada função', () => {
      render(
        <MudancasAgrupadas
          {...buildProps([funcaoComTroca, funcaoComTrocaNivel])}
        />
      );
      // 2 funções → pelo menos 2 botões G e 2 botões O
      const gButtons = screen.getAllByRole('button', { name: 'G' });
      const oButtons = screen.getAllByRole('button', { name: 'O' });
      expect(gButtons.length).toBeGreaterThanOrEqual(2);
      expect(oButtons.length).toBeGreaterThanOrEqual(2);
    });
  });
});
