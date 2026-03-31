/**
 * @file __tests__/components/BarraProgressoEmissao.test.tsx
 * Testes para o componente BarraProgressoEmissao
 *
 * Valida:
 *  - Renderização da barra de progresso
 *  - Estados de status (idle, gerando_pdf, enviando_storage, concluido, erro)
 *  - Exibição de porcentagem e etapas
 *  - Exibição de tempo decorrido/estimado
 *  - Exibição de erro
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock do hook useProgressoEmissao
const mockIniciarMonitoramento = jest.fn();
const mockPararMonitoramento = jest.fn();

const mockProgressoDefault = {
  status: 'idle' as const,
  mensagem: '',
  porcentagem: 0,
  etapa: 0,
  totalEtapas: 5,
  tempoDecorrido: 0,
  tempoEstimado: 0,
  erro: null,
};

let mockProgresso = { ...mockProgressoDefault };
let mockMonitorando = false;

jest.mock('@/lib/hooks/useProgressoEmissao', () => ({
  useProgressoEmissao: () => ({
    progresso: mockProgresso,
    monitorando: mockMonitorando,
    iniciarMonitoramento: mockIniciarMonitoramento,
    pararMonitoramento: mockPararMonitoramento,
  }),
  formatarTempo: (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  },
}));

import { BarraProgressoEmissao } from '@/components/BarraProgressoEmissao';

describe('BarraProgressoEmissao', () => {
  beforeEach(() => {
    mockProgresso = { ...mockProgressoDefault };
    mockMonitorando = false;
    jest.clearAllMocks();
  });

  describe('Estado Idle', () => {
    it('não deve renderizar nada quando idle e não monitorando', () => {
      const { container } = render(<BarraProgressoEmissao loteId={1} />);
      expect(container.firstChild).toBeNull();
    });

    it('deve auto-iniciar monitoramento quando autoIniciar=true', () => {
      render(<BarraProgressoEmissao loteId={1} autoIniciar />);
      expect(mockIniciarMonitoramento).toHaveBeenCalled();
    });
  });

  describe('Estado Ativo (monitorando)', () => {
    beforeEach(() => {
      mockMonitorando = true;
      mockProgresso = {
        ...mockProgressoDefault,
        status: 'gerando_pdf' as any,
        mensagem: 'Gerando PDF do laudo...',
        porcentagem: 50,
        etapa: 3,
        totalEtapas: 5,
        tempoDecorrido: 30000,
        tempoEstimado: 60000,
      };
    });

    it('deve exibir a porcentagem', () => {
      render(<BarraProgressoEmissao loteId={1} />);
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('deve exibir etapa atual', () => {
      render(<BarraProgressoEmissao loteId={1} />);
      expect(screen.getByText('Etapa 3/5')).toBeInTheDocument();
    });

    it('deve exibir título "Emitindo Laudo"', () => {
      render(<BarraProgressoEmissao loteId={1} />);
      expect(screen.getByText('Emitindo Laudo')).toBeInTheDocument();
    });

    it('deve exibir a mensagem de status', () => {
      render(<BarraProgressoEmissao loteId={1} />);
      expect(screen.getByText('Gerando PDF do laudo...')).toBeInTheDocument();
    });

    it('deve exibir tempo decorrido', () => {
      render(<BarraProgressoEmissao loteId={1} />);
      expect(screen.getByText(/Tempo decorrido/)).toBeInTheDocument();
    });

    it('deve exibir tempo estimado', () => {
      render(<BarraProgressoEmissao loteId={1} />);
      expect(screen.getByText(/Estimado/)).toBeInTheDocument();
    });
  });

  describe('Estado Concluído', () => {
    beforeEach(() => {
      mockMonitorando = true;
      mockProgresso = {
        ...mockProgressoDefault,
        status: 'concluido' as any,
        mensagem: 'Laudo emitido com sucesso!',
        porcentagem: 100,
        etapa: 5,
        totalEtapas: 5,
        tempoDecorrido: 0,
        tempoEstimado: 0,
      };
    });

    it('deve exibir título "Emissão Concluída"', () => {
      render(<BarraProgressoEmissao loteId={1} />);
      expect(screen.getByText('Emissão Concluída')).toBeInTheDocument();
    });

    it('deve exibir 100%', () => {
      render(<BarraProgressoEmissao loteId={1} />);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('não deve exibir tempos quando concluído', () => {
      render(<BarraProgressoEmissao loteId={1} />);
      expect(screen.queryByText(/Tempo decorrido/)).not.toBeInTheDocument();
    });
  });

  describe('Estado Erro', () => {
    beforeEach(() => {
      mockMonitorando = true;
      mockProgresso = {
        ...mockProgressoDefault,
        status: 'erro' as any,
        mensagem: 'Falha na geração',
        porcentagem: 30,
        etapa: 2,
        totalEtapas: 5,
        tempoDecorrido: 0,
        tempoEstimado: 0,
        erro: 'Timeout na geração do PDF',
      };
    });

    it('deve exibir mensagem de erro', () => {
      render(<BarraProgressoEmissao loteId={1} />);
      expect(screen.getByText('Timeout na geração do PDF')).toBeInTheDocument();
    });

    it('deve exibir label "Erro:"', () => {
      render(<BarraProgressoEmissao loteId={1} />);
      expect(screen.getByText('Erro:')).toBeInTheDocument();
    });
  });

  describe('Indicadores de Etapas', () => {
    it('deve renderizar os 5 indicadores de etapas', () => {
      mockMonitorando = true;
      mockProgresso = {
        ...mockProgressoDefault,
        status: 'gerando_pdf' as any,
        mensagem: 'Gerando...',
        porcentagem: 40,
        etapa: 2,
        totalEtapas: 5,
      };

      render(<BarraProgressoEmissao loteId={1} />);
      expect(screen.getByText('Solicitado')).toBeInTheDocument();
      expect(screen.getByText('Gerando')).toBeInTheDocument();
      expect(screen.getByText('Upload')).toBeInTheDocument();
      expect(screen.getByText('Emitido')).toBeInTheDocument();
      expect(screen.getByText('Concluído')).toBeInTheDocument();
    });
  });
});
