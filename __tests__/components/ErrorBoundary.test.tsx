/**
 * @fileoverview Testes do Error Boundary (app/error.tsx)
 *
 * Alterações cobertas (Phase F — Auditoria Sênior):
 *  - Link "Voltar para a página inicial"
 *  - Botão "Copiar código do erro" (clipboard API)
 *  - Info de contato suporte@qwork.com.br
 *  - Botão "Tentar novamente"
 */

import '@testing-library/jest-dom';
import React from 'react';
import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from '@testing-library/react';
import ErrorPage from '@/app/error';

// Mock Next.js Link
jest.mock('next/link', () => {
  return function MockLink({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  };
});

const mockError = Object.assign(new Error('Erro de teste'), {
  digest: 'test-digest-abc123',
});

function renderErrorPage(reset = jest.fn()) {
  return render(<ErrorPage error={mockError} reset={reset} />);
}

describe('Error Boundary (app/error.tsx)', () => {
  describe('Renderização básica', () => {
    it('exibe mensagem de erro amigável', () => {
      renderErrorPage();
      expect(screen.getByText(/algo deu errado/i)).toBeInTheDocument();
    });

    it('exibe o digest (código do erro)', () => {
      renderErrorPage();
      expect(screen.getByText(/test-digest-abc123/)).toBeInTheDocument();
    });

    it('exibe o botão "Tentar novamente"', () => {
      renderErrorPage();
      expect(
        screen.getByRole('button', { name: /tentar novamente/i })
      ).toBeInTheDocument();
    });
  });

  describe('Navegação', () => {
    it('exibe link para a página inicial', () => {
      renderErrorPage();
      const homeLink = screen.getByRole('link', {
        name: /voltar para a página inicial/i,
      });
      expect(homeLink).toBeInTheDocument();
      expect(homeLink).toHaveAttribute('href', '/');
    });

    it('exibe link de contato para suporte', () => {
      renderErrorPage();
      const supportLink = screen.getByRole('link', { name: /suporte@qwork/i });
      expect(supportLink).toBeInTheDocument();
      expect(supportLink).toHaveAttribute(
        'href',
        'mailto:suporte@qwork.com.br'
      );
    });
  });

  describe('Botão "Tentar novamente"', () => {
    it('chama reset() quando clicado', () => {
      const reset = jest.fn();
      renderErrorPage(reset);
      fireEvent.click(
        screen.getByRole('button', { name: /tentar novamente/i })
      );
      expect(reset).toHaveBeenCalledTimes(1);
    });
  });

  describe('Copiar código do erro', () => {
    it('exibe botão "Copiar"', () => {
      renderErrorPage();
      expect(
        screen.getByRole('button', { name: /copiar código do erro/i })
      ).toBeInTheDocument();
    });

    it('usa clipboard API e mostra "Copiado" temporariamente', async () => {
      const writeText = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        configurable: true,
      });

      renderErrorPage();
      const copyBtn = screen.getByRole('button', {
        name: /copiar código do erro/i,
      });

      await act(async () => {
        fireEvent.click(copyBtn);
      });

      expect(writeText).toHaveBeenCalledWith('test-digest-abc123');

      await waitFor(() => {
        expect(screen.getByText(/✓ copiado/i)).toBeInTheDocument();
      });
    });

    it('gera um errorId quando digest não está disponível', () => {
      const errorSemDigest = new Error('Sem digest');
      render(<ErrorPage error={errorSemDigest} reset={jest.fn()} />);
      // Deve exibir algum código de erro (prefixo "err-")
      expect(screen.getByText(/err-/)).toBeInTheDocument();
    });
  });

  describe('Acessibilidade', () => {
    it('container principal tem role="alert"', () => {
      renderErrorPage();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});
