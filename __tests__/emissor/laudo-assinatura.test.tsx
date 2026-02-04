import { render, screen, waitFor } from '@testing-library/react';
// Jest globals available by default
import EditarLaudo from '@/app/emissor/laudo/[loteId]/page';
import { LaudoPadronizado } from '@/lib/laudo-tipos';

// Mock do Next.js router
const mockPush = jest.fn();
const mockParams = { loteId: '123' };

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useParams: () => mockParams,
}));

// Mock do toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    loading: jest.fn(),
    dismiss: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe.skip('Página do Laudo do Emissor - Assinatura gov.br', () => {
  const mockLaudoPadronizadoEmitido: LaudoPadronizado = {
    etapa1: {
      empresaAvaliada: 'Empresa Teste Ltda',
      cnpj: '12.345.678/0001-90',
      endereco: 'Rua Teste, 123',
      periodoAvaliacoes: {
        dataLiberacao: '2024-01-01',
        dataUltimaConclusao: '2024-01-31',
      },
      totalFuncionariosAvaliados: 50,
      percentualConclusao: 100,
      amostra: {
        operacional: 40,
        gestao: 10,
      },
    },
    etapa2: [],
    etapa3: {
      textoPrincipal: 'Análise dos resultados',
      gruposAtencao: [],
      gruposMonitoramento: [],
      gruposExcelente: [],
      conclusao: 'Conclusão do laudo',
    },
    etapa4: {
      observacoesLaudo: 'Observações do emissor',
      textoConclusao: 'Texto de conclusão',
      dataEmissao: 'São Paulo, 15 de dezembro de 2025',
      assinatura: {
        nome: 'Dr. João Silva',
        titulo: 'Psicólogo',
        registro: 'CRP 06/12345',
        empresa: 'QWork',
      },
    },
    observacoesEmissor: 'Observações adicionais',
    status: 'enviado',
    criadoEm: '2025-12-01T10:00:00Z',
    emitidoEm: '2025-12-15T14:30:00Z',
    enviadoEm: '2025-12-16T09:00:00Z',
  };

  const mockLote = {
    id: 123,
    empresa_nome: 'Empresa Teste',
    clinica_nome: 'Clínica Teste',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('deve exibir a assinatura gov.br corretamente quando o laudo está emitido', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          success: true,
          lote: mockLote,
          laudoPadronizado: mockLaudoPadronizadoEmitido,
        }),
    });

    render(<EditarLaudo />);

    await waitFor(() => {
      expect(
        screen.getByText('Documento assinado digitalmente')
      ).toBeInTheDocument();
    });

    // Verificar elementos da assinatura gov.br
    expect(
      screen.getByText('São Paulo, 15 de dezembro de 2025')
    ).toBeInTheDocument();
    expect(screen.getByAltText('gov.br')).toBeInTheDocument();
    expect(screen.getByText('DR. JOÃO SILVA')).toBeInTheDocument();
    expect(
      screen.getByText('Data: 15/12/2025 11:30:00 -0300')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Verifique em https://verificador.iti.br')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Coordenador Responsável Técnico – QWork')
    ).toBeInTheDocument();
  });

  it('deve usar a data de emissão do laudo para a assinatura', async () => {
    const laudoComDataDiferente = {
      ...mockLaudoPadronizadoEmitido,
      emitidoEm: '2025-12-10T16:45:00Z',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          success: true,
          lote: mockLote,
          laudoPadronizado: laudoComDataDiferente,
        }),
    });

    render(<EditarLaudo />);

    await waitFor(() => {
      expect(
        screen.getByText('Documento assinado digitalmente')
      ).toBeInTheDocument();
    });

    // Deve mostrar a data de emissão específica, não a data atual
    expect(
      screen.getByText('Data: 10/12/2025 13:45:00 -0300')
    ).toBeInTheDocument();
  });

  it('não deve exibir assinatura quando o laudo está em rascunho', async () => {
    const laudoRascunho = {
      ...mockLaudoPadronizadoEmitido,
      status: 'rascunho' as const,
      emitidoEm: undefined,
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          success: true,
          lote: mockLote,
          laudoPadronizado: laudoRascunho,
        }),
    });

    render(<EditarLaudo />);

    await waitFor(() => {
      expect(screen.getByText('Observações do Emissor')).toBeInTheDocument();
    });

    // Não deve mostrar a assinatura
    expect(
      screen.queryByText('Documento assinado digitalmente')
    ).not.toBeInTheDocument();
    expect(screen.queryByAltText('gov.br')).not.toBeInTheDocument();
  });

  it('deve exibir assinatura quando o laudo está enviado', async () => {
    const laudoEnviado = {
      ...mockLaudoPadronizadoEmitido,
      status: 'enviado' as const,
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          success: true,
          lote: mockLote,
          laudoPadronizado: laudoEnviado,
        }),
    });

    render(<EditarLaudo />);

    await waitFor(() => {
      expect(
        screen.getByText('Documento assinado digitalmente')
      ).toBeInTheDocument();
    });

    expect(screen.getByText('DR. JOÃO SILVA')).toBeInTheDocument();
    expect(
      screen.getByText('Coordenador Responsável Técnico – QWork')
    ).toBeInTheDocument();
  });

  it('deve ter o layout correto da assinatura gov.br', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          success: true,
          lote: mockLote,
          laudoPadronizado: mockLaudoPadronizadoEmitido,
        }),
    });

    render(<EditarLaudo />);

    await waitFor(() => {
      expect(
        screen.getByText('Documento assinado digitalmente')
      ).toBeInTheDocument();
    });

    // Verificar se o container tem as classes corretas
    const assinaturaContainer = screen
      .getByText('São Paulo, 15 de dezembro de 2025')
      .closest('.bg-white');
    expect(assinaturaContainer).toHaveClass(
      'border',
      'border-gray-200',
      'rounded-lg',
      'p-8',
      'max-w-2xl',
      'mx-auto',
      'text-center',
      'shadow-sm'
    );

    // Verificar se o logo tem a classe correta
    const logo = screen.getByAltText('gov.br');
    expect(logo).toHaveClass('h-12', 'w-auto');
  });
});
