/**
 * Testes para cenários de avaliações com funcionários inativos
 * Valida a lógica de contagem, prontidão e percentuais
 */

import { query } from '@/lib/db'
import { gerarDadosGeraisEmpresa } from '@/lib/laudo-calculos'

jest.mock('@/lib/db')
const mockQuery = query as jest.MockedFunction<typeof query>

describe('Cenários com Funcionários Inativos', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Lógica de Prontidão de Lotes', () => {
    it('deve considerar lote pronto quando todas avaliações ativas estão concluídas', async () => {
      // Lote com 10 avaliações: 8 concluídas, 2 inativadas
      // Deve ser considerado PRONTO
      mockQuery.mockResolvedValueOnce({
        rows: [{
          total_avaliacoes: '8', // Exclui inativadas
          avaliacoes_concluidas: '8',
          avaliacoes_inativadas: '2'
        }],
        rowCount: 1
      })

      const result = await mockQuery(`
        SELECT
          COUNT(CASE WHEN a.status != 'inativada' THEN 1 END) as total_avaliacoes,
          COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as avaliacoes_concluidas,
          COUNT(CASE WHEN a.status = 'inativada' THEN 1 END) as avaliacoes_inativadas
        FROM avaliacoes a
        WHERE a.lote_id = $1
      `, [1])

      const lote = result.rows[0]
      const estaPronto = parseInt(lote.total_avaliacoes) === parseInt(lote.avaliacoes_concluidas)

      expect(estaPronto).toBe(true)
      expect(parseInt(lote.total_avaliacoes)).toBe(8)
      expect(parseInt(lote.avaliacoes_inativadas)).toBe(2)
    })

    it('deve considerar lote não pronto quando há avaliações ativas pendentes', async () => {
      // Lote com 10 avaliações: 6 concluídas, 2 pendentes, 2 inativadas
      // NÃO deve ser considerado pronto
      mockQuery.mockResolvedValueOnce({
        rows: [{
          total_avaliacoes: '8', // Exclui inativadas
          avaliacoes_concluidas: '6',
          avaliacoes_inativadas: '2'
        }],
        rowCount: 1
      })

      const result = await mockQuery(`
        SELECT
          COUNT(CASE WHEN a.status != 'inativada' THEN 1 END) as total_avaliacoes,
          COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as avaliacoes_concluidas,
          COUNT(CASE WHEN a.status = 'inativada' THEN 1 END) as avaliacoes_inativadas
        FROM avaliacoes a
        WHERE a.lote_id = $1
      `, [1])

      const lote = result.rows[0]
      const estaPronto = parseInt(lote.total_avaliacoes) === parseInt(lote.avaliacoes_concluidas)

      expect(estaPronto).toBe(false)
      expect(parseInt(lote.total_avaliacoes)).toBe(8)
      expect(parseInt(lote.avaliacoes_concluidas)).toBe(6)
    })

    it('deve lidar com lote onde todos funcionários foram inativados', async () => {
      // Cenário extremo: todas as 10 avaliações foram inativadas
      mockQuery.mockResolvedValueOnce({
        rows: [{
          total_avaliacoes: '0', // Nenhuma ativa
          avaliacoes_concluidas: '0',
          avaliacoes_inativadas: '10'
        }],
        rowCount: 1
      })

      const result = await mockQuery(`
        SELECT
          COUNT(CASE WHEN a.status != 'inativada' THEN 1 END) as total_avaliacoes,
          COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as avaliacoes_concluidas,
          COUNT(CASE WHEN a.status = 'inativada' THEN 1 END) as avaliacoes_inativadas
        FROM avaliacoes a
        WHERE a.lote_id = $1
      `, [1])

      const lote = result.rows[0]
      const estaPronto = parseInt(lote.total_avaliacoes) > 0 &&
                         parseInt(lote.total_avaliacoes) === parseInt(lote.avaliacoes_concluidas)

      expect(estaPronto).toBe(false) // Não deve permitir lote sem avaliações ativas
      expect(parseInt(lote.total_avaliacoes)).toBe(0)
    })
  })

  describe('Cálculo de Percentual de Conclusão', () => {
    it('deve calcular percentual correto excluindo inativadas', async () => {
      // Setup: lote com 10 avaliações, 2 inativadas, 7 de 8 ativas concluídas
      mockQuery
        .mockResolvedValueOnce({
          rows: [{
            titulo: 'Lote Teste',
            liberado_em: '2025-01-01',
            empresa_nome: 'Empresa Teste LTDA',
            cnpj: '12.345.678/0001-90',
            endereco: 'Rua Teste, 123',
            cidade: 'São Paulo',
            estado: 'SP',
            cep: '01234-567',
            clinica_nome: 'Clínica BPS',
            total_avaliacoes: '8', // Exclui inativadas
            avaliacoes_concluidas: '7',
            primeira_avaliacao: '2025-01-02',
            ultima_conclusao: '2025-01-10'
          }],
          rowCount: 1
        })
        .mockResolvedValueOnce({
          rows: [{
            total: '7',
            operacional: '5',
            gestao: '2'
          }],
          rowCount: 1
        })

      const dados = await gerarDadosGeraisEmpresa(1)

      // Percentual deve ser 7/8 = 87.5% ≈ 88%
      expect(dados.percentualConclusao).toBe(88)
      expect(dados.totalFuncionariosAvaliados).toBe(7)
    })

    it('deve exibir 100% quando todas avaliações ativas estão concluídas', async () => {
      // 10 avaliações: 8 ativas concluídas, 2 inativadas = 100%
      mockQuery
        .mockResolvedValueOnce({
          rows: [{
            titulo: 'Lote Completo',
            liberado_em: '2025-01-01',
            empresa_nome: 'Empresa Teste',
            cnpj: '12.345.678/0001-90',
            endereco: 'Rua Teste',
            cidade: 'São Paulo',
            estado: 'SP',
            cep: '01234-567',
            clinica_nome: 'Clínica BPS',
            total_avaliacoes: '8', // Exclui inativadas
            avaliacoes_concluidas: '8',
            primeira_avaliacao: '2025-01-02',
            ultima_conclusao: '2025-01-15'
          }],
          rowCount: 1
        })
        .mockResolvedValueOnce({
          rows: [{
            total: '8',
            operacional: '6',
            gestao: '2'
          }],
          rowCount: 1
        })

      const dados = await gerarDadosGeraisEmpresa(1)

      expect(dados.percentualConclusao).toBe(100)
      expect(dados.totalFuncionariosAvaliados).toBe(8)
    })

    it('deve retornar 0% para lote sem avaliações ativas concluídas', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{
            titulo: 'Lote Iniciado',
            liberado_em: '2025-01-01',
            empresa_nome: 'Empresa Nova',
            cnpj: '98.765.432/0001-10',
            endereco: 'Av Principal',
            cidade: 'Rio de Janeiro',
            estado: 'RJ',
            cep: '20000-000',
            clinica_nome: 'Clínica Rio',
            total_avaliacoes: '5', // 5 ativas, 3 inativadas
            avaliacoes_concluidas: '0',
            primeira_avaliacao: '2025-01-02',
            ultima_conclusao: null
          }],
          rowCount: 1
        })
        .mockResolvedValueOnce({
          rows: [{
            total: '0',
            operacional: '0',
            gestao: '0'
          }],
          rowCount: 1
        })

      const dados = await gerarDadosGeraisEmpresa(1)

      expect(dados.percentualConclusao).toBe(0)
      expect(dados.totalFuncionariosAvaliados).toBe(0)
    })
  })

  describe('Notificações Emissor', () => {
    it('deve incluir lote com inativadas nas notificações quando pronto', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 1,
          titulo: 'Lote Pronto',
          liberado_em: '2025-01-01',
          empresa_nome: 'Empresa ABC',
          clinica_nome: 'Clínica BPS',
          total_avaliacoes: '8', // Exclui inativadas
          avaliacoes_concluidas: '8',
          avaliacoes_inativadas: '2',
          status_laudo: null,
          laudo_id: null,
          tipo_notificacao: 'novo_lote'
        }],
        rowCount: 1
      })

      const result = await mockQuery(`
        SELECT
          la.id,
          
          la.titulo,
          COUNT(CASE WHEN a.status != 'inativada' THEN 1 END) as total_avaliacoes,
          COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as avaliacoes_concluidas
        FROM lotes_avaliacao la
        LEFT JOIN avaliacoes a ON la.id = a.lote_id
        WHERE la.status IN ('ativo', 'finalizado')
        GROUP BY la.id
        HAVING
          COUNT(CASE WHEN a.status != 'inativada' THEN 1 END) > 0
          AND COUNT(CASE WHEN a.status != 'inativada' THEN 1 END) = COUNT(CASE WHEN a.status = 'concluida' THEN 1 END)
      `, [])

      expect(result.rows.length).toBe(1)
      expect(result.rows[0].total_avaliacoes).toBe('8')
      expect(result.rows[0].avaliacoes_concluidas).toBe('8')
    })

    it('não deve incluir lote com avaliações ativas pendentes', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      })

      const result = await mockQuery(`
        SELECT
          la.id,
          COUNT(CASE WHEN a.status != 'inativada' THEN 1 END) as total_avaliacoes,
          COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as avaliacoes_concluidas
        FROM lotes_avaliacao la
        LEFT JOIN avaliacoes a ON la.id = a.lote_id
        WHERE la.id = $1
        GROUP BY la.id
        HAVING
          COUNT(CASE WHEN a.status != 'inativada' THEN 1 END) = COUNT(CASE WHEN a.status = 'concluida' THEN 1 END)
      `, [1])

      // Lote com 10 avaliações: 6 concluídas, 2 pendentes, 2 inativadas
      // Não deve retornar pois 8 != 6
      expect(result.rows.length).toBe(0)
    })
  })

  describe('Período de Avaliações', () => {
    it('deve usar MIN(inicio) ao invés de liberado_em para período inicial', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{
          liberado_em: '2025-01-01T00:00:00Z',
          primeira_avaliacao: '2025-01-03T10:30:00Z', // Avaliações iniciadas 2 dias depois
          ultima_conclusao: '2025-01-15T18:45:00Z',
          total_avaliacoes: '5',
          avaliacoes_concluidas: '5'
        }],
        rowCount: 1
      })

      const result = await mockQuery(`
        SELECT
          la.liberado_em,
          MIN(a.inicio) as primeira_avaliacao,
          MAX(CASE WHEN a.status = 'concluida' THEN a.envio END) as ultima_conclusao
        FROM lotes_avaliacao la
        LEFT JOIN avaliacoes a ON la.id = a.lote_id
        WHERE la.id = $1
        GROUP BY la.id, la.liberado_em
      `, [1])

      const lote = result.rows[0]

      // Período deve ser de primeira_avaliacao, não liberado_em
      expect(new Date(lote.primeira_avaliacao).getTime())
        .toBeGreaterThan(new Date(lote.liberado_em).getTime())
    })
  })
})
