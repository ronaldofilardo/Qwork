import { POST, GET } from '@/app/api/admin/clinicas/route'
import { query } from '@/lib/db'
import { requireRole } from '@/lib/session'
import { logAudit } from '@/lib/audit'
import bcrypt from 'bcryptjs'

// Mocks
jest.mock('@/lib/db')
jest.mock('@/lib/session')
jest.mock('@/lib/audit')
jest.mock('bcryptjs')

const mockQuery = query as jest.MockedFunction<typeof query>
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>
const mockLogAudit = logAudit as jest.MockedFunction<typeof logAudit>

describe('/api/admin/clinicas', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('deve retornar lista de clínicas para admin', async () => {
      const mockSession = { cpf: '12345678901', nome: 'Admin Teste', perfil: 'admin' as const }
      mockRequireRole.mockResolvedValue(mockSession)
      mockQuery.mockResolvedValue({ rows: [
          {
            id: 1,
            nome: 'Clínica Teste',
            cnpj: '12345678000190',
            email: 'contato@clinica.com',
            telefone: '1133334444',
            endereco: 'Rua Teste, 123',
            cidade: 'São Paulo',
            estado: 'SP',
            ativa: true,
            status: 'aprovado',
            responsavel_nome: 'Dr. João Silva',
            responsavel_cpf: '12345678901',
            responsavel_email: 'joao@clinica.com',
            criado_em: '2024-01-01 00:00:00'
          }
        ], rowCount: 1 })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(1)
      expect(data[0].nome).toBe('Clínica Teste')
      expect(mockRequireRole).toHaveBeenCalledWith('admin')
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('FROM contratantes'),
        [],
        mockSession
      )
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("WHERE tipo = 'clinica' AND status = 'aprovado'"),
        [],
        mockSession
      )
    })

    it('deve retornar 403 se não for admin', async () => {
      mockRequireRole.mockRejectedValue(new Error('Sem permissão'))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Acesso negado')
    })
  })

  describe('POST', () => {
    const validClinica = {
      nome: 'Nova Clínica',
      razao_social: 'Nova Clínica Ltda',
      cnpj: '11222333000181',
      email: 'nova@clinica.com',
      telefone: '1133334444',
      endereco: 'Rua Nova, 456',
      cidade: 'São Paulo',
      estado: 'SP',
      inscricao_estadual: '987654321'
    }

    it('deve criar clínica com sucesso sem gestor RH', async () => {
      const mockSession = { cpf: '12345678901', nome: 'Admin Teste', perfil: 'admin' as const }
      mockRequireRole.mockResolvedValue(mockSession)
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // Verificar CNPJ duplicado
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // BEGIN
      mockQuery.mockResolvedValueOnce({ // INSERT clínica
        rows: [{
          id: 1,
          ...validClinica,
          cnpj: '11222333000181',
          ativa: true,
          criado_em: '2024-01-01T00:00:00.000Z'
        }]
      } as any)
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // COMMIT
      mockLogAudit.mockResolvedValue(undefined)

      const request = new Request('http://localhost:3000/api/admin/clinicas', {
        method: 'POST',
        body: JSON.stringify(validClinica)
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.clinica.nome).toBe('Nova Clínica')
      expect(data.gestor_rh).toBeNull()

      // Verificar que foi chamado INSERT INTO contratantes
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO contratantes'),
        expect.any(Array),
        mockSession
      )
    })

    it('deve criar clínica com gestor RH', async () => {
      mockRequireRole.mockResolvedValue(undefined)
      
      const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>
      mockBcrypt.hash.mockResolvedValue('hashedPassword' as any)

      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // Verificar CNPJ duplicado
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // Verificar CPF gestor duplicado
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // BEGIN
      mockQuery.mockResolvedValueOnce({ // INSERT clínica
        rows: [{
          id: 1,
          ...validClinica,
          cnpj: '11222333000181',
          ativa: true,
          criado_em: '2024-01-01T00:00:00.000Z'
        }]
      } as any)
      mockQuery.mockResolvedValueOnce({ // INSERT gestor RH
        rows: [{
          cpf: '12345678909',
          nome: 'Gestor Teste',
          email: 'gestor@teste.com',
          ativo: true,
          criado_em: '2024-01-01T00:00:00.000Z'
        }]
      } as any)
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // COMMIT
      mockLogAudit.mockResolvedValue(undefined)

      const clinicaComGestor = {
        ...validClinica,
        gestor_rh: {
          nome: 'Gestor Teste',
          cpf: '12345678909',
          email: 'gestor@teste.com',
          senha: '123456'
        }
      }

      const request = new Request('http://localhost:3000/api/admin/clinicas', {
        method: 'POST',
        body: JSON.stringify(clinicaComGestor)
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.gestor_rh).toBeDefined()
      expect(data.gestor_rh.nome).toBe('Gestor Teste')
    })

    it('deve rejeitar clínica sem nome', async () => {
      mockRequireRole.mockResolvedValue(undefined)

      const request = new Request('http://localhost:3000/api/admin/clinicas', {
        method: 'POST',
        body: JSON.stringify({ cnpj: '11222333000181' })
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Nome da clínica é obrigatório')
    })

    it('deve rejeitar CNPJ inválido', async () => {
      mockRequireRole.mockResolvedValue(undefined)

      const request = new Request('http://localhost:3000/api/admin/clinicas', {
        method: 'POST',
        body: JSON.stringify({
          nome: 'Teste',
          cnpj: '12345678000000' // CNPJ inválido
        })
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('CNPJ inválido')
    })

    it('deve rejeitar gestor RH com CPF inválido', async () => {
      mockRequireRole.mockResolvedValue(undefined)

      const request = new Request('http://localhost:3000/api/admin/clinicas', {
        method: 'POST',
        body: JSON.stringify({
          ...validClinica,
          gestor_rh: {
            nome: 'Gestor',
            cpf: '12345678900', // CPF inválido
            email: 'gestor@teste.com'
          }
        })
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('CPF do gestor RH inválido')
    })

    it('deve rejeitar CNPJ duplicado', async () => {
      mockRequireRole.mockResolvedValue(undefined)
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 }) // Verificar CNPJ (existe)

      const request = new Request('http://localhost:3000/api/admin/clinicas', {
        method: 'POST',
        body: JSON.stringify(validClinica)
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe('CNPJ já cadastrado')
    })
  })
})
