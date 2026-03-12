/**
 * @fileoverview Testes da página Dashboard do Representante
 */
import { render, screen, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';

// Mock next/navigation e next/link
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/representante/dashboard',
}));

const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

jest.spyOn(console, 'error').mockImplementation(() => {});

// O context
import {
  RepContext,
  type RepresentanteSession,
} from '@/app/representante/(portal)/rep-context';
import DashboardRepresentante from '@/app/representante/(portal)/dashboard/page';

const mockSession: RepresentanteSession = {
  id: 1,
  nome: 'Carlos Rep',
  email: 'carlos@test.dev',
  codigo: 'AB12-CD34',
  status: 'apto',
  tipo_pessoa: 'pf',
  telefone: '11999990000',
  aceite_termos: true,
  aceite_disclaimer_nv: true,
  criado_em: '2026-01-01T00:00:00Z',
  aprovado_em: '2026-01-15T00:00:00Z',
};

function renderWithContext(session: RepresentanteSession | null = mockSession) {
  return render(
    <RepContext.Provider value={{ session }}>
      <DashboardRepresentante />
    </RepContext.Provider>
  );
}

describe('Dashboard do Representante', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  it('deve exibir loading enquanto carrega dados', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));
    renderWithContext();
    expect(
      document.querySelector('.animate-spin') ||
        document.querySelector('.animate-pulse')
    ).toBeTruthy();
  });

  it('deve carregar comissões, vínculos e leads em paralelo', async () => {
    // 3 fetches paralelos: comissoes, vinculos, leads
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            resumo: {
              pendentes: '2',
              liberadas: '1',
              pagas: '5',
              valor_pendente: '200.00',
              valor_liberado: '100.00',
              valor_pago_total: '5000.00',
            },
            comissoes: [],
          }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            vinculos: [
              {
                id: 1,
                entidade_nome: 'Empresa X',
                status: 'ativo',
                dias_para_expirar: 30,
              },
            ],
          }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            leads: [{ id: 1, cnpj: '12345678000190', status: 'pendente' }],
          }),
      } as Response);

    renderWithContext();

    await waitFor(() => {
      // Todos os 3 fetches devem ter sido chamados
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  it('deve exibir resumo de comissões quando dados carregam', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            resumo: {
              pendentes: '2',
              liberadas: '1',
              pagas: '5',
              valor_pendente: '200.00',
              valor_liberado: '100.00',
              valor_pago_total: '5000.00',
            },
            comissoes: [],
          }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ vinculos: [] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ leads: [] }),
      } as Response);

    renderWithContext();

    await waitFor(() => {
      const text = document.body.textContent || '';
      // Verifica que algum valor do resumo aparece na tela
      expect(text).toMatch(/5\.?000|5000/);
    });
  });
});
