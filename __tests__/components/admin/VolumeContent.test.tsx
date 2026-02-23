/**
 * Testes: VolumeContent
 *
 * Cobre:
 *  1. Renderiza título correto para cada sub-aba (Entidade / RH)
 *  2. Exibe skeleton enquanto carrega
 *  3. Exibe dados da API na tabela (liberadas, concluídas, inativadas, taxa)
 *  4. Linha com discrepância > 5 recebe destaque (bg-amber-50)
 *  5. Rodapé de totais é exibido com valores corretos
 *  6. Botão Atualizar rechama o fetch
 *  7. Presets de período chamam fetch com parâmetro correto
 *  8. Filtro de entidade aparece na aba Entidade e chama fetch com entidade_id
 *  9. Exibe mensagem de vazio quando API retorna lista vazia
 * 10. Exibe mensagem de erro quando fetch falha
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
import { VolumeContent } from '@/components/admin/VolumeContent';

// ── Mocks ──────────────────────────────────────────────────────────────────────

// chart.js precisa de canvas — mock simples para jsdom
jest.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="bar-chart" />,
}));

jest.mock('chart.js', () => ({
  Chart: { register: jest.fn() },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  BarElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
}));

// ── Fixtures ───────────────────────────────────────────────────────────────────

const makeDia = (
  data: string,
  liberadas: number,
  concluidas: number,
  inativadas = 0
) => ({
  data,
  liberadas,
  concluidas,
  inativadas,
  taxa: liberadas > 0 ? Math.round((concluidas / liberadas) * 100) : 0,
});

const DADOS_ENTIDADE = [
  makeDia('2026-02-19', 10, 8, 1),
  makeDia('2026-02-18', 5, 2, 0), // discrepância = 3 (não destaca)
  makeDia('2026-02-17', 20, 5, 2), // discrepância = 15 (destaca)
];

const ENTIDADES = [
  { id: 1, nome: 'Entidade Alpha' },
  { id: 2, nome: 'Entidade Beta' },
];

function mockFetchOk(dados = DADOS_ENTIDADE, entidades = ENTIDADES) {
  return jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => ({
      success: true,
      dados,
      entidades,
      periodo_dias: 30,
    }),
  } as Response);
}

function mockFetchRHOk() {
  return jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => ({
      success: true,
      dados: [makeDia('2026-02-19', 6, 6, 0)],
      entidades: [],
      periodo_dias: 30,
    }),
  } as Response);
}

function mockFetchFail() {
  return jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: false,
    json: async () => ({}),
  } as Response);
}

// ── Helpers ────────────────────────────────────────────────────────────────────

async function renderAndWait(subSection = 'entidade') {
  let utils: ReturnType<typeof render>;
  await act(async () => {
    utils = render(<VolumeContent activeSubSection={subSection} />);
  });
  return utils;
}

// ── Testes ─────────────────────────────────────────────────────────────────────

describe('VolumeContent', () => {
  beforeEach(() => jest.clearAllMocks());

  // 1. Título correto por sub-aba
  it('exibe título "Volume de Avaliações — Entidade" para sub-aba entidade', async () => {
    mockFetchOk();
    await renderAndWait('entidade');
    expect(
      screen.getByText(/Volume de Avalia\u00e7\u00f5es\s*—\s*Entidade/i)
    ).toBeInTheDocument();
  });

  it('exibe título "Volume de Avaliações — RH" para sub-aba rh', async () => {
    mockFetchRHOk();
    await renderAndWait('rh');
    expect(
      screen.getByText(/Volume de Avalia\u00e7\u00f5es\s*—\s*RH/i)
    ).toBeInTheDocument();
  });

  // 2. Skeleton durante loading
  it('exibe skeleton enquanto aguarda fetch', () => {
    // fetch nunca resolve durante este teste
    jest.spyOn(global, 'fetch').mockReturnValue(new Promise(() => {}));
    render(<VolumeContent activeSubSection="entidade" />);
    // Busca células com animate-pulse (skeleton)
    const skeletonCells = document.querySelectorAll('.animate-pulse');
    expect(skeletonCells.length).toBeGreaterThan(0);
  });

  // 3. Dados aparecem na tabela
  it('exibe linhas com dados corretos de liberadas, concluídas, inativadas e taxa', async () => {
    mockFetchOk();
    await renderAndWait('entidade');

    // Primeira linha: 19/02/2026 — 10 liberadas, 8 concluídas, 1 inativada, taxa 80%
    expect(screen.getByText('19/02/2026')).toBeInTheDocument();
    expect(screen.getAllByText('10')[0]).toBeInTheDocument();
    expect(screen.getAllByText('8')[0]).toBeInTheDocument();
    expect(screen.getAllByText('1')[0]).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  // 4. Destaque em linha com discrepância > 5
  it('destaca linha onde liberadas - concluídas > 5', async () => {
    mockFetchOk();
    const { container } = await renderAndWait('entidade');

    await waitFor(() => {
      const rows = container.querySelectorAll('tbody tr');
      // Terceira linha: 17/02 — 20 liberadas, 5 concluídas → discrepância 15
      const rowDiscrepante = Array.from(rows).find((r) =>
        r.textContent?.includes('17/02/2026')
      );
      expect(rowDiscrepante).toBeTruthy();
      expect(rowDiscrepante?.className).toMatch(/bg-amber-50/);
    });
  });

  // 5. Rodapé de totais
  it('exibe rodapé com totais corretos', async () => {
    mockFetchOk();
    await renderAndWait('entidade');

    await waitFor(() => {
      // Total liberadas = 10 + 5 + 20 = 35
      expect(screen.getByText('35')).toBeInTheDocument();
      // Total concluídas = 8 + 2 + 5 = 15
      expect(screen.getByText('15')).toBeInTheDocument();
      // Total inativadas = 1 + 0 + 2 = 3
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  // 6. Botão Atualizar rechama fetch
  it('botão Atualizar chama fetch novamente', async () => {
    const fetchSpy = mockFetchOk();
    await renderAndWait('entidade');

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByText('Atualizar'));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2));
  });

  // 7. Presets de período
  it('preset "7 dias" envia dias=7 no fetch', async () => {
    const fetchSpy = mockFetchOk();
    await renderAndWait('entidade');

    fireEvent.click(screen.getByText('7 dias'));

    await waitFor(() => {
      const lastUrl = String(fetchSpy.mock.calls.at(-1)?.[0]);
      expect(lastUrl).toContain('dias=7');
    });
  });

  it('preset "14 dias" envia dias=14 no fetch', async () => {
    const fetchSpy = mockFetchOk();
    await renderAndWait('entidade');

    fireEvent.click(screen.getByText('14 dias'));

    await waitFor(() => {
      const lastUrl = String(fetchSpy.mock.calls.at(-1)?.[0]);
      expect(lastUrl).toContain('dias=14');
    });
  });

  // 8. Filtro por entidade
  it('exibe select de entidades na aba Entidade quando há entidades', async () => {
    mockFetchOk();
    await renderAndWait('entidade');

    await waitFor(() => {
      expect(screen.getByText('Entidade Alpha')).toBeInTheDocument();
      expect(screen.getByText('Entidade Beta')).toBeInTheDocument();
    });
  });

  it('não exibe select de entidades na aba RH', async () => {
    mockFetchRHOk();
    await renderAndWait('rh');

    await waitFor(() => {
      expect(screen.queryByText('Entidade Alpha')).toBeNull();
    });
  });

  it('selecionar entidade inclui entidade_id no fetch', async () => {
    const fetchSpy = mockFetchOk();
    await renderAndWait('entidade');

    await waitFor(() =>
      expect(screen.getByText('Entidade Alpha')).toBeInTheDocument()
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '1' } });

    await waitFor(() => {
      const lastUrl = String(fetchSpy.mock.calls.at(-1)?.[0]);
      expect(lastUrl).toContain('entidade_id=1');
    });
  });

  // 9. Estado vazio
  it('exibe mensagem quando API retorna lista vazia', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        dados: [],
        entidades: [],
        periodo_dias: 30,
      }),
    } as Response);

    await renderAndWait('entidade');

    await waitFor(() => {
      expect(
        screen.getByText(/Nenhum lote encontrado no per\u00edodo/i)
      ).toBeInTheDocument();
    });
  });

  // 10. Erro de fetch
  it('exibe mensagem de erro quando fetch retorna !ok', async () => {
    mockFetchFail();
    await renderAndWait('entidade');

    await waitFor(() => {
      expect(
        screen.getByText(/Falha ao carregar dados de volume/i)
      ).toBeInTheDocument();
    });
  });

  // 11. Gráfico renderiza
  it('renderiza o gráfico de barras após carregar dados', async () => {
    mockFetchOk();
    await renderAndWait('entidade');

    await waitFor(() => {
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });
  });

  // 12. Parâmetro tipo=entidade vs tipo=rh
  it('envia tipo=entidade na sub-aba entidade', async () => {
    const fetchSpy = mockFetchOk();
    await renderAndWait('entidade');

    await waitFor(() => {
      const url = String(fetchSpy.mock.calls[0]?.[0]);
      expect(url).toContain('tipo=entidade');
    });
  });

  it('envia tipo=rh na sub-aba rh', async () => {
    const fetchSpy = mockFetchRHOk();
    await renderAndWait('rh');

    await waitFor(() => {
      const url = String(fetchSpy.mock.calls[0]?.[0]);
      expect(url).toContain('tipo=rh');
    });
  });
});
