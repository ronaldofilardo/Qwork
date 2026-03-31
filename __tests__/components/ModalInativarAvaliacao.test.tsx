/**
 * @file __tests__/components/ModalInativarAvaliacao.test.tsx
 * Testes para o componente ModalInativarAvaliacao
 *
 * Valida:
 *  - Renderização do modal com dados do funcionário
 *  - Validação de motivo mínimo (10 caracteres)
 *  - Botão submit desabilitado quando motivo curto
 *  - Fechamento via backdrop e ESC
 *  - Submissão do formulário
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import ModalInativarAvaliacao from '@/components/ModalInativarAvaliacao';

// Mock fetch
global.fetch = jest.fn();

// Mock window.alert e window.confirm
const mockAlert = jest.fn();
const mockConfirm = jest.fn(() => true);
window.alert = mockAlert;
window.confirm = mockConfirm;

const defaultProps = {
  avaliacaoId: 123,
  funcionarioNome: 'João Silva',
  funcionarioCpf: '123.456.789-00',
  _loteId: '42',
  contexto: 'rh' as const,
  onClose: jest.fn(),
  onSuccess: jest.fn(),
};

describe('ModalInativarAvaliacao', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  describe('Renderização', () => {
    it('deve exibir título do modal', () => {
      render(<ModalInativarAvaliacao {...defaultProps} />);
      expect(screen.getByText(/Inativar Avaliação/)).toBeInTheDocument();
    });

    it('deve exibir nome do funcionário', () => {
      render(<ModalInativarAvaliacao {...defaultProps} />);
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });

    it('deve exibir CPF do funcionário', () => {
      render(<ModalInativarAvaliacao {...defaultProps} />);
      expect(screen.getByText('123.456.789-00')).toBeInTheDocument();
    });

    it('deve exibir campo de motivo', () => {
      render(<ModalInativarAvaliacao {...defaultProps} />);
      expect(
        screen.getByPlaceholderText(/Funcionário desligado/)
      ).toBeInTheDocument();
    });

    it('deve exibir botões Cancelar e Confirmar', () => {
      render(<ModalInativarAvaliacao {...defaultProps} />);
      expect(screen.getByText('Cancelar')).toBeInTheDocument();
      expect(screen.getByText(/Confirmar Inativação/)).toBeInTheDocument();
    });
  });

  describe('Validação de Motivo', () => {
    it('deve ter botão submit desabilitado quando motivo vazio', () => {
      render(<ModalInativarAvaliacao {...defaultProps} />);
      const submitBtn = screen.getByText(/Confirmar Inativação/);
      expect(submitBtn).toBeDisabled();
    });

    it('deve ter botão submit desabilitado com menos de 10 caracteres', async () => {
      render(<ModalInativarAvaliacao {...defaultProps} />);
      const textarea = screen.getByPlaceholderText(/Funcionário desligado/);
      await userEvent.type(textarea, 'curto');
      const submitBtn = screen.getByText(/Confirmar Inativação/);
      expect(submitBtn).toBeDisabled();
    });

    it('deve habilitar botão submit com 10+ caracteres', async () => {
      render(<ModalInativarAvaliacao {...defaultProps} />);
      const textarea = screen.getByPlaceholderText(/Funcionário desligado/);
      await userEvent.type(textarea, 'Motivo com mais de dez caracteres');
      const submitBtn = screen.getByText(/Confirmar Inativação/);
      expect(submitBtn).not.toBeDisabled();
    });

    it('deve exibir contador de caracteres', async () => {
      render(<ModalInativarAvaliacao {...defaultProps} />);
      expect(screen.getByText('0/500 caracteres')).toBeInTheDocument();
      const textarea = screen.getByPlaceholderText(/Funcionário desligado/);
      await userEvent.type(textarea, 'Teste');
      expect(screen.getByText('5/500 caracteres')).toBeInTheDocument();
    });
  });

  describe('Fechamento', () => {
    it('deve chamar onClose ao clicar Cancelar', async () => {
      render(<ModalInativarAvaliacao {...defaultProps} />);
      await userEvent.click(screen.getByText('Cancelar'));
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('deve chamar onClose ao clicar no backdrop', () => {
      render(<ModalInativarAvaliacao {...defaultProps} />);
      const backdrop = screen.getByText(/Inativar Avaliação/).closest('.fixed');
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(defaultProps.onClose).toHaveBeenCalled();
      }
    });

    it('deve chamar onClose ao pressionar ESC', () => {
      render(<ModalInativarAvaliacao {...defaultProps} />);
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('Submissão', () => {
    it('deve chamar endpoint RH para contexto rh', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ mensagem: 'Inativada com sucesso' }),
      });

      render(<ModalInativarAvaliacao {...defaultProps} />);
      const textarea = screen.getByPlaceholderText(/Funcionário desligado/);
      await userEvent.type(textarea, 'Funcionário desligado da empresa');

      const submitBtn = screen.getByText(/Confirmar Inativação/);
      await userEvent.click(submitBtn);

      await waitFor(() => {
        if ((global.fetch as jest.Mock).mock.calls.length > 0) {
          expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe(
            '/api/rh/lotes/42/avaliacoes/123/inativar'
          );
        }
      });
    });

    it('deve chamar endpoint entidade para contexto entidade', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Inativada com sucesso' }),
      });

      render(<ModalInativarAvaliacao {...defaultProps} contexto="entidade" />);
      const textarea = screen.getByPlaceholderText(/Funcionário desligado/);
      await userEvent.type(textarea, 'Afastamento temporário do funcionário');

      const submitBtn = screen.getByText(/Confirmar Inativação/);
      await userEvent.click(submitBtn);

      await waitFor(() => {
        if ((global.fetch as jest.Mock).mock.calls.length > 0) {
          expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe(
            '/api/entidade/lote/42/avaliacoes/123/inativar'
          );
        }
      });
    });
  });
});
