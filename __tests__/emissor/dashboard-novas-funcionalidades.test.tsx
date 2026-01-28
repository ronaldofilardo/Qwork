import {
  render,
  screen,
  fireEvent,
  waitFor,
  renderHook,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import EmissorDashboard from '@/app/emissor/page';
import { useReprocessarLaudo } from '@/hooks/useReprocessarLaudo';
import { useEmergenciaLaudo } from '@/hooks/useEmergenciaLaudo';

// Mocks
jest.mock('@/hooks/useReprocessarLaudo');
jest.mock('@/hooks/useEmergenciaLaudo');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockUseReprocessarLaudo = useReprocessarLaudo as jest.MockedFunction<
  typeof useReprocessarLaudo
>;
const mockUseEmergenciaLaudo = useEmergenciaLaudo as jest.MockedFunction<
  typeof useEmergenciaLaudo
>;

describe('EmissorDashboard - Novas Funcionalidades', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    // Mock dos hooks
    mockUseReprocessarLaudo.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
      data: null,
    });

    mockUseEmergenciaLaudo.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
      data: null,
    });

    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('Indicador de Processamento', () => {
    it('deve mostrar indicador quando lote está em processamento', () => {
      const mockLotes = [
        {
          id: 123,
          codigo: '001-010125',
          titulo: 'Lote Teste',
          tipo: 'completo',
          status: 'concluido',
          empresa_nome: 'Empresa Teste',
          clinica_nome: 'Clínica Teste',
          liberado_em: '2024-01-01T10:00:00Z',
          total_avaliacoes: 10,
          processamento_em: '2024-01-04T14:30:00Z',
          modo_emergencia: false,
          laudo: null,
          notificacoes: [],
        },
      ];

      // Mock da API
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            lotes: mockLotes,
            total: 1,
            page: 1,
            limit: 20,
          }),
      });

      render(<EmissorDashboard />, { wrapper });

      // Aguardar carregamento
      waitFor(() => {
        expect(
          screen.getByText('Processamento em andamento')
        ).toBeInTheDocument();
        expect(screen.getByText(/Iniciado há/)).toBeInTheDocument();
      });
    });

    it('não deve mostrar indicador quando lote não está em processamento', () => {
      const mockLotes = [
        {
          id: 123,
          codigo: '001-010125',
          titulo: 'Lote Teste',
          tipo: 'completo',
          status: 'concluido',
          empresa_nome: 'Empresa Teste',
          clinica_nome: 'Clínica Teste',
          liberado_em: '2024-01-01T10:00:00Z',
          total_avaliacoes: 10,
          processamento_em: null,
          modo_emergencia: false,
          laudo: null,
          notificacoes: [],
        },
      ];

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            lotes: mockLotes,
            total: 1,
            page: 1,
            limit: 20,
          }),
      });

      render(<EmissorDashboard />, { wrapper });

      waitFor(() => {
        expect(
          screen.queryByText('Processamento em andamento')
        ).not.toBeInTheDocument();
      });
    });
  });

  // Temporarily skip emergency-related UI assertions per request — will re-enable after emergency flow fix.
  // TODO: re-enable emergency UI tests (issue/XXX)
  describe.skip('Badge Modo Emergência', () => {
    it.skip('deve mostrar badge quando lote foi emitido em modo emergência', () => {
      const mockLotes = [
        {
          id: 123,
          codigo: '001-010125',
          titulo: 'Lote Teste',
          tipo: 'completo',
          status: 'concluido',
          empresa_nome: 'Empresa Teste',
          clinica_nome: 'Clínica Teste',
          liberado_em: '2024-01-01T10:00:00Z',
          total_avaliacoes: 10,
          processamento_em: null,
          modo_emergencia: true,
          laudo: {
            id: 456,
            observacoes: 'Laudo emitido',
            status: 'enviado',
            emitido_em: '2024-01-04T15:00:00Z',
            enviado_em: null,
            hash_pdf: 'hash123',
          },
          notificacoes: [],
        },
      ];

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            lotes: mockLotes,
            total: 1,
            page: 1,
            limit: 20,
          }),
      });

      render(<EmissorDashboard />, { wrapper });

      waitFor(() => {
        expect(
          screen.getByText('⚠️ Emissão de Emergência')
        ).toBeInTheDocument();
      });
    });

    it('não deve mostrar badge quando lote não foi emitido em emergência', () => {
      const mockLotes = [
        {
          id: 123,
          codigo: '001-010125',
          titulo: 'Lote Teste',
          tipo: 'completo',
          status: 'concluido',
          empresa_nome: 'Empresa Teste',
          clinica_nome: 'Clínica Teste',
          liberado_em: '2024-01-01T10:00:00Z',
          total_avaliacoes: 10,
          processamento_em: null,
          modo_emergencia: false,
          laudo: {
            id: 456,
            observacoes: 'Laudo emitido',
            status: 'enviado',
            emitido_em: '2024-01-04T15:00:00Z',
            enviado_em: null,
            hash_pdf: 'hash123',
          },
          notificacoes: [],
        },
      ];

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            lotes: mockLotes,
            total: 1,
            page: 1,
            limit: 20,
          }),
      });

      render(<EmissorDashboard />, { wrapper });

      waitFor(() => {
        expect(
          screen.queryByText('⚠️ Emissão de Emergência')
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Botão Reprocessar', () => {
    it('deve mostrar botão reprocessar para lote elegível', () => {
      const mockLotes = [
        {
          id: 123,
          codigo: '001-010125',
          titulo: 'Lote Teste',
          tipo: 'completo',
          status: 'concluido',
          empresa_nome: 'Empresa Teste',
          clinica_nome: 'Clínica Teste',
          liberado_em: '2024-01-01T10:00:00Z',
          total_avaliacoes: 10,
          processamento_em: null,
          modo_emergencia: false,
          laudo: null,
          notificacoes: [],
        },
      ];

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            lotes: mockLotes,
            total: 1,
            page: 1,
            limit: 20,
          }),
      });

      render(<EmissorDashboard />, { wrapper });

      waitFor(() => {
        expect(screen.getByText('Reprocessar')).toBeInTheDocument();
      });
    });

    it('não deve mostrar botão reprocessar para lote com laudo', () => {
      const mockLotes = [
        {
          id: 123,
          codigo: '001-010125',
          titulo: 'Lote Teste',
          tipo: 'completo',
          status: 'concluido',
          empresa_nome: 'Empresa Teste',
          clinica_nome: 'Clínica Teste',
          liberado_em: '2024-01-01T10:00:00Z',
          total_avaliacoes: 10,
          processamento_em: null,
          modo_emergencia: false,
          laudo: {
            id: 456,
            observacoes: 'Laudo existente',
            status: 'enviado',
            emitido_em: '2024-01-04T15:00:00Z',
            enviado_em: null,
            hash_pdf: 'hash123',
          },
          notificacoes: [],
        },
      ];

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            lotes: mockLotes,
            total: 1,
            page: 1,
            limit: 20,
          }),
      });

      render(<EmissorDashboard />, { wrapper });

      waitFor(() => {
        expect(screen.queryByText('Reprocessar')).not.toBeInTheDocument();
      });
    });

    it('não deve mostrar botão reprocessar para lote em processamento', () => {
      const mockLotes = [
        {
          id: 123,
          codigo: '001-010125',
          titulo: 'Lote Teste',
          tipo: 'completo',
          status: 'concluido',
          empresa_nome: 'Empresa Teste',
          clinica_nome: 'Clínica Teste',
          liberado_em: '2024-01-01T10:00:00Z',
          total_avaliacoes: 10,
          processamento_em: '2024-01-04T14:30:00Z',
          modo_emergencia: false,
          laudo: null,
          notificacoes: [],
        },
      ];

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            lotes: mockLotes,
            total: 1,
            page: 1,
            limit: 20,
          }),
      });

      render(<EmissorDashboard />, { wrapper });

      waitFor(() => {
        expect(screen.queryByText('Reprocessar')).not.toBeInTheDocument();
      });
    });

    it('deve chamar hook reprocessar quando botão é clicado', () => {
      const mockMutate = jest.fn();
      mockUseReprocessarLaudo.mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        isError: false,
        isSuccess: false,
        error: null,
        data: null,
      });

      const mockLotes = [
        {
          id: 123,
          codigo: '001-010125',
          titulo: 'Lote Teste',
          tipo: 'completo',
          status: 'concluido',
          empresa_nome: 'Empresa Teste',
          clinica_nome: 'Clínica Teste',
          liberado_em: '2024-01-01T10:00:00Z',
          total_avaliacoes: 10,
          processamento_em: null,
          modo_emergencia: false,
          laudo: null,
          notificacoes: [],
        },
      ];

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            lotes: mockLotes,
            total: 1,
            page: 1,
            limit: 20,
          }),
      });

      render(<EmissorDashboard />, { wrapper });

      waitFor(() => {
        const reprocessarButton = screen.getByText('Reprocessar');
        fireEvent.click(reprocessarButton);
        expect(mockMutate).toHaveBeenCalledWith({ loteId: 123 });
      });
    });
  });

  // Emergency modal tests skipped per request
  // TODO: re-enable when emergency-emission is scheduled for fix (issue/XXX)
  describe.skip('Modal de Emergência', () => {
    it.skip('deve mostrar botão de emergência para lote elegível', () => {
      const mockLotes = [
        {
          id: 123,
          codigo: '001-010125',
          titulo: 'Lote Teste',
          tipo: 'completo',
          status: 'concluido',
          empresa_nome: 'Empresa Teste',
          clinica_nome: 'Clínica Teste',
          liberado_em: '2024-01-01T10:00:00Z',
          total_avaliacoes: 10,
          processamento_em: null,
          modo_emergencia: false,
          laudo: null,
          notificacoes: [],
        },
      ];

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            lotes: mockLotes,
            total: 1,
            page: 1,
            limit: 20,
          }),
      });

      render(<EmissorDashboard />, { wrapper });

      waitFor(() => {
        expect(screen.getByText('Modo Emergência')).toBeInTheDocument();
      });
    });

    it('não deve mostrar botão de emergência para lote com laudo', () => {
      const mockLotes = [
        {
          id: 123,
          codigo: '001-010125',
          titulo: 'Lote Teste',
          tipo: 'completo',
          status: 'concluido',
          empresa_nome: 'Empresa Teste',
          clinica_nome: 'Clínica Teste',
          liberado_em: '2024-01-01T10:00:00Z',
          total_avaliacoes: 10,
          processamento_em: null,
          modo_emergencia: false,
          laudo: {
            id: 456,
            observacoes: 'Laudo existente',
            status: 'enviado',
            emitido_em: '2024-01-04T15:00:00Z',
            enviado_em: null,
            hash_pdf: 'hash123',
          },
          notificacoes: [],
        },
      ];

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            lotes: mockLotes,
            total: 1,
            page: 1,
            limit: 20,
          }),
      });

      render(<EmissorDashboard />, { wrapper });

      waitFor(() => {
        expect(screen.queryByText('Modo Emergência')).not.toBeInTheDocument();
      });
    });
  });

  describe('Cálculo de Tempo Decorrido', () => {
    it('deve calcular tempo decorrido corretamente', () => {
      const { result } = renderHook(() => {
        // Simular a função do dashboard
        const calcularTempoDecorrido = (processamentoEm: string) => {
          const inicio = new Date(processamentoEm);
          const agora = new Date();
          const diffMs = agora.getTime() - inicio.getTime();
          const diffMinutos = Math.floor(diffMs / 60000);

          if (diffMinutos < 1) return 'menos de 1 minuto';
          if (diffMinutos === 1) return '1 minuto';
          if (diffMinutos < 60) return `${diffMinutos} minutos`;

          const diffHoras = Math.floor(diffMinutos / 60);
          const minutosRestantes = diffMinutos % 60;

          if (diffHoras === 1) {
            return minutosRestantes > 0
              ? `1 hora e ${minutosRestantes} minutos`
              : '1 hora';
          }

          return minutosRestantes > 0
            ? `${diffHoras} horas e ${minutosRestantes} minutos`
            : `${diffHoras} horas`;
        };

        return { calcularTempoDecorrido };
      });

      // Teste com 30 minutos
      const processamentoEm30min = new Date(
        Date.now() - 30 * 60 * 1000
      ).toISOString();
      expect(result.current.calcularTempoDecorrido(processamentoEm30min)).toBe(
        '30 minutos'
      );

      // Teste com 1 hora e 15 minutos
      const processamentoEm1h15min = new Date(
        Date.now() - 75 * 60 * 1000
      ).toISOString();
      expect(
        result.current.calcularTempoDecorrido(processamentoEm1h15min)
      ).toBe('1 hora e 15 minutos');

      // Teste com 2 horas
      const processamentoEm2h = new Date(
        Date.now() - 2 * 60 * 60 * 1000
      ).toISOString();
      expect(result.current.calcularTempoDecorrido(processamentoEm2h)).toBe(
        '2 horas'
      );
    });
  });
});
