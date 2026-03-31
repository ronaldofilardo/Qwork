/**
 * @file __tests__/components/admin/AdminSidebar.test.tsx
 * Testes: AdminSidebar
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminSidebar from '@/components/admin/AdminSidebar';

const defaultProps = {
  activeSection: 'tomadores' as const,
  onSectionChange: jest.fn(),
  counts: {},
};

describe('AdminSidebar', () => {
  beforeEach(() => jest.clearAllMocks());

  it('não deve renderizar o item "Informações da Conta" para admin', () => {
    render(<AdminSidebar {...defaultProps} />);
    expect(screen.queryByText('Informações da Conta')).toBeNull();
  });

  it('não deve renderizar o item "Novos Cadastros"', () => {
    render(<AdminSidebar {...defaultProps} />);
    expect(screen.queryByText('Novos Cadastros')).toBeNull();
  });

  it('não deve renderizar o item "Cobrança" dentro do Financeiro', () => {
    render(<AdminSidebar {...defaultProps} activeSection="financeiro" />);
    // Abre Financeiro clicando nele
    fireEvent.click(screen.getByText('Financeiro'));
    expect(screen.queryByText('Cobrança')).toBeNull();
  });

  it('deve renderizar os menus principais: Tomadores, Volume, Financeiro, Geral', () => {
    render(<AdminSidebar {...defaultProps} />);
    expect(screen.getByText('Tomadores')).toBeInTheDocument();
    expect(screen.getByText('Volume')).toBeInTheDocument();
    expect(screen.getByText('Financeiro')).toBeInTheDocument();
    expect(screen.getByText('Geral')).toBeInTheDocument();
  });

  it('deve exibir submenus Entidade e RH ao expandir Volume', () => {
    // Renderiza com seção neutra para que o clique EXPANDA (não colapse) o Volume
    render(<AdminSidebar {...defaultProps} activeSection="tomadores" />);
    fireEvent.click(screen.getByText('Volume'));
    expect(screen.getByText('Entidade')).toBeInTheDocument();
    expect(screen.getByText('RH')).toBeInTheDocument();
  });

  it('deve exibir apenas Planos e Pagamentos dentro de Financeiro (sem Cobrança)', () => {
    // Renderiza com seção neutra para que o clique EXPANDA (não colapse) o Financeiro
    render(<AdminSidebar {...defaultProps} activeSection="tomadores" />);
    fireEvent.click(screen.getByText('Financeiro'));
    expect(screen.getByText('Planos')).toBeInTheDocument();
    expect(screen.getByText('Pagamentos')).toBeInTheDocument();
    expect(screen.queryByText('Cobrança')).toBeNull();
  });

  it('deve chamar onSectionChange com "volume" e "entidade" ao clicar em Volume', () => {
    const onSectionChange = jest.fn();
    render(
      <AdminSidebar
        activeSection="tomadores"
        onSectionChange={onSectionChange}
        counts={{}}
      />
    );
    fireEvent.click(screen.getByText('Volume'));
    expect(onSectionChange).toHaveBeenCalledWith('volume', 'entidade');
  });

  it('deve chamar onSectionChange com "volume" e "rh" ao clicar no submenu RH', () => {
    const onSectionChange = jest.fn();
    render(
      <AdminSidebar
        activeSection="volume"
        activeSubSection="entidade"
        onSectionChange={onSectionChange}
        counts={{}}
      />
    );
    fireEvent.click(screen.getByText('RH'));
    expect(onSectionChange).toHaveBeenCalledWith('volume', 'rh');
  });

  it('deve chamar onSectionChange com "financeiro" e "planos" como default ao clicar em Financeiro', () => {
    const onSectionChange = jest.fn();
    render(
      <AdminSidebar
        activeSection="tomadores"
        onSectionChange={onSectionChange}
        counts={{}}
      />
    );
    fireEvent.click(screen.getByText('Financeiro'));
    expect(onSectionChange).toHaveBeenCalledWith('financeiro', 'planos');
  });
});
