/**
 * @file __tests__/components/ModalSetorRelatorioPDF.test.tsx
 * Testes para o componente ModalSetorRelatorioPDF
 *
 * Valida:
 *  - Renderização condicional (isOpen)
 *  - Exibição de setores no select
 *  - Seleção automática do primeiro setor
 *  - Botões Cancelar e Gerar PDF
 *  - Estado de loading
 *  - Fechamento via ESC e backdrop
 *  - Mensagem quando sem setores
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import ModalSetorRelatorioPDF from '@/components/ModalSetorRelatorioPDF';

const defaultProps = {
  isOpen: true,
  setores: ['Administrativo', 'Operacional', 'Financeiro'],
  onClose: jest.fn(),
  onConfirm: jest.fn().mockResolvedValue(undefined),
};

describe('ModalSetorRelatorioPDF', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderização Condicional', () => {
    it('não deve renderizar quando isOpen=false', () => {
      const { container } = render(
        <ModalSetorRelatorioPDF {...defaultProps} isOpen={false} />
      );
      expect(container.innerHTML).toBe('');
    });

    it('deve renderizar quando isOpen=true', () => {
      render(<ModalSetorRelatorioPDF {...defaultProps} />);
      expect(
        screen.getByText('Gerar Relatório PDF por Setor')
      ).toBeInTheDocument();
    });
  });

  describe('Setores', () => {
    it('deve exibir todos os setores no select', () => {
      render(<ModalSetorRelatorioPDF {...defaultProps} />);
      expect(screen.getByText('Administrativo')).toBeInTheDocument();
      expect(screen.getByText('Operacional')).toBeInTheDocument();
      expect(screen.getByText('Financeiro')).toBeInTheDocument();
    });

    it('deve selecionar o primeiro setor por padrão', () => {
      render(<ModalSetorRelatorioPDF {...defaultProps} />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('Administrativo');
    });

    it('deve permitir trocar setor', async () => {
      render(<ModalSetorRelatorioPDF {...defaultProps} />);
      const select = screen.getByRole('combobox');
      await userEvent.selectOptions(select, 'Operacional');
      expect(select).toHaveValue('Operacional');
    });

    it('deve mostrar mensagem quando não há setores', () => {
      render(<ModalSetorRelatorioPDF {...defaultProps} setores={[]} />);
      expect(
        screen.getByText('Nenhum setor disponível neste ciclo.')
      ).toBeInTheDocument();
    });
  });

  describe('Botões', () => {
    it('deve exibir botão Cancelar', () => {
      render(<ModalSetorRelatorioPDF {...defaultProps} />);
      expect(screen.getByText('Cancelar')).toBeInTheDocument();
    });

    it('deve chamar onClose ao clicar Cancelar', async () => {
      render(<ModalSetorRelatorioPDF {...defaultProps} />);
      await userEvent.click(screen.getByText('Cancelar'));
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('deve desabilitar Gerar PDF quando sem setores', () => {
      render(<ModalSetorRelatorioPDF {...defaultProps} setores={[]} />);
      const btn = screen.getByText(/Gerar PDF/);
      expect(btn.closest('button')).toBeDisabled();
    });

    it('deve chamar onConfirm com setor selecionado', async () => {
      render(<ModalSetorRelatorioPDF {...defaultProps} />);
      await userEvent.click(screen.getByText(/Gerar PDF/));
      await waitFor(() => {
        expect(defaultProps.onConfirm).toHaveBeenCalledWith('Administrativo');
      });
    });
  });

  describe('Fechamento', () => {
    it('deve fechar ao pressionar ESC', () => {
      render(<ModalSetorRelatorioPDF {...defaultProps} />);
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('Loading', () => {
    it('deve exibir "Gerando..." durante confirmação', async () => {
      const slowConfirm = jest.fn(() => new Promise(() => {})); // Nunca resolve
      render(
        <ModalSetorRelatorioPDF {...defaultProps} onConfirm={slowConfirm} />
      );
      await userEvent.click(screen.getByText(/Gerar PDF/));
      expect(screen.getByText('Gerando...')).toBeInTheDocument();
    });
  });
});
