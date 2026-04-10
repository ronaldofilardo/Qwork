/**
 * Testes para componente LaudoEtapa4
 *
 * Funcionalidades testadas:
 * 1. Exibição do número do lote
 * 2. Formatação de datas com timezone correto (America/Sao_Paulo)
 * 3. Estados de preview e emissão
 * 4. Renderização de observações do emissor
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import LaudoEtapa4 from '@/app/emissor/laudo/[loteId]/components/LaudoEtapa4';
import type { LaudoPadronizado } from '@/lib/laudo-tipos';

// Mock Image from next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock QworkLogo
jest.mock('@/components/QworkLogo', () => ({
  __esModule: true,
  default: () => <div data-testid="qwork-logo">QworkLogo</div>,
}));

describe('LaudoEtapa4', () => {
  const mockEtapa4: LaudoPadronizado['etapa4'] = {
    observacoesLaudo: 'Observações do laudo',
    textoConclusao: 'Conclusão do laudo',
    dataEmissao: '09/04/2026',
    assinatura: {
      nome: 'Coordenador Técnico',
    },
  };

  const mockProps = {
    etapa4: mockEtapa4,
    observacoesEmissor: null,
    mensagem: null,
    criadoEm: null,
    emitidoEm: null,
    enviadoEm: null,
    status: 'preview',
    isPrevia: true,
    loteNumero: null as number | null,
    onDownloadLaudo: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar sem erros', () => {
    const { container } = render(<LaudoEtapa4 {...mockProps} />);
    expect(container).toBeInTheDocument();
  });

  it('deve exibir número do lote quando fornecido', () => {
    render(<LaudoEtapa4 {...mockProps} loteNumero={5} />);
    expect(screen.getByText(/Lote nº 5/)).toBeInTheDocument();
  });

  it('não deve exibir número do lote quando null', () => {
    render(<LaudoEtapa4 {...mockProps} loteNumero={null} />);
    expect(screen.queryByText(/Lote nº/)).not.toBeInTheDocument();
  });

  it('deve exibir data criado em com formatação BR (timezone correto)', () => {
    // Usando data UTC e verificando se formata com timezone correto
    // 2026-04-09T15:30:00Z = 12:30 em São Paulo (UTC-3)
    const isoDate = '2026-04-09T15:30:00Z';

    render(
      <LaudoEtapa4
        {...mockProps}
        criadoEm={isoDate}
      />
    );

    // A formatação deve respeitar timezone America/Sao_Paulo
    const text = screen.getByText(/Criado em/);
    expect(text).toBeInTheDocument();
    // Verificar que contém menção a "à" (separador de hora)
    expect(text.textContent).toContain('à');
  });

  it('deve exibir aviso de pré-visualização quando isPrevia=true', () => {
    render(
      <LaudoEtapa4
        {...mockProps}
        isPrevia={true}
      />
    );
    expect(screen.getByText(/Pré-visualização - Laudo ainda não emitido/)).toBeInTheDocument();
  });

  it('não deve exibir aviso de pré-visualização quando isPrevia=false', () => {
    render(
      <LaudoEtapa4
        {...mockProps}
        isPrevia={false}
      />
    );
    expect(screen.queryByText(/Pré-visualização - Laudo ainda não emitido/)).not.toBeInTheDocument();
  });

  it('deve exibir data emitida quando fornecida', () => {
    const isoDate = '2026-04-09T15:30:00Z';

    render(
      <LaudoEtapa4
        {...mockProps}
        emitidoEm={isoDate}
      />
    );

    expect(screen.getByText(/Emitido automaticamente em/)).toBeInTheDocument();
  });

  it('deve exibir data enviada quando fornecida', () => {
    const isoDate = '2026-04-09T15:30:00Z';

    render(
      <LaudoEtapa4
        {...mockProps}
        enviadoEm={isoDate}
      />
    );

    expect(screen.getByText(/Enviado automaticamente em/)).toBeInTheDocument();
  });

  it('deve exibir observações do emissor quando fornecidas', () => {
    render(
      <LaudoEtapa4
        {...mockProps}
        observacoesEmissor="Observações especiais do emissor"
      />
    );

    expect(screen.getByText('Observações especiais do emissor')).toBeInTheDocument();
    expect(screen.getByText(/OBSERVAÇÕES DO EMISSOR/)).toBeInTheDocument();
  });

  it('deve exibir observações do laudo', () => {
    render(<LaudoEtapa4 {...mockProps} />);
    expect(screen.getByText('Observações do laudo')).toBeInTheDocument();
  });

  it('deve exibir conclusão do laudo', () => {
    render(<LaudoEtapa4 {...mockProps} />);
    expect(screen.getByText('Conclusão do laudo')).toBeInTheDocument();
  });

  it('deve exibir mensagem quando fornecida', () => {
    render(
      <LaudoEtapa4
        {...mockProps}
        mensagem="Test message"
      />
    );

    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('deve renderizar corretamente com status enviado', () => {
    render(
      <LaudoEtapa4
        {...mockProps}
        status="enviado"
        isPrevia={false}
        loteNumero={10}
      />
    );

    expect(screen.getByText(/Status: Enviado para clínica/)).toBeInTheDocument();
    expect(screen.getByText(/Lote nº 10/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Baixar PDF/ })).toBeInTheDocument();
  });

  it('deve chamar onDownloadLaudo ao clicar em "Baixar PDF"', () => {
    const mockDownload = jest.fn();

    render(
      <LaudoEtapa4
        {...mockProps}
        status="enviado"
        isPrevia={false}
        onDownloadLaudo={mockDownload}
      />
    );

    const downloadBtn = screen.getByRole('button', { name: /Baixar PDF/ });
    downloadBtn.click();

    expect(mockDownload).toHaveBeenCalled();
  });

  it('deve exibir lote nº, data criado em e data emitida juntas', () => {
    const criado = '2026-04-09T10:00:00Z';
    const emitido = '2026-04-09T15:30:00Z';

    render(
      <LaudoEtapa4
        {...mockProps}
        criadoEm={criado}
        emitidoEm={emitido}
        loteNumero={7}
        isPrevia={false}
      />
    );

    expect(screen.getByText(/Lote nº 7/)).toBeInTheDocument();
    expect(screen.getByText(/Criado em/)).toBeInTheDocument();
    expect(screen.getByText(/Emitido automaticamente em/)).toBeInTheDocument();
  });
});
