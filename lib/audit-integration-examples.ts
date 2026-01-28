/**
 * EXEMPLO DE INTEGRAÇÃO DO AUDIT LOG EM APIS
 * Este arquivo demonstra como integrar o sistema de auditoria nas rotas críticas
 */

import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireRole } from '@/lib/session'
import { logAudit, extractRequestInfo } from '@/lib/audit'

/**
 * EXEMPLO 1: Auditoria em alteração de status de funcionário
 * Rota: PATCH /api/admin/funcionarios/[cpf]/status
 */
export async function patchFuncionarioStatus(request: NextRequest, cpf: string) {
  try {
    await requireRole('admin')
    const { ativo } = await request.json()

    // Buscar estado anterior
    const anteriorResult = await query(
      'SELECT cpf, nome, perfil, ativo FROM funcionarios WHERE cpf = $1',
      [cpf]
    )

    if (anteriorResult.rows.length === 0) {
      return NextResponse.json({ error: 'Funcionário não encontrado' }, { status: 404 })
    }

    const estadoAnterior = anteriorResult.rows[0]

    // Atualizar status
    await query(
      'UPDATE funcionarios SET ativo = $1, atualizado_em = NOW() WHERE cpf = $2',
      [ativo, cpf]
    )

    // Buscar estado novo
    const novoResult = await query(
      'SELECT cpf, nome, perfil, ativo FROM funcionarios WHERE cpf = $1',
      [cpf]
    )

    // Registrar auditoria
    const { ipAddress, userAgent } = extractRequestInfo(request)
    await logAudit({
      resource: 'funcionarios',
      action: 'UPDATE',
      resourceId: cpf,
      oldData: estadoAnterior,
      newData: novoResult.rows[0],
      ipAddress,
      userAgent,
    })

    return NextResponse.json({
      success: true,
      message: `Funcionário ${ativo ? 'ativado' : 'inativado'} com sucesso`,
    })
  } catch (error) {
    console.error('Erro ao atualizar status:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

/**
 * EXEMPLO 2: Auditoria em criação de gestor RH
 * Rota: POST /api/admin/gestores-rh
 */
export async function criarGestorRH(request: NextRequest) {
  try {
    await requireRole('admin')
    const { cpf, nome, email, clinica_id } = await request.json()

    // Criar gestor
    const result = await query(
      `INSERT INTO funcionarios (cpf, nome, email, perfil, clinica_id, ativo, senha_hash)
       VALUES ($1, $2, $3, 'rh', $4, true, $5)
       RETURNING cpf, nome, email, perfil, clinica_id, ativo`,
      [cpf, nome, email, clinica_id, 'hash_temporario']
    )

    // Registrar auditoria
    const { ipAddress, userAgent } = extractRequestInfo(request)
    await logAudit({
      resource: 'funcionarios',
      action: 'INSERT',
      resourceId: cpf,
      newData: result.rows[0],
      ipAddress,
      userAgent,
    })

    return NextResponse.json({
      success: true,
      gestor: result.rows[0],
    })
  } catch (error) {
    console.error('Erro ao criar gestor RH:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

/**
 * EXEMPLO 3: Auditoria em liberação de lote
 * Rota: PATCH /api/rh/lotes/[id]/liberar
 */
export async function liberarLote(request: NextRequest, loteId: number) {
  try {
    await requireRole('rh')

    // Buscar estado anterior
    const anteriorResult = await query(
      'SELECT id, codigo, titulo, liberado, liberado_em, status FROM lotes_avaliacao WHERE id = $1',
      [loteId]
    )

    if (anteriorResult.rows.length === 0) {
      return NextResponse.json({ error: 'Lote não encontrado' }, { status: 404 })
    }

    const estadoAnterior = anteriorResult.rows[0]

    // Liberar lote
    await query(
      `UPDATE lotes_avaliacao 
       SET liberado = true, liberado_em = NOW(), status = 'ativo' 
       WHERE id = $1`,
      [loteId]
    )

    // Buscar estado novo
    const novoResult = await query(
      'SELECT id, codigo, titulo, liberado, liberado_em, status FROM lotes_avaliacao WHERE id = $1',
      [loteId]
    )

    // Registrar auditoria
    const { ipAddress, userAgent } = extractRequestInfo(request)
    await logAudit({
      resource: 'lotes_avaliacao',
      action: 'UPDATE',
      resourceId: loteId,
      oldData: estadoAnterior,
      newData: novoResult.rows[0],
      ipAddress,
      userAgent,
    })

    return NextResponse.json({
      success: true,
      message: 'Lote liberado com sucesso',
    })
  } catch (error) {
    console.error('Erro ao liberar lote:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

/**
 * ROTAS PRIORITÁRIAS PARA AUDITORIA:
 * 
 * 1. Gestão de Usuários:
 *    - POST /api/admin/funcionarios (criação)
 *    - PATCH /api/admin/funcionarios/[cpf] (ativação/inativação)
 *    - POST /api/admin/gestores-rh (criação de RH)
 *    - PATCH /api/admin/emissores/[cpf] (mudança de emissor)
 * 
 * 2. Gestão de Lotes:
 *    - POST /api/rh/lotes (criação)
 *    - PATCH /api/rh/lotes/[id] (liberação)
 *    - DELETE /api/rh/lotes/[id] (exclusão)
 * 
 * 3. Laudos:
 *    - POST /api/emissor/laudos (emissão)
 *    - PATCH /api/emissor/laudos/[id] (reenvio)
 * 
 * 4. Empresas e Clínicas:
 *    - POST /api/admin/clinicas (criação)
 *    - PATCH /api/admin/clinicas/[id] (ativação/inativação)
 *    - POST /api/rh/empresas (criação)
 *    - PATCH /api/rh/empresas/[id] (ativação/inativação)
 */
