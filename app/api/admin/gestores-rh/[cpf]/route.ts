import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireRole } from '@/lib/session'
import { logAudit, extractRequestInfo } from '@/lib/audit'

/**
 * PATCH /api/admin/gestores-rh/[cpf]
 * 
 * Ativa ou inativa um gestor RH específico
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { cpf: string } }
) {
  try {
    await requireRole('admin')

    const { ativo } = await request.json()

    if (typeof ativo !== 'boolean') {
      return NextResponse.json(
        { error: 'Status ativo deve ser boolean' },
        { status: 400 }
      )
    }

    // Verificar se o usuário existe e é RH
    const userCheck = await query(
      'SELECT cpf, perfil, clinica_id FROM funcionarios WHERE cpf = $1',
      [params.cpf]
    )

    if (userCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Gestor RH não encontrado' }, { status: 404 })
    }

    if (userCheck.rows[0].perfil !== 'rh') {
      return NextResponse.json(
        { error: 'Usuário não é gestor RH' },
        { status: 400 }
      )
    }

    const estadoAnterior = userCheck.rows[0]

    // Se estiver ativando, verificar se já existe outro RH ativo na mesma clínica
    if (ativo === true) {
      const rhAtivoCheck = await query(
        'SELECT cpf, nome FROM funcionarios WHERE clinica_id = $1 AND perfil = \'rh\' AND ativo = true AND cpf != $2',
        [estadoAnterior.clinica_id, params.cpf]
      )

      if (rhAtivoCheck.rows.length > 0) {
        return NextResponse.json(
          {
            error: 'Já existe outro gestor RH ativo nesta clínica',
            gestor_ativo: rhAtivoCheck.rows[0]
          },
          { status: 409 }
        )
      }
    }

    // Atualizar status
    const result = await query(`
      UPDATE funcionarios
      SET ativo = $1, atualizado_em = CURRENT_TIMESTAMP
      WHERE cpf = $2 AND perfil = 'rh'
      RETURNING cpf, nome, email, ativo, clinica_id, atualizado_em
    `, [ativo, params.cpf])

    // Registrar auditoria
    const { ipAddress, userAgent } = extractRequestInfo(request)
    await logAudit({
      resource: 'funcionarios',
      action: 'UPDATE',
      resourceId: params.cpf,
      oldData: estadoAnterior,
      newData: result.rows[0],
      ipAddress,
      userAgent,
    })

    return NextResponse.json({
      success: true,
      gestor: result.rows[0]
    }, { status: 200 })
  } catch (error) {
    console.error('Erro ao atualizar gestor RH:', error)

    if (error instanceof Error && error.message === 'Sem permissão') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
