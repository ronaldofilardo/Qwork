import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ModalCadastroContratante from '@/components/modals/ModalCadastroContratante';

const enviarSpy = jest.fn().mockResolvedValue({ id: 42 });

jest.mock('@/lib/cadastroApi', () => ({
  createCadastroApi: () => ({
    getPlanos: jest.fn().mockResolvedValue([
      {
        id: 1,
        nome: 'Básico',
        preco: 100,
        tipo: 'fixo',
        caracteristicas: {},
      },
    ]),
    enviarCadastro: enviarSpy,
  }),
}));

describe('ModalCadastroContratante - integração leve', () => {
  test('fluxo básico: selecionar plano fixo e enviar', async () => {
    jest.useFakeTimers();
    const onClose = jest.fn();
    render(
      <ModalCadastroContratante
        isOpen={true}
        onClose={onClose}
        tipo="entidade"
      />
    );

    // Aguarda planos carregarem
    await waitFor(() => {
      expect(screen.getAllByTestId('plano-card').length).toBeGreaterThan(0);
    });

    // Selecionar plano
    const planos = screen.getAllByTestId('plano-card');
    fireEvent.click(planos[0]);

    // Avançar para dados
    const proximo = screen.getByText('Próximo');
    fireEvent.click(proximo);

    // Preencher dados obrigatórios
    fireEvent.change(screen.getByLabelText('Razão Social'), {
      target: { value: 'ACME' },
    });
    fireEvent.change(screen.getByLabelText('CNPJ'), {
      target: { value: '11.444.777/0001-61' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'a@a.com' },
    });
    fireEvent.change(screen.getByLabelText('Telefone'), {
      target: { value: '(11) 99999-9999' },
    });
    fireEvent.change(screen.getByLabelText('Endereço'), {
      target: { value: 'Rua X' },
    });
    fireEvent.change(screen.getByLabelText('Cidade'), {
      target: { value: 'São Paulo' },
    });
    fireEvent.change(screen.getByLabelText('Estado (UF)'), {
      target: { value: 'SP' },
    });
    fireEvent.change(screen.getByLabelText('CEP'), {
      target: { value: '01234-567' },
    });

    // Anexos (cartão cnpj e contrato social)
    const cartao = new File(['dummy'], 'cnpj.pdf', { type: 'application/pdf' });
    const contrato = new File(['dummy'], 'cont.pdf', {
      type: 'application/pdf',
    });

    fireEvent.change(screen.getByLabelText('Cartão CNPJ'), {
      target: { files: [cartao] },
    });
    fireEvent.change(screen.getByLabelText('Contrato Social'), {
      target: { files: [contrato] },
    });

    // Próximo para responsavel
    fireEvent.click(screen.getByText('Próximo'));

    // Preencher responsável
    fireEvent.change(screen.getByLabelText('Nome Completo'), {
      target: { value: 'João' },
    });
    fireEvent.change(screen.getByLabelText('CPF'), {
      target: { value: '123.456.789-09' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'j@j.com' },
    });
    fireEvent.change(screen.getByLabelText('Celular'), {
      target: { value: '(11) 99999-9999' },
    });

    const doc = new File(['id'], 'id.pdf', { type: 'application/pdf' });
    fireEvent.change(screen.getByLabelText('Documento de Identificação'), {
      target: { files: [doc] },
    });

    // Avançar (isso gera contrato automático para plano fixo e pulará para confirmação)
    fireEvent.click(screen.getByText('Próximo'));

    // Confirmar checkbox final
    const confirmCheckbox = screen.getByRole('checkbox', {
      name: /Confirmo que revisei todos os dados/i,
    });
    fireEvent.click(confirmCheckbox);

    // Enviar
    const enviarBtn = screen.getByText('Confirmar e Enviar');
    fireEvent.click(enviarBtn);

    // Fazer os timers avançarem (setTimeout do redirect)
    jest.runAllTimers();

    // Verificar que a API de envio foi chamada
    await waitFor(() => {
      expect(enviarSpy).toHaveBeenCalled();
    });
  }, 20000);

  test('fluxo permite prosseguir sem anexos quando NEXT_PUBLIC_DISABLE_ANEXOS=true', async () => {
    jest.useFakeTimers();
    const prev = process.env.NEXT_PUBLIC_DISABLE_ANEXOS;
    process.env.NEXT_PUBLIC_DISABLE_ANEXOS = 'true';

    try {
      const onClose = jest.fn();
      render(
        <ModalCadastroContratante
          isOpen={true}
          onClose={onClose}
          tipo="entidade"
        />
      );

      // Aguarda planos carregarem
      await waitFor(() => {
        expect(screen.getAllByTestId('plano-card').length).toBeGreaterThan(0);
      });

      const planos = screen.getAllByTestId('plano-card');
      fireEvent.click(planos[0]);

      // Avançar para dados
      const proximo = screen.getByText('Próximo');
      fireEvent.click(proximo);

      // Preencher dados obrigatórios (sem anexos)
      fireEvent.change(screen.getByLabelText('Razão Social'), {
        target: { value: 'ACME' },
      });
      fireEvent.change(screen.getByLabelText('CNPJ'), {
        target: { value: '11.444.777/0001-61' },
      });
      fireEvent.change(screen.getByLabelText('Email'), {
        target: { value: 'a@a.com' },
      });
      fireEvent.change(screen.getByLabelText('Telefone'), {
        target: { value: '(11) 99999-9999' },
      });
      fireEvent.change(screen.getByLabelText('Endereço'), {
        target: { value: 'Rua X' },
      });
      fireEvent.change(screen.getByLabelText('Cidade'), {
        target: { value: 'São Paulo' },
      });
      fireEvent.change(screen.getByLabelText('Estado (UF)'), {
        target: { value: 'SP' },
      });
      fireEvent.change(screen.getByLabelText('CEP'), {
        target: { value: '01234-567' },
      });

      // Aviso aparece e inputs de arquivo estão desabilitados
      expect(
        screen.getByText(/Uploads estão temporariamente desabilitados/i)
      ).toBeInTheDocument();
      expect(
        (screen.getByLabelText('Cartão CNPJ') as HTMLInputElement).disabled
      ).toBe(true);
      expect(
        (screen.getByLabelText('Contrato Social') as HTMLInputElement).disabled
      ).toBe(true);

      // Avançar para responsável (sem anexos enviados)
      fireEvent.click(screen.getByText('Próximo'));

      // Preencher responsável (sem doc)
      fireEvent.change(screen.getByLabelText('Nome Completo'), {
        target: { value: 'João' },
      });
      fireEvent.change(screen.getByLabelText('CPF'), {
        target: { value: '123.456.789-09' },
      });
      fireEvent.change(screen.getByLabelText('Email'), {
        target: { value: 'j@j.com' },
      });
      fireEvent.change(screen.getByLabelText('Celular'), {
        target: { value: '(11) 99999-9999' },
      });

      // Avançar (gera contrato para plano fixo)
      fireEvent.click(screen.getByText('Próximo'));

      // Confirmar e enviar
      const confirmCheckbox = screen.getByRole('checkbox', {
        name: /Confirmo que revisei todos os dados/i,
      });
      fireEvent.click(confirmCheckbox);

      fireEvent.click(screen.getByText('Confirmar e Enviar'));

      jest.runAllTimers();

      await waitFor(() => {
        expect(enviarSpy).toHaveBeenCalled();
      });
    } finally {
      process.env.NEXT_PUBLIC_DISABLE_ANEXOS = prev;
    }
  }, 20000);
});
