import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DadosStep from '@/components/modals/ModalCadastroContratante/DadosStep';

const baseDados = {
  nome: '',
  cnpj: '',
  inscricao_estadual: '',
  email: '',
  telefone: '',
  endereco: '',
  cidade: '',
  estado: '',
  cep: '',
};

const arquivos = {
  cartao_cnpj: null,
  contrato_social: null,
  doc_identificacao: null,
};

describe('DadosStep', () => {
  test('renderiza campos e dispara handlers', () => {
    const handleChange = jest.fn();
    const handleFile = jest.fn();

    // Mock runtime config fetch used by component
    const prevFetch = (global as unknown as { fetch?: unknown }).fetch;
    (global as unknown as { fetch?: jest.Mock }).fetch = jest
      .fn()
      .mockResolvedValue({
        json: () => Promise.resolve({ disableAnexos: false }),
      });

    try {
      render(
        <DadosStep
          dadosContratante={baseDados}
          arquivos={arquivos}
          cnpjError={''}
          onChange={handleChange}
          onFileChange={handleFile}
        />
      );
    } finally {
      (global as unknown as { fetch?: unknown }).fetch = prevFetch;
    }

    // Verificar campos
    expect(screen.getByLabelText('Razão Social')).toBeInTheDocument();
    expect(screen.getByLabelText('CNPJ')).toBeInTheDocument();

    // Simular mudança
    fireEvent.change(screen.getByLabelText('Razão Social'), {
      target: { value: 'ACME' },
    });
    expect(handleChange).toHaveBeenCalled();

    // Simular arquivo
    const file = new File(['a'], 'a.pdf', { type: 'application/pdf' });
    fireEvent.change(screen.getByLabelText('Cartão CNPJ'), {
      target: { files: [file] },
    });
    expect(handleFile).toHaveBeenCalled();
  });

  test('quando NEXT_PUBLIC_DISABLE_ANEXOS=true inputs de arquivo ficam desabilitados e aviso aparece', () => {
    const prev = process.env.NEXT_PUBLIC_DISABLE_ANEXOS;
    process.env.NEXT_PUBLIC_DISABLE_ANEXOS = 'true';

    try {
      const handleChange = jest.fn();
      const handleFile = jest.fn();

      const prevFetch = (global as unknown as { fetch?: unknown }).fetch;
      (global as unknown as { fetch?: jest.Mock }).fetch = jest
        .fn()
        .mockResolvedValue({
          json: () => Promise.resolve({ disableAnexos: false }),
        });

      try {
        render(
          <DadosStep
            dadosContratante={baseDados}
            arquivos={arquivos}
            cnpjError={''}
            onChange={handleChange}
            onFileChange={handleFile}
          />
        );

        // Aviso visível
        expect(
          screen.getByText(/Uploads estão temporariamente desabilitados/i)
        ).toBeInTheDocument();

        const cartao = screen.getByLabelText<HTMLInputElement>('Cartão CNPJ');
        const contrato =
          screen.getByLabelText<HTMLInputElement>('Contrato Social');

        expect(cartao.disabled).toBe(true);
        expect(contrato.disabled).toBe(true);

        // required não deve estar presente
        expect(cartao.hasAttribute('required')).toBe(false);
        expect(contrato.hasAttribute('required')).toBe(false);

        // A entrada deve estar desabilitada (comportamento visual / de acesso)
        // (Não testamos que onFileChange não seja chamado por eventos simulados do DOM)
        expect(cartao.disabled).toBe(true);
        expect(contrato.disabled).toBe(true);
      } finally {
        (global as unknown as { fetch?: unknown }).fetch = prevFetch;
      }
    } finally {
      process.env.NEXT_PUBLIC_DISABLE_ANEXOS = prev;
    }
  });
});
