/**
 * @fileoverview Testes da página de leads do representante.
 * Verifica que leads convertidos exibem "Cadastrado em" com data_conversao
 * e que leads pendentes exibem "Expira:" com data_expiracao.
 */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import LeadsRepresentante from '@/app/representante/(portal)/leads/page';
import { RepContext } from '@/app/representante/(portal)/rep-context';

const mockSession = {
  id: 1,
  nome: 'Rep Teste',
  email: 'rep@test.dev',
  codigo: 'REP-P1123',
  status: 'apto',
  tipo_pessoa: 'pf',
  telefone: null,
  aceite_termos: true,
  aceite_disclaimer_nv: true,
  criado_em: '2026-01-01T00:00:00Z',
  aprovado_em: '2026-01-10T00:00:00Z',
};

const leadPendente = {
  id: 1,
  cnpj: '12345678000190',
  razao_social: 'Lead Pendente LTDA',
  contato_nome: 'Contato A',
  contato_email: 'a@a.com',
  status: 'pendente',
  criado_em: '2026-02-01T10:00:00Z',
  data_expiracao: '2026-05-01T10:00:00Z',
  data_conversao: null,
  token_atual: null,
  token_expiracao: null,
};

const leadConvertido = {
  id: 2,
  cnpj: '98765432000100',
  razao_social: 'Lead Convertido SA',
  contato_nome: 'Contato B',
  contato_email: 'b@b.com',
  status: 'convertido',
  criado_em: '2026-02-02T09:00:00Z',
  data_expiracao: '2026-05-02T09:00:00Z',
  data_conversao: '2026-03-01T14:30:00Z',
  token_atual: null,
  token_expiracao: null,
};

function mockFetch(leads: object[]) {
  global.fetch = jest.fn((url: string) => {
    if (url.includes('/api/representante/me')) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            representante: {
              percentual_comissao: 10,
              percentual_comissao_comercial: 0,
              modelo_comissionamento: 'percentual',
              valor_custo_fixo_entidade: 12,
              valor_custo_fixo_clinica: 5,
            },
          }),
      });
    }
    // Default para outras rotas
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          leads,
          total: leads.length,
          page: 1,
          limit: 20,
          contagens: { pendente: 1, convertido: 1, expirado: 0 },
        }),
    });
  });
}

function renderPage() {
  return render(
    <RepContext.Provider value={{ session: mockSession }}>
      <LeadsRepresentante />
    </RepContext.Provider>
  );
}

describe('LeadsRepresentante – exibição de datas no card', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lead pendente exibe "Expira:" com data_expiracao', async () => {
    mockFetch([leadPendente]);
    renderPage();

    await waitFor(() =>
      expect(screen.getByText('Lead Pendente LTDA')).toBeInTheDocument()
    );

    expect(screen.getByText(/Expira:/i)).toBeInTheDocument();
    // 01/05/2026
    expect(screen.getByText(/01\/05\/2026/i)).toBeInTheDocument();
    expect(screen.queryByText(/Cadastrado em:/i)).not.toBeInTheDocument();
  });

  it('lead convertido exibe "Cadastrado em:" com data_conversao em verde', async () => {
    mockFetch([leadConvertido]);
    renderPage();

    await waitFor(() =>
      expect(screen.getByText('Lead Convertido SA')).toBeInTheDocument()
    );

    expect(screen.getByText(/Cadastrado em:/i)).toBeInTheDocument();
    // 01/03/2026
    expect(screen.getByText(/01\/03\/2026/i)).toBeInTheDocument();
    // Não deve mostrar "Expira:" para lead convertido
    expect(screen.queryByText(/^Expira:/i)).not.toBeInTheDocument();
  });

  it('lead convertido com data_conversao null exibe "—"', async () => {
    mockFetch([{ ...leadConvertido, data_conversao: null }]);
    renderPage();

    await waitFor(() =>
      expect(screen.getByText('Lead Convertido SA')).toBeInTheDocument()
    );

    const cadastradoSpan = screen.getByText(/Cadastrado em:/i);
    expect(cadastradoSpan.textContent).toContain('—');
  });

  it('lead convertido não exibe alerta de expiração próxima', async () => {
    // expira em menos de 7 dias mas é convertido — não deve aparecer alerta
    const expirandoConvertido = {
      ...leadConvertido,
      data_expiracao: new Date(
        Date.now() + 2 * 24 * 60 * 60 * 1000
      ).toISOString(),
    };
    mockFetch([expirandoConvertido]);
    renderPage();

    await waitFor(() =>
      expect(screen.getByText('Lead Convertido SA')).toBeInTheDocument()
    );

    expect(screen.queryByText(/⚠ Expira em/i)).not.toBeInTheDocument();
  });

  it('lista com ambos os leads exibe datas corretas em cada card', async () => {
    mockFetch([leadPendente, leadConvertido]);
    renderPage();

    await waitFor(() =>
      expect(screen.getByText('Lead Pendente LTDA')).toBeInTheDocument()
    );
    expect(screen.getByText('Lead Convertido SA')).toBeInTheDocument();

    expect(screen.getByText(/Expira:/i)).toBeInTheDocument();
    expect(screen.getByText(/Cadastrado em:/i)).toBeInTheDocument();
  });
});
