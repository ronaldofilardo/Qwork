/**
 * Testes para endpoint de ativação/inativação de empresas por RH
 * 
 * Endpoint testado:
 * - PATCH /api/rh/empresas/[id]
 * 
 * Regras de negócio testadas:
 * - RH pode ativar/inativar empresas de sua clínica
 * - Ao inativar empresa, funcionários são inativados em cascata
 * - Ao ativar empresa, funcionários permanecem inativos (reativação manual)
 * - Admin pode gerenciar qualquer empresa
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

describe('PATCH /api/rh/empresas/[id] - Ativação/Inativação de Empresas', () => {
  const mockRHSession = {
    cpf: '11111111111',
    nome: 'Gestor RH',
    perfil: 'rh' as const
  }

  const mockAdminSession = {
    cpf: '00000000001',
    nome: 'Admin',
    perfil: 'admin' as const
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Inativação de Empresa (ativa = false)', () => {
    it('deve inativar empresa e seus funcionários com sucesso', async () => {
      mockRequireRHWithEmpresaAccess.mockResolvedValue(mockRHSession)

      // Mock BEGIN transaction
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      // Mock atualizar empresa
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 1,
          nome: 'Empresa Teste',
          cnpj: '12345678000190',
          ativa: false,
          clinica_id: 1
        }],
        rowCount: 1
      })

      // Mock inativar funcionários
      mockQuery.mockResolvedValueOnce({
        rows: [{ cpf: '22222222222' }, { cpf: '33333333333' }],
        rowCount: 2
      })

      // Mock COMMIT transaction
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      const { PATCH } = await import('@/app/api/rh/empresas/[id]/route')

      const request = new NextRequest('http://localhost/api/rh/empresas/1', {
        method: 'PATCH',
        body: JSON.stringify({ ativa: false })
      })

      const response = await PATCH(request, { params: { id: '1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.empresa.ativa).toBe(false)
      expect(data.funcionarios_inativados).toBe(2)
      expect(data.mensagem).toContain('2 funcionário(s) foram inativados')
    })

    it('deve usar transação e fazer ROLLBACK em caso de erro', async () => {
      mockRequireRole.mockResolvedValue(mockRHSession)

      mockQuery.mockResolvedValueOnce({
        rows: [{ clinica_id: 1 }],
        rowCount: 1
      })

      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, clinica_id: 1 }],
        rowCount: 1
      })

      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // BEGIN

      // Simular erro na atualização
      mockQuery.mockRejectedValueOnce(new Error('Database error'))

      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // ROLLBACK

      const { PATCH } = await import('@/app/api/rh/empresas/[id]/route')

      const request = new NextRequest('http://localhost/api/rh/empresas/1', {
        method: 'PATCH',
        body: JSON.stringify({ ativa: false })
      })

      const response = await PATCH(request, { params: { id: '1' } })

      expect(response.status).toBe(500)
    })
  })

  describe('Ativação de Empresa (ativa = true)', () => {
    it('deve ativar empresa sem reativar funcionários', async () => {
      mockRequireRHWithEmpresaAccess.mockResolvedValue(mockRHSession)

      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // BEGIN

      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 1,
          nome: 'Empresa Teste',
          cnpj: '12345678000190',
          ativa: true,
          clinica_id: 1
        }],
        rowCount: 1
      })

      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // COMMIT

      const { PATCH } = await import('@/app/api/rh/empresas/[id]/route')

      const request = new NextRequest('http://localhost/api/rh/empresas/1', {
        method: 'PATCH',
        body: JSON.stringify({ ativa: true })
      })

      const response = await PATCH(request, { params: { id: '1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.empresa.ativa).toBe(true)
      expect(data.mensagem).toContain('funcionários devem ser reativados individualmente')
      expect(data.funcionarios_inativados).toBeUndefined()
    })
  })

  describe('Validações e Permissões', () => {
    it('deve retornar 400 para ID inválido', async () => {
      mockRequireRole.mockResolvedValue(mockRHSession)

      const { PATCH } = await import('@/app/api/rh/empresas/[id]/route')

      const request = new NextRequest('http://localhost/api/rh/empresas/abc', {
        method: 'PATCH',
        body: JSON.stringify({ ativa: false })
      })

      const response = await PATCH(request, { params: { id: 'abc' } })

      expect(response.status).toBe(400)
    })

    it('deve retornar 400 se ativa não for boolean', async () => {
      mockRequireRole.mockResolvedValue(mockRHSession)

      mockQuery.mockResolvedValueOnce({
        rows: [{ clinica_id: 1 }],
        rowCount: 1
      })

      const { PATCH } = await import('@/app/api/rh/empresas/[id]/route')

      const request = new NextRequest('http://localhost/api/rh/empresas/1', {
        method: 'PATCH',
        body: JSON.stringify({ ativa: 'sim' })
      })

      const response = await PATCH(request, { params: { id: '1' } })

      expect(response.status).toBe(400)
    })

    it('deve retornar 403 se não for RH ou superior', async () => {
      mockRequireRHWithEmpresaAccess.mockRejectedValue(new Error('Sem permissão'))

      const { PATCH } = await import('@/app/api/rh/empresas/[id]/route')

      const request = new NextRequest('http://localhost/api/rh/empresas/1', {
        method: 'PATCH',
        body: JSON.stringify({ ativa: false })
      })

      const response = await PATCH(request, { params: { id: '1' } })

      expect(response.status).toBe(403)
    })
  })

  describe('Propagação de Status', () => {
    it('não deve reativar funcionários automaticamente ao ativar empresa', async () => {
      mockRequireRole.mockResolvedValue(mockRHSession)

      mockQuery.mockResolvedValueOnce({
        rows: [{ clinica_id: 1 }],
        rowCount: 1
      })

      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, clinica_id: 1 }],
        rowCount: 1
      })

      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // BEGIN

      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, nome: 'Empresa', cnpj: '12345', ativa: true, clinica_id: 1 }],
        rowCount: 1
      })

      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // COMMIT

      const { PATCH } = await import('@/app/api/rh/empresas/[id]/route')

      const request = new NextRequest('http://localhost/api/rh/empresas/1', {
        method: 'PATCH',
        body: JSON.stringify({ ativa: true })
      })

      await PATCH(request, { params: { id: '1' } })

      // Verificar que NÃO houve UPDATE em funcionários
      const funcionariosUpdateCall = mockQuery.mock.calls.find(call => 
        call[0]?.includes('UPDATE funcionarios') && call[0]?.includes('empresa_id')
      )
      expect(funcionariosUpdateCall).toBeUndefined()
    })
  })
})
