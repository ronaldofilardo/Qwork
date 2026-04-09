/**
 * Testes de UI para ModalResetarSenha
 *
 * Valida o modal de geração de link de reset de senha pelo admin.
 * Fase 1: input de CPF → Fase 2: exibição de resultado com link
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ModalResetarSenha } from '@/components/admin/ModalResetarSenha';

// Mock do fetch global
global.fetch = jest.fn();

describe('ModalResetarSenha', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  describe('Renderização', () => {
    it('não deve renderizar quando isOpen é false', () => {
      render(<ModalResetarSenha isOpen={false} onClose={mockOnClose} />);
      expect(screen.queryByText(/Resetar Senha/i)).not.toBeInTheDocument();
    });

    it('deve renderizar o modal quando isOpen é true', () => {
      render(<ModalResetarSenha isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByText(/Resetar Senha/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/000\.000\.000-00/i)).toBeInTheDocument();
    });
  });

  describe('Formatação de CPF', () => {
    it('deve aplicar máscara ao digitar CPF', () => {
      render(<ModalResetarSenha isOpen={true} onClose={mockOnClose} />);

      const input = screen.getByPlaceholderText(/000\.000\.000-00/i);
      fireEvent.change(input, { target: { value: '12345678909' } });

      expect((input as HTMLInputElement).value).toBe('123.456.789-09');
    });
  });

  describe('Validação antes de submeter', () => {
    it('deve mostrar erro para CPF com menos de 11 dígitos', async () => {
      render(<ModalResetarSenha isOpen={true} onClose={mockOnClose} />);

      const input = screen.getByPlaceholderText(/000\.000\.000-00/i);
      fireEvent.change(input, { target: { value: '12345' } });

      const btn = screen.getByRole('button', { name: /gerar link/i });
      fireEvent.click(btn);

      await waitFor(() => {
        expect(screen.getByText(/CPF válido/i)).toBeInTheDocument();
      });
    });
  });

  describe('Envio do formulário', () => {
    it('deve chamar fetch com método POST e CPF limpo', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          link: 'http://localhost/resetar-senha?token=abc123',
          nome: 'Suporte Teste',
          perfil: 'suporte',
          expira_em: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });

      render(<ModalResetarSenha isOpen={true} onClose={mockOnClose} />);

      const input = screen.getByPlaceholderText(/000\.000\.000-00/i);
      fireEvent.change(input, { target: { value: '12345678909' } });

      const btn = screen.getByRole('button', { name: /gerar link/i });
      fireEvent.click(btn);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/reset-senha',
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('12345678909'),
          })
        );
      });
    });

    it('deve exibir resultado com link após sucesso', async () => {
      const linkGerado = 'http://localhost/resetar-senha?token=tokenxyz';
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          link: linkGerado,
          nome: 'RH Teste',
          perfil: 'rh',
          expira_em: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });

      render(<ModalResetarSenha isOpen={true} onClose={mockOnClose} />);

      const input = screen.getByPlaceholderText(/000\.000\.000-00/i);
      fireEvent.change(input, { target: { value: '12345678909' } });
      fireEvent.click(screen.getByRole('button', { name: /gerar link/i }));

      await waitFor(() => {
        expect(screen.getByText('RH Teste')).toBeInTheDocument();
        // O link é exibido em um input readonly — usar getByDisplayValue
        expect(screen.getByDisplayValue(linkGerado)).toBeInTheDocument();
      });
    });

    it('deve exibir erro da API quando request falha', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Usuário não encontrado' }),
      });

      render(<ModalResetarSenha isOpen={true} onClose={mockOnClose} />);

      const input = screen.getByPlaceholderText(/000\.000\.000-00/i);
      fireEvent.change(input, { target: { value: '11111111111' } });
      fireEvent.click(screen.getByRole('button', { name: /gerar link/i }));

      await waitFor(() => {
        expect(screen.getByText(/Usuário não encontrado/i)).toBeInTheDocument();
      });
    });
  });

  describe('Fechar modal', () => {
    it('deve chamar onClose ao clicar no botão X', () => {
      render(<ModalResetarSenha isOpen={true} onClose={mockOnClose} />);

      const closeBtn = screen.getByRole('button', { name: /fechar/i });
      fireEvent.click(closeBtn);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('deve limpar estado ao clicar fechar e reabrir', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          link: 'http://localhost/resetar-senha?token=abc',
          nome: 'Suporte',
          perfil: 'suporte',
          expira_em: new Date(Date.now() + 86400000).toISOString(),
        }),
      });

      const { rerender } = render(<ModalResetarSenha isOpen={true} onClose={mockOnClose} />);

      const input = screen.getByPlaceholderText(/000\.000\.000-00/i);
      fireEvent.change(input, { target: { value: '12345678909' } });
      fireEvent.click(screen.getByRole('button', { name: /gerar link/i }));

      await waitFor(() => {
        expect(screen.getByText('Suporte')).toBeInTheDocument();
      });

      // Fechar via botão X — chama handleClose que reseta o estado
      // Na tela de resultado há dois botões "Fechar" (header X + botão inferior)
      const closeBtns = screen.getAllByRole('button', { name: /fechar/i });
      fireEvent.click(closeBtns[0]); // abre o X do cabeçalho
      expect(mockOnClose).toHaveBeenCalled();

      // Reabrir
      rerender(<ModalResetarSenha isOpen={true} onClose={mockOnClose} />);

      // Campo CPF deve estar vazio novamente
      const inputNovo = screen.getByPlaceholderText(/000\.000\.000-00/i);
      expect((inputNovo as HTMLInputElement).value).toBe('');
    });
  });
});
