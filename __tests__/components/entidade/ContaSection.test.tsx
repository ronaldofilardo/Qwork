import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import EntidadeContaSection from '@/components/entidade/ContaSection';

// Mock dos componentes filhos
jest.mock('@/components/payments/PaymentItem', () => {
  return function MockPaymentItem({ pagamento }: any) {
    return (
      <div data-testid={`payment-${pagamento.id}`}>
        Pagamento #{pagamento.id} - R$ {pagamento.valor}
      </div>
    );
  };
});

jest.mock('@/components/payments/PaymentSummaryCard', () => {
  return function MockPaymentSummaryCard({ total, pago, restante }: any) {
    return (
      <div data-testid="payment-summary">
        Total: {total} | Pago: {pago} | Pendente: {restante}
      </div>
    );
  };
});

jest.mock('@/components/modals/ModalContrato', () => {
  return function MockModalContrato({ isOpen, onClose, contratoId }: any) {
    if (!isOpen) return null;
    return (
      <div data-testid="modal-contrato">
        Modal - Contrato {contratoId}
        <button onClick={onClose}>Fechar</button>
      </div>
    );
  };
});

describe('EntidadeContaSection', () => {
  const mockAccountData = {
    nome: 'Clínica Teste',
    cnpj: '12.345.678/0001-90',
    email: 'contato@clinica.com',
    telefone: '(11) 98765-4321',
    criado_em: '2025-01-01T10:00:00Z',
    contrato: {
      id: 10,
      numero_contrato: 'CONT-2025-001',
      plano_nome: 'Premium',
      valor_total: 500,
      numero_funcionarios: 50,
      status: 'ativo',
    },
    pagamentos: [
      {
        id: 1,
        valor: 500,
        status: 'pago',
        metodo: 'pix',
        data_pagamento: '2025-01-10T10:00:00Z',
        recibo: {
          id: 1,
          numero_recibo: 'REC-2025-00001',
        },
      },
      {
        id: 2,
        valor: 750,
        status: 'pendente',
        metodo: 'boleto',
        numero_parcelas: 3,
        parcelas_json: [
          {
            numero: 1,
            valor: 250,
            data_vencimento: '2025-02-10',
            pago: false,
          },
          {
            numero: 2,
            valor: 250,
            data_vencimento: '2025-03-10',
            pago: false,
          },
          {
            numero: 3,
            valor: 250,
            data_vencimento: '2025-04-10',
            pago: false,
          },
        ],
      },
    ],
  };

  const mockContrato = {
    id: 10,
    plano: 'Premium',
    valor_mensal: 299,
    data_inicio: '2025-01-01',
    data_fim: '2026-01-01',
  };

  beforeEach(() => {
    global.fetch = jest.fn().mockImplementation((input: any) => {
      const url = typeof input === 'string' ? input : input?.url || '';

      if (typeof url === 'string' && url.includes('/api/entidade/parcelas')) {
        const primeiroPagamento = mockAccountData.pagamentos?.[0];
        const parcelas = primeiroPagamento?.parcelas_json
          ? primeiroPagamento.parcelas_json.map((p: any) => ({
              numero: p.numero,
              total_parcelas: primeiroPagamento.parcelas_json.length,
              valor: p.valor,
              status: p.pago ? 'pago' : 'a_vencer',
              data_vencimento: p.data_vencimento,
              data_pagamento: p.data_pagamento || null,
              recibo: p.recibo || null,
            }))
          : [
              {
                numero: 1,
                total_parcelas: primeiroPagamento?.numero_parcelas || 1,
                valor: primeiroPagamento?.valor || 0,
                status:
                  primeiroPagamento?.status === 'pago' ? 'pago' : 'a_vencer',
                data_vencimento:
                  primeiroPagamento?.parcelas_json?.[0]?.data_vencimento ||
                  primeiroPagamento?.criado_em ||
                  mockAccountData.criado_em,
                data_pagamento: primeiroPagamento?.data_pagamento || null,
                recibo: primeiroPagamento?.recibo || null,
              },
            ];

        return Promise.resolve({
          ok: true,
          json: async () => ({
            contrato_id: mockAccountData.contrato.id,
            contratacao_at:
              mockAccountData.contrato.criado_em || mockAccountData.criado_em,
            valor_total: mockAccountData.contrato.valor_total,
            numero_funcionarios:
              mockAccountData.contrato.numero_funcionarios ||
              mockAccountData.contrato.qtd_funcionarios_contratada,
            pagamento_id: primeiroPagamento?.id || null,
            metodo: primeiroPagamento?.metodo || '',
            parcelas,
          }),
        });
      }

      if (
        typeof url === 'string' &&
        url.includes('/api/entidade/account-info')
      ) {
        return Promise.resolve({
          ok: true,
          json: async () => mockAccountData,
        });
      }

      return Promise.resolve({ ok: false, status: 404 });
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve renderizar estado de carregamento inicialmente', () => {
    (global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise(() => {
          /* nunca resolve */
        })
    );

    const { container } = render(<EntidadeContaSection />);

    // Spinner de carregamento deve estar presente
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('deve carregar e exibir dados da conta', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAccountData,
    });

    render(<EntidadeContaSection />);

    await waitFor(() => {
      expect(screen.getByText('Clínica Teste')).toBeInTheDocument();
    });

    expect(screen.getByText(/12.345.678\/0001-90/)).toBeInTheDocument();
    expect(screen.getByText(/contato@clinica.com/)).toBeInTheDocument();
    expect(screen.getByText(/\(11\) 98765-4321/)).toBeInTheDocument();
  });

  it('deve exibir plano e status', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAccountData,
    });

    render(<EntidadeContaSection />);

    await waitFor(() => {
      expect(screen.getByText('Clínica Teste')).toBeInTheDocument();
    });

    // Clicar na aba "Plano"
    fireEvent.click(screen.getByRole('button', { name: /Plano/ }));

    await waitFor(() => {
      expect(screen.getByText(/Premium/)).toBeInTheDocument();
      expect(screen.getByText('ativo')).toBeInTheDocument();
    });
  });

  it('deve renderizar componente PaymentSummaryCard com resumo financeiro', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAccountData,
    });

    render(<EntidadeContaSection />);

    await waitFor(() => {
      expect(screen.getByText('Clínica Teste')).toBeInTheDocument();
    });

    // Clicar na aba "Plano" onde o resumo é exibido
    fireEvent.click(screen.getByRole('button', { name: /Plano/ }));

    await waitFor(() => {
      expect(screen.getByTestId('payment-summary')).toBeInTheDocument();
    });

    const summary = screen.getByTestId('payment-summary');
    expect(summary).toHaveTextContent(/Total:/);
    expect(summary).toHaveTextContent(/Pago:/);
    expect(summary).toHaveTextContent(/Pendente:/);
  });

  it('deve calcular resumo financeiro considerando parcelas (parciais)', async () => {
    const dataWithParcelas = {
      ...mockAccountData,
      pagamentos: [
        {
          id: 9,
          valor: 300,
          status: 'pendente',
          numero_parcelas: 3,
          parcelas_json: [
            {
              numero: 1,
              valor: 100,
              data_vencimento: '2025-12-01',
              pago: true,
            },
            {
              numero: 2,
              valor: 100,
              data_vencimento: '2026-01-01',
              pago: false,
            },
            {
              numero: 3,
              valor: 100,
              data_vencimento: '2026-02-01',
              pago: false,
            },
          ],
        },
      ],
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => dataWithParcelas,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          contrato_id: dataWithParcelas.contrato?.id || 0,
          contratacao_at:
            dataWithParcelas.contrato?.criado_em || dataWithParcelas.criado_em,
          valor_total: dataWithParcelas.contrato?.valor_total || 0,
          numero_funcionarios:
            dataWithParcelas.contrato?.numero_funcionarios || 0,
          pagamento_id: dataWithParcelas.pagamentos?.[0]?.id || null,
          metodo: dataWithParcelas.pagamentos?.[0]?.metodo || '',
          parcelas: dataWithParcelas.pagamentos?.[0]?.parcelas_json
            ? dataWithParcelas.pagamentos[0].parcelas_json.map((p: any) => ({
                numero: p.numero,
                total_parcelas:
                  dataWithParcelas.pagamentos[0].parcelas_json.length,
                valor: p.valor,
                status: p.pago ? 'pago' : 'a_vencer',
                data_vencimento: p.data_vencimento,
                data_pagamento: p.data_pagamento || null,
                recibo: p.recibo || null,
              }))
            : [],
        }),
      });

    render(<EntidadeContaSection />);

    await waitFor(() => {
      expect(screen.getByText('Clínica Teste')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Plano/ }));

    await waitFor(() => {
      const summary = screen.getByTestId('payment-summary');
      expect(summary).toHaveTextContent('Total: 300');
      expect(summary).toHaveTextContent('Pago: 100');
      expect(summary).toHaveTextContent('Pendente: 200');
    });
  });

  it('deve renderizar todos os pagamentos como PaymentItem', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAccountData,
    });

    render(<EntidadeContaSection />);

    await waitFor(() => {
      expect(screen.getByText('Clínica Teste')).toBeInTheDocument();
    });

    // Clicar na aba "Plano" onde os pagamentos (Tabela de Parcelas) são exibidos
    fireEvent.click(screen.getByRole('button', { name: /Plano/ }));

    await waitFor(() => {
      expect(screen.getByText(/Pagamentos/)).toBeInTheDocument();
      expect(screen.getByText(/1\s*\/\s*1/)).toBeInTheDocument();
    });
  });

  it('deve exibir comportamento correto quando não há pagamentos', async () => {
    const dataWithoutPayments = {
      ...mockAccountData,
      pagamentos: [],
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => dataWithoutPayments,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ parcelas: [] }),
      });

    render(<EntidadeContaSection />);

    await waitFor(() => {
      expect(screen.getByText('Clínica Teste')).toBeInTheDocument();
    });

    // Ir para aba Plano e verificar que não há resumo financeiro e que não há parcelas
    fireEvent.click(screen.getByRole('button', { name: /Plano/ }));

    await waitFor(() => {
      expect(screen.queryByTestId('payment-summary')).not.toBeInTheDocument();
      expect(
        screen.getByText('Nenhuma parcela encontrada')
      ).toBeInTheDocument();
    });
  });

  it('deve exibir link para o contrato padrão em "Ver Contrato"', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAccountData,
    });

    render(<EntidadeContaSection />);

    await waitFor(() => {
      expect(screen.getByText('Clínica Teste')).toBeInTheDocument();
    });

    // Clicar na aba "Plano"
    fireEvent.click(screen.getByRole('button', { name: /Plano/ }));

    await waitFor(() => {
      const link = screen.getByText('Ver Contrato');
      expect(link).toBeInTheDocument();
      expect(link.closest('a')).toHaveAttribute('href', '/termos/contrato');
      expect(link).toHaveAttribute('target', '_blank');
    });
  });

  /* Removido: testes que abriam modal de contrato — agora o contrato padrão é acessado via página única */

  it('deve alternar entre abas "Informações da Conta" e "Plano"', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAccountData,
    });

    render(<EntidadeContaSection />);

    await waitFor(() => {
      expect(screen.getByText('Clínica Teste')).toBeInTheDocument();
    });

    // Inicialmente a seção de pagamentos não deve estar visível na aba "Informações da Conta"
    expect(screen.queryByText(/Pagamentos/)).not.toBeInTheDocument();

    // Clicar na aba "Plano"
    const tabPlano = screen.getByRole('button', { name: /Plano/ });
    fireEvent.click(tabPlano);

    // Agora a seção de pagamentos deve estar visível
    await waitFor(() => {
      expect(screen.getByText(/Pagamentos/)).toBeInTheDocument();
    });

    // Verificar que a aba Plano está ativa
    expect(tabPlano).toHaveClass('border-primary');
  });

  it('deve exibir erro ao falhar carregamento', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(<EntidadeContaSection />);

    await waitFor(() => {
      expect(
        screen.getByText(/Erro ao carregar informações da conta/)
      ).toBeInTheDocument();
    });
  });

  it('exibe badge e subtexto para pagamentos parcelados parcialmente quitados', async () => {
    const parcelado = {
      nome: 'Clínica Teste',
      criado_em: '2025-01-01T10:00:00Z',
      contrato: { ...mockAccountData.contrato },
      pagamentos: [
        {
          id: 500,
          valor: 20000,
          status: 'pago',
          numero_parcelas: 4,
          parcelas_json: [
            {
              numero: 1,
              valor: 5000,
              pago: true,
              data_vencimento: '2026-01-19',
            },
            {
              numero: 2,
              valor: 5000,
              pago: false,
              data_vencimento: '2026-02-19',
            },
            {
              numero: 3,
              valor: 5000,
              pago: false,
              data_vencimento: '2026-03-19',
            },
            {
              numero: 4,
              valor: 5000,
              pago: false,
              data_vencimento: '2026-04-19',
            },
          ],
          resumo: {
            totalParcelas: 4,
            parcelasPagas: 1,
            parcelasPendentes: 3,
            valorPendente: 15000,
            valorPago: 5000,
            statusGeral: 'em_aberto',
          },
        },
      ],
    };

    (global.fetch as jest.Mock).mockImplementation((input: any) => {
      const url = typeof input === 'string' ? input : input?.url || '';
      if (
        typeof url === 'string' &&
        url.includes('/api/entidade/account-info')
      ) {
        return Promise.resolve({ ok: true, json: async () => parcelado });
      }
      if (typeof url === 'string' && url.includes('/api/entidade/parcelas')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            contrato_id: parcelado.contrato?.id || 0,
            contratacao_at:
              parcelado.contrato?.criado_em ||
              parcelado.contrato?.data_inicio ||
              '',
            valor_total: parcelado.contrato?.valor_total || 0,
            numero_funcionarios: parcelado.contrato?.numero_funcionarios || 0,
            pagamento_id: parcelado.pagamentos?.[0]?.id || null,
            metodo: parcelado.pagamentos?.[0]?.metodo || '',
            parcelas: parcelado.pagamentos?.[0]?.parcelas_json
              ? parcelado.pagamentos[0].parcelas_json.map((p: any) => ({
                  numero: p.numero,
                  total_parcelas: parcelado.pagamentos[0].parcelas_json.length,
                  valor: p.valor,
                  status: p.pago ? 'pago' : 'a_vencer',
                  data_vencimento: p.data_vencimento,
                  data_pagamento: p.data_pagamento || null,
                  recibo: p.recibo || null,
                }))
              : [],
          }),
        });
      }
      return Promise.resolve({ ok: false, status: 404 });
    });

    render(<EntidadeContaSection />);

    // Aguarde carregar os dados antes de ir para a aba Plano
    await waitFor(() => {
      expect(screen.getByText('Clínica Teste')).toBeInTheDocument();
    });

    // Ir para aba Plano
    const planTabs = screen.getAllByRole('button', { name: /Plano/ });
    fireEvent.click(planTabs[planTabs.length - 1]);

    // Escopar ao cartão de contrato e verificar badge/subtexto
    const contratoHeading = await screen.findByRole('heading', {
      name: /Contrato Atual/i,
    });

    // Buscar o label diretamente — localização do DOM pode variar
    const statusLabel = await screen.findByText('Status de Pagamento');
    const statusContainer = statusLabel.closest('div');
    expect(statusContainer).not.toBeNull();
    const statusWithin = within(statusContainer as HTMLElement);

    expect(
      statusWithin.getByText(/Parcela\(s\) pendente\(s\)/i)
    ).toBeInTheDocument();
    expect(statusWithin.getByText(/1\/4 parcelas pagas/i)).toBeInTheDocument();
    expect(statusWithin.getByText(/restante/i)).toBeInTheDocument();
  });

  it('quando não houver contrato, exibe mensagem apropriada e não chama fallback/modal', async () => {
    const accountWithoutContrato = {
      ...mockAccountData,
      contrato: undefined,
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => accountWithoutContrato,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ parcelas: [] }),
      });

    render(<EntidadeContaSection />);

    await waitFor(() => {
      expect(screen.getByText('Clínica Teste')).toBeInTheDocument();
    });

    // Ir para aba Plano onde a mensagem 'Nenhum plano contratado' aparece
    fireEvent.click(screen.getByRole('button', { name: /Plano/ }));

    await waitFor(() => {
      expect(screen.getByText('Nenhum plano contratado')).toBeInTheDocument();
    });

    // Não deve acionar o endpoint de fallback nem abrir modal
    expect(global.fetch).not.toHaveBeenCalledWith(
      expect.stringContaining('/api/entidade/contrato-fallback')
    );
    expect(screen.queryByTestId('modal-contrato')).not.toBeInTheDocument();
  });

  it('"Ver Contrato" é um link externo (target=_blank) e não abre modal', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAccountData,
    });

    render(<EntidadeContaSection />);

    await waitFor(() => {
      expect(screen.getByText('Clínica Teste')).toBeInTheDocument();
    });

    // Clicar na aba "Plano"
    fireEvent.click(screen.getByRole('button', { name: /Plano/ }));

    await waitFor(() => {
      const link = screen.getByText('Ver Contrato');
      expect(link.closest('a')).toHaveAttribute('href', '/termos/contrato');
      expect(link).toHaveAttribute('target', '_blank');
    });

    // Confirmar que nenhum modal é exibido
    expect(screen.queryByTestId('modal-contrato')).not.toBeInTheDocument();
  });

  it('deve ter acessibilidade adequada nas abas', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAccountData,
    });

    render(<EntidadeContaSection />);

    await waitFor(() => {
      expect(screen.getByText('Clínica Teste')).toBeInTheDocument();
    });

    const tabCadastradas = screen.getByRole('button', { name: /Cadastradas/ });
    const tabPlano = screen.getByRole('button', { name: /Plano/ });

    expect(tabCadastradas).toBeInTheDocument();
    expect(tabPlano).toBeInTheDocument();
  });
});
