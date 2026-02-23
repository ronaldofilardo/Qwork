import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DadosStep from '@/components/modals/ModalCadastroTomadorSteps/DadosStep';

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

    render(
      <DadosStep
        dadostomador={baseDados}
        arquivos={arquivos}
        cnpjError={''}
        onChange={handleChange}
        onFileChange={handleFile}
      />
    );

    // Verificar campos de texto
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

  test('inputs de arquivo estão habilitados e são obrigatórios', () => {
    const handleChange = jest.fn();
    const handleFile = jest.fn();

    render(
      <DadosStep
        dadostomador={baseDados}
        arquivos={arquivos}
        cnpjError={''}
        onChange={handleChange}
        onFileChange={handleFile}
      />
    );

    const cartao = screen.getByLabelText<HTMLInputElement>('Cartão CNPJ');
    const contrato = screen.getByLabelText<HTMLInputElement>('Contrato Social');

    expect(cartao.disabled).toBe(false);
    expect(contrato.disabled).toBe(false);
    expect(cartao.hasAttribute('required')).toBe(true);
    expect(contrato.hasAttribute('required')).toBe(true);
  });
});
