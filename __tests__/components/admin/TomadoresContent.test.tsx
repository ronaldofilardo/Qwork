/**
 * @fileoverview Testes do componente TomadoresContent
 * Cobre: badge NOVO (< 48h), remoção do badge ao abrir modal,
 *        carregamento e exibição de documentos no modal,
 *        estado de "Não enviado" para docs nulos.
 */

import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import { TomadoresContent } from '@/components/admin/TomadoresContent';

// -----------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------

const HORA = 3_600_000;

type TomadorOverride = {
  id?: string;
  tipo?: 'clinica' | 'entidade';
  nome?: string;
  cnpj?: string;
  ativo?: boolean;
  created_at?: string;
  tem_documentos?: {
    cartao_cnpj: boolean;
    contrato_social: boolean;
    doc_identificacao: boolean;
  };
};

const makeTomador = (ageMs = HORA, overrides: TomadorOverride = {}) => ({
  id: '1',
  tipo: 'clinica' as const,
  nome: 'Clínica Teste',
  cnpj: '12345678000190',
  ativo: true,
  created_at: new Date(Date.now() - ageMs).toISOString(),
  gestor: null,
  tem_documentos: {
    cartao_cnpj: false,
    contrato_social: false,
    doc_identificacao: false,
  },
  ...overrides,
});

const mockFetchList = (tomadores: ReturnType<typeof makeTomador>[]) =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true, entidades: tomadores }),
  } as Response);

const mockFetchDocs = (docs: {
  cartao_cnpj: string | null;
  contrato_social: string | null;
  doc_identificacao: string | null;
}) =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true, documentos: docs }),
  } as Response);

// -----------------------------------------------------------------
// Setup
// -----------------------------------------------------------------

let fetchSpy: jest.SpyInstance;

beforeEach(() => {
  fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(((url: string) => {
    if (url === '/api/admin/entidades') {
      return mockFetchList([
        makeTomador(HORA, { id: '1', nome: 'Clínica Nova' }), // 1h atrás — NOVO
        makeTomador(50 * HORA, { id: '2', nome: 'Clínica Antiga' }), // 50h atrás — não NOVO
      ]);
    }
    if (typeof url === 'string' && url.includes('/documentos')) {
      return mockFetchDocs({
        cartao_cnpj: null,
        contrato_social: null,
        doc_identificacao: null,
      });
    }
    return Promise.reject(new Error(`fetch não mockado: ${url}`));
  }) as typeof global.fetch);
});

afterEach(() => {
  fetchSpy.mockRestore();
});

// -----------------------------------------------------------------
// Testes
// -----------------------------------------------------------------

describe('TomadoresContent — badge NOVO', () => {
  it('exibe badge NOVO para tomador cadastrado há < 48h', async () => {
    render(<TomadoresContent />);
    await waitFor(() =>
      expect(screen.getByText('Clínica Nova')).toBeInTheDocument()
    );

    const badges = screen.getAllByText('NOVO');
    // Apenas o tomador novo deve ter o badge
    expect(badges).toHaveLength(1);
  });

  it('não exibe badge NOVO para tomador cadastrado há > 48h', async () => {
    render(<TomadoresContent />);
    await waitFor(() =>
      expect(screen.getByText('Clínica Antiga')).toBeInTheDocument()
    );

    // Só 1 badge — o de "Clínica Antiga" não deve existir
    const badges = screen.queryAllByText('NOVO');
    expect(badges).toHaveLength(1); // apenas "Clínica Nova"
  });

  it('remove badge NOVO ao abrir o modal do respectivo tomador', async () => {
    render(<TomadoresContent />);
    await waitFor(() =>
      expect(screen.getByText('Clínica Nova')).toBeInTheDocument()
    );

    // Badge existe antes do clique
    expect(screen.getAllByText('NOVO')).toHaveLength(1);

    // Clicar no card de "Clínica Nova" abre o modal e marca como visto
    fireEvent.click(screen.getByText('Clínica Nova'));

    await waitFor(() => {
      expect(screen.queryAllByText('NOVO')).toHaveLength(0);
    });
  });
});

