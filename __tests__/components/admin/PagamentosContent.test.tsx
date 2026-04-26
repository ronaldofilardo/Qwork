/**
 * Testes: PagamentosContent — botão "Verificar Pagamento" e auto-reconciliação
 *
 * Data: 18/02/2026
 * Contexto: Adição do botão "Verificar Pagamento" para lotes aguardando_pagamento
 *   e auto-reconciliação silenciosa ao entrar na tab correspondente.
 *
 * O que estes testes garantem:
 *  1. Renderiza tab "Aguardando Pagamento" com contagem correta
 *  2. Lote aguardando_pagamento exibe botão "Ver Link / QR Code"
 *  3. Lote aguardando_pagamento exibe botão "Verificar Pagamento" (nova adição)
 *  4. Lote pago NÃO exibe botão "Verificar Pagamento"
 *  5. Clique em "Verificar Pagamento" chama POST /api/pagamento/asaas/sincronizar-lote
 *  6. Quando synced=true → recarrega a lista (chama /api/admin/emissoes novamente)
 *  7. Quando synced=false → exibe mensagem informativa (alert)
 *  8. Auto-reconciliação: ao entrar na tab aguardando_pagamento, chama sincronizar-lote
 *     para cada lote pendente silenciosamente
 *
 * @see components/admin/PagamentosContent.tsx
 */

import React from 'react';
import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from '@testing-library/react';
import PagamentosContent from '@/components/admin/PagamentosContent';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const makeSolicitacao = (overrides: Partial<Record<string, any>> = {}) => ({
  lote_id: 100,
  status_pagamento: 'aguardando_pagamento',
  solicitacao_emissao_em: '2026-02-17T10:00:00Z',
  valor_por_funcionario: 50,
  link_pagamento_token: 'tok_test',
  link_pagamento_enviado_em: '2026-02-17T10:05:00Z',
  pagamento_metodo: 'boleto',
  pagamento_parcelas: null,
  pago_em: null,
  empresa_nome: 'Empresa Teste',
  nome_tomador: 'Tomador Teste',
  solicitante_nome: 'Solicitante Teste',
  solicitante_cpf: '00000000000',
  num_avaliacoes_concluidas: 5,
  num_avaliacoes_cobradas: 5,
  valor_total_calculado: 250,
  lote_criado_em: '2026-02-17T09:00:00Z',
  lote_liberado_em: '2026-02-17T09:30:00Z',
  lote_status: 'pendente_liberacao',
  ...overrides,
});

const MOCK_SOLICITACOES_PENDENTES = [makeSolicitacao({ lote_id: 100 })];

