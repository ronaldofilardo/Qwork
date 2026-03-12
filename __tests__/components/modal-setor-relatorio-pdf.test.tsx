/**
 * @fileoverview Testes do ModalSetorRelatorioPDF
 * @description Valida comportamento do modal de seleção de setor para geração de PDF.
 */

import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import ModalSetorRelatorioPDF from '@/components/ModalSetorRelatorioPDF';

const setoresMock = ['TI', 'RH', 'Financeiro'];

describe('ModalSetorRelatorioPDF', () => {
  describe('Renderização', () => {
    it('não deve renderizar quando isOpen=false', () => {
      render(
        <ModalSetorRelatorioPDF
          isOpen={false}
          setores={setoresMock}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
        />
      );
      expect(
        screen.queryByText('Gerar Relatório PDF por Setor')
      ).not.toBeInTheDocument();
    });

    it('deve renderizar o modal quando isOpen=true', () => {
      render(
        <ModalSetorRelatorioPDF
          isOpen={true}
          setores={setoresMock}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
        />
      );
      expect(
        screen.getByText('Gerar Relatório PDF por Setor')
      ).toBeInTheDocument();
    });

    it('deve exibir todos os setores no select', () => {
      render(
        <ModalSetorRelatorioPDF
          isOpen={true}
          setores={setoresMock}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
        />
      );
      const select = screen.getByLabelText('Setor');
      const options = Array.from(select.options).map((o) => o.value);
      expect(options).toEqual(setoresMock);
    });

    it('deve selecionar o primeiro setor por padrão', () => {
      render(
        <ModalSetorRelatorioPDF
          isOpen={true}
          setores={setoresMock}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
        />
      );
      const select = screen.getByLabelText('Setor');
      expect(select.value).toBe('TI');
    });

    it('deve exibir mensagem quando não há setores disponíveis', () => {
      render(
        <ModalSetorRelatorioPDF
          isOpen={true}
          setores={[]}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
        />
      );
      expect(
        screen.getByText('Nenhum setor disponível neste ciclo.')
      ).toBeInTheDocument();
    });

    it('deve desabilitar botão "Gerar PDF" quando não há setores', () => {
      render(
        <ModalSetorRelatorioPDF
          isOpen={true}
          setores={[]}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
        />
      );
      const btnGerar = screen.getByText('📊 Gerar PDF').closest('button');
      expect(btnGerar).toBeDisabled();
    });
  });

  describe('Interação', () => {
    it('deve chamar onClose ao clicar em Cancelar', () => {
      const onClose = jest.fn();
      render(
        <ModalSetorRelatorioPDF
          isOpen={true}
          setores={setoresMock}
          onClose={onClose}
          onConfirm={jest.fn()}
        />
      );
      fireEvent.click(screen.getByText('Cancelar'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('deve chamar onConfirm com o setor selecionado ao clicar em Gerar PDF', async () => {
      const onConfirm = jest.fn().mockResolvedValue(undefined);
      render(
        <ModalSetorRelatorioPDF
          isOpen={true}
          setores={setoresMock}
          onClose={jest.fn()}
          onConfirm={onConfirm}
        />
      );

      // Selecionar segundo setor
      const select = screen.getByLabelText('Setor');
      fireEvent.change(select, { target: { value: 'RH' } });

      // Clicar em Gerar PDF
      await act(async () => {
        fireEvent.click(screen.getByText('📊 Gerar PDF').closest('button'));
      });

      expect(onConfirm).toHaveBeenCalledWith('RH');
    });

    it('deve fechar o modal após confirmação bem-sucedida', async () => {
      const onClose = jest.fn();
      const onConfirm = jest.fn().mockResolvedValue(undefined);
      render(
        <ModalSetorRelatorioPDF
          isOpen={true}
          setores={setoresMock}
          onClose={onClose}
          onConfirm={onConfirm}
        />
      );

      await act(async () => {
        fireEvent.click(screen.getByText('📊 Gerar PDF').closest('button'));
      });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('deve fechar com tecla Escape', () => {
      const onClose = jest.fn();
      render(
        <ModalSetorRelatorioPDF
          isOpen={true}
          setores={setoresMock}
          onClose={onClose}
          onConfirm={jest.fn()}
        />
      );
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('deve exibir estado de loading durante a geração', async () => {
      let resolveConfirm!: () => void;
      const onConfirm = jest.fn().mockReturnValue(
        new Promise<void>((res) => {
          resolveConfirm = res;
        })
      );

      render(
        <ModalSetorRelatorioPDF
          isOpen={true}
          setores={setoresMock}
          onClose={jest.fn()}
          onConfirm={onConfirm}
        />
      );

      act(() => {
        fireEvent.click(screen.getByText('📊 Gerar PDF').closest('button'));
      });

      // Durante o loading, o botão deve exibir "Gerando..."
      await waitFor(() => {
        expect(screen.getByText('Gerando...')).toBeInTheDocument();
      });

      // Liberar a promise
      await act(async () => {
        resolveConfirm();
      });
    });

    // ── Correção 06/03/2026: modal permanece aberto ao falhar ──────────────
    it('não deve chamar onClose quando onConfirm rejeita (setor sem funcionários)', async () => {
      const onClose = jest.fn();
      const onConfirm = jest
        .fn()
        .mockRejectedValue(
          new Error(
            'Nenhum funcionário do setor "Financeiro" com avaliação concluída neste ciclo'
          )
        );

      render(
        <ModalSetorRelatorioPDF
          isOpen={true}
          setores={setoresMock}
          onClose={onClose}
          onConfirm={onConfirm}
        />
      );

      await act(async () => {
        fireEvent.click(screen.getByText('📊 Gerar PDF').closest('button'));
      });

      // Modal deve permanecer aberto — onClose não pode ter sido chamado
      expect(onClose).not.toHaveBeenCalled();
    });

    it('deve encerrar estado de loading após onConfirm rejeitar', async () => {
      const onConfirm = jest
        .fn()
        .mockRejectedValue(
          new Error('Nenhum funcionário com avaliação concluída neste ciclo')
        );

      render(
        <ModalSetorRelatorioPDF
          isOpen={true}
          setores={setoresMock}
          onClose={jest.fn()}
          onConfirm={onConfirm}
        />
      );

      await act(async () => {
        fireEvent.click(screen.getByText('📊 Gerar PDF').closest('button'));
      });

      // Após o erro, o botão deve voltar ao estado normal (não "Gerando...")
      await waitFor(() => {
        expect(screen.getByText('📊 Gerar PDF')).toBeInTheDocument();
      });
    });

    it('deve permitir nova tentativa após onConfirm rejeitar', async () => {
      const onConfirm = jest
        .fn()
        .mockRejectedValueOnce(new Error('Erro ao gerar'))
        .mockResolvedValueOnce(undefined);
      const onClose = jest.fn();

      render(
        <ModalSetorRelatorioPDF
          isOpen={true}
          setores={setoresMock}
          onClose={onClose}
          onConfirm={onConfirm}
        />
      );

      // Primeira tentativa → falha
      await act(async () => {
        fireEvent.click(screen.getByText('📊 Gerar PDF').closest('button'));
      });
      expect(onClose).not.toHaveBeenCalled();

      // Segunda tentativa → sucesso
      await act(async () => {
        fireEvent.click(screen.getByText('📊 Gerar PDF').closest('button'));
      });
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
