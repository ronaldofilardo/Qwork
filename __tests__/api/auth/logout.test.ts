import { NextRequest } from 'next/server'
import { POST } from '@/app/api/auth/logout/route'
import { destroySession } from '@/lib/session'

// Mock das dependências
jest.mock('@/lib/session')

const mockDestroySession = destroySession as jest.MockedFunction<typeof destroySession>

describe('/api/auth/logout', () => {
  let mockRequest: Partial<NextRequest>

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock da request
    mockRequest = {
      json: jest.fn(),
    }
  })

  it('deve destruir sessão com sucesso', async () => {
    mockDestroySession.mockResolvedValue()

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(mockDestroySession).toHaveBeenCalled()
  })

  it('deve retornar erro 500 em caso de erro interno', async () => {
    mockDestroySession.mockRejectedValue(new Error('Session error'))

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Erro ao fazer logout')
  })
})