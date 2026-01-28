import React from 'react';
import { render, screen } from '@testing-library/react';
import { LotesGrid } from '@/components/rh/LotesGrid';

describe('LotesGrid component', () => {
  it('exibe taxa de conclusão como informativa quando presente', () => {
    const lotes = [
      {
        id: 1,
        codigo: 'LOTE-001',
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

    expect(screen.getByText(/Taxa de conclusão/i)).toBeInTheDocument();
    expect(screen.getByText(/60.00%/)).toBeInTheDocument();
    expect(screen.getByText(/informativa/i)).toBeInTheDocument();
  });
});
