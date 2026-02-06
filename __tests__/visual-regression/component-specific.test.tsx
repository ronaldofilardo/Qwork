/**
 * Testes de Regressão Visual - Componentes Clínica
 *
 * Garante que os componentes específicos da clínica mantêm layout consistente.
 */

import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock do useSession
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: {
      user: {
        id: '1',
        nome: 'Gestor Clínica',
        tipo_usuario: 'gestor_clinica',
        email: 'gestor@clinica.com',
        clinica_id: '123',
      },
    },
    status: 'authenticated',
  })),
}));

describe('Regressão Visual - Componentes Clínica', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // NotificationCenterClinica removido temporariamente - usa React Query sem QueryClientProvider
  // Requer setup de QueryClient mock para funcionar

  describe('Clínica Sidebar', () => {
    it('deve manter estrutura visual consistente', () => {
      const ClinicaSidebar =
        require('@/components/clinica/ClinicaSidebar').default;
      const { container } = render(
        <ClinicaSidebar activeSection="dashboard" onSectionChange={jest.fn()} />
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it('deve ter itens de menu visíveis', () => {
      const ClinicaSidebar =
        require('@/components/clinica/ClinicaSidebar').default;
      const { container } = render(
        <ClinicaSidebar activeSection="dashboard" onSectionChange={jest.fn()} />
      );

      const menuItems = container.querySelectorAll('button, a');
      expect(menuItems.length).toBeGreaterThan(0);
    });
  });

  describe('LaudosSection', () => {
    it('deve manter estrutura visual consistente', () => {
      const LaudosSection = require('@/components/LaudosSection').default;
      const { container } = render(<LaudosSection />);

      expect(container.firstChild).toMatchSnapshot();
    });
  });
});

describe('Regressão Visual - Componentes RH', () => {
  beforeEach(() => {
    const { useSession } = require('next-auth/react');
    useSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          nome: 'RH User',
          tipo_usuario: 'rh',
          email: 'rh@test.com',
          entidadeId: '123',
        },
      },
      status: 'authenticated',
    });
  });

  describe('GerenciarEmpresas', () => {
    it('deve manter estrutura visual consistente', () => {
      const GerenciarEmpresas =
        require('@/components/GerenciarEmpresas').default;
      const { container } = render(<GerenciarEmpresas />);

      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('DetalhesFuncionario', () => {
    const mockFuncionario = {
      id: '1',
      nome: 'João Silva',
      cpf: '123.456.789-00',
      email: 'joao@test.com',
      empresa: 'Empresa Teste',
    };

    it('deve manter estrutura visual consistente', () => {
      const DetalhesFuncionario =
        require('@/components/DetalhesFuncionario').default;
      const { container } = render(
        <DetalhesFuncionario
          funcionario={mockFuncionario}
          onClose={jest.fn()}
        />
      );

      expect(container.firstChild).toMatchSnapshot();
    });
  });

  // RelatorioSetor removido temporariamente - componente usa estado assíncrono complexo
  // que requer setup de fetch mocks mais elaborado

  describe('ResultadosChart', () => {
    const mockData = [
      { setor: 'TI', score: 85 },
      { setor: 'RH', score: 92 },
      { setor: 'Vendas', score: 78 },
    ];

    it('deve manter estrutura visual consistente', () => {
      const ResultadosChart = require('@/components/ResultadosChart').default;
      const { container } = render(<ResultadosChart data={mockData} />);

      expect(container.firstChild).toMatchSnapshot();
    });
  });
});

describe('Regressão Visual - Componentes Admin', () => {
  beforeEach(() => {
    const { useSession } = require('next-auth/react');
    useSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          nome: 'Admin',
          tipo_usuario: 'admin',
          email: 'admin@test.com',
        },
      },
      status: 'authenticated',
    });
  });

  describe('CentroOperacoes', () => {
    it('deve manter estrutura visual consistente', () => {
      const CentroOperacoes = require('@/components/CentroOperacoes').default;
      const { container } = render(<CentroOperacoes />);

      expect(container.firstChild).toMatchSnapshot();
    });
  });
});