const MOCK_SOLICITACOES_MISTAS = [
  makeSolicitacao({ lote_id: 100, status_pagamento: 'aguardando_pagamento' }),
  makeSolicitacao({
    lote_id: 200,
    status_pagamento: 'pago',
    pago_em: '2026-02-17T15:00:00Z',
    pagamento_metodo: 'pix',
  }),
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function setupFetch(
  responses: { url: RegExp | string; response: object; ok?: boolean }[]
) {
  return jest.spyOn(global, 'fetch').mockImplementation(async (url) => {
    const urlStr = String(url);
    const matched = responses.find((r) => {
      if (typeof r.url === 'string') return urlStr.includes(r.url);
      return r.url.test(urlStr);
    });

    return {
      ok: matched?.ok ?? true,
      json: async () => matched?.response ?? {},
    } as unknown as Response;
  });
}

// ── Testes ─────────────────────────────────────────────────────────────────────

describe('PagamentosContent — tab aguardando_pagamento', () => {
  let alertMock: jest.SpyInstance;

  beforeEach(() => {
    alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('exibe a tab "Aguardando Pagamento" com contagem correta', async () => {
    setupFetch([
      {
        url: '/api/admin/emissoes',
        response: { solicitacoes: MOCK_SOLICITACOES_PENDENTES, total: 1 },
      },
    ]);

    render(<PagamentosContent />);

    // Aguarda carregamento
    await waitFor(() =>
      expect(
        screen.queryByText('Carregando solicitações...')
      ).not.toBeInTheDocument()
    );

    // Aba de aguardando_pagamento deve mostrar contagem 1
    const tabs = screen.getAllByRole('button');
    const tabAguardando = tabs.find((t) =>
      t.textContent?.includes('Aguardando Pagamento')
    );
    expect(tabAguardando).toBeDefined();
    expect(tabAguardando?.textContent).toContain('1');
  });

  it('lote aguardando_pagamento exibe botão "Ver Link / QR Code"', async () => {
    setupFetch([
      {
        url: '/api/admin/emissoes',
        response: { solicitacoes: MOCK_SOLICITACOES_PENDENTES, total: 1 },
      },
    ]);

    render(<PagamentosContent />);

    await waitFor(() =>
      expect(
        screen.queryByText('Carregando solicitações...')
      ).not.toBeInTheDocument()
    );

    // Navega para a tab aguardando_pagamento
    const tabBtn = screen
      .getAllByRole('button')
      .find((b) => b.textContent?.includes('Aguardando Pagamento'));
    fireEvent.click(tabBtn);

    expect(await screen.findByText(/Ver Link/i)).toBeInTheDocument();
  });

  it('[NOVO] lote aguardando_pagamento exibe botão "Verificar Pagamento"', async () => {
    setupFetch([
      {
        url: '/api/admin/emissoes',
        response: { solicitacoes: MOCK_SOLICITACOES_PENDENTES, total: 1 },
      },
    ]);

    render(<PagamentosContent />);

    await waitFor(() =>
      expect(
        screen.queryByText('Carregando solicitações...')
      ).not.toBeInTheDocument()
    );

    const tabBtn = screen
      .getAllByRole('button')
      .find((b) => b.textContent?.includes('Aguardando Pagamento'));
    fireEvent.click(tabBtn);

    expect(await screen.findByText(/Verificar Pagamento/i)).toBeInTheDocument();
  });

  it('prioriza a quantidade de avaliações cobradas quando ela diverge das concluídas', async () => {
    setupFetch([
      {
        url: '/api/admin/emissoes',
        response: {
          solicitacoes: [
            makeSolicitacao({
              lote_id: 321,
              status_pagamento: 'aguardando_pagamento',
              num_avaliacoes_concluidas: 3,
              num_avaliacoes_cobradas: 4,
              valor_total_calculado: 48,
              valor_por_funcionario: 12,
            }),
          ],
          total: 1,
        },
      },
    ]);

    render(<PagamentosContent />);

    await waitFor(() =>
      expect(
        screen.queryByText('Carregando solicitações...')
      ).not.toBeInTheDocument()
    );

    const tabBtn = screen
      .getAllByRole('button')
      .find((b) => b.textContent?.includes('Aguardando Pagamento'));
    fireEvent.click(tabBtn);

    const lote = await screen.findByText('Lote #321');
    const card = lote.closest('.bg-white');
    expect(card?.textContent).toContain('Avaliações:4');
    expect(card?.textContent).toContain('R$ 48,00');
  });

  it('lote pago NÃO exibe botão "Verificar Pagamento"', async () => {
    setupFetch([
      {
        url: '/api/admin/emissoes',
        response: { solicitacoes: MOCK_SOLICITACOES_MISTAS, total: 2 },
      },
    ]);

    render(<PagamentosContent />);

    await waitFor(() =>
      expect(
        screen.queryByText('Carregando solicitações...')
      ).not.toBeInTheDocument()
    );

    // Navega para tab "Pagos"
    const tabBtn = screen
      .getAllByRole('button')
      .find((b) => b.textContent?.includes('Pagos'));
    fireEvent.click(tabBtn);

    await waitFor(() => {
      expect(
        screen.queryByText(/Verificar Pagamento/i)
      ).not.toBeInTheDocument();
    });
  });

  it('[NOVO] clique em "Verificar Pagamento" chama POST /api/pagamento/asaas/sincronizar-lote', async () => {
    const fetchMock = setupFetch([
      {
        url: '/api/admin/emissoes',
        response: { solicitacoes: MOCK_SOLICITACOES_PENDENTES, total: 1 },
      },
      {
        url: '/api/pagamento/asaas/sincronizar-lote',
        response: {
          synced: false,
          status_pagamento: 'aguardando_pagamento',
          message: 'Ainda não confirmado',
        },
      },
    ]);

    render(<PagamentosContent />);

    await waitFor(() =>
      expect(
        screen.queryByText('Carregando solicitações...')
      ).not.toBeInTheDocument()
    );

    const tabBtn = screen
      .getAllByRole('button')
      .find((b) => b.textContent?.includes('Aguardando Pagamento'));
    fireEvent.click(tabBtn);

    const verificarBtn = await screen.findByText(/Verificar Pagamento/i);
    await act(async () => {
      fireEvent.click(verificarBtn);
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/pagamento/asaas/sincronizar-lote',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"lote_id":100'),
        })
      );
    });
  });

  it('[NOVO] quando synced=true → recarrega lista (chama /api/admin/emissoes novamente)', async () => {
    const fetchMock = setupFetch([
      {
        url: '/api/admin/emissoes',
        response: { solicitacoes: MOCK_SOLICITACOES_PENDENTES, total: 1 },
      },
      {
        url: '/api/pagamento/asaas/sincronizar-lote',
        response: {
          synced: true,
          status_pagamento: 'pago',
          message: 'Sincronizado',
        },
      },
    ]);

    render(<PagamentosContent />);

    await waitFor(() =>
      expect(
        screen.queryByText('Carregando solicitações...')
      ).not.toBeInTheDocument()
    );

    const tabBtn = screen
      .getAllByRole('button')
      .find((b) => b.textContent?.includes('Aguardando Pagamento'));
    fireEvent.click(tabBtn);

    const verificarBtn = await screen.findByText(/Verificar Pagamento/i);
    await act(async () => {
      fireEvent.click(verificarBtn);
    });

    await waitFor(() => {
      // /api/admin/emissoes deve ter sido chamado 2x: carregamento inicial + reload após sync
      const emissoesCalls = (fetchMock.mock.calls as string[][]).filter(
        (args) => String(args[0]).includes('/api/admin/emissoes')
      );
      expect(emissoesCalls.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('[NOVO] quando synced=false → exibe alert com mensagem informativa', async () => {
    setupFetch([
      {
        url: '/api/admin/emissoes',
        response: { solicitacoes: MOCK_SOLICITACOES_PENDENTES, total: 1 },
      },
      {
        url: '/api/pagamento/asaas/sincronizar-lote',
        response: {
          synced: false,
          status_pagamento: 'aguardando_pagamento',
          message: 'Pagamento ainda não confirmado no Asaas',
        },
      },
    ]);

    render(<PagamentosContent />);

    await waitFor(() =>
      expect(
        screen.queryByText('Carregando solicitações...')
      ).not.toBeInTheDocument()
    );

    const tabBtn = screen
      .getAllByRole('button')
      .find((b) => b.textContent?.includes('Aguardando Pagamento'));
    fireEvent.click(tabBtn);

    const verificarBtn = await screen.findByText(/Verificar Pagamento/i);
    await act(async () => {
      fireEvent.click(verificarBtn);
    });

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith(
        expect.stringContaining('Pagamento ainda não confirmado no Asaas')
      );
    });
  });
});

describe('PagamentosContent — auto-reconciliação ao entrar na tab aguardando_pagamento', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('[NOVO] ao clicar na tab aguardando_pagamento, chama sincronizar-lote para cada lote pendente', async () => {
    const twoPending = [
      makeSolicitacao({
        lote_id: 101,
        status_pagamento: 'aguardando_pagamento',
      }),
      makeSolicitacao({
        lote_id: 102,
        status_pagamento: 'aguardando_pagamento',
      }),
    ];

    const fetchMock = setupFetch([
      {
        url: '/api/admin/emissoes',
        response: { solicitacoes: twoPending, total: 2 },
      },
      {
        url: '/api/pagamento/asaas/sincronizar-lote',
        response: {
          synced: false,
          status_pagamento: 'aguardando_pagamento',
          message: 'Não confirmado',
        },
      },
    ]);

    render(<PagamentosContent />);

    // Aguarda carregamento inicial (padrão: tab aguardando_cobranca)
    await waitFor(() =>
      expect(
        screen.queryByText('Carregando solicitações...')
      ).not.toBeInTheDocument()
    );

    // Muda para tab aguardando_pagamento → dispara auto-reconciliação
    const tabBtn = screen
      .getAllByRole('button')
      .find((b) => b.textContent?.includes('Aguardando Pagamento'));
    await act(async () => {
      fireEvent.click(tabBtn);
    });

    await waitFor(() => {
      const reconcileCalls = (fetchMock.mock.calls as string[][]).filter(
        (args) =>
          String(args[0]).includes('/api/pagamento/asaas/sincronizar-lote')
      );
      // Deve chamar uma vez por lote pendente (101 e 102)
      expect(reconcileCalls.length).toBe(2);
    });
  });

  it('[NOVO] se auto-reconciliação sincroniza algum lote, recarrega a lista', async () => {
    const onePending = [
      makeSolicitacao({
        lote_id: 103,
        status_pagamento: 'aguardando_pagamento',
      }),
    ];

    const fetchMock = setupFetch([
      {
        url: '/api/admin/emissoes',
        response: { solicitacoes: onePending, total: 1 },
      },
      {
        url: '/api/pagamento/asaas/sincronizar-lote',
        response: {
          synced: true,
          status_pagamento: 'pago',
          message: 'Sincronizado',
        },
      },
    ]);

    render(<PagamentosContent />);

    await waitFor(() =>
      expect(
        screen.queryByText('Carregando solicitações...')
      ).not.toBeInTheDocument()
    );

    const tabBtn = screen
      .getAllByRole('button')
      .find((b) => b.textContent?.includes('Aguardando Pagamento'));
    await act(async () => {
      fireEvent.click(tabBtn);
    });

    await waitFor(() => {
      const emissoesCalls = (fetchMock.mock.calls as string[][]).filter(
        (args) => String(args[0]).includes('/api/admin/emissoes')
      );
      // 1 carregamento inicial + 1 reload pós-sync
      expect(emissoesCalls.length).toBeGreaterThanOrEqual(2);
    });
  });
});
