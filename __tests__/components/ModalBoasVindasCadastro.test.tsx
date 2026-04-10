/**
 * @file __tests__/components/ModalBoasVindasCadastro.test.tsx
 * Testes: ModalBoasVindasCadastro — modal de boas-vindas antes do cadastro de empresa
 */

import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ModalBoasVindasCadastro from '@/components/modals/ModalBoasVindasCadastro';

describe('ModalBoasVindasCadastro', () => {
  it('não renderiza nada quando isOpen=false', () => {
    const { container } = render(
      <ModalBoasVindasCadastro
        isOpen={false}
        onClose={jest.fn()}
        onContinuar={jest.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza o modal quando isOpen=true', () => {
    render(
      <ModalBoasVindasCadastro
        isOpen={true}
        onClose={jest.fn()}
        onContinuar={jest.fn()}
      />
    );
    expect(screen.getByText('Antes de começar')).toBeInTheDocument();
  });

  it('exibe os 4 blocos de informação', () => {
    render(
      <ModalBoasVindasCadastro
        isOpen={true}
        onClose={jest.fn()}
        onContinuar={jest.fn()}
      />
    );
    expect(screen.getByText('Bem-vindo à QWork!')).toBeInTheDocument();
    expect(
      screen.getByText('Tenha em mãos os seguintes documentos')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Cadastro rápido, acesso imediato')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Pagamento somente na emissão')
    ).toBeInTheDocument();
  });

  it('menciona limite de 3MB nos documentos', () => {
    render(
      <ModalBoasVindasCadastro
        isOpen={true}
        onClose={jest.fn()}
        onContinuar={jest.fn()}
      />
    );
    expect(screen.getByText(/3 MB/i)).toBeInTheDocument();
  });

  it('chama onContinuar ao clicar no botão de continuar', () => {
    const onContinuar = jest.fn();
    render(
      <ModalBoasVindasCadastro
        isOpen={true}
        onClose={jest.fn()}
        onContinuar={onContinuar}
      />
    );
    fireEvent.click(
      screen.getByRole('button', { name: /Entendido, começar cadastro/i })
    );
    expect(onContinuar).toHaveBeenCalledTimes(1);
  });

  it('chama onClose ao clicar no botão X', () => {
    const onClose = jest.fn();
    render(
      <ModalBoasVindasCadastro
        isOpen={true}
        onClose={onClose}
        onContinuar={jest.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Fechar/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
