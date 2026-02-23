/**
 * Testes: CheckoutAsaas — tela de boleto
 *
 * Data: 18/02/2026
 * Contexto: A tela de boleto foi atualizada para exibir:
 *   1. Spinner de monitoramento quando pollingPayment=true
 *   2. Botão "Já paguei — Verificar Confirmação" que chama /api/pagamento/asaas/sincronizar
 *
 * Estratégia: renderizar o componente até a tela de boleto ser exibida
 *   (após mock do fetch de /api/pagamento/asaas/criar), depois testar as
 *   novas funcionalidades.
 *
 * @see components/CheckoutAsaas.tsx
 */

import React from 'react';
import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from '@testing-library/react';
import CheckoutAsaas from '@/components/CheckoutAsaas';

// ── Fixtures ───────────────────────────────────────────────────────────────────

const BASE_PAYMENT_RESPONSE = {
  pagamento: {
    id: 42,
    status: 'pendente',
    asaas_payment_id: 'pay_test_boleto_42',
  },
  bankSlipUrl: 'https://sandbox.asaas.com/boleto/test',
  paymentUrl: 'https://sandbox.asaas.com/checkout/test',
  dueDate: '2026-02-20',
  billingType: 'BOLETO',
};

const DEFAULT_PROPS = {
  tomadorId: 1,
  planoId: 1,
  valor: 250,
};

// ── Helpers ────────────────────────────────────────────────────────────────────

async function renderBoletoScreen(
  opts: {
    sincronizarResponse?: object;
  } = {}
) {
  const sincronizarResponse = opts.sincronizarResponse ?? {
    status: 'pendente',
    synced: false,
  };

  const fetchMock = jest
    .spyOn(global, 'fetch')
    .mockImplementation(async (url) => {
      const urlStr = String(url);

      if (urlStr.includes('/api/pagamento/asaas/criar')) {
        return {
          ok: true,
          json: async () => BASE_PAYMENT_RESPONSE,
        } as unknown as Response;
      }

      if (urlStr.includes('/api/pagamento/asaas/sincronizar')) {
        return {
          ok: true,
          json: async () => sincronizarResponse,
        } as unknown as Response;
      }

      return { ok: true, json: async () => ({}) } as unknown as Response;
    });

  render(<CheckoutAsaas {...DEFAULT_PROPS} />);

  // Selecionar BOLETO (pode já estar selecionado via estado interno)
  // O teste verifica se há o radio BOLETO e o clica
  const boletoOption = await screen.findByDisplayValue('BOLETO');
  fireEvent.click(boletoOption);

  // Clicar em "Continuar para Pagamento"
  const continueBtn = screen.getByRole('button', {
    name: /Continuar para Pagamento/i,
  });
  await act(async () => {
    fireEvent.click(continueBtn);
  });

  // Aguardar tela de boleto aparecer
  await screen.findByText(/Boleto Gerado/i);

  return fetchMock;
}

// ── Testes ─────────────────────────────────────────────────────────────────────

