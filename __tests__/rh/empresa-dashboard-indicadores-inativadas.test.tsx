import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import EmpresaDashboard from '@/app/rh/empresa/[id]/page'
import { useRouter, useParams } from 'next/navigation'

// Mock do Next.js
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}))

// Mock do session
jest.mock('@/lib/session', () => ({
  getSession: jest.fn(),
}))

// Mock do fetch
global.fetch = jest.fn()

const mockRouter = {
  push: jest.fn(),
}

const mockParams = {
  id: '1',
}

describe('Indicadores Visuais para Avaliações Inativadas - Dashboard Empresa', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useParams as jest.Mock).mockReturnValue(mockParams)
  })

  describe('Badge de aviso no cabeçalho do card', () => {
    it('deve mostrar badge de aviso quando há avaliações inativadas', async () => {
      const mockLotes = [
        {
          id: 1,
          titulo: 'Lote Teste',
          total_avaliacoes: 10,
          avaliacoes_concluidas: 8,
          avaliacoes_inativadas: 2,
          liberado_em: '2024-12-12T10:00:00Z',
        },
      ]

      ;(global.fetch as jest.Mock).mockImplementation((url) => {
        if (url.includes('/api/rh/lotes')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ lotes: mockLotes }),
          })
        }
        if (url.includes('/api/rh/dashboard')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              stats: { total_avaliacoes: 10, concluidas: 8, funcionarios_avaliados: 8 },
              resultados: [],
            }),
          })
        }
        if (url.includes('/api/auth/session')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              cpf: '12345678901',
              perfil: 'rh',
              nome: 'Test User',
            }),
          })
        }
        if (url.includes('/api/rh/empresas')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([{ id: 1, nome: 'Empresa Teste' }]),
          })
        }
        if (url.includes('/api/rh/funcionarios')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ funcionarios: [] }),
          })
        }
        if (url.includes('/api/rh/laudos')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ laudos: [] }),
          })
        }
        return Promise.reject(new Error('URL não mockada'))
      })

      render(<EmpresaDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Lote Teste')).toBeInTheDocument()
      })

      // Verificar se o badge de aviso está presente
      expect(screen.getByText('⚠️ 2 inativadas')).toBeInTheDocument()
    })

    it('não deve mostrar badge quando não há avaliações inativadas', async () => {
      const mockLotes = [
        {
          id: 1,
          titulo: 'Lote Teste',
          total_avaliacoes: 10,
          avaliacoes_concluidas: 10,
          avaliacoes_inativadas: 0,
          liberado_em: '2024-12-12T10:00:00Z',
        },
      ]

      ;(global.fetch as jest.Mock).mockImplementation((url) => {
        if (url.includes('/api/rh/lotes')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ lotes: mockLotes }),
          })
        }
        if (url.includes('/api/rh/dashboard')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              stats: { total_avaliacoes: 10, concluidas: 10, funcionarios_avaliados: 10 },
              resultados: [],
            }),
          })
        }
        if (url.includes('/api/auth/session')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              cpf: '12345678901',
              perfil: 'rh',
              nome: 'Test User',
            }),
          })
        }
        if (url.includes('/api/rh/empresas')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([{ id: 1, nome: 'Empresa Teste' }]),
          })
        }
        if (url.includes('/api/rh/funcionarios')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ funcionarios: [] }),
          })
        }
        if (url.includes('/api/rh/laudos')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ laudos: [] }),
          })
        }
        return Promise.reject(new Error('URL não mockada'))
      })

      render(<EmpresaDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Lote Teste')).toBeInTheDocument()
      })

      // Verificar que o badge não está presente
      expect(screen.queryByText(/inativada/)).not.toBeInTheDocument()
    })
  })

  describe('Seção de estatísticas aprimorada', () => {
    it('deve mostrar tooltip explicativo para avaliações inativadas', async () => {
      const mockLotes = [
        {
          id: 1,
          titulo: 'Lote Teste',
          total_avaliacoes: 10,
          avaliacoes_concluidas: 7,
          avaliacoes_inativadas: 3,
          liberado_em: '2024-12-12T10:00:00Z',
        },
      ]

      ;(global.fetch as jest.Mock).mockImplementation((url) => {
        if (url.includes('/api/rh/lotes')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ lotes: mockLotes }),
          })
        }
        if (url.includes('/api/rh/dashboard')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              stats: { total_avaliacoes: 10, concluidas: 7, funcionarios_avaliados: 7 },
              resultados: [],
            }),
          })
        }
        if (url.includes('/api/auth/session')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              cpf: '12345678901',
              perfil: 'rh',
              nome: 'Test User',
            }),
          })
        }
        if (url.includes('/api/rh/empresas')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([{ id: 1, nome: 'Empresa Teste' }]),
          })
        }
        if (url.includes('/api/rh/funcionarios')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ funcionarios: [] }),
          })
        }
        if (url.includes('/api/rh/laudos')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ laudos: [] }),
          })
        }
        return Promise.reject(new Error('URL não mockada'))
      })

      render(<EmpresaDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Lote Teste')).toBeInTheDocument()
      })

      // Verificar se mostra "Inativadas:" com tooltip
      expect(screen.getByText('Inativadas:')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()

      // Verificar se mostra "Ativas consideradas:"
      expect(screen.getByText('Ativas consideradas:')).toBeInTheDocument()
      const ativasConsideradasElements = screen.getAllByText('7')
      expect(ativasConsideradasElements.length).toBeGreaterThan(0)
    })

    it('deve calcular corretamente as avaliações ativas consideradas', async () => {
      const mockLotes = [
        {
          id: 1,
          titulo: 'Lote Teste',
          total_avaliacoes: 15,
          avaliacoes_concluidas: 10,
          avaliacoes_inativadas: 5,
          liberado_em: '2024-12-12T10:00:00Z',
        },
      ]

      ;(global.fetch as jest.Mock).mockImplementation((url) => {
        if (url.includes('/api/rh/lotes')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ lotes: mockLotes }),
          })
        }
        if (url.includes('/api/rh/dashboard')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              stats: { total_avaliacoes: 15, concluidas: 10, funcionarios_avaliados: 10 },
              resultados: [],
            }),
          })
        }
        if (url.includes('/api/auth/session')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              cpf: '12345678901',
              perfil: 'rh',
              nome: 'Test User',
            }),
          })
        }
        if (url.includes('/api/rh/empresas')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([{ id: 1, nome: 'Empresa Teste' }]),
          })
        }
        if (url.includes('/api/rh/funcionarios')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ funcionarios: [] }),
          })
        }
        if (url.includes('/api/rh/laudos')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ laudos: [] }),
          })
        }
        return Promise.reject(new Error('URL não mockada'))
      })

      render(<EmpresaDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Lote Teste')).toBeInTheDocument()
      })

      // Verificar cálculo: 15 - 5 = 10 ativas consideradas
      expect(screen.getByText('Ativas consideradas:')).toBeInTheDocument()
      const ativasConsideradasElements = screen.getAllByText('10')
      expect(ativasConsideradasElements.length).toBeGreaterThan(0)
    })
  })

  describe('Status de prontidão', () => {
    it('deve mostrar "Pronto" quando todas as avaliações ativas estão concluídas', async () => {
      const mockLotes = [
        {
          id: 1,
          titulo: 'Lote Teste',
          total_avaliacoes: 10,
          avaliacoes_concluidas: 8,
          avaliacoes_inativadas: 2,
          liberado_em: '2024-12-12T10:00:00Z',
        },
      ]

      ;(global.fetch as jest.Mock).mockImplementation((url) => {
        if (url.includes('/api/rh/lotes')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ lotes: mockLotes }),
          })
        }
        if (url.includes('/api/rh/dashboard')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              stats: { total_avaliacoes: 10, concluidas: 8, funcionarios_avaliados: 8 },
              resultados: [],
            }),
          })
        }
        if (url.includes('/api/auth/session')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              cpf: '12345678901',
              perfil: 'rh',
              nome: 'Test User',
            }),
          })
        }
        if (url.includes('/api/rh/empresas')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([{ id: 1, nome: 'Empresa Teste' }]),
          })
        }
        if (url.includes('/api/rh/funcionarios')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ funcionarios: [] }),
          })
        }
        if (url.includes('/api/rh/laudos')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ laudos: [] }),
          })
        }
        return Promise.reject(new Error('URL não mockada'))
      })

      render(<EmpresaDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Lote Teste')).toBeInTheDocument()
      })

      // Verificar status: 8 concluídas = 10 - 2 inativadas, então está pronto
      expect(screen.getByText('Pronto')).toBeInTheDocument()
    })

    it('deve mostrar "Pendente" quando nem todas as avaliações ativas estão concluídas', async () => {
      const mockLotes = [
        {
          id: 1,
          titulo: 'Lote Teste',
          total_avaliacoes: 10,
          avaliacoes_concluidas: 6,
          avaliacoes_inativadas: 2,
          liberado_em: '2024-12-12T10:00:00Z',
        },
      ]

      ;(global.fetch as jest.Mock).mockImplementation((url) => {
        if (url.includes('/api/rh/lotes')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ lotes: mockLotes }),
          })
        }
        if (url.includes('/api/rh/dashboard')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              stats: { total_avaliacoes: 10, concluidas: 6, funcionarios_avaliados: 6 },
              resultados: [],
            }),
          })
        }
        if (url.includes('/api/auth/session')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              cpf: '12345678901',
              perfil: 'rh',
              nome: 'Test User',
            }),
          })
        }
        if (url.includes('/api/rh/empresas')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([{ id: 1, nome: 'Empresa Teste' }]),
          })
        }
        if (url.includes('/api/rh/funcionarios')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ funcionarios: [] }),
          })
        }
        if (url.includes('/api/rh/laudos')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ laudos: [] }),
          })
        }
        return Promise.reject(new Error('URL não mockada'))
      })

      render(<EmpresaDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Lote Teste')).toBeInTheDocument()
      })

      // Verificar status: 6 concluídas < 10 - 2 inativadas (8), então está pendente
      expect(screen.getByText('Pendente')).toBeInTheDocument()
    })
  })
})
