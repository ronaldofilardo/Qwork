/**
 * Testes para exibição do hash SHA-256 na interface do laudo
 *
 * Funcionalidades testadas:
 * 1. Exibição do hash quando laudo está emitido
 * 2. Não exibição do hash quando em rascunho
 * 3. Exibição do hash quando enviado (para auditoria histórica)
 * 4. Verificação de botões disponíveis no status emitido
 */

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import EditarLaudo from '@/app/emissor/laudo/[loteId]/page';
import { LaudoPadronizado } from '@/lib/laudo-tipos';

// Mock do Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useParams: () => ({
    loteId: '16',
  }),
}));

// Mock do hot-toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    loading: jest.fn(),
    dismiss: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock do fetch
global.fetch = jest.fn();

describe('Exibição do Hash SHA-256 na Interface', () => {
  const mockLote = {
    id: 16,
    empresa_nome: 'Empresa Teste',
    clinica_nome: 'Clínica Teste',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve exibir hash SHA-256 quando laudo está emitido', async () => {
    const mockLaudoEmitido: LaudoPadronizado = {
      etapa1: {
        empresaAvaliada: 'Empresa Teste LTDA',
        cnpj: '00.000.000/0001-00',
        endereco: 'Rua Teste, 1 - São Paulo/SP',
        periodoAvaliacoes: {
          dataLiberacao: '2025-01-01',
          dataUltimaConclusao: '2025-12-31',
        },
        totalFuncionariosAvaliados: 2,
        percentualConclusao: 100,
        amostra: {
          operacional: 1,
          gestao: 1,
        },
      },
      etapa2: [],
      etapa3: {
        interpretacaoGeral: 'Interpretação teste',
        recomendacoes: 'Recomendações teste',
      },
      etapa4: {
        observacoesGerais: 'Observações gerais',
        textoConclusao: 'Conclusão teste',
        dataEmissao: '2025-12-14',
        assinatura: {
          nome: 'Dr. João Silva',
          titulo: 'Psicólogo',
          registro: 'CRP 06/12345',
          empresa: 'Clínica Teste',
        },
      },
      status: 'enviado',
      criadoEm: '2025-12-14T10:00:00Z',
      emitidoEm: '2025-12-14T11:30:00Z',
      hashArquivo:
        '03e0e0e365ea93a0cd56dcca77f4d449a7646d781d5c233116ac68ee9128dc19',
    };

    // Mock da resposta da API
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          success: true,
          lote: mockLote,
          laudoPadronizado: mockLaudoEmitido,
        }),
    });

    render(<EditarLaudo />);

    // Aguardar o carregamento
    await screen.findByText('✅ Emitido em 14/12/2025 às 08:30');

    // Verificar se o hash é exibido
    expect(screen.getByText('🔐 Hash SHA-256:')).toBeInTheDocument();
    expect(
      screen.getByText(
        '03e0e0e365ea93a0cd56dcca77f4d449a7646d781d5c233116ac68ee9128dc19'
      )
    ).toBeInTheDocument();

    // Copy button should exist and copy full hash
    const copyBtn = screen.getByRole('button', {
      name: /copiar hash do laudo/i,
    });
    expect(copyBtn).toBeInTheDocument();

    // mock clipboard and click
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
    });
    copyBtn.click();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      '03e0e0e365ea93a0cd56dcca77f4d449a7646d781d5c233116ac68ee9128dc19'
    );
  });

  it('não deve exibir hash quando laudo está em rascunho', async () => {
    const mockLaudoRascunho: LaudoPadronizado = {
      etapa1: {
        empresaAvaliada: 'Empresa Teste LTDA',
        cnpj: '00.000.000/0001-00',
        endereco: 'Rua Teste, 1 - São Paulo/SP',
        periodoAvaliacoes: {
          dataLiberacao: '2025-01-01',
          dataUltimaConclusao: '2025-12-31',
        },
        totalFuncionariosAvaliados: 2,
        percentualConclusao: 100,
        amostra: {
          operacional: 1,
          gestao: 1,
        },
      },
      etapa2: [],
      etapa3: {
        interpretacaoGeral: 'Interpretação teste',
        recomendacoes: 'Recomendações teste',
      },
      etapa4: {
        observacoesGerais: 'Observações gerais',
        textoConclusao: 'Conclusão teste',
        dataEmissao: '2025-12-14',
        assinatura: {
          nome: 'Dr. João Silva',
          titulo: 'Psicólogo',
          registro: 'CRP 06/12345',
          empresa: 'Clínica Teste',
        },
      },
      status: 'rascunho',
      criadoEm: '2025-12-14T10:00:00Z',
      emitidoEm: null,
      hashArquivo: null,
    };

    // Mock da resposta da API
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          success: true,
          lote: mockLote,
          laudoPadronizado: mockLaudoRascunho,
        }),
    });

    render(<EditarLaudo />);

    // Aguardar o carregamento
    await screen.findByText('📅 Criado em 14/12/2025 às 07:00');

    // Verificar que o hash NÃO é exibido
    expect(screen.queryByText('🔐 Hash SHA-256:')).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        '03e0e0e365ea93a0cd56dcca77f4d449a7646d781d5c233116ac68ee9128dc19'
      )
    ).not.toBeInTheDocument();
  });

  it('deve exibir hash quando laudo foi enviado (para auditoria histórica)', async () => {
    const mockLaudoEnviado: LaudoPadronizado = {
      etapa1: {
        empresaAvaliada: 'Empresa Teste LTDA',
        cnpj: '00.000.000/0001-00',
        endereco: 'Rua Teste, 1 - São Paulo/SP',
        periodoAvaliacoes: {
          dataLiberacao: '2025-01-01',
          dataUltimaConclusao: '2025-12-31',
        },
        totalFuncionariosAvaliados: 2,
        percentualConclusao: 100,
        amostra: {
          operacional: 1,
          gestao: 1,
        },
      },
      etapa2: [],
      etapa3: {
        interpretacaoGeral: 'Interpretação teste',
        recomendacoes: 'Recomendações teste',
      },
      etapa4: {
        observacoesGerais: 'Observações gerais',
        textoConclusao: 'Conclusão teste',
        dataEmissao: '2025-12-14',
        assinatura: {
          nome: 'Dr. João Silva',
          titulo: 'Psicólogo',
          registro: 'CRP 06/12345',
          empresa: 'Clínica Teste',
        },
      },
      status: 'enviado',
      criadoEm: '2025-12-14T10:00:00Z',
      emitidoEm: '2025-12-14T11:30:00Z',
      enviadoEm: '2025-12-14T12:00:00Z',
      hashArquivo:
        '03e0e0e365ea93a0cd56dcca77f4d449a7646d781d5c233116ac68ee9128dc19',
    };

    // Mock da resposta da API
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          success: true,
          lote: mockLote,
          laudoPadronizado: mockLaudoEnviado,
        }),
    });

    render(<EditarLaudo />);

    // Aguardar o carregamento
    await screen.findByText('📤 Enviado em 14/12/2025 às 09:00');

    // Verificar que o hash É exibido (para auditoria histórica)
    expect(screen.getByText('🔐 Hash SHA-256:')).toBeInTheDocument();
    expect(
      screen.getByText(
        '03e0e0e365ea93a0cd56dcca77f4d449a7646d781d5c233116ac68ee9128dc19'
      )
    ).toBeInTheDocument();
  });

  it('deve exibir botões corretos quando laudo está emitido', async () => {
    const mockLaudoEmitido: LaudoPadronizado = {
      etapa1: {
        empresaAvaliada: 'Empresa Teste LTDA',
        cnpj: '00.000.000/0001-00',
        endereco: 'Rua Teste, 1 - São Paulo/SP',
        periodoAvaliacoes: {
          dataLiberacao: '2025-01-01',
          dataUltimaConclusao: '2025-12-31',
        },
        totalFuncionariosAvaliados: 2,
        percentualConclusao: 100,
        amostra: {
          operacional: 1,
          gestao: 1,
        },
      },
      etapa2: [],
      etapa3: {
        textoPrincipal: 'Interpretação teste',
        gruposAtencao: [],
        gruposMonitoramento: [],
        gruposExcelente: [],
        conclusao: 'Recomendações teste',
      },
      etapa4: {
        observacoesLaudo: 'Observações gerais',
        textoConclusao: 'Conclusão teste',
        dataEmissao: '2025-12-14',
        assinatura: {
          nome: 'Dr. João Silva',
          titulo: 'Psicólogo',
          registro: 'CRP 06/12345',
          empresa: 'Clínica Teste',
        },
      },
      status: 'enviado',
      criadoEm: '2025-12-14T10:00:00Z',
      emitidoEm: '2025-12-14T11:30:00Z',
      hashArquivo:
        '03e0e0e365ea93a0cd56dcca77f4d449a7646d781d5c233116ac68ee9128dc19',
    };

    // Mock da resposta da API
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          success: true,
          lote: mockLote,
          laudoPadronizado: mockLaudoEmitido,
        }),
    });

    render(<EditarLaudo />);

    // Aguardar o carregamento
    await screen.findByText('✅ Emitido em 14/12/2025 às 08:30');

    // Verificar que ambos os botões estão presentes
    expect(screen.getByText('📄 Baixar PDF')).toBeInTheDocument();
    expect(screen.getByText('📤 Enviar para Clínica')).toBeInTheDocument();
  });

  it('deve bloquear edição e emissão quando API indicar bloqueio (emissão automática)', async () => {
    const mockLaudoBloqueado: LaudoPadronizado = {
      etapa1: {
        empresaAvaliada: 'Empresa Teste LTDA',
        cnpj: '00.000.000/0001-00',
        endereco: 'Rua Teste, 1 - São Paulo/SP',
        periodoAvaliacoes: {
          dataLiberacao: '2025-01-01',
          dataUltimaConclusao: '2025-12-31',
        },
        totalFuncionariosAvaliados: 2,
        percentualConclusao: 100,
        amostra: {
          operacional: 1,
          gestao: 1,
        },
      },
      etapa2: [],
      etapa3: {
        textoPrincipal: 'Interpretação teste',
        gruposAtencao: [],
        gruposMonitoramento: [],
        gruposExcelente: [],
        conclusao: 'Recomendações teste',
      },
      etapa4: {
        observacoesLaudo: 'Observações gerais',
        textoConclusao: 'Conclusão teste',
        dataEmissao: '2025-12-14',
        assinatura: {
          nome: 'Dr. João Silva',
          titulo: 'Psicólogo',
          registro: 'CRP 06/12345',
          empresa: 'Clínica Teste',
        },
      },
      status: 'emitido',
      criadoEm: '2025-12-14T10:00:00Z',
      emitidoEm: '2025-12-14T08:30:00Z',
      hashPdf: 'abc123',
    };

    // Mock da resposta da API incluindo bloqueio de edição
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          success: true,
          lote: {
            id: 50,
            empresa_nome: 'Empresa Bloqueada',
            clinica_nome: 'Clínica Bloq',
          },
          laudoPadronizado: mockLaudoBloqueado,
          bloqueado_edicao: true,
          previa: false,
          mensagem:
            'Este laudo está programado para emissão automática. Edição manual bloqueada.',
        }),
    });

    render(<EditarLaudo />);

    // Aguardar o carregamento
    await screen.findByText('📅 Criado em 14/12/2025 às 07:00');

    // Verificar que os botões de salvar e emitir NÃO estão presentes
    expect(screen.queryByText('💾 Salvar Rascunho')).not.toBeInTheDocument();
    expect(screen.queryByText('✓ Emitir Laudo')).not.toBeInTheDocument();

    // Verificar que a mensagem de bloqueio é exibida (pode aparecer em múltiplos locais)
    const matches = screen.getAllByText(
      /Este laudo está programado para emissão automática/
    );
    expect(matches.length).toBeGreaterThan(0);

    // Textarea deve estar desabilitada
    const textarea = screen.getByPlaceholderText(
      'Digite suas observações profissionais sobre o laudo...'
    );
    expect(textarea).toBeDisabled();
  });
});
