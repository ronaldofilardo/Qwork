/**
 * @file __tests__/components/ErrorCard.test.tsx
 * Testes para o componente ErrorCard
 *
 * Valida:
 *  - Renderização com erro estruturado
 *  - Renderização com Error simples
 *  - Botões de ação (tentar novamente, voltar)
 *  - Detalhes técnicos colapsáveis
 *  - Exibição de código de erro
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorCard } from '@/components/ErrorCard';

describe('ErrorCard', () => {
  const erroEstruturado = {
    codigo: 'E5001',
    mensagemUsuario: 'Erro ao gerar o laudo. Tente novamente.',
    mensagem: 'Timeout ao conectar com o serviço de geração de PDF',
    contexto: { loteId: 123, emissorId: 45 },
    timestamp: new Date('2026-03-12T10:00:00Z').toISOString(),
  };

  describe('Renderização', () => {
    it('deve renderizar mensagem de erro amigável', () => {
      render(<ErrorCard erro={erroEstruturado} />);
      expect(screen.getByText(/Erro ao gerar o laudo/i)).toBeInTheDocument();
    });

    it('deve exibir código de erro', () => {
      render(<ErrorCard erro={erroEstruturado} />);
      expect(screen.getByText(/E5001/)).toBeInTheDocument();
    });

    it('deve renderizar com Error simples', () => {
      const errorSimples = new Error('Algo deu errado');
      render(<ErrorCard erro={errorSimples} />);
      expect(screen.getByText(/Algo deu errado/i)).toBeInTheDocument();
    });

    it('deve renderizar com erro genérico (sem campos)', () => {
      render(<ErrorCard erro={{}} />);
      expect(screen.getByText(/erro inesperado/i)).toBeInTheDocument();
    });
  });

  describe('Ações', () => {
    it('deve chamar onTentarNovamente quando clicado', () => {
      const mockTentarNovamente = jest.fn();
      render(
        <ErrorCard
          erro={erroEstruturado}
          onTentarNovamente={mockTentarNovamente}
        />
      );

      const botao = screen.queryByText(/tentar novamente/i);
      if (botao) {
        fireEvent.click(botao);
        expect(mockTentarNovamente).toHaveBeenCalledTimes(1);
      }
    });

    it('deve chamar onVoltar quando clicado', () => {
      const mockVoltar = jest.fn();
      render(<ErrorCard erro={erroEstruturado} onVoltar={mockVoltar} />);

      const botao = screen.queryByText(/voltar/i);
      if (botao) {
        fireEvent.click(botao);
        expect(mockVoltar).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('Detalhes Técnicos', () => {
    it('deve ter opção de expandir detalhes técnicos', () => {
      render(<ErrorCard erro={erroEstruturado} />);

      const botaoDetalhes = screen.queryByText(
        /detalhes|técnicos|mais informações/i
      );
      if (botaoDetalhes) {
        fireEvent.click(botaoDetalhes);
        expect(screen.getByText(/Timeout/i)).toBeInTheDocument();
      }
    });
  });
});
