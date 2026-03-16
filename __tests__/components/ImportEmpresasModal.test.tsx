/**
 * Testes para o modal de importação em massa de empresas e funcionários
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ImportEmpresasModal from '@/components/clinica/ImportEmpresasModal';

// Mock do módulo xlsx para evitar bundling
jest.mock('xlsx', () => ({
  utils: {
    aoa_to_sheet: jest.fn(() => ({})),
    book_new: jest.fn(() => ({})),
    book_append_sheet: jest.fn(),
  },
  writeFile: jest.fn(),
}));

const mockOnClose = jest.fn();
const mockOnSuccess = jest.fn();

const defaultProps = {
  isOpen: true,
  onClose: mockOnClose,
  onSuccess: mockOnSuccess,
};

describe('ImportEmpresasModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  describe('Renderização', () => {
    it('deve renderizar o modal quando isOpen=true', () => {
      render(<ImportEmpresasModal {...defaultProps} />);

      expect(
        screen.getByText('Importar Empresas e Funcionários')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Upload em massa via planilha .xlsx')
      ).toBeInTheDocument();
    });

    it('não deve renderizar quando isOpen=false', () => {
      render(<ImportEmpresasModal {...defaultProps} isOpen={false} />);

      expect(
        screen.queryByText('Importar Empresas e Funcionários')
      ).not.toBeInTheDocument();
    });

    it('deve exibir colunas obrigatórias', () => {
      render(<ImportEmpresasModal {...defaultProps} />);

      expect(screen.getByText('empresa_cnpj')).toBeInTheDocument();
      expect(screen.getByText('empresa_nome')).toBeInTheDocument();
      expect(screen.getByText('cpf')).toBeInTheDocument();
      expect(screen.getByText('nome')).toBeInTheDocument();
      expect(screen.getByText('data_nascimento')).toBeInTheDocument();
      expect(screen.getByText('setor')).toBeInTheDocument();
      expect(screen.getByText('funcao')).toBeInTheDocument();
    });

    it('deve exibir colunas opcionais', () => {
      render(<ImportEmpresasModal {...defaultProps} />);

      expect(screen.getByText(/email/)).toBeInTheDocument();
      expect(screen.getByText(/matricula/)).toBeInTheDocument();
      expect(screen.getByText(/nivel_cargo/)).toBeInTheDocument();
    });

    it('deve exibir input de arquivo', () => {
      render(<ImportEmpresasModal {...defaultProps} />);

      const fileInput = screen.getByLabelText(/arquivo/i);
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('type', 'file');
      expect(fileInput).toHaveAttribute(
        'accept',
        expect.stringContaining('.xlsx')
      );
    });

    it('deve exibir botão "Baixar Modelo"', () => {
      render(<ImportEmpresasModal {...defaultProps} />);

      const botaoBaixar = screen.getByRole('button', {
        name: /baixar modelo/i,
      });
      expect(botaoBaixar).toBeInTheDocument();
    });
  });

  describe('Download de template', () => {
    it('deve chamar xlsx ao clicar em "Baixar Modelo"', async () => {
      const xlsxModule = await import('xlsx');

      render(<ImportEmpresasModal {...defaultProps} />);

      const botaoBaixar = screen.getByRole('button', {
        name: /baixar modelo/i,
      });
      fireEvent.click(botaoBaixar);

      // Aguarda o import dinâmico
      await waitFor(() => {
        expect(xlsxModule.utils.aoa_to_sheet).toHaveBeenCalled();
      });

      expect(xlsxModule.writeFile).toHaveBeenCalledWith(
        expect.anything(),
        'template-importacao.xlsx'
      );
    });
  });

  describe('Upload de arquivo', () => {
    it('deve mostrar nome do arquivo selecionado', () => {
      render(<ImportEmpresasModal {...defaultProps} />);

      const fileInput = screen.getByLabelText(/arquivo/i);
      const mockFile = new File(['content'], 'planilha.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      expect(screen.getByText(/planilha\.xlsx/i)).toBeInTheDocument();
    });

    it('deve habilitar o botão Importar após selecionar arquivo', () => {
      render(<ImportEmpresasModal {...defaultProps} />);

      const botaoImportar = screen.getByRole('button', {
        name: /importar planilha/i,
      });
      expect(botaoImportar).toBeDisabled();

      const fileInput = screen.getByLabelText(/arquivo/i);
      const mockFile = new File(['content'], 'planilha.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      expect(botaoImportar).not.toBeDisabled();
    });

    it('deve mostrar erro quando API retorna erro', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () =>
          Promise.resolve({
            error: 'CNPJ inválido na linha 2',
            details: ['Linha 2: CNPJ inválido'],
          }),
      });

      render(<ImportEmpresasModal {...defaultProps} />);

      const fileInput = screen.getByLabelText(/arquivo/i);
      const mockFile = new File(['content'], 'planilha.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      const botaoImportar = screen.getByRole('button', {
        name: /importar planilha/i,
      });
      fireEvent.click(botaoImportar);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      expect(screen.getByText(/Linha 2: CNPJ inválido/i)).toBeInTheDocument();
    });

    it('deve mostrar resultado de sucesso após importação', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            empresas_criadas: 3,
            empresas_existentes: 1,
            funcionarios_criados: 20,
            funcionarios_vinculados: 5,
            total_linhas: 25,
          }),
      });

      render(<ImportEmpresasModal {...defaultProps} />);

      const fileInput = screen.getByLabelText(/arquivo/i);
      const mockFile = new File(['content'], 'planilha.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      fireEvent.click(
        screen.getByRole('button', { name: /importar planilha/i })
      );

      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument();
      });

      expect(screen.getByText('Importação concluída!')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument(); // empresas_criadas
      expect(screen.getByText('20')).toBeInTheDocument(); // funcionarios_criados
      expect(mockOnSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          empresas_criadas: 3,
          funcionarios_criados: 20,
        })
      );
    });
  });

  describe('Comportamento do modal', () => {
    it('deve fechar o modal ao clicar no botão X', () => {
      render(<ImportEmpresasModal {...defaultProps} />);

      const botaoFechar = screen.getByRole('button', { name: /fechar modal/i });
      fireEvent.click(botaoFechar);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('deve fechar o modal ao clicar no backdrop', () => {
      render(<ImportEmpresasModal {...defaultProps} />);

      const backdrop = document.querySelector('[aria-hidden="true"]');
      if (backdrop) fireEvent.click(backdrop);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('deve fechar o modal ao clicar em Cancelar', () => {
      render(<ImportEmpresasModal {...defaultProps} />);

      const botaoCancelar = screen.getByRole('button', { name: /cancelar/i });
      fireEvent.click(botaoCancelar);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });
});
