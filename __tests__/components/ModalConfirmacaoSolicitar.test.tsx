/**
 * Testes para o componente ModalConfirmacaoSolicitar
 *
 * Funcionalidades testadas:
 * 1. Renderização quando isOpen=true
 * 2. Não renderiza quando isOpen=false
 * 3. Exibe dados de contato do gestor (email e celular)
 * 4. Exibe aviso quando dados de contato estão ausentes
 * 5. Exibe prazo de 24 horas úteis
 * 6. Exibe email fixo da plataforma
 * 7. Callback onClose é chamado ao clicar em "Entendi, Fechar"
 * 8. Callback onClose é chamado ao clicar no backdrop
 * 9. Callback onClose é chamado ao pressionar ESC
 * 10. Marca modal como exibida no sessionStorage (foiExibidaParaLote)
 * 11. Exibe aviso de email/celular não cadastrado quando um campo está vazio
 * 12. Exibe ID do lote no cabeçalho
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  ModalConfirmacaoSolicitar,
  foiExibidaParaLote,
  marcarExibidaParaLote,
} from '@/components/ModalConfirmacaoSolicitar';

const PLATAFORMA_EMAIL = 'contato@qwork.app.br';

describe('ModalConfirmacaoSolicitar', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    loteId: 42,
    gestorEmail: 'gestor@empresa.com',
    gestorCelular: '(11) 99999-9999',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Limpar sessionStorage antes de cada teste
    sessionStorage.clear();
  });

  // ────────────────────────────────────────────────────────────────
  // 1. Renderização
  // ────────────────────────────────────────────────────────────────

  it('deve renderizar o modal quando isOpen=true', () => {
    render(<ModalConfirmacaoSolicitar {...defaultProps} />);
    expect(
      screen.getByText('Solicitação Recebida com Sucesso!')
    ).toBeInTheDocument();
  });

  it('não deve renderizar o modal quando isOpen=false', () => {
    render(<ModalConfirmacaoSolicitar {...defaultProps} isOpen={false} />);
    expect(
      screen.queryByText('Solicitação Recebida com Sucesso!')
    ).not.toBeInTheDocument();
  });

  it('deve exibir o ID do lote no cabeçalho', () => {
    render(<ModalConfirmacaoSolicitar {...defaultProps} loteId={123} />);
    expect(screen.getByText(/Lote #123/)).toBeInTheDocument();
  });

  // ────────────────────────────────────────────────────────────────
  // 2. Dados de contato
  // ────────────────────────────────────────────────────────────────

  it('deve exibir email do gestor quando fornecido', () => {
    render(<ModalConfirmacaoSolicitar {...defaultProps} />);
    expect(screen.getByText('gestor@empresa.com')).toBeInTheDocument();
  });

  it('deve exibir celular do gestor quando fornecido', () => {
    render(<ModalConfirmacaoSolicitar {...defaultProps} />);
    expect(screen.getByText('(11) 99999-9999')).toBeInTheDocument();
  });

  it('deve exibir aviso de email não cadastrado quando email é null', () => {
    render(<ModalConfirmacaoSolicitar {...defaultProps} gestorEmail={null} />);
    expect(screen.getByText(/Email não cadastrado/)).toBeInTheDocument();
  });

  it('deve exibir aviso de celular não cadastrado quando celular é null', () => {
    render(
      <ModalConfirmacaoSolicitar {...defaultProps} gestorCelular={null} />
    );
    expect(screen.getByText(/Celular não cadastrado/)).toBeInTheDocument();
  });

  it('deve exibir aviso especial quando ambos email e celular são null', () => {
    render(
      <ModalConfirmacaoSolicitar
        {...defaultProps}
        gestorEmail={null}
        gestorCelular={null}
      />
    );
    expect(
      screen.getByText(/Nenhum dado de contato foi encontrado/i)
    ).toBeInTheDocument();
  });

  // ────────────────────────────────────────────────────────────────
  // 3. Prazo e email da plataforma
  // ────────────────────────────────────────────────────────────────

  it('deve exibir prazo de 24 horas úteis', () => {
    render(<ModalConfirmacaoSolicitar {...defaultProps} />);
    expect(screen.getByText(/24 horas úteis/)).toBeInTheDocument();
  });

  it('deve exibir menção ao horário comercial', () => {
    render(<ModalConfirmacaoSolicitar {...defaultProps} />);
    expect(screen.getByText(/horário comercial/)).toBeInTheDocument();
  });

  it('deve exibir o email fixo da plataforma', () => {
    render(<ModalConfirmacaoSolicitar {...defaultProps} />);
    expect(screen.getByText(PLATAFORMA_EMAIL)).toBeInTheDocument();
  });

  it('o link do email da plataforma deve ter href mailto:', () => {
    render(<ModalConfirmacaoSolicitar {...defaultProps} />);
    const emailLink = screen.getByRole('link', {
      name: new RegExp(PLATAFORMA_EMAIL),
    });
    expect(emailLink).toHaveAttribute('href', `mailto:${PLATAFORMA_EMAIL}`);
  });

  // ────────────────────────────────────────────────────────────────
  // 4. Interação / fechamento
  // ────────────────────────────────────────────────────────────────

  it('deve chamar onClose ao clicar em "Entendi, Fechar"', () => {
    const onClose = jest.fn();
    render(<ModalConfirmacaoSolicitar {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /Entendi, Fechar/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('deve chamar onClose ao clicar no backdrop', () => {
    const onClose = jest.fn();
    render(<ModalConfirmacaoSolicitar {...defaultProps} onClose={onClose} />);
    // O backdrop é o div com aria-hidden="true" antes do painel
    const backdrop = document.querySelector('[aria-hidden="true"]');
    expect(backdrop).toBeInTheDocument();
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('deve chamar onClose ao pressionar Escape', () => {
    const onClose = jest.fn();
    render(<ModalConfirmacaoSolicitar {...defaultProps} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // ────────────────────────────────────────────────────────────────
  // 5. sessionStorage (controle de exibição única por lote)
  // ────────────────────────────────────────────────────────────────

  it('deve marcar sessionStorage ao abrir (foiExibidaParaLote)', async () => {
    render(<ModalConfirmacaoSolicitar {...defaultProps} loteId={99} />);
    await waitFor(() => {
      expect(foiExibidaParaLote(99)).toBe(true);
    });
  });

  it('foiExibidaParaLote deve retornar false antes de exibir', () => {
    expect(foiExibidaParaLote(777)).toBe(false);
  });

  it('marcarExibidaParaLote deve marcar o lote como exibido', () => {
    expect(foiExibidaParaLote(888)).toBe(false);
    marcarExibidaParaLote(888);
    expect(foiExibidaParaLote(888)).toBe(true);
  });

  it('foiExibidaParaLote deve ser false para lote diferente', () => {
    marcarExibidaParaLote(10);
    expect(foiExibidaParaLote(10)).toBe(true);
    expect(foiExibidaParaLote(11)).toBe(false);
  });

  // ────────────────────────────────────────────────────────────────
  // 6. Acessibilidade
  // ────────────────────────────────────────────────────────────────

  it('deve ter role="dialog" e aria-modal="true"', () => {
    render(<ModalConfirmacaoSolicitar {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('deve ter aria-labelledby apontando para o título', () => {
    render(<ModalConfirmacaoSolicitar {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    const labelledById = dialog.getAttribute('aria-labelledby');
    expect(labelledById).toBeTruthy();
    const titulo = document.getElementById(labelledById);
    expect(titulo).toBeInTheDocument();
    expect(titulo?.textContent).toContain('Solicitação Recebida');
  });
});
