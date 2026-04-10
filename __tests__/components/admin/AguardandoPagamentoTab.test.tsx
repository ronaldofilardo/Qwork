/**
 * @fileoverview Testes do componente AguardandoPagamentoTab — coluna Taxas (TaxaCard)
 * @description Valida renderização, estados e ações do TaxaCard dentro da tab
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { AguardandoPagamentoTab } from '@/components/admin/pagamentos/AguardandoPagamentoTab';

jest.mock('@/components/admin/pagamentos/SolicitacaoCard', () => ({
  SolicitacaoCard: () => <div data-testid="solicitacao-card" />,
}));

jest.mock('@/components/modals/ModalLinkPagamentoEmissao', () =>
  function MockModal({ isOpen }: { isOpen: boolean }) {
    return isOpen ? <div data-testid="modal-link" /> : null;
  }
);

// Mock QRCode evitando dependência de canvas
jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mock'),
}));

const defaultProps = {
  solicitacoes: [],
  processando: null,
  valorInput: {},
  setValorInput: jest.fn(),
  codigoRepInput: {},
  setCodigoRepInput: jest.fn(),
  onDefinirValor: jest.fn(),
  onGerarLink: jest.fn(),
  onVerLink: jest.fn(),
  onVerificarPagamento: jest.fn(),
  onDisponibilizarLink: jest.fn(),
  onVincularRepresentante: jest.fn(),
  onGerarComissao: jest.fn(),
  formatCurrency: (v: number | null) => `R$ ${v ?? 0}`,
  formatDate: (d: string | null) => d ?? '',
};

const taxaPendente = {
  tipo: 'entidade' as const,
  id: 5,
  pagamento_id: 10,
  nome: 'Entidade Teste',
  cnpj: '12345678000100',
  clinica_nome: null,
  valor: 250,
  status: 'pendente',
  criado_em: '2026-04-01T00:00:00Z',
  link_pagamento_token: null,
  link_disponibilizado_em: null,
};

const taxaComToken = {
  ...taxaPendente,
  link_pagamento_token: 'tok-abc-123',
  status: 'aguardando_pagamento',
};

const taxaDisponibilizada = {
  ...taxaComToken,
  link_disponibilizado_em: '2026-04-03T10:00:00Z',
};

function setupFetch(responses: { url: RegExp | string; response: object; ok?: boolean }[]) {
  return jest.spyOn(global, 'fetch').mockImplementation(async (url) => {
    const urlStr = String(url);
    const matched = responses.find((r) =>
      typeof r.url === 'string' ? urlStr.includes(r.url) : r.url.test(urlStr)
    );
    const { response, ok = true } = matched ?? { response: {}, ok: false };
    return {
      ok,
      json: async () => response,
    } as Response;
  });
}

describe('AguardandoPagamentoTab — coluna Taxas (TaxaCard)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('exibe spinner de loading enquanto taxas carregam', () => {
    setupFetch([]); // não resolve imediatamente
    render(<AguardandoPagamentoTab {...defaultProps} />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('exibe mensagem "Nenhuma taxa aguardando pagamento" quando lista vazia', async () => {
    setupFetch([{ url: '/api/admin/manutencao/aguardando-quitacao', response: { pagamentos: [], total: 0 } }]);
    render(<AguardandoPagamentoTab {...defaultProps} />);
    await waitFor(() =>
      expect(screen.getByText(/Nenhuma taxa aguardando pagamento/i)).toBeInTheDocument()
    );
  });

  it('renderiza TaxaCard com botão "Gerar Link de Pagamento" para taxa sem token', async () => {
    setupFetch([
      { url: '/api/admin/manutencao/aguardando-quitacao', response: { pagamentos: [taxaPendente], total: 1 } },
    ]);
    render(<AguardandoPagamentoTab {...defaultProps} />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Gerar Link de Pagamento/i })).toBeInTheDocument()
    );
    expect(screen.getByText('Entidade Teste')).toBeInTheDocument();
    expect(screen.getByText('Manutenção Anual')).toBeInTheDocument();
    expect(screen.getByText(/250,00/)).toBeInTheDocument();
  });

  it('renderiza TaxaCard com botões "Ver Link" e "Verificar Pagamento" para taxa com token', async () => {
    setupFetch([
      { url: '/api/admin/manutencao/aguardando-quitacao', response: { pagamentos: [taxaComToken], total: 1 } },
    ]);
    render(<AguardandoPagamentoTab {...defaultProps} />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Ver Link \/ QR Code/i })).toBeInTheDocument()
    );
    expect(screen.getByRole('button', { name: /Verificar Pagamento/i })).toBeInTheDocument();
    expect(screen.getByText(/Link pronto para disponibilizar/i)).toBeInTheDocument();
  });

  it('exibe "✓ Disponibilizado em" para taxa já disponibilizada', async () => {
    setupFetch([
      { url: '/api/admin/manutencao/aguardando-quitacao', response: { pagamentos: [taxaDisponibilizada], total: 1 } },
    ]);
    render(<AguardandoPagamentoTab {...defaultProps} />);
    await waitFor(() =>
      expect(screen.getByText(/Disponibilizado em/i)).toBeInTheDocument()
    );
  });

  it('chama POST gerar-link e abre modal ao clicar "Gerar Link de Pagamento"', async () => {
    const fetchSpy = setupFetch([
      { url: 'aguardando-quitacao', response: { pagamentos: [taxaPendente], total: 1 } },
      { url: 'gerar-link', response: { success: true, token: 'new-tok', valor: 250, nome: 'Entidade Teste' } },
    ]);

    render(<AguardandoPagamentoTab {...defaultProps} />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Gerar Link de Pagamento/i })).toBeInTheDocument()
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Gerar Link de Pagamento/i }));
    });

    await waitFor(() => expect(screen.getByTestId('modal-link')).toBeInTheDocument());
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('gerar-link'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('abre modal ao clicar "Ver Link / QR Code"', async () => {
    setupFetch([
      { url: 'aguardando-quitacao', response: { pagamentos: [taxaComToken], total: 1 } },
    ]);
    render(<AguardandoPagamentoTab {...defaultProps} />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Ver Link \/ QR Code/i })).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole('button', { name: /Ver Link \/ QR Code/i }));
    expect(screen.getByTestId('modal-link')).toBeInTheDocument();
  });

  it('chama POST disponibilizar ao clicar "Disponibilizar"', async () => {
    const fetchSpy = setupFetch([
      { url: 'aguardando-quitacao', response: { pagamentos: [taxaComToken], total: 1 } },
      { url: 'disponibilizar', response: { success: true, link_disponibilizado_em: '2026-04-10T12:00:00Z' } },
    ]);

    render(<AguardandoPagamentoTab {...defaultProps} />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /^Disponibilizar$/i })).toBeInTheDocument()
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^Disponibilizar$/i }));
    });

    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('disponibilizar'),
        expect.objectContaining({ method: 'POST' })
      )
    );
  });
});