describe('CheckoutAsaas — tela de boleto (boleto gerado)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('exibe título "Boleto Gerado" e link para visualizar', async () => {
    await renderBoletoScreen();

    expect(screen.getByText(/Boleto Gerado/i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Visualizar Boleto/i })
    ).toBeInTheDocument();
  });

  it('[NOVO] exibe botão "Já paguei — Verificar Confirmação"', async () => {
    await renderBoletoScreen();

    expect(
      screen.getByRole('button', { name: /Já paguei.*Verificar Confirmação/i })
    ).toBeInTheDocument();
  });

  it('[NOVO] exibe indicador de monitoramento automático (spinner)', async () => {
    await renderBoletoScreen();

    // O polling é iniciado automaticamente ao gerar o boleto
    expect(
      screen.getByText(/Monitorando pagamento automaticamente/i)
    ).toBeInTheDocument();
  });

  it('[NOVO] clique em "Verificar Confirmação" chama /api/pagamento/asaas/sincronizar com pagamento_id=42', async () => {
    const fetchMock = await renderBoletoScreen({
      sincronizarResponse: { status: 'pendente', synced: false },
    });

    const verificarBtn = screen.getByRole('button', {
      name: /Já paguei.*Verificar Confirmação/i,
    });

    await act(async () => {
      fireEvent.click(verificarBtn);
    });

    await waitFor(() => {
      const sincronizarCalls = (fetchMock.mock.calls as string[][]).filter(
        (args) => String(args[0]).includes('/api/pagamento/asaas/sincronizar')
      );
      expect(sincronizarCalls.length).toBeGreaterThanOrEqual(1);

      const lastCall = sincronizarCalls[sincronizarCalls.length - 1];
      const body = JSON.parse(String(lastCall[1]?.body ?? '{}'));
      expect(body.pagamento_id).toBe(42);
    });
  });

  it('[NOVO] quando sincronizar retorna status=pendente, onSuccess NÃO é chamado', async () => {
    const onSuccess = jest.fn();

    jest.spyOn(global, 'fetch').mockImplementation(async (url) => {
      const urlStr = String(url);
      if (urlStr.includes('/api/pagamento/asaas/criar')) {
        return {
          ok: true,
          json: async () => BASE_PAYMENT_RESPONSE,
        } as unknown as Response;
      }
      if (urlStr.includes('/api/pagamento/asaas/sincronizar')) {
        return {
          ok: true,
          json: async () => ({ status: 'pendente', synced: false }),
        } as unknown as Response;
      }
      return { ok: true, json: async () => ({}) } as unknown as Response;
    });

    render(<CheckoutAsaas {...DEFAULT_PROPS} onSuccess={onSuccess} />);

    const boletoOption = await screen.findByDisplayValue('BOLETO');
    fireEvent.click(boletoOption);

    const continueBtn = screen.getByRole('button', {
      name: /Continuar para Pagamento/i,
    });
    await act(async () => {
      fireEvent.click(continueBtn);
    });

    await screen.findByText(/Boleto Gerado/i);

    const verificarBtn = screen.getByRole('button', {
      name: /Já paguei.*Verificar Confirmação/i,
    });

    await act(async () => {
      fireEvent.click(verificarBtn);
    });

    // Aguarda processamento completo — onSuccess não pode ter sido chamado
    await waitFor(() => {
      expect(
        screen.getByRole('button', {
          name: /Já paguei.*Verificar Confirmação/i,
        })
      ).toBeInTheDocument();
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('[NOVO] quando sincronizar retorna status=pago, chama onSuccess se fornecido', async () => {
    const onSuccess = jest.fn();

    jest.spyOn(global, 'fetch').mockImplementation(async (url) => {
      const urlStr = String(url);
      if (urlStr.includes('/api/pagamento/asaas/criar')) {
        return {
          ok: true,
          json: async () => BASE_PAYMENT_RESPONSE,
        } as unknown as Response;
      }
      if (urlStr.includes('/api/pagamento/asaas/sincronizar')) {
        return {
          ok: true,
          json: async () => ({ status: 'pago', synced: true }),
        } as unknown as Response;
      }
      return { ok: true, json: async () => ({}) } as unknown as Response;
    });

    render(<CheckoutAsaas {...DEFAULT_PROPS} onSuccess={onSuccess} />);

    const boletoOption = await screen.findByDisplayValue('BOLETO');
    fireEvent.click(boletoOption);

    const continueBtn = screen.getByRole('button', {
      name: /Continuar para Pagamento/i,
    });
    await act(async () => {
      fireEvent.click(continueBtn);
    });

    await screen.findByText(/Boleto Gerado/i);

    const verificarBtn = screen.getByRole('button', {
      name: /Já paguei.*Verificar Confirmação/i,
    });

    await act(async () => {
      fireEvent.click(verificarBtn);
    });

    await waitFor(
      () => {
        expect(onSuccess).toHaveBeenCalledTimes(1);
      },
      { timeout: 4000 } // aguarda o setTimeout de 2000ms + margem
    );
  });

  it('[NOVO] link "Visualizar Boleto" aponta para a URL do boleto', async () => {
    await renderBoletoScreen();

    const link = screen.getByRole('link', { name: /Visualizar Boleto/i });
    expect(link.getAttribute('href')).toBe(BASE_PAYMENT_RESPONSE.bankSlipUrl);
  });

  it('botão "← Voltar" volta para a seleção de forma', async () => {
    await renderBoletoScreen();

    const voltarBtn = screen.getByRole('button', { name: /←.*Voltar/i });
    await act(async () => {
      fireEvent.click(voltarBtn);
    });

    // Volta para a tela de seleção
    await screen.findByText(/Finalizar Pagamento/i);
  });
});
