import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ModalPagamento from '@/components/modals/ModalPagamento';

describe('ModalPagamento - simulação de pagamento (dev)', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('inicia pagamento (se necessário) e chama endpoint de simulação', async () => {
    const mockFetch = jest.fn((url, opts) => {
      // iniciar pagamento
      if (
        url === '/api/pagamento' &&
        opts.method === 'POST' &&
        JSON.parse(opts.body).acao === 'iniciar'
      ) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ pagamento: { id: 42 } }),
        });
      }

      // simular pagamento
      if (url === '/api/pagamento/simular') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              message: 'Pagamento simulado com sucesso',
              tomador_id: 10,
            }),
        });
      }

      // confirmar (não é usado aqui)
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }) as jest.Mock;

    global.fetch = mockFetch;

    const onPagamentoConfirmado = jest.fn();

    render(
      <ModalPagamento
        isOpen={true}
        onClose={() => {}}
        tomadorId={10}
        contratoId={99}
        valor={499}
        planoNome="Plano Básico"
        onPagamentoConfirmado={onPagamentoConfirmado}
        initialMetodo={'pix'}
      />
    );

    // selecionar método PIX (definir input radio diretamente)
    const pixInput = document.querySelector(
      'input[name="metodo"][value="pix"]'
    );
    expect(pixInput).toBeTruthy();
    if (pixInput) {
      userEvent.click(pixInput);
    }

    // garantir que o método foi definido
    await waitFor(() =>
      expect(screen.getByTestId('metodo-selecionado')).toHaveTextContent('pix')
    );

    // clicar em Simular Pagamento (esperar botão habilitado)
    const simBtn = await screen.findByRole('button', {
      name: /Simular Pagamento/i,
    });

    await waitFor(() => expect(simBtn).not.toBeDisabled());

    userEvent.click(simBtn);

    // espera pelo indicador de sucesso
    await waitFor(
      () =>
        expect(screen.getByText(/Pagamento Confirmado!/i)).toBeInTheDocument(),
      { timeout: 3000 }
    );

    // esperar callback (chamada via setTimeout no componente)
    await waitFor(() => expect(onPagamentoConfirmado).toHaveBeenCalled(), {
      timeout: 2000,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/pagamento/simular',
      expect.anything()
    );

    // ------------------------------------------------------------------
    // Novo teste: fluxo completo (iniciar + confirmar) exibe proximos_passos
    // ------------------------------------------------------------------

    const mockFetchFull = jest.fn((url, opts) => {
      if (
        url === '/api/pagamento' &&
        opts.method === 'POST' &&
        JSON.parse(opts.body).acao === 'iniciar'
      ) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ pagamento: { id: 99 } }),
        });
      }

      if (
        url === '/api/pagamento' &&
        opts.method === 'POST' &&
        JSON.parse(opts.body).acao === 'confirmar'
      ) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              proximos_passos: [
                'Acesso ao sistema liberado',
                'Faça login com suas credenciais',
                'Recibo disponível em: Informações da Conta > Plano > Baixar Comprovante',
              ],
            }),
        });
      }

      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }) as jest.Mock;

    global.fetch = mockFetchFull;

    // Abrir novo modal e realizar pagamento real
    render(
      <ModalPagamento
        isOpen={true}
        onClose={() => {}}
        tomadorId={10}
        contratoId={99}
        valor={499}
        planoNome="Plano Básico"
        onPagamentoConfirmado={() => {}}
        initialMetodo={null}
      />
    );

    // selecionar método PIX
    const pixInput2 = document.querySelector(
      'input[name="metodo"][value="pix"]'
    );
    if (pixInput2) userEvent.click(pixInput2);

    // clicar em Realizar Pagamento
    const realizarBtn = await screen.findByRole('button', {
      name: /Realizar Pagamento/i,
    });
    userEvent.click(realizarBtn);

    // esperar pelo texto de sucesso e pela mensagem do servidor
    await waitFor(
      () =>
        expect(screen.getByText(/Pagamento Confirmado!/i)).toBeInTheDocument(),
      { timeout: 4000 }
    );

    await waitFor(
      () =>
        expect(
          screen.getByText(/Acesso ao sistema liberado/i)
        ).toBeInTheDocument(),
      { timeout: 4000 }
    );
  });
});
