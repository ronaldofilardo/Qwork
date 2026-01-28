/**
 * Testes isolados para casos específicos que têm problemas de interferência de mocks
 *
 * Endpoint testado:
 * - PATCH /api/rh/empresas/[id]
 */

import { NextRequest } from 'next/server'
import { query } from '@/lib/db'
import { requireRole, requireRHWithEmpresaAccess } from '@/lib/session'

// Mocks
jest.mock('@/lib/db')
jest.mock('@/lib/session')

const mockQuery = query as jest.MockedFunction<typeof query>
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>
const mockRequireRHWithEmpresaAccess = requireRHWithEmpresaAccess as jest.MockedFunction<typeof requireRHWithEmpresaAccess>

describe('PATCH /api/rh/empresas/[id] - Testes Isolados', () => {
  const mockRHSession = {
    cpf: '11111111111',
    nome: 'Gestor RH',
    perfil: 'rh' as const
  }

  const mockAdminSession = {
    cpf: '00000000001',
    nome: 'Admin',
    perfil: 'admin' as const,
    clinica_id: 1
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Casos de erro específicos', () => {
    it('deve retornar 404 se RH não for encontrado', async () => {
      mockRequireRole.mockResolvedValue(mockRHSession)

      // Mock: requireRHWithEmpresaAccess lança erro "Gestor RH não encontrado"
      mockRequireRHWithEmpresaAccess.mockRejectedValue(new Error('Gestor RH não encontrado'))

      const { PATCH } = await import('@/app/api/rh/empresas/[id]/route')

      const request = new NextRequest('http://localhost/api/rh/empresas/1', {
        method: 'PATCH',
        body: JSON.stringify({ ativa: false })
      })

      const response = await PATCH(request, { params: { id: '1' } })

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toContain('Gestor RH não encontrado')
    })

    it('deve retornar 404 se empresa não existir', async () => {
      mockRequireRole.mockResolvedValue(mockRHSession)

      mockQuery.mockResolvedValueOnce({
        rows: [{ clinica_id: 1 }],
        rowCount: 1
      })

      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      })

      const { PATCH } = await import('@/app/api/rh/empresas/[id]/route')

      const request = new NextRequest('http://localhost/api/rh/empresas/999', {
        method: 'PATCH',
        body: JSON.stringify({ ativa: false })
      })

      const response = await PATCH(request, { params: { id: '999' } })

      expect(response.status).toBe(404)
    })

    it('deve retornar 403 se RH tentar gerenciar empresa de outra clínica', async () => {
      mockRequireRole.mockResolvedValue(mockRHSession)

      // Mock: requireRHWithEmpresaAccess lança erro de permissão
      mockRequireRHWithEmpresaAccess.mockRejectedValue(new Error('Você não tem permissão para acessar esta empresa'))

      const { PATCH } = await import('@/app/api/rh/empresas/[id]/route')

      const request = new NextRequest('http://localhost/api/rh/empresas/1', {
        method: 'PATCH',
        body: JSON.stringify({ ativa: false })
      })

      const response = await PATCH(request, { params: { id: '1' } })

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toContain('não tem permissão')
    })
  })

  describe('Casos de sucesso específicos', () => {
    it('deve permitir admin gerenciar qualquer empresa', async () => {
      // Configurar mocks ANTES do import
      mockRequireRole.mockResolvedValue(mockAdminSession)
      mockRequireRHWithEmpresaAccess.mockResolvedValue(mockAdminSession)

      // Reset mock query
      mockQuery.mockReset()

      // Mocks para as queries na ordem exata
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // BEGIN
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 5,
          nome: 'Empresa de Outra Clínica',
          cnpj: '98765432000199',
          ativa: false,
          clinica_id: 99
        }],
        rowCount: 1
      }) // UPDATE empresas_clientes
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      }) // UPDATE funcionarios
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // COMMIT

      const { PATCH } = await import('@/app/api/rh/empresas/[id]/route')

      const request = new NextRequest('http://localhost/api/rh/empresas/5', {
        method: 'PATCH',
        body: JSON.stringify({ ativa: false })
      })

      const response = await PATCH(request, { params: { id: '5' } })

      expect(response.status).toBe(200)
    })

    it('deve inativar apenas funcionários (não RH, admin, emissor)', async () => {
      mockRequireRole.mockResolvedValue(mockRHSession)
      mockRequireRHWithEmpresaAccess.mockResolvedValue(mockRHSession)

      // Reset mock query
      mockQuery.mockReset()

      // Mocks na ordem exata
      mockQuery.mockResolvedValueOnce({
        rows: [{ clinica_id: 1 }],
        rowCount: 1
      }) // SELECT clinica_id FROM empresas_clientes

      mockQuery.mockResolvedValueOnce({
        rows: [{ clinica_id: 1 }],
        rowCount: 1
      }) // SELECT clinica_id FROM funcionarios

      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // BEGIN

      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, nome: 'Empresa', cnpj: '12345', ativa: false, clinica_id: 1 }],
        rowCount: 1
      }) // UPDATE empresas_clientes

      mockQuery.mockResolvedValueOnce({
        rows: [{ cpf: '22222222222' }, { cpf: '33333333333' }],
        rowCount: 2
      }) // UPDATE funcionarios

      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // COMMIT

      const { PATCH } = await import('@/app/api/rh/empresas/[id]/route')

      const request = new NextRequest('http://localhost/api/rh/empresas/1', {
        method: 'PATCH',
        body: JSON.stringify({ ativa: false })
      })

      await PATCH(request, { params: { id: '1' } })

      // Verificar que a query de UPDATE inclui WHERE perfil = 'funcionario'
      const updateCall = mockQuery.mock.calls.find(call =>
        call[0]?.includes('UPDATE funcionarios') && call[0]?.includes('empresa_id')
      )
      expect(updateCall).toBeDefined()
      expect(updateCall[0]).toContain("perfil = 'funcionario'")
    })
  })
})