describe('Regressão Visual - Modais', () => {
  describe('ModalInativarAvaliacao', () => {
    it('deve manter estrutura visual consistente', () => {
      const ModalInativarAvaliacao =
        require('@/components/ModalInativarAvaliacao').default;
      const { container } = render(
        <ModalInativarAvaliacao
          avaliacaoId={123}
          funcionarioNome="João Silva"
          funcionarioCpf="12345678900"
          _loteId="1"
          contexto="rh"
          onClose={jest.fn()}
          onSuccess={jest.fn()}
        />
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it('modal deve ter backdrop escuro', () => {
      const ModalInativarAvaliacao =
        require('@/components/ModalInativarAvaliacao').default;
      const { container } = render(
        <ModalInativarAvaliacao
          avaliacaoId={123}
          funcionarioNome="João Silva"
          funcionarioCpf="12345678900"
          _loteId="1"
          contexto="rh"
          onClose={jest.fn()}
          onSuccess={jest.fn()}
        />
      );

      // Verificar que existe um backdrop
      const backdrop = container.querySelector(
        '[class*="bg-black"], [class*="bg-gray"]'
      );
      expect(backdrop).toBeTruthy();
    });
  });

  describe('ModalResetarAvaliacao', () => {
    it('deve manter estrutura visual consistente', () => {
      const ModalResetarAvaliacao =
        require('@/components/ModalResetarAvaliacao').default;
      const { container } = render(
        <ModalResetarAvaliacao
          isOpen={true}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
          avaliacaoId="123"
        />
      );

      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('ModalInserirFuncionario', () => {
    it('deve manter estrutura visual consistente', () => {
      const ModalInserirFuncionario =
        require('@/components/ModalInserirFuncionario').default;
      const { container } = render(
        <ModalInserirFuncionario
          isOpen={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
        />
      );

      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('EditEmployeeModal', () => {
    const mockEmployee = {
      cpf: '123.456.789-00',
      nome: 'João Silva',
      data_nascimento: '1990-01-01',
      setor: 'TI',
      funcao: 'Desenvolvedor',
      email: 'joao@test.com',
      matricula: '12345',
      nivel_cargo: 'operacional' as const,
      turno: 'Diurno',
      escala: '8h',
    };

    it('deve manter estrutura visual consistente', () => {
      const EditEmployeeModal =
        require('@/components/EditEmployeeModal').default;
      const { container } = render(
        <EditEmployeeModal
          funcionario={mockEmployee}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
        />
      );

      expect(container.firstChild).toMatchSnapshot();
    });
  });
});

describe('Regressão Visual - Botões Especiais', () => {
  describe('BotaoSolicitarEmissao', () => {
    it('deve manter estrutura visual consistente', () => {
      const {
        BotaoSolicitarEmissao,
      } = require('@/components/BotaoSolicitarEmissao');
      const { container } = render(
        <BotaoSolicitarEmissao
          loteId={123}
          loteStatus="concluido"
          laudoId={null}
          laudoStatus={null}
          emissaoSolicitada={false}
          temLaudo={false}
          onSuccess={jest.fn()}
        />
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it('deve ter estado quando laudo já emitido', () => {
      const {
        BotaoSolicitarEmissao,
      } = require('@/components/BotaoSolicitarEmissao');
      const { container } = render(
        <BotaoSolicitarEmissao
          loteId={123}
          loteStatus="concluido"
          laudoId={456}
          laudoStatus="emitido"
          emissaoSolicitada={true}
          temLaudo={true}
          onSuccess={jest.fn()}
        />
      );

      expect(container.firstChild).toMatchSnapshot('laudo-emitido');
    });
  });

  describe('LiberarAvaliacoes', () => {
    it('deve manter estrutura visual consistente', () => {
      const LiberarAvaliacoes =
        require('@/components/LiberarAvaliacoes').default;
      const { container } = render(<LiberarAvaliacoes />);

      expect(container.firstChild).toMatchSnapshot();
    });

    it('deve ter botão de liberar visível', () => {
      const LiberarAvaliacoes =
        require('@/components/LiberarAvaliacoes').default;
      const { container } = render(<LiberarAvaliacoes />);

      const button = container.querySelector('button');
      expect(button).toBeTruthy();
    });
  });
});
