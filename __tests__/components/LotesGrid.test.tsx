/**
 * @file __tests__/components/LotesGrid.test.tsx
 * Testes: LotesGrid component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { LotesGrid } from '@/components/rh/LotesGrid';

describe('LotesGrid component', () => {
  it('exibe barra de progresso com percentual quando taxa_conclusao está presente', () => {
    // ATUALIZADO: "(informativa)" foi substituído por barra de progresso visual (Migration 1130)
    const lotes = [
      {
        id: 1,
        titulo: 'Lote Teste',
        tipo: 'inicial',
        status: 'concluido',
        liberado_em: new Date().toISOString(),
        total_avaliacoes: 10,
        avaliacoes_concluidas: 6,
        avaliacoes_inativadas: 0,
        pode_emitir_laudo: false,
        motivos_bloqueio: [],
        taxa_conclusao: 60.0,
      },
    ];

    render(
      <LotesGrid
        lotes={lotes as any}
        laudos={[]}
        downloadingLaudo={null}
        onLoteClick={jest.fn()}
        onRelatorioSetor={jest.fn()}
        onDownloadLaudo={jest.fn()}
      />
    );

    // Progress bar exibe "60%" ao invés de "60.00% (informativa)"
    expect(screen.getByText(/60%/)).toBeInTheDocument();
    // Exibe o texto do threshold mínimo (60% < 70%, mostra "mín. 70%")
    expect(
      screen.getByText(/mín\..*para solicitar laudo/i)
    ).toBeInTheDocument();
    // Não usa mais o texto "(informativa)"
    expect(screen.queryByText(/informativa/i)).not.toBeInTheDocument();
  });

  it('exibe badge "Liberado para solicitar laudo" quando taxa >= 70%', () => {
    const lotes = [
      {
        id: 2,
        titulo: 'Lote 70',
        tipo: 'inicial',
        status: 'concluido',
        liberado_em: new Date().toISOString(),
        total_avaliacoes: 10,
        avaliacoes_concluidas: 7,
        avaliacoes_inativadas: 0,
        pode_emitir_laudo: true,
        motivos_bloqueio: [],
        taxa_conclusao: 70.0,
      },
    ];

    render(
      <LotesGrid
        lotes={lotes as any}
        laudos={[]}
        downloadingLaudo={null}
        onLoteClick={jest.fn()}
        onRelatorioSetor={jest.fn()}
        onDownloadLaudo={jest.fn()}
      />
    );

    expect(
      screen.getByText(/Liberado para solicitar laudo/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/70%/)).toBeInTheDocument();
  });
});
