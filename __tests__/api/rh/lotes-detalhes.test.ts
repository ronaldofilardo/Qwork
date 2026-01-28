/**
 * Testes para API /api/rh/lotes/[id]
 * - Buscar detalhes de um lote específico
 * - Verificar permissões de clínica
 * - Validar JOIN com funcionarios para liberado_por_nome
 */

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}))

jest.mock('@/lib/session', () => ({
  requireAuth: jest.fn(),
}))

import { NextRequest } from 'next/server'
import { query } from '@/lib/db'
import { requireAuth } from '@/lib/session'
import { GET } from '@/app/api/rh/lotes/[id]/route'

const mockQuery = query as jest.MockedFunction<typeof query>
const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>

describe('/api/rh/lotes/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET - Buscar detalhes do lote', () => {
    it('deve retornar detalhes completos do lote com liberado_por_nome', async () => {
      mockRequireAuth.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh'
      })

      // Mock da query principal do lote
      mockQuery.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          id: 16,
          codigo: 'LOTE-016',
          titulo: 'Avaliação Anual 2025',
          descricao: 'Avaliação completa dos funcionários',
          tipo: 'completo',
          status: 'ativo',
          liberado_em: '2025-01-15T10:00:00Z',
          liberado_por_nome: 'João Silva',
          empresa_id: 5,
          empresa_nome: 'Empresa ABC Ltda',
          clinica_id: 1
        }]
      })

      // Mock da verificação de clínica do usuário
      mockQuery.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ clinica_id: 1 }]
      })

      const request = new NextRequest('http://localhost:3000/api/rh/lotes/16')
      const response = await GET(request, { params: { id: '16' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.lote).toEqual({
        id: 16,
        empresa_id: 5,
        empresa_nome: 'Empresa ABC Ltda',
        codigo: 'LOTE-016',
        titulo: 'Avaliação Anual 2025',
        descricao: 'Avaliação completa dos funcionários',
        tipo: 'completo',
        status: 'ativo',
        liberado_em: '2025-01-15T10:00:00Z',
        liberado_por_nome: 'João Silva'
      })

      expect(mockQuery).toHaveBeenCalledTimes(2)
      expect(mockQuery).toHaveBeenNthCalledWith(1, expect.stringContaining('SELECT'), ['16'])
      expect(mockQuery).toHaveBeenNthCalledWith(2, expect.stringContaining('clinica_id FROM funcionarios'), ['11111111111'])
    })

    it('deve retornar 404 quando lote não existe', async () => {
      mockRequireAuth.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh'
      })

      mockQuery.mockResolvedValueOnce({
        rowCount: 0,
        rows: []
      })

      const request = new NextRequest('http://localhost:3000/api/rh/lotes/999')
      const response = await GET(request, { params: { id: '999' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Lote não encontrado')
    })

    it('deve retornar 403 quando usuário não tem perfil rh', async () => {
      mockRequireAuth.mockResolvedValue({
        cpf: '11111111111',
        nome: 'Funcionário Teste',
        perfil: 'funcionario'
      })

      const request = new NextRequest('http://localhost:3000/api/rh/lotes/16')
      const response = await GET(request, { params: { id: '16' } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Acesso negado')
      expect(mockQuery).not.toHaveBeenCalled()
    })

    it('deve retornar 403 quando usuário não está autenticado', async () => {
      mockRequireAuth.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/rh/lotes/16')
      const response = await GET(request, { params: { id: '16' } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Acesso negado')
      expect(mockQuery).not.toHaveBeenCalled()
    })

    it('deve retornar 403 quando usuário pertence a clínica diferente', async () => {
      mockRequireAuth.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh'
      })

      // Mock da query principal - lote existe
      mockQuery.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          id: 16,
          clinica_id: 2, // Clínica diferente
          empresa_id: 5,
          empresa_nome: 'Empresa ABC Ltda',
          codigo: 'LOTE-016',
          titulo: 'Avaliação Anual 2025',
          descricao: 'Avaliação completa dos funcionários',
          tipo: 'completo',
          status: 'ativo',
          liberado_em: '2025-01-15T10:00:00Z',
          liberado_por_nome: 'João Silva'
        }]
      })

      // Mock da verificação - usuário pertence à clínica 1
      mockQuery.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ clinica_id: 1 }]
      })

      const request = new NextRequest('http://localhost:3000/api/rh/lotes/16')
      const response = await GET(request, { params: { id: '16' } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Você não tem permissão para acessar este lote')
    })

    it('deve lidar com erro de banco de dados', async () => {
      mockRequireAuth.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh'
      })

      mockQuery.mockRejectedValueOnce(new Error('Erro de conexão com banco'))

      const request = new NextRequest('http://localhost:3000/api/rh/lotes/16')
      const response = await GET(request, { params: { id: '16' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Erro interno do servidor')
      expect(data.detalhes).toBe('Erro de conexão com banco')
    })

    it('deve validar que a query inclui JOIN correto para liberado_por_nome', async () => {
      mockRequireAuth.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh'
      })

      mockQuery.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          id: 16,
          codigo: 'LOTE-016',
          titulo: 'Avaliação Anual 2025',
          descricao: 'Avaliação completa dos funcionários',
          tipo: 'completo',
          status: 'ativo',
          liberado_em: '2025-01-15T10:00:00Z',
          liberado_por_nome: null, // Caso o funcionário tenha sido removido
          empresa_id: 5,
          empresa_nome: 'Empresa ABC Ltda',
          clinica_id: 1
        }]
      })

      mockQuery.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ clinica_id: 1 }]
      })

      const request = new NextRequest('http://localhost:3000/api/rh/lotes/16')
      const response = await GET(request, { params: { id: '16' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.lote.liberado_por_nome).toBeNull()

      // Verificar que a query inclui LEFT JOIN
      const queryCall = mockQuery.mock.calls[0][0]
      expect(queryCall).toContain('LEFT JOIN funcionarios f ON la.liberado_por = f.cpf')
      expect(queryCall).toContain('f.nome as liberado_por_nome')
    })
  })
})