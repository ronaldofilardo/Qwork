/**
 * @file __tests__/api/avaliacao/status.test.ts
 * Testes: /api/avaliacao/status
 */

import { GET } from '@/app/api/avaliacao/status/route'

// Mock do módulo de banco de dados
jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}))

jest.mock('@/lib/db-security', () => ({
  queryWithContext: jest.fn(),
  transactionWithContext: jest.fn(),
}))

jest.mock('@/lib/session', () => ({
  requireAuth: jest.fn(),
}))

jest.mock('@/lib/types/avaliacao-status', () => ({
  validarTransicaoStatusAvaliacao: jest.fn(() => true),
}))

import { queryWithContext } from '@/lib/db-security'
import { requireAuth } from '@/lib/session'

const mockQueryWithContext = queryWithContext as jest.MockedFunction<typeof queryWithContext>
const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>

function makeGetRequest(params: Record<string, string> = {}): Request {
  const url = new URL('http://localhost/api/avaliacao/status')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return { url: url.toString() } as unknown as Request
}

describe('/api/avaliacao/status', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve retornar status "nao_iniciada" quando não há avaliação', async () => {
    mockRequireAuth.mockResolvedValue({ cpf: '12345678901', nome: 'Test User', perfil: 'funcionario' } as any)
    mockQueryWithContext.mockResolvedValue({ rows: [], rowCount: 0 } as any)

    const response = await GET(makeGetRequest())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({ status: 'nao_iniciada' })
  })

  it('deve retornar status da avaliação quando existe', async () => {
    const mockAvaliacao = {
      id: 1,
      status: 'concluido',
      inicio: '2024-01-01T10:00:00Z',
      envio: '2024-01-01T11:00:00Z',
      grupo_atual: null,
    }

    mockRequireAuth.mockResolvedValue({ cpf: '12345678901', nome: 'Test User', perfil: 'funcionario' } as any)
    // First call: avaliacao, second call: respostas
    mockQueryWithContext
      .mockResolvedValueOnce({ rows: [mockAvaliacao], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)

    const response = await GET(makeGetRequest())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('concluido')
    expect(data.inicio).toBe('2024-01-01T10:00:00Z')
    expect(data.envio).toBe('2024-01-01T11:00:00Z')
  })

  it('deve retornar erro 500 quando falha na consulta ao banco', async () => {
    mockRequireAuth.mockResolvedValue({ cpf: '12345678901', nome: 'Test User', perfil: 'funcionario' } as any)
    mockQueryWithContext.mockRejectedValue(new Error('Erro de banco'))

    const response = await GET(makeGetRequest())
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({ error: 'Erro ao buscar status' })
  })
})
