import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ContaSection from '@/components/clinica/ContaSection';

// Mock do fetch com implementação padrão segura (retorna OK + objeto vazio).
// Tests podem sobrescrever respostas específicas com mockResolvedValueOnce / mockRejectedValueOnce.
global.fetch = jest.fn((...args) => {
  const url = String(args[0] || '');
  if (url.includes('/api/rh/account-info')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ clinica: null, gestores: [] }),
    });
  }
  if (url.includes('/api/rh/parcelas')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ parcelas: [], contratacao_at: null }),
    });
  }
  return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
});

describe('ContaSection', () => {
  const mockAccountInfo = {
    clinica: {
      id: 1,
      nome: 'Clínica ABC',
      cnpj: '12.345.678/0001-90',
      endereco: 'Rua das Flores, 123',
      telefone: '(11) 99999-9999',
      email: 'contato@clinicaabc.com',
      cidade: 'São Paulo',
      estado: 'SP',
      criado_em: '2025-12-27T10:00:00.000Z',
    },
    gestores: [
      {
        id: 1,
        cpf: '123.456.789-00',
        nome: 'João Silva',
        email: 'joao.silva@clinicaabc.com',
        perfil: 'rh',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restaurar espiões e mocks para evitar efeitos colaterais entre testes
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementationOnce(
      () => new Promise(() => {})
    );

    render(<ContaSection />);

    // Verifica se o spinner de loading está presente
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders account information correctly', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockAccountInfo),
    });

    render(<ContaSection />);

    await waitFor(() => {
      expect(screen.getByText('Informações da Conta')).toBeInTheDocument();
    });

    // Verifica header
    expect(screen.getByText('Informações da Conta')).toBeInTheDocument();
    expect(
      screen.getByText('Dados da clínica e gestores RH')
    ).toBeInTheDocument();

    // Verifica informações da clínica
    expect(screen.getByText('Clínica ABC')).toBeInTheDocument();
    expect(screen.getByText('12.345.678/0001-90')).toBeInTheDocument();
    expect(screen.getByText('contato@clinicaabc.com')).toBeInTheDocument();
    expect(screen.getByText('(11) 99999-9999')).toBeInTheDocument();
    expect(screen.getByText('Rua das Flores, 123')).toBeInTheDocument();

    // Localização e data de cadastro
    expect(screen.getByText('São Paulo, SP')).toBeInTheDocument();
    expect(screen.getByText('27/12/2025')).toBeInTheDocument();

    // Verifica gestores RH
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('joao.silva@clinicaabc.com')).toBeInTheDocument();
    expect(screen.getByText('CPF: 123.456.789-00')).toBeInTheDocument();
    expect(screen.getByText('Gestor RH')).toBeInTheDocument();
  });

  it('displays sections with proper styling', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockAccountInfo),
    });

    render(<ContaSection />);

    await waitFor(() => {
      // Verifica seções
      expect(screen.getByText('Dados da Clínica')).toBeInTheDocument();
      expect(screen.getByText('Gestores RH')).toBeInTheDocument();
    });
  });

  it('exibe botão e expande os "Dados do cadastro" quando snapshot difere', async () => {
    const dataWithSnapshot = {
      clinica: {
        id: 1,
        nome: 'Clínica Atual',
        cnpj: '12.345.678/0001-90',
        endereco: 'Rua Atual, 45',
        telefone: '(11) 99999-9999',
        email: 'contato@atual.com',
        cidade: 'São Paulo',
        estado: 'SP',
        criado_em: '2025-12-27T10:00:00.000Z',
        cadastro_original: {
          nome: 'Clínica Registro',
          cnpj: '12.345.678/0001-99',
          email: 'registro@clinica.com',
          telefone: '(11) 98888-7777',
          endereco: 'Rua Registro, 10',
          cidade: 'São Paulo',
          estado: 'SP',
        },
        cadastro_original_created_at: '2025-12-27T10:00:00.000Z',
      },
      gestores: [],
    };

    (global.fetch as jest.Mock).mockImplementation((...args) => {
      const url = String(args[0] || '');
      if (url.includes('/api/rh/account-info')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(dataWithSnapshot),
        });
      }
      if (url.includes('/api/rh/parcelas')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ parcelas: [], contratacao_at: null }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(<ContaSection />);

    // Deve mostrar o botão para ver o snapshot
    await waitFor(() => {
      expect(screen.getByText('Ver dados do cadastro')).toBeInTheDocument();
    });

    // Ao clicar, os dados do cadastro originais aparecem
    await userEvent.click(screen.getByText('Ver dados do cadastro'));

    await waitFor(() => {
      expect(screen.getByText('Clínica Registro')).toBeInTheDocument();
      expect(screen.getByText('registro@clinica.com')).toBeInTheDocument();
      expect(screen.getByText('Registrado em')).toBeInTheDocument();
    });
  });

  it('não deve exibir botão quando snapshot é idêntico aos dados atuais', async () => {
    const dataEqualSnapshot = {
      clinica: {
        id: 1,
        nome: 'Clínica Igual',
        cnpj: '12.345.678/0001-90',
        endereco: 'Rua Igual, 1',
        telefone: '(11) 99999-9999',
        email: 'igual@clinica.com',
        cidade: 'Cidade',
        estado: 'SP',
        criado_em: '2025-12-27T10:00:00.000Z',
        cadastro_original: {
          nome: 'Clínica Igual',
          cnpj: '12.345.678/0001-90',
          email: 'igual@clinica.com',
          telefone: '(11) 99999-9999',
          endereco: 'Rua Igual, 1',
          cidade: 'Cidade',
          estado: 'SP',
        },
        cadastro_original_created_at: '2025-12-27T10:00:00.000Z',
      },
      gestores: [],
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(dataEqualSnapshot),
    });

    render(<ContaSection />);

    await waitFor(() => {
      expect(
        screen.queryByText('Ver dados do cadastro')
      ).not.toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    // Mock console.error
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    render(<ContaSection />);

    await waitFor(() => {
      expect(
        screen.getByText('Erro ao carregar informações da conta')
      ).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('handles partial data correctly', async () => {
    const partialData = {
      clinica: {
        id: 1,
        nome: 'Clínica ABC',
        cnpj: '12.345.678/0001-90',
      },
      gestores: [],
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(partialData),
    });

    render(<ContaSection />);

    await waitFor(() => {
      expect(screen.getByText('Clínica ABC')).toBeInTheDocument();
      expect(
        screen.getByText('Nenhum gestor RH cadastrado')
      ).toBeInTheDocument();
    });
  });

  it('integração: obtém e renderiza gestores a partir do handler real', async () => {
    // Preparar mocks para o handler
    const session = { cpf: '04703084945', perfil: 'rh', clinica_id: 55 };

    const clinicaRow = {
      id: 55,
      nome: 'Triagem Curitiba',
      cnpj: '12345678000199',
      email: 'triagem@clinica.com',
      telefone: '(41) 99999-9999',
      endereco: 'Av. Brasil, 100',
      cidade: 'Curitiba',
      estado: 'PR',
      responsavel_nome: 'Responsavel X',
    };

    const selfRow = {
      id: 6,
      cpf: '04703084945',
      perfil: 'rh',
      ativo: true,
      clinica_id: null,
    };

    const gestorRow = {
      id: 6,
      cpf: '04703084945',
      nome: 'Triagem Curitiba',
      email: 'triagem@clinica.com',
      perfil: 'rh',
    };

    // Isolar módulos e preparar resposta do handler com mocks locais
    let handlerResponsePromise: Promise<any>;
    jest.isolateModules(() => {
      jest.doMock('@/lib/session', () => ({
        requireRole: jest.fn().mockResolvedValue(session),
      }));

      jest.doMock('@/lib/db', () => ({
        query: jest
          .fn()
          .mockResolvedValueOnce({ rows: [clinicaRow], rowCount: 1 }) // clinicaQuery
          .mockResolvedValueOnce({ rows: [gestorRow], rowCount: 1 }) // gestoresQuery
          .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // snapshotQuery (nenhum)
          .mockResolvedValueOnce({ rows: [], rowCount: 0 }), // planoQuery (nenhum)
      }));

      const { GET } = require('@/app/api/rh/account-info/route');
      handlerResponsePromise = GET();
    });

    // Fazer fetch chamar o handler real (isolado acima)
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      handlerResponsePromise.then((resp: any) => ({
        ok: true,
        json: () => resp.json(),
      }))
    );

    render(<ContaSection />);

    await waitFor(() => {
      expect(
        screen.getAllByText('triagem@clinica.com').length
      ).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Gestor RH')).toBeInTheDocument();
    });

    expect(
      screen.getAllByText('Triagem Curitiba').length
    ).toBeGreaterThanOrEqual(1);

    // --- Verificación adicional: RH com clínica validada na sessão ---
    const sessionWithClinica = {
      cpf: '04703084945',
      perfil: 'rh',
      clinica_id: 55,
    };

    let handlerResponsePromise2: Promise<any>;
    jest.isolateModules(() => {
      jest.doMock('@/lib/session', () => ({
        requireRole: jest.fn().mockResolvedValue(sessionWithClinica),
      }));

      jest.doMock('@/lib/db', () => ({
        query: jest
          .fn()
          .mockResolvedValueOnce({ rows: [clinicaRow], rowCount: 1 }) // clinicaQuery filtrando por clinica_id
          .mockResolvedValueOnce({ rows: [gestorRow], rowCount: 1 }) // gestoresQuery
          .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // snapshotQuery
          .mockResolvedValueOnce({ rows: [], rowCount: 0 }), // planoQuery
      }));

      const { GET } = require('@/app/api/rh/account-info/route');
      handlerResponsePromise2 = GET();
    });

    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      handlerResponsePromise2.then((resp: any) => ({
        ok: true,
        json: () => resp.json(),
      }))
    );

    render(<ContaSection />);

    await waitFor(() => {
      expect(
        screen.getAllByText('Triagem Curitiba').length
      ).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Gestor RH')).toBeInTheDocument();
    });
  });

  it('displays gestor profile badges correctly', async () => {
    const gestoresWithDifferentProfiles = {
      clinica: mockAccountInfo.clinica,
      gestores: [
        {
          id: 1,
          cpf: '123.456.789-00',
          nome: 'João Silva',
          email: 'joao.silva@clinicaabc.com',
          perfil: 'rh',
        },
        {
          id: 2,
          cpf: '987.654.321-00',
          nome: 'Maria Santos',
          email: 'maria.santos@clinicaabc.com',
          perfil: 'admin',
        },
      ],
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(gestoresWithDifferentProfiles),
    });

    render(<ContaSection />);

    await waitFor(() => {
      expect(screen.getByText('Gestor RH')).toBeInTheDocument();
      expect(screen.getByText('admin')).toBeInTheDocument();
    });

    // Verifica classes CSS dos badges
    const rhBadge = screen.getByText('Gestor RH');
    const adminBadge = screen.getByText('admin');

    expect(rhBadge).toHaveClass('bg-blue-100');
    expect(rhBadge).toHaveClass('text-blue-800');
    expect(adminBadge).toHaveClass('bg-blue-100');
    expect(adminBadge).toHaveClass('text-blue-800');
  });

  it('exibe seção Plano com resumo quando disponível', async () => {
    const dataWithPlan = {
      clinica: {
        id: 1,
        nome: 'Clínica com Plano',
        cnpj: '12.345.678/0001-90',
        endereco: 'Rua do Plano, 10',
        telefone: '(11) 99999-9999',
        email: 'plano@clinica.com',
        cidade: 'Cidade',
        estado: 'SP',
        criado_em: '2025-12-27T10:00:00.000Z',
        plano: {
          numero_funcionarios_atual: 25,
          valor_pago: 800.0,
          valor_por_funcionario: 50.0,
          valor_total: 3200.0,
          valor_pendente: 2400.0,
          numero_parcelas: 4,
          data_contratacao: '2025-01-01T00:00:00.000Z',
          data_fim_vigencia: '2025-12-31T00:00:00.000Z',
          contrato_numero: 'CTR-12345',
        },
      },
      gestores: [],
      pagamentos: [
        {
          id: 1,
          valor: 3200,
          status: 'pago',
          resumo: {
            totalParcelas: 4,
            parcelasPagas: 1,
            parcelasPendentes: 3,
            valorTotal: 3200,
            valorPago: 800,
            valorPendente: 2400,
            statusGeral: 'em_aberto',
          },
        },
      ],
    };

    (global.fetch as jest.Mock).mockImplementation((...args) => {
      const url = String(args[0] || '');
      if (url.includes('/api/rh/account-info')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(dataWithPlan),
        });
      }
      if (url.includes('/api/rh/parcelas')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ parcelas: [], contratacao_at: null }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(<ContaSection />);

    // Ir para aba Plano para ver o resumo financeiro
    const planoTab = await screen.findByRole('button', { name: /Plano/i });
    await userEvent.click(planoTab);

    // Aguarda os elementos dinâmicos da aba Plano aparecerem
    await screen.findByText('Funcionários Contratados');
    expect(screen.getByText('25')).toBeInTheDocument();

    // Valor por Funcionário (corrigido o texto do label e escopado)
    const valorPorLabel = screen.getByText('Valor por Funcionário');
    const valorPorContainer = valorPorLabel.closest('div');
    expect(valorPorContainer).not.toBeNull();
    const valorPorWithin = within(valorPorContainer as HTMLElement);
    expect(valorPorWithin.getByText(/^R\$\s*50,00$/)).toBeInTheDocument();

    // Número do Contrato (o texto pode estar fragmentado em nós separados)
    const contratoHeading = screen.getByText('Contrato Atual');
    // Contrato card is the ancestor of the heading; climb to the parent card container
    // Prefer direct lookup for the label (less brittle than multiple ancestor climbs)
    const contratoLabels = screen.getAllByText('Número do Contrato');
    // Escolhe o rótulo que contém o número do contrato esperado dentro do mesmo bloco
    const contratoLabel = contratoLabels.find((l) =>
      (l.closest('div')?.textContent || '').includes('CTR-12345')
    );
    expect(contratoLabel).toBeDefined();
    const contratoContainer = contratoLabel.closest('div');
    expect(contratoContainer).not.toBeNull();
    expect(contratoContainer).toHaveTextContent(/CTR-12345/);

    // PaymentSummaryCard - aguarda os valores específicos dentro do cartão
    const resumoHeading = await screen.findByRole('heading', {
      name: /Resumo Financeiro/i,
    });
    expect(resumoHeading).toBeInTheDocument();
    const resumoCard = resumoHeading.closest('div')?.parentElement;
    expect(resumoCard).not.toBeNull();
    const resumoWithin = within(resumoCard);
    // Check each box by its header label to avoid text-splitting/formatting issues
    const totalLabel = await screen.findByText('Total');
    const totalBox = totalLabel.closest('div');
    expect(totalBox).not.toBeNull();
    expect(
      within(totalBox as HTMLElement).getByText(/^R\$\s*3\.200,00$/)
    ).toBeInTheDocument();

    const pagoLabel = await screen.findByText('Pago');
    const pagoBox = pagoLabel.closest('div');
    expect(pagoBox).not.toBeNull();
    expect(
      within(pagoBox as HTMLElement).getByText(/^R\$\s*800,00$/)
    ).toBeInTheDocument();

    const restanteLabel = await screen.findByText('Restante');
    const restanteBox = restanteLabel.closest('div');
    expect(restanteBox).not.toBeNull();
    expect(
      within(restanteBox as HTMLElement).getByText(/^R\$\s*2\.400,00$/)
    ).toBeInTheDocument();

    // Status de Pagamento: badge e subtexto de parcelas
    const statusLabel = screen.getByText('Status de Pagamento');
    const statusContainer = statusLabel.closest('div');
    expect(statusContainer).not.toBeNull();
    const statusWithin = within(statusContainer as HTMLElement);
    expect(
      statusWithin.getByText(/Parcela\(s\) pendente\(s\)/i)
    ).toBeInTheDocument();
    expect(statusWithin.getByText(/1\/4 parcelas pagas/i)).toBeInTheDocument();
    expect(statusWithin.getByText(/restante/i)).toBeInTheDocument();
  });

  it('handles missing optional fields', async () => {
    const dataWithMissingFields = {
      clinica: {
        id: 1,
        nome: 'Clínica ABC',
        cnpj: null,
        email: null,
        telefone: null,
        cidade: null,
        estado: null,
      },
      gestores: [
        {
          id: 1,
          cpf: '123.456.789-00',
          nome: 'João Silva',
          email: 'joao.silva@clinicaabc.com',
          perfil: 'rh',
        },
      ],
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(dataWithMissingFields),
    });

    render(<ContaSection />);

    await waitFor(() => {
      expect(screen.getByText('Clínica ABC')).toBeInTheDocument();
      expect(screen.getByText('João Silva')).toBeInTheDocument();
      // Campos opcionais não devem aparecer se forem null
      expect(
        screen.queryByText('contato@clinicaabc.com')
      ).not.toBeInTheDocument();
      expect(screen.queryByText('(11) 99999-9999')).not.toBeInTheDocument();
      expect(screen.queryByText('São Paulo - SP')).not.toBeInTheDocument();
    });
  });

  it('handles empty gestores list', async () => {
    const dataWithEmptyGestores = {
      clinica: mockAccountInfo.clinica,
      gestores: [],
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(dataWithEmptyGestores),
    });

    render(<ContaSection />);

    await waitFor(() => {
      expect(
        screen.getByText('Nenhum gestor RH cadastrado')
      ).toBeInTheDocument();
    });
  });
});