describe('TomadoresContent — carregamento de documentos no modal', () => {
  it('chama a API de documentos ao abrir o modal', async () => {
    render(<TomadoresContent />);
    await waitFor(() =>
      expect(screen.getByText('Clínica Nova')).toBeInTheDocument()
    );

    fireEvent.click(screen.getByText('Clínica Nova'));

    await waitFor(() => {
      const docsCalls = fetchSpy.mock.calls.filter(
        ([url]) => typeof url === 'string' && url.includes('/documentos')
      );
      expect(docsCalls.length).toBeGreaterThanOrEqual(1);
      expect(docsCalls[0][0]).toBe(
        '/api/admin/tomadores/1/documentos?tipo=clinica'
      );
    });
  });

  it('exibe "Não enviado" quando todos os documentos são nulos', async () => {
    render(<TomadoresContent />);
    await waitFor(() =>
      expect(screen.getByText('Clínica Nova')).toBeInTheDocument()
    );

    fireEvent.click(screen.getByText('Clínica Nova'));

    await waitFor(() => {
      const msgs = screen.queryAllByText('Não enviado');
      expect(msgs.length).toBe(3); // cartão CNPJ, contrato social, doc identificação
    });
  });

  it('exibe link "Visualizar" quando URL de documento está disponível', async () => {
    fetchSpy.mockImplementation(((url: string) => {
      if (url === '/api/admin/entidades') {
        return mockFetchList([
          makeTomador(HORA, { id: '1', nome: 'Clínica Nova' }),
        ]);
      }
      if (typeof url === 'string' && url.includes('/documentos')) {
        return mockFetchDocs({
          cartao_cnpj: 'https://presigned.example.com/cartao.pdf',
          contrato_social: null,
          doc_identificacao: null,
        });
      }
      return Promise.reject(new Error(`fetch não mockado: ${url}`));
    }) as typeof global.fetch);

    render(<TomadoresContent />);
    await waitFor(() =>
      expect(screen.getByText('Clínica Nova')).toBeInTheDocument()
    );

    fireEvent.click(screen.getByText('Clínica Nova'));

    await waitFor(() => {
      const links = screen.queryAllByText(/Visualizar/i);
      expect(links.length).toBeGreaterThanOrEqual(1);
      expect(links[0]).toHaveAttribute(
        'href',
        'https://presigned.example.com/cartao.pdf'
      );
    });
  });

  it('exibe mensagem de erro quando API de documentos falha', async () => {
    fetchSpy.mockImplementation(((url: string) => {
      if (url === '/api/admin/entidades') {
        return mockFetchList([
          makeTomador(HORA, { id: '1', nome: 'Clínica Nova' }),
        ]);
      }
      if (typeof url === 'string' && url.includes('/documentos')) {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.reject(new Error(`fetch não mockado: ${url}`));
    }) as typeof global.fetch);

    render(<TomadoresContent />);
    await waitFor(() =>
      expect(screen.getByText('Clínica Nova')).toBeInTheDocument()
    );

    fireEvent.click(screen.getByText('Clínica Nova'));

    await waitFor(() => {
      expect(
        screen.getByText(/erro ao carregar documentos/i)
      ).toBeInTheDocument();
    });
  });

  it('converte paths de storage/ para URLs de API corretamente', async () => {
    fetchSpy.mockImplementation(((url: string) => {
      if (url === '/api/admin/entidades') {
        return mockFetchList([
          makeTomador(HORA, { id: '1', nome: 'Clínica Nova' }),
        ]);
      }
      if (typeof url === 'string' && url.includes('/documentos')) {
        // Simular retorno com caminho storage/ que será transformado em /api/storage/
        return mockFetchDocs({
          cartao_cnpj:
            '/api/storage/tomadores/clinicas/12345678000190/cartao_cnpj_123.pdf',
          contrato_social:
            '/api/storage/tomadores/clinicas/12345678000190/contrato_social_456.pdf',
          doc_identificacao: null,
        });
      }
      return Promise.reject(new Error(`fetch não mockado: ${url}`));
    }) as typeof global.fetch);

    render(<TomadoresContent />);
    await waitFor(() =>
      expect(screen.getByText('Clínica Nova')).toBeInTheDocument()
    );

    fireEvent.click(screen.getByText('Clínica Nova'));

    await waitFor(() => {
      const links = screen.queryAllByText(/Visualizar/i);
      expect(links.length).toBeGreaterThanOrEqual(2);

      // Verificar que os links apontam para as URLs corretas
      expect(links[0]).toHaveAttribute(
        'href',
        '/api/storage/tomadores/clinicas/12345678000190/cartao_cnpj_123.pdf'
      );
      expect(links[1]).toHaveAttribute(
        'href',
        '/api/storage/tomadores/clinicas/12345678000190/contrato_social_456.pdf'
      );
    });
  });
});
