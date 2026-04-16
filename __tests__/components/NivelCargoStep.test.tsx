/**
 * @file __tests__/components/NivelCargoStep.test.tsx
 * Testes para o componente NivelCargoStep
 *
 * Cobre:
 *  - SkipScreen quando temNivelCargoDirecto=true e sem mudanças e sem células vazias
 *  - SkipScreen NÃO aparece quando há funções com qtdSemNivelNaPlanilha>0
 *  - Banner âmbar aparece quando há funcionários sem nivel_cargo na planilha
 *  - Banner âmbar NÃO aparece quando todos têm nivel_cargo válido
 *  - Badge "X sem nível" aparece por função com qtdSemNivelNaPlanilha>0
 *  - Funções sem pendência ficam ocultas quando temNivelCargoDirecto=true
 *  - Blocker aparece enquanto há funções não classificadas
 *  - Botão "Confirmar" é habilitado após classificar todas as funções pendentes
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import NivelCargoStep, {
  type FuncaoNivelInfo,
  type NivelCargo,
} from '@/components/importacao/NivelCargoStep';

// Lucide icons mock leve — evita falha de render em ambiente jest
jest.mock('lucide-react', () => {
  const MockIcon = ({ size, className }: { size?: number; className?: string }) => (
    <svg data-testid="mock-icon" width={size} height={size} className={className} />
  );
  return new Proxy({}, { get: () => MockIcon });
});

function makeFuncao(overrides: Partial<FuncaoNivelInfo> = {}): FuncaoNivelInfo {
  return {
    funcao: 'Analista',
    qtdFuncionarios: 1,
    qtdNovos: 1,
    qtdExistentes: 0,
    niveisAtuais: [],
    isMudancaRole: false,
    temNivelNuloExistente: false,
    qtdSemNivelNaPlanilha: 0,
    ...overrides,
  };
}

interface Props {
  funcoesNivelInfo?: FuncaoNivelInfo[];
  nivelCargoMap?: Record<string, NivelCargo>;
  onChange?: jest.Mock;
  onConfirm?: jest.Mock;
  onBack?: jest.Mock;
  temNivelCargoDirecto?: boolean;
  isLoading?: boolean;
}

function renderStep(overrides: Props = {}) {
  const props = {
    funcoesNivelInfo: overrides.funcoesNivelInfo ?? [makeFuncao()],
    nivelCargoMap: overrides.nivelCargoMap ?? {},
    onChange: overrides.onChange ?? jest.fn(),
    onConfirm: overrides.onConfirm ?? jest.fn(),
    onBack: overrides.onBack ?? jest.fn(),
    temNivelCargoDirecto: overrides.temNivelCargoDirecto ?? false,
    isLoading: overrides.isLoading ?? false,
  };
  return render(<NivelCargoStep {...props} />);
}

describe('NivelCargoStep', () => {
  describe('SkipScreen (temNivelCargoDirecto=true, sem pendências)', () => {
    it('exibe SkipScreen quando todos têm nivel_cargo válido e sem mudanças', () => {
      // Todas as funções têm qtdSemNivelNaPlanilha=0 e sem isMudancaRole/isMudancaNivel
      renderStep({
        funcoesNivelInfo: [
          makeFuncao({ funcao: 'Analista', qtdSemNivelNaPlanilha: 0 }),
        ],
        temNivelCargoDirecto: true,
      });

      // SkipScreen mostra "automático" ou "coluna nivel_cargo"
      expect(screen.getByText(/nivel_cargo/i)).toBeInTheDocument();
    });

    it('NÃO exibe SkipScreen quando há funções com qtdSemNivelNaPlanilha>0', () => {
      renderStep({
        funcoesNivelInfo: [
          makeFuncao({ funcao: 'Estagiário', qtdSemNivelNaPlanilha: 1 }),
        ],
        temNivelCargoDirecto: true,
      });

      // Deve mostrar o header da tabela, não a tela de skip
      expect(screen.getByText('Classificar Nível de Cargo')).toBeInTheDocument();
    });

    it('exibe tela de mudanças (não a tabela principal) quando isMudancaRole=true e temNivelCargoDirecto=true', () => {
      // Quando temNivelCargoDirecto=true e há funções em mudancasNaoConfirmadas,
      // o componente exibe a tela 2 ("Nível de cargo mapeado + Alterações detectadas")
      renderStep({
        funcoesNivelInfo: [
          makeFuncao({ funcao: 'Analista', isMudancaRole: true, qtdSemNivelNaPlanilha: 0 }),
        ],
        temNivelCargoDirecto: true,
        nivelCargoMap: {},
      });

      expect(
        screen.getByText(/Nível de cargo mapeado \+ Alterações detectadas/i)
      ).toBeInTheDocument();
    });
  });

  describe('Banner âmbar de células vazias', () => {
    it('exibe banner quando temNivelCargoDirecto=true e há funções com qtdSemNivelNaPlanilha>0', () => {
      renderStep({
        funcoesNivelInfo: [
          makeFuncao({ funcao: 'Estagiário', qtdSemNivelNaPlanilha: 1 }),
        ],
        temNivelCargoDirecto: true,
      });

      expect(
        screen.getByText('Funcionários sem nível de cargo na planilha')
      ).toBeInTheDocument();
    });

    it('exibe contagem correta de funcionários sem nível no banner', () => {
      renderStep({
        funcoesNivelInfo: [
          makeFuncao({ funcao: 'Estagiário', qtdSemNivelNaPlanilha: 2 }),
          makeFuncao({ funcao: 'Desenvolvedor', qtdSemNivelNaPlanilha: 1 }),
        ],
        temNivelCargoDirecto: true,
      });

      // Total = 3 funcionários sem nível
      expect(screen.getByText(/3/)).toBeInTheDocument();
    });

    it('NÃO exibe banner quando todos têm nivel_cargo válido', () => {
      renderStep({
        funcoesNivelInfo: [
          makeFuncao({ funcao: 'Analista', qtdSemNivelNaPlanilha: 0 }),
          makeFuncao({ funcao: 'Gerente', qtdSemNivelNaPlanilha: 0 }),
        ],
        temNivelCargoDirecto: true,
      });

      expect(
        screen.queryByText('Funcionários sem nível de cargo na planilha')
      ).not.toBeInTheDocument();
    });

    it('NÃO exibe banner quando temNivelCargoDirecto=false', () => {
      renderStep({
        funcoesNivelInfo: [
          makeFuncao({ funcao: 'Analista', qtdSemNivelNaPlanilha: 1 }),
        ],
        temNivelCargoDirecto: false,
      });

      expect(
        screen.queryByText('Funcionários sem nível de cargo na planilha')
      ).not.toBeInTheDocument();
    });
  });

  describe('Badge "sem nível" por função', () => {
    it('exibe badge "X sem nível" para função com qtdSemNivelNaPlanilha>0', () => {
      renderStep({
        funcoesNivelInfo: [
          makeFuncao({ funcao: 'Estagiário', qtdSemNivelNaPlanilha: 2 }),
        ],
        temNivelCargoDirecto: true,
      });

      expect(screen.getByText('2 sem nível')).toBeInTheDocument();
    });

    it('NÃO exibe badge "sem nível" quando qtdSemNivelNaPlanilha=0', () => {
      renderStep({
        funcoesNivelInfo: [
          makeFuncao({ funcao: 'Analista', qtdSemNivelNaPlanilha: 0 }),
        ],
        temNivelCargoDirecto: true,
      });

      expect(screen.queryByText(/sem nível/)).not.toBeInTheDocument();
    });
  });

  describe('Ocultação de funções sem pendência (temNivelCargoDirecto=true)', () => {
    it('oculta funções com qtdSemNivelNaPlanilha=0 quando temNivelCargoDirecto=true', () => {
      renderStep({
        funcoesNivelInfo: [
          makeFuncao({ funcao: 'Analista', qtdSemNivelNaPlanilha: 0 }),
          makeFuncao({ funcao: 'Estagiário', qtdSemNivelNaPlanilha: 1 }),
        ],
        temNivelCargoDirecto: true,
      });

      // Apenas Estagiário deve aparecer na tabela
      expect(screen.getByText('Estagiário')).toBeInTheDocument();
      expect(screen.queryByText('Analista')).not.toBeInTheDocument();
    });

    it('exibe todas as funções quando temNivelCargoDirecto=false', () => {
      renderStep({
        funcoesNivelInfo: [
          makeFuncao({ funcao: 'Analista', qtdSemNivelNaPlanilha: 0 }),
          makeFuncao({ funcao: 'Gerente', qtdSemNivelNaPlanilha: 0 }),
        ],
        temNivelCargoDirecto: false,
        nivelCargoMap: {},
      });

      expect(screen.getByText('Analista')).toBeInTheDocument();
      expect(screen.getByText('Gerente')).toBeInTheDocument();
    });
  });

  describe('Blocker e habilitação do botão Confirmar', () => {
    it('exibe blocker com mensagem específica quando temNivelCargoDirecto=true e há pendências', () => {
      renderStep({
        funcoesNivelInfo: [
          makeFuncao({ funcao: 'Estagiário', qtdSemNivelNaPlanilha: 1 }),
        ],
        temNivelCargoDirecto: true,
        nivelCargoMap: {},
      });

      expect(
        screen.getByText(/sem nível na planilha antes de prosseguir/i)
      ).toBeInTheDocument();
    });

    it('botão Confirmar está desabilitado enquanto há funções não classificadas', () => {
      renderStep({
        funcoesNivelInfo: [
          makeFuncao({ funcao: 'Estagiário', qtdSemNivelNaPlanilha: 1 }),
        ],
        temNivelCargoDirecto: true,
        nivelCargoMap: {},
      });

      const btn = screen.getByRole('button', { name: /confirmar/i });
      expect(btn).toBeDisabled();
    });

    it('botão Confirmar é habilitado após classificar todas as funções pendentes', () => {
      renderStep({
        funcoesNivelInfo: [
          makeFuncao({ funcao: 'Estagiário', qtdSemNivelNaPlanilha: 1 }),
        ],
        temNivelCargoDirecto: true,
        nivelCargoMap: { Estagiário: 'operacional' },
      });

      const btn = screen.getByRole('button', { name: /confirmar/i });
      expect(btn).not.toBeDisabled();
    });

    it('não exibe blocker quando todas as funções estão classificadas', () => {
      renderStep({
        funcoesNivelInfo: [
          makeFuncao({ funcao: 'Estagiário', qtdSemNivelNaPlanilha: 1 }),
        ],
        temNivelCargoDirecto: true,
        nivelCargoMap: { Estagiário: 'gestao' },
      });

      expect(
        screen.queryByText(/sem nível na planilha antes de prosseguir/i)
      ).not.toBeInTheDocument();
    });
  });
});
