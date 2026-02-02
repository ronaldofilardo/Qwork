/**
 * Exemplo de como integrar db-security.ts nas APIs
 * Este arquivo demonstra a migração de query() para queryWithContext()
 */

// Imports necessários
import { query } from '@/lib/db'
import { requireAuth, requireRole } from '@/lib/session'
import { queryWithContext, transactionWithContext, hasPermission } from '@/lib/db-security'

export async function GET_BEFORE() {
  const session = await requireAuth()

  // Query sem contexto RLS - RLS não funciona corretamente
  const result = await query(
    'SELECT * FROM avaliacoes WHERE funcionario_cpf = $1',
    [session.cpf]
  )

  return result
}

export async function GET_AFTER() {
  // queryWithContext automaticamente:
  // 1. Obtém a sessão do usuário
  // 2. Define SET LOCAL app.current_user_cpf
  // 3. Define SET LOCAL app.current_user_perfil
  // 4. Define SET LOCAL app.current_user_clinica_id
  // 5. Executa a query com RLS ativo

  const session = await requireAuth()

  const result = await queryWithContext(
    'SELECT * FROM avaliacoes WHERE funcionario_cpf = $1',
    [session.cpf]
  )

  return result
}

// ==================================================
// PADRÃO RECOMENDADO: APIs Críticas
// ==================================================

/**
 * API: /api/avaliacao/status
 * Perfil: funcionario
 * RLS: Funcionário vê apenas suas avaliações
 */
export async function GET_AVALIACAO_STATUS() {
  try {
    const session = await requireAuth()

    // Com queryWithContext, RLS garante isolamento automático
    const avaliacaoResult = await queryWithContext(
      `SELECT id, status, inicio, envio, grupo_atual
       FROM avaliacoes
       WHERE funcionario_cpf = $1
       ORDER BY inicio DESC LIMIT 1`,
      [session.cpf]
    )

    // RLS garante que apenas avaliações do funcionário sejam retornadas
    return avaliacaoResult
  } catch (error) {
    console.error('Erro:', error)
    throw error
  }
}

/**
 * API: /api/rh/empresas
 * Perfil: rh
 * RLS: RH vê apenas empresas de sua clínica
 */
export async function GET_RH_EMPRESAS() {
  try {
    const session = await requireRole('rh')

    // Com queryWithContext + RLS, não precisa mais filtrar por clinica_id manualmente
    // A policy empresas_rh_clinica faz isso automaticamente
    const result = await queryWithContext(`
      SELECT id, nome, cnpj
      FROM empresas_clientes
      WHERE ativa = true
      ORDER BY nome
    `)

    // RLS já filtrou apenas empresas da clínica do RH
    return result
  } catch (error) {
    console.error('Erro:', error)
    throw error
  }
}

/**
 * API: /api/admin/funcionarios
 * Perfil: admin
 * RLS: Admin vê todos os funcionários (policy admin_all permite)
 */
export async function GET_ADMIN_FUNCIONARIOS() {
  try {
    const session = await requireRole('admin')

    // Com perfil admin, RLS permite acesso total
    const result = await queryWithContext(`
      SELECT cpf, nome, perfil, ativo, clinica_id
      FROM funcionarios
      ORDER BY nome
    `)

    return result
  } catch (error) {
    console.error('Erro:', error)
    throw error
  }
}

/**
 * API: /api/emissor/laudos/[loteId]
 * Perfil: emissor
 * RLS: Emissor vê apenas lotes liberados
 */
export async function GET_EMISSOR_LAUDO(params: { loteId: string }) {
  try {
    const session = await requireRole('emissor')
    const loteId = params.loteId

    // RLS garante que emissor só vê lotes finalizados/concluídos
    const loteResult = await queryWithContext(
      `SELECT * FROM lotes_avaliacao WHERE id = $1`,
      [loteId]
    )

    if (loteResult.rows.length === 0) {
      // Se não encontrou, pode ser que o lote não está liberado
      // ou não existe
      throw new Error('Lote não encontrado ou não liberado')
    }

    // Buscar laudo associado
    const laudoResult = await queryWithContext(
      `SELECT * FROM laudos WHERE lote_id = $1`,
      [loteId]
    )

    return { lote: loteResult.rows[0], laudo: laudoResult.rows[0] }
  } catch (error) {
    console.error('Erro:', error)
    throw error
  }
}

// ==================================================
// TRANSAÇÕES COM RLS
// ==================================================

/**
 * Exemplo de transação com contexto RLS
 * Útil para operações que precisam de atomicidade + RLS
 */
export async function POST_CRIAR_LOTE_COM_TRANSACAO() {
  try {
    const session = await requireRole('rh')

    await transactionWithContext(async (query) => {
      // Todas as queries dentro da transação têm contexto RLS

      // 1. Criar lote (RLS permite apenas se clinica_id = clinica do RH)
      const loteResult = await query(
        `INSERT INTO lotes_avaliacao
         (codigo, clinica_id, empresa_id, titulo, liberado_por)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        ['LOTE-001', 1, 1, 'Lote Teste', session.cpf] // Usando clinica_id hardcoded para exemplo
      )

      const loteId = (loteResult.rows[0] as any).id

      // 2. Associar funcionários ao lote
      await query(
        `UPDATE avaliacoes
         SET lote_id = $1
         WHERE funcionario_cpf IN (
           SELECT cpf FROM funcionarios WHERE empresa_id = $2
         )`,
        [loteId, 1]
      )

      // Commit automático ao final da função
      // Rollback automático em caso de erro
    })

    return { success: true }
  } catch (error) {
    console.error('Erro:', error)
    throw error
  }
}

// ==================================================
// VERIFICAÇÃO DE PERMISSÕES RBAC
// ==================================================

/**
 * Exemplo de verificação de permissão antes de executar ação
 */
export async function POST_ACAO_COM_PERMISSAO() {
  try {
    const session = await requireAuth()

    // Verificar se usuário tem permissão específica
    const canManageEmpresas = await hasPermission(session, 'manage:empresas')

    if (!canManageEmpresas) {
      throw new Error('Sem permissão para gerenciar empresas')
    }

    // Executar ação
    const result = await queryWithContext(
      `UPDATE empresas_clientes SET ativa = false WHERE id = $1`,
      [1]
    )

    return result
  } catch (error) {
    console.error('Erro:', error)
    throw error
  }
}

// ==================================================
// LISTA DE APIs A MIGRAR
// ==================================================

/**
 * APIs CRÍTICAS que devem migrar para queryWithContext:
 * 
 * ALTA PRIORIDADE (isolamento de dados):
 * - /api/avaliacao/status (funcionario vê só suas avaliacoes)
 * - /api/avaliacao/resultados (funcionario vê só seus resultados)
 * - /api/avaliacao/respostas (funcionario vê só suas respostas)
 * - /api/rh/empresas (rh vê só empresas de sua clinica)
 * - /api/rh/funcionarios (rh vê só funcionarios de sua clinica)
 * - /api/rh/dashboard (rh vê só dados de sua clinica)
 * - /api/emissor/laudos/[loteId] (emissor vê só lotes liberados)
 * 
 * MÉDIA PRIORIDADE (acesso total, mas com auditoria):
 * - /api/admin/funcionarios (admin vê tudo)
 * - /api/admin/empresas (admin vê tudo)
 * 
 * BAIXA PRIORIDADE (públicas ou sem dados sensíveis):
 * - /api/auth/session (sem queries no banco)
 * - /api/test/usuarios (apenas para testes)
 */
