/**
 * @file __tests__/components/ResponsavelStep.test.tsx
 * Testes: ResponsavelStep
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ResponsavelStep from '@/components/modals/ModalCadastroTomadorSteps/ResponsavelStep';

describe('ResponsavelStep', () => {
  const baseProps = {
    dadosResponsavel: {
      nome: '',
      cpf: '',
      cargo: '',
      email: '',
      celular: '',
    },
    arquivos: {
      cartao_cnpj: null,
      contrato_social: null,
      doc_identificacao: null,
    },
    onChange: jest.fn(),
    onFileChange: jest.fn(),
  };

  test('renderiza campos e dispara callbacks', () => {
    render(<ResponsavelStep {...baseProps} />);

    const nome = screen.getByLabelText('Nome Completo');
    fireEvent.change(nome, { target: { value: 'João' } });
    expect(baseProps.onChange).toHaveBeenCalled();

    const file = new File(['id'], 'id.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText('Documento de Identificação');

    fireEvent.change(input, { target: { files: [file] } });
    expect(baseProps.onFileChange).toHaveBeenCalled();
  });

  test('input de documento está habilitado e é obrigatório', () => {
    render(<ResponsavelStep {...baseProps} />);

    const doc = screen.getByLabelText<HTMLInputElement>(
      'Documento de Identificação'
    );
    expect(doc.disabled).toBe(false);
    expect(doc.hasAttribute('required')).toBe(true);
  });
});
