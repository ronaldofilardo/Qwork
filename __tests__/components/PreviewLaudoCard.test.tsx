import React from 'react';
import { render, screen } from '@testing-library/react';
import PreviewLaudoCard, {
  useLaudoVisualization,
} from '@/components/emissor/PreviewLaudoCard';

describe('PreviewLaudoCard UI semantics', () => {
  it('shows awaiting message when status is concluido and download disabled', () => {
    render(
      <PreviewLaudoCard loteStatus="concluido" showDownloadButton={true} />
    );
    expect(
      screen.getByText(/Aguardando emissão do laudo/i)
    ).toBeInTheDocument();
    // Download button should not be visible for 'concluido'
    const download = screen.queryByRole('button', { name: /download pdf/i });
    expect(download).toBeNull();
  });

  it('shows finalizado message and download when status is finalizado', () => {
    render(
      <PreviewLaudoCard
        loteStatus="finalizado"
        showDownloadButton={true}
        onDownload={() => {}}
      />
    );
    expect(screen.getByText(/Laudo finalizado e enviado/i)).toBeInTheDocument();
    const download = screen.getByRole('button', { name: /download pdf/i });
    expect(download).toBeInTheDocument();
  });

  it('useLaudoVisualization hook rights', () => {
    const vizConcluido = useLaudoVisualization('concluido');
    expect(vizConcluido.canPreview).toBeTruthy();
    expect(vizConcluido.canDownload).toBeFalsy();

    const vizFinalizado = useLaudoVisualization('finalizado');
    expect(vizFinalizado.canDownload).toBeTruthy();
  });
});
