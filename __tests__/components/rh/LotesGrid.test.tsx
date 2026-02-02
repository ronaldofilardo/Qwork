import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LotesGrid } from '@/components/rh/LotesGrid';

const mockLotes = [
  {
    id: 1,
    titulo: 'Lote Janeiro 2024',
    codigo: 'LOT-001',
    liberado_em: '2024-01-15T10:00:00Z',
    total_avaliacoes: 10,
    avaliacoes_concluidas: 8,
    avaliacoes_inativadas: 1,
  },
  {
    id: 2,
    titulo: 'Lote Fevereiro 2024',
    codigo: 'LOT-002',
    liberado_em: '2024-02-15T10:00:00Z',
    total_avaliacoes: 5,
    avaliacoes_concluidas: 5,
    avaliacoes_inativadas: 0,
    status: 'concluido',
  },
];

const mockLaudos = [
  {
    id: 1,
    lote_id: 2,
    emissor_nome: 'Dr. João Silva',
    enviado_em: '2024-02-20T14:30:00Z',
    hash: 'abc123',
    codigo: 'LAU-001',
  },
];

const defaultProps = {
  lotes: mockLotes,
  laudos: mockLaudos,
  downloadingLaudo: null,
  onLoteClick: jest.fn(),
  onRelatorioSetor: jest.fn(),
  onDownloadLaudo: jest.fn(),
};

describe('LotesGrid', () => {
  it('deve renderizar lista de lotes', () => {
    render(<LotesGrid {...defaultProps} />);

    expect(screen.getByText('Lote Janeiro 2024')).toBeInTheDocument();
    expect(screen.getByText('Lote Fevereiro 2024')).toBeInTheDocument();
    expect(screen.getByText('Código: LOT-001')).toBeInTheDocument();
    expect(screen.getByText('Código: LOT-002')).toBeInTheDocument();
  });

  it('deve chamar onLoteClick quando lote é clicado', () => {
    const mockOnLoteClick = jest.fn();
    render(<LotesGrid {...defaultProps} onLoteClick={mockOnLoteClick} />);

    const loteElement = screen.getByText('Lote Janeiro 2024').closest('div');
    if (loteElement) {
      fireEvent.click(loteElement);
    }

    expect(mockOnLoteClick).toHaveBeenCalledWith(1);
  });

  it('deve exibir status de prontidão correto', () => {
    render(<LotesGrid {...defaultProps} />);

    // Primeiro lote: 8/9 concluídas (considerando inativadas), deve estar "Pendente"
    expect(screen.getByText('Pendente')).toBeInTheDocument();

    // Segundo lote: 5/5 concluídas, deve estar "Pronto"
    expect(screen.getByText('Pronto')).toBeInTheDocument();
  });

  it('deve exibir laudo disponível para lote pronto', () => {
    render(<LotesGrid {...defaultProps} />);

    expect(screen.getByText('📄 Laudo disponível')).toBeInTheDocument();
    expect(screen.getByText('Emissor: Dr. João Silva')).toBeInTheDocument();
  });

  it('deve exibir laudo disponível quando apenas emitido_em estiver presente', () => {
    const laudosEmitido = [
      {
        id: 2,
        lote_id: 2,
        emissor_nome: 'Dra. Maria',
        emitido_em: '2024-01-20T09:15:00Z',
        hash: 'def456',
        codigo: 'LAU-002',
      },
    ];

    render(<LotesGrid {...defaultProps} laudos={laudosEmitido} />);

    expect(screen.getByText('📄 Laudo disponível')).toBeInTheDocument();
    expect(screen.getByText('Emissor: Dra. Maria')).toBeInTheDocument();
  });

  it('deve copiar hash quando botão de copiar é pressionado', () => {
    render(<LotesGrid {...defaultProps} />);

    const copyBtn = screen.getByRole('button', {
      name: /copiar hash do laudo/i,
    });
    expect(copyBtn).toBeInTheDocument();

    Object.assign(navigator, {
      clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
    });
    copyBtn.click();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('abc123');
  });

  it('deve chamar onRelatorioSetor quando botão é clicado', () => {
    const mockOnRelatorioSetor = jest.fn();
    render(
      <LotesGrid {...defaultProps} onRelatorioSetor={mockOnRelatorioSetor} />
    );

    const relatorioButtons = screen.getAllByText('📋 Relatório por Setor');
    const enabledButton = relatorioButtons.find((button) => !button.disabled);
    if (enabledButton) {
      fireEvent.click(enabledButton);
    }

    expect(mockOnRelatorioSetor).toHaveBeenCalledWith(2);
  });

  it('deve desabilitar botão de relatório para lote não pronto', () => {
    render(<LotesGrid {...defaultProps} />);

    const relatorioButtons = screen.getAllByText('📋 Relatório por Setor');
    const primeiroLoteButton = relatorioButtons[0];

    expect(primeiroLoteButton).toBeDisabled();
  });

  it('deve exibir mensagem quando não há lotes', () => {
    render(<LotesGrid {...defaultProps} lotes={[]} />);

    expect(screen.getByText('Nenhum ciclo encontrado')).toBeInTheDocument();
    expect(
      screen.getByText('Libere um novo lote de avaliações para começar.')
    ).toBeInTheDocument();
  });

  it('deve exibir indicador de avaliações inativadas', () => {
    render(<LotesGrid {...defaultProps} />);

    expect(screen.getByText('⚠️ 1 inativada')).toBeInTheDocument();
  });

  it('deve calcular corretamente avaliações ativas consideradas', () => {
    render(<LotesGrid {...defaultProps} />);

    // Primeiro lote: 10 total - 1 inativada = 9 ativas consideradas
    expect(screen.getByText('9')).toBeInTheDocument();

    // Segundo lote: 5 total - 0 inativada = 5 ativas consideradas
    expect(screen.getAllByText('5')).toHaveLength(3); // Uma para total, uma para concluídas, outra para ativas
  });
});
