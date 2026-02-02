import '@testing-library/jest-dom';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import PagamentoPage from '@/app/pagamento/[contratoId]/page';

// Mock do next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useParams: () => ({
    contratoId: '1',
  }),
}));

// Mock do fetch
global.fetch = jest.fn();

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('Página de Pagamento - Finalizar Pagamento', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('deve exibir loading inicialmente', () => {
    render(<PagamentoPage />);

    expect(
      screen.getByText('Carregando informações de pagamento...')
    ).toBeInTheDocument();
  });

  it('deve carregar informações de pagamento com sucesso', async () => {
    // Mock da busca do contrato
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ contrato: { contratante_id: 1 } }),
    } as any);

    // Mock do iniciar pagamento
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        pagamento_id: 100,
        valor: 500,
        valor_plano: 50,
        numero_funcionarios: 10,
        plano_nome: 'Plano Básico',
        contratante_nome: 'Empresa Teste',
        message: 'Pagamento iniciado com sucesso',
      }),
    } as any);

    render(<PagamentoPage />);

    await waitFor(() => {
      expect(screen.getByText('Resumo da Contratação')).toBeInTheDocument();
    });

    // Verificar se os detalhes são exibidos
    expect(screen.getByText('Empresa Teste')).toBeInTheDocument();
    expect(screen.getByText('Plano Básico')).toBeInTheDocument();
    expect(screen.getByText('R$ 50,00')).toBeInTheDocument(); // valor_plano
    expect(screen.getByText('10')).toBeInTheDocument(); // numero_funcionarios
    expect(screen.getByText('R$ 500,00')).toBeInTheDocument(); // total
    expect(
      screen.getByText('(R$ 50,00 × 10 funcionários)')
    ).toBeInTheDocument();
  });

  it('deve exibir erro se contrato não for encontrado', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
    } as any);

    render(<PagamentoPage />);

    await waitFor(() => {
      expect(
        screen.getByText('Erro ao carregar informações de pagamento')
      ).toBeInTheDocument();
    });
  });

  it('deve permitir seleção de método de pagamento', async () => {
    // Mocks para carregar dados
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ contrato: { contratante_id: 1 } }),
    } as any);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        pagamento_id: 100,
        valor: 500,
        valor_plano: 50,
        numero_funcionarios: 10,
        plano_nome: 'Plano Básico',
        contratante_nome: 'Empresa Teste',
      }),
    } as any);

    render(<PagamentoPage />);

    await waitFor(() => {
      expect(screen.getByText('Método de Pagamento')).toBeInTheDocument();
    });

    // Verificar métodos disponíveis
    expect(screen.getByText('PIX')).toBeInTheDocument();
    expect(screen.getByText('Cartão de Crédito')).toBeInTheDocument();
    expect(screen.getByText('Boleto Bancário')).toBeInTheDocument();

    // PIX deve estar selecionado por padrão
    const pixRadio = screen.getByDisplayValue('pix') as HTMLInputElement;
    expect(pixRadio.checked).toBe(true);
  });

  it('deve mostrar seleção de parcelas para cartão de crédito', async () => {
    // Mocks para carregar dados
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ contrato: { contratante_id: 1 } }),
    } as any);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        pagamento_id: 100,
        valor: 500,
        valor_plano: 50,
        numero_funcionarios: 10,
        plano_nome: 'Plano Básico',
        contratante_nome: 'Empresa Teste',
      }),
    } as any);

    render(<PagamentoPage />);

    await waitFor(() => {
      expect(screen.getByText('Método de Pagamento')).toBeInTheDocument();
    });

    // Selecionar cartão
    const cartaoRadio = screen.getByDisplayValue('cartao');
    fireEvent.click(cartaoRadio);

    // Verificar se select de parcelas aparece
    await waitFor(() => {
      expect(screen.getByText('Número de Parcelas')).toBeInTheDocument();
    });

    const select = screen.getByDisplayValue('À vista - R$ 500,00');
    expect(select).toBeInTheDocument();

    // Verificar opções de parcelas
    expect(screen.getByText(/2x de R\$ 250,00/)).toBeInTheDocument();
    expect(screen.getByText(/12x de R\$ 41,67/)).toBeInTheDocument();
  });

  it('deve mostrar seleção de parcelas para boleto', async () => {
    // Mocks para carregar dados
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ contrato: { contratante_id: 1 } }),
    } as any);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        pagamento_id: 100,
        valor: 500,
        valor_plano: 50,
        numero_funcionarios: 10,
        plano_nome: 'Plano Básico',
        contratante_nome: 'Empresa Teste',
      }),
    } as any);

    render(<PagamentoPage />);

    await waitFor(() => {
      expect(screen.getByText('Método de Pagamento')).toBeInTheDocument();
    });

    // Selecionar boleto
    const boletoRadio = screen.getByDisplayValue('boleto');
    fireEvent.click(boletoRadio);

    // Verificar se select de parcelas aparece
    await waitFor(() => {
      expect(screen.getByText('Número de Parcelas')).toBeInTheDocument();
    });

    expect(
      screen.getByText('Boletos com vencimento mensal (dia 10 de cada mês)')
    ).toBeInTheDocument();
  });

  it('deve simular pagamento com sucesso', async () => {
    // Mocks para carregar dados
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ contrato: { contratante_id: 1 } }),
    } as any);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        pagamento_id: 100,
        valor: 500,
        valor_plano: 50,
        numero_funcionarios: 10,
        plano_nome: 'Plano Básico',
        contratante_nome: 'Empresa Teste',
      }),
    } as any);

    // Mock da confirmação
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: 'Pagamento confirmado',
      }),
    } as any);

    render(<PagamentoPage />);

    await waitFor(() => {
      expect(screen.getByText('Confirmar Pagamento')).toBeInTheDocument();
    });

    // Clicar em confirmar
    const confirmarButton = screen.getByText('Confirmar Pagamento');
    fireEvent.click(confirmarButton);

    // Verificar se processando
    expect(screen.getByText('Processando...')).toBeInTheDocument();

    // Aguardar simulação (2 segundos)
    await waitFor(
      () => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/pagamento/confirmar',
          expect.any(Object)
        );
      },
      { timeout: 3000 }
    );
  });

  it('deve carregar pagamento via token em /pagamento/personalizado?token=', async () => {
    // Override useParams to return 'personalizado' for this test
    const navigation = await import('next/navigation');
    (navigation as any).useParams = () => ({ contratoId: 'personalizado' });
    (navigation as any).useRouter = () => ({ push: jest.fn() });

    // Set querystring contratacao_id
    window.history.pushState(
      {},
      '',
      '/pagamento/personalizado?contratacao_id=123'
    );

    // Mock GET /api/contratacao_personalizada/123
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        valido: true,
        contratacao_id: 123,
        contratante_id: 42,
        contratante_nome: 'Empresa Token',
        numero_funcionarios: 25,
        valor_total: 2500,
        valor_por_funcionario: 100,
      }),
    } as any);

    // Mock iniciar pagamento
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        pagamento_id: 777,
        valor: 2500,
        valor_plano: 100,
        numero_funcionarios: 25,
        plano_nome: 'Personalizado TEST',
        contratante_nome: 'Empresa Token',
      }),
    } as any);

    render(<PagamentoPage />);

    // Deve exibir resumo com valores do token
    await waitFor(() => {
      expect(screen.getByText('Resumo da Contratação')).toBeInTheDocument();
    });

    expect(screen.getByText('Personalizado TEST')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('R$ 2.500,00')).toBeInTheDocument();

    // Verificar que /api/pagamento/iniciar foi chamado com token
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/pagamento/iniciar',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.any(String),
        })
      );

      const lastCall = mockFetch.mock.calls[1]; // second call is iniciar
      const body = JSON.parse((lastCall[1] as any).body);
      expect(body.token).toBe('abc123');
      expect(body.contratante_id).toBe(42);
    });
  });
});
