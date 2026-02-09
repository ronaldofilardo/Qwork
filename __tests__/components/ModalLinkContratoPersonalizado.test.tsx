/**
 * Testes para ModalLinkContratoPersonalizado
 * Valida: exibição de dados, geração de QR code, cópia de link, download
 * @jest-environment jsdom
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ModalLinkContratoPersonalizado from '@/components/modals/ModalLinkContratoPersonalizado';
import QRCode from 'qrcode';

// Mock do QRCode
jest.mock('qrcode');
const mockQRCode = QRCode as jest.Mocked<typeof QRCode>;

describe('ModalLinkContratoPersonalizado', () => {
  const mockProps = {
    isOpen: true,
    onClose: jest.fn(),
    contratoId: 123,
    tomadorNome: 'Empresa Teste LTDA',
    valorPorFuncionario: 100.0,
    numeroFuncionarios: 50,
    valorTotal: 5000.0,
    baseUrl: 'http://localhost:3000', // Para testes - substitui window.location.origin
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Configurar DOM básico para jsdom
    document.body.innerHTML = '';

    // Mock do QRCode
    mockQRCode.toDataURL.mockResolvedValue('data:image/png;base64,mockQRCode');

    // Mock do clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });

    // Mock de document.createElement para download (apenas para 'a')
    const mockLink = {
      href: '',
      download: '',
      click: jest.fn(),
      style: {},
      setAttribute: jest.fn(),
    };
    const origCreateElement = document.createElement.bind(document);
    jest.spyOn(document, 'createElement').mockImplementation((tagName: any) => {
      if (tagName === 'a') return mockLink as any;
      return origCreateElement(tagName);
    });

    const origAppend = document.body.appendChild.bind(document.body);
    jest.spyOn(document.body, 'appendChild').mockImplementation((el: any) => {
      if (el === mockLink) return mockLink as any;
      return origAppend(el);
    });

    const origRemove = document.body.removeChild.bind(document.body);
    jest.spyOn(document.body, 'removeChild').mockImplementation((el: any) => {
      if (el === mockLink) return mockLink as any;
      return origRemove(el);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve renderizar o modal quando isOpen=true', () => {
    render(<ModalLinkContratoPersonalizado {...mockProps} />);

    expect(
      screen.getByText('Contrato Personalizado Gerado')
    ).toBeInTheDocument();
    expect(screen.getByText('Empresa Teste LTDA')).toBeInTheDocument();
  });

  it('não deve renderizar quando isOpen=false', () => {
    const { container } = render(
      <ModalLinkContratoPersonalizado {...mockProps} isOpen={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('deve exibir valores corretamente formatados', () => {
    render(<ModalLinkContratoPersonalizado {...mockProps} />);

    expect(screen.getByText(/R\$\s*100,00/)).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*5000,00/)).toBeInTheDocument();
  });

  it('deve gerar link correto com contratoId', async () => {
    render(<ModalLinkContratoPersonalizado {...mockProps} />);

    await waitFor(() => {
      const inputLink = screen.getByDisplayValue(
        'http://localhost:3000/contrato/123'
      );
      expect(inputLink).toBeInTheDocument();
    });
  });

  it('deve copiar link ao clicar no botão Copiar', async () => {
    render(<ModalLinkContratoPersonalizado {...mockProps} />);

    const botaoCopiar = screen.getByText('Copiar');
    fireEvent.click(botaoCopiar);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'http://localhost:3000/contrato/123'
      );
    });

    // Deve exibir "Copiado!" após copiar
    await waitFor(() => {
      expect(screen.getByText('Copiado!')).toBeInTheDocument();
    });
  });

  it('deve gerar QR Code ao abrir o modal', async () => {
    render(<ModalLinkContratoPersonalizado {...mockProps} />);

    await waitFor(() => {
      expect(mockQRCode.toDataURL).toHaveBeenCalledWith(
        'http://localhost:3000/contrato/123',
        expect.objectContaining({
          width: 256,
          margin: 2,
        })
      );
    });

    // Deve exibir a imagem do QR code
    const qrImage = await screen.findByAltText('QR Code do Contrato');
    expect(qrImage).toHaveAttribute('src', 'data:image/png;base64,mockQRCode');
  });

  it('deve baixar QR Code ao clicar no botão', async () => {
    render(<ModalLinkContratoPersonalizado {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Baixar QR Code')).toBeInTheDocument();
    });

    const botaoBaixar = screen.getByText('Baixar QR Code');
    fireEvent.click(botaoBaixar);

    await waitFor(() => {
      expect(document.createElement).toHaveBeenCalledWith('a');
    });
  });

  it('deve exibir instruções dos próximos passos', () => {
    render(<ModalLinkContratoPersonalizado {...mockProps} />);

    expect(screen.getByText('📋 Próximos Passos')).toBeInTheDocument();
    expect(
      screen.getByText(/Copie o link abaixo ou use o QR Code/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Com pagamento confirmado, você poderá fazer a aprovação final/
      )
    ).toBeInTheDocument();
  });

  it('deve exibir aviso sobre status pendente', () => {
    render(<ModalLinkContratoPersonalizado {...mockProps} />);

    expect(
      screen.getByText(/Status Atual: Aguardando Aceite e Pagamento/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /O login do tomador será liberado automaticamente após o fluxo completo/
      )
    ).toBeInTheDocument();
  });

  it('deve chamar onClose ao clicar no botão Fechar', () => {
    render(<ModalLinkContratoPersonalizado {...mockProps} />);

    const botaoFechar = screen.getByText('Fechar');
    fireEvent.click(botaoFechar);

    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('deve chamar onClose ao clicar no X', () => {
    render(<ModalLinkContratoPersonalizado {...mockProps} />);

    const botaoX = screen.getAllByRole('button')[0]; // Primeiro botão é o X
    fireEvent.click(botaoX);

    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('deve formatar valores monetários corretamente', () => {
    const propsValoresGrandes = {
      ...mockProps,
      valorPorFuncionario: 1234.56,
      numeroFuncionarios: 100,
      valorTotal: 123456.0,
    };

    render(<ModalLinkContratoPersonalizado {...propsValoresGrandes} />);

    expect(screen.getByText(/R\$\s*1234,56/)).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*123456,00/)).toBeInTheDocument();
  });

  it('deve exibir loading ao gerar QR Code', async () => {
    mockQRCode.toDataURL.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve('data:image/png;base64,mockQRCode'), 100)
        )
    );

    render(<ModalLinkContratoPersonalizado {...mockProps} />);

    // Deve exibir spinner enquanto carrega
    const spinners = document.querySelectorAll('.animate-spin');
    expect(spinners.length).toBeGreaterThan(0);

    // Aguarda o QR code carregar
    await waitFor(
      () => {
        expect(screen.getByAltText('QR Code do Contrato')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
});
