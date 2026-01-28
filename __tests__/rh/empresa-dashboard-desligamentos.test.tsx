/**
 * Testes para a aba "Desligamentos" do Dashboard da Empresa
 * - Filtragem de funcionários inativos
 * - Exibição de histórico de avaliações
 * - Funcionalidade de busca e filtros
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import EmpresaDashboardPage from '@/app/rh/empresa/[id]/page'

// Mock das dependências
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useParams: () => ({
    id: '1'
  })
}))

jest.mock('@/lib/session', () => ({
  requireAuth: jest.fn(),
  requireRHWithEmpresaAccess: jest.fn()
}))

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
  queryWithContext: jest.fn()
}))

jest.mock('@/components/ModalInserirFuncionario', () => {
  return function MockModalInserirFuncionario({ onClose }: { onClose: () => void }) {
    return <div data-testid="modal-inserir">Modal Inserir Funcionário</div>
  }
})

jest.mock('@/components/EditEmployeeModal', () => {
  return function MockEditEmployeeModal({ onClose }: { onClose: () => void }) {
    return <div data-testid="modal-edit">Modal Editar Funcionário</div>
  }
})

jest.mock('@/components/RelatorioSetor', () => {
  return function MockRelatorioSetor({ onClose }: { onClose: () => void }) {
    return <div data-testid="relatorio-setor">Relatório por Setor</div>
  }
})

jest.mock('chart.js', () => ({
  Chart: { register: jest.fn() },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  BarElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn()
}))

describe('Aba Desligamentos - EmpresaDashboardPage', () => {
  const mockFuncionarios = [
    {
      cpf: '12345678901',
      nome: 'João Silva',
      setor: 'TI',
      funcao: 'Desenvolvedor',
      email: 'joao@email.com',
      matricula: '001',
      nivel_cargo: 'operacional' as const,
      turno: 'Manhã',
      escala: '5x2',
      ativo: true,
      criado_em: '2024-01-01T00:00:00Z',
      atualizado_em: '2024-01-01T00:00:00Z',
      avaliacoes: [
        {
          id: 1,
          inicio: '2024-01-15T00:00:00Z',
          envio: '2024-01-20T00:00:00Z',
          status: 'concluida',
          lote_id: 1,
          lote_codigo: 'LOTE-001'
        }
      ]
    },
    {
      cpf: '12345678902',
      nome: 'Maria Santos',
      setor: 'RH',
      funcao: 'Analista',
      email: 'maria@email.com',
      matricula: '002',
      nivel_cargo: 'gestao' as const,
      turno: 'Tarde',
      escala: '5x2',
      ativo: false, // Funcionário desligado
      criado_em: '2024-01-01T00:00:00Z',
      atualizado_em: '2024-06-01T00:00:00Z', // Data de desligamento
      avaliacoes: [
        {
          id: 2,
          inicio: '2024-02-01T00:00:00Z',
          envio: null,
          status: 'inativada',
          lote_id: 2,
          lote_codigo: 'LOTE-002'
        },
        {
          id: 3,
          inicio: '2024-03-01T00:00:00Z',
          envio: '2024-03-15T00:00:00Z',
          status: 'concluida',
          lote_id: 3,
          lote_codigo: 'LOTE-003'
        }
      ]
    }
  ]

  beforeEach(() => {
    // Mock da sessão
    const mockRequireAuth = require('@/lib/session').requireAuth
    mockRequireAuth.mockResolvedValue({
      cpf: '11111111111',
      nome: 'RH Teste',
      perfil: 'rh'
    })

    // Mock da empresa
    const mockQuery = require('@/lib/db').query
    mockQuery
      .mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 }) // requireRHWithEmpresaAccess
      .mockResolvedValueOnce({ rows: [{ id: 1, nome: 'Empresa Teste', cnpj: '12345678000100' }], rowCount: 1 }) // loadEmpresa
      .mockResolvedValueOnce({ rows: [{ total_avaliacoes: 10, concluidas: 8, funcionarios_avaliados: 5 }], rowCount: 1 }) // fetchDashboardData
      .mockResolvedValueOnce({ funcionarios: mockFuncionarios, rowCount: 2 }) // fetchFuncionarios
      .mockResolvedValueOnce({ lotes: [], rowCount: 0 }) // fetchLotesRecentes
      .mockResolvedValueOnce({ laudos: [], rowCount: 0 }) // fetchLaudos
  })

  it('deve mostrar apenas funcionários desligados na aba Desligamentos', async () => {
    render(<EmpresaDashboardPage />)

    // Aguardar carregamento
    await waitFor(() => {
      expect(screen.getByText('Dashboard Empresa Teste')).toBeInTheDocument()
    })

    // Clicar na aba Desligamentos
    const abaDesligamentos = screen.getByText('🚪 Desligamentos')
    fireEvent.click(abaDesligamentos)

    // Verificar se mostra apenas o funcionário desligado
    await waitFor(() => {
      expect(screen.getByText('🚪 Funcionários Desligados (1)')).toBeInTheDocument()
      expect(screen.getByText('Maria Santos')).toBeInTheDocument()
      expect(screen.queryByText('João Silva')).not.toBeInTheDocument()
    })
  })

  it('deve mostrar histórico de avaliações do funcionário desligado', async () => {
    render(<EmpresaDashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Dashboard Empresa Teste')).toBeInTheDocument()
    })

    // Clicar na aba Desligamentos
    const abaDesligamentos = screen.getByText('🚪 Desligamentos')
    fireEvent.click(abaDesligamentos)

    // Verificar se mostra o número de avaliações
    await waitFor(() => {
      expect(screen.getByText('2 avaliações')).toBeInTheDocument()
    })

    // Clicar em "Ver" para abrir modal de avaliações
    const botaoVer = screen.getByText('Ver')
    fireEvent.click(botaoVer)

    // Verificar se modal foi aberto (simulado)
    await waitFor(() => {
      const modal = document.querySelector('[data-testid="avaliacoes-modal"]')
      expect(modal).toBeInTheDocument()
    })
  })

  it('deve mostrar data de desligamento corretamente', async () => {
    render(<EmpresaDashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Dashboard Empresa Teste')).toBeInTheDocument()
    })

    // Clicar na aba Desligamentos
    const abaDesligamentos = screen.getByText('🚪 Desligamentos')
    fireEvent.click(abaDesligamentos)

    // Verificar se mostra a data de desligamento
    await waitFor(() => {
      expect(screen.getByText('01/06/2024')).toBeInTheDocument() // Data formatada
    })
  })

  it('deve permitir busca por nome na aba Desligamentos', async () => {
    render(<EmpresaDashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Dashboard Empresa Teste')).toBeInTheDocument()
    })

    // Clicar na aba Desligamentos
    const abaDesligamentos = screen.getByText('🚪 Desligamentos')
    fireEvent.click(abaDesligamentos)

    // Aguardar carregamento da aba
    await waitFor(() => {
      expect(screen.getByText('Maria Santos')).toBeInTheDocument()
    })

    // Digitar na busca
    const inputBusca = screen.getByPlaceholderText('Buscar por nome, CPF, setor, matrícula...')
    fireEvent.change(inputBusca, { target: { value: 'João' } })

    // Verificar se não encontra resultados
    await waitFor(() => {
      expect(screen.getByText('Nenhum funcionário desligado encontrado para a busca')).toBeInTheDocument()
      expect(screen.queryByText('Maria Santos')).not.toBeInTheDocument()
    })

    // Buscar por "Maria"
    fireEvent.change(inputBusca, { target: { value: 'Maria' } })

    // Verificar se encontra o resultado
    await waitFor(() => {
      expect(screen.getByText('Maria Santos')).toBeInTheDocument()
    })
  })

  it('deve mostrar mensagem quando não há funcionários desligados', async () => {
    // Mock com funcionários apenas ativos
    const mockFuncionariosAtivos = mockFuncionarios.filter(f => f.ativo)

    const mockQuery = require('@/lib/db').query
    mockQuery
      .mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ id: 1, nome: 'Empresa Teste', cnpj: '12345678000100' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ total_avaliacoes: 10, concluidas: 8, funcionarios_avaliados: 5 }], rowCount: 1 })
      .mockResolvedValueOnce({ funcionarios: mockFuncionariosAtivos, rowCount: 1 })
      .mockResolvedValueOnce({ lotes: [], rowCount: 0 })
      .mockResolvedValueOnce({ laudos: [], rowCount: 0 })

    render(<EmpresaDashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Dashboard Empresa Teste')).toBeInTheDocument()
    })

    // Clicar na aba Desligamentos
    const abaDesligamentos = screen.getByText('🚪 Desligamentos')
    fireEvent.click(abaDesligamentos)

    // Verificar mensagem de nenhum funcionário desligado
    await waitFor(() => {
      expect(screen.getByText('🚪 Funcionários Desligados (0)')).toBeInTheDocument()
      expect(screen.getByText('Nenhum funcionário desligado encontrado')).toBeInTheDocument()
    })
  })
})