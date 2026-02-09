/**
 * Testes para componentes de geração client-side de PDFs
 * Valida funcionalidade básica e integração com APIs
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LaudoDownloadClient } from '@/components/pdf/LaudoDownloadClient';
import { RelatorioDownloadClient } from '@/components/pdf/RelatorioDownloadClient';

// Mock do jsPDF e html2canvas
jest.mock('jspdf', () => ({
  jsPDF: jest.fn().mockImplementation(() => ({
    addImage: jest.fn(),
    addPage: jest.fn(),
    save: jest.fn(),
  })),
}));

jest.mock('html2canvas', () =>
  jest.fn().mockResolvedValue({
    toDataURL: jest.fn().mockReturnValue('data:image/png;base64,mock'),
    height: 1123,
    width: 794,
  })
);

describe('LaudoDownloadClient', () => {
  const mockHtmlContent = `
    <!DOCTYPE html>
    <html>
      <head><title>Laudo Teste</title></head>
      <body>
        <h1>Laudo de Identificação e Mapeamento de Riscos Psicossociais (NR-1 / GRO)</h1>
        <p>Conteúdo do laudo para teste</p>
      </body>
    </html>
  `;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar o botão de download', () => {
    render(
      <LaudoDownloadClient
        htmlContent={mockHtmlContent}
        filename="laudo-teste"
      />
    );

    expect(screen.getByText(/Baixar Laudo \(PDF\)/i)).toBeInTheDocument();
  });

  it('deve exibir estado de carregamento ao gerar PDF', async () => {
    render(
      <LaudoDownloadClient
        htmlContent={mockHtmlContent}
        filename="laudo-teste"
      />
    );

    const button = screen.getByText(/Baixar Laudo \(PDF\)/i);
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Gerando PDF.../i)).toBeInTheDocument();
    });
  });

  it('deve aceitar loteId como prop', () => {
    render(
      <LaudoDownloadClient
        htmlContent={mockHtmlContent}
        filename="laudo-teste"
        loteId={123}
      />
    );

    expect(screen.getByText(/Baixar Laudo \(PDF\)/i)).toBeInTheDocument();
  });

  it('deve aplicar className personalizada', () => {
    const { container } = render(
      <LaudoDownloadClient
        htmlContent={mockHtmlContent}
        filename="laudo-teste"
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('RelatorioDownloadClient', () => {
  const mockHtmlContent = `
    <!DOCTYPE html>
    <html>
      <head><title>Relatório Teste</title></head>
      <body>
        <h1>Relatório Individual</h1>
        <p>Conteúdo do relatório para teste</p>
      </body>
    </html>
  `;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar o botão de download', () => {
    render(
      <RelatorioDownloadClient
        htmlContent={mockHtmlContent}
        filename="relatorio-teste"
      />
    );

    expect(screen.getByText(/Baixar Relatório \(PDF\)/i)).toBeInTheDocument();
  });

  it('deve exibir estado de carregamento ao gerar PDF', async () => {
    render(
      <RelatorioDownloadClient
        htmlContent={mockHtmlContent}
        filename="relatorio-teste"
      />
    );

    const button = screen.getByText(/Baixar Relatório \(PDF\)/i);
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Gerando PDF.../i)).toBeInTheDocument();
    });
  });

  it('deve aceitar funcionarioNome como prop', () => {
    render(
      <RelatorioDownloadClient
        htmlContent={mockHtmlContent}
        filename="relatorio-teste"
        funcionarioNome="João Silva"
      />
    );

    expect(screen.getByText(/Baixar Relatório \(PDF\)/i)).toBeInTheDocument();
  });

  it('deve aplicar className personalizada', () => {
    const { container } = render(
      <RelatorioDownloadClient
        htmlContent={mockHtmlContent}
        filename="relatorio-teste"
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('Integração com mensagens de ajuda', () => {
  const mockHtmlContent = '<html><body>Test</body></html>';

  it('LaudoDownloadClient deve exibir mensagem de processamento local', () => {
    render(<LaudoDownloadClient htmlContent={mockHtmlContent} />);

    expect(
      screen.getByText(/PDF gerado no seu navegador/i)
    ).toBeInTheDocument();
  });

  it('RelatorioDownloadClient deve exibir mensagem de processamento local', () => {
    render(<RelatorioDownloadClient htmlContent={mockHtmlContent} />);

    expect(
      screen.getByText(/PDF gerado no seu navegador/i)
    ).toBeInTheDocument();
  });
});
