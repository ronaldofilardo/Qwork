import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ResponsavelStep from '@/components/modals/ModalCadastroContratante/ResponsavelStep';

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

  // Mock fetch for runtime config used by the component
  const _prevFetch = (global as unknown as { fetch?: unknown }).fetch;
  beforeEach(() => {
    (global as unknown as { fetch?: jest.Mock }).fetch = jest
      .fn()
      .mockResolvedValue({
        json: () => Promise.resolve({ disableAnexos: false }),
      });
  });
  afterEach(() => {
    (global as unknown as { fetch?: unknown }).fetch = _prevFetch;
  });

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

  test('quando NEXT_PUBLIC_DISABLE_ANEXOS=true input de documento fica desabilitado e aviso aparece', () => {
    const prev = process.env.NEXT_PUBLIC_DISABLE_ANEXOS;
    process.env.NEXT_PUBLIC_DISABLE_ANEXOS = 'true';

    try {
      render(<ResponsavelStep {...baseProps} />);

      expect(
        screen.getByText(/Uploads temporariamente desabilitados/i)
      ).toBeInTheDocument();

      const doc = screen.getByLabelText('Documento de Identificação');
      expect(doc.disabled).toBe(true);
      expect(doc.hasAttribute('required')).toBe(false);
    } finally {
      process.env.NEXT_PUBLIC_DISABLE_ANEXOS = prev;
    }
  });
});
