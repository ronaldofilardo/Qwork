import React from 'react';
import {
  render,
  screen,
  waitFor,
  within,
  fireEvent,
} from '@testing-library/react';
import ContaSection from '@/components/clinica/ContaSection';

// Mock do fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('ContaSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve exibir loading inicialmente', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // Nunca resolve

    render(<ContaSection />);

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('deve exibir informações da conta quando carregadas com sucesso', async () => {
    const mockData = {
      clinica: {
        id: 1,
        nome: 'Clínica Teste',
        cnpj: '12.345.678/0001-23',
        email: 'clinica@teste.com',
        telefone: '(11) 99999-9999',
        endereco: 'Rua Teste, 123',
      },
      gestores: [
        {
          id: 1,
          cpf: '123.456.789-01',
          nome: 'Gestor RH',
          email: 'rh@teste.com',
          perfil: 'rh',
        },
      ],
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    render(<ContaSection />);

    await waitFor(() => {
      expect(screen.getByText('Clínica Teste')).toBeInTheDocument();
    });

    expect(screen.getByText('12.345.678/0001-23')).toBeInTheDocument();
    expect(screen.getByText('clinica@teste.com')).toBeInTheDocument();
    expect(screen.getByText('(11) 99999-9999')).toBeInTheDocument();
    expect(screen.getByText('Rua Teste, 123')).toBeInTheDocument();
    expect(
      screen.getByText('Gestor RH', { selector: 'p' })
    ).toBeInTheDocument();
  });

  it('deve exibir mensagem de erro quando falha ao carregar', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Erro de teste' }),
    });

    render(<ContaSection />);

    await waitFor(() => {
      expect(screen.getByText('Erro de teste')).toBeInTheDocument();
    });
  });

  it('deve exibir informações básicas da clínica quando dados estão incompletos', async () => {
    const mockData = {
      clinica: {
        id: 1,
        nome: 'Clínica Básica',
        // Sem CNPJ, email, etc.
      },
      gestores: [],
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    render(<ContaSection />);

    await waitFor(() => {
      expect(screen.getByText('Clínica Básica')).toBeInTheDocument();
    });

    expect(screen.getByText('Clínica Básica')).toBeInTheDocument();
    expect(screen.getByText('Nenhum gestor RH cadastrado')).toBeInTheDocument();
  });

  it('não deve exibir Status quando plano.status for aguardando_pagamento', async () => {
    const mockData = {
      clinica: {
        id: 2,
        nome: 'Clínica Status',
        plano: {
          status: 'aguardando_pagamento',
        },
      },
      gestores: [],
      pagamentos: [],
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    render(<ContaSection />);

    await waitFor(() => {
      expect(screen.getByText('Clínica Status')).toBeInTheDocument();
    });

    expect(screen.queryByText('Status')).not.toBeInTheDocument();
  });

  it('exibe vigência como "—" quando datas não informadas', async () => {
    const mockData = {
      clinica: {
        id: 3,
        nome: 'Clínica Vigencia',
        plano: {},
      },
      gestores: [],
      pagamentos: [],
    };

    mockFetch.mockImplementation((input: any) => {
      const url = typeof input === 'string' ? input : input?.url || '';
      if (typeof url === 'string' && url.includes('/api/rh/parcelas')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ parcelas: [] }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockData),
      });
    });

    render(<ContaSection />);

    await waitFor(() => {
      expect(screen.getByText('Clínica Vigencia')).toBeInTheDocument();
    });

    // Ir para a aba Plano para visualizar Vigência
    fireEvent.click(screen.getByRole('button', { name: /Plano/ }));

    await waitFor(() => {
      expect(screen.getByText('Vigência')).toBeInTheDocument();
    });

    const vigLabel = screen.getByText('Vigência');
    const vigContainer = vigLabel.closest('div');
    expect(vigContainer).not.toBeNull();
    // O conteúdo de vigência deve ser apenas um único traço quando ausente
    expect(
      within(vigContainer as HTMLElement).getByText(/^—$/)
    ).toBeInTheDocument();
  });

  it('calcula vigência como data de contratação + 364 dias', async () => {
    const mockData = {
      clinica: {
        id: 4,
        nome: 'Clínica Vigencia Calc',
        plano: {
          data_contratacao: '2025-01-01T00:00:00.000Z',
          data_fim_vigencia: '2025-12-31T00:00:00.000Z', // deve ser ignorada
        },
      },
      gestores: [],
      pagamentos: [],
    };

    mockFetch.mockImplementation((input: any) => {
      const url = typeof input === 'string' ? input : input?.url || '';
      if (typeof url === 'string' && url.includes('/api/rh/parcelas')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ parcelas: [] }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockData),
      });
    });

    render(<ContaSection />);

    await waitFor(() => {
      expect(screen.getByText('Clínica Vigencia Calc')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Plano/ }));

    await waitFor(() => {
      expect(screen.getByText('Vigência')).toBeInTheDocument();
    });

    const vigLabel = screen.getByText('Vigência');
    const vigContainer = vigLabel.closest('div');
    expect(vigContainer).not.toBeNull();
    // Verificar data de início e fim (01/01/2025 — 31/12/2025)
    expect(
      within(vigContainer as HTMLElement).getByText('01/01/2025 — 31/12/2025')
    ).toBeInTheDocument();
  });

  it('calcula vigência a partir da data de pagamento quando contratação ausente', async () => {
    const mockData = {
      clinica: {
        id: 5,
        nome: 'Clínica Vigencia Pagamento',
        plano: {},
      },
      gestores: [],
      pagamentos: [
        {
          id: 10,
          valor: 1000,
          status: 'pago',
          data_pagamento: '2025-02-01T00:00:00.000Z',
          criado_em: '2025-02-01T00:00:00.000Z',
          resumo: {},
        },
      ],
    };

    mockFetch.mockImplementation((input: any) => {
      const url = typeof input === 'string' ? input : input?.url || '';
      if (typeof url === 'string' && url.includes('/api/rh/parcelas')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ parcelas: [] }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockData),
      });
    });

    render(<ContaSection />);

    await waitFor(() => {
      expect(
        screen.getByText('Clínica Vigencia Pagamento')
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Plano/ }));

    await waitFor(() => {
      expect(screen.getByText('Vigência')).toBeInTheDocument();
    });

    const vigLabel = screen.getByText('Vigência');
    const vigContainer = vigLabel.closest('div');
    expect(vigContainer).not.toBeNull();
    // 2025-02-01 + 364 dias = 31/01/2026
    expect(
      within(vigContainer as HTMLElement).getByText('01/02/2025 — 31/01/2026')
    ).toBeInTheDocument();
  });
});
