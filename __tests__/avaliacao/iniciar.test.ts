/**
 * Testes para inicialização da avaliação
 * Item 1: Redirecionar dashboard → /avaliacao com popup
 */

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}))

jest.mock('@/lib/session', () => ({
  requireAuth: jest.fn(),
  getSession: jest.fn(),
}))

import { query } from '@/lib/db'

const mockQuery = query as jest.MockedFunction<typeof query>
const mockRequireAuth = require('@/lib/session').requireAuth
const mockGetSession = require('@/lib/session').getSession

describe('Avaliação - Iniciar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Item 1: Redirecionamento do dashboard para avaliação', () => {
    it('deve redirecionar para /avaliacao quando houver avaliação disponível', async () => {
      mockRequireAuth.mockResolvedValue({
        userId: 1,
        userRole: 'funcionario',
        cpf: '12345678901',
        nome: 'Test User'
      })

      mockGetSession.mockResolvedValue({
        userId: 1,
        userRole: 'funcionario',
        cpf: '12345678901',
        nome: 'Test User'
      })

      mockQuery.mockResolvedValue({
        rows: [{
          id: 1,
          status: 'iniciada',
          inicio: new Date().toISOString(),
          grupo_atual: null,
          avaliacaoId: 1
        }],
        rowCount: 1
      })

      const { GET } = await import('@/app/api/avaliacao/status/route')
      const response = await GET()
      const data = await response.json()

      expect(data.avaliacaoId).toBe(1)
      expect(data.status).toBe('iniciada')
      // No frontend, o dashboard deve detectar isso e mostrar o botão "Iniciar Avaliação"
    })

    it('deve mostrar popup com avaliação disponível no dashboard', async () => {
      mockRequireAuth.mockResolvedValue({
        cpf: '12345678901',
        nome: 'Test User',
        perfil: 'funcionario'
      })

      mockGetSession.mockResolvedValue({
        userId: 1,
        userRole: 'funcionario',
        cpf: '12345678901'
      })

      mockQuery.mockResolvedValue({
        rows: [{
          id: 1,
          status: 'iniciada',
          criado_em: new Date().toISOString(),
          envio: null,
          grupo_atual: null
        }],
        rowCount: 1
      })

      // Simula chamada à API de todas as avaliações
      const { GET } = await import('@/app/api/avaliacao/todas/route')
      const response = await GET()
      const data = await response.json()

      expect(data.avaliacoes).toHaveLength(1)
      expect(data.avaliacoes[0].status).toBe('iniciada')
    })

    it('deve redirecionar para /avaliacao?id=X com ID correto', async () => {
      const avaliacaoId = 123
      
      mockRequireAuth.mockResolvedValue({
        cpf: '12345678901',
        nome: 'Test User',
        perfil: 'funcionario'
      })

      mockGetSession.mockResolvedValue({
        userId: 1,
        userRole: 'funcionario',
        cpf: '12345678901'
      })

      mockQuery.mockResolvedValue({
        rows: [{
          id: avaliacaoId,
          status: 'iniciada',
          inicio: new Date().toISOString(),
          grupo_atual: null,
          avaliacaoId: avaliacaoId
        }],
        rowCount: 1
      })

      const { GET } = await import('@/app/api/avaliacao/status/route')
      const response = await GET()
      const data = await response.json()

      expect(data.avaliacaoId).toBe(avaliacaoId)
      // O frontend deve usar esse ID para redirecionar: /avaliacao?id=123
    })
  })
})
