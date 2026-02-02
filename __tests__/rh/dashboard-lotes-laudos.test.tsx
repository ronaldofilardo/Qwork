/**
 * @fileoverview Testes de Aba Ciclos de Coletas Avaliativas
 * @description Testa exibição e funcionalidade dos cards de lotes com laudos integrados
 * @test Aba de ciclos/lotes com laudos
 */

import type { Mock } from 'jest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter, useParams } from 'next/navigation';
import EmpresaDashboardPage from '@/app/rh/empresa/[id]/page';
import type { MockLote, MockLaudo, MockSession } from './types/test-fixtures';

// Mocks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock('chart.js', () => ({
  Chart: { register: jest.fn() },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  BarElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
}));

jest.mock('react-chartjs-2', () => ({
  Bar: () => <div>Mock Chart</div>,
}));

const mockLotes: MockLote[] = [
  {
    id: 1,
    codigo: 'LOTE001',
    titulo: 'Avaliação Trimestral Q1',
    tipo: 'completo',
    liberado_em: '2025-01-15T10:00:00Z',
    status: 'concluido',
    total_avaliacoes: 50,
    avaliacoes_concluidas: 50,
    avaliacoes_inativadas: 0,
  },
  {
    id: 2,
    codigo: 'LOTE002',
    titulo: 'Avaliação Gestão 2025',
    tipo: 'gestao',
    liberado_em: '2025-02-01T14:30:00Z',
    status: 'ativo',
    total_avaliacoes: 25,
    avaliacoes_concluidas: 20,
    avaliacoes_inativadas: 1,
  },
];

const mockLaudos: MockLaudo[] = [
  {
    id: 1,
    lote_id: 1,
    codigo: 'LOTE001',
    titulo: 'Laudo Avaliação Trimestral Q1',
    empresa_nome: 'Empresa Teste',
    clinica_nome: 'Clínica Qwork',
    emissor_nome: 'Dr. João Silva',
    enviado_em: '2025-01-20T09:15:00Z',
    hash: 'abc123def456',
  },
];

describe('📋 Aba Ciclos de Coletas Avaliativas', () => {
  const mockPush = jest.fn();
  const mockSession: MockSession = {
    cpf: '11111111111',
    nome: 'RH Teste',
    perfil: 'rh',
  };

  beforeEach(() => {
    // Arrange: Setup dos mocks
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useParams as jest.Mock).mockReturnValue({ id: '1' });

    document.body.innerHTML = '';

    global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
    global.alert = jest.fn() as jest.MockedFunction<typeof alert>;
    global.confirm = jest.fn() as jest.MockedFunction<typeof confirm>;

    (global.fetch as Mock).mockImplementation((url: string) => {
      if (url.includes('/api/auth/session')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockSession,
        } as Response);
      }
      if (url.includes('/api/rh/empresas')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { id: 1, nome: 'Empresa Teste', cnpj: '12345678000100' },
          ],
        } as Response);
      }
      if (url.includes('/api/rh/dashboard')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            stats: {
              total_avaliacoes: 100,
              concluidas: 50,
              funcionarios_avaliados: 25,
            },
            resultados: [],
            distribuicao: [],
          }),
        } as Response);
      }
      if (url.includes('/api/admin/funcionarios')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ funcionarios: [] }),
        } as Response);
      }
      if (url.includes('/api/rh/lotes')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ lotes: mockLotes }),
        } as Response);
      }
      if (url.includes('/api/rh/laudos')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ laudos: mockLaudos }),
        } as Response);
      }
      return Promise.resolve({ ok: false } as Response);
    });
  });

  /**
   * @test Verifica exibição do botão de iniciar novo ciclo
   * @expected Deve exibir botão "🚀 Iniciar Novo Ciclo"
   */
  it('deve exibir botão "Iniciar Novo Ciclo"', async () => {
    // Act: Renderizar
    render(<EmpresaDashboardPage />);

    // Assert: Verificar botão presente
    await waitFor(() => {
      expect(screen.getByText('🚀 Iniciar Novo Ciclo')).toBeInTheDocument();
    });
  });

  /**
   * @test Verifica integração de laudos nos cards de lotes
   * @expected Lotes com laudo devem exibir informações do emissor e hash
   */
  it('deve integrar laudos nos cards quando disponíveis', async () => {
    // Act: Renderizar
    render(<EmpresaDashboardPage />);

    // Assert: Verificar informações do laudo
    await waitFor(() => {
      expect(screen.getByText('Ver Laudo/Baixar PDF')).toBeInTheDocument();
      expect(screen.getByText('Emissor: Dr. João Silva')).toBeInTheDocument();

      // Verificar hash exibido
      const hashCode = screen.getByText('abc123def456');
      expect(hashCode).toBeInTheDocument();
      expect(hashCode.textContent).toContain('abc123de');
    });
  });

  /**
   * @test Verifica exibição de mensagem quando não há lotes
   * @expected Deve exibir "Nenhum ciclo encontrado"
   */
  it('deve exibir mensagem quando não há lotes', async () => {
    // Arrange: Mock sem lotes
    (global.fetch as Mock).mockImplementation((url: string) => {
      if (url.includes('/api/rh/lotes')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ lotes: [] }),
        } as Response);
      }
      if (url.includes('/api/auth/session')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockSession,
        } as Response);
      }
      if (url.includes('/api/rh/empresas')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { id: 1, nome: 'Empresa Teste', cnpj: '12345678000100' },
          ],
        } as Response);
      }
      if (url.includes('/api/rh/dashboard')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            stats: {
              total_avaliacoes: 100,
              concluidas: 50,
              funcionarios_avaliados: 25,
            },
            resultados: [],
            distribuicao: [],
          }),
        } as Response);
      }
      if (url.includes('/api/admin/funcionarios')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ funcionarios: [] }),
        } as Response);
      }
      if (url.includes('/api/rh/laudos')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ laudos: [] }),
        } as Response);
      }
      return Promise.resolve({ ok: false } as Response);
    });

    // Act: Renderizar
    render(<EmpresaDashboardPage />);

    // Assert: Aguardar loading terminar e verificar mensagem
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('📋')).toBeInTheDocument();
      expect(screen.getByText('Nenhum ciclo encontrado')).toBeInTheDocument();
    });
  });
});
