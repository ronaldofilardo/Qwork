/**
 * @file __tests__/api/avaliacao/resultados.test.ts
 * Testes: /api/avaliacao/resultados
 */

import { GET } from '@/app/api/avaliacao/resultados/route'

// Mock do módulo de banco de dados
jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}))

jest.mock('@/lib/db-security', () => ({
  queryWithContext: jest.fn(),
}))

jest.mock('@/lib/session', () => ({
  requireAuth: jest.fn(),
}))

jest.mock('@/lib/questoes', () => ({
  grupos: [
    { id: 1, dominio: 'Demandas no Trabalho', tipo: 'negativa' },
    { id: 2, dominio: 'Organização e Conteúdo', tipo: 'positiva' },
    { id: 9, dominio: 'Comportamento de Jogo', tipo: 'negativa' },
    { id: 10, dominio: 'Endividamento Financeiro', tipo: 'negativa' },
  ],
}))

jest.mock('@/lib/calculate', () => ({
  calcularResultados: jest.fn(() => [{ score: 60 }]),
  categorizarScore: jest.fn(() => 'medio'),
}))

import { queryWithContext } from '@/lib/db-security'
import { requireAuth } from '@/lib/session'

const mockQueryWithContext = queryWithContext as jest.MockedFunction<typeof queryWithContext>
const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>

const mockRequest = { url: 'http://localhost/api/avaliacao/resultados' } as Request

describe('/api/avaliacao/resultados', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve retornar resultados da avaliação conclueída', async () => {
    const respostas = [
      { grupo: 1, item: 'Q1', valor: 75.5 },
      { grupo: 2, item: 'Q2', valor: 85.2 },
      { grupo: 9, item: 'Q59', valor: 33.3 },
      { grupo: 10, item: 'Q65', valor: 33.3 },
    ]
    mockRequireAuth.mockResolvedValue({ cpf: '12345678901', nome: 'Test User', perfil: 'funcionario' } as any)
    // 1st call: find avaliacao; 2nd call: get respostas
    mockQueryWithContext
      .mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: respostas, rowCount: 4 } as any)

    const response = await GET(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.resultados).toHaveLength(4)
    expect(data.resultados[0].grupo).toBe(1)
    expect(data.resultados[1].grupo).toBe(2)
    expect(data.resultados[2].grupo).toBe(9)
    expect(data.resultados[3].grupo).toBe(10)
  })

  it('deve retornar erro 404 quando não há avaliação', async () => {
    mockRequireAuth.mockResolvedValue({ cpf: '12345678901', nome: 'Test User', perfil: 'funcionario' } as any)
    mockQueryWithContext.mockResolvedValue({ rows: [], rowCount: 0 } as any)

    const response = await GET(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data).toEqual({ error: 'Nenhuma avaliação encontrada' })
  })

  it('deve retornar erro 500 quando falha na autenticação', async () => {
    mockRequireAuth.mockRejectedValue(new Error('Não autorizado'))

    const response = await GET(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({ error: 'Erro ao buscar resultados' })
  })

  it('deve retornar erro 500 quando falha na consulta ao banco', async () => {
    mockRequireAuth.mockResolvedValue({ cpf: '12345678901', nome: 'Test User', perfil: 'funcionario' } as any)
    mockQueryWithContext.mockRejectedValue(new Error('Erro de banco'))

    const response = await GET(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({ error: 'Erro ao buscar resultados' })
  })
})

