/**
 * Testes específicos para remoção de hash_arquivo da API /api/emissor/lotes
 *
 * Funcionalidades testadas:
 * 1. API não seleciona coluna hash_arquivo
 * 2. Resposta não inclui hash_arquivo
 * 3. Funciona mesmo sem coluna hash_arquivo no banco
 * 4. Compatibilidade com dados antigos
 */

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/emissor/lotes/route'
import { requireRole } from '@/lib/session'
import { query } from '@/lib/db'

jest.mock('@/lib/session')
jest.mock('@/lib/db')

const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>
const mockQuery = query as jest.MockedFunction<typeof query>

describe('/api/emissor/lotes - Remoção de Hash', () => {
  let mockRequest: Partial<NextRequest>

  beforeEach(() => {
    jest.clearAllMocks()
    mockRequireRole.mockResolvedValue({
      cpf: '99999999999',
      nome: 'Emissor',
      perfil: 'emissor',
    })
    mockRequest = {
      url: 'http://localhost:3000/api/emissor/lotes',
    }
  })

  it('deve funcionar sem coluna hash_arquivo no SELECT', async () => {
    mockQuery.mockResolvedValue({
      rows: [
        {
          id: 1,
          codigo: '001-291125',
          titulo: 'Lote Teste',
          tipo: 'completo',
          liberado_em: '2025-11-29T10:00:00Z',
          empresa_nome: 'Empresa Teste',
          clinica_nome: 'Clínica Teste',
          total_avaliacoes: '4',
          avaliacoes_concluidas: '4',
          observacoes: 'Observações do laudo',
          status_laudo: 'rascunho',
          laudo_id: 100,
          emitido_em: null,
          enviado_em: null,
        },
      ],
      rowCount: 1,
    } as any)

    const response = await GET(mockRequest as NextRequest)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.lotes[0]).not.toHaveProperty('hash_arquivo')
    expect(data.lotes[0].laudo).not.toHaveProperty('hash_arquivo')
  })

  it('deve funcionar com dados que não têm hash_arquivo', async () => {
    mockQuery.mockResolvedValue({
      rows: [
        {
          id: 1,
          codigo: '001-291125',
          titulo: 'Lote Antigo',
          tipo: 'completo',
          liberado_em: '2025-11-29T10:00:00Z',
          empresa_nome: 'Empresa Teste',
          clinica_nome: 'Clínica Teste',
          total_avaliacoes: '4',
          avaliacoes_concluidas: '4',
          observacoes: 'Laudo sem hash',
          status_laudo: 'emitido',
          laudo_id: 100,
          emitido_em: '2025-11-30T10:00:00Z',
          enviado_em: null,
        },
      ],
      rowCount: 1,
    } as any)

    const response = await GET(mockRequest as NextRequest)
    const data = await response.json()

    expect(data.lotes[0].laudo.status).toBe('emitido')
    expect(data.lotes[0].laudo.emitido_em).toBe('2025-11-30T10:00:00Z')
    expect(data.lotes[0].laudo).not.toHaveProperty('hash_arquivo')
  })

  it('deve manter compatibilidade com estrutura de resposta', async () => {
    mockQuery.mockResolvedValue({
      rows: [
        {
          id: 1,
          codigo: '001-291125',
          titulo: 'Lote Completo',
          tipo: 'completo',
          liberado_em: '2025-11-29T10:00:00Z',
          empresa_nome: 'Empresa Teste',
          clinica_nome: 'Clínica Teste',
          total_avaliacoes: '4',
          avaliacoes_concluidas: '4',
          observacoes: 'Observações completas',
          status_laudo: 'enviado',
          laudo_id: 100,
          emitido_em: '2025-11-30T09:00:00Z',
          enviado_em: '2025-11-30T10:00:00Z',
        },
      ],
      rowCount: 1,
    } as any)

    const response = await GET(mockRequest as NextRequest)
    const data = await response.json()

    expect(data.lotes[0]).toHaveProperty('id')
    expect(data.lotes[0]).toHaveProperty('codigo')
    expect(data.lotes[0]).toHaveProperty('titulo')
    expect(data.lotes[0]).toHaveProperty('empresa_nome')
    expect(data.lotes[0]).toHaveProperty('clinica_nome')
    expect(data.lotes[0]).toHaveProperty('liberado_em')
    expect(data.lotes[0]).toHaveProperty('laudo')

    expect(data.lotes[0].laudo).toHaveProperty('id')
    expect(data.lotes[0].laudo).toHaveProperty('observacoes')
    expect(data.lotes[0].laudo).toHaveProperty('status')
    expect(data.lotes[0].laudo).toHaveProperty('emitido_em')
    expect(data.lotes[0].laudo).toHaveProperty('enviado_em')

    // Verificar que hash_arquivo não está presente
    expect(data.lotes[0]).not.toHaveProperty('hash_arquivo')
    expect(data.lotes[0].laudo).not.toHaveProperty('hash_arquivo')
  })
})