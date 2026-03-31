/**
 * @file __tests__/representante/equipe-leads-commission-render.test.tsx
 *
 * Testes de renderização: EquipeLeadsPage — comissão sem campo de vendedor
 *
 * CONTEXTO (30/03/2026):
 * A UI do representante foi atualizada para remover o campo "% Vendedor"
 * da célula de comissão e do modal de definição. A interface exibe
 * apenas "Rep: X%" e o modal só possui o input "% Representante".
 *
 * Cobre:
 * - Célula de comissão exibe "Rep: X%" mas NÃO "Vend: X%"
 * - Lead com percRep = 0 exibe "Pendente", sem "Vend:"
 * - Modal apresenta "% Representante" e NÃO "% Vendedor"
 * - Body do PATCH NÃO inclui percentual_comissao_vendedor
 */

import React from 'react';
import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from '@testing-library/react';
import '@testing-library/jest-dom';

import EquipeLeadsPage from '@/app/representante/(portal)/equipe/leads/page';

// ── helpers de mock ──────────────────────────────────────────────────────────

const LEAD_BASE = {
  id: 42,
  cnpj: '12345678000195',
  razao_social: 'Empresa Teste LTDA',
  contato_nome: 'João Silva',
  status: 'pendente',
  origem: null,
  criado_em: '2026-01-01T00:00:00Z',
  data_expiracao: null,
  vendedor_id: 10,
  vendedor_nome: 'Vendedor A',
  valor_negociado: 0, // zero → bd = null → sem "Total:"
  num_vidas_estimado: null,
  requer_aprovacao_comercial: false,
  tipo_cliente: 'entidade',
};

function mockGetLead(lead: Partial<typeof LEAD_BASE> = {}) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      por_vendedor: [
        {
          vendedor_id: 10,
          vendedor_nome: 'Vendedor A',
          leads: [{ ...LEAD_BASE, ...lead }],
        },
      ],
      diretos: [],
      total: 1,
    }),
  } as any);
}

// ── testes ───────────────────────────────────────────────────────────────────

describe('EquipeLeadsPage — célula de comissão', () => {
  test('exibe "Rep: 15.0%" quando percRep = 15', async () => {
    mockGetLead({ percentual_comissao_representante: 15 });
    render(<EquipeLeadsPage />);

    await waitFor(() =>
      expect(screen.getByText('Vendedor A')).toBeInTheDocument()
    );

    expect(screen.getByText(/Rep:\s*15\.0%/)).toBeInTheDocument();
  });

  test('NÃO exibe "Vend:" em nenhuma célula quando percRep = 15', async () => {
    mockGetLead({ percentual_comissao_representante: 15 });
    render(<EquipeLeadsPage />);

    await waitFor(() =>
      expect(screen.getByText('Vendedor A')).toBeInTheDocument()
    );

    const allText = document.body.textContent ?? '';
    expect(allText).not.toMatch(/Vend:/);
  });

  test('exibe "Pendente" (sem "Vend:") quando percRep = 0', async () => {
    mockGetLead({ percentual_comissao_representante: 0 });
    render(<EquipeLeadsPage />);

    await waitFor(() =>
      expect(screen.getByText('Vendedor A')).toBeInTheDocument()
    );

    expect(screen.getByText(/Rep:\s*Pendente/)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/Vend:/);
  });

  test('NÃO exibe "Vend:" quando percRep = null', async () => {
    mockGetLead({ percentual_comissao_representante: null });
    render(<EquipeLeadsPage />);

    await waitFor(() =>
      expect(screen.getByText('Vendedor A')).toBeInTheDocument()
    );

    expect(document.body.textContent).not.toMatch(/Vend:/);
  });
});

describe('EquipeLeadsPage — modal de comissão', () => {
  test('modal exibe "% Representante" mas NÃO "% Vendedor"', async () => {
    mockGetLead({ percentual_comissao_representante: 0 });
    render(<EquipeLeadsPage />);

    await waitFor(() =>
      expect(screen.getByText('Definir %')).toBeInTheDocument()
    );

    // Abre o modal
    await act(async () => {
      fireEvent.click(screen.getByText('Definir %'));
    });

    expect(screen.getByText(/Definir Comiss[aã]o/i)).toBeInTheDocument();
    expect(screen.getByText(/% Representante/i)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/% Vendedor/i);
    expect(document.body.textContent).not.toMatch(/Vendedor\s*%/i);
  });

  test('PATCH enviado NÃO inclui percentual_comissao_vendedor', async () => {
    const patchFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        por_vendedor: [
          {
            vendedor_id: 10,
            vendedor_nome: 'Vendedor A',
            leads: [{ ...LEAD_BASE, percentual_comissao_representante: 15 }],
          },
        ],
        diretos: [],
        total: 1,
      }),
    });

    // GET retorna lead; PATCH retorna sucesso; GET pós-salvar retorna atualizado
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          por_vendedor: [
            {
              vendedor_id: 10,
              vendedor_nome: 'Vendedor A',
              leads: [{ ...LEAD_BASE, percentual_comissao_representante: 0 }],
            },
          ],
          diretos: [],
          total: 1,
        }),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Comissão definida com sucesso.' }),
      } as any)
      .mockResolvedValue({
        ok: true,
        json: patchFetch,
      } as any);

    render(<EquipeLeadsPage />);

    await waitFor(() =>
      expect(screen.getByText('Definir %')).toBeInTheDocument()
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Definir %'));
    });

    // Preenche % Rep (input type="text" com placeholder "0.00")
    const input = screen.getByPlaceholderText('0.00');
    await act(async () => {
      fireEvent.change(input, { target: { value: '15' } });
    });

    // Clica em Confirmar
    await act(async () => {
      fireEvent.click(screen.getByText('Confirmar'));
    });

    // Verifica o body do PATCH
    const calls = (global.fetch as jest.Mock).mock.calls;
    const patchCall = calls.find(
      ([url, opts]) =>
        opts?.method === 'PATCH' &&
        String(url).includes('/api/representante/equipe/leads/42')
    );

    expect(patchCall).toBeDefined();
    const body = JSON.parse(patchCall![1].body as string);
    expect(body).toHaveProperty('percentual_comissao_representante');
    expect(body).not.toHaveProperty('percentual_comissao_vendedor');
  });
});
