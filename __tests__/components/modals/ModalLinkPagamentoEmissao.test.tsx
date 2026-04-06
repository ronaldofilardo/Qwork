/**
 * ModalLinkPagamentoEmissao.test.tsx
 *
 * Testes para o modal de link de pagamento de emissão.
 *
 * Funcionalidades testadas:
 * 1. Renderiza normalmente quando isOpen=true
 * 2. Não renderiza quando isOpen=false
 * 3. Botão "Disponibilizar na conta do tomador" aparece quando onDisponibilizarLink é passado
 * 4. Botão não aparece quando onDisponibilizarLink não é passado
 * 5. Clique no botão chama onDisponibilizarLink com o loteId correto
 * 6. Botão exibe texto de carregamento quando isDisponibilizando=true
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ModalLinkPagamentoEmissao from '@/components/modals/ModalLinkPagamentoEmissao';

// Mock do módulo qrcode para evitar dependência de canvas no jsdom
jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mock'),
}));

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  token: 'tok_test_abc123',
  loteId: 42,
  nomeTomador: 'Tomador Teste S.A.',
  valorTotal: 500,
  numAvaliacoes: 10,
};

describe('ModalLinkPagamentoEmissao', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar quando isOpen=true', () => {
    render(<ModalLinkPagamentoEmissao {...defaultProps} />);
    expect(screen.getByText('Link de Pagamento Gerado')).toBeInTheDocument();
  });

  it('não deve renderizar quando isOpen=false', () => {
    render(<ModalLinkPagamentoEmissao {...defaultProps} isOpen={false} />);
    expect(
      screen.queryByText('Link de Pagamento Gerado')
    ).not.toBeInTheDocument();
  });

  it('não deve exibir botão "Disponibilizar" quando onDisponibilizarLink não é passado', () => {
    render(<ModalLinkPagamentoEmissao {...defaultProps} />);
    expect(
      screen.queryByRole('button', { name: /disponibilizar na conta/i })
    ).not.toBeInTheDocument();
  });

  it('deve exibir botão "Disponibilizar na conta do tomador" quando onDisponibilizarLink é passado', () => {
    const onDisponibilizarLink = jest.fn();
    render(
      <ModalLinkPagamentoEmissao
        {...defaultProps}
        onDisponibilizarLink={onDisponibilizarLink}
      />
    );
    expect(
      screen.getByRole('button', {
        name: /disponibilizar na conta do tomador/i,
      })
    ).toBeInTheDocument();
  });

  it('deve chamar onDisponibilizarLink com loteId ao clicar no botão', () => {
    const onDisponibilizarLink = jest.fn();
    render(
      <ModalLinkPagamentoEmissao
        {...defaultProps}
        onDisponibilizarLink={onDisponibilizarLink}
      />
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: /disponibilizar na conta do tomador/i,
      })
    );
    expect(onDisponibilizarLink).toHaveBeenCalledWith(42);
  });

  it('deve exibir texto de carregamento quando isDisponibilizando=true', () => {
    render(
      <ModalLinkPagamentoEmissao
        {...defaultProps}
        onDisponibilizarLink={jest.fn()}
        isDisponibilizando={true}
      />
    );
    expect(screen.getByText(/enviando/i)).toBeInTheDocument();
  });

  it('deve desabilitar botão enquanto isDisponibilizando=true', () => {
    render(
      <ModalLinkPagamentoEmissao
        {...defaultProps}
        onDisponibilizarLink={jest.fn()}
        isDisponibilizando={true}
      />
    );
    const btn = screen.getByRole('button', { name: /enviando/i });
    expect(btn).toBeDisabled();
  });
});
