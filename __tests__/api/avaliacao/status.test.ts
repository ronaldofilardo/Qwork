import { NextRequest } from 'next/server'
import { GET } from '@/app/api/avaliacao/status/route'

// Mock do módulo de banco de dados
jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}))

jest.mock('@/lib/session', () => ({
  requireAuth: jest.fn(),
}))

import { query } from '@/lib/db'
import { requireAuth } from '@/lib/session'

const mockQuery = query as jest.MockedFunction<typeof query>
const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>

describe('/api/avaliacao/status', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve retornar status "nao_iniciada" quando não há avaliação', async () => {
    mockRequireAuth.mockResolvedValue({ cpf: '12345678901', nome: 'Test User', perfil: 'funcionario' })
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0 })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({ status: 'nao_iniciada' })
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('SELECT id, status, inicio, envio, grupo_atual FROM avaliacoes'),
      ['12345678901']
    )
  })

  it('deve retornar status da avaliação quando existe', async () => {
    const mockAvaliacao = {
      id: 1,
      status: 'concluida',
      inicio: '2024-01-01T10:00:00Z',
      envio: '2024-01-01T11:00:00Z'
    }

    mockRequireAuth.mockResolvedValue({ cpf: '12345678901', nome: 'Test User', perfil: 'funcionario' })
    mockQuery.mockResolvedValue({ rows: [mockAvaliacao], rowCount: 1 })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({
      status: 'concluida',
      inicio: '2024-01-01T10:00:00Z',
      envio: '2024-01-01T11:00:00Z'
    })
  })

  it('deve retornar erro 500 quando falha na autenticação', async () => {
    mockRequireAuth.mockRejectedValue(new Error('Não autorizado'))
  })

  it('deve retornar erro 500 quando falha na consulta ao banco', async () => {
    mockRequireAuth.mockResolvedValue({ cpf: '12345678901', nome: 'Test User', perfil: 'funcionario' })
    mockQuery.mockRejectedValue(new Error('Erro de banco'))

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({ error: 'Erro ao buscar status' })
  })

  it('deve retornar erro 500 quando falha na consulta ao banco', async () => {
    mockRequireAuth.mockResolvedValue({ cpf: '12345678901', nome: 'Test User', perfil: 'funcionario' })
    mockQuery.mockRejectedValue(new Error('Erro de banco'))

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({ error: 'Erro ao buscar status' })
  })
})