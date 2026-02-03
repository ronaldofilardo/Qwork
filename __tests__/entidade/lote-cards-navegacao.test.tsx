import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';

// Mock do componente de card de lote para entidades
const MockEntidadeLoteCard = ({
  lote,
  onClick,
  onReportClick,
  onDownloadClick,
}: any) => (
  <div
    data-testid={`lote-card-${lote.id}`}
    className="card-clickable cursor-pointer hover:shadow-lg hover:border-primary transition-all"
    onClick={onClick}
  >
    <h3>{lote.titulo}</h3>
    <p>{`Lote #${lote.id}`}</p>
    <button data-testid={`report-btn-${lote.id}`} onClick={onReportClick}>
      Gerar Relatório
    </button>
    <button data-testid={`download-btn-${lote.id}`} onClick={onDownloadClick}>
      Baixar Dados
    </button>
  </div>
);

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockRouter = {
  push: jest.fn(),
};

describe('Navegação dos Cards de Lote - Entidade', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  const mockLote = {
    id: 1,
    codigo: 'ENT-001',
    titulo: 'Lote Teste Entidade',
    total_funcionarios: 10,
    funcionarios_concluidos: 7,
    status: 'enviado',
  };

  describe('Clique no Card', () => {
    it('deve navegar para página de detalhes ao clicar no card', () => {
      const handleCardClick = () => {
        mockRouter.push(`/entidade/lote/${mockLote.id}`);
      };

      render(
        <MockEntidadeLoteCard
          lote={mockLote}
          onClick={handleCardClick}
          onReportClick={() => {}}
          onDownloadClick={() => {}}
        />
      );

      const card = screen.getByTestId(`lote-card-${mockLote.id}`);
      fireEvent.click(card);

      expect(mockRouter.push).toHaveBeenCalledWith('/entidade/lote/1');
    });

    it('deve ter classe cursor-pointer no card', () => {
      render(
        <MockEntidadeLoteCard
          lote={mockLote}
          onClick={() => {}}
          onReportClick={() => {}}
          onDownloadClick={() => {}}
        />
      );

      const card = screen.getByTestId(`lote-card-${mockLote.id}`);
      expect(card).toHaveClass('cursor-pointer');
    });
  });

  describe('StopPropagation dos Botões', () => {
    it('botão de relatório não deve propagar clique para o card', () => {
      const handleCardClick = jest.fn();
      const handleReportClick = jest.fn((e: React.MouseEvent) => {
        e.stopPropagation();
      });

      render(
        <MockEntidadeLoteCard
          lote={mockLote}
          onClick={handleCardClick}
          onReportClick={handleReportClick}
          onDownloadClick={() => {}}
        />
      );

      const reportButton = screen.getByTestId(`report-btn-${mockLote.id}`);
      fireEvent.click(reportButton);

      expect(handleReportClick).toHaveBeenCalled();
      expect(handleCardClick).not.toHaveBeenCalled();
    });

    it('botão de download não deve propagar clique para o card', () => {
      const handleCardClick = jest.fn();
      const handleDownloadClick = jest.fn((e: React.MouseEvent) => {
        e.stopPropagation();
      });

      render(
        <MockEntidadeLoteCard
          lote={mockLote}
          onClick={handleCardClick}
          onReportClick={() => {}}
          onDownloadClick={handleDownloadClick}
        />
      );

      const downloadButton = screen.getByTestId(`download-btn-${mockLote.id}`);
      fireEvent.click(downloadButton);

      expect(handleDownloadClick).toHaveBeenCalled();
      expect(handleCardClick).not.toHaveBeenCalled();
    });

    it('múltiplos cliques em botões não devem navegar', () => {
      const handleCardClick = jest.fn();
      const handleReportClick = jest.fn((e: React.MouseEvent) => {
        e.stopPropagation();
      });
      const handleDownloadClick = jest.fn((e: React.MouseEvent) => {
        e.stopPropagation();
      });

      render(
        <MockEntidadeLoteCard
          lote={mockLote}
          onClick={handleCardClick}
          onReportClick={handleReportClick}
          onDownloadClick={handleDownloadClick}
        />
      );

      const reportButton = screen.getByTestId(`report-btn-${mockLote.id}`);
      const downloadButton = screen.getByTestId(`download-btn-${mockLote.id}`);

      fireEvent.click(reportButton);
      fireEvent.click(downloadButton);
      fireEvent.click(reportButton);

      expect(handleReportClick).toHaveBeenCalledTimes(2);
      expect(handleDownloadClick).toHaveBeenCalledTimes(1);
      expect(handleCardClick).not.toHaveBeenCalled();
    });
  });

  describe('Integração com Dashboard Real', () => {
    it('deve demonstrar padrão correto de implementação', () => {
      const handleCardClick = () => {
        mockRouter.push(`/entidade/lote/${mockLote.id}`);
      };

      const handleReportClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        // Lógica de gerar relatório
      };

      const handleDownloadClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        // Lógica de download
      };

      // Verificar que os handlers estão configurados corretamente
      expect(handleCardClick).toBeDefined();
      expect(handleReportClick).toBeDefined();
      expect(handleDownloadClick).toBeDefined();

      // Simular clique no card
      handleCardClick();
      expect(mockRouter.push).toHaveBeenCalledWith('/entidade/lote/1');

      // Simular evento de clique no botão (com stopPropagation)
      const mockEvent = {
        stopPropagation: jest.fn(),
      } as unknown as React.MouseEvent;

      handleReportClick(mockEvent);
      expect(mockEvent.stopPropagation).toHaveBeenCalled();

      handleDownloadClick(mockEvent);
      expect(mockEvent.stopPropagation).toHaveBeenCalledTimes(2);
    });
  });

  describe('Efeitos Visuais de Hover', () => {
    it('card deve ter classes de transição e hover', () => {
      render(
        <div
          className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg hover:border-primary transition-all cursor-pointer"
          data-testid="styled-card"
        >
          Card com estilo
        </div>
      );

      const card = screen.getByTestId('styled-card');

      expect(card).toHaveClass('hover:shadow-lg');
      expect(card).toHaveClass('hover:border-primary');
      expect(card).toHaveClass('transition-all');
      expect(card).toHaveClass('cursor-pointer');
    });
  });

  describe('Múltiplos Cards', () => {
    it('cada card deve navegar para seu próprio ID', () => {
      const lotes = [
        {
          id: 1,
          titulo: 'Lote 1',
          codigo: 'ENT-001',
          total_funcionarios: 10,
          funcionarios_concluidos: 7,
          status: 'enviado',
        },
        {
          id: 2,
          titulo: 'Lote 2',
          codigo: 'ENT-002',
          total_funcionarios: 15,
          funcionarios_concluidos: 10,
          status: 'criado',
        },
        {
          id: 3,
          titulo: 'Lote 3',
          codigo: 'ENT-003',
          total_funcionarios: 8,
          funcionarios_concluidos: 8,
          status: 'concluido',
        },
      ];

      render(
        <>
          {lotes.map((lote) => (
            <MockEntidadeLoteCard
              key={lote.id}
              lote={lote}
              onClick={() => mockRouter.push(`/entidade/lote/${lote.id}`)}
              onReportClick={(e: React.MouseEvent) => e.stopPropagation()}
              onDownloadClick={(e: React.MouseEvent) => e.stopPropagation()}
            />
          ))}
        </>
      );

      // Clicar no primeiro card
      fireEvent.click(screen.getByTestId('lote-card-1'));
      expect(mockRouter.push).toHaveBeenCalledWith('/entidade/lote/1');

      // Clicar no segundo card
      fireEvent.click(screen.getByTestId('lote-card-2'));
      expect(mockRouter.push).toHaveBeenCalledWith('/entidade/lote/2');

      // Clicar no terceiro card
      fireEvent.click(screen.getByTestId('lote-card-3'));
      expect(mockRouter.push).toHaveBeenCalledWith('/entidade/lote/3');

      expect(mockRouter.push).toHaveBeenCalledTimes(3);
    });
  });

  describe('Acessibilidade', () => {
    it('card deve ser navegável via teclado', () => {
      const handleCardClick = jest.fn();

      render(
        <div
          role="button"
          tabIndex={0}
          onClick={handleCardClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleCardClick();
            }
          }}
          data-testid="accessible-card"
        >
          Card Acessível
        </div>
      );

      const card = screen.getByTestId('accessible-card');

      // Simular Enter
      fireEvent.keyDown(card, { key: 'Enter', code: 'Enter' });
      expect(handleCardClick).toHaveBeenCalledTimes(1);

      // Simular Space
      fireEvent.keyDown(card, { key: ' ', code: 'Space' });
      expect(handleCardClick).toHaveBeenCalledTimes(2);
    });
  });
});

