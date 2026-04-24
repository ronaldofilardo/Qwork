/**
 * @file __tests__/representante/equipe-leads-commission-render.test.tsx
 *
 * Testes de renderização: EquipeLeadsPage — célula de comissão do representante
 *
 * CONTEXTO (12/04/2026):
 * Comissionamento de vendedor foi completamente removido.
 * A UI exibe apenas "Rep: X%" na coluna de comissão.
 * O modal "Definir %" e o botão de ação foram removidos.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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

  test('NÃO exibe botão "Definir %" (modal removido)', async () => {
    mockGetLead({ percentual_comissao_representante: 0 });
    render(<EquipeLeadsPage />);

    await waitFor(() =>
      expect(screen.getByText('Vendedor A')).toBeInTheDocument()
    );

    expect(screen.queryByText(/Definir %/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Alterar %/i)).not.toBeInTheDocument();
  });
});