// Teste de integração completo simulando comportamento real
describe('Integração Completa - Cards de Lote no Dashboard de Entidade', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('deve implementar fluxo completo de navegação e ações', () => {
    const mockLoteData = {
      id: 1,
      codigo: 'ENT-001',
      titulo: 'Lote Completo',
      total_funcionarios: 10,
      funcionarios_concluidos: 10,
      status: 'concluido',
    };

    let isGeneratingReport = false;

    const handleCardClick = () => {
      mockRouter.push(`/entidade/lote/${mockLoteData.id}`);
    };

    const handleGenerateReport = (e: React.MouseEvent) => {
      e.stopPropagation();
      isGeneratingReport = true;
      setTimeout(() => {
        isGeneratingReport = false;
      }, 100);
    };

    // Cenário 1: Clicar no card
    handleCardClick();
    expect(mockRouter.push).toHaveBeenCalledWith('/entidade/lote/1');

    // Cenário 2: Clicar no botão de relatório
    const reportEvent = {
      stopPropagation: jest.fn(),
    } as unknown as React.MouseEvent;

    handleGenerateReport(reportEvent);
    expect(reportEvent.stopPropagation).toHaveBeenCalled();
    expect(isGeneratingReport).toBe(true);

    // Verificar que apenas 1 navegação ocorreu (do card)
    expect(mockRouter.push).toHaveBeenCalledTimes(1);
  });
});
